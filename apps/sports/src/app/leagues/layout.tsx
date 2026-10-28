import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Leagues & Tournaments — Fixtures, Live Scores & Standings',
    description:
        'Premier League, Champions League, IPL, Nepal Premier League, Big Bash, NBA, NFL, Formula 1, UFC and more on ' +
        'RioSports. Fixtures, live scores, standings and points tables — and watch every match we stream.',
    path: '/leagues',
    keywords: [
        'league standings',
        'cricket points table',
        'IPL points table',
        'Nepal Premier League live',
        'Premier League table',
        'NBA standings',
        'F1 standings',
        'live scores',
    ],
});

export default function LeaguesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
