import 'server-only';

/**
 * Bzzoiro Sports Data (BSD) server-side client.
 *
 * The API token is secret and must never reach the browser, so every BSD call
 * happens here (server components / route handlers only) behind an in-memory
 * TTL cache. The free plan is uncapped, but caching keeps us polite and fast:
 * live data is cheap-cached (short TTL), resolved event ids are cached longer.
 */

const BASE = 'https://sports.bzzoiro.com/api';
const TOKEN = process.env.BSD_API_TOKEN;

export function bsdConfigured(): boolean {
    return !!TOKEN;
}

// ---- tiny in-memory TTL cache (per server instance) ----

interface CacheEntry {
    value: unknown;
    expires: number;
}
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expires > now) return hit.value as T;
    const value = await fetcher();
    cache.set(key, { value, expires: now + ttlMs });
    // opportunistic cleanup so the map can't grow unbounded
    if (cache.size > 500) {
        for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
    }
    return value;
}

async function get<T>(path: string): Promise<T> {
    if (!TOKEN) throw new Error('BSD_API_TOKEN not configured');
    const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Token ${TOKEN}`, Accept: 'application/json' },
        // We do our own TTL caching; bypass Next's fetch cache to stay live.
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`BSD ${path} -> ${res.status}`);
    return res.json() as Promise<T>;
}

// ---- name matching helpers ----

function norm(s: string): string {
    return (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function sameDay(aIso: string, bMs: number): boolean {
    const a = new Date(aIso).getTime();
    if (Number.isNaN(a)) return false;
    return Math.abs(a - bMs) <= 36 * 60 * 60 * 1000; // ±36h tolerance for tz/kickoff drift
}

// ---- raw response shapes (only the fields we use) ----

interface RawEventList {
    results?: RawEvent[];
}
export interface RawEvent {
    id: number;
    home_team: string;
    away_team: string;
    event_date?: string;
    [key: string]: unknown;
}
export interface RawLive {
    id: number;
    incidents?: unknown[];
    [key: string]: unknown;
}

/**
 * Resolve a BSD event id from a streaming match's team names + kickoff.
 * Streaming providers and BSD share the same fixture set, so name+date
 * matching is reliable. Returns null when no confident match exists.
 */
export async function findEventId(home: string, away: string, dateMs: number): Promise<number | null> {
    const key = `resolve:${norm(home)}|${norm(away)}|${Math.round(dateMs / 3.6e6)}`;
    return cached(key, 30 * 60_000, async () => {
        const nh = norm(home);
        const na = norm(away);
        for (const team of [home, away]) {
            let list: RawEventList;
            try {
                list = await get<RawEventList>(`/events/?team=${encodeURIComponent(team)}`);
            } catch {
                continue;
            }
            const results = list.results ?? [];
            const match = results.find((e) => {
                const eh = norm(e.home_team);
                const ea = norm(e.away_team);
                const teamsMatch = (eh === nh && ea === na) || (eh === na && ea === nh);
                return teamsMatch && (!e.event_date || sameDay(e.event_date, dateMs));
            })
                // fall back to teams-only match if date is off (kickoff data can drift)
                ?? results.find((e) => {
                    const eh = norm(e.home_team);
                    const ea = norm(e.away_team);
                    return (eh === nh && ea === na) || (eh === na && ea === nh);
                });
            if (match) return match.id;
        }
        return null;
    });
}

export async function getEvent(id: number): Promise<RawEvent> {
    return cached(`event:${id}`, 25_000, () => get<RawEvent>(`/events/${id}/`));
}

/** Live incident timeline for a match, or [] when the match isn't currently live. */
export async function getIncidents(id: number): Promise<unknown[]> {
    return cached(`incidents:${id}`, 15_000, async () => {
        try {
            const live = await get<{ results?: RawLive[] } | RawLive[]>(`/live/`);
            const arr = Array.isArray(live) ? live : (live.results ?? []);
            const found = arr.find((m) => m.id === id);
            return found?.incidents ?? [];
        } catch {
            return [];
        }
    });
}
