'use client';

import { use } from 'react';
import Link from 'next/link';
import { useReferee } from '@/lib/hooks/useBsd';
import { initials, flagEmoji } from '@/lib/bsd/format';
import { ArrowLeft } from 'lucide-react';

export default function RefereeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: r, isLoading, error } = useReferee(id);

    if (isLoading) return <div className="container mx-auto px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-gray-900" /></div>;
    if (error || !r) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400">Referee not found.</p>
                <Link href="/" className="mt-3 inline-block text-sm text-teal-400 underline">← Home</Link>
            </div>
        );
    }

    const stats: Array<[string, string | null]> = [
        ['Matches', r.matches != null ? `${r.matches}` : null],
        ['Career games', r.careerGames != null ? `${r.careerGames}` : null],
        ['Yellow cards', r.totalYellow != null ? `${r.totalYellow}` : null],
        ['Red cards', r.totalRed != null ? `${r.totalRed}` : null],
        ['Yellows / match', r.avgYellowPerMatch != null ? r.avgYellowPerMatch.toFixed(1) : null],
        ['Reds / match', r.avgRedPerMatch != null ? r.avgRedPerMatch.toFixed(2) : null],
        ['Fouls / match', r.avgFoulsPerMatch != null ? r.avgFoulsPerMatch.toFixed(1) : null],
        ['Goals / match', r.avgGoalsPerMatch != null ? r.avgGoalsPerMatch.toFixed(1) : null],
    ].filter(([, v]) => v) as Array<[string, string]>;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400"><ArrowLeft className="h-3 w-3" /> Back</Link>
            <section className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-red-500/20 text-2xl font-black text-yellow-100 ring-1 ring-yellow-500/30">{initials(r.name)}</span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Referee</p>
                    <h1 className="text-2xl font-black text-white">{r.name}</h1>
                    {r.country ? <p className="mt-1 text-sm text-gray-400">{flagEmoji(r.country) ? `${flagEmoji(r.country)} ` : ''}{r.country}</p> : null}
                </div>
            </section>

            {stats.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
                            <p className="mt-1 text-lg font-bold text-white">{value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
