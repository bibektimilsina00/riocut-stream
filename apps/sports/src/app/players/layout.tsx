import type { Metadata } from 'next';
import { pageMetadata, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Players — Profiles, Stats & Market Values',
    description: `Browse football players on ${SITE_NAME}. Search by name or position, and open full profiles with bio, market value, ratings, season stats, career and transfers.`,
    path: '/players',
    keywords: ['football players', 'player stats', 'player profiles', 'market value', 'player ratings'],
});

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
