'use client';

import Link from 'next/link';
import { useSportsCategories, useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive, sortMatches } from '@/lib/sportsrc';
import MatchCard from '@/components/MatchCard';
import SportsTile from '@/components/SportsTile';
import { Activity, Flame } from 'lucide-react';

const FEATURED_CATEGORIES = ['football', 'basketball', 'ufc', 'mma'];

function LiveSection({ category }: { category: string }) {
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const live = sortMatches(matches.filter(isMatchLive));
    if (isLoading || live.length === 0) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold capitalize">{category} — Live now</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {live.slice(0, 4).map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

function UpcomingSection({ category }: { category: string }) {
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const upcoming = sortMatches(matches.filter((m) => !isMatchLive(m))).slice(0, 4);
    if (isLoading || upcoming.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold capitalize">{category} — Upcoming</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcoming.map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

export default function HomePage() {
    const { data: sports = [], isLoading } = useSportsCategories();

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <section className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-teal-500/10 via-gray-900 to-gray-950 p-8">
                <div className="max-w-2xl space-y-3">
                    <p className="text-xs uppercase tracking-widest text-teal-400">Riocut Sports</p>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                        Live sports streaming, schedules & stats.
                    </h1>
                    <p className="text-gray-400">
                        Football, basketball, UFC, MMA and more. Watch live matches, follow standings, and never miss a game.
                    </p>
                </div>
                <Activity className="absolute -bottom-6 -right-6 h-48 w-48 text-teal-500/10" />
            </section>

            {FEATURED_CATEGORIES.map((cat) => (
                <LiveSection key={`live-${cat}`} category={cat} />
            ))}

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Browse Sports</h2>
                    <Link href="/sports" className="text-sm text-gray-400 hover:text-teal-400">View all →</Link>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 rounded-xl bg-gray-900 animate-pulse" />
                        ))
                        : sports.slice(0, 12).map((s, i) => (
                            <SportsTile key={(s.id ?? s.name ?? i).toString()} sport={s} />
                        ))}
                </div>
            </section>

            {FEATURED_CATEGORIES.map((cat) => (
                <UpcomingSection key={`up-${cat}`} category={cat} />
            ))}
        </div>
    );
}

