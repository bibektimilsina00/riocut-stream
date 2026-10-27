'use client';

import { use } from 'react';
import Link from 'next/link';
import { useScores } from '@/lib/hooks/useSports';
import ScoreboardCard from '@/components/ScoreboardCard';

export default function LeagueScoresPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const { data, isLoading, error } = useScores(code);

    const live = data?.live ?? [];
    const finished = data?.finished ?? [];

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/leagues" className="text-xs text-gray-400 hover:text-teal-400">← Leagues</Link>
                <span className="text-gray-600">/</span>
                <h1 className="text-2xl font-bold text-white">{decodeURIComponent(code)} — Scores</h1>
            </div>

            {data?.last_updated ? (
                <p className="text-xs text-gray-500">Last updated {new Date(data.last_updated).toLocaleString()}</p>
            ) : null}

            {error ? <p className="text-sm text-red-400">Failed to load scores.</p> : null}

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {live.length > 0 ? (
                        <section className="space-y-2">
                            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Live</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {live.map((s, i) => (
                                    <ScoreboardCard key={`live-${i}`} entry={s} />
                                ))}
                            </div>
                        </section>
                    ) : null}
                    {finished.length > 0 ? (
                        <section className="space-y-2">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Finished</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {finished.map((s, i) => (
                                    <ScoreboardCard key={`fin-${i}`} entry={s} />
                                ))}
                            </div>
                        </section>
                    ) : null}
                    {live.length === 0 && finished.length === 0 ? (
                        <p className="text-sm text-gray-400">No recent scores available.</p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
