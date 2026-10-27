import type { RawEvent } from './client';
import type { MatchCenter, MCIncident, MCPlayer, MCStat, IncidentType } from './types';
import { EMPTY_MATCH_CENTER } from './types';

// BSD status → viewer-friendly label + whether the match is in play.
const LIVE_STATUSES = new Set(['1st_half', '2nd_half', 'ht', 'halftime', 'extra_time', 'penalties', 'live', 'et', 'break']);
const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Scheduled',
    not_started: 'Scheduled',
    '1st_half': '1st Half',
    '2nd_half': '2nd Half',
    ht: 'Half Time',
    halftime: 'Half Time',
    extra_time: 'Extra Time',
    penalties: 'Penalties',
    finished: 'Full Time',
    ft: 'Full Time',
    ended: 'Full Time',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
    abandoned: 'Abandoned',
};

interface LiveStatsSide {
    ball_possession?: number;
    total_shots?: number;
    shots_on_target?: number;
    corner_kicks?: number;
    fouls?: number;
    offsides?: number;
    yellow_cards?: number;
    red_cards?: number;
    accurate_passes?: number;
    passes?: number;
    expected_goals?: number;
    big_chances?: number;
    goalkeeper_saves?: number;
}

function num(v: unknown): number {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(n) ? n : 0;
}

function coachName(obj: unknown): string | null {
    const c = (obj as { coach?: { name?: string } } | undefined)?.coach;
    return c?.name ?? null;
}

function mapPlayer(p: Record<string, unknown>): MCPlayer {
    return {
        id: p.player_id != null ? num(p.player_id) : null,
        name: String(p.name ?? ''),
        number: (p.jersey_number as string) ?? null,
        position: (p.specific_position as string) ?? (p.position as string) ?? null,
        goals: num(p.goals),
        yellow: !!p.yellow_card,
        red: !!p.red_card,
        rating: p.rating != null ? num(p.rating) : null,
    };
}

function buildStats(home?: LiveStatsSide, away?: LiveStatsSide): { stats: MCStat[]; possession: { home: number; away: number } | null } {
    if (!home || !away) return { stats: [], possession: null };
    const pct = (v: unknown) => Math.round(num(v));
    const possession =
        home.ball_possession != null || away.ball_possession != null
            ? { home: pct(home.ball_possession), away: pct(away.ball_possession) }
            : null;

    const rows: Array<[string, unknown, unknown, MCStat['kind']]> = [
        ['Total Shots', home.total_shots, away.total_shots, 'number'],
        ['Shots on Target', home.shots_on_target, away.shots_on_target, 'number'],
        ['Big Chances', home.big_chances, away.big_chances, 'number'],
        ['Expected Goals (xG)', home.expected_goals, away.expected_goals, 'number'],
        ['Corners', home.corner_kicks, away.corner_kicks, 'number'],
        ['Fouls', home.fouls, away.fouls, 'number'],
        ['Offsides', home.offsides, away.offsides, 'number'],
        ['Saves', home.goalkeeper_saves, away.goalkeeper_saves, 'number'],
        ['Passes', home.passes, away.passes, 'number'],
    ];
    const stats: MCStat[] = rows
        .filter(([, h, a]) => h != null || a != null)
        .map(([label, h, a, kind]) => ({ label, home: num(h), away: num(a), kind }));
    return { stats, possession };
}

function mapIncidents(raw: unknown[]): MCIncident[] {
    const out: MCIncident[] = [];
    for (const item of raw) {
        const i = item as Record<string, unknown>;
        const rawType = String(i.type ?? 'other');
        let type: IncidentType = 'other';
        let card: MCIncident['card'] = null;
        let player: string | null = (i.player as string) ?? null;
        let detail: string | null = null;

        switch (rawType) {
            case 'goal':
                type = 'goal';
                detail = i.assist ? `assist ${i.assist}` : (i.goal_type as string) ?? null;
                break;
            case 'substitution':
                type = 'substitution';
                player = (i.player_in as string) ?? null;
                detail = i.player_out ? `for ${i.player_out}` : null;
                break;
            case 'yellowcard':
            case 'yellow_card':
            case 'yellowCard':
                type = 'card';
                card = 'yellow';
                break;
            case 'redcard':
            case 'red_card':
            case 'redCard':
            case 'yellowredcard':
                type = 'card';
                card = 'red';
                break;
            case 'varDecision':
            case 'var':
                type = 'var';
                detail = (i.text as string) ?? (i.decision as string) ?? null;
                break;
            case 'period':
                type = 'period';
                player = null;
                detail = (i.text as string) ?? null;
                break;
            case 'injuryTime':
            case 'injury_time':
                type = 'injuryTime';
                player = null;
                detail = i.added_time != null ? `+${i.added_time} min` : (i.text as string) ?? null;
                break;
            default:
                type = 'other';
                detail = (i.text as string) ?? null;
        }

        out.push({
            minute: i.minute != null ? num(i.minute) : null,
            addedTime: (i.added_time as number) ?? null,
            type,
            side: i.is_home === true ? 'home' : i.is_home === false ? 'away' : null,
            player,
            detail,
            card,
            homeScore: i.home_score != null ? num(i.home_score) : null,
            awayScore: i.away_score != null ? num(i.away_score) : null,
        });
    }
    // Newest first, but keep period/injuryTime markers ordered by minute.
    return out.sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));
}

