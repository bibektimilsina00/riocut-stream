'use client';

import { use } from 'react';
import Link from 'next/link';
import { useTeam } from '@/lib/hooks/useBsd';
import type { TeamDetail, TeamFixture } from '@/lib/bsd/v2-types';
import PlayerCard from '@/components/bsd/PlayerCard';
import { initials, flagEmoji } from '@/lib/bsd/format';
import { ArrowLeft, MapPin, Users } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: t, isLoading, error } = useTeam(id);

    if (isLoading) return <div className="container mx-auto px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-gray-900" /></div>;
    if (error || !t) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400">Team not found.</p>
                <Link href="/teams" className="mt-3 inline-block text-sm text-teal-400 underline">← Back to teams</Link>
            </div>
        );
    }

    const flag = flagEmoji(t.country);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
            <Link href="/teams" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400">
                <ArrowLeft className="h-3 w-3" /> Teams
            </Link>

            <section className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/25 to-cyan-600/25 text-2xl font-black text-teal-100 ring-1 ring-teal-500/30">
                    {initials(t.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black text-white">{t.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        {t.country ? <span>{flag ? `${flag} ` : ''}{t.country}</span> : null}
                        {t.venue ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.venue.name}{t.venue.city ? `, ${t.venue.city}` : ''}</span> : null}
                        {t.venue?.capacity ? <span className="text-gray-500">Cap. {t.venue.capacity.toLocaleString()}</span> : null}
                    </div>
                </div>
            </section>

            {t.squad.length > 0 ? (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-400" />
                        <h2 className="text-lg font-semibold text-white">Squad</h2>
                        <span className="text-xs text-gray-500">{t.squad.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {t.squad.map((pl) => <PlayerCard key={pl.id} player={pl} />)}
                    </div>
                </section>
            ) : null}

            {t.fixtures.length > 0 ? <Fixtures t={t} /> : null}

            {t.squad.length === 0 && t.fixtures.length === 0 ? (
                <p className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">No squad or fixture data available for this team yet.</p>
            ) : null}
        </div>
    );
}

function Fixtures({ t }: { t: TeamDetail }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Fixtures & Results</h2>
            <div className="divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70">
                {t.fixtures.slice(0, 20).map((f) => <FixtureRow key={f.id} f={f} />)}
            </div>
        </section>
    );
}

function FixtureRow({ f }: { f: TeamFixture }) {
    const played = f.homeScore != null && f.awayScore != null;
    const when = f.date ? new Date(f.date) : null;
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5 text-sm">
            <span className="truncate text-right text-gray-200">{f.homeTeam}</span>
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                {played ? `${f.homeScore} - ${f.awayScore}` : (when ? when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'vs')}
            </span>
            <span className="truncate text-gray-200">{f.awayTeam}</span>
        </div>
    );
}
