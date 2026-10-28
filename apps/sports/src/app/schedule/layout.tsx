import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Sports Schedule — Today, Tomorrow & This Week',
    description:
        'Live and upcoming sports matches across the next 7 days on RioSports. ' +
        'Football, basketball, UFC, tennis and more — sorted by sport and kickoff time.',
    path: '/schedule',
    keywords: [
        'sports schedule today',
        'live sports schedule',
        'tomorrow sports',
        'this week sports fixtures',
        'football schedule',
        'NBA schedule',
        'UFC schedule',
    ],
});

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
