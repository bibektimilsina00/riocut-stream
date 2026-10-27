import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { CURATED_LEAGUES, espnSport } from '@/lib/espn';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ sport: string; league: string }>;
}): Promise<Metadata> {
    const { sport, league } = await params;
    const name = CURATED_LEAGUES.find((l) => l.sport === sport && l.slug === league)?.name
        ?? `${espnSport(sport)?.label ?? sport} tournament`;
    return pageMetadata({
        title: `${name} — Live Scores, Fixtures & Standings`,
        description:
            `${name} fixtures, live scores, results and standings, updated automatically. ` +
            `Watch ${name} matches live on Riocut Sports.`,
        path: `/leagues/${sport}/${league}`,
        keywords: [`${name} live`, `${name} live stream`, `${name} standings`, `${name} fixtures`, `${name} scores`],
    });
}

export default function LeagueLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
