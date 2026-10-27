import 'server-only';
import type {
    PlayerListItem, PlayerDetail, PlayerStatLine, CareerEntry, TransferEntry,
    TeamListItem, TeamDetail, SquadPlayer, TeamFixture, Venue, Paged,
    ManagerDetail, RefereeDetail, VenueDetail, WorldCup, WCFixture, WCSquadPlayer,
} from './v2-types';
import type { MatchExtras, MCShot, MCMomentum, MLPrediction, H2HSummary } from './types';

/**
 * BSD v2 server-side client for players & teams (and their sub-resources).
 * Same token + TTL-cache discipline as the v1 client: the token never leaves
 * the server, and responses are cached per-instance to stay fast and polite.
 */

const BASE = 'https://sports.bzzoiro.com/api/v2';
const TOKEN = process.env.BSD_API_TOKEN;

export function bsdConfigured(): boolean {
    return !!TOKEN;
}

const cache = new Map<string, { value: unknown; expires: number }>();

async function get<T>(path: string, ttlMs: number): Promise<T> {
    if (!TOKEN) throw new Error('BSD_API_TOKEN not configured');
    const now = Date.now();
    const hit = cache.get(path);
    if (hit && hit.expires > now) return hit.value as T;
    const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Token ${TOKEN}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`BSD v2 ${path} -> ${res.status}`);
    const value = (await res.json()) as T;
    cache.set(path, { value, expires: now + ttlMs });
    if (cache.size > 800) for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
    return value;
}

/** Resolve a sub-resource that may 404 or error into a safe fallback. */
async function soft<T>(p: Promise<T>, fallback: T): Promise<T> {
    try {
        return await p;
    } catch {
        return fallback;
    }
}

const n = (v: unknown): number | null => {
    const x = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(x) ? x : null;
};
const s = (v: unknown): string | null => (v == null || v === '' ? null : String(v));
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
/** Read a name from a value that may be a plain string or a `{ name }` object. */
const nameOf = (v: unknown): string | null => {
    if (typeof v === 'string') return v || null;
    if (v && typeof v === 'object' && 'name' in v) return s((v as { name?: unknown }).name);
    return null;
};

// ---------- raw shapes (only fields we read) ----------

interface RawPlayer {
    id: number;
    name: string;
    short_name?: string;
    position?: string;
    specific_position?: string;
    jersey_number?: string | number;
    nationality?: string;
    current_team_id?: number;
    national_team_id?: number;
    market_value_eur?: number;
    rating?: number;
    date_of_birth?: string;
    height_cm?: number;
    weight_kg?: number;
    preferred_foot?: string;
    contract_until?: string;
    availability?: string;
    potential?: number;
    injury_risk?: string;
    wage_eur_annual?: number;
    strengths?: unknown;
    weaknesses?: unknown;
    attributes?: Record<string, number> | null;
}
interface RawTeam {
    id: number;
    name: string;
    short_name?: string;
    country?: string;
    venue_id?: number;
}
interface RawEvent {
    id: number;
    home_team?: string;
    away_team?: string;
    home_score?: number;
    away_score?: number;
    event_date?: string;
    status?: string;
    category?: string;
    league?: { name?: string };
}

// ---------- mappers ----------

function toPlayerListItem(p: RawPlayer): PlayerListItem {
    return {
        id: p.id,
        name: p.name,
        shortName: s(p.short_name),
        position: s(p.position),
        specificPosition: s(p.specific_position),
        jerseyNumber: s(p.jersey_number),
        nationality: s(p.nationality),
        currentTeamId: p.current_team_id ?? null,
        marketValueEur: p.market_value_eur ?? null,
        rating: n(p.rating),
    };
}

function toTeamListItem(t: RawTeam): TeamListItem {
    return { id: t.id, name: t.name, shortName: s(t.short_name), country: s(t.country), venueId: t.venue_id ?? null };
}

