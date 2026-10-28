'use client';

import Link from 'next/link';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive, sortMatches, type Match } from '@/lib/sportsrc';
import { sportMeta, sportRank } from '@/lib/sports';
import MatchRow, { RowList, RowSkeleton } from '@/components/MatchRow';
import { Flame } from 'lucide-react';

// 'live' is every provider's all-sports bucket, so one query feeds every row
// and big matches from any sport compete on the same popularity ranking.
const ALL = 'live';
const TOP_LIVE = 8;
// Keeps one sport's busy evening from filling the whole "Live now" list.
const PER_SPORT_CAP = 3;
const PANEL_SIZE = 3;

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

function SportPanel({ category, matches, liveCount }: { category: string; matches: Match[]; liveCount: number }) {
    const meta = sportMeta(category);
    const href = `/sports/${encodeURIComponent(category)}`;
    return (
        <section className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="text-lg leading-none" aria-hidden>{meta.emoji}</span>
                <Link href={href} className="text-base font-semibold text-white hover:text-teal-300">{meta.label}</Link>
                {liveCount > 0 ? (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-300">{liveCount} live</span>
                ) : null}
                <Link href={href} className="ml-auto shrink-0 text-xs text-gray-400 hover:text-teal-400">View all →</Link>
            </div>
            <RowList>
                {matches.map((m) => <MatchRow key={key(m)} match={m} />)}
            </RowList>
        </section>
    );
}

export default function HomePage() {
    const { data: matches = [], isLoading } = useMatchesByCategory(ALL);
    const now = Date.now();
    const live = sortMatches(matches.filter(isMatchLive));
    const topLive = pickTopLive(live);
    const shown = new Set(topLive.map(key));

    // One panel per sport: its live matches not already featured, then what's next.
    const bySport = new Map<string, Match[]>();
    for (const m of sortMatches(matches)) {
        if (shown.has(key(m)) || !(isMatchLive(m) || (m.date ?? 0) > now)) continue;
        (bySport.get(m.category) ?? bySport.set(m.category, []).get(m.category)!).push(m);
    }
    const panels = [...bySport.entries()].sort((a, b) => sportRank(a[0]) - sportRank(b[0]));
    const liveBySport = (c: string) => live.filter((m) => m.category === c).length;

    return (
        <div className="container mx-auto px-4 py-6 space-y-8">
            <h1 className="sr-only">RioSports — live sports streams, scores and schedules</h1>

            <section className="space-y-2">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-white">Live now</h2>
                    {live.length > 0 ? <span className="text-xs text-gray-500">{live.length} matches</span> : null}
                </div>
                {isLoading ? (
                    <RowSkeleton rows={4} />
                ) : topLive.length > 0 ? (
                    // Two lists side by side on desktop; one on phones.
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {[topLive.slice(0, Math.ceil(topLive.length / 2)), topLive.slice(Math.ceil(topLive.length / 2))]
                            .filter((half) => half.length > 0)
                            .map((half, i) => (
                                <RowList key={i}>{half.map((m) => <MatchRow key={key(m)} match={m} />)}</RowList>
                            ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-6 text-center text-sm text-gray-400">
                        Nothing live right now — here&apos;s what&apos;s coming up next.
                    </p>
                )}
            </section>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {panels.map(([category, items]) => (
                        <SportPanel key={category} category={category} matches={items.slice(0, PANEL_SIZE)} liveCount={liveBySport(category)} />
                    ))}
                </div>
            )}
        </div>
    );
}
