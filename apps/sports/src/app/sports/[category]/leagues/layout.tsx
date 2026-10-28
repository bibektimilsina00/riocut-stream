import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { sportMeta } from '@/lib/sports';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
    const { category } = await params;
    const { label } = sportMeta(decodeURIComponent(category));
    return pageMetadata({
        title: `${label} Leagues & Tournaments — Fixtures, Scores & Standings`,
        description: `Every ${label.toLowerCase()} competition we cover: live scores, fixtures, results and standings, with a watch button on every match we stream.`,
        path: `/sports/${category}/leagues`,
        keywords: [`${label.toLowerCase()} leagues`, `${label.toLowerCase()} tournaments`, `${label.toLowerCase()} standings`],
    });
}

export default function SportLeaguesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
