import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { sportMeta } from '@/lib/sports';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
    const { category } = await params;
    const { label } = sportMeta(decodeURIComponent(category));
    return pageMetadata({
        title: `${label} Schedule — Fixtures This Week`,
        description: `${label} fixtures for the next 7 days, with kickoff times in your timezone and a live stream for every match we carry.`,
        path: `/sports/${category}/schedule`,
        keywords: [`${label.toLowerCase()} schedule`, `${label.toLowerCase()} fixtures`, `${label.toLowerCase()} today`],
    });
}

export default function SportScheduleLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