function toFixture(e: RawEvent): TeamFixture {
    return {
        id: e.id,
        homeTeam: e.home_team ?? 'Home',
        awayTeam: e.away_team ?? 'Away',
        homeScore: e.home_score ?? null,
        awayScore: e.away_score ?? null,
        date: s(e.event_date),
        status: s(e.status),
        league: s(e.league?.name),
        category: e.category ?? 'football',
    };
}

// ---------- players ----------

function playerQuery(opts: { name?: string; position?: string; limit?: number; offset?: number }): string {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    if (opts.position) q.set('position', opts.position);
    q.set('limit', String(opts.limit ?? 30));
    q.set('offset', String(opts.offset ?? 0));
    return q.toString();
}

export async function listPlayers(opts: { name?: string; position?: string; limit?: number; offset?: number }): Promise<Paged<PlayerListItem>> {
    const data = await get<{ count?: number; results?: RawPlayer[] }>(`/players/?${playerQuery(opts)}`, 60_000);
    return { count: data.count ?? 0, results: (data.results ?? []).map(toPlayerListItem) };
}

export async function getPlayer(id: number): Promise<PlayerDetail | null> {
    let raw: RawPlayer;
    try {
        raw = await get<RawPlayer>(`/players/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;

    const [statsRaw, careerRaw, transfersRaw, team] = await Promise.all([
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/stats/`, 5 * 60_000), [] as unknown[]),
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/career/`, 30 * 60_000), [] as unknown[]),
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/transfers/`, 30 * 60_000), [] as unknown[]),
        raw.current_team_id ? soft(getTeamListItem(raw.current_team_id), null) : Promise.resolve(null),
    ]);

    const asRows = (x: { results?: unknown[] } | unknown[]): Record<string, unknown>[] =>
        (Array.isArray(x) ? x : (x.results ?? [])) as Record<string, unknown>[];

    const stats: PlayerStatLine[] = asRows(statsRaw).slice(0, 15).map((r) => ({
        competition: nameOf(r.competition) ?? nameOf(r.league),
        season: nameOf(r.season),
        appearances: n(r.appearances ?? r.matches ?? r.games),
        goals: n(r.goals),
        assists: n(r.assists),
        minutes: n(r.minutes ?? r.minutes_played),
        yellow: n(r.yellow_cards ?? r.yellow),
        red: n(r.red_cards ?? r.red),
        rating: n(r.rating ?? r.avg_rating),
    }));
    const career: CareerEntry[] = asRows(careerRaw).map((r) => ({
        team: nameOf(r.team) ?? s(r.team_name),
        from: s(r.from ?? r.start_date ?? r.season_start),
        to: s(r.to ?? r.end_date ?? r.season_end),
        appearances: n(r.appearances ?? r.matches),
        goals: n(r.goals),
    }));
    const transfers: TransferEntry[] = asRows(transfersRaw).map((r) => ({
        date: s(r.date ?? r.transfer_date),
        from: nameOf(r.from) ?? nameOf(r.from_team),
        to: nameOf(r.to) ?? nameOf(r.to_team),
        fee: s(r.fee ?? r.fee_text),
        type: s(r.type ?? r.transfer_type),
    }));

    return {
        ...toPlayerListItem(raw),
        dateOfBirth: s(raw.date_of_birth),
        heightCm: raw.height_cm ?? null,
        weightKg: raw.weight_kg ?? null,
        preferredFoot: s(raw.preferred_foot),
        nationalTeamId: raw.national_team_id ?? null,
        contractUntil: s(raw.contract_until),
        availability: s(raw.availability),
        potential: n(raw.potential),
        injuryRisk: s(raw.injury_risk),
        wageEurAnnual: raw.wage_eur_annual ?? null,
        strengths: arr(raw.strengths),
        weaknesses: arr(raw.weaknesses),
        attributes: raw.attributes ?? null,
        team,
        stats,
        career,
        transfers,
    };
}

// ---------- teams ----------

