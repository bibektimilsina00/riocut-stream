'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { useSportsCategories, useLeagues, sportsKeys } from '@/lib/hooks/useSports';
import { sportsrc, type Match } from '@/lib/sportsrc';
import SportsTile from '@/components/SportsTile';
import LeagueCard from '@/components/LeagueCard';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

function SearchResults({ q }: { q: string }) {
    const term = q.trim().toLowerCase();
    const enabled = term.length > 0;

    const { data: sports = [], isLoading: sportsLoading } = useSportsCategories();
    const { data: leagues = [], isLoading: leaguesLoading } = useLeagues();

    const matchQueries = useQueries({
        queries: sports.map((s) => ({
            queryKey: sportsKeys.matches(s.id),
            queryFn: () => sportsrc.getMatches(s.id),
            staleTime: 60_000,
            enabled,
        })),
    });

    const matchesLoading = enabled && matchQueries.some((qq) => qq.isLoading);

    const allMatches = useMemo<Array<{ match: Match; category: string }>>(() => {
        const out: Array<{ match: Match; category: string }> = [];
        matchQueries.forEach((qq, idx) => {
            const cat = sports[idx]?.id;
            if (!cat || !qq.data) return;
            for (const m of qq.data) out.push({ match: m, category: cat });
        });
        return out;
    }, [matchQueries, sports]);

    const sportMatches = useMemo(() => sports.filter((s) =>
        (s.name ?? '').toString().toLowerCase().includes(term) ||
        (s.id ?? '').toString().toLowerCase().includes(term),
    ), [sports, term]);

    const leagueMatches = useMemo(() => leagues.filter((l) =>
        (l.name ?? '').toLowerCase().includes(term) ||
        (l.code ?? '').toLowerCase().includes(term) ||
        (l.country ?? '').toLowerCase().includes(term) ||
        (l.id ?? '').toLowerCase().includes(term),
    ), [leagues, term]);

    const matchMatches = useMemo(() => allMatches.filter(({ match: m }) =>
        (m.title ?? '').toLowerCase().includes(term) ||
        (m.teams?.home?.name ?? '').toLowerCase().includes(term) ||
        (m.teams?.away?.name ?? '').toLowerCase().includes(term) ||
        (m.category ?? '').toLowerCase().includes(term),
    ).slice(0, 24), [allMatches, term]);

    const totalCount = sportMatches.length + leagueMatches.length + matchMatches.length;
    const initialLoading = sportsLoading || leaguesLoading;

    if (initialLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading catalog…
            </div>
        );
    }

    if (!initialLoading && totalCount === 0 && !matchesLoading) {
        return (
            <EmptyState
                Icon={SearchIcon}
                title={`No results for "${q}"`}
                description="Try a sport (football, ufc), team name, or league code (EPL, NBA)."
            />
        );
    }

    return (
        <div className="space-y-10">
            {matchMatches.length > 0 ? (
                <section className="space-y-4">
                    <SectionHeader title="Matches" count={matchMatches.length} loading={matchesLoading} />
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {matchMatches.map(({ match, category }) => (
                            <MatchCard key={`${category}:${match.id}`} match={match} category={category} />
                        ))}
                    </div>
                </section>
            ) : null}

            {leagueMatches.length > 0 ? (
                <section className="space-y-4">
                    <SectionHeader title="Leagues" count={leagueMatches.length} />
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {leagueMatches.slice(0, 12).map((l) => (
                            <LeagueCard key={l.id} id={l.id} name={l.name} />
                        ))}
                    </div>
                </section>
            ) : null}

            {sportMatches.length > 0 ? (
                <section className="space-y-4">
                    <SectionHeader title="Sports" count={sportMatches.length} />
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {sportMatches.map((s, i) => (
                            <SportsTile key={(s.id ?? s.name ?? i).toString()} sport={s} />
                        ))}
                    </div>
                </section>
            ) : null}

            {matchesLoading && matchMatches.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching matches across all sports…
                </div>
            ) : null}
        </div>
    );
}

function SectionHeader({ title, count, loading }: { title: string; count: number; loading?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
                {title}
                <span className="ml-2 text-sm font-normal text-gray-400">{count}</span>
            </h2>
            {loading ? (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    more loading
                </span>
            ) : null}
        </div>
    );
}

function SearchInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initial = params?.get('q') ?? '';
    const [q, setQ] = useState(initial);

    useEffect(() => {
        const id = setTimeout(() => {
            const next = q.trim();
            const current = params?.get('q') ?? '';
            if (next === current) return;
            const sp = new URLSearchParams();
            if (next) sp.set('q', next);
            router.replace(sp.toString() ? `/search?${sp.toString()}` : '/search');
        }, 300);
        return () => clearTimeout(id);
    }, [q, params, router]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-white">Search</h1>
                <p className="text-gray-400">Find sports, leagues, teams and matches.</p>
            </div>

            <label className="relative block max-w-xl">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="football, UFC, Real Madrid, EPL…"
                    className="block h-11 w-full rounded-xl border border-gray-800 bg-gray-900 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                />
            </label>

            {q.trim() ? <SearchResults q={q} /> : (
                <p className="text-sm text-gray-400">Start typing to search across sports, leagues, and matches.</p>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-400">Loading…</div>}>
            <SearchInner />
        </Suspense>
    );
}
