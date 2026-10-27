import { Metadata } from 'next';

// Enhanced SEO configuration for the entire Riocut ecosystem
export const seoConfig = {
    // Main site configuration
    mainSite: {
        name: 'Riocut',
        url: process.env.NEXT_PUBLIC_BASE_URL || 'https://riocut.com',
        description: 'Watch and discover movies and TV shows. Stream your favorite entertainment with detailed information, ratings, and reviews.',
        keywords: [
            'movies', 'tv shows', 'streaming', 'entertainment', 'watch online',
            'movie database', 'tv series', 'film reviews', 'cinema', 'episodes',
            'movie ratings', 'tv ratings', 'movie trailers', 'tv trailers',
            'movie recommendations', 'tv recommendations', 'watchlist',
            'movie genres', 'tv genres', 'popular movies', 'popular tv shows'
        ],
    },

    // Blog site configuration  
    blogSite: {
        name: 'Riocut Blog',
        url: process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.riocut.com',
        description: 'In-depth movie and TV show reviews, analysis, and entertainment insights. Expert reviews and recommendations for streaming content.',
        keywords: [
            'movie reviews', 'tv show reviews', 'film analysis', 'entertainment blog',
            'streaming reviews', 'movie recommendations', 'tv recommendations',
            'cinema analysis', 'film criticism', 'tv criticism', 'entertainment news',
            'movie insights', 'tv insights', 'streaming guide', 'what to watch'
        ],
    },

    // Social media handles
    social: {
        twitter: '@riocut',
        facebook: 'riocut',
        instagram: 'riocut',
        youtube: 'riocut',
    },

    // Organization schema
    organization: {
        name: 'Riocut',
        url: 'https://riocut.com',
        logo: 'https://riocut.com/logo.png',
        contactEmail: 'contact@riocut.com',
        foundingDate: '2024',
        description: 'A comprehensive platform for discovering, watching, and reviewing movies and TV shows.',
    },

    // Default metadata generators
    generateMetadata: (options: {
        title?: string;
        description?: string;
        keywords?: string[];
        ogImage?: string;
        canonicalUrl?: string;
        noIndex?: boolean;
        type?: 'website' | 'article';
    }): Metadata => {
        const {
            title,
            description,
            keywords = [],
            ogImage,
            canonicalUrl,
            noIndex = false,
            type = 'website'
        } = options;

        const siteName = seoConfig.mainSite.name;
        const siteUrl = seoConfig.mainSite.url;

        const finalTitle = title ? `${title} | ${siteName}` : siteName;
        const finalDescription = description || seoConfig.mainSite.description;
        const finalImage = ogImage || `${siteUrl}/og-image.jpg`;
        const allKeywords = [...seoConfig.mainSite.keywords, ...keywords];

        return {
            title: finalTitle,
            description: finalDescription,
            keywords: allKeywords.join(', '),

            robots: {
                index: !noIndex,
                follow: !noIndex,
                googleBot: {
                    index: !noIndex,
                    follow: !noIndex,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },

            openGraph: {
                type,
                title: finalTitle,
                description: finalDescription,
                url: canonicalUrl || siteUrl,
                siteName,
                images: [
                    {
                        url: finalImage,
                        width: 1200,
                        height: 630,
                        alt: title || siteName,
                    },
                ],
            },

            twitter: {
                card: 'summary_large_image',
                title: finalTitle,
                description: finalDescription,
                images: [finalImage],
                creator: seoConfig.social.twitter,
                site: seoConfig.social.twitter,
            },

            ...(canonicalUrl && {
                alternates: {
                    canonical: canonicalUrl,
                },
            }),

            other: {
                'og:site_name': siteName,
                'twitter:domain': siteUrl.replace('https://', ''),
                'apple-mobile-web-app-title': siteName,
                'application-name': siteName,
            },
        };
    },
};

// Enhanced structured data generators
// TypeScript interfaces for movie/TV data
interface Genre {
    id: number;
    name: string;
}

interface CastMember {
    id: number;
    name: string;
    character?: string;
}

interface CrewMember {
    id: number;
    name: string;
    job: string;
}

interface Credits {
    cast: CastMember[];
    crew: CrewMember[];
}

interface MovieData {
    id: number;
    title: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date: string;
    genres: Genre[];
    runtime?: number;
    vote_average?: number;
    vote_count?: number;
    credits?: Credits;
}

interface TVShowData {
    id: number;
    name: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    first_air_date: string;
    last_air_date?: string;
    genres: Genre[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    vote_average?: number;
    vote_count?: number;
    credits?: Credits;
}

export const generateOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.organization.name,
    url: seoConfig.organization.url,
    logo: seoConfig.organization.logo,
    email: seoConfig.organization.contactEmail,
    foundingDate: seoConfig.organization.foundingDate,
    description: seoConfig.organization.description,
    sameAs: [
        `https://twitter.com/${seoConfig.social.twitter.replace('@', '')}`,
        `https://facebook.com/${seoConfig.social.facebook}`,
        `https://instagram.com/${seoConfig.social.instagram}`,
        `https://youtube.com/${seoConfig.social.youtube}`,
    ],
});

export const generateWebsiteSchema = (url: string) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    url,
    name: seoConfig.mainSite.name,
    description: seoConfig.mainSite.description,
    publisher: {
        '@id': `${url}#organization`,
    },
    potentialAction: [
        {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${url}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    ],
});

export const generateMovieSchema = (movie: MovieData, url: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Movie',
    '@id': url,
    name: movie.title,
    description: movie.overview,
    url,
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    datePublished: movie.release_date,
    genre: movie.genres?.map(g => g.name) || [],
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    aggregateRating: movie.vote_average ? {
        '@type': 'AggregateRating',
        ratingValue: movie.vote_average,
        ratingCount: movie.vote_count || 100,
        bestRating: 10,
        worstRating: 1,
    } : undefined,
    actor: movie.credits?.cast?.slice(0, 5).map(actor => ({
        '@type': 'Person',
        name: actor.name,
    })) || [],
    director: movie.credits?.crew?.find(c => c.job === 'Director') ? {
        '@type': 'Person',
        name: movie.credits.crew.find(c => c.job === 'Director')?.name,
    } : undefined,
});

export const generateTVSeriesSchema = (show: TVShowData, url: string) => ({
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    '@id': url,
    name: show.name,
    description: show.overview,
    url,
    image: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
    startDate: show.first_air_date,
    endDate: show.last_air_date,
    genre: show.genres?.map(g => g.name) || [],
    numberOfSeasons: show.number_of_seasons,
    numberOfEpisodes: show.number_of_episodes,
    aggregateRating: show.vote_average ? {
        '@type': 'AggregateRating',
        ratingValue: show.vote_average,
        ratingCount: show.vote_count || 100,
        bestRating: 10,
        worstRating: 1,
    } : undefined,
    actor: show.credits?.cast?.slice(0, 5).map(actor => ({
        '@type': 'Person',
        name: actor.name,
    })) || [],
});

export default seoConfig;