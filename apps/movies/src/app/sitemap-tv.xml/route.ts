import { getTrending, getPopular, getTopRated, tmdbApi } from '@/lib/tmdb'
import { BaseTVShow } from '@/lib/api/tmdb'
import { siteConfig } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 43200 // Revalidate twice per day for better freshness

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Helper functions for additional TV show data
async function getOnTheAir(page: number = 1) {
    const response = await tmdbApi.get('/tv/on_the_air', { params: { page } });
    return response.data.results;
}

async function getAiringToday(page: number = 1) {
    const response = await tmdbApi.get('/tv/airing_today', { params: { page } });
    return response.data.results;
}

export async function GET() {
    const baseUrl = siteConfig.url

    try {
        // Fetch comprehensive TV show data for better SEO coverage
        const showPromises = []

        // Get multiple pages of popular content
        for (let page = 1; page <= 8; page++) {
            showPromises.push(getPopular('tv', page).then(data => data.results || data))
        }

        // Get trending and top rated
        showPromises.push(
            getTrending('tv', 'week'),
            getTrending('tv', 'day'),
            getTopRated('tv', 1).then(data => data.results || data),
            getTopRated('tv', 2).then(data => data.results || data),
            getOnTheAir(1),
            getAiringToday(1)
        )

        const pages = await Promise.allSettled(showPromises)
        const successfulPages = pages
            .filter((result): result is PromiseFulfilledResult<BaseTVShow[]> => result.status === 'fulfilled')
            .map(result => result.value)
            .flat()

        // Remove duplicates and sort by popularity
        const uniqueShows = Array.from(
            new Map(successfulPages.map((s) => [s.id, s])).values()
        ).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))

        // Calculate priorities based on popularity and rating
        const calculatePriority = (show: BaseTVShow): number => {
            const rating = show.vote_average || 0
            const popularity = show.popularity || 0
            const voteCount = show.vote_count || 0

            // High rating + high vote count = high priority
            if (rating >= 8.5 && voteCount >= 1000) return 0.9
            if (rating >= 8 && voteCount >= 500) return 0.8
            if (rating >= 7 && voteCount >= 200) return 0.7
            if (popularity >= 100) return 0.6
            return 0.5
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${uniqueShows
                .map((show) => {
                    const priority = calculatePriority(show)
                    const firstAirDate = show.first_air_date ? new Date(show.first_air_date) : new Date()
                    const isRecent = firstAirDate > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) // Last 2 years
                    const changefreq = isRecent ? 'weekly' : 'monthly'

                    // Add image information for better SEO
                    const imageUrl = show.poster_path ?
                        `https://image.tmdb.org/t/p/w500${show.poster_path}` : ''
                    const showName = escapeXml(show.name || 'TV Show')

                    return `  <url>
    <loc>${baseUrl}/tv/${show.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageUrl ? `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${showName} Poster</image:title>
      <image:caption>Official poster for ${showName}</image:caption>
    </image:image>` : ''}
  </url>`
                })
                .join('\n')}
</urlset>`

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600',
                'X-Robots-Tag': 'noindex', // Sitemap itself shouldn't be indexed
            },
        })
    } catch (error) {
        console.error('Error generating TV shows sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
