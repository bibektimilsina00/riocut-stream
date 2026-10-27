import { Metadata } from 'next'
import { getMovieDetails, getTVDetails, getImageUrl, type MediaItem } from '@/lib/tmdb'
import type { CastMember, CrewMember, MovieDetails, TVDetails, Genre } from '@/lib/api/tmdb'

// Type definitions for SEO functions
interface Review {
    mediaType: 'movie' | 'tv';
    mediaTitle: string;
    mediaImage?: string;
    mediaUrl?: string;
    rating?: number;
    author?: string;
    content: string;
    publishedAt: string;
}

// Site Configuration
export const siteConfig = {
    name: 'Riocut',
    url: (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://riocut.com').replace(/^http:/, 'https:'),
    description: 'Watch movies and TV shows online free. Stream unlimited content, discover trending releases, and enjoy HD quality entertainment with Riocut. No subscription required.',
    links: {
        twitter: 'https://twitter.com/riocut',
        github: 'https://github.com/riocut',
    },
    creator: 'Riocut Team',
    publisher: 'Riocut',
}

// SEO Keywords Taxonomy
export const seoKeywords = {
    primary: [
        'watch movies online free',
        'free movie streaming',
        'watch tv shows free',
        'free online movies',
        'stream movies free',
        'free tv series',
        'watch movies no subscription',
        'free streaming platform',
        'watch movies online without paying',
        'free hd movies',
    ],
    secondary: [
        'trending movies free',
        'popular tv shows free',
        'new releases free',
        'top rated movies free',
        'free movie database',
        'watch together free',
        'free movie collection',
        'stream tv series free',
        'no signup required',
        'unlimited free streaming',
    ],
    genres: [
        'free action movies',
        'free comedy series',
        'free drama shows',
        'free thriller movies',
        'free horror films',
        'free sci-fi series',
        'free romance movies',
        'free documentary films',
        'free animation movies',
        'free crime series',
    ],
}

// Structured Data Schemas
export const structuredData = {
    // Organization Schema
    organization: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon-512.png`,
        description: siteConfig.description,
        sameAs: [
            siteConfig.links.twitter,
            siteConfig.links.github,
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            email: 'support@riocut.com',
        },
    },

    // Website Schema (for homepage)
    website: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: {
            '@type': 'Organization',
            name: siteConfig.publisher,
        },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteConfig.url}/search?query={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    },

    // Item List Schema Generator
    itemList: (items: MediaItem[], listType: 'trending' | 'popular' | 'top-rated') => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${listType === 'trending' ? 'Trending' : listType === 'popular' ? 'Popular' : 'Top Rated'} Movies & TV Shows`,
        description: `Browse ${listType} content on Riocut`,
        itemListElement: items.slice(0, 10).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'media_type' in item && item.media_type === 'movie' ? 'Movie' : 'TVSeries',
                name: 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown',
                url: `${siteConfig.url}/${'media_type' in item ? item.media_type : 'movie'}/${item.id}`,
                image: getImageUrl('poster_path' in item ? item.poster_path : null, 'w500'),
                datePublished: 'release_date' in item ? item.release_date : 'first_air_date' in item ? item.first_air_date : '',
            },
        })),
    }),

    // FAQ Schema Generator
    faq: (questions: Array<{ question: string; answer: string }>) => ({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: answer,
            },
        })),
    }),

    // Breadcrumb Schema Generator
    breadcrumbList: (items: Array<{ name: string; url: string }>) => ({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${siteConfig.url}${item.url}`,
        })),
    }),

    // Person Schema Generator (for actors, directors, crew)
    person: (person: CastMember | CrewMember) => ({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: person.name,
        url: `https://www.themoviedb.org/person/${person.id}`,
        image: person.profile_path ? getImageUrl(person.profile_path, 'w500') : undefined,
        jobTitle: person.known_for_department,
        sameAs: `https://www.themoviedb.org/person/${person.id}`,
    }),

    // Review Schema Generator
    review: (review: Review) => ({
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
            '@type': review.mediaType === 'movie' ? 'Movie' : 'TVSeries',
            name: review.mediaTitle,
            image: review.mediaImage,
            sameAs: review.mediaUrl,
        },
        reviewRating: review.rating ? {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 10,
            worstRating: 1,
        } : undefined,
        author: {
            '@type': 'Person',
            name: review.author || 'Riocut Editorial Team',
        },
        reviewBody: review.content,
        datePublished: review.publishedAt,
        publisher: {
            '@type': 'Organization',
            name: siteConfig.publisher,
        },
    }),
}