export async function listTeams(opts: { name?: string; limit?: number; offset?: number }): Promise<Paged<TeamListItem>> {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    q.set('limit', String(opts.limit ?? 30));
    q.set('offset', String(opts.offset ?? 0));
    const data = await get<{ count?: number; results?: RawTeam[] }>(`/teams/?${q.toString()}`, 5 * 60_000);
    return { count: data.count ?? 0, results: (data.results ?? []).map(toTeamListItem) };
}

async function getTeamListItem(id: number): Promise<TeamListItem | null> {
    try {
        const raw = await get<RawTeam>(`/teams/${id}/`, 10 * 60_000);
        return raw?.id ? toTeamListItem(raw) : null;
    } catch {
        return null;
    }
}

export async function getTeam(id: number): Promise<TeamDetail | null> {
    let raw: RawTeam;
    try {
        raw = await get<RawTeam>(`/teams/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;

    const [squadRaw, fixturesRaw, venue] = await Promise.all([
        soft(get<{ players?: Record<string, unknown>[] }>(`/teams/${id}/squad/`, 10 * 60_000), { players: [] }),
        soft(get<{ results?: RawEvent[] } | RawEvent[]>(`/teams/${id}/fixtures/`, 2 * 60_000), [] as RawEvent[]),
        raw.venue_id ? soft(getVenue(raw.venue_id), null) : Promise.resolve(null),
    ]);

    const squad: SquadPlayer[] = (squadRaw.players ?? []).map((p) => ({
        id: Number(p.id ?? p.player_id),
        name: String(p.name ?? ''),
        position: s(p.position ?? p.specific_position),
        jerseyNumber: s(p.jersey_number),
        nationality: s(p.nationality),
        marketValueEur: (p.market_value_eur as number) ?? null,
    })).filter((p) => p.id && p.name);

    const fxArr = Array.isArray(fixturesRaw) ? fixturesRaw : (fixturesRaw.results ?? []);
    const fixtures: TeamFixture[] = fxArr.map(toFixture);

    return { ...toTeamListItem(raw), venue, squad, fixtures };
}

// ---------- match-center v2 extras (shotmap / momentum / prediction / h2h) ----------

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function normalizeExtras(stats: Record<string, unknown>, pred: Record<string, unknown>, h2h: Record<string, unknown>): MatchExtras {
    // shotmap
    const shotmap: MCShot[] = (Array.isArray(stats.shotmap) ? stats.shotmap : []).map((raw) => {
        const s0 = raw as Record<string, unknown>;
        const pos = (s0.pos as { x?: number; y?: number }) ?? {};
        return {
            x: clamp(n(pos.x) ?? 0, 0, 100),
            y: clamp(n(pos.y) ?? 0, 0, 100),
            xg: n(s0.xg) ?? 0,
            home: s0.home === true,
            isGoal: String(s0.type) === 'goal',
            minute: n(s0.min),
            player: null,
            playerId: n(s0.player_id),
            body: s(s0.body),
            situation: s(s0.sit),
        };
    });

    // momentum
    const momentum: MCMomentum[] = (Array.isArray(stats.momentum) ? stats.momentum : []).map((raw) => {
        const m0 = raw as Record<string, unknown>;
        return { minute: n(m0.m) ?? 0, value: n(m0.v) ?? 0 };
    });

    // ML prediction
    const markets = (pred.markets as Record<string, Record<string, unknown>>) ?? {};
    const mr = markets.match_result ?? {};
    const eg = markets.expected_goals ?? {};
    const ou = markets.over_under ?? {};
    const btts = markets.btts ?? {};
    const score = markets.score ?? {};
    const model = (pred.model as { confidence?: number }) ?? {};
    const predictedRaw = s(mr.predicted);
    const mlPrediction: MLPrediction | null = mr.prob_home != null || mr.prob_away != null
        ? {
              probHome: Math.round(n(mr.prob_home) ?? 0),
              probDraw: Math.round(n(mr.prob_draw) ?? 0),
              probAway: Math.round(n(mr.prob_away) ?? 0),
              predicted: predictedRaw === 'H' || predictedRaw === 'D' || predictedRaw === 'A' ? predictedRaw : null,
              expGoalsHome: n(eg.home),
              expGoalsAway: n(eg.away),
              over15: n(ou.prob_over_15),
              over25: n(ou.prob_over_25),
              over35: n(ou.prob_over_35),
              bttsYes: n(btts.prob_yes),
              mostLikelyScore: s(score.most_likely),
              confidence: model.confidence != null ? Math.round(n(model.confidence)! * 100) : null,
          }
        : null;

    // head-to-head
    const total = n(h2h.total_matches) ?? 0;
    const h2hSummary: H2HSummary | null = total > 0
        ? {
              total,
              homeWins: n(h2h.home_wins) ?? 0,
              draws: n(h2h.draws) ?? 0,
              awayWins: n(h2h.away_wins) ?? 0,
              homeGoals: n(h2h.home_goals) ?? 0,
              awayGoals: n(h2h.away_goals) ?? 0,
              recent: (Array.isArray(h2h.recent_matches) ? h2h.recent_matches : []).slice(0, 6).map((raw) => {
                  const r = raw as Record<string, unknown>;
                  return {
                      home: String(r.home_team ?? r.home ?? ''),
                      away: String(r.away_team ?? r.away ?? ''),
                      homeScore: n(r.home_score),
                      awayScore: n(r.away_score),
                      date: s(r.date ?? r.event_date),
                  };
              }),
          }
        : null;

    return { mlPrediction, momentum, shotmap, h2h: h2hSummary };
}

/** Fetch and normalise the v2 spatial/predictive extras for an event id. */
export async function getEventExtras(id: number): Promise<MatchExtras> {
    const empty: MatchExtras = { mlPrediction: null, momentum: [], shotmap: [], h2h: null };
    if (!TOKEN) return empty;
    const [stats, pred, h2h] = await Promise.all([
        soft(get<Record<string, unknown>>(`/events/${id}/stats/`, 20_000), {}),
        soft(get<Record<string, unknown>>(`/events/${id}/prediction/`, 5 * 60_000), {}),
        soft(get<Record<string, unknown>>(`/events/${id}/h2h/`, 30 * 60_000), {}),
    ]);
    return normalizeExtras(stats, pred, h2h);
}

async function getVenue(id: number): Promise<Venue | null> {
    try {
        const raw = await get<{ id: number; name: string; city?: string; country?: string; capacity?: number; built_year?: number }>(`/venues/${id}/`, 30 * 60_000);
        return raw?.id ? { id: raw.id, name: raw.name, city: s(raw.city), country: s(raw.country), capacity: raw.capacity ?? null, builtYear: raw.built_year ?? null } : null;
    } catch {
        return null;
    }
}

// ---------- World Cup 2026 ----------

const WC_SEASON_ID = 188;
const WC_LIVE = new Set(['1st_half', '2nd_half', 'ht', 'halftime', 'extra_time', 'penalties', 'live']);

/** WC 2026 fixtures + a slice of the qualified-squads list, for the hub page. */
export async function getWorldCup(): Promise<WorldCup> {
    const empty: WorldCup = { fixtures: [], squads: [] };
    if (!TOKEN) return empty;

    const [fxRaw, sqRaw] = await Promise.all([
        soft(get<{ results?: Record<string, unknown>[] }>(`/events/?season_id=${WC_SEASON_ID}&limit=200`, 60_000), { results: [] }),
        soft(get<{ results?: Record<string, unknown>[] }>(`/worldcup/squads/?limit=200`, 30 * 60_000), { results: [] }),
    ]);

    const fixtures: WCFixture[] = (fxRaw.results ?? []).map((e) => {
        const status = String(e.status ?? '');
        return {
            id: Number(e.id),
            homeTeam: String(e.home_team ?? 'TBD'),
            awayTeam: String(e.away_team ?? 'TBD'),
            homeTeamId: (e.home_team_id as number) ?? (e.home_team_obj as { id?: number })?.id ?? null,
            awayTeamId: (e.away_team_id as number) ?? (e.away_team_obj as { id?: number })?.id ?? null,
            homeScore: n(e.home_score),
            awayScore: n(e.away_score),
            date: s(e.event_date),
            status: s(e.status),
            round: s(e.round_name),
            live: WC_LIVE.has(status),
        };
    });

    // group squad players by team
    const byTeam = new Map<number, WCSquadPlayer[]>();
    for (const raw of sqRaw.results ?? []) {
        const teamId = Number(raw.team_id);
        if (!teamId) continue;
        const list = byTeam.get(teamId) ?? [];
        list.push({
            playerId: n(raw.player_id),
            name: String(raw.name ?? ''),
            position: s(raw.position),
            jerseyNumber: s(raw.jersey_number),
            club: s(raw.club),
            caps: n(raw.caps),
            goals: n(raw.goals),
            age: n(raw.age),
        });
        byTeam.set(teamId, list);
    }
    const squads = [...byTeam.entries()].map(([teamId, players]) => ({ teamId, players }));

    return { fixtures, squads };
}

// ---------- managers / referees / venues (detail) ----------

export async function getManager(id: number): Promise<ManagerDetail | null> {
    let raw: Record<string, unknown>;
    try {
        raw = await get<Record<string, unknown>>(`/managers/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;
    const team = raw.current_team_id ? await soft(getTeamListItem(Number(raw.current_team_id)), null) : null;
    return {
        id: Number(raw.id),
        name: String(raw.name ?? ''),
        country: s(raw.country),
        tacticalProfile: s(raw.tactical_profile),
        preferredFormation: s(raw.preferred_formation),
        currentTeamId: (raw.current_team_id as number) ?? null,
        matchesTotal: n(raw.matches_total),
        wins: n(raw.wins),
        draws: n(raw.draws),
        losses: n(raw.losses),
        winPct: n(raw.win_pct),
        avgGoalsScored: n(raw.avg_goals_scored),
        avgGoalsConceded: n(raw.avg_goals_conceded),
        avgPossession: n(raw.avg_possession),
        cleanSheetPct: n(raw.clean_sheet_pct),
        team,
    };
}

export async function getReferee(id: number): Promise<RefereeDetail | null> {
    let raw: Record<string, unknown>;
    try {
        raw = await get<Record<string, unknown>>(`/referees/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;
    return {
        id: Number(raw.id),
        name: String(raw.name ?? ''),
        country: s(raw.country),
        matches: n(raw.matches),
        totalYellow: n(raw.total_yellow_cards),
        totalRed: n(raw.total_red_cards),
        avgYellowPerMatch: n(raw.avg_yellow_per_match),
        avgRedPerMatch: n(raw.avg_red_per_match),
        avgFoulsPerMatch: n(raw.avg_fouls_per_match),
        avgGoalsPerMatch: n(raw.avg_goals_per_match),
        careerGames: n(raw.career_games),
    };
}

export async function getVenueDetail(id: number): Promise<VenueDetail | null> {
    let raw: Record<string, unknown>;
    try {
        raw = await get<Record<string, unknown>>(`/venues/${id}/`, 30 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;
    return {
        id: Number(raw.id),
        name: String(raw.name ?? ''),
        city: s(raw.city),
        country: s(raw.country),
        capacity: (raw.capacity as number) ?? null,
        builtYear: (raw.built_year as number) ?? null,
        countryCode: s(raw.country_code),
        latitude: n(raw.latitude),
        longitude: n(raw.longitude),
        pitchLengthM: n(raw.pitch_length_m),
        pitchWidthM: n(raw.pitch_width_m),
        homeTeamId: (raw.home_team_id as number) ?? null,
    };
}
