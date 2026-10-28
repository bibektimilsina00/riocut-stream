import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { sportsrc } from '@/lib/sportsrc';
import { CURATED_LEAGUES } from '@/lib/espn';
import { sportMeta } from '@/lib/sports';

// Limit per-section to keep sitemap size sane.
const MATCHES_PER_SPORT = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const staticUrls: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
        { url: `${SITE_URL}/sports`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${SITE_URL}/schedule`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${SITE_URL}/leagues`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
        { url: `${SITE_URL}/watchlist`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    ];

    let dynamicUrls: MetadataRoute.Sitemap = [];
    try {
        const sports = await sportsrc.getSports();
        const sportUrls: MetadataRoute.Sitemap = sports.flatMap((s) => {
            const hub = `${SITE_URL}/sports/${encodeURIComponent(s.id)}`;
            return [
                { url: hub, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.8 },
                { url: `${hub}/schedule`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.6 },
                ...(sportMeta(s.id).espn ? [{ url: `${hub}/leagues`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6 }] : []),
            ];
        });

        const featured = ['football', 'cricket', 'basketball', 'american-football', 'fight', 'motor-sports', 'tennis', 'hockey'];
        const matchLists = await Promise.allSettled(
            featured.map((cat) => sportsrc.getMatches(cat)),
        );
        const matchUrls: MetadataRoute.Sitemap = matchLists.flatMap((r, i) => {
            if (r.status !== 'fulfilled') return [];
            const cat = featured[i];
            return r.value.slice(0, MATCHES_PER_SPORT).map((m) => ({
                url: `${SITE_URL}/match/${encodeURIComponent(cat)}/${encodeURIComponent(String(m.id))}`,
                lastModified: m.date ? new Date(m.date) : now,
                changeFrequency: 'hourly' as const,
                priority: 0.8,
            }));
        });

        const leagueUrls: MetadataRoute.Sitemap = CURATED_LEAGUES.map((l) => ({
            url: `${SITE_URL}/leagues/${l.sport}/${encodeURIComponent(l.slug)}`,
            lastModified: now,
            changeFrequency: 'hourly' as const,
            priority: 0.7,
        }));

        dynamicUrls = [...sportUrls, ...matchUrls, ...leagueUrls];
    } catch {
        // Network/sportsrc hiccup — ship just the static section.
    }

    return [...staticUrls, ...dynamicUrls];
}
