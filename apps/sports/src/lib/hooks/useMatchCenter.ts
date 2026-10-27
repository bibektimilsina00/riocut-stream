'use client';

import { useQuery } from '@tanstack/react-query';
import type { MatchCenter } from '@/lib/bsd/types';

async function fetchMatchCenter(home: string, away: string, dateMs: number): Promise<MatchCenter> {
    const qs = new URLSearchParams({ home, away, date: String(dateMs) });
    const res = await fetch(`/api/match-center?${qs.toString()}`);
    if (!res.ok) throw new Error(`match-center ${res.status}`);
    return res.json();
}

/**
 * Loads the BSD-backed match-center for a fixture, keyed by team names + date.
 * Polls while the match is live so the score/stats/timeline stay current.
 */
export function useMatchCenter(home: string | undefined, away: string | undefined, dateMs: number | undefined) {
    return useQuery({
        queryKey: ['match-center', home, away, dateMs],
        queryFn: () => fetchMatchCenter(home!, away!, dateMs!),
        enabled: !!home && !!away && !!dateMs,
        staleTime: 15_000,
        refetchInterval: (query) => (query.state.data?.live ? 20_000 : false),
    });
}
