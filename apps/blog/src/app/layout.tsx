import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@riocut/auth/components/SessionProvider'
import { QueryProvider as ReactQueryProvider } from '@riocut/realtime/client/QueryProvider'
import { siteConfig, seoKeywords } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: seoKeywords.primary.concat(seoKeywords.blog).join(', '),
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,

    metadataBase: new URL(siteConfig.url),

    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteConfig.url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: '/og-image-blog.jpg',
                width: 1200,
                height: 630,
                alt: `${siteConfig.name} - Movie & TV Reviews`,
            },
        ],
    },

    twitter: {
        card: 'summary_large_image',
        title: siteConfig.name,
        description: siteConfig.description,
        images: ['/og-image-blog.jpg'],
        creator: '@riocut',
        site: '@riocut',
    },

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },

    icons: {
        icon: [
            { url: '/icon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: '32x32' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },

    manifest: '/manifest.json',

    alternates: {
        types: {
            'application/rss+xml': [
                { url: '/blog/feed.xml', title: `${siteConfig.name} RSS Feed` },
            ],
        },
    },

    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        yandex: process.env.YANDEX_VERIFICATION,
        yahoo: process.env.YAHOO_SITE_VERIFICATION,
    },

    other: {
        'msapplication-TileColor': '#1f2937',
        'theme-color': '#1f2937',
    },
}

export const viewport: Viewport = {
    themeColor: '#1f2937',
    colorScheme: 'dark',
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID

    return (
        <html lang="en" className="dark">
            <head>
                {/* Google Analytics */}
                {gaId && (
                    <>
                        <script
                            async
                            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        />
                        <script
                            dangerouslySetInnerHTML={{
                                __html: `
                                    window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                    gtag('js', new Date());
                                    gtag('config', '${gaId}');
                                `,
                            }}
                        />
                    </>
                )}

                {/* DNS Prefetch for external domains */}
                <link rel="dns-prefetch" href="//image.tmdb.org" />
                <link rel="dns-prefetch" href="//fonts.googleapis.com" />
                {gaId && <link rel="dns-prefetch" href="//www.googletagmanager.com" />}

                {/* Preconnect for critical external resources */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* RSS Feed */}
                <link
                    rel="alternate"
                    type="application/rss+xml"
                    title={`${siteConfig.name} RSS Feed`}
                    href="/blog/feed.xml"
                />

                {/* Canonical link will be set by individual pages */}

                {/* Security headers */}
                <meta name="referrer" content="origin-when-cross-origin" />

                {/* Performance hints */}
                <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

                {/* Favicons - Multiple formats for better compatibility */}
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="icon" href="/icon.svg" type="image/svg+xml" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <SessionProvider>
                    <ReactQueryProvider>
                        <div className="min-h-screen bg-gray-950">
                            {children}
                        </div>
                    </ReactQueryProvider>
                </SessionProvider>

                {/* Schema.org structured data for organization */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: siteConfig.name,
                            url: siteConfig.url,
                            logo: `${siteConfig.url}/logo.svg`,
                            description: siteConfig.description,
                            sameAs: [
                                siteConfig.links.twitter,
                                siteConfig.links.github,
                            ],
                        })
                    }}
                />
            </body>
        </html>
    )
}