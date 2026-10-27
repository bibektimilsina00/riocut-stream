/**
 * Video source providers for streaming movies and TV shows
 * Similar to how fmovies, soap2day work - using embedded players
 */

export interface VideoSource {
    name: string;
    quality: string;
    embed: (tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number) => string;
}

/**
 * Popular video source providers - UPDATED 2025
 * Ordered by ad experience: Minimal ads first, then standard
 * These are verified working providers as of November 2025
 */
export const VIDEO_SOURCES: VideoSource[] = [
    // ⭐ MINIMAL ADS - Best User Experience
    {
        name: 'VidSrc ICU',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.icu - BEST with minimal ads
            // Clean interface, supports anime & manga
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.icu/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.cc',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.cc - V2 player with custom subtitles & events
            // Clean interface, supports player events
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidLink Pro',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidLink.pro - Biggest library: 51K+ movies, 36K+ shows
            // Supports customization, watch progress tracking
            if (type === 'tv' && season && episode) {
                return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidlink.pro/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.to',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.to - Next-gen API with auto-update links
            // Responsive, high quality, minimal ads
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.to/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.net',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.net - Official VidSrc mirror
            // Reliable uptime, minimal ads
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.net/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.net/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.me',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.me - Original VidSrc with query params
            // Query-based URL structure, minimal ads
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
            }
            return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
        }
    },

    // 📺 STANDARD ADS - Acceptable Experience
    {
        name: 'VidSrc NEW',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc new official domain (vidsrcme.ru)
            // Replaces old vidsrc.me, vidsrc.xyz, vidsrc.net
            if (type === 'tv' && season && episode) {
                return `https://vidsrcme.ru/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrcme.ru/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.xyz',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.xyz - Legacy VidSrc domain
            // May redirect, standard ads
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
        }
    },
    {
        name: '2Embed',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // 2Embed - Popular embed with multiple servers
            // Standard ads, multiple server options
            if (type === 'tv' && season && episode) {
                return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
            }
            return `https://www.2embed.cc/embed/${tmdbId}`;
        }
    },
    {
        name: 'SuperEmbed',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // SuperEmbed - Multi-source aggregator
            // Aggregates multiple sources, standard ads
            if (type === 'tv' && season && episode) {
                return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
            }
            return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
        }
    },
    {
        name: 'MoviesAPI',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // MoviesAPI - RESTful API with embed support
            // Good compatibility, standard ads
            if (type === 'tv' && season && episode) {
                return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
            }
            return `https://moviesapi.club/movie/${tmdbId}`;
        }
    },
    {
        name: 'Smashystream',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // Smashystream - Alternative embed with good compatibility
            // PHP-based player, standard ads
            if (type === 'tv' && season && episode) {
                return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
            }
            return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`;
        }
    }
];

/**
 * Get the default video source
 */
export const getDefaultSource = (): VideoSource => {
    return VIDEO_SOURCES[0];
};

/**
 * Get embed URL for a movie
 */
export const getMovieEmbedUrl = (tmdbId: number, sourceIndex: number = 0): string => {
    const source = VIDEO_SOURCES[sourceIndex] || VIDEO_SOURCES[0];
    return source.embed(tmdbId, 'movie');
};

/**
 * Get embed URL for a TV show episode
 */
export const getTVEmbedUrl = (
    tmdbId: number,
    season: number,
    episode: number,
    sourceIndex: number = 0
): string => {
    const source = VIDEO_SOURCES[sourceIndex] || VIDEO_SOURCES[0];
    return source.embed(tmdbId, 'tv', season, episode);
};
