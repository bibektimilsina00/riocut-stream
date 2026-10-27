'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { PlayerListItem, PlayerDetail, TeamListItem, TeamDetail, Paged, ManagerDetail, RefereeDetail, VenueDetail, WorldCup } from '@/lib/bsd/v2-types';

async function json<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
}

export function usePlayers(opts: { name?: string; position?: string; page?: number }) {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    if (opts.position) q.set('position', opts.position);
    if (opts.page && opts.page > 1) q.set('page', String(opts.page));
    return useQuery({
        queryKey: ['bsd', 'players', opts.name ?? '', opts.position ?? '', opts.page ?? 1],
        queryFn: () => json<Paged<PlayerListItem>>(`/api/bsd/players?${q.toString()}`),
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    });
}

export function usePlayer(id: string | number | undefined) {
    return useQuery({
        queryKey: ['bsd', 'player', String(id ?? '')],
        queryFn: () => json<PlayerDetail>(`/api/bsd/players/${id}`),
        enabled: id != null && id !== '',
        staleTime: 5 * 60_000,
    });
}

export function useTeams(opts: { name?: string; page?: number }) {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    if (opts.page && opts.page > 1) q.set('page', String(opts.page));
    return useQuery({
        queryKey: ['bsd', 'teams', opts.name ?? '', opts.page ?? 1],
        queryFn: () => json<Paged<TeamListItem>>(`/api/bsd/teams?${q.toString()}`),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60_000,
    });
}

export function useTeam(id: string | number | undefined) {
    return useQuery({
        queryKey: ['bsd', 'team', String(id ?? '')],
        queryFn: () => json<TeamDetail>(`/api/bsd/teams/${id}`),
        enabled: id != null && id !== '',
        staleTime: 5 * 60_000,
    });
}

export function useManager(id: string | number | undefined) {
    return useQuery({
        queryKey: ['bsd', 'manager', String(id ?? '')],
        queryFn: () => json<ManagerDetail>(`/api/bsd/managers/${id}`),
        enabled: id != null && id !== '',
        staleTime: 5 * 60_000,
    });
}

export function useReferee(id: string | number | undefined) {
    return useQuery({
        queryKey: ['bsd', 'referee', String(id ?? '')],
        queryFn: () => json<RefereeDetail>(`/api/bsd/referees/${id}`),
        enabled: id != null && id !== '',
        staleTime: 5 * 60_000,
    });
}

export function useVenue(id: string | number | undefined) {
    return useQuery({
        queryKey: ['bsd', 'venue', String(id ?? '')],
        queryFn: () => json<VenueDetail>(`/api/bsd/venues/${id}`),
        enabled: id != null && id !== '',
        staleTime: 10 * 60_000,
    });
}

export function useWorldCup() {
    return useQuery({
        queryKey: ['bsd', 'worldcup'],
        queryFn: () => json<WorldCup>('/api/bsd/worldcup'),
        staleTime: 60_000,
    });
}
