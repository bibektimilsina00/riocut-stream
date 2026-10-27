'use client';

import { useQuery } from '@tanstack/react-query';
import { sportsrc } from '@/lib/sportsrc';

export const sportsKeys = {
    all: ['sportsrc'] as const,
    sports: () => [...sportsKeys.all, 'sports'] as const,
    matches: (category: string) => [...sportsKeys.all, 'matches', category] as const,
    matchDetail: (category: string, id: string) => [...sportsKeys.all, 'detail', category, id] as const,
    leagues: () => [...sportsKeys.all, 'leagues'] as const,
    standings: (league: string) => [...sportsKeys.all, 'standings', league] as const,
    scores: (league: string) => [...sportsKeys.all, 'scores', league] as const,
};

const MIN = 60_000;

export function useSportsCategories() {
    return useQuery({
        queryKey: sportsKeys.sports(),
        queryFn: () => sportsrc.getSports(),
        staleTime: 60 * MIN,
    });
}

export function useMatchesByCategory(category: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.matches(category ?? ''),
        queryFn: () => sportsrc.getMatches(category!),
        staleTime: 60_000,
        enabled: !!category,
    });
}

export function useMatchDetail(category: string | undefined, id: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.matchDetail(category ?? '', id ?? ''),
        queryFn: () => sportsrc.getMatchDetail(category!, id!),
        staleTime: 30_000,
        enabled: !!category && !!id,
    });
}

export function useLeagues() {
    return useQuery({
        queryKey: sportsKeys.leagues(),
        queryFn: () => sportsrc.getLeagues(),
        staleTime: 60 * MIN,
    });
}

export function useStandings(league: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.standings(league ?? ''),
        queryFn: () => sportsrc.getStandings(league!),
        staleTime: 5 * MIN,
        enabled: !!league,
    });
}

export function useScores(league: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.scores(league ?? ''),
        queryFn: () => sportsrc.getScores(league!),
        staleTime: 60_000,
        enabled: !!league,
    });
}
