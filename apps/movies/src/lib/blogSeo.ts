import type { Metadata } from 'next';

export interface BlogSEOConfig {
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
    canonical?: string;
}

export function generateBlogMetadata(config: BlogSEOConfig): Metadata {
    const {
        title,
        description,
        keywords,
        ogImage,
        publishedTime,
        modifiedTime,
        author,
        section,
        tags,
        canonical,
    } = config;

    const siteName = 'Riocut';
    const siteUrl = process.env.NEXTAUTH_URL || 'https://riocut.com';
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const imageUrl = ogImage || `${siteUrl}/og-image.jpg`;

    return {
        title: fullTitle,
        description,
        keywords: keywords?.join(', '),
        authors: author ? [{ name: author }] : undefined,
        openGraph: {
            title: fullTitle,
            description,
            type: 'article',
            url: canonical || siteUrl,
            siteName,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            publishedTime,
            modifiedTime,
            authors: author ? [author] : undefined,
            section,
            tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [imageUrl],
            creator: '@riocut',
            site: '@riocut',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        alternates: {
            canonical: canonical || siteUrl,
        },
    };
}

// Generate JSON-LD structured data for articles
export function generateArticleStructuredData(config: {
    title: string;
    description: string;
    author: string;
    publishedTime: string;
    modifiedTime?: string;
    image: string;
    url: string;
    keywords?: string[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: config.title,
        description: config.description,
        image: config.image,
        datePublished: config.publishedTime,
        dateModified: config.modifiedTime || config.publishedTime,
        author: {
            '@type': 'Person',
            name: config.author,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Riocut',
            logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXTAUTH_URL || 'https://riocut.com'}/icon-512.png`,
            },
        },
        keywords: config.keywords?.join(', '),
        url: config.url,
    };
}

// Generate JSON-LD structured data for movie reviews
export function generateMovieReviewStructuredData(config: {
    title: string;
    description: string;
    author: string;
    publishedTime: string;
    movieTitle: string;
    movieReleaseDate?: string;
    rating?: number;
    image: string;
    url: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
            '@type': 'Movie',
            name: config.movieTitle,
            dateCreated: config.movieReleaseDate,
            image: config.image,
        },
        reviewRating: config.rating
            ? {
                '@type': 'Rating',
                ratingValue: config.rating,
                bestRating: 10,
                worstRating: 0,
            }
            : undefined,
        author: {
            '@type': 'Person',
            name: config.author,
        },
        datePublished: config.publishedTime,
        reviewBody: config.description,
        publisher: {
            '@type': 'Organization',
            name: 'Riocut',
        },
        url: config.url,
    };
}

// Generate JSON-LD structured data for TV show reviews
export function generateTVReviewStructuredData(config: {
    title: string;
    description: string;
    author: string;
    publishedTime: string;
    tvTitle: string;
    tvReleaseDate?: string;
    rating?: number;
    image: string;
    url: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
            '@type': 'TVSeries',
            name: config.tvTitle,
            dateCreated: config.tvReleaseDate,
            image: config.image,
        },
        reviewRating: config.rating
            ? {
                '@type': 'Rating',
                ratingValue: config.rating,
                bestRating: 10,
                worstRating: 0,
            }
            : undefined,
        author: {
            '@type': 'Person',
            name: config.author,
        },
        datePublished: config.publishedTime,
        reviewBody: config.description,
        publisher: {
            '@type': 'Organization',
            name: 'Riocut',
        },
        url: config.url,
    };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

// Calculate reading time from content
export function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}

// Generate slug from title
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