export async function generateMovieMetadata(id: string): Promise<Metadata> {
    try {
        const movie = await getMovieDetails(parseInt(id)) as MovieDetails

        const title = `Watch ${movie.title} (${new Date(movie.release_date).getFullYear()}) Free Online`
        const description = `Watch ${movie.title} free online in HD. ${movie.overview.length > 120 ? `${movie.overview.substring(0, 117)}...` : movie.overview} Stream now without subscription.`
        const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}/og?title=${encodeURIComponent(movie.title)}&subtitle=${encodeURIComponent(`Watch Free • ${new Date(movie.release_date).getFullYear()} • ⭐ ${movie.vote_average.toFixed(1)}`)}`

        return {
            title,
            description: truncateDescription(description, 160),
            keywords: [
                `watch ${movie.title} free`,
                `${movie.title} online free`,
                `stream ${movie.title}`,
                'watch movie free',
                'free movie streaming',
                'hd movie free',
                'no subscription',
                ...movie.genres.map((g: Genre) => `free ${g.name.toLowerCase()} movies`),
                ...movie.credits?.cast.slice(0, 3).map((actor: CastMember) => actor.name) || [],
                movie.credits?.crew.find((c: CrewMember) => c.job === 'Director')?.name || '',
            ].filter(Boolean),
            openGraph: {
                type: 'video.movie',
                title,
                description,
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${movie.title} poster`,
                    },
                ],
                locale: 'en_US',
                siteName: 'Riocut',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [ogImageUrl],
            },
            other: {
                'article:author': movie.credits?.crew.find((c: { job: string; name: string }) => c.job === 'Director')?.name || '',
                'article:published_time': movie.release_date,
                'video:duration': movie.runtime ? (movie.runtime * 60).toString() : '',
                'video:release_date': movie.release_date,
            },
        }
    } catch {
        return {
            title: 'Movie Not Found | Riocut',
            description: 'The requested movie could not be found.',
        }
    }
}

export async function generateTVMetadata(id: string): Promise<Metadata> {
    try {
        const show = await getTVDetails(parseInt(id))

        const title = `Watch ${show.name} (${new Date(show.first_air_date).getFullYear()}) Free Online - TV Series`
        const description = `Watch ${show.name} free online in HD. ${show.overview.length > 100 ? `${show.overview.substring(0, 97)}...` : show.overview} Stream all ${show.number_of_seasons} season${show.number_of_seasons !== 1 ? 's' : ''} without subscription.`
        const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}/og?title=${encodeURIComponent(show.name)}&subtitle=${encodeURIComponent(`Watch Free • TV Series • ⭐ ${show.vote_average.toFixed(1)} • ${show.number_of_seasons} Season${show.number_of_seasons !== 1 ? 's' : ''}`)}`

        return {
            title,
            description: truncateDescription(description, 160),
            keywords: [
                `watch ${show.name} free`,
                `${show.name} online free`,
                `stream ${show.name}`,
                'watch tv show free',
                'free tv series streaming',
                'free series online',
                'hd tv shows free',
                'no subscription',
                ...show.genres.map((g: { name: string }) => `free ${g.name.toLowerCase()} series`),
                ...show.credits?.cast.slice(0, 3).map((actor: { name: string }) => actor.name) || [],
                show.created_by?.[0]?.name || '',
            ].filter(Boolean),
            openGraph: {
                type: 'video.tv_show',
                title: `Watch ${show.name} Free Online`,
                description: truncateDescription(description, 200),
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${show.name} - Watch free online`,
                    },
                ],
                locale: 'en_US',
                siteName: 'Riocut',
            },
            twitter: {
                card: 'summary_large_image',
                title: `Watch ${show.name} Free`,
                description: truncateDescription(description, 200),
                images: [ogImageUrl],
            },
            other: {
                'article:published_time': show.first_air_date,
                'video:release_date': show.first_air_date,
                'video:series': show.name,
            },
        }
    } catch {
        return {
            title: 'TV Show Not Found | Riocut',
            description: 'The requested TV show could not be found.',
        }
    }
}

export async function generateMovieJSONLD(id: string) {
    try {
        const movie = await getMovieDetails(parseInt(id)) as MovieDetails

        return {
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: movie.title,
            description: movie.overview,
            image: getImageUrl(movie.poster_path, 'w500'),
            datePublished: movie.release_date,
            director: movie.credits?.crew.find((c: CrewMember) => c.job === 'Director') ? {
                '@type': 'Person',
                name: movie.credits!.crew.find((c: CrewMember) => c.job === 'Director')!.name,
            } : undefined,
            actor: movie.credits?.cast?.slice(0, 5).map((actor: CastMember) => ({
                '@type': 'Person',
                name: actor.name,
            })),
            genre: movie.genres?.map((genre: Genre) => genre.name),
            aggregateRating: movie.vote_average ? {
                '@type': 'AggregateRating',
                ratingValue: movie.vote_average,
                ratingCount: movie.vote_count,
                bestRating: 10,
            } : undefined,
            duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
        }
    } catch {
        return null
    }
}

export async function generateTVJSONLD(id: string) {
    try {
        const show = await getTVDetails(parseInt(id)) as TVDetails

        return {
            '@context': 'https://schema.org',
            '@type': 'TVSeries',
            name: show.name,
            description: show.overview,
            image: getImageUrl(show.poster_path, 'w500'),
            datePublished: show.first_air_date,
            creator: (show as TVDetails & { created_by?: Array<{ name: string }> }).created_by?.map((creator) => ({
                '@type': 'Person',
                name: creator.name,
            })),
            actor: show.credits?.cast.slice(0, 5).map((actor: CastMember) => ({
                '@type': 'Person',
                name: actor.name,
                sameAs: `https://www.themoviedb.org/person/${actor.id}`
            })),
            genre: show.genres.map((g: Genre) => g.name),
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: show.vote_average,
                ratingCount: show.vote_count,
                bestRating: 10,
                worstRating: 1,
            },
            numberOfSeasons: show.number_of_seasons,
            numberOfEpisodes: show.number_of_episodes,
            sameAs: `https://www.themoviedb.org/tv/${show.id}`,
        }
    } catch {
        return null
    }
}



