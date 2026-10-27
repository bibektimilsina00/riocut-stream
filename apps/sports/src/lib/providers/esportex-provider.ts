import axios, { AxiosInstance } from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider, TokenBucket } from './base';

/**
 * esportex.site provider. One endpoint (`/api/streams`) returns every sport with
 * its matches inline. We cache the payload for a short window since polling
 * more than every 30s is discouraged upstream.
 */

const BASE_URL = 'https://api.esportex.site';
const CACHE_MS = 30_000;

type RawIframe = { server: string; url: string };
type RawMatch = {
    slug: string;
    tag: string;
    kickoff: string; // "YYYY-MM-DD HH:mm" in WIB (UTC+7)
    endTime?: string;
    league?: string;
    poster?: string | null;
    iframes?: RawIframe[];
};
type RawPayload = { success: boolean; timestamp: number } & Record<string, RawMatch[] | unknown>;

// esportex sport keys → normalized category names used by the app.
// Anything not in this map is passed through as-is.
const SPORT_KEYS: Record<string, string> = {
    football: 'football',
    basketball: 'basketball',
    amfootball: 'american-football',
    baseball: 'baseball',
    badminton: 'badminton',
    volleyball: 'volleyball',
    tennis: 'tennis',
    race: 'motor-sports',
    fight: 'fight',
    hockey: 'hockey',
    rugby: 'rugby',
    cricket: 'cricket',
    other: 'other',
};

function parseWibKickoff(kickoff: string): number {
    // "YYYY-MM-DD HH:mm" → treat as WIB (UTC+7)
    const iso = kickoff.replace(' ', 'T') + '+07:00';
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
}

function teamsFromTag(tag: string): { home: { name: string; badge: null }; away: { name: string; badge: null } } {
    // "Team A vs Team B" is the common shape; fall back to a single-team home if no separator.
    const parts = tag.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) {
        return { home: { name: parts[0].trim(), badge: null }, away: { name: parts.slice(1).join(' vs ').trim(), badge: null } };
    }
    return { home: { name: tag.trim(), badge: null }, away: { name: '', badge: null } };
}

export class EsportexProvider implements SportsProvider {
    readonly name: string;
    private base: string;
    private http: AxiosInstance;
    private bucket = new TokenBucket(4, 2);
    private cache: { at: number; payload: RawPayload } | null = null;

    constructor(baseURL: string = BASE_URL, name: string = 'esportex') {
        this.base = baseURL.replace(/\/$/, '');
        this.name = name;
        this.http = axios.create({ baseURL: this.base, timeout: 15_000, headers: { Accept: 'application/json' } });
    }

    private async payload(): Promise<RawPayload> {
        const now = Date.now();
        if (this.cache && now - this.cache.at < CACHE_MS) return this.cache.payload;
        await this.bucket.take();
        const res = await this.http.get<RawPayload>('/api/streams', { params: { cache: now } });
        this.cache = { at: now, payload: res.data };
        return res.data;
    }

    async getSports(): Promise<SportCategory[]> {
        const p = await this.payload();
        const out: SportCategory[] = [];
        for (const [rawKey, cat] of Object.entries(SPORT_KEYS)) {
            const arr = p[rawKey];
            if (Array.isArray(arr) && arr.length > 0) {
                out.push({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '), category: cat });
            }
        }
        return out;
    }

    async getMatches(category: string): Promise<Match[]> {
        const p = await this.payload();
        // Collect matching sport buckets. For "live"/"all", return everything.
        const wantAll = category === 'live' || category === 'all';
        const keys = wantAll
            ? Object.keys(SPORT_KEYS)
            : Object.entries(SPORT_KEYS)
                  .filter(([, v]) => v.toLowerCase() === category.toLowerCase())
                  .map(([k]) => k);

        const out: Match[] = [];
        for (const key of keys) {
            const arr = p[key];
            if (!Array.isArray(arr)) continue;
            const normalizedCategory = SPORT_KEYS[key] ?? key;
            for (const m of arr as RawMatch[]) {
                if (!m?.slug || !m?.tag) continue;
                out.push({
                    id: m.slug,
                    title: m.tag,
                    category: normalizedCategory,
                    date: parseWibKickoff(m.kickoff),
                    popular: false,
                    poster: m.poster ?? null,
                    teams: teamsFromTag(m.tag),
                    provider: this.name,
                });
            }
        }
        return out;
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        const p = await this.payload();
        for (const key of Object.keys(SPORT_KEYS)) {
            const arr = p[key];
            if (!Array.isArray(arr)) continue;
            const hit = (arr as RawMatch[]).find((m) => m?.slug === id);
            if (!hit) continue;
            const normalizedCategory = SPORT_KEYS[key] ?? key;
            const sources: MatchSource[] = (hit.iframes ?? []).map((f, i) => ({
                id: `${hit.slug}-${i}`,
                streamNo: i + 1,
                language: 'Multi',
                hd: /hd|4k/i.test(f.server),
                embedUrl: f.url,
                source: f.server,
                provider: this.name,
            }));
            return {
                id: hit.slug,
                title: hit.tag,
                category: normalizedCategory,
                date: parseWibKickoff(hit.kickoff),
                popular: false,
                poster: hit.poster ?? null,
                teams: teamsFromTag(hit.tag),
                provider: this.name,
                sources,
            };
        }
        return null;
    }
}
