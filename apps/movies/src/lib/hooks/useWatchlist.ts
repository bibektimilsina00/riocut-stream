import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Import existing localStorage functions
import {
    addToWatchlist as addToWatchlistStorage,
    removeFromWatchlist as removeFromWatchlistStorage,
    getWatchlist,
    isInWatchlist as checkIsInWatchlist
} from '@/lib/storage';
import type { MediaItem } from '@/lib/tmdb';

// Query keys for watchlist
export const watchlistKeys = {
    all: ['watchlist'] as const,
    list: () => [...watchlistKeys.all, 'list'] as const,
    status: (id: number, type: 'movie' | 'tv') =>
        [...watchlistKeys.all, 'status', id, type] as const,
};

/**
 * Hook to get the full watchlist
 */
export function useWatchlist() {
    return useQuery({
        queryKey: watchlistKeys.list(),
        queryFn: () => getWatchlist(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to check if an item is in the watchlist
 */
export function useWatchlistStatus(id: number, type: 'movie' | 'tv') {
    return useQuery({
        queryKey: watchlistKeys.status(id, type),
        queryFn: () => checkIsInWatchlist(id, type),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        enabled: !!id, // Only run if ID exists
    });
}

/**
 * Hook to add items to watchlist
 */
export function useAddToWatchlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ item, type }: { item: MediaItem; type: 'movie' | 'tv' }) => {
            addToWatchlistStorage(item, type);
            return { item, type };
        },
        onSuccess: ({ item, type }) => {
            // Invalidate watchlist queries
            queryClient.invalidateQueries({ queryKey: watchlistKeys.all });

            // Update specific status query
            queryClient.setQueryData(
                watchlistKeys.status(item.id, type),
                true
            );

            // Optional: Show success feedback
            const title = 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown';
            console.log(`Added "${title}" to watchlist`);
        },
        onError: (error) => {
            console.error('Failed to add to watchlist:', error);
        },
    });
}

/**
 * Hook to remove items from watchlist
 */
export function useRemoveFromWatchlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, type, title }: {
            id: number;
            type: 'movie' | 'tv';
            title: string;
        }) => {
            removeFromWatchlistStorage(id, type);
            return { id, type, title };
        },
        onSuccess: ({ id, type, title }) => {
            // Invalidate watchlist queries
            queryClient.invalidateQueries({ queryKey: watchlistKeys.all });

            // Update specific status query
            queryClient.setQueryData(
                watchlistKeys.status(id, type),
                false
            );

            // Optional: Show success feedback
            console.log(`Removed "${title}" from watchlist`);
        },
        onError: (error) => {
            console.error('Failed to remove from watchlist:', error);
        },
    });
}

/**
 * Hook to toggle watchlist status (add/remove)
 */
export function useToggleWatchlist() {
    const addToWatchlist = useAddToWatchlist();
    const removeFromWatchlist = useRemoveFromWatchlist();

    return useMutation({
        mutationFn: async ({
            item,
            type,
            isInWatchlist: currentStatus
        }: {
            item: MediaItem;
            type: 'movie' | 'tv';
            isInWatchlist: boolean;
        }) => {
            const title = 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown';

            if (currentStatus) {
                return removeFromWatchlist.mutateAsync({
                    id: item.id,
                    type,
                    title
                });
            } else {
                return addToWatchlist.mutateAsync({ item, type });
            }
        },
        onError: (error) => {
            console.error('Failed to toggle watchlist:', error);
        },
    });
}