import { resolveEmbedUrl, type Match, type MatchDetail, type SportCategory, type MatchSource } from '../sportsrc';
import { SportsProvider } from './base';
import { SportsrcProvider } from './sportsrc-provider';
import { StreamedProvider } from './streamed-provider';
import { EsportexProvider } from './esportex-provider';
import { YonoProvider } from './yono-provider';
import { CricketChannelsProvider } from './cricket-channels-provider';
import { sportRank } from '../sports';

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

// One slow upstream used to hold every list and match page for this long.
const CALL_TIMEOUT_MS = 6_000;
/** Budget for pulling extra sources from other providers once a match resolved. */
const ENRICH_TIMEOUT_MS = 3_000;

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
            case 'yono':
                return new YonoProvider(row.baseUrl ?? undefined, row.name);
            case 'channels':
                return new CricketChannelsProvider(row.name);
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
    // streamed.* shut down (2026-10); kept so admin can re-enable a revived mirror.
    { id: 'd_streamed_pk', kind: 'streamed', name: 'streamed.pk', baseUrl: 'https://streamed.pk', apiKey: null, isEnabled: false, sortOrder: 1 },
    { id: 'd_streamed_st', kind: 'streamed', name: 'streamed.st', baseUrl: 'https://streamed.st', apiKey: null, isEnabled: false, sortOrder: 2 },
    { id: 'd_esportex', kind: 'esportex', name: 'esportex', baseUrl: 'https://api.esportex.site', apiKey: null, isEnabled: true, sortOrder: 3 },
    { id: 'd_yono', kind: 'yono', name: 'yono', baseUrl: 'https://yonotv-data.pages.dev', apiKey: null, isEnabled: true, sortOrder: 4 },
    { id: 'd_channels', kind: 'channels', name: 'channels', baseUrl: null, apiKey: null, isEnabled: true, sortOrder: 5 },
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

/** First non-null result, without waiting for the rest; null once all are null. */
function firstHit<T>(promises: Array<Promise<T | null>>): Promise<T | null> {
    return new Promise((resolve) => {
        let pending = promises.length;
        if (!pending) resolve(null);
        for (const p of promises) {
            p.then((v) => {
                if (v) resolve(v);
                else if (--pending === 0) resolve(null);
            });
        }
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

const FUZZY_WINDOW_MS = 3 * 60 * 60 * 1000;
const compactName = (s: string) => normTitle(s).replace(/\s/g, '');
const nameWords = (s: string) => normTitle(s).split(' ').filter((w) => w.length >= 4);

/** One team name refers to the other: "Sudurpaschim" ~ "Sudur Paschim Royals", "Pokhara" ~ "Pokhara Avengers". */
function sameTeam(a: string, b: string): boolean {
    if (!a || !b) return false;
    const ca = compactName(a), cb = compactName(b);
    return nameWords(a).some((w) => cb.includes(w)) || nameWords(b).some((w) => ca.includes(w)) ||
        (ca.length >= 5 && cb.includes(ca)) || (cb.length >= 5 && ca.includes(cb));
}

/**
 * Same fixture listed by two providers under different names. Exact title +
 * hour (dedupeKey) misses those, which showed the match twice and kept each
 * copy's sources apart.
 */
function sameFixture(a: Match, b: Match): boolean {
    if (a.category !== b.category || !a.date || !b.date || Math.abs(a.date - b.date) > FUZZY_WINDOW_MS) return false;
    const [ah, aa, bh, ba] = [a.teams?.home?.name, a.teams?.away?.name, b.teams?.home?.name, b.teams?.away?.name].map((n) => n ?? '');
    if (!aa || !ba) return false;
    return (sameTeam(ah, bh) && sameTeam(aa, ba)) || (sameTeam(ah, ba) && sameTeam(aa, bh));
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
        const rank = (s: SportCategory) => sportRank((s.category ?? s.id ?? '').toLowerCase());
        return Array.from(seen.values()).sort((a, b) => rank(a) - rank(b));
    },

    async getMatches(category: string): Promise<Match[]> {
        const results = await fanout((p) => p.getMatches(category));
        const seen = new Map<string, Match>();
        for (const { result } of results) {
            if (!Array.isArray(result)) continue;
            for (const m of result) {
                const key = [...seen.keys()].find((k) => k === dedupeKey(m) || sameFixture(seen.get(k)!, m));
                if (!key) {
                    seen.set(dedupeKey(m), m);
                } else {
                    // Keep the first copy (its id resolves on the match page); borrow a poster/badges it lacks.
                    const existing = seen.get(key)!;
                    seen.set(key, {
                        ...existing,
                        poster: existing.poster ?? m.poster,
                        teams: {
                            home: { ...existing.teams.home, badge: existing.teams.home.badge ?? m.teams?.home?.badge ?? null },
                            away: { ...existing.teams.away, badge: existing.teams.away.badge ?? m.teams?.away?.badge ?? null },
                        },
                    });
                }
            }
        }
        return Array.from(seen.values());
    },

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        // Ask every provider at once and anchor on the first that knows this
        // id. Asking them one by one made each dead/slow upstream add its full
        // timeout before the player could even start.
        const providers = healthyFirst(await getProviders());
        const hit = await firstHit(providers.map(async (p) => {
            try {
                const d = await withTimeout(p.getMatchDetail(category, id), CALL_TIMEOUT_MS);
                markOk(p.name);
                return d ? { d, p } : null;
            } catch {
                markFailed(p.name);
                return null;
            }
        }));
        if (!hit) return null;
        const anchor = hit.d;
        const anchorProvider = hit.p;

        // Enrich: fetch matching list from every OTHER provider, find the same
        // fixture by title+hour, fetch its detail, merge sources.
        const anchorKey = dedupeKey(anchor);
        const others = providers.filter((p) => p.name !== anchorProvider!.name);
        const enrichedSources: MatchSource[] = [...anchor.sources];
        // Extra sources are nice-to-have: give them a short shared budget so a
        // slow provider can't hold the page.
        await Promise.allSettled(others.map((p) => withTimeout((async () => {
            const list = await p.getMatches(category);
            const twin = Array.isArray(list) ? list.find((m) => dedupeKey(m) === anchorKey || sameFixture(m, anchor)) : null;
            if (!twin) return;
            const d = await p.getMatchDetail(twin.category, twin.id);
            if (d?.sources?.length) enrichedSources.push(...d.sources);
        })(), ENRICH_TIMEOUT_MS)));

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
