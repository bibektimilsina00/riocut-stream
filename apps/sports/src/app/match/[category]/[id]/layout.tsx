import type { Metadata } from 'next';
import { pageMetadata, SITE_NAME, SITE_URL } from '@/lib/seo';
import { sportsrc, getMatchKickoff, pickBestSource } from '@/lib/sportsrc';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string; id: string }>;
}): Promise<Metadata> {
    const { category, id } = await params;
    const pretty = category.replace(/-/g, ' ');

    try {
        const detail = await sportsrc.getMatchDetail(category, id);
        if (detail) {
            const home = detail.teams?.home?.name ?? 'Home';
            const away = detail.teams?.away?.name ?? 'Away';
            const title = `Watch ${home} vs ${away} Live Stream — ${pretty}`;
            const kickoff = getMatchKickoff(detail);
            const when = kickoff ? kickoff.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'Soon';
            const description =
                `Watch ${home} vs ${away} (${pretty}) live free on ${SITE_NAME}. ` +
                `Kickoff: ${when}. Lineups, scores, multi-source HD streams, ` +
                `and a watch-together lobby with chat + video for friends.`;
            return pageMetadata({
                title,
                description,
                path: `/match/${category}/${id}`,
                image: detail.poster ?? undefined,
                type: 'video.other',
                keywords: [
                    `${home} vs ${away} live`,
                    `${home} ${away} stream`,
                    `${home} vs ${away} free stream`,
                    `${pretty} live stream`,
                    `watch ${home} live`,
                    `watch ${away} live`,
                    'live sports streaming',
                    'free HD sports stream',
                ],
            });
        }
    } catch { /* fall through */ }

    return pageMetadata({
        title: `Watch Live ${pretty} Match`,
        description: `Live ${pretty} stream on ${SITE_NAME}. Multi-source HD streams free.`,
        path: `/match/${category}/${id}`,
    });
}

export default async function MatchLayout({
    params,
    children,
}: {
    params: Promise<{ category: string; id: string }>;
    children: React.ReactNode;
}) {
    const { category, id } = await params;
    // SportsEvent JSON-LD for Google rich-result eligibility.
    let jsonLd: Record<string, unknown> | null = null;
    try {
        const detail = await sportsrc.getMatchDetail(category, id);
        if (detail) {
            const home = detail.teams?.home?.name ?? 'Home';
            const away = detail.teams?.away?.name ?? 'Away';
            const kickoff = getMatchKickoff(detail);
            const embedUrl = pickBestSource(detail)?.embedUrl ?? null;
            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'SportsEvent',
                name: `${home} vs ${away}`,
                description: `${home} vs ${away} live stream on ${SITE_NAME}`,
                startDate: kickoff?.toISOString() ?? undefined,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
                location: {
                    '@type': 'VirtualLocation',
                    url: `${SITE_URL}/match/${encodeURIComponent(category)}/${encodeURIComponent(id)}`,
                },
                image: detail.poster ?? undefined,
                competitor: [
                    { '@type': 'SportsTeam', name: home, logo: detail.teams?.home?.badge ?? undefined },
                    { '@type': 'SportsTeam', name: away, logo: detail.teams?.away?.badge ?? undefined },
                ],
                offers: {
                    '@type': 'Offer',
                    url: `${SITE_URL}/match/${encodeURIComponent(category)}/${encodeURIComponent(id)}`,
                    price: '0',
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                },
                video: embedUrl
                    ? {
                        '@type': 'VideoObject',
                        name: `${home} vs ${away}`,
                        description: `Live stream of ${home} vs ${away}`,
                        thumbnailUrl: detail.poster ?? undefined,
                        embedUrl,
                        uploadDate: kickoff?.toISOString() ?? new Date().toISOString(),
                    }
                    : undefined,
            };
        }
    } catch { /* ignore */ }

    return (
        <>
            {jsonLd ? (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            ) : null}
            {children}
        </>
    );
}
