'use client';

import { useQuery } from '@tanstack/react-query';
import { sportsrc } from '@/lib/sportsrc';
import { CURATED_LEAGUES, getCurrentLeagues, getScoreboard, getStandings, type EspnLeague } from '@/lib/espn';

export const sportsKeys = {
    all: ['sportsrc'] as const,
    sports: () => [...sportsKeys.all, 'sports'] as const,
    matches: (category: string) => [...sportsKeys.all, 'matches', category] as const,
    matchDetail: (category: string, id: string) => [...sportsKeys.all, 'detail', category, id] as const,
    leagues: () => [...sportsKeys.all, 'leagues'] as const,
    scoreboard: (sport: string, league: string) => ['espn', 'scoreboard', sport, league] as const,
    standings: (sport: string, league: string) => ['espn', 'standings', sport, league] as const,
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

/**
 * Every league/tournament we list: the curated set plus cricket series that
 * are on right now (ESPN header feed). `id` is "<espn sport>/<slug>", which is
 * also the /leagues/<id> route.
 */
export function useLeagues() {
    return useQuery({
        queryKey: sportsKeys.leagues(),
        queryFn: async () => {
            const current = await getCurrentLeagues('cricket').catch((): EspnLeague[] => []);
            const seen = new Set<string>();
            return [...CURATED_LEAGUES, ...current]
                .filter((l) => {
                    const id = `${l.sport}/${l.slug}`;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                })
                .map((l) => ({ ...l, id: `${l.sport}/${l.slug}` }));
        },
        staleTime: 30 * MIN,
    });
}

export function useScoreboard(sport: string | undefined, league: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.scoreboard(sport ?? '', league ?? ''),
        queryFn: () => getScoreboard(sport!, league!),
        staleTime: 60_000,
        refetchInterval: 60_000,
        enabled: !!sport && !!league,
    });
}

export function useStandings(sport: string | undefined, league: string | undefined) {
    return useQuery({
        queryKey: sportsKeys.standings(sport ?? '', league ?? ''),
        queryFn: () => getStandings(sport!, league!),
        staleTime: 10 * MIN,
        enabled: !!sport && !!league,
    });
}
