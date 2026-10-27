/**
 * Normalised match-center view model. This is the only shape the UI knows
 * about; the BSD-specific field soup stays behind the normaliser.
 */

export type IncidentType = 'goal' | 'substitution' | 'card' | 'var' | 'period' | 'injuryTime' | 'other';

export interface MCIncident {
    minute: number | null;
    addedTime?: number | null;
    type: IncidentType;
    side: 'home' | 'away' | null;
    /** Primary actor (scorer / player carded / player coming on). */
    player?: string | null;
    /** Secondary detail (assist / player going off / VAR text / period label). */
    detail?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    card?: 'yellow' | 'red' | null;
}

export interface MCStat {
    label: string;
    home: number;
    away: number;
    /** 'percent' renders 0-100 bars; 'number' renders raw counts. */
    kind: 'percent' | 'number';
}

export interface MCPlayer {
    /** BSD player id, when known — enables linking to the player page. */
    id?: number | null;
    name: string;
    number?: string | null;
    position?: string | null;
    goals?: number;
    yellow?: boolean;
    red?: boolean;
    rating?: number | null;
}

export interface MCSide {
    name: string;
    /** BSD team id, when known — enables linking to the team page. */
    teamId: number | null;
    score: number | null;
    htScore: number | null;
    xg: number | null;
    coach: string | null;
    form: string | null;
}

export interface MCShot {
    /** Pitch coordinates 0-100 (x = along length, y = across width). */
    x: number;
    y: number;
    xg: number;
    home: boolean;
    isGoal: boolean;
    minute: number | null;
    player: string | null;
    playerId: number | null;
    body: string | null;
    situation: string | null;
}

export interface MCMomentum {
    minute: number;
    /** Positive = home pressure, negative = away pressure. */
    value: number;
}

export interface MLPrediction {
    probHome: number;
    probDraw: number;
    probAway: number;
    predicted: 'H' | 'D' | 'A' | null;
    expGoalsHome: number | null;
    expGoalsAway: number | null;
    over15: number | null;
    over25: number | null;
    over35: number | null;
    bttsYes: number | null;
    mostLikelyScore: string | null;
    confidence: number | null;
}

export interface H2HSummary {
    total: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    homeGoals: number;
    awayGoals: number;
    recent: Array<{ home: string; away: string; homeScore: number | null; awayScore: number | null; date: string | null }>;
}

export interface MatchExtras {
    mlPrediction: MLPrediction | null;
    momentum: MCMomentum[];
    shotmap: MCShot[];
    h2h: H2HSummary | null;
}

export interface MatchCenter {
    found: boolean;
    eventId: number | null;
    status: string;
    statusLabel: string;
    live: boolean;
    minute: number | null;
    kickoff: string | null;
    home: MCSide;
    away: MCSide;
    venue: { name: string; city: string | null; capacity: number | null } | null;
    venueId: number | null;
    referee: string | null;
    refereeId: number | null;
    possession: { home: number; away: number } | null;
    stats: MCStat[];
    incidents: MCIncident[];
    lineups: { home: MCPlayer[]; away: MCPlayer[]; homeSubs: MCPlayer[]; awaySubs: MCPlayer[] } | null;
    prediction: { home: number; draw: number; away: number } | null;
    /** v2 extras (ML prediction, momentum, shotmap, head-to-head). */
    extras: MatchExtras;
}

export const EMPTY_MATCH_CENTER: MatchCenter = {
    found: false,
    eventId: null,
    status: 'unknown',
    statusLabel: '',
    live: false,
    minute: null,
    kickoff: null,
    home: { name: '', teamId: null, score: null, htScore: null, xg: null, coach: null, form: null },
    away: { name: '', teamId: null, score: null, htScore: null, xg: null, coach: null, form: null },
    venue: null,
    venueId: null,
    referee: null,
    refereeId: null,
    possession: null,
    stats: [],
    incidents: [],
    lineups: null,
    prediction: null,
    extras: { mlPrediction: null, momentum: [], shotmap: [], h2h: null },
};
