import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

// Main sitemap - Static pages only
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = siteConfig.url
    const currentDate = new Date()

    // Core static pages with optimized priorities and frequencies
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/movies`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tv`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/watchlist`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        // Authentication pages - lower priority
        {
            url: `${baseUrl}/login`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ]

    // Add genre-based discovery pages for better SEO
    const movieGenres = [
        'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
        'drama', 'family', 'fantasy', 'history', 'horror', 'music',
        'mystery', 'romance', 'science-fiction', 'thriller', 'war', 'western'
    ]

    const genreRoutes: MetadataRoute.Sitemap = movieGenres.flatMap(genre => [
        {
            url: `${baseUrl}/movies?genre=${genre}`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        },
        {
            url: `${baseUrl}/tv?genre=${genre}`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        },
    ])

    // Add popular sorting pages
    const sortingRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/movies?sort=popular`,
            lastModified: currentDate,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/movies?sort=top_rated`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
        {
            url: `${baseUrl}/movies?sort=upcoming`,
            lastModified: currentDate,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/tv?sort=popular`,
            lastModified: currentDate,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/tv?sort=top_rated`,
            lastModified: currentDate,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
        {
            url: `${baseUrl}/tv?sort=on_the_air`,
            lastModified: currentDate,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
    ]

    return [...staticRoutes, ...genreRoutes, ...sortingRoutes]
}
