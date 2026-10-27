import { getTrending, getPopular, getTopRated, tmdbApi } from '@/lib/tmdb'
import { BaseMovie } from '@/lib/api/tmdb'
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

// Helper functions for additional movie data
async function getUpcoming(page: number = 1) {
    const response = await tmdbApi.get('/movie/upcoming', { params: { page } });
    return response.data.results;
}

async function getNowPlaying(page: number = 1) {
    const response = await tmdbApi.get('/movie/now_playing', { params: { page } });
    return response.data.results;
}

export async function GET() {
    const baseUrl = siteConfig.url

    try {
        // Fetch comprehensive movie data for better SEO coverage
        const moviePromises = []

        // Get multiple pages of popular content
        for (let page = 1; page <= 10; page++) {
            moviePromises.push(getPopular('movie', page).then(data => data.results || data))
        }

        // Get trending and top rated
        moviePromises.push(
            getTrending('movie', 'week'),
            getTrending('movie', 'day'),
            getTopRated('movie', 1).then(data => data.results || data),
            getTopRated('movie', 2).then(data => data.results || data),
            getUpcoming(1),
            getNowPlaying(1)
        )

        const pages = await Promise.allSettled(moviePromises)
        const successfulPages = pages
            .filter((result): result is PromiseFulfilledResult<BaseMovie[]> => result.status === 'fulfilled')
            .map(result => result.value)
            .flat()

        // Remove duplicates and sort by popularity
        const uniqueMovies = Array.from(
            new Map(successfulPages.map((m) => [m.id, m])).values()
        ).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))

        // Calculate priorities based on popularity and rating
        const calculatePriority = (movie: BaseMovie): number => {
            const rating = movie.vote_average || 0
            const popularity = movie.popularity || 0
            const voteCount = movie.vote_count || 0

            // High rating + high vote count = high priority
            if (rating >= 8 && voteCount >= 1000) return 0.9
            if (rating >= 7 && voteCount >= 500) return 0.8
            if (rating >= 6 && voteCount >= 100) return 0.7
            if (popularity >= 100) return 0.6
            return 0.5
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${uniqueMovies
                .map((movie) => {
                    const priority = calculatePriority(movie)
                    const releaseDate = movie.release_date ? new Date(movie.release_date) : new Date()
                    const isRecent = releaseDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
                    const changefreq = isRecent ? 'weekly' : 'monthly'

                    // Add image information for better SEO
                    const imageUrl = movie.poster_path ?
                        `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
                    const movieTitle = escapeXml(movie.title || 'Movie')

                    return `  <url>
    <loc>${baseUrl}/movie/${movie.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageUrl ? `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${movieTitle} Poster</image:title>
      <image:caption>Official poster for ${movieTitle}</image:caption>
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
        console.error('Error generating movies sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
