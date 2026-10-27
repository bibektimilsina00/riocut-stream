import { siteConfig } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // Revalidate once per day

export async function GET() {
    const baseUrl = siteConfig.url
    const blogUrl = 'https://blog.riocut.com' // Your blog subdomain

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${baseUrl}/sitemap.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${baseUrl}/sitemap-movies.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${baseUrl}/sitemap-tv.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${blogUrl}/blog/sitemap.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
</sitemapindex>`

    return new Response(sitemapIndex, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
    })
}