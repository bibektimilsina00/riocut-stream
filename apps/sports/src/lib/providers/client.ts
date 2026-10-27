import { resolveEmbedUrl, type Match, type MatchDetail, type SportCategory, type MatchSource } from '../sportsrc';
import { SportsProvider } from './base';
import { SportsrcProvider } from './sportsrc-provider';
import { StreamedProvider } from './streamed-provider';
import { EsportexProvider } from './esportex-provider';

/**
 * Multi-provider client with cross-provider list merge.
 *
 * Providers are loaded from `SportsProviderConfig` rows (enabled, ordered by
 * sortOrder). For lists we call *every* provider and merge their matches,
 * dedupeing by normalized title + kickoff hour so mirrors don't show duplicates
 * but keeping the union of providers that cover each match. For detail we fan
 * out to every provider that had the match and merge their playable sources
 * into one list — the player then lets the viewer switch between them.
 *
 * Providers are held in a short in-memory cache; toggling a provider in the
 * admin panel reflects after the cache TTL (or a `refreshProviders()` call).
 */

const CONFIG_TTL_MS = 60_000;

/** Display order for sport categories. Unlisted sports go last. */
export const SPORT_PRIORITY = [
    'football', 'cricket', 'basketball', 'american-football', 'fight', 'motor-sports',
    'tennis', 'hockey', 'baseball', 'rugby', 'volleyball', 'badminton', 'other',
];
const CALL_TIMEOUT_MS = 12_000;

interface ProviderConfigRow {
    id: string;
    kind: string;
    name: string;
    baseUrl: string | null;
    apiKey: string | null;
    isEnabled: boolean;
    sortOrder: number;
}

let providerCache: { at: number; providers: SportsProvider[] } | null = null;
const failUntil = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function markFailed(name: string) {
    failUntil.set(name, Date.now() + COOLDOWN_MS);
    if (typeof console !== 'undefined') console.warn(`[sports] provider "${name}" failed, cooling down ${COOLDOWN_MS / 1000}s`);
}
function markOk(name: string) {
    if (failUntil.has(name)) failUntil.delete(name);
}

function build(row: ProviderConfigRow): SportsProvider | null {
    try {
        switch (row.kind) {
            case 'sportsrc':
                return new SportsrcProvider(row.baseUrl ?? undefined);
            case 'streamed':
                if (!row.baseUrl) return null;
                return new StreamedProvider(row.baseUrl, row.name);
            case 'esportex':
                return new EsportexProvider(row.baseUrl ?? undefined, row.name);
            default:
                console.warn(`[sports] unknown provider kind "${row.kind}"`);
                return null;
        }
    } catch (e) {
        console.warn(`[sports] failed to construct provider "${row.name}":`, e);
        return null;
    }
}

async function loadConfigs(): Promise<ProviderConfigRow[]> {
    // Only load DB configs server-side. In the browser we return an empty list
    // and let callers see [] — every consumer hits the API via useSports, which
    // runs on the server anyway.
    if (typeof window !== 'undefined') return [];
    try {
        const { prisma } = await import('@riocut/db');
        return await prisma.sportsProviderConfig.findMany({
            where: { isEnabled: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, kind: true, name: true, baseUrl: true, apiKey: true, isEnabled: true, sortOrder: true },
        });
    } catch (e) {
        console.warn('[sports] failed to load provider configs, falling back to defaults:', e);
        return [];
    }
}

const DEFAULT_ROWS: ProviderConfigRow[] = [
    { id: 'd_sportsrc', kind: 'sportsrc', name: 'sportsrc', baseUrl: 'https://api.sportsrc.org', apiKey: null, isEnabled: true, sortOrder: 0 },
    { id: 'd_streamed_pk', kind: 'streamed', name: 'streamed.pk', baseUrl: 'https://streamed.pk', apiKey: null, isEnabled: true, sortOrder: 1 },
    { id: 'd_streamed_st', kind: 'streamed', name: 'streamed.st', baseUrl: 'https://streamed.st', apiKey: null, isEnabled: true, sortOrder: 2 },
    { id: 'd_esportex', kind: 'esportex', name: 'esportex', baseUrl: 'https://api.esportex.site', apiKey: null, isEnabled: true, sortOrder: 3 },
];

