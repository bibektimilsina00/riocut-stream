import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionProvider from "@riocut/auth/components/SessionProvider";
import { QueryProvider } from "@riocut/realtime/client/QueryProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SITE_URL, SITE_NAME, TWITTER_HANDLE } from "@/lib/seo";

export const dynamic = 'force-dynamic';

const ROOT_DESCRIPTION =
    "Watch live football, basketball, UFC, MMA, tennis, cricket and more on RioSports. " +
    "Free live streams, league standings, match schedules, scores and a watch-together " +
    "lobby — all in one privacy-friendly hub.";

const ROOT_KEYWORDS = [
    "RioSports", "live sports streaming", "free live sports", "watch sports online",
    "football live stream", "Premier League stream", "La Liga stream", "Champions League stream",
    "NBA live stream", "basketball live", "UFC live stream", "MMA live stream",
    "tennis live", "cricket live", "rugby live", "hockey live", "motor sports live",
    "watch together", "sports watch party",
    "live scores", "league standings", "sports schedule today",
];

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#0a0f0f",
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} — Free Live Sports Streaming, Schedules & Scores`,
        template: `%s | ${SITE_NAME}`,
    },
    description: ROOT_DESCRIPTION,
    keywords: ROOT_KEYWORDS,
    applicationName: SITE_NAME,
    referrer: "origin-when-cross-origin",
    authors: [{ name: "Riocut Network", url: "https://riocut.com" }],
    creator: "Riocut Network",
    publisher: "Riocut Network",
    category: "sports",
    alternates: {
        canonical: SITE_URL,
    },
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico" },
        ],
        apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
        type: "website",
        siteName: SITE_NAME,
        locale: "en_US",
        url: SITE_URL,
        title: `${SITE_NAME} — Free Live Sports Streaming`,
        description: ROOT_DESCRIPTION,
        images: [
            {
                url: `${SITE_URL}/og-default.png`,
                width: 1200,
                height: 630,
                alt: `${SITE_NAME} — Live Sports Streaming`,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: TWITTER_HANDLE,
        creator: TWITTER_HANDLE,
        title: `${SITE_NAME} — Free Live Sports Streaming`,
        description: ROOT_DESCRIPTION,
        images: [`${SITE_URL}/og-default.png`],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },
    verification: {
        // Drop google/bing/yandex codes here once you register the property.
    },
    other: {
        "og:locality": "Worldwide",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* WebSite + SearchAction structured data for sitelinks search box */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: SITE_NAME,
                            url: SITE_URL,
                            potentialAction: {
                                "@type": "SearchAction",
                                target: `${SITE_URL}/search?q={search_term_string}`,
                                "query-input": "required name=search_term_string",
                            },
                        }),
                    }}
                />
                {/* Organization + sameAs */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: "Riocut Network",
                            url: "https://riocut.com",
                            logo: `${SITE_URL}/icon.svg`,
                            sameAs: [
                                "https://twitter.com/riocut",
                                "https://instagram.com/riocut",
                            ],
                        }),
                    }}
                />
                <link rel="dns-prefetch" href="//cloud.umami.is" />
            </head>
            <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
                {/* Umami Analytics */}
                <Script
                    defer
                    src="https://cloud.umami.is/script.js"
                    data-website-id="22c46fce-dd53-4613-a2d1-8f9ab59f3b3e"
                    strategy="afterInteractive"
                />
                <SessionProvider>
                    <QueryProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navigation />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                        <ToastContainer
                            position="bottom-right"
                            autoClose={3500}
                            theme="dark"
                            newestOnTop
                            limit={5}
                        />
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
