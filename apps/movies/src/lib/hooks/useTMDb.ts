import React from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getTrending,
  getPopular,
  getTopRated,
  getMovieDetails,
  getTVDetails,
  searchMulti,
  getGenres,
  discoverByGenre,
  getNowPlaying,
  getUpcoming,
  getAiringToday,
  getOnTheAir,
  type MediaItem,
  type MovieDetails,
  type TVDetails,
  type TMDbResponse,
  type SearchResult,
  type Genre,
} from '@/lib/api/tmdb';

// =============================================================================
// Query Keys - Centralized for cache invalidation
// =============================================================================

export const tmdbKeys = {
  all: ['tmdb'] as const,
  trending: (mediaType: string, timeWindow: string) =>
    [...tmdbKeys.all, 'trending', mediaType, timeWindow] as const,
  popular: (mediaType: string, page: number) =>
    [...tmdbKeys.all, 'popular', mediaType, page] as const,
  topRated: (mediaType: string, page: number) =>
    [...tmdbKeys.all, 'topRated', mediaType, page] as const,
  movieDetails: (id: number) =>
    [...tmdbKeys.all, 'movie', id] as const,
  tvDetails: (id: number) =>
    [...tmdbKeys.all, 'tv', id] as const,
  search: (query: string, page: number) =>
    [...tmdbKeys.all, 'search', query, page] as const,
  genres: (mediaType: string) =>
    [...tmdbKeys.all, 'genres', mediaType] as const,
  discover: (mediaType: string, genreId: number, page: number) =>
    [...tmdbKeys.all, 'discover', mediaType, genreId, page] as const,
  nowPlaying: (page: number) =>
    [...tmdbKeys.all, 'nowPlaying', page] as const,
  upcoming: (page: number) =>
    [...tmdbKeys.all, 'upcoming', page] as const,
  airingToday: (page: number) =>
    [...tmdbKeys.all, 'airingToday', page] as const,
  onTheAir: (page: number) =>
    [...tmdbKeys.all, 'onTheAir', page] as const,
};

// =============================================================================
// Trending Content Hooks
// =============================================================================

/**
 * Hook for fetching trending movies/TV shows
 */
export function useTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  options?: Omit<UseQueryOptions<MediaItem[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.trending(mediaType, timeWindow),
    queryFn: () => getTrending(mediaType, timeWindow),
    staleTime: 1000 * 60 * 15, // 15 minutes (trending changes frequently)
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

// =============================================================================
// Popular Content Hooks
// =============================================================================

/**
 * Hook for fetching popular content with pagination
 */
export function usePopular(
  mediaType: 'movie' | 'tv',
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.popular(mediaType, page),
    queryFn: () => getPopular(mediaType, page),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    placeholderData: (prev) => prev, // Keep previous data while fetching
    ...options,
  });
}

// =============================================================================
// Top Rated Content Hooks
// =============================================================================

/**
 * Hook for fetching top rated content with pagination
 */
export function useTopRated(
  mediaType: 'movie' | 'tv',
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.topRated(mediaType, page),
    queryFn: () => getTopRated(mediaType, page),
    staleTime: 1000 * 60 * 30, // 30 minutes (top rated changes slowly)
    gcTime: 1000 * 60 * 60, // 1 hour
    placeholderData: (prev) => prev,
    ...options,
  });
}

// =============================================================================
// Detail Pages Hooks
// =============================================================================

/**
 * Hook for fetching detailed movie information
 */
export function useMovieDetails(
  id: number,
  options?: Omit<UseQueryOptions<MovieDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.movieDetails(id),
    queryFn: () => getMovieDetails(id),
    staleTime: 1000 * 60 * 60, // 1 hour (movie details rarely change)
    gcTime: 1000 * 60 * 120, // 2 hours
    enabled: !!id, // Only run query if ID exists
    ...options,
  });
}

/**
 * Hook for fetching detailed TV show information
 */
export function useTVDetails(
  id: number,
  options?: Omit<UseQueryOptions<TVDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.tvDetails(id),
    queryFn: () => getTVDetails(id),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    enabled: !!id,
    ...options,
  });
}

// =============================================================================
// Search Hooks
// =============================================================================

/**
 * Hook for searching across movies, TV shows, and people
 * Note: Consider using useSearchMultiDebounced for real-time search
 */
export function useSearchMulti(
  query: string,
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<SearchResult>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.search(query, page),
    queryFn: () => searchMulti(query, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    placeholderData: (prev) => prev,
    ...options,
  });
}

/**
 * Debounced search hook for real-time search inputs
 */
export function useSearchMultiDebounced(
  query: string,
  page: number = 1,
  debounceMs: number = 300,
  options?: Omit<UseQueryOptions<TMDbResponse<SearchResult>>, 'queryKey' | 'queryFn'>
) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useSearchMulti(debouncedQuery, page, options);
}

// =============================================================================
// Genre Hooks
// =============================================================================

/**
 * Hook for fetching genres
 */
export function useGenres(
  mediaType: 'movie' | 'tv',
  options?: Omit<UseQueryOptions<Genre[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.genres(mediaType),
    queryFn: () => getGenres(mediaType),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (genres rarely change)
    gcTime: 1000 * 60 * 60 * 48, // 48 hours
    ...options,
  });
}

/**
 * Hook for discovering content by genre
 */
export function useDiscoverByGenre(
  mediaType: 'movie' | 'tv',
  genreId: number,
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.discover(mediaType, genreId, page),
    queryFn: () => discoverByGenre(mediaType, genreId, page),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!genreId,
    placeholderData: (prev) => prev,
    ...options,
  });
}

// =============================================================================
// Movie-Specific Hooks
// =============================================================================

/**
 * Hook for fetching now playing movies
 */
export function useNowPlaying(
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.nowPlaying(page),
    queryFn: () => getNowPlaying(page),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    placeholderData: (prev) => prev,
    ...options,
  });
}

/**
 * Hook for fetching upcoming movies
 */
export function useUpcoming(
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.upcoming(page),
    queryFn: () => getUpcoming(page),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    placeholderData: (prev) => prev,
    ...options,
  });
}

// =============================================================================
// TV-Specific Hooks
// =============================================================================

/**
 * Hook for fetching TV shows airing today
 */
export function useAiringToday(
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.airingToday(page),
    queryFn: () => getAiringToday(page),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    placeholderData: (prev) => prev,
    ...options,
  });
}

/**
 * Hook for fetching TV shows on the air
 */
export function useOnTheAir(
  page: number = 1,
  options?: Omit<UseQueryOptions<TMDbResponse<MediaItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: tmdbKeys.onTheAir(page),
    queryFn: () => getOnTheAir(page),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    placeholderData: (prev) => prev,
    ...options,
  });
}