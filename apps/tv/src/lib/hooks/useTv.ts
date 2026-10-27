'use client';

import { useQuery } from '@tanstack/react-query';
import type { TvChannel, TvCategory, TvCountry, TvLanguage } from '@riocut/services';

const DAY = 86400_000;

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed: ${url}`);
    return res.json() as Promise<T>;
}

export function useChannels() {
    return useQuery({
        queryKey: ['tv', 'channels'],
        queryFn: () => get<{ channels: TvChannel[] }>('/api/tv/channels').then((d) => d.channels),
        staleTime: DAY,
    });
}

export function useFilters() {
    return useQuery({
        queryKey: ['tv', 'filters'],
        queryFn: () =>
            get<{ countries: TvCountry[]; categories: TvCategory[]; languages: TvLanguage[] }>('/api/tv/filters'),
        staleTime: DAY,
    });
}
