'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ListVideo } from 'lucide-react';

interface WatchlistRow {
    id: string;
    mediaId: number;
    mediaType: string;
    title: string;
    sport?: string | null;
    matchExternalId?: string | null;
    addedAt: string;
}

export default function WatchlistPage() {
    const { data, isLoading } = useQuery<{ items: WatchlistRow[] }>({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const res = await fetch('/api/watchlist');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const matches = (data?.items ?? []).filter((r) => r.mediaType === 'match');

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2">
                <ListVideo className="h-6 w-6 text-teal-400" />
                <h1 className="text-2xl font-bold text-white">Your watchlist</h1>
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : matches.length === 0 ? (
                <p className="text-sm text-gray-400">
                    No saved matches yet. Browse <Link href="/sports" className="text-teal-400 underline hover:text-teal-300">Sports</Link> and tap save on any match.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {matches.map((m) => (
                        <div key={m.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-1 transition-all hover:border-teal-500/40">
                            <p className="text-xs uppercase tracking-wider text-gray-500">{m.sport ?? 'Match'}</p>
                            <p className="font-semibold truncate text-white">{m.title}</p>
                            {m.matchExternalId && m.sport ? (
                                <Link href={`/match/${m.sport}/${m.matchExternalId}`} className="text-xs text-teal-400 underline hover:text-teal-300">Open</Link>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