async function getProviders(): Promise<SportsProvider[]> {
    const now = Date.now();
    if (providerCache && now - providerCache.at < CONFIG_TTL_MS) return providerCache.providers;
    const rows = await loadConfigs();
    const source = rows.length ? rows : DEFAULT_ROWS; // fallback if DB unreachable
    const providers = source
        .filter((r) => r.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(build)
        .filter((p): p is SportsProvider => !!p);
    providerCache = { at: now, providers };
    return providers;
}

/** Called from admin routes after mutating configs. */
export function refreshProviders() {
    providerCache = null;
}

function healthyFirst(all: SportsProvider[]): SportsProvider[] {
    const now = Date.now();
    const healthy = all.filter((p) => (failUntil.get(p.name) ?? 0) <= now);
    return healthy.length ? healthy : all;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
        p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
}

// ---------- Dedupe helpers ----------

function normTitle(s: string): string {
    return s
        .toLowerCase()
        .replace(/\bvs\.?\b/g, 'vs')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hourBucket(date: number): number {
    if (!date) return 0;
    // Group by the hour a match kicks off in.
    return Math.floor(date / (60 * 60 * 1000));
}

function dedupeKey(m: Match): string {
    return `${normTitle(m.title)}|${hourBucket(m.date)}`;
}

async function fanout<T>(fn: (p: SportsProvider) => Promise<T>): Promise<Array<{ provider: SportsProvider; result: T }>> {
    const providers = healthyFirst(await getProviders());
    const settled = await Promise.allSettled(providers.map((p) => withTimeout(fn(p), CALL_TIMEOUT_MS).then((r) => ({ p, r }))));
    const out: Array<{ provider: SportsProvider; result: T }> = [];
    settled.forEach((s, i) => {
        const provider = providers[i];
        if (s.status === 'fulfilled') {
            markOk(provider.name);
            out.push({ provider, result: s.value.r });
        } else {
            markFailed(provider.name);
        }
    });
    return out;
}

// ---------- Public API ----------

export const sportsrc = {
    async getSports(): Promise<SportCategory[]> {
        const results = await fanout((p) => p.getSports());
        const seen = new Map<string, SportCategory>();
        for (const { result } of results) {
            if (!Array.isArray(result)) continue;
            for (const s of result) {
                const key = (s.category ?? s.id ?? s.name).toLowerCase();
                if (!seen.has(key)) seen.set(key, s);
            }
        }
        // Providers emit sports in their own arbitrary order (esportex puts
        // cricket 12th), which pushed cricket off the homepage and schedule.
        const rank = (s: SportCategory) => {
            const i = SPORT_PRIORITY.indexOf((s.category ?? s.id ?? '').toLowerCase());
            return i === -1 ? SPORT_PRIORITY.length : i;
        };
        return Array.from(seen.values()).sort((a, b) => rank(a) - rank(b));
    },

    async getMatches(category: string): Promise<Match[]> {
        const results = await fanout((p) => p.getMatches(category));
        const seen = new Map<string, Match>();
        for (const { result } of results) {
            if (!Array.isArray(result)) continue;
            for (const m of result) {
                const key = dedupeKey(m);
                if (!seen.has(key)) {
                    seen.set(key, m);
                } else {
                    // Prefer the match with a poster; otherwise keep the first one seen.
                    const existing = seen.get(key)!;
                    if (!existing.poster && m.poster) seen.set(key, { ...m, provider: existing.provider });
                }
            }
        }
        return Array.from(seen.values());
    },

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        // Ask the provider whose match id we hold. If nothing resolves, or we
        // just want to enrich, fan out to every provider and merge their
        // sources by normalized title + hour.
        const providers = await getProviders();
        const primary = providers.find((p) => id.startsWith(`${p.name}:`)) // future-proof if ids carry a prefix
            ?? null;

        // Try providers sequentially — first hit gives us the "anchor" match.
        let anchor: MatchDetail | null = null;
        let anchorProvider: SportsProvider | null = null;
        for (const p of healthyFirst(providers)) {
            try {
                const d = await withTimeout(p.getMatchDetail(category, id), CALL_TIMEOUT_MS);
                if (d) { anchor = d; anchorProvider = p; markOk(p.name); break; }
            } catch {
                markFailed(p.name);
            }
        }
        if (!anchor || !anchorProvider) return null;

        // Enrich: fetch matching list from every OTHER provider, find the same
        // fixture by title+hour, fetch its detail, merge sources.
        const anchorKey = dedupeKey(anchor);
        const others = providers.filter((p) => p.name !== anchorProvider!.name);
        const enrichedSources: MatchSource[] = [...anchor.sources];
        await Promise.allSettled(others.map(async (p) => {
            try {
                const list = await withTimeout(p.getMatches(category), CALL_TIMEOUT_MS);
                const twin = Array.isArray(list) ? list.find((m) => dedupeKey(m) === anchorKey) : null;
                if (!twin) return;
                const d = await withTimeout(p.getMatchDetail(twin.category, twin.id), CALL_TIMEOUT_MS);
                if (d?.sources?.length) enrichedSources.push(...d.sources);
                markOk(p.name);
            } catch {
                markFailed(p.name);
            }
        }));

        // Mirrors (sportsrc / streamed.*) serve the same underlying embeds, so
        // dedupe by the URL the player will actually load. streamNo is kept
        // as-is: it's part of the embed URL and of the stable source key.
        const seenUrls = new Set<string>();
        return {
            ...anchor,
            sources: enrichedSources.filter((s) => {
                const url = resolveEmbedUrl(s);
                if (seenUrls.has(url)) return false;
                seenUrls.add(url);
                return true;
            }),
        };
    },

};

/** Ordered provider names, for diagnostics/UI. Resolves DB-loaded configs. */
export async function getProviderNames(): Promise<string[]> {
    const providers = await getProviders();
    return providers.map((p) => p.name);
}

/** Sync snapshot of last-known provider names. Empty on cold start. */
export const providerNames: string[] = [];
// Keep the sync export best-effort in sync with the last resolve.
void getProviderNames().then((names) => {
    providerNames.length = 0;
    providerNames.push(...names);
}).catch(() => { /* ignore — sync snapshot is best-effort */ });
