import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/watch-together',
                    '/watchlist',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/'],
                crawlDelay: 0,
            },
        ],
        sitemap: [
            `${siteConfig.url}/sitemap.xml`,
            `${siteConfig.url}/sitemap-movies.xml`,
            `${siteConfig.url}/sitemap-tv.xml`,
        ],
        host: siteConfig.url,
    }
}
