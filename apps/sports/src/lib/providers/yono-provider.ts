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

/**
 * Our match id. Yono reuses one feed id for a whole league (every NPL game is
 * `id=npl`), so add the kickoff to keep each fixture's URL distinct.
 */
function matchIdOf(item: RawScheduleItem): string | null {
    const id = idOf(item);
    return id ? `${id}-${Date.parse(item.start_time ?? '') || 0}` : null;
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

/** Known direct clean player mappings for Yono stream IDs */
export const DIRECT_CLEAN_PLAYERS: Record<string, string> = {
    NPL: 'https://yonotv.pages.dev/fc',
    NPL11: 'https://yonotv.pages.dev/fc',
    FC: 'https://yonotv.pages.dev/wtvplyrrr?manifest=https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/b3b3fkmrbl/out/v1/1084d5c9a97a4c5b9f9554c88f486646/cenc.mpd&keyid=82dfca238e8c4b430a3269db71965db9&key=a00b28caf4ac628e77a553d440c0ddca',
    FC2: 'https://yonotv.pages.dev/wtvplyrrr?manifest=https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/avqlywnuzx/out/v1/aefca6420f944a9482e117f315de535f/cenc.mpd&keyid=1994b1df7dfd2e8a8d7b9bf3fb900285&key=22a1444b3da18e139191665b3d652835',
    FC3: 'https://yonotv.pages.dev/wtvplyrrr?manifest=https://abfjk4haaaaaaaamkitc5445rybm6.bia-cf.live.pv-cdn.net/iad-nitro/live/clients/dash-sd/enc/iwpchve3wl/out/v1/946019f85dc64ae99ff9ce64a9727a62/cenc-sd.mpd&keyid=286eb7dc538143790fa9913639531920&key=e3f5cb08d14d9e9c08438c673819540f',
};

const pageCache = new Map<string, { at: number; out: string }>();

/**
 * Yono's bare player pages (`/fc` today; `/fc2`, `/npl`… whenever they move it)
 * hard-code their stream in `STREAM_URL` (+ `RAW_KEYS` for DRM). Rewrite them
 * into something we play ourselves, video only:
 *  - DASH → `wtvplyrrr?manifest=…&keyid=…&key=…` (DashVideo)
 *  - HLS  → the bare .m3u8 (HlsVideo)
 * Anything else, or a page we can't parse, comes back unchanged.
 *
 * ponytail: takes only the first ClearKey pair; no Yono page uses more yet.
 */
export async function unwrapPlayerPage(url: string): Promise<string> {
    // One path segment, no query: a bare page. LINK / page / pagenpl are channel lists or site chrome.
    const m = url.match(/^https:\/\/yonotv\.pages\.dev\/([A-Za-z0-9_-]+)$/);
    if (!m || /^(link|page|pagenpl)$/i.test(m[1])) return url;
    const hit = pageCache.get(url);
    if (hit && Date.now() - hit.at < 60_000) return hit.out;

    const html = await axios.get<string>(url, { timeout: 3_500, responseType: 'text' }).then((r) => r.data).catch(() => '');
    const manifest = html.match(/STREAM_URL\s*=\s*['"`](https:\/\/[^'"`]+)['"`]/)?.[1];
    const [keyid, key] = html.match(/RAW_KEYS\s*=\s*['"`]([0-9a-f]+:[0-9a-f]+)/i)?.[1].split(':') ?? [];
    let out = url;
    if (manifest && /\.m3u8(\?|$)/.test(manifest)) {
        out = manifest;
    } else if (manifest) {
        const u = new URL('https://yonotv.pages.dev/wtvplyrrr');
        u.searchParams.set('manifest', manifest);
        if (keyid && key) { u.searchParams.set('keyid', keyid); u.searchParams.set('key', key); }
        out = u.toString();
    }
    pageCache.set(url, { at: Date.now(), out });
    return out;
}

/** Player URL → something we can play ourselves, or null to drop it. */
export function playableFrom(playerUrl: string): { url: string; kind: 'hls' | 'iframe' } | null {
    let u: URL;
    try {
        u = new URL(playerUrl);
    } catch {
        return null;
    }

    // Never embed full YoNo website pages (/page, /pagenpl). If passed, unwrap to the clean player.
    if (/\/(page|pagenpl)$/.test(u.pathname)) {
        const src = u.searchParams.get('src');
        if (!src) return null;
        try {
            const innerUrl = new URL(src);
            const id = innerUrl.searchParams.get('id');
            if (id && DIRECT_CLEAN_PLAYERS[id]) {
                return playableFrom(DIRECT_CLEAN_PLAYERS[id]);
            }
            return playableFrom(src);
        } catch {
            return null;
        }
    }

    // Never embed LINK channel selection pages. If passed, unwrap by id.
    if (/\/LINK$/i.test(u.pathname)) {
        const id = u.searchParams.get('id');
        if (id && DIRECT_CLEAN_PLAYERS[id]) {
            return playableFrom(DIRECT_CLEAN_PLAYERS[id]);
        }
        return null;
    }

    // Standalone clean video players on Cloudflare Pages (Shaka Player / full window)
    if (/\/(fc|wtv|tnt\d*|crictv)$/.test(u.pathname)) return { url: playerUrl, kind: 'iframe' };
    if (/\/wtvplyrrr$/.test(u.pathname)) return { url: playerUrl, kind: 'iframe' };

    const src = u.searchParams.get('src');
    if (!src || /paid/i.test(src)) return null;

    // HLS players: plyrr, hlsplyrr, dplyrr
    if (/\/(hls|d)?plyrr$/.test(u.pathname) && /\.m3u8(\?|$)/.test(src)) return { url: src, kind: 'hls' };

    // Iframe player wrappers (e.g. iplyrr wrapping finalspot, truckrefuse)
    // Keep the playerUrl wrapper so domain/referer protection is satisfied
    if (/\/iplyrr$/.test(u.pathname) && /^https:\/\//.test(src)) return { url: playerUrl, kind: 'iframe' };

    return null;
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
            const id = matchIdOf(item);
            if (id && isMatch(item)) out.push(this.toMatch(item, id));
        }
        return out;
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        if (category.toLowerCase() !== 'cricket' || !/^[a-z0-9_-]+$/i.test(id)) return null;
        const item = (await this.schedule()).find((i) => (matchIdOf(i) === id || idOf(i) === id) && isMatch(i));
        if (!item) return null;

        const data = await this.get<RawMatchData>(`/${idOf(item)}.json`).catch((): RawMatchData => ({}));
        const sources: MatchSource[] = [];
        const seen = new Set<string>();
        const tables = new Map<string, Map<string, string>>();

        const addPlayer = async (k: string, playerUrl: string | undefined, label?: string) => {
            if (!playerUrl) return;
            // Unwrap before AND after playableFrom: a bare page (/fc2) would be
            // dropped by it, and /page or LINK wrappers only resolve to /fc inside it.
            let playable = playableFrom(await unwrapPlayerPage(playerUrl));
            if (playable?.kind === 'iframe') {
                const url = await unwrapPlayerPage(playable.url);
                playable = { url, kind: /\.m3u8(\?|$)/.test(url) ? 'hls' : 'iframe' };
            }
            if (!playable) return;
            // Same stream, different spelling (encoded or not): compare by the manifest itself.
            const streamKey = new URL(playable.url).searchParams.get('manifest') ?? playable.url;
            if (seen.has(streamKey)) return;
            seen.add(streamKey);
            sources.push({
                id: `${id}-${k}`,
                streamNo: sources.length + 1,
                language: 'English',
                hd: playable.url.includes('/fc') || playable.url.includes('dplyrr') || playable.url.includes('id=FC') || playable.url.includes('id=NPL11'),
                embedUrl: playable.url,
                source: label ?? `Yono ${k}`,
                provider: this.name,
            });
        };

        // Ensure the central LINK channel table is available
        const mainTableUrl = 'https://yonotv.pages.dev/LINK';
        if (!tables.has(mainTableUrl)) {
            const html = await this.get<string>(mainTableUrl, 'text').catch(() => '');
            if (html) tables.set(mainTableUrl, parseChannelTable(html));
        }
        const mainTable = tables.get(mainTableUrl);

        const feedId = idOf(item)?.toUpperCase() ?? '';
        const isNpl = feedId === 'NPL' || /npl/i.test(item.league ?? '') || /npl/i.test(item.home_team ?? '');

        // Verified clean stream URLs (direct video player, no YoNoTV website chrome)
        if (isNpl) {
            const npl11 = mainTable?.get('NPL11') ?? DIRECT_CLEAN_PLAYERS.NPL11;
            const fc = mainTable?.get('FC') ?? DIRECT_CLEAN_PLAYERS.FC;
            const fc3 = mainTable?.get('FC3') ?? DIRECT_CLEAN_PLAYERS.FC3;

            await addPlayer('NPL11-direct', npl11, 'NPL Live (NPL11)');
            await addPlayer('FC-direct', fc, 'FanCode Live (FC)');
            await addPlayer('FC3-direct', fc3, 'FanCode 3 (FC3)');
        }

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
            const table = tables.get(tableUrl)!;
            // 1. Direct lookup
            let player = table.get(key);
            // 2. Yono maps single-digits to doubled digits: NPL -> NPL11, NPL2 -> NPL22, NPL3 -> NPL33
            if (!player) {
                const doubled = key.replace(/(\d*)$/, (m) => (m ? m + m : '11'));
                player = table.get(doubled);
            }
            // 3. Case-insensitive lookup
            if (!player) {
                const lower = key.toLowerCase();
                for (const [k, v] of table.entries()) {
                    if (k.toLowerCase() === lower) {
                        player = v;
                        break;
                    }
                }
            }
            await addPlayer(key, player, link.name ? link.name.replace(/^Link \d+:\s*/i, 'Yono ') : undefined);
        }


        // Sweep the channel table for any extra channels matching this match's feed prefix
        // (e.g. Yono added NPL44, NPL55 to LINK table but not to npl.json telecast_links)
        if (feedId) {
            for (const table of tables.values()) {
                for (const [k, playerUrl] of table.entries()) {
                    if (k.toUpperCase().startsWith(feedId)) {
                        await addPlayer(k, playerUrl);
                    }
                }
            }
        }

        // For NPL matches, also pull in FanCode feeds (FC, FC2, FC3) if available
        if (isNpl) {
            for (const table of tables.values()) {
                if (table.has('FC')) await addPlayer('FC', table.get('FC'), 'FanCode Direct (FC)');
                if (table.has('FC3')) await addPlayer('FC3', table.get('FC3'), 'FanCode 3 Direct (FC3)');
                if (table.has('FC2')) await addPlayer('FC2', table.get('FC2'), 'FanCode 2 Direct (FC2)');
            }
        }

        return { ...this.toMatch(item, id), sources };
    }
}
