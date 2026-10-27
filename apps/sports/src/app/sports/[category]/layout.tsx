import type { Metadata } from 'next';
import { pageMetadata, SITE_NAME } from '@/lib/seo';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}): Promise<Metadata> {
    const { category } = await params;
    const pretty = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return pageMetadata({
        title: `${pretty} Live Streams, Schedule & Scores`,
        description:
            `Watch ${pretty.toLowerCase()} live matches free on ${SITE_NAME}. ` +
            `Live now, upcoming fixtures, recent results — all in one place. No signup required to watch.`,
        path: `/sports/${category}`,
        keywords: [
            `${pretty.toLowerCase()} live stream`,
            `${pretty.toLowerCase()} schedule`,
            `${pretty.toLowerCase()} live scores`,
            `watch ${pretty.toLowerCase()} online`,
            `${pretty.toLowerCase()} matches today`,
        ],
    });
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
