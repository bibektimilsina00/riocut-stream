import type { Metadata } from 'next';
import { pageMetadata, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Teams — Squads, Fixtures & Results',
    description: `Browse football teams on ${SITE_NAME}. Search clubs and national teams, view squads, venues, fixtures and results.`,
    path: '/teams',
    keywords: ['football teams', 'club squads', 'team fixtures', 'team results'],
});

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
