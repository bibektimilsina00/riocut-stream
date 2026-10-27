import { Metadata } from 'next'
import { getMovieDetails, getTVDetails, getImageUrl } from '@/lib/tmdb'

// Site Configuration
export const siteConfig = {
    name: 'Riocut',
    url: (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://blog.riocut.com').replace(/^http:/, 'https:'),
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
    blog: [
        'movie reviews',
        'tv show reviews',
        'entertainment news',
        'movie recommendations',
        'tv series guides',
        'streaming tips',
        'movie analysis',
        'tv show recaps',
        'cinema news',
        'entertainment blog',
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
        logo: `${siteConfig.url}/logo.png`,
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
    itemList: (items: any[], listType: 'trending' | 'popular' | 'top-rated') => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${listType === 'trending' ? 'Trending' : listType === 'popular' ? 'Popular' : 'Top Rated'} Movies & TV Shows`,
        description: `Browse ${listType} content on Riocut`,
        itemListElement: items.slice(0, 10).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': item.media_type === 'movie' ? 'Movie' : 'TVSeries',
                name: item.title || item.name,
                url: `${siteConfig.url}/${item.media_type}/${item.id}`,
                image: getImageUrl(item.poster_path, 'w500'),
                datePublished: item.release_date || item.first_air_date,
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
    person: (person: any) => ({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: person.name,
        url: `https://www.themoviedb.org/person/${person.id}`,
        image: person.profile_path ? getImageUrl(person.profile_path, 'w500') : undefined,
        jobTitle: person.known_for_department,
        sameAs: `https://www.themoviedb.org/person/${person.id}`,
    }),

    // Blog Post Schema Generator
    blogPost: (post: any) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description || post.excerpt,
        image: post.imageUrl || post.featuredImage,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt || post.publishedAt || post.createdAt,
        author: {
            '@type': 'Person',
            name: post.author || 'Riocut Editorial Team',
            url: post.authorUrl || siteConfig.url,
        },
        publisher: {
            '@type': 'Organization',
            name: siteConfig.publisher,
            logo: {
                '@type': 'ImageObject',
                url: `${siteConfig.url}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteConfig.url}/blog/${post.slug}`,
        },
        keywords: post.tags?.join(', ') || post.keywords,
        articleSection: post.category || 'Entertainment',
        wordCount: post.content?.split(' ').length || 0,
    }),

    // Review Schema Generator (for movie/TV reviews in blog)
    review: (review: any) => ({
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
        const movie = await getMovieDetails(parseInt(id))

        const title = `Watch ${movie.title} (${new Date(movie.release_date).getFullYear()}) Free Online`
        const description = `Watch ${movie.title} free online in HD. ${movie.overview.length > 120 ? `${movie.overview.substring(0, 117)}...` : movie.overview} Stream now without subscription.`

        const imageUrl = getImageUrl(movie.backdrop_path || movie.poster_path, 'w1280')
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
                ...movie.genres.map((g: any) => `free ${g.name.toLowerCase()} movies`),
                ...movie.credits?.cast.slice(0, 3).map((actor: any) => actor.name) || [],
                movie.credits?.crew.find((c: any) => c.job === 'Director')?.name || '',
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
                'article:author': movie.credits?.crew.find((c: any) => c.job === 'Director')?.name || '',
                'article:published_time': movie.release_date,
                'video:duration': movie.runtime ? (movie.runtime * 60).toString() : '',
                'video:release_date': movie.release_date,
            },
        }
    } catch (error) {
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

        const imageUrl = getImageUrl(show.backdrop_path || show.poster_path, 'w1280')
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
                ...show.genres.map((g: any) => `free ${g.name.toLowerCase()} series`),
                ...show.credits?.cast.slice(0, 3).map((actor: any) => actor.name) || [],
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
    } catch (error) {
        return {
            title: 'TV Show Not Found | Riocut',
            description: 'The requested TV show could not be found.',
        }
    }
}

