import axios from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider } from './base';
import { getHeaderEvents } from '../espn';

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
// NetTV's load balancer (the path Yosin TV uses); the old ottnlive-fstream
// live_hls/npl_match_N paths now 404.
const nplUrl = (n: number) => `https://lb-ottnp.nettvstreamz.com/npl/live_match${n}/playlist.m3u8`;

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
            axios.get<PpvPayload>(PPV_API, { timeout: 8_000 }).then((r) => r.data).catch((): PpvPayload => ({})),
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
        items.push(...streamfree, ...npl);
        this.cache = { at: Date.now(), items };
        return items;
    }

    /** streamfree.top's cricket channels (Willow, Sky Sports Cricket), one source per quality mirror. */
    private async streamfree(): Promise<Array<{ match: Match; sources: MatchSource[] }>> {
        const list = await axios.get<{ streams?: Record<string, StreamfreeStream[]> }>(`${STREAMFREE}/streams`, { timeout: 8_000 })
            .then((r) => r.data.streams?.cricket ?? []).catch((): StreamfreeStream[] => []);
        const items = await Promise.all(list.map(async (s) => {
            if (!s.name || !s.stream_key) return null;
            const page = await axios.get<string>(`${STREAMFREE}/player/cricket/${encodeURIComponent(s.stream_key)}`, { timeout: 8_000, responseType: 'text' })
                .then((r) => r.data).catch(() => '');
            const urls = (page.match(/let sources = (\[[^\]]*\])/)?.[1].match(/https:\/\/[^"]+/g) ?? []);
            if (!urls.length) return null;
            const id = `ch-sf-${s.stream_key}`;
            const poster = s.thumbnail_url ? `${STREAMFREE}${s.thumbnail_url}` : null;
            return { match: channel(id, s.name, this.name, poster), sources: urls.map((u, i) => this.source(id, u, `${s.name} ${i + 1}`, i + 1)) };
        }));
        return items.filter((i) => i !== null);
    }

    /** One match per NPL game ESPN has in progress, carrying NetTV's live feeds. */
    private async liveNpl(): Promise<Array<{ match: Match; sources: MatchSource[] }>> {
        const events = await getHeaderEvents('cricket').catch(() => []);
        const live = events.filter((e) => e.state === 'in' && e.competitors.length === 2 && /\(NPL\)/.test(e.competitors[0].name));
        if (!live.length) return [];
        // NetTV numbers feeds per match; only the live one exists. It 403s outside
        // Nepal (our server) but plays for Nepali viewers, so only 404 = absent.
        const probes = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
            axios.head(nplUrl(n), { timeout: 5_000, validateStatus: (s) => s !== 404 && s < 500 }).then(() => n).catch(() => null)));
        const feeds = probes.filter((n): n is number => n !== null);
        if (!feeds.length) return [];
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
                sources: feeds.map((n, i) => this.source(id, nplUrl(n), `NetTV ${n}`, i + 1)),
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
