import { prisma } from '@riocut/db';
import type { MediaTypeId } from './types';

export interface ContinueWatchingData {
    mediaId: number;
    mediaType: MediaTypeId;
    title: string;
    posterPath?: string | null;
    progress: number; // 0-100
    season?: number | null;
    episode?: number | null;
    sport?: string | null;
    league?: string | null;
    matchExternalId?: string | null;
    kickoffAt?: Date | null;
}

/**
 * Save or update continue watching progress
 */
export async function saveContinueWatching(userId: string, data: ContinueWatchingData) {
    try {
        const continueWatching = await prisma.continueWatching.upsert({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId: data.mediaId,
                    mediaType: data.mediaType,
                },
            },
            update: {
                title: data.title,
                posterPath: data.posterPath ?? undefined,
                progress: data.progress,
                season: data.season ?? undefined,
                episode: data.episode ?? undefined,
                sport: data.sport ?? undefined,
                league: data.league ?? undefined,
                matchExternalId: data.matchExternalId ?? undefined,
                kickoffAt: data.kickoffAt ?? undefined,
                updatedAt: new Date(),
            },
            create: {
                userId,
                mediaId: data.mediaId,
                mediaType: data.mediaType,
                title: data.title,
                posterPath: data.posterPath ?? undefined,
                progress: data.progress,
                season: data.season ?? undefined,
                episode: data.episode ?? undefined,
                sport: data.sport ?? undefined,
                league: data.league ?? undefined,
                matchExternalId: data.matchExternalId ?? undefined,
                kickoffAt: data.kickoffAt ?? undefined,
            },
        });

        return continueWatching;
    } catch (error) {
        console.error('Error saving continue watching:', error);
        throw new Error('Failed to save continue watching');
    }
}

/**
 * Get continue watching list for user (optimized with field selection)
 */
export async function getContinueWatching(userId: string) {
    try {
        const continueWatching = await prisma.continueWatching.findMany({
            where: { userId },
            select: {
                id: true,
                mediaId: true,
                mediaType: true,
                title: true,
                posterPath: true,
                progress: true,
                season: true,
                episode: true,
                updatedAt: true,
                sport: true,
                league: true,
                matchExternalId: true,
                kickoffAt: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 20, // Limit to recent 20 items
        });

        return continueWatching;
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        throw new Error('Failed to fetch continue watching');
    }
}

/**
 * Remove item from continue watching
 */
export async function removeContinueWatching(
    userId: string,
    mediaId: number,
    mediaType: MediaTypeId
) {
    try {
        await prisma.continueWatching.delete({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId,
                    mediaType,
                },
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing continue watching:', error);
        throw new Error('Failed to remove continue watching');
    }
}

/**
 * Get progress for specific media
 */
export async function getProgress(
    userId: string,
    mediaId: number,
    mediaType: MediaTypeId
) {
    try {
        const item = await prisma.continueWatching.findUnique({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId,
                    mediaType,
                },
            },
        });

        return item?.progress || 0;
    } catch (error) {
        console.error('Error getting progress:', error);
        return 0;
    }
}

/**
 * Migrate localStorage continue watching to database
 */
export async function migrateContinueWatchingFromLocalStorage(
    userId: string,
    localStorageItems: ContinueWatchingData[]
) {
    try {
        const promises = localStorageItems.map((item) =>
            saveContinueWatching(userId, item)
        );

        await Promise.all(promises);
        return { success: true, count: localStorageItems.length };
    } catch (error) {
        console.error('Error migrating continue watching:', error);
        throw new Error('Failed to migrate continue watching');
    }
}
