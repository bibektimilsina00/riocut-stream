'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, Loader2, Radio } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

type LiveMatch = {
    matchKey: string;
    viewers: number;
    bySource: { sourceKey: string; viewers: number }[];
};

function useLiveMatches() {
    return useQuery({
        queryKey: ['admin', 'sports-live'],
        queryFn: async (): Promise<LiveMatch[]> => {
            const r = await fetch('/api/admin/sports/live');
            if (!r.ok) throw new Error('Failed to load live matches');
            return (await r.json()).matches;
        },
        refetchInterval: 15_000,
        staleTime: 10_000,
    });
}

export default function SportsLivePage() {
    const { data: matches, isLoading } = useLiveMatches();
    const totalViewers = matches?.reduce((sum, m) => sum + m.viewers, 0) ?? 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Live Now</h1>
                <p className="text-gray-400 mt-2">Who&apos;s watching, right now, across every live match. Refreshes every 15s.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Live Viewers" value={totalViewers} icon={<Eye size={24} />} color="blue" />
                <StatCard title="Live Matches" value={matches?.length ?? 0} icon={<Radio size={24} />} color="green" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-200">Matches with viewers</div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : !matches?.length ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">Nobody&apos;s watching anything right now.</p>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {matches.map((m) => (
                            <div key={m.matchKey} className="px-4 py-3 hover:bg-gray-800/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-200 font-mono truncate max-w-[60%]">{m.matchKey}</span>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-teal-300">
                                        <Eye size={14} /> {m.viewers}
                                    </span>
                                </div>
                                {m.bySource.length > 1 && (
                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                        {m.bySource.map((s) => (
                                            <span key={s.sourceKey} className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
                                                {s.sourceKey} · {s.viewers}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