export async function generateMovieJSONLD(id: string) {
    try {
        const movie = await getMovieDetails(parseInt(id))

        return {
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: movie.title,
            description: movie.overview,
            image: getImageUrl(movie.poster_path, 'w500'),
            datePublished: movie.release_date,
            director: movie.credits?.crew.find((c: any) => c.job === 'Director') ? {
                '@type': 'Person',
                name: movie.credits.crew.find((c: any) => c.job === 'Director').name,
            } : undefined,
            actor: movie.credits?.cast?.slice(0, 5).map((actor: any) => ({
                '@type': 'Person',
                name: actor.name,
            })),
            genre: movie.genres?.map((genre: any) => genre.name),
            aggregateRating: movie.vote_average ? {
                '@type': 'AggregateRating',
                ratingValue: movie.vote_average,
                ratingCount: movie.vote_count || 1,
                bestRating: 10,
                worstRating: 0,
            } : undefined,
            duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
        }
    } catch (error) {
        return null
    }
}

export async function generateTVJSONLD(id: string) {
    try {
        const show = await getTVDetails(parseInt(id))

        return {
            '@context': 'https://schema.org',
            '@type': 'TVSeries',
            name: show.name,
            description: show.overview,
            image: getImageUrl(show.poster_path, 'w500'),
            datePublished: show.first_air_date,
            creator: show.created_by?.map((creator: any) => ({
                '@type': 'Person',
                name: creator.name,
            })),
            actor: show.credits?.cast.slice(0, 5).map((actor: any) => ({
                '@type': 'Person',
                name: actor.name,
                sameAs: `https://www.themoviedb.org/person/${actor.id}`
            })),
            genre: show.genres.map((g: any) => g.name),
            aggregateRating: show.vote_average ? {
                '@type': 'AggregateRating',
                ratingValue: show.vote_average,
                ratingCount: show.vote_count || 1,
                bestRating: 10,
                worstRating: 0,
            } : undefined,
            numberOfSeasons: show.number_of_seasons,
            numberOfEpisodes: show.number_of_episodes,
            sameAs: `https://www.themoviedb.org/tv/${show.id}`,
        }
    } catch (error) {
        return null
    }
}

// Generate Blog Post Metadata
export function generateBlogMetadata(post: {
    title: string
    description?: string
    excerpt?: string
    imageUrl?: string
    featuredImage?: string
    publishedAt?: string
    createdAt?: string
    updatedAt?: string
    author?: string
    slug: string
    tags?: string[]
    category?: string
}): Metadata {
    const description = post.description || post.excerpt || `Read ${post.title} on Riocut blog - Free movie and TV show reviews, news, and streaming guides.`
    const imageUrl = post.imageUrl || post.featuredImage || `${siteConfig.url}/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent('Riocut Blog')}`
    const publishDate = post.publishedAt || post.createdAt || new Date().toISOString()

    return {
        title: `${post.title} | Riocut Blog`,
        description: truncateDescription(description, 160),
        keywords: [
            post.title,
            'riocut blog',
            'free movie streaming',
            'watch movies free',
            'movie reviews',
            'tv show guides',
            'entertainment blog',
            ...(post.tags || []),
            ...(post.category ? [post.category] : []),
            ...seoKeywords.blog,
        ],
        authors: [{ name: post.author || 'Riocut Editorial Team' }],
        category: post.category || 'Entertainment',
        openGraph: {
            type: 'article',
            title: post.title,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            publishedTime: publishDate,
            modifiedTime: post.updatedAt || publishDate,
            authors: [post.author || 'Riocut Editorial Team'],
            section: post.category || 'Entertainment',
            tags: post.tags,
            locale: 'en_US',
            siteName: siteConfig.name,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: truncateDescription(description, 200),
            images: [imageUrl],
            creator: '@riocut',
        },
        alternates: {
            canonical: `${siteConfig.url}/blog/${post.slug}`,
        },
    }
}

