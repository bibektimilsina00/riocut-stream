import type { Match } from './sportsrc';

/**
 * ESPN's public site API: fixtures, live scores and standings for every sport
 * we stream (cricket included), no key, CORS-open. Powers the league /
 * tournament pages; each fixture is matched back to a playable stream from our
 * providers so a league page is never a dead end.
 */

const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const STANDINGS = 'https://site.api.espn.com/apis/v2/sports';
const HEADER = 'https://site.web.api.espn.com/apis/v2/scoreboard/header';

export interface EspnSport {
    /** ESPN sport path segment. */
    key: string;
    /** Our stream category (see providers / SPORT_PRIORITY). */
    category: string;
    label: string;
}

/** Display order mirrors SPORT_PRIORITY. */
export const ESPN_SPORTS: EspnSport[] = [
    { key: 'soccer', category: 'football', label: 'Football' },
    { key: 'cricket', category: 'cricket', label: 'Cricket' },
    { key: 'basketball', category: 'basketball', label: 'Basketball' },
    { key: 'football', category: 'american-football', label: 'American Football' },
    { key: 'mma', category: 'fight', label: 'UFC / MMA' },
    { key: 'racing', category: 'motor-sports', label: 'Motorsport' },
    { key: 'tennis', category: 'tennis', label: 'Tennis' },
    { key: 'hockey', category: 'hockey', label: 'Hockey' },
    { key: 'baseball', category: 'baseball', label: 'Baseball' },
];

export interface EspnLeague {
    sport: string;
    slug: string;
    name: string;
    /** Set for tournaments pulled from ESPN's "happening now" feed. */
    current?: boolean;
}

const L = (sport: string, slug: string, name: string): EspnLeague => ({ sport, slug, name });

/** Hand-picked always-listed competitions (slugs verified against ESPN). */
export const CURATED_LEAGUES: EspnLeague[] = [
    L('soccer', 'uefa.champions', 'UEFA Champions League'),
    L('soccer', 'eng.1', 'Premier League'),
    L('soccer', 'esp.1', 'LaLiga'),
    L('soccer', 'ita.1', 'Serie A'),
    L('soccer', 'ger.1', 'Bundesliga'),
    L('soccer', 'fra.1', 'Ligue 1'),
    L('soccer', 'uefa.europa', 'UEFA Europa League'),
    L('soccer', 'fifa.world', 'FIFA World Cup'),
    L('soccer', 'usa.1', 'MLS'),
    L('soccer', 'ned.1', 'Eredivisie'),
    L('soccer', 'por.1', 'Primeira Liga'),
    L('soccer', 'eng.2', 'EFL Championship'),
    L('soccer', 'eng.fa', 'FA Cup'),
    L('soccer', 'eng.league_cup', 'Carabao Cup'),
    L('soccer', 'bra.1', 'Brasileirão'),
    L('soccer', 'mex.1', 'Liga MX'),
    L('cricket', '23081', 'Nepal Premier League'),
    L('cricket', '8048', 'Indian Premier League'),
    L('cricket', '8044', 'Big Bash League'),
    L('cricket', '8679', 'Pakistan Super League'),
    L('basketball', 'nba', 'NBA'),
    L('basketball', 'wnba', 'WNBA'),
    L('football', 'nfl', 'NFL'),
    L('football', 'college-football', 'College Football'),
    L('mma', 'ufc', 'UFC'),
    L('racing', 'f1', 'Formula 1'),
    L('tennis', 'atp', 'ATP Tour'),
    L('tennis', 'wta', 'WTA Tour'),
    L('hockey', 'nhl', 'NHL'),
    L('baseball', 'mlb', 'MLB'),
];

