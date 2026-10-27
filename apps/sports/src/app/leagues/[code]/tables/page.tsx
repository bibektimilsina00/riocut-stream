'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStandings } from '@/lib/hooks/useSports';
import StandingsTable from '@/components/StandingsTable';

export default function LeagueTablesPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const { data, isLoading, error } = useStandings(code);

    const rows = data?.standings?.find((g) => g.type === 'TOTAL')?.table
        ?? data?.standings?.[0]?.table
        ?? [];
    const comp = data?.competition;
    const season = data?.season;

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3 text-sm">
                <Link href="/leagues" className="text-gray-400 hover:text-teal-400">← Leagues</Link>
                <span className="text-gray-600">/</span>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {comp?.emblem ? (
                        <Image src={comp.emblem} alt={comp.name} width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
                    ) : null}
                    {comp?.name ?? decodeURIComponent(code)} — Standings
                </h1>
            </div>
            {season ? (
                <p className="text-xs text-gray-500">
                    Season {season.startDate?.slice(0, 4)}–{season.endDate?.slice(0, 4)} · Matchday {season.currentMatchday}
                </p>
            ) : null}

            {error ? <p className="text-sm text-red-400">Failed to load standings.</p> : null}

            {isLoading ? (
                <div className="h-64 rounded-xl bg-gray-900 animate-pulse" />
            ) : (
                <StandingsTable rows={rows} />
            )}
        </div>
    );
}
