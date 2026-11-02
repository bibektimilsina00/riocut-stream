import axios from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider } from './base';
import { getHeaderEvents } from '../espn';
import { DIRECT_CLEAN_PLAYERS, parseChannelTable, unwrapFc } from './yono-provider';

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
// NetTV CDN load balancer for NPL feeds.
// (ott-int-nlive edge was retired and resolves to 0.0.0.0).
const NPL_EDGES = [
    { host: 'lb-ottnp.nettvstreamz.com', label: 'NetTV' },
];
const nplUrl = (n: number, host = NPL_EDGES[0].host) => `https://${host}/npl/live_match${n}/playlist.m3u8`;

/**
 * A finished match's slot can keep answering 200 with yesterday's leftover
 * playlist (seen: slot 6 still serving a finished match a day later), so a
 * 2xx alone doesn't mean "live right now". The playlist embeds a short-lived
 * access token (`wmsAuthSign=<base64>...&id=<JWT>`) that NetTV's own player
 * relies on to fetch segments; once that JWT's `exp` has passed the slot is
 * stale even though the manifest itself still loads. Treat "can't read the
 * token" (format drift) as fresh rather than silently hiding every feed.
 */
function isFreshNplFeed(playlist: string): boolean {
    const wms = playlist.match(/wmsAuthSign=([^&\s"]+)/)?.[1];
    if (!wms) return true;
    try {
        const jwt = Buffer.from(decodeURIComponent(wms), 'base64').toString('utf8').match(/id=([^&]+)/)?.[1];
        const exp = jwt && JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8')).exp;
        return typeof exp !== 'number' || exp * 1000 > Date.now();
    } catch {
        return true;
    }
}

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
            sources: [
                this.source(fcChannelId, cleanSources.NPL11, 'NPL Live (NPL11)', 1),
                this.source(fcChannelId, cleanSources.FC, 'FanCode Live (FC)', 2),
                this.source(fcChannelId, cleanSources.FC3, 'FanCode 3 (FC3)', 3),
            ],
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

    private async cleanNplSources(): Promise<{ NPL11: string; FC: string; FC3: string }> {
        const out = {
            NPL11: DIRECT_CLEAN_PLAYERS.NPL11,
            FC: DIRECT_CLEAN_PLAYERS.FC,
            FC3: DIRECT_CLEAN_PLAYERS.FC3,
        };
        try {
            const linkHtml = await axios.get<string>('https://yonotv.pages.dev/LINK', { timeout: 3_500, responseType: 'text' })
                .then((r) => r.data).catch(() => '');
            if (linkHtml) {
                const table = parseChannelTable(linkHtml);
                if (table.has('NPL11')) out.NPL11 = table.get('NPL11')!;
                if (table.has('FC')) out.FC = table.get('FC')!;
                if (table.has('FC3')) out.FC3 = table.get('FC3')!;
            }
        } catch {
            // keep fallback defaults
        }
        out.NPL11 = await unwrapFc(out.NPL11);
        return out;
    }

    /** One match per NPL game ESPN has in progress, carrying NetTV's live feeds. */
    private async liveNpl(): Promise<Array<{ match: Match; sources: MatchSource[] }>> {
        const events = await getHeaderEvents('cricket').catch(() => []);
        const live = events.filter((e) => e.state === 'in' && e.competitors.length === 2 && /\(NPL\)/.test(e.competitors[0].name));
        if (!live.length) return [];
        // NetTV numbers feeds per match; probe with maxRedirects: 0 so we don't follow to dead edges.
        // NetTV's load balancer redirects non-Nepal IPs (302) while serving Nepali viewers.
        const probes = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
            axios.head(nplUrl(n), { timeout: 5_000, maxRedirects: 0, validateStatus: (s) => s !== 404 && s < 500 })
                .then(() => n)
                .catch(() => null)));
        let feeds = probes.filter((n): n is number => n !== null);
        if (!feeds.length) return [];

        // A slot can keep answering even after its match ended (stale token);
        // drop those before picking which one to show.
        const fresh = await Promise.all(feeds.map((n) =>
            axios.get<string>(nplUrl(n), { timeout: 5_000, responseType: 'text' })
                .then((r) => (isFreshNplFeed(r.data) ? n : null)).catch(() => n)));
        const freshFeeds = fresh.filter((n): n is number => n !== null);
        if (freshFeeds.length) feeds = freshFeeds;

        const cleanSources = await this.cleanNplSources();

        let activeMatchNum: number | null = null;
        try {
            const linkHtml = await axios.get<string>('https://yonotv.pages.dev/LINK', { timeout: 4_000, responseType: 'text' })
                .then((r) => r.data).catch(() => '');
            const m = linkHtml.match(/live_match(\d+)/);
            if (m) activeMatchNum = parseInt(m[1], 10);
        } catch {
            // ignore
        }
        const orderedFeeds = activeMatchNum && feeds.includes(activeMatchNum)
            ? [activeMatchNum, ...feeds.filter((n) => n !== activeMatchNum)]
            : feeds;

        return live.map((e) => {
            const [home, away] = e.competitors.map((c) => cleanTeam(c.name));
            const id = `npl-nettv-${e.id}`;
            const fcSources = [
                this.source(id, cleanSources.NPL11, 'NPL Live (NPL11)', 1),
                this.source(id, cleanSources.FC, 'FanCode Live (FC)', 2),
                this.source(id, cleanSources.FC3, 'FanCode 3 (FC3)', 3),
            ];
            const nettvSources = orderedFeeds.flatMap((n) => NPL_EDGES.map((edge) => ({ url: nplUrl(n, edge.host), label: `${edge.label} ${n}` })))
                .map((s, i) => this.source(id, s.url, s.label, fcSources.length + i + 1));
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
                sources: [...fcSources, ...nettvSources],
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
