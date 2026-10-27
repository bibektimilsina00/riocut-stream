import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Browse Sports — Football, Basketball, UFC, MMA & More',
    description:
        'All sports on Riocut Sports: football, basketball, American football, hockey, baseball, motor sports, UFC/MMA, tennis, rugby, golf, billiards, AFL, darts and cricket. Pick a sport to watch live matches free.',
    path: '/sports',
    keywords: [
        'browse sports', 'all sports streaming', 'list of live sports',
        'free sport channels', 'sports streaming app',
    ],
});

export default function SportsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
