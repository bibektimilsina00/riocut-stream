import axios, { AxiosInstance } from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider, TokenBucket } from './base';

/**
 * Yono TV (yonotv.net) provider — cricket only, and the one upstream that
 * carries Nepal Premier League. Everything is static JSON on Cloudflare Pages
 * (CORS *):
 *   /api2.json   schedule → matches
 *   /<id>.json   match → telecast_links, each pointing at a wrapper page whose
 *                `LINK?id=<KEY>` lookup table holds the real player URL.
 *
 * We keep only plain HLS (played by our own hls.js player) and plain iframe
 * embeds. DRM players carrying leaked ClearKey keys (`wtvplyrrr`), unknown
 * wrappers and feeds marked PAID are dropped on purpose.
 */

const BASE_URL = 'https://yonotv-data.pages.dev';
const CACHE_MS = 60_000;

type RawScheduleItem = {
    league?: string;
    match_link?: string;
    home_team?: string;
    away_team?: string;
    home_flag?: string;
    away_flag?: string;
    start_time?: string;
    end_time?: string;
};
type RawMatchData = { telecast_links?: Array<{ name?: string; url?: string }> };

// Yono has no sport field and also lists football (EFL Cup, MLS…), which
// esportex already covers. ponytail: league-name allowlist; misses a cricket
// league named without any of these words.
const CRICKET = /t20|odi|test|series|trophy|cricket|\b(npl|ipl|bbl|psl|cpl|bpl|wpl|lpl|ilt20|sa20|hundred)\b/i;

/** "…/match-data.html?id=npl" → "npl" */
function idOf(item: RawScheduleItem): string | null {
    try {
        return new URL(item.match_link ?? '').searchParams.get('id');
    } catch {
        return null;
    }
}

/** Yono prefixes league names with a trophy emoji. */
function leagueOf(item: RawScheduleItem): string | undefined {
    return item.league?.replace(/^[^\p{L}\p{N}]+/u, '').trim() || undefined;
}

/** A real cricket fixture: cricket league, two different sides (skips auctions). */
function isMatch(item: RawScheduleItem): boolean {
    return CRICKET.test(item.league ?? '') && !!item.home_team && item.home_team !== item.away_team;
}

/** Parse the `KEY:"url"` lookup table out of a LINK page. */
export function parseChannelTable(html: string): Map<string, string> {
    const table = new Map<string, string>();
    for (const m of html.matchAll(/^\s*([A-Za-z0-9_]+)\s*:\s*"([^"]+)"/gm)) {
        if (!table.has(m[1])) table.set(m[1], m[2]); // first wins, as in the page's JS
    }
    return table;
}

/** Player URL → something we can play ourselves, or null to drop it. */
export function playableFrom(playerUrl: string): { url: string; kind: 'hls' | 'iframe' } | null {
    let u: URL;
    try {
        u = new URL(playerUrl);
    } catch {
        return null;
    }
    const src = u.searchParams.get('src');
    if (!src || /paid/i.test(src)) return null;
    if (/\/(hls)?plyrr$/.test(u.pathname) && /\.m3u8(\?|$)/.test(src)) return { url: src, kind: 'hls' };
    if (/\/iplyrr$/.test(u.pathname) && /^https:\/\//.test(src)) return { url: src, kind: 'iframe' };
    return null; // wtvplyrrr (DRM keys), bare wrappers, "starts soon" pages
}

export class YonoProvider implements SportsProvider {
    readonly name: string;
    private http: AxiosInstance;
    private bucket = new TokenBucket(4, 2);
    private cache = new Map<string, { at: number; data: unknown }>();

    constructor(baseURL: string = BASE_URL, name: string = 'yono') {
        this.name = name;
        this.http = axios.create({ baseURL: baseURL.replace(/\/$/, ''), timeout: 15_000 });
    }

    private async get<T>(url: string, responseType: 'json' | 'text' = 'json'): Promise<T> {
        const hit = this.cache.get(url);
        if (hit && Date.now() - hit.at < CACHE_MS) return hit.data as T;
        await this.bucket.take();
        const res = await this.http.get<T>(url, { responseType });
        this.cache.set(url, { at: Date.now(), data: res.data });
        return res.data;
    }

    private async schedule(): Promise<RawScheduleItem[]> {
        const d = await this.get<RawScheduleItem[]>('/api2.json');
        return Array.isArray(d) ? d : [];
    }

    private toMatch(item: RawScheduleItem, id: string): Match {
        const home = item.home_team?.trim() ?? '';
        const away = item.away_team?.trim() ?? '';
        const date = Date.parse(item.start_time ?? '') || 0;
        const end = Date.parse(item.end_time ?? '') || 0;
        return {
            id,
            title: away ? `${home} vs ${away}` : home,
            category: 'cricket',
            date,
            popular: false,
            poster: null,
            teams: {
                home: { name: home, badge: item.home_flag ?? null },
                away: { name: away, badge: item.away_flag ?? null },
            },
            provider: this.name,
            league: leagueOf(item),
            // Yono sometimes sets end == start (Tests); let the default duration apply.
            endDate: end > date ? end : undefined,
        };
    }

    async getSports(): Promise<SportCategory[]> {
        const s = await this.schedule();
        return s.length ? [{ id: 'cricket', name: 'Cricket', category: 'cricket' }] : [];
    }

    async getMatches(category: string): Promise<Match[]> {
        if (!['cricket', 'live', 'all'].includes(category.toLowerCase())) return [];
        const out: Match[] = [];
        for (const item of await this.schedule()) {
            const id = idOf(item);
            if (id && isMatch(item)) out.push(this.toMatch(item, id));
        }
        return out;
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        if (category.toLowerCase() !== 'cricket' || !/^[a-z0-9_-]+$/i.test(id)) return null;
        const item = (await this.schedule()).find((i) => idOf(i) === id && isMatch(i));
        if (!item) return null;

        const data = await this.get<RawMatchData>(`/${id}.json`).catch((): RawMatchData => ({}));
        const sources: MatchSource[] = [];
        const seen = new Set<string>();
        const tables = new Map<string, Map<string, string>>();
        for (const link of data.telecast_links ?? []) {
            // telecast url: page.html?src=<LINK page>?id=<KEY>; anything else is an ad hop.
            let linkPage: URL;
            try {
                linkPage = new URL(new URL(link.url ?? '').searchParams.get('src') ?? '');
            } catch {
                continue;
            }
            const key = linkPage.searchParams.get('id');
            if (!key) continue;
            const tableUrl = linkPage.origin + linkPage.pathname;
            if (!tables.has(tableUrl)) {
                const html = await this.get<string>(tableUrl, 'text').catch(() => '');
                tables.set(tableUrl, parseChannelTable(html));
            }
            const player = tables.get(tableUrl)!.get(key);
            const playable = player ? playableFrom(player) : null;
            if (!playable || seen.has(playable.url)) continue;
            seen.add(playable.url);
            sources.push({
                id: `${id}-${key}`,
                streamNo: sources.length + 1,
                language: 'English',
                hd: false,
                embedUrl: playable.url,
                source: `Yono ${key}`,
                provider: this.name,
            });
        }
        return { ...this.toMatch(item, id), sources };
    }
}