export function espnSport(key: string): EspnSport | undefined {
    return ESPN_SPORTS.find((s) => s.key === key);
}

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN ${res.status} ${url}`);
    return res.json() as Promise<T>;
}

// ---------- Catalog ----------

type RawHeader = { sports?: Array<{ leagues?: Array<{ id?: string; slug?: string; name?: string; events?: unknown[] }> }> };

/**
 * Cricket runs as dozens of short tours and series (e.g. "Australia tour of
 * South Africa"), so a static list can't cover it. ESPN's header feed lists
 * every series with a match around today.
 */
export async function getCurrentLeagues(sport: string): Promise<EspnLeague[]> {
    const d = await get<RawHeader>(`${HEADER}?sport=${encodeURIComponent(sport)}`);
    const out: EspnLeague[] = [];
    for (const s of d.sports ?? []) {
        for (const l of s.leagues ?? []) {
            const slug = l.slug || l.id;
            if (slug && l.name && l.events?.length) out.push({ sport, slug, name: l.name, current: true });
        }
    }
    return out;
}

// ---------- Scoreboard ----------

export interface EspnCompetitor {
    name: string;
    shortName?: string;
    abbreviation?: string;
    logo?: string;
    score?: string;
    winner?: boolean;
}

export interface EspnEvent {
    id: string;
    name: string;
    date: number;
    state: 'pre' | 'in' | 'post';
    /** "FT", "Stumps", "Q3 4:12", "Chitwan won by 8 runs"… */
    status: string;
    /** Exactly two for team sports; empty for races, golf, fight cards. */
    competitors: EspnCompetitor[];
}

export interface EspnScoreboard {
    league: { name: string; logo?: string };
    events: EspnEvent[];
}

type RawTeam = { displayName?: string; shortDisplayName?: string; abbreviation?: string; logo?: string; logos?: Array<{ href?: string }> };
type RawEvent = {
    id: string; name: string; date: string;
    status?: { summary?: string; type?: { state?: string; shortDetail?: string; description?: string } };
    competitions?: Array<{ competitors?: Array<{ team?: RawTeam; athlete?: RawTeam; score?: string | { displayValue?: string }; winner?: boolean }> }>;
};
type RawScoreboard = { leagues?: Array<{ name?: string; logos?: Array<{ href?: string }> }>; events?: RawEvent[] };

function toEvent(e: RawEvent): EspnEvent {
    const comps = e.competitions?.[0]?.competitors ?? [];
    const st = e.status?.type;
    return {
        id: e.id,
        name: e.name,
        date: Date.parse(e.date),
        state: st?.state === 'in' || st?.state === 'post' ? st.state : 'pre',
        status: e.status?.summary || st?.shortDetail || st?.description || '',
        competitors: comps.length === 2
            ? comps.map((c) => {
                const t = c.team ?? c.athlete ?? {};
                return {
                    name: t.displayName ?? '',
                    shortName: t.shortDisplayName,
                    abbreviation: t.abbreviation,
                    logo: t.logo ?? t.logos?.[0]?.href,
                    score: typeof c.score === 'object' ? c.score?.displayValue : c.score,
                    winner: c.winner,
                };
            })
            : [],
    };
}

export async function getScoreboard(sport: string, league: string): Promise<EspnScoreboard> {
    const base = `${SITE}/${sport}/${encodeURIComponent(league)}/scoreboard`;
    // The default window is "current round". Cricket tournaments are short and
    // dense, so ask for the whole year to get every fixture + result at once.
    let d: RawScoreboard | null = null;
    if (sport === 'cricket') d = await get<RawScoreboard>(`${base}?dates=${new Date().getFullYear()}`).catch(() => null);
    if (!d?.events?.length) d = await get<RawScoreboard>(base);
    const l = d.leagues?.[0];
    return {
        league: { name: l?.name ?? league, logo: l?.logos?.[0]?.href },
        events: (d.events ?? []).map(toEvent).sort((a, b) => a.date - b.date),
    };
}

// ---------- Standings ----------

export interface StandingsGroupView {
    name: string;
    columns: string[];
    rows: Array<{ name: string; logo?: string; values: string[] }>;
}

type RawStat = { name?: string; abbreviation?: string; displayValue?: string };
type RawStandingsNode = {
    name?: string;
    children?: RawStandingsNode[];
    standings?: { entries?: Array<{ team?: RawTeam; athlete?: RawTeam; stats?: RawStat[] }> };
};

// Columns worth showing, by ESPN stat name, in display order. Whatever a sport
// actually returns is intersected with this, so one table fits every sport.
const COLUMNS: Array<[string, string]> = [
    ['gamesPlayed', 'P'], ['matchesPlayed', 'M'],
    ['wins', 'W'], ['matchesWon', 'W'], ['ties', 'D'], ['losses', 'L'], ['matchesLost', 'L'],
    ['otLosses', 'OTL'], ['matchesTied', 'T'], ['noresult', 'NR'],
    ['winPercent', 'PCT'], ['gamesBehind', 'GB'],
    ['pointsFor', 'F'], ['pointsAgainst', 'A'], ['pointDifferential', 'GD'], ['netrr', 'NRR'],
    ['points', 'PTS'], ['matchPoints', 'PTS'], ['championshipPts', 'PTS'], ['streak', 'STRK'],
];

function groupView(node: RawStandingsNode): StandingsGroupView | null {
    // Entries aren't always in table order (NBA comes back unsorted).
    const order = (e: { stats?: RawStat[] }) => {
        const s = e.stats?.find((x) => x.name === 'rank' || x.name === 'playoffSeed');
        const n = Number(s?.displayValue);
        return Number.isFinite(n) && n > 0 ? n : Infinity;
    };
    const entries = [...(node.standings?.entries ?? [])].sort((a, b) => order(a) - order(b));
    if (!entries.length) return null;
    const present = new Set((entries[0].stats ?? []).map((s) => s.name));
    // US leagues (NBA/NFL/MLB) rank by win %: their points/for/against stats
    // aren't table columns (NBA "points" is a tiebreak value like -2.0).
    const byPct = present.has('winPercent');
    const skip = byPct ? new Set(['points', 'pointsFor', 'pointsAgainst', 'pointDifferential']) : new Set<string>();
    const cols = COLUMNS
        .filter(([n]) => present.has(n) && !skip.has(n))
        .map(([n, label]): [string, string] => [n, byPct && n === 'ties' ? 'T' : label]);
    return {
        name: node.name ?? '',
        columns: cols.map(([, label]) => label),
        rows: entries.map((e) => {
            const t = e.team ?? e.athlete ?? {};
            const byName = new Map((e.stats ?? []).map((s) => [s.name, s.displayValue ?? '']));
            return {
                name: t.displayName ?? '',
                logo: t.logos?.[0]?.href ?? t.logo,
                values: cols.map(([n]) => byName.get(n) ?? ''),
            };
        }),
    };
}

export async function getStandings(sport: string, league: string): Promise<StandingsGroupView[]> {
    const d = await get<RawStandingsNode>(`${STANDINGS}/${sport}/${encodeURIComponent(league)}/standings`);
    const nodes = d.children?.length ? d.children : [d];
    return nodes.map(groupView).filter((g): g is StandingsGroupView => !!g);
}

// ---------- Fixture → stream matching ----------

const STOP = new Set([
    'fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'the', 'club', 'and', 'city', 'united', 'town', 'real',
    'sporting', 'athletic', 'women', 'men', 'team', 'cricket', 'grand', 'prix', 'npl', 'ipl',
]);

function tokens(s: string): string[] {
    return s
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\([^)]*\)/g, ' ')
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3 && !STOP.has(t));
}

const MATCH_WINDOW_MS = 3 * 3600_000;

/**
 * Find the stream for an ESPN fixture among our provider matches.
 * Team sports: both sides must appear in the stream title. Other events
 * (races, fight cards): at least two distinctive words of the name in common.
 * ponytail: token overlap, not a team-id map — two same-city clubs kicking off
 * within 3h of each other could cross-match; add an alias table if seen.
 */
export function findStream(event: EspnEvent, matches: Match[]): Match | null {
    for (const m of matches) {
        if (Math.abs((m.date ?? 0) - event.date) > MATCH_WINDOW_MS) continue;
        const title = new Set(tokens(`${m.title} ${m.teams?.home?.name ?? ''} ${m.teams?.away?.name ?? ''}`));
        if (event.competitors.length === 2) {
            const sideHit = (c: EspnCompetitor) =>
                [c.name, c.shortName ?? ''].some((n) => tokens(n).some((t) => title.has(t)));
            if (event.competitors.every(sideHit)) return m;
        } else if (tokens(event.name).filter((t) => title.has(t)).length >= 2) {
            return m;
        }
    }
    return null;
}
