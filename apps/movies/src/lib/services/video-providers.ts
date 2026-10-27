import { prisma } from '@riocut/db';

export interface VideoProvider {
    id: string;
    name: string;
    slug: string;
    quality: string;
    isDefault: boolean;
    movieTemplate: string;
    tvTemplate: string;
    supportsImdb: boolean;
    supportsTmdb: boolean;
    hasMultiQuality: boolean;
    hasSubtitles: boolean;
    hasAutoplay: boolean;
    description?: string | null;
    logoUrl?: string | null;
}

/**
 * Get all enabled video providers ordered by sortOrder
 * Server-side only function
 */
export async function getVideoProviders(): Promise<VideoProvider[]> {
    try {
        const providers = await prisma.videoProvider.findMany({
            where: { isEnabled: true },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                quality: true,
                isDefault: true,
                movieTemplate: true,
                tvTemplate: true,
                supportsImdb: true,
                supportsTmdb: true,
                hasMultiQuality: true,
                hasSubtitles: true,
                hasAutoplay: true,
                description: true,
                logoUrl: true,
            }
        });

        return providers;
    } catch (error) {
        console.error('Error fetching video providers:', error);
        // Return empty array as fallback
        return [];
    }
}

/**
 * Get the default video provider
 * Server-side only function
 */
export async function getDefaultVideoProvider(): Promise<VideoProvider | null> {
    try {
        const provider = await prisma.videoProvider.findFirst({
            where: {
                isEnabled: true,
                isDefault: true
            },
            select: {
                id: true,
                name: true,
                slug: true,
                quality: true,
                isDefault: true,
                movieTemplate: true,
                tvTemplate: true,
                supportsImdb: true,
                supportsTmdb: true,
                hasMultiQuality: true,
                hasSubtitles: true,
                hasAutoplay: true,
                description: true,
                logoUrl: true,
            }
        });

        return provider;
    } catch (error) {
        console.error('Error fetching default video provider:', error);
        return null;
    }
}

/**
 * Generate embed URL from template
 * Client or server-side function
 */
export function generateEmbedUrl(
    template: string,
    tmdbId: number,
    season?: number,
    episode?: number
): string {
    let url = template.replace('{tmdbId}', tmdbId.toString());
    
    if (season !== undefined) {
        url = url.replace('{season}', season.toString());
    }
    
    if (episode !== undefined) {
        url = url.replace('{episode}', episode.toString());
    }
    
    return url;
}

/**
 * Get embed URL for a video provider
 * Client or server-side function
 */
export function getProviderEmbedUrl(
    provider: VideoProvider,
    tmdbId: number,
    type: 'movie' | 'tv',
    season?: number,
    episode?: number
): string {
    const template = type === 'movie' ? provider.movieTemplate : provider.tvTemplate;
    return generateEmbedUrl(template, tmdbId, season, episode);
}
