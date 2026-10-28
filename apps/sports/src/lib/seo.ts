/**
 * Centralised SEO helpers for RioSports — keep titles, descriptions and
 * keyword sets here so per-route `generateMetadata` stays short.
 */
import type { Metadata } from 'next';

export const SITE_URL =
    process.env.NEXT_PUBLIC_RIOCUT_SPORTS_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://sports.riocut.com';
export const SITE_NAME = 'RioSports';
export const TWITTER_HANDLE = '@riocut';

const BASE_KEYWORDS = [
    'live sports streaming',
    'free live sports',
    'watch sports online',
    'RioSports',
    'football live stream',
    'basketball live stream',
    'NBA live stream',
    'Premier League stream',
    'La Liga stream',
    'UFC live stream',
    'MMA live stream',
    'tennis live',
    'cricket live',
    'sports schedule',
    'sports scores',
    'league standings',
    'watch sports with friends',
    'watch together sports',
    'sports streaming free',
];

export function pageMetadata({
    title,
    description,
    path = '/',
    keywords = [],
    image,
    type = 'website',
}: {
    title?: string;
    description: string;
    path?: string;
    keywords?: string[];
    image?: string;
    type?: 'website' | 'article' | 'video.other';
}): Metadata {
    const fullTitle = title ?? `${SITE_NAME} — Live Sports Streaming`;
    const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const og = image ?? `${SITE_URL}/og-default.png`;

    return {
        title: fullTitle,
        description,
        keywords: Array.from(new Set([...BASE_KEYWORDS, ...keywords])),
        alternates: { canonical: url },
        openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: SITE_NAME,
            images: [{ url: og, width: 1200, height: 630, alt: fullTitle }],
            locale: 'en_US',
            type: type as 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            site: TWITTER_HANDLE,
            creator: TWITTER_HANDLE,
            images: [og],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
    };
}