// Generate Search Page Metadata
export function generateSearchMetadata(query?: string): Metadata {
    const title = query
        ? `Watch "${query}" Free Online - Search Results | Riocut`
        : 'Search Free Movies & TV Shows | Riocut'

    const description = query
        ? `Find and watch "${query}" free online. Browse movies and TV shows matching your search on Riocut - no subscription required.`
        : 'Search through thousands of free movies and TV shows. Find your next favorite content to watch online without subscription.'

    return {
        title,
        description: truncateDescription(description, 160),
        keywords: [
            'search free movies',
            'search free tv shows',
            'find movies online',
            'movie search free',
            'tv show search free',
            'watch movies search',
            ...(query ? [
                query,
                `watch ${query} free`,
                `${query} online free`,
            ] : []),
        ],
        openGraph: {
            title,
            description,
            type: 'website',
            locale: 'en_US',
            siteName: siteConfig.name,
        },
        robots: {
            index: !!query, // Don't index empty search page
            follow: true,
        },
    }
}

// Generate Watchlist Metadata
export function generateWatchlistMetadata(): Metadata {
    return {
        title: 'My Watchlist | Riocut',
        description: 'Manage your watchlist and keep track of movies and TV shows you want to watch.',
        keywords: [
            'watchlist',
            'saved movies',
            'saved tv shows',
            'movie collection',
            'tv show collection',
            'watch later',
        ],
        openGraph: {
            title: 'My Watchlist',
            description: 'Your personal collection of movies and TV shows on Riocut',
            type: 'website',
            locale: 'en_US',
            siteName: siteConfig.name,
        },
        robots: {
            index: false, // Don't index user-specific pages
            follow: true,
        },
    }
}

// Generate Category/Genre Metadata
export function generateCategoryMetadata(
    category: 'movies' | 'tv',
    genre?: string
): Metadata {
    const categoryName = category === 'movies' ? 'Movies' : 'TV Shows'
    const title = genre
        ? `Watch Free ${genre} ${categoryName} Online | Riocut`
        : `Watch ${categoryName} Online Free | Riocut`

    const description = genre
        ? `Watch free ${genre.toLowerCase()} ${category === 'movies' ? 'movies' : 'TV shows'} online in HD. Stream unlimited ${genre} content without subscription on Riocut.`
        : `Watch ${category === 'movies' ? 'movies' : 'TV shows'} online free in HD. Stream unlimited content without subscription. Browse by genre, rating, and popularity on Riocut.`

    return {
        title,
        description: truncateDescription(description, 160),
        keywords: [
            `free ${categoryName.toLowerCase()}`,
            `watch ${categoryName.toLowerCase()} free`,
            `stream ${categoryName.toLowerCase()} online free`,
            `${categoryName.toLowerCase()} no subscription`,
            `hd ${categoryName.toLowerCase()} free`,
            `unlimited ${categoryName.toLowerCase()}`,
            ...(genre ? [
                `free ${genre.toLowerCase()} ${categoryName.toLowerCase()}`,
                `watch ${genre.toLowerCase()} ${categoryName.toLowerCase()}`,
                `${genre.toLowerCase()} streaming free`
            ] : []),
        ],
        openGraph: {
            title,
            description,
            type: 'website',
            locale: 'en_US',
            siteName: siteConfig.name,
        },
    }
}

// Generate Watch Together Metadata
export function generateWatchTogetherMetadata(roomCode?: string): Metadata {
    const title = roomCode
        ? `Watch Together - Room ${roomCode} | Riocut`
        : 'Watch Together | Riocut'

    const description = 'Watch movies and TV shows together with friends in real-time. Create or join a watch party on Riocut.'

    return {
        title,
        description,
        keywords: [
            'watch together',
            'watch party',
            'group streaming',
            'watch with friends',
            'synchronized playback',
            'video chat',
        ],
        openGraph: {
            title,
            description,
            type: 'website',
            locale: 'en_US',
            siteName: siteConfig.name,
        },
        robots: {
            index: false, // Don't index room-specific pages
            follow: true,
        },
    }
}

// Generate Canonical URL Helper
export function getCanonicalUrl(path: string): string {
    return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}

// Generate Alt Text for Images
export function generateImageAlt(
    mediaType: 'movie' | 'tv',
    title: string,
    imageType: 'poster' | 'backdrop' = 'poster'
): string {
    const type = mediaType === 'movie' ? 'movie' : 'TV show'
    return `${title} ${type} ${imageType}`
}

// Meta Description Helper (truncate to optimal length)
export function truncateDescription(text: string, maxLength: number = 160): string {
    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength - 3)}...`
}