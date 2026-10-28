import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Search Sports, Teams, Leagues & Matches',
    description: 'Find live matches, sports, teams and leagues on RioSports. Type to filter — instant results.',
    path: '/search',
    keywords: ['search live sports', 'find sports stream', 'sports search engine'],
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