// Generate Blog List/Archive Metadata
export function generateBlogListMetadata(
    page: number = 1,
    category?: string,
    tag?: string
): Metadata {
    let title = 'Blog - Free Movie & TV Show Reviews, News & Guides | Riocut'
    let description = 'Discover the latest movie reviews, TV show guides, streaming tips, and entertainment news. Learn how to watch movies and TV series free on Riocut.'

    if (category) {
        title = `${category} - Riocut Blog`
        description = `Browse ${category.toLowerCase()} articles about free movie streaming, reviews, and guides on Riocut.`
    }

    if (tag) {
        title = `${tag} Articles - Riocut Blog`
        description = `All articles tagged with ${tag}. Movie reviews, TV guides, and streaming tips.`
    }

    if (page > 1) {
        title = `${title} - Page ${page}`
    }

    return {
        title,
        description: truncateDescription(description, 160),
        keywords: [
            'movie blog',
            'tv show blog',
            'free streaming blog',
            'movie reviews',
            'tv show guides',
            'entertainment news',
            ...(category ? [category] : []),
            ...(tag ? [tag] : []),
            ...seoKeywords.blog,
        ],
        openGraph: {
            type: 'website',
            title,
            description,
            locale: 'en_US',
            siteName: siteConfig.name,
        },
        alternates: {
            canonical: `${siteConfig.url}/blog${page > 1 ? `?page=${page}` : ''}`,
        },
        robots: {
            index: true,
            follow: true,
        },
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

// Generate comprehensive blog post structured data
export function generateBlogPostStructuredData(post: any, postUrl: string) {
    const imageUrl = post.featuredImage ||
        (post.mediaBackdropPath ? `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}` : null) ||
        `${siteConfig.url}/og-image-blog.jpg`;

    const baseStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': postUrl,
        headline: post.title,
        description: post.excerpt || truncateDescription(post.content?.replace(/<[^>]*>/g, '') || '', 160),
        image: {
            '@type': 'ImageObject',
            url: imageUrl,
            width: 1200,
            height: 630,
        },
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt?.toISOString() || post.publishedAt?.toISOString(),
        author: {
            '@type': 'Person',
            name: post.author?.name || 'Riocut Editorial Team',
            url: siteConfig.url,
        },
        publisher: {
            '@type': 'Organization',
            name: siteConfig.publisher,
            url: siteConfig.url,
            logo: {
                '@type': 'ImageObject',
                url: `${siteConfig.url}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': postUrl,
        },
        keywords: post.tags?.join(', '),
        articleSection: post.category,
        wordCount: post.content?.split(' ').length || 0,
        inLanguage: 'en-US',
        isPartOf: {
            '@type': 'Blog',
            '@id': `${siteConfig.url}/blog`,
            name: 'Riocut Blog',
            description: 'Movie and TV show reviews, entertainment news, and streaming guides.',
        },
        potentialAction: {
            '@type': 'ReadAction',
            target: postUrl,
        },
    };

    // Add review schema if this is a movie/TV review
    if (post.mediaId && post.mediaType && post.mediaRating !== null) {
        const reviewSchema = {
            '@type': 'Review',
            '@id': `${postUrl}#review`,
            itemReviewed: {
                '@type': post.mediaType === 'movie' ? 'Movie' : 'TVSeries',
                name: post.mediaTitle || post.title || 'Movie Review',
                image: post.mediaPosterPath ? `https://image.tmdb.org/t/p/w500${post.mediaPosterPath}` : undefined,
                datePublished: post.mediaReleaseDate,
            },
            author: baseStructuredData.author,
            datePublished: baseStructuredData.datePublished,
            reviewBody: post.excerpt || baseStructuredData.description,
            reviewRating: {
                '@type': 'Rating',
                ratingValue: post.mediaRating || 0,
                bestRating: 10,
                worstRating: 0,
            },
        };

        // Nest the review in the BlogPosting for better connectivity
        (baseStructuredData as any).review = reviewSchema;
    }

    return [baseStructuredData];
}

// Generate FAQ structured data for blog posts
export function generateFAQStructuredData(faqs: Array<{ question: string, answer: string }>) {
    if (!faqs || faqs.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string, url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${siteConfig.url}${item.url}`,
        })),
    };
}

// Generate video structured data (for posts with video content)
export function generateVideoStructuredData(video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    embedUrl?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.name,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        uploadDate: video.uploadDate,
        duration: video.duration,
        embedUrl: video.embedUrl,
        publisher: {
            '@type': 'Organization',
            name: siteConfig.publisher,
            logo: {
                '@type': 'ImageObject',
                url: `${siteConfig.url}/logo.png`,
            },
        },
    };
}