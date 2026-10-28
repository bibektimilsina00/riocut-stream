/**
 * One registry for every sport we surface: label, look, ESPN mapping and any
 * sport-only sections. Adding a sport = one entry here; the hub pages, nav
 * strip, tiles and league pages all read from it.
 */

export interface SportSection {
    href: string;
    label: string;
}

export interface SportMeta {
    /** Our stream category (provider slug), also the /sports/<category> route. */
    category: string;
    label: string;
    emoji: string;
    /** Tailwind gradient classes (from/via/to). */
    gradient: string;
    /** Glow color for hover ring. */
    glow: string;
    /** ESPN sport path segment, when ESPN has fixtures/standings for it. */
    espn?: string;
    /** Extra hub tabs that only exist for this sport. */
    sections?: SportSection[];
}

const look = (from: string, glow: string) => ({ gradient: `${from} via-gray-900 to-gray-950`, glow });

/** Display order = priority on the homepage, nav strip and schedule. */
export const SPORTS: SportMeta[] = [
    {
        category: 'football', label: 'Football', emoji: '⚽', espn: 'soccer', ...look('from-emerald-500/25', 'group-hover:shadow-emerald-500/30'),
        sections: [
            { href: '/teams', label: 'Teams' },
            { href: '/players', label: 'Players' },
            { href: '/worldcup', label: 'World Cup' },
        ],
    },
    { category: 'cricket', label: 'Cricket', emoji: '🏏', espn: 'cricket', ...look('from-teal-500/25', 'group-hover:shadow-teal-500/30') },
    { category: 'basketball', label: 'Basketball', emoji: '🏀', espn: 'basketball', ...look('from-orange-500/25', 'group-hover:shadow-orange-500/30') },
    { category: 'american-football', label: 'American Football', emoji: '🏈', espn: 'football', ...look('from-amber-600/25', 'group-hover:shadow-amber-600/30') },
    { category: 'fight', label: 'UFC / MMA', emoji: '🥊', espn: 'mma', ...look('from-red-500/25', 'group-hover:shadow-red-500/30') },
    { category: 'motor-sports', label: 'Motorsport', emoji: '🏎️', espn: 'racing', ...look('from-red-600/25', 'group-hover:shadow-red-600/30') },
    { category: 'tennis', label: 'Tennis', emoji: '🎾', espn: 'tennis', ...look('from-lime-500/25', 'group-hover:shadow-lime-500/30') },
    { category: 'hockey', label: 'Hockey', emoji: '🏒', espn: 'hockey', ...look('from-cyan-500/25', 'group-hover:shadow-cyan-500/30') },
    { category: 'baseball', label: 'Baseball', emoji: '⚾', espn: 'baseball', ...look('from-rose-500/25', 'group-hover:shadow-rose-500/30') },
    { category: 'rugby', label: 'Rugby', emoji: '🏉', ...look('from-yellow-600/25', 'group-hover:shadow-yellow-600/30') },
    { category: 'golf', label: 'Golf', emoji: '⛳', ...look('from-green-500/25', 'group-hover:shadow-green-500/30') },
    { category: 'afl', label: 'AFL', emoji: '🏉', ...look('from-pink-500/25', 'group-hover:shadow-pink-500/30') },
    { category: 'darts', label: 'Darts', emoji: '🎯', ...look('from-fuchsia-500/25', 'group-hover:shadow-fuchsia-500/30') },
    { category: 'billiards', label: 'Billiards', emoji: '🎱', ...look('from-cyan-500/25', 'group-hover:shadow-cyan-500/30') },
];

/** Registry entry, or a generic one so unknown provider sports still render. */
export function sportMeta(category: string): SportMeta {
    return SPORTS.find((s) => s.category === category) ?? {
        category,
        label: category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        emoji: '🏆',
        ...look('from-teal-500/25', 'group-hover:shadow-teal-500/30'),
    };
}

export function sportByEspn(key: string): SportMeta | undefined {
    return SPORTS.find((s) => s.espn === key);
}

/** Sort key for a category: registry order, unknown sports last. */
export function sportRank(category: string): number {
    const i = SPORTS.findIndex((s) => s.category === category);
    return i === -1 ? SPORTS.length : i;
}

// Football-only data pages (BSD) that live outside /sports/football.
const FOOTBALL_PAGES = /^\/(teams|players|worldcup|managers|referees|venues)(\/|$)/;

/**
 * Which sport the current page belongs to, so the global nav can scope
 * Schedule / Leagues to it. null = all-sports context.
 */
export function sportFromPath(pathname: string | null): string | null {
    if (!pathname) return null;
    const m = pathname.match(/^\/(?:sports|match)\/([^/]+)/);
    if (m) return decodeURIComponent(m[1]);
    const l = pathname.match(/^\/leagues\/([^/]+)\//);
    if (l) return sportByEspn(l[1])?.category ?? null;
    if (FOOTBALL_PAGES.test(pathname)) return 'football';
    return null;
}
