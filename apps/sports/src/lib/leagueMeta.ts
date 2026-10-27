/**
 * Static metadata for the league codes returned by sportsrc.
 *
 * sportsrc only returns `{ id, name }` from `?data=results&category=leagues`.
 * Everything else (country, flag, badge URL, tier) is enriched here so the
 * Leagues page can render rich cards without burning an extra round-trip per
 * league.
 *
 * Emblem URLs follow the public CDN pattern that the standings response uses
 * (`https://sportsrc.org/img/score/{ID}.png`), so we construct them from the
 * league id rather than maintaining a second image source of truth.
 */

export type LeagueTier = 'european-top' | 'european-secondary' | 'international' | 'other';

export interface LeagueMeta {
    country: string;
    flag: string; // emoji
    /** Tailwind gradient pair used as the card background. */
    gradient: string;
    /** A small tagline shown under the league name (e.g. "Top flight"). */
    tagline: string;
    tier: LeagueTier;
    /** Optional explicit emblem override; falls back to /img/score/{id}.png. */
    emblem?: string;
}

export const LEAGUES: Record<string, LeagueMeta> = {
    // ---------- Top European ----------
    PL: {
        country: 'England',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        gradient: 'from-purple-500/30 via-teal-500/15 to-gray-950',
        tagline: 'Top flight · 38 matchdays',
        tier: 'european-top',
    },
    PD: {
        country: 'Spain',
        flag: '🇪🇸',
        gradient: 'from-orange-500/25 via-rose-500/15 to-gray-950',
        tagline: 'La Liga · 38 matchdays',
        tier: 'european-top',
    },
    SA: {
        country: 'Italy',
        flag: '🇮🇹',
        gradient: 'from-emerald-500/25 via-teal-500/15 to-gray-950',
        tagline: 'Serie A · 38 matchdays',
        tier: 'european-top',
    },
    BL1: {
        country: 'Germany',
        flag: '🇩🇪',
        gradient: 'from-yellow-500/25 via-red-500/15 to-gray-950',
        tagline: 'Bundesliga · 34 matchdays',
        tier: 'european-top',
    },
    FL1: {
        country: 'France',
        flag: '🇫🇷',
        gradient: 'from-sky-500/25 via-cyan-500/15 to-gray-950',
        tagline: 'Ligue 1 · 34 matchdays',
        tier: 'european-top',
    },

    // ---------- European secondary / other domestic ----------
    DED: {
        country: 'Netherlands',
        flag: '🇳🇱',
        gradient: 'from-orange-400/25 via-gray-800 to-gray-950',
        tagline: 'Eredivisie · 34 matchdays',
        tier: 'european-secondary',
    },
    PPL: {
        country: 'Portugal',
        flag: '🇵🇹',
        gradient: 'from-green-500/25 via-red-500/15 to-gray-950',
        tagline: 'Primeira Liga · 34 matchdays',
        tier: 'european-secondary',
    },
    ELC: {
        country: 'England',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        gradient: 'from-cyan-500/25 via-gray-800 to-gray-950',
        tagline: 'Championship · 2nd tier',
        tier: 'european-secondary',
    },
    BSA: {
        country: 'Brazil',
        flag: '🇧🇷',
        gradient: 'from-yellow-500/25 via-green-500/15 to-gray-950',
        tagline: 'Brasileirão Série A',
        tier: 'other',
    },

    // ---------- International / Cup ----------
    CL: {
        country: 'Europe',
        flag: '🏆',
        gradient: 'from-teal-600/30 via-cyan-500/20 to-gray-950',
        tagline: 'Champions League · UEFA',
        tier: 'international',
    },
    WC: {
        country: 'Worldwide',
        flag: '🌍',
        gradient: 'from-emerald-500/30 via-cyan-500/15 to-gray-950',
        tagline: 'FIFA World Cup',
        tier: 'international',
    },
    EC: {
        country: 'Europe',
        flag: '🇪🇺',
        gradient: 'from-teal-500/30 via-yellow-500/10 to-gray-950',
        tagline: 'European Championship · UEFA',
        tier: 'international',
    },
};

export const FALLBACK_META: LeagueMeta = {
    country: 'International',
    flag: '🏟️',
    gradient: 'from-teal-500/20 via-gray-900 to-gray-950',
    tagline: 'Top competition',
    tier: 'other',
};

export const TIER_LABELS: Record<LeagueTier, { title: string; description: string }> = {
    'european-top': {
        title: 'Top European Leagues',
        description: 'The five most-watched domestic leagues in world football.',
    },
    'european-secondary': {
        title: 'More Domestic Leagues',
        description: 'Other top flights and second-tier competitions.',
    },
    international: {
        title: 'International & Cup',
        description: 'Tournaments and cup competitions across confederations.',
    },
    other: {
        title: 'Other Leagues',
        description: 'Additional competitions tracked by Riocut Sports.',
    },
};

export function getLeagueMeta(id: string): LeagueMeta {
    return LEAGUES[id] ?? FALLBACK_META;
}

export function getEmblemUrl(id: string): string {
    return LEAGUES[id]?.emblem ?? `https://sportsrc.org/img/score/${encodeURIComponent(id)}.png`;
}
