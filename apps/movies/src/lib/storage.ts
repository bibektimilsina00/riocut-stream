import { createStorage, type BaseMediaItem } from '@riocut/ui/lib/storage';
import type { MediaItem } from './tmdb';

const storage = createStorage<MediaItem & BaseMediaItem>('riocut');

export const addToWatchlist = (item: MediaItem, type: 'movie' | 'tv') =>
    storage.addToWatchlist(item as MediaItem & BaseMediaItem, type);
export const removeFromWatchlist = (id: number, type: 'movie' | 'tv') =>
    storage.removeFromWatchlist(id, type);
export const isInWatchlist = (id: number, type: 'movie' | 'tv') =>
    storage.isInWatchlist(id, type);
export const getWatchlist = () => storage.getWatchlist();

export const addToContinueWatching = (item: MediaItem, type: 'movie' | 'tv', progress = 0) =>
    storage.addToContinueWatching(item as MediaItem & BaseMediaItem, type, progress);
export const removeFromContinueWatching = (id: number, type: 'movie' | 'tv') =>
    storage.removeFromContinueWatching(id, type);
export const getContinueWatching = () => storage.getContinueWatching();

export const addToHistory = (item: MediaItem, type: 'movie' | 'tv') =>
    storage.addToHistory(item as MediaItem & BaseMediaItem, type);
export const getHistory = () => storage.getHistory();
export const clearHistory = () => storage.clearHistory();

export type ContinueWatchingItem = ReturnType<typeof getContinueWatching>[number];
