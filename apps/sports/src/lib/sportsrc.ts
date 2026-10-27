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
import { rankScore } from './popularity';

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
    /** Competition name as the provider labels it ("Premier League", "NBA"…). */
    league?: string;
    /** Scheduled end, unix ms, when the provider knows it. */
    endDate?: number;
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

/** Fallback durations when the provider gives no end time. */
const DEFAULT_DURATION_MS: Record<string, number> = {
    cricket: 8 * 3600_000, // ponytail: covers T20/ODI; multi-day Tests need a real endDate
    'motor-sports': 4 * 3600_000,
};

export function isMatchLive(match: Match | MatchDetail): boolean {
    const kickoff = getMatchKickoff(match);
    if (!kickoff) return false;
    const now = Date.now();
    const startedAt = kickoff.getTime();
    const endsAt = match.endDate && match.endDate > startedAt
        ? match.endDate
        : startedAt + (DEFAULT_DURATION_MS[match.category] ?? 3 * 3600_000);
    return now >= startedAt && now <= endsAt;
}

/**
 * Order matches for display: most-watched first (league tier + big teams, see
 * popularity.ts), with a time decay so imminent kickoffs aren't buried by next
 * week's marquee game. Ties fall back to kickoff time.
 */
export function sortMatches<T extends Match>(matches: T[]): T[] {
    const now = Date.now();
    return [...matches]
        .map((m) => ({ m, r: rankScore(m, now) }))
        .sort((a, b) => b.r - a.r || (a.m.date ?? 0) - (b.m.date ?? 0))
        .map((x) => x.m);
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
    // Only streamed-family embeds (streamapi.cc wrapper / embed.st) can be
    // rebuilt; other providers (esportex) reuse `source`/`id` for their own
    // labels and must keep their real embedUrl.
    if (/streamapi\.cc|embed\.st|embedsports/.test(s.embedUrl ?? '') && s.source && s.id && s.streamNo != null) {
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
