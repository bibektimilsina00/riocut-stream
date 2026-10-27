import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Football Leagues — Standings, Tables & Scores',
    description:
        'Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Eredivisie ' +
        'and more on Riocut Sports. Full league tables, standings and historical scores updated automatically.',
    path: '/leagues',
    keywords: [
        'football league standings',
        'Premier League table',
        'La Liga standings',
        'Bundesliga table',
        'Serie A standings',
        'Champions League table',
        'live football scores',
    ],
});

export default function LeaguesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
