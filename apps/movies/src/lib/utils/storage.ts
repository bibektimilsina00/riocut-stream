import localforage from 'localforage';

// Configure localforage
const watchProgressStore = localforage.createInstance({
    name: 'riocut',
    storeName: 'watch_progress',
});

const cacheStore = localforage.createInstance({
    name: 'riocut',
    storeName: 'cache_media',
});

export interface WatchProgress {
    id: string;
    title: string;
    type: 'movie' | 'tv';
    currentTime: number;
    duration: number;
    percentage: number;
    lastWatched: number;
    poster?: string;
}

export const storage = {
    // Watch Progress
    async saveWatchProgress(progress: WatchProgress) {
        await watchProgressStore.setItem(progress.id, progress);
    },

    async getWatchProgress(id: string): Promise<WatchProgress | null> {
        return await watchProgressStore.getItem(id);
    },

    async getAllWatchProgress(): Promise<WatchProgress[]> {
        const keys = await watchProgressStore.keys();
        const items = await Promise.all(
            keys.map((key) => watchProgressStore.getItem<WatchProgress>(key))
        );
        return items
            .filter((item): item is WatchProgress => item !== null)
            .sort((a, b) => b.lastWatched - a.lastWatched);
    },

    async removeWatchProgress(id: string) {
        await watchProgressStore.removeItem(id);
    },

    async clearOldProgress(daysOld = 30) {
        const allProgress = await this.getAllWatchProgress();
        const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

        for (const progress of allProgress) {
            if (progress.lastWatched < cutoffTime) {
                await this.removeWatchProgress(progress.id);
            }
        }
    },

    // Cache
    async setCacheItem(key: string, value: unknown, ttl = 3600000) {
        const item = {
            data: value,
            expires: Date.now() + ttl,
        };
        await cacheStore.setItem(key, item);
    },

    async getCacheItem(key: string) {
        const item: { data: unknown; expires: number } | null = await cacheStore.getItem(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            await cacheStore.removeItem(key);
            return null;
        }

        return item.data;
    },

    async clearExpiredCache() {
        const keys = await cacheStore.keys();
        for (const key of keys) {
            const item: { data: unknown; expires: number } | null = await cacheStore.getItem(key);
            if (item && Date.now() > item.expires) {
                await cacheStore.removeItem(key);
            }
        }
    },
};

export default storage;
