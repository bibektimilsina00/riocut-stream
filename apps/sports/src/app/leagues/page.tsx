'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trophy, Search, X, Globe2, MapPin } from 'lucide-react';
import { useLeagues } from '@/lib/hooks/useSports';
import LeagueCard from '@/components/LeagueCard';
import EmptyState from '@/components/EmptyState';
import { LEAGUES, TIER_LABELS, getLeagueMeta, type LeagueTier } from '@/lib/leagueMeta';
import type { League } from '@/lib/sportsrc';

const FEATURED_IDS = ['PL', 'CL'];
const TIER_ORDER: LeagueTier[] = ['european-top', 'european-secondary', 'international', 'other'];

export default function LeaguesPage() {
    const { data: leagues = [], isLoading, error } = useLeagues();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return leagues;
        return leagues.filter((l) => {
            const meta = getLeagueMeta(l.id);
            return (
                l.name.toLowerCase().includes(q) ||
                l.id.toLowerCase().includes(q) ||
                meta.country.toLowerCase().includes(q) ||
                meta.tagline.toLowerCase().includes(q)
            );
        });
    }, [leagues, query]);

    const featured = filtered.filter((l) => FEATURED_IDS.includes(l.id));
    const remainder = filtered.filter((l) => !FEATURED_IDS.includes(l.id));

    const byTier = useMemo(() => {
        const groups: Record<LeagueTier, League[]> = {
            'european-top': [],
            'european-secondary': [],
            international: [],
            other: [],
        };
        for (const l of remainder) {
            const tier = LEAGUES[l.id]?.tier ?? 'other';
            groups[tier].push(l);
        }
        return groups;
    }, [remainder]);

    const totalLeagues = leagues.length;
    const totalCountries = useMemo(
        () => new Set(leagues.map((l) => getLeagueMeta(l.id).country)).size,
        [leagues],
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-8">
                {/* one subtle radial accent, no full-card gradient */}
                <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" aria-hidden />

                {/* Animated trophy mark — native colour emoji bobs gently. */}
                <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden>
                    <span className="relative block text-[8rem] leading-none animate-trophy-float">
                        🏆
                    </span>
                </div>

                <div className="relative max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-teal-300/90">
                        <Trophy className="h-3 w-3" /> Live tables
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Football Leagues</h1>
                    <p className="text-sm md:text-base text-gray-400 max-w-xl">
                        Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League —
                        full standings, live scores, every fixture, in one place.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Stat icon={Trophy} value={totalLeagues || '—'} label="Leagues" />
                        <Stat icon={Globe2} value={totalCountries || '—'} label="Countries" />
                        <Stat icon={MapPin} value="Live" label="Updates" pulse />
                    </div>
                </div>

                <style jsx>{`
                    @keyframes trophy-float {
                        0%, 100% { transform: translateY(0) rotate(-2deg); }
                        50%      { transform: translateY(-6px) rotate(2deg); }
                    }
                    .animate-trophy-float { animation: trophy-float 5s ease-in-out infinite; transform-origin: center; }
                `}</style>
            </section>

            {/* Search */}
            <section className="space-y-3">
                <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Premier League, Spain, La Liga…"
                        className="block w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                    />
                    {query ? (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </section>

            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    Failed to load leagues. Reload to try again.
                </div>
            ) : null}

            {/* Featured */}
            {featured.length > 0 ? (
                <section className="space-y-4">
                    <header className="space-y-1">
                        <p className="text-xs uppercase tracking-widest text-teal-300/80">Featured</p>
                        <h2 className="text-xl font-bold text-white">Top of the table</h2>
                    </header>
                    <div className="grid gap-4 md:grid-cols-2">
                        {featured.map((l) => (
                            <LeagueCard key={l.id} id={l.id} name={l.name} featured />
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Loading skeletons */}
            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-2xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : null}

            {/* Tiered groups */}
            {!isLoading && !error && totalLeagues > 0 ? (
                <>
                    {TIER_ORDER.map((tier) => {
                        const items = byTier[tier];
                        if (!items || items.length === 0) return null;
                        return (
                            <section key={tier} className="space-y-4">
                                <header className="space-y-1">
                                    <h2 className="text-xl font-bold text-white">{TIER_LABELS[tier].title}</h2>
                                    <p className="text-xs text-gray-500">{TIER_LABELS[tier].description}</p>
                                </header>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map((l) => (
                                        <LeagueCard key={l.id} id={l.id} name={l.name} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </>
            ) : null}

            {/* Empty state when search yields nothing */}
            {!isLoading && filtered.length === 0 ? (
                <EmptyState
                    Icon={Search}
                    title={query ? 'No leagues match that search' : 'No leagues available right now'}
                    description={query ? `Try "Premier League", "Italy", "UEFA" or clear the search.` : 'Reload in a moment — we will retry.'}
                />
            ) : null}

            {/* Footnote / cross-link */}
            <section className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-300">
                        Hunting for a specific match? Use{' '}
                        <Link href="/schedule" className="text-teal-400 hover:text-teal-300 underline-offset-2 hover:underline">
                            the schedule
                        </Link>
                        {' '}or browse{' '}
                        <Link href="/sports" className="text-teal-400 hover:text-teal-300 underline-offset-2 hover:underline">
                            every sport
                        </Link>.
                    </p>
                    <span className="text-[11px] text-gray-500">Data via sportsrc.org · updated automatically</span>
                </div>
            </section>
        </div>
    );
}

function Stat({
    icon: Icon,
    value,
    label,
    pulse,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number | string;
    label: string;
    pulse?: boolean;
}) {
    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2">
            <span className={pulse ? 'relative inline-flex h-2 w-2 items-center justify-center' : 'text-teal-300'}>
                {pulse ? (
                    <>
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400/80" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                    </>
                ) : (
                    <Icon className="h-4 w-4" />
                )}
            </span>
            <span className="text-sm font-bold text-white">{value}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
        </div>
    );
}
