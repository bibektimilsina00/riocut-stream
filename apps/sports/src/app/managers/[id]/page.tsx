'use client';

import { use } from 'react';
import Link from 'next/link';
import { useManager } from '@/lib/hooks/useBsd';
import { initials, flagEmoji } from '@/lib/bsd/format';
import { ArrowLeft } from 'lucide-react';

export default function ManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: m, isLoading, error } = useManager(id);

    if (isLoading) return <div className="container mx-auto px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-gray-900" /></div>;
    if (error || !m) return <NotFound />;

    const stats: Array<[string, string | null]> = [
        ['Matches', m.matchesTotal != null ? `${m.matchesTotal}` : null],
        ['Wins', m.wins != null ? `${m.wins}` : null],
        ['Draws', m.draws != null ? `${m.draws}` : null],
        ['Losses', m.losses != null ? `${m.losses}` : null],
        ['Win %', m.winPct != null ? `${Math.round(m.winPct)}%` : null],
        ['Avg goals for', m.avgGoalsScored != null ? m.avgGoalsScored.toFixed(1) : null],
        ['Avg goals against', m.avgGoalsConceded != null ? m.avgGoalsConceded.toFixed(1) : null],
        ['Avg possession', m.avgPossession != null ? `${Math.round(m.avgPossession)}%` : null],
        ['Clean sheets', m.cleanSheetPct != null ? `${Math.round(m.cleanSheetPct)}%` : null],
    ].filter(([, v]) => v) as Array<[string, string]>;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400"><ArrowLeft className="h-3 w-3" /> Back</Link>
            <section className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/25 to-cyan-600/25 text-2xl font-black text-teal-100 ring-1 ring-teal-500/30">{initials(m.name)}</span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Manager</p>
                    <h1 className="text-2xl font-black text-white">{m.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        {m.country ? <span>{flagEmoji(m.country) ? `${flagEmoji(m.country)} ` : ''}{m.country}</span> : null}
                        {m.preferredFormation ? <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{m.preferredFormation}</span> : null}
                        {m.team ? <Link href={`/teams/${m.team.id}`} className="text-teal-400 hover:underline">{m.team.name}</Link> : null}
                    </div>
                </div>
            </section>

            {m.tacticalProfile ? (
                <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4">
                    <h2 className="mb-1 text-sm font-semibold text-white">Tactical profile</h2>
                    <p className="text-sm capitalize text-gray-400">{m.tacticalProfile.replace(/_/g, ' ')}</p>
                </section>
            ) : null}

            {stats.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function NotFound() {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-gray-400">Manager not found.</p>
            <Link href="/" className="mt-3 inline-block text-sm text-teal-400 underline">← Home</Link>
        </div>
    );
}
