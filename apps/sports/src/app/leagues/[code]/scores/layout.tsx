import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ code: string }>;
}): Promise<Metadata> {
    const { code } = await params;
    const c = decodeURIComponent(code).toUpperCase();
    return pageMetadata({
        title: `${c} Scores — Live & Recent Results`,
        description:
            `Live and finished ${c} scores. Real-time goals, full-time results and match status. ` +
            `Watch the next match free on Riocut Sports.`,
        path: `/leagues/${code}/scores`,
        keywords: [`${c} live scores`, `${c} results`, `${c} match scores`, `${c} today`],
    });
}

export default function ScoresLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
