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
        title: `${c} Standings — League Table & Position`,
        description:
            `Up-to-date ${c} league table. Position, played, won, drawn, lost, goal difference and points — ` +
            `refreshed automatically. Watch ${c} live matches free on Riocut Sports.`,
        path: `/leagues/${code}/tables`,
        keywords: [`${c} standings`, `${c} table`, `${c} league position`, `${c} points`],
    });
}

export default function TablesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
