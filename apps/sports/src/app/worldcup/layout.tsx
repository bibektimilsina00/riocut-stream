import type { Metadata } from 'next';
import { pageMetadata, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'World Cup 2026 — Fixtures, Results & Squads',
    description: `Follow the FIFA World Cup 2026 on ${SITE_NAME}: full fixture schedule, live results by round, and qualified-squad standouts.`,
    path: '/worldcup',
    keywords: ['world cup 2026', 'world cup fixtures', 'world cup results', 'world cup squads', 'fifa 2026'],
});

export default function WorldCupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
