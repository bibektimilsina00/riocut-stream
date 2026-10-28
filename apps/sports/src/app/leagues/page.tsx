'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Search, X, Radio } from 'lucide-react';
import { useLeagues } from '@/lib/hooks/useSports';
import { ESPN_SPORTS } from '@/lib/espn';
import EmptyState from '@/components/EmptyState';
import LeagueGrid from '@/components/LeagueGrid';

export default function LeaguesPage() {
    return (
        <Suspense>
            <LeaguesIndex />
        </Suspense>
    );
}

function LeaguesIndex() {
    const { data: leagues = [], isLoading, error } = useLeagues();
    const router = useRouter();
    const params = useSearchParams();
    const sport = params?.get('sport') ?? ESPN_SPORTS[0].key;
    const [query, setQuery] = useState('');

    const q = query.trim().toLowerCase();
    // A search spans every sport; otherwise show the selected sport's tab.
    const shown = useMemo(
        () => leagues.filter((l) => (q ? l.name.toLowerCase().includes(q) : l.sport === sport)),
        [leagues, q, sport],
    );
    const current = shown.filter((l) => l.current);
    const regular = shown.filter((l) => !l.current);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-5 md:p-8">
                <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" aria-hidden />
                <div className="relative max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-teal-300/90">
                        <Trophy className="h-3 w-3" /> Leagues & tournaments
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Every competition, one place</h1>
                    <p className="text-sm md:text-base text-gray-400 max-w-xl">
                        Fixtures, live scores, standings and points tables for football, cricket, NBA, NFL, F1, UFC and more —
                        with a watch button on every match we stream.
                    </p>
                </div>
            </section>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-1.5" role="tablist">
                    {ESPN_SPORTS.map((s) => (
                        <button
                            key={s.key}
                            role="tab"
                            aria-selected={!q && s.key === sport}
                            onClick={() => { setQuery(''); router.replace(`/leagues?sport=${s.key}`, { scroll: false }); }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!q && s.key === sport
                                ? 'bg-teal-500/20 text-teal-200 border-teal-500/50'
                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search IPL, Premier League, NBA…"
                        className="block w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-9 pr-9 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                    />
                    {query ? (
                        <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" aria-label="Clear search">
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    Failed to load leagues. Reload to try again.
                </div>
            ) : null}

            {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-900 animate-pulse" />)}
                </div>
            ) : (
                <>
                    {current.length > 0 ? (
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Radio className="h-4 w-4 text-red-400" /> On now
                            </h2>
                            <LeagueGrid items={current} />
                        </section>
                    ) : null}
                    {regular.length > 0 ? (
                        <section className="space-y-3">
                            {current.length > 0 ? <h2 className="text-sm font-semibold text-white">Major competitions</h2> : null}
                            <LeagueGrid items={regular} />
                        </section>
                    ) : null}
                    {shown.length === 0 ? (
                        <EmptyState Icon={Trophy} title="No competitions found" description="Try another sport or search term." />
                    ) : null}
                </>
            )}
        </div>
    );
}
