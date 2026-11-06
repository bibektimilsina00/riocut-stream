import axios from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider } from './base';
import { getHeaderEvents } from '../espn';
import { DIRECT_CLEAN_PLAYERS, parseChannelTable, playableFrom, unwrapPlayerPage } from './yono-provider';

/**
 * Cricket sources that aren't a per-match feed, so cricket never hangs on one
 * upstream (Yono):
 *  - 24/7 channels: MS Networks HLS (PTV Sports, Ten Sports, A Sports — CORS
 *    open, played by our hls.js player) and ppv.st's and streamfree.top's cricket channels (iframe).
 *  - NetTV's own NPL feed, listed only while ESPN says an NPL match is on
 *    (the playlist keeps answering between matches).
 *
 * ponytail: channel slugs are hard-coded. If MS Networks renames one it just
 * fails over in the player; edit HLS_CHANNELS.
 */

const CACHE_MS = 60_000;
// Providers mark always-on channels with an old placeholder date; the hub
// files anything that old under "24/7 channels".
const CHANNEL_DATE = Date.UTC(2026, 0, 1);

const HLS_CHANNELS = [
    { id: 'ch-ptv-sports', title: 'PTV Sports', url: 'https://live.msnetworks.net/ptv-sports/master.m3u8' },
    { id: 'ch-ten-sports', title: 'Ten Sports', url: 'https://live.msnetworks.net/ten-sports/master.m3u8' },
    { id: 'ch-a-sports', title: 'A Sports', url: 'https://live.msnetworks.net/a-sports/master.m3u8' },
];
const PPV_API = 'https://api.ppv.st/api/streams';
// streamfree lists streams as JSON, but the embed URLs only live in each
// player page's `let sources = [...]` line.
const STREAMFREE = 'https://streamfree.top';
const NPL_ESPN_LEAGUE = 'Nepal Premier League';
// NetTV's real live CDN host rotates (seen ott-nettv-01, -02, ...) and every
// request needs a short-lived wmsAuthSign token minted by their own site, so
// we can't construct this URL — we lift the live one out of Yono's LINK page
// (same place FC/FC3 come from). Yono's own "NP3" table entry points at
// `ott-lb.nettv.com.np`, a load balancer that 302s to the real host but drops
// the token (confirmed: following it 403s) — so we match the tokened URL
// directly instead of trusting that table entry.
const NETTV_URL_RE = /https:\/\/ott-nettv-\d+\.nettv\.com\.np\/iptvlivestream\/[^"'\s]+wmsAuthSign=[^"'\s&]+/;
// npl-tv.pages.dev's own per-match link list — "link5" is a plain public
// Rumble CDN HLS stream (no DRM, no token, no bot-check), unlike their
// link1-3 (same DRM'd aiv-cdn manifests as our FC/FC3) or link7 (finalspot,
// Referer-gated).
const NPL_TV_DATA_URL = 'https://npl-tv.pages.dev/data.json';

type PpvStream = { id?: number; name?: string; tag?: string; iframe?: string; poster?: string };
type PpvPayload = { streams?: Array<{ category?: string; streams?: PpvStream[] }> };
type StreamfreeStream = { name?: string; stream_key?: string; thumbnail_url?: string };

const channel = (id: string, title: string, provider: string, poster: string | null = null): Match => ({
    id,
    title,
    category: 'cricket',
    date: CHANNEL_DATE,
    poster,
    teams: { home: { name: title, badge: null }, away: { name: '', badge: null } },
    provider,
    league: '24/7 channel',
});

/** "Pokhara Avengers (NPL)" → "Pokhara Avengers" */
const cleanTeam = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim();

export class CricketChannelsProvider implements SportsProvider {
    readonly name: string;
    private cache: { at: number; items: Array<{ match: Match; sources: MatchSource[] }> } | null = null;

    constructor(name = 'channels') {
        this.name = name;
    }

    private source(id: string, url: string, label: string, n: number): MatchSource {
        return { id: `${id}-${n}`, streamNo: n, language: 'English', hd: false, embedUrl: url, source: label, provider: this.name };
    }

    private async items() {
        if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.items;
        const items: Array<{ match: Match; sources: MatchSource[] }> = HLS_CHANNELS.map((c) => ({
            match: channel(c.id, c.title, this.name),
            sources: [this.source(c.id, c.url, c.title, 1)],
        }));

        const [ppv, npl, streamfree] = await Promise.all([
            axios.get<PpvPayload>(PPV_API, { timeout: 3_500 }).then((r) => r.data).catch((): PpvPayload => ({})),
            this.liveNpl(),
            this.streamfree(),
        ]);
        for (const cat of ppv.streams ?? []) {
            if (!/cricket/i.test(cat.category ?? '')) continue;
            for (const s of cat.streams ?? []) {
                if (!s.id || !s.name || !s.iframe?.startsWith('https://')) continue;
                const id = `ch-ppv-${s.id}`;
                items.push({ match: channel(id, s.name, this.name, s.poster ?? null), sources: [this.source(id, s.iframe, s.name, 1)] });
            }
        }
        const cleanSources = await this.cleanNplSources();
        const fcChannelId = 'ch-npl-live';
        items.push({
            match: channel(fcChannelId, 'NPL Live Stream', this.name),
            sources: this.nplSourceList(fcChannelId, cleanSources),
        });
        items.push(...streamfree, ...npl);
        this.cache = { at: Date.now(), items };
        return items;
    }

    /** streamfree.top's cricket channels (Willow, Sky Sports Cricket), one source per quality mirror. */
    private async streamfree(): Promise<Array<{ match: Match; sources: MatchSource[] }>> {
        const list = await axios.get<{ streams?: Record<string, StreamfreeStream[]> }>(`${STREAMFREE}/streams`, { timeout: 3_500 })
            .then((r) => r.data.streams?.cricket ?? []).catch((): StreamfreeStream[] => []);
        const items = await Promise.all(list.map(async (s) => {
            if (!s.name || !s.stream_key) return null;
            const page = await axios.get<string>(`${STREAMFREE}/player/cricket/${encodeURIComponent(s.stream_key)}`, { timeout: 3_500, responseType: 'text' })
                .then((r) => r.data).catch(() => '');
            const urls = (page.match(/let sources = (\[[^\]]*\])/)?.[1].match(/https:\/\/[^"]+/g) ?? []);
            if (!urls.length) return null;
            const id = `ch-sf-${s.stream_key}`;
            const poster = s.thumbnail_url ? `${STREAMFREE}${s.thumbnail_url}` : null;
            return { match: channel(id, s.name, this.name, poster), sources: urls.map((u, i) => this.source(id, u, `${s.name} ${i + 1}`, i + 1)) };
        }));
        return items.filter((i) => i !== null);
    }

    private async cleanNplSources(): Promise<{ FC: string; FC3: string; nettv: string | null; np2: string | null; rumble: string | null }> {
        const out = {
            FC: DIRECT_CLEAN_PLAYERS.FC,
            FC3: DIRECT_CLEAN_PLAYERS.FC3,
            nettv: null as string | null,
            np2: null as string | null,
            rumble: null as string | null,
        };
        const [linkHtml, nplTvData] = await Promise.all([
            axios.get<string>('https://yonotv.pages.dev/LINK', { timeout: 3_500, responseType: 'text' })
                .then((r) => r.data).catch(() => ''),
            axios.get<Record<string, { link5?: { type?: string; url?: string } }>>(NPL_TV_DATA_URL, { timeout: 3_500 })
                .then((r) => r.data).catch(() => null),
        ]);
        if (linkHtml) {
            const table = parseChannelTable(linkHtml);
            // Deliberately not reading a "NPL11" entry: Yono dropped it from
            // this table, and its old hardcoded fallback resolves (via a live
            // page scrape — its own extra failure mode) to the exact same
            // manifest/key as FC, so it was a pure, more-fragile duplicate.
            if (table.has('FC')) out.FC = table.get('FC')!;
            if (table.has('FC3')) out.FC3 = table.get('FC3')!;
            out.nettv = linkHtml.match(NETTV_URL_RE)?.[0] ?? null;
            // FC/FC3 are FanCode's generic live-cricket channel, not an NPL
            // feed — whatever FanCode happens to be airing (Ranji Trophy,
            // domestic T20s...) when another match overlaps NPL's slot. NP2
            // is Yono's own Nepal-tagged source, a distinct stream.
            const np2 = table.get('NP2');
            out.np2 = np2 ? playableFrom(np2)?.url ?? null : null;
        }
        const link5 = nplTvData?.npl2026?.link5;
        if (link5?.type === 'hls' && link5.url) out.rumble = link5.url;
        [out.FC, out.FC3] = await Promise.all([out.FC, out.FC3].map(unwrapPlayerPage));
        return out;
    }

    /** NetTV, NP2 and Rumble are NPL-specific; FC/FC3 are FanCode's generic cricket channel (may show a different match). */
    private nplSourceList(id: string, clean: { FC: string; FC3: string; nettv: string | null; np2: string | null; rumble: string | null }): MatchSource[] {
        const candidates = [
            // Rumble first: the only one of these that's actually reliable right
            // now (NetTV/NP2 dead, FC/FC3 carry whatever FanCode is airing, not
            // necessarily NPL) — listed as fallbacks for when that changes.
            clean.rumble && { url: clean.rumble, label: 'NPL Live' },
            clean.nettv && { url: clean.nettv, label: 'NetTV Live' },
            clean.np2 && { url: clean.np2, label: 'Nepal Live (NP2)' },
            { url: clean.FC, label: 'FanCode Live (FC)' },
            { url: clean.FC3, label: 'FanCode 3 (FC3)' },
        ].filter((c): c is { url: string; label: string } => !!c);
        return candidates.map((c, i) => this.source(id, c.url, c.label, i + 1));
    }

    /** Streams open this long before toss: broadcasters run pre-match coverage, so other NPL sites already show "live" by then. */
    private static readonly PRE_MATCH_MS = 30 * 60_000;

    /** One match per NPL game that's in progress or about to toss, carrying NetTV's live feed + DRM fallbacks. */
    private async liveNpl(): Promise<Array<{ match: Match; sources: MatchSource[] }>> {
        const events = await getHeaderEvents('cricket').catch(() => []);
        const now = Date.now();
        const live = events.filter((e) =>
            e.competitors.length === 2 && /\(NPL\)/.test(e.competitors[0].name) &&
            (e.state === 'in' || (e.state === 'pre' && e.date - now <= CricketChannelsProvider.PRE_MATCH_MS)));
        if (!live.length) return [];

        const cleanSources = await this.cleanNplSources();

        return live.map((e) => {
            const [home, away] = e.competitors.map((c) => cleanTeam(c.name));
            const id = `npl-nettv-${e.id}`;
            return {
                match: {
                    id,
                    title: `${home} vs ${away}`,
                    category: 'cricket',
                    date: e.date,
                    poster: null,
                    teams: { home: { name: home, badge: null }, away: { name: away, badge: null } },
                    provider: this.name,
                    league: NPL_ESPN_LEAGUE,
                },
                sources: this.nplSourceList(id, cleanSources),
            };
        });
    }

    async getSports(): Promise<SportCategory[]> {
        return [{ id: 'cricket', name: 'Cricket', category: 'cricket' }];
    }

    async getMatches(category: string): Promise<Match[]> {
        if (!['cricket', 'live', 'all'].includes(category.toLowerCase())) return [];
        return (await this.items()).map((i) => i.match);
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        if (category.toLowerCase() !== 'cricket' || !/^(ch-|npl-nettv-)/.test(id)) return null;
        const hit = (await this.items()).find((i) => i.match.id === id);
        return hit ? { ...hit.match, sources: hit.sources } : null;
    }
}
