'use client';

import Link from 'next/link';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive, sortMatches, type Match } from '@/lib/sportsrc';
import { sportMeta, sportRank } from '@/lib/sports';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { Activity, Flame, FlameKindling } from 'lucide-react';

// 'live' is every provider's all-sports bucket, so one query feeds every row
// and big matches from any sport compete on the same popularity ranking.
const ALL = 'live';
const TOP_LIVE = 8;
// Keeps one sport's busy evening from filling the whole "Live now" row.
const PER_SPORT_CAP = 3;
const RAIL_SIZE = 4;

const key = (m: Match) => `${m.category}-${m.id}`;

/** Top live matches, at most PER_SPORT_CAP per sport unless there's room left. */
function pickTopLive(live: Match[]): Match[] {
    const counts = new Map<string, number>();
    const picked = live.filter((m) => {
        const n = counts.get(m.category) ?? 0;
        counts.set(m.category, n + 1);
        return n < PER_SPORT_CAP;
    }).slice(0, TOP_LIVE);
    const taken = new Set(picked.map(key));
    return sortMatches([...picked, ...live.filter((m) => !taken.has(key(m)))].slice(0, TOP_LIVE));
}

function Grid({ items }: { items: Match[] }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => <MatchCard key={key(m)} match={m} category={m.category} />)}
        </div>
    );
}

function SportRail({ category, matches, liveCount }: { category: string; matches: Match[]; liveCount: number }) {
    const meta = sportMeta(category);
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-xl leading-none" aria-hidden>{meta.emoji}</span>
                <h2 className="text-lg font-semibold text-white">{meta.label}</h2>
                {liveCount > 0 ? (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-300">{liveCount} live</span>
                ) : null}
                <Link href={`/sports/${encodeURIComponent(category)}`} className="ml-auto shrink-0 text-sm text-gray-400 hover:text-teal-400">
                    View all →
                </Link>
            </div>
            <Grid items={matches} />
        </section>
    );
}

export default function HomePage() {
    const { data: matches = [], isLoading } = useMatchesByCategory(ALL);
    const now = Date.now();
    const live = sortMatches(matches.filter(isMatchLive));
    const topLive = pickTopLive(live);
    const shown = new Set(topLive.map(key));

    // One rail per sport: its live matches not already featured, then what's next.
    const bySport = new Map<string, Match[]>();
    for (const m of sortMatches(matches)) {
        if (shown.has(key(m)) || !(isMatchLive(m) || (m.date ?? 0) > now)) continue;
        (bySport.get(m.category) ?? bySport.set(m.category, []).get(m.category)!).push(m);
    }
    const rails = [...bySport.entries()].sort((a, b) => sportRank(a[0]) - sportRank(b[0]));
    const liveBySport = (c: string) => live.filter((m) => m.category === c).length;

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <section className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-teal-500/10 via-gray-900 to-gray-950 p-6 md:p-8">
                <div className="max-w-2xl space-y-2">
                    <p className="text-xs uppercase tracking-widest text-teal-400">RioSports</p>
                    <h1 className="text-2xl font-bold tracking-tight md:text-4xl text-white">
                        Live sports streaming, schedules & stats.
                    </h1>
                    <p className="text-sm md:text-base text-gray-400">
                        Football, cricket, basketball, F1, UFC and more. Pick a sport above for its fixtures, leagues and standings.
                    </p>
                </div>
                <Activity className="absolute -bottom-6 -right-6 h-48 w-48 text-teal-500/10" />
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    <h2 className="text-xl font-semibold text-white">Live now</h2>
                    {live.length > 0 ? <span className="text-xs text-gray-500">({live.length})</span> : null}
                </div>
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-52 rounded-xl bg-gray-900 animate-pulse" />)}
                    </div>
                ) : topLive.length > 0 ? (
                    <Grid items={topLive} />
                ) : (
                    <EmptyState Icon={FlameKindling} title="Nothing live right now" description="Here's what's coming up next in each sport." />
                )}
            </section>

            {rails.map(([category, items]) => (
                <SportRail key={category} category={category} matches={items.slice(0, RAIL_SIZE)} liveCount={liveBySport(category)} />
            ))}
        </div>
    );
}