/** Convert 1X2 decimal odds into normalised win/draw/win percentages. */
function predictionFromOdds(e: RawEvent): MatchCenter['prediction'] {
    const h = num(e.odds_home);
    const d = num(e.odds_draw);
    const a = num(e.odds_away);
    if (h <= 0 || d <= 0 || a <= 0) return null;
    const ih = 1 / h;
    const id = 1 / d;
    const ia = 1 / a;
    const sum = ih + id + ia;
    if (sum <= 0) return null;
    return {
        home: Math.round((ih / sum) * 100),
        draw: Math.round((id / sum) * 100),
        away: Math.round((ia / sum) * 100),
    };
}

export function normalizeMatchCenter(event: RawEvent, incidents: unknown[]): MatchCenter {
    const status = String(event.status ?? 'unknown');
    const live = LIVE_STATUSES.has(status);
    const liveStats = event.live_stats as { home?: LiveStatsSide; away?: LiveStatsSide } | undefined;
    const { stats, possession } = buildStats(liveStats?.home, liveStats?.away);

    const lineupsRaw = event.lineups as
        | { home?: { players?: Record<string, unknown>[]; substitutes?: Record<string, unknown>[] }; away?: { players?: Record<string, unknown>[]; substitutes?: Record<string, unknown>[] } }
        | undefined;
    const lineups = lineupsRaw?.home?.players || lineupsRaw?.away?.players
        ? {
              home: (lineupsRaw?.home?.players ?? []).map(mapPlayer),
              away: (lineupsRaw?.away?.players ?? []).map(mapPlayer),
              homeSubs: (lineupsRaw?.home?.substitutes ?? []).map(mapPlayer),
              awaySubs: (lineupsRaw?.away?.substitutes ?? []).map(mapPlayer),
          }
        : null;

    const venueRaw = event.venue as { id?: number; name?: string; city?: string; capacity?: number } | undefined;
    const refereeRaw = event.referee as { id?: number; name?: string } | undefined;
    const homeTeamId = (event.home_team_obj as { id?: number } | undefined)?.id ?? null;
    const awayTeamId = (event.away_team_obj as { id?: number } | undefined)?.id ?? null;
    const homeForm = event.home_form as { form_string?: string } | undefined;
    const awayForm = event.away_form as { form_string?: string } | undefined;

    return {
        ...EMPTY_MATCH_CENTER,
        found: true,
        eventId: event.id,
        status,
        statusLabel: STATUS_LABELS[status] ?? status.replace(/_/g, ' '),
        live,
        minute: event.current_minute != null ? num(event.current_minute) : null,
        kickoff: (event.event_date as string) ?? null,
        home: {
            name: String(event.home_team ?? 'Home'),
            teamId: homeTeamId,
            score: event.home_score != null ? num(event.home_score) : null,
            htScore: event.home_score_ht != null ? num(event.home_score_ht) : null,
            xg: event.home_xg_live != null ? num(event.home_xg_live) : null,
            coach: coachName(event.home_team_obj) ?? coachName(event.home_coach),
            form: homeForm?.form_string ?? null,
        },
        away: {
            name: String(event.away_team ?? 'Away'),
            teamId: awayTeamId,
            score: event.away_score != null ? num(event.away_score) : null,
            htScore: event.away_score_ht != null ? num(event.away_score_ht) : null,
            xg: event.away_xg_live != null ? num(event.away_xg_live) : null,
            coach: coachName(event.away_team_obj) ?? coachName(event.away_coach),
            form: awayForm?.form_string ?? null,
        },
        venue: venueRaw?.name ? { name: venueRaw.name, city: venueRaw.city ?? null, capacity: venueRaw.capacity ?? null } : null,
        venueId: venueRaw?.id ?? null,
        referee: refereeRaw?.name ?? null,
        refereeId: refereeRaw?.id ?? null,
        possession,
        stats,
        incidents: mapIncidents(incidents),
        lineups,
        prediction: predictionFromOdds(event),
    };
}
