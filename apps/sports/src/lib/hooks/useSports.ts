'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { sportsrc } from '@/lib/sportsrc';
import { CURATED_LEAGUES, findEvent, getCurrentLeagues, getHeaderEvents, getScoreboard, getStandings, type EspnLeague } from '@/lib/espn';
import { sportMeta } from '@/lib/sports';
import type { Match } from '@/lib/sportsrc';

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
            // Curated entries keep their nicer names but pick up the "on now"
            // flag, so a live NPL still lands in the hub's live fixtures.
            const byId = new Map<string, EspnLeague>();
            for (const l of [...CURATED_LEAGUES, ...current]) {
                const id = `${l.sport}/${l.slug}`;
                const prev = byId.get(id);
                byId.set(id, prev ? { ...prev, current: prev.current || l.current } : l);
            }
            return [...byId.entries()].map(([id, l]) => ({ ...l, id }));
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

/** Scoreboards for several leagues at once, sharing useScoreboard's cache. */
export function useScoreboards(leagues: Array<{ sport: string; slug: string }>) {
    return useQueries({
        queries: leagues.map((l) => ({
            queryKey: sportsKeys.scoreboard(l.sport, l.slug),
            queryFn: () => getScoreboard(l.sport, l.slug),
            staleTime: 60_000,
            refetchInterval: 60_000,
        })),
    });
}

/**
 * ESPN's live score for a stream match. One header request per sport, shared
 * by every card through the query cache; only runs while the match is live.
 */
export function useLiveScore(match: Match, live: boolean) {
    const espn = sportMeta(match.category).espn;
    const { data } = useQuery({
        queryKey: ['espn', 'header-events', espn],
        queryFn: () => getHeaderEvents(espn!),
        enabled: live && !!espn,
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
    return live && data ? findEvent(match, data) : null;
}
