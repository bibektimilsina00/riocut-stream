'use client';

import { use } from 'react';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive, getMatchKickoff, sortMatches } from '@/lib/sportsrc';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { Flame, Clock, CheckCircle2, CalendarOff, FlameKindling, History } from 'lucide-react';
import type { Match } from '@/lib/sportsrc';

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const { data: matches = [], isLoading, error } = useMatchesByCategory(category);

    const live = sortMatches(matches.filter(isMatchLive));
    const upcoming = sortMatches(matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return !k || k.getTime() >= Date.now();
    }));
    const finished = matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return k && k.getTime() < Date.now();
    });

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Sport</p>
                <h1 className="text-3xl font-bold capitalize text-white">{category.replace(/-/g, ' ')}</h1>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                    Failed to load matches. Try again in a moment.
                </div>
            ) : null}

            <Section
                title="Live now"
                count={live.length}
                accent="text-red-400"
                Icon={Flame}
                isLoading={isLoading}
                empty={<EmptyState Icon={FlameKindling} title="Nothing live right now" description="Check back when the next match kicks off — live matches will appear here." />}
            >
                <Grid items={live} category={category} />
            </Section>

            <Section
                title="Upcoming"
                count={upcoming.length}
                accent="text-teal-400"
                Icon={Clock}
                isLoading={isLoading}
                empty={<EmptyState Icon={CalendarOff} title="No upcoming matches" description="Schedule looks empty for this sport. Try another sport or check the global schedule." />}
            >
                <Grid items={upcoming} category={category} />
            </Section>

            <Section
                title="Finished"
                count={finished.length}
                accent="text-gray-400"
                Icon={CheckCircle2}
                isLoading={isLoading}
                empty={<EmptyState Icon={History} title="No recent results" description="Past results will show up here once matches wrap up." />}
            >
                <Grid items={finished} category={category} />
            </Section>
        </div>
    );
}

function Section({
    title, count, accent, Icon, isLoading, empty, children,
}: {
    title: string;
    count: number;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
    isLoading: boolean;
    empty: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-baseline gap-2">
                <Icon className={`h-5 w-5 ${accent}`} />
                <h2 className={`text-xl font-semibold ${accent}`}>{title}</h2>
                <span className="text-xs text-gray-500">({count})</span>
            </div>
            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-52 rounded-xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : count === 0 ? (
                empty
            ) : (
                children
            )}
        </section>
    );
}

function Grid({ items, category }: { items: Match[]; category: string }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
                <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
            ))}
        </div>
    );
}
