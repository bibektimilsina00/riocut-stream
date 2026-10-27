import type { Match } from './sportsrc';

/**
 * Heuristic "how many people want to watch this" score, used to order match
 * lists. Upstream providers (esportex) never flag `popular`, so without this a
 * third-division kickoff at 18:00 outranks El Clásico at 18:30.
 *
 * ponytail: static name lists. Upgrade path: blend in our own live viewer /
 * watch-room counts once those are aggregated per match.
 */

// First match wins, so more specific names go first.
const LEAGUE_TIERS: Array<[RegExp, number]> = [
    [/champions league|world cup|euro 20\d\d|copa am[eé]rica|super bowl|el cl[aá]sico/i, 70],
    [/indian premier league|\bipl\b|nepal premier league|\bnpl\b|t20 world cup/i, 65],
    [/^(english )?premier league|la ?liga|\bnba\b|\bnfl\b|formula 1|\bf1\b|\bufc\b/i, 60],
    [/serie a|bundesliga|ligue 1|europa league|\bnhl\b|\bmlb\b|big bash|\bbbl\b|pakistan super league|\bpsl\b|the hundred|sa20|motogp/i, 40],
    [/fa cup|carabao|copa del rey|\bmls\b|conference league|nations league|premier league|ranji|sheffield shield|wwe|wrestling/i, 25],
    [/eredivisie|primeira|liga mx|championship|college football|ncaa|allsvenskan/i, 15],
];

// Clubs / franchises that draw a crowd regardless of competition.
const BIG_CLUBS = new RegExp(
    '\\b(' + [
        'real madrid', 'barcelona', 'barca', 'manchester united', 'man utd', 'manchester city', 'man city',
        'liverpool', 'arsenal', 'chelsea', 'tottenham', 'newcastle', 'bayern', 'dortmund', 'psg', 'paris saint',
        'juventus', 'inter', 'ac milan', 'napoli', 'roma', 'lazio', 'atletico', 'benfica', 'porto', 'ajax',
        'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'boca juniors', 'river plate', 'flamengo',
        'al nassr', 'al hilal', 'lakers', 'warriors', 'celtics', 'knicks', 'cowboys', 'chiefs', 'eagles',
    ].join('|') + ')\\b',
    'i',
);

// National sides only count when the whole team name is the nation
// ("India", "India Women", "Nepal U19") — not "New England Revolution".
const NATIONS = new RegExp(
    '^(' + [
        'india', 'pakistan', 'australia', 'england', 'nepal', 'south africa', 'new zealand', 'sri lanka',
        'bangladesh', 'west indies', 'afghanistan', 'argentina', 'brazil', 'portugal', 'france', 'spain',
        'germany', 'italy', 'netherlands', 'usa', 'united states', 'mexico',
    ].join('|') + ')( women| u\\d+| a)?$',
    'i',
);

export function popularityScore(m: Match): number {
    let score = m.popular ? 80 : 0;
    const league = m.league ?? '';
    for (const [re, pts] of LEAGUE_TIERS) {
        if (re.test(league)) { score += pts; break; }
    }
    let big = 0;
    for (const team of [m.teams?.home?.name, m.teams?.away?.name]) {
        const name = (team ?? '').trim();
        if (name && (BIG_CLUBS.test(name) || NATIONS.test(name))) big++;
    }
    score += big * 25;
    return score;
}

/**
 * Popular first, but a big match next week shouldn't bury tonight's games:
 * future kickoffs lose 2 points per hour of wait.
 */
export function rankScore(m: Match, now = Date.now()): number {
    const hoursUntil = Math.max(0, ((m.date ?? now) - now) / 3600_000);
    return popularityScore(m) - hoursUntil * 2;
}
