/**
 * Shared sports data model + helpers.
 *
 * The concrete data client (`sportsrc`) lives in `./providers/client` and
 * transparently fails over across multiple upstream mirrors. This module owns
 * only the normalised types every provider maps onto, plus pure helpers.
 */

export const SPORTSRC_BASE_URL = 'https://api.sportsrc.org';

/** Re-exported failover client. Same shape the app has always imported. */
export { sportsrc, providerNames } from './providers/client';

// ---------- Sports categories ----------

export interface SportCategory {
    id: string;
    name: string;
    category?: string;
}

// ---------- Match ----------

export interface MatchTeam {
    name: string;
    badge: string | null;
}

export interface Match {
    id: string;
    title: string;
    category: string;
    /** Unix epoch in milliseconds. */
    date: number;
    popular?: boolean;
    poster: string | null;
    teams: {
        home: MatchTeam;
        away: MatchTeam;
    };
    /** Which upstream provider served this match. */
    provider?: string;
}

export interface MatchSource {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source?: string;
    viewers?: number;
    /** Which upstream provider resolved this stream. */
    provider?: string;
}

export interface MatchDetail extends Match {
    sources: MatchSource[];
}

// ---------- Leagues ----------

export interface League {
    id: string;
    name: string;
    code?: string;
    country?: string;
}

// ---------- Tables (standings) ----------

export interface StandingTeam {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
}

export interface StandingRow {
    position: number;
    team: StandingTeam;
    playedGames: number;
    form?: string | null;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
}

export interface StandingsGroup {
    stage: string;
    type: string;
    group: string | null;
    table: StandingRow[];
}

export interface TablesResponse {
    filters: { season: string };
    area: { id: number; name: string; code: string; flag: string };
    competition: { id: number; name: string; code: string; type: string; emblem: string };
    season: { id: number; startDate: string; endDate: string; currentMatchday: number; winner: unknown };
    standings: StandingsGroup[];
}

// ---------- Scores ----------

export interface ScoreEntry {
    id?: string | number;
    utcDate?: string;
    status?: string;
    homeTeam?: { id?: number; name?: string; crest?: string };
    awayTeam?: { id?: number; name?: string; crest?: string };
    score?: {
        fullTime?: { home?: number | null; away?: number | null };
        halfTime?: { home?: number | null; away?: number | null };
        winner?: string | null;
    };
    competition?: { id?: number; name?: string; emblem?: string };
    [key: string]: unknown;
}

export interface ScoresResponse {
    live: ScoreEntry[];
    finished: ScoreEntry[];
    last_updated?: string;
}

// ---------- Helpers ----------

export function matchExternalIdHash(category: string, id: string | number): number {
    const s = `${category}:${id}`;
    let hash = 5381;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    return Math.abs(hash) & 0x7fffffff;
}

export function getMatchKickoff(match: Match | MatchDetail | null | undefined): Date | null {
    if (!match?.date) return null;
    const d = new Date(match.date);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function isMatchLive(match: Match | MatchDetail): boolean {
    const kickoff = getMatchKickoff(match);
    if (!kickoff) return false;
    const now = Date.now();
    const startedAt = kickoff.getTime();
    return now >= startedAt && now <= startedAt + 1000 * 60 * 60 * 3;
}

/**
 * Order matches for display: popular/marquee fixtures first (World Cup, big
 * finals — the provider flags these with `popular`), then by kickoff time.
 * The provider returns matches in an arbitrary order, so we sort ourselves.
 */
export function sortMatches<T extends Match>(matches: T[]): T[] {
    return [...matches].sort((a, b) => {
        const pop = (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
        if (pop !== 0) return pop;
        return (a.date ?? 0) - (b.date ?? 0);
    });
}

/**
 * Resolve the iframe URL for a source.
 *
 * The API's `embedUrl` points at the `embed.streamapi.cc` wrapper, which injects
 * a rotating pop-under ad script + a Histats tracker around the real player
 * (`embed.st`). When we have the underlying `source`/`id`/`streamNo`, we build the
 * inner `embed.st` URL directly and skip that wrapper layer — removing one ad
 * layer. The inner player still serves its own ads; this is a partial reduction,
 * not full ad-block. Falls back to the original `embedUrl` if fields are missing.
 */
export function resolveEmbedUrl(s: MatchSource): string {
    if (s.source && s.id && s.streamNo != null) {
        return `https://embed.st/embed/${s.source}/${s.id}/${s.streamNo}`;
    }
    return s.embedUrl;
}

export function pickBestSource(detail: MatchDetail | null | undefined, preferredLanguage = 'English'): MatchSource | null {
    if (!detail?.sources?.length) return null;
    const english = detail.sources.filter((s) => (s.language ?? '').toLowerCase().includes(preferredLanguage.toLowerCase()));
    const pool = english.length ? english : detail.sources;
    const hd = pool.find((s) => s.hd);
    return hd ?? pool[0] ?? null;
}
