import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import PerformanceMonitor from "@riocut/ui/components/PerformanceMonitor";
import ServiceWorker from "@riocut/ui/components/ServiceWorker";
import { QueryProvider } from "@riocut/realtime/client/QueryProvider";
import { siteConfig, seoKeywords } from "@/lib/seo";
import { seoConfig, generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seoConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  ...seoConfig.generateMetadata({
    title: 'Watch Movies & TV Shows Online Free - Stream HD Content',
    description: 'Discover and watch thousands of movies and TV shows online for free. Stream HD content, get detailed information, ratings, and reviews. No registration required.',
    keywords: [
      ...seoKeywords.primary,
      ...seoKeywords.secondary,
      ...seoKeywords.genres,
      "watch together",
      "group watch",
      "watchlist",
      "hd streaming free",
      "no ads free movies",
      "unlimited streaming",
      "no registration required",
      "movie database",
      "tv show database",
      "stream movies online",
      "free streaming platform",
      "entertainment hub"
    ],
    canonicalUrl: siteConfig.url,
  }),
  metadataBase: new URL(siteConfig.url),
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "entertainment",
  classification: "Free Movie & TV Streaming Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — Watch Movies & TV Shows Online Free`,
    description: "Stream unlimited movies and TV shows for free. No subscription, no payment required. Watch HD quality content, create watchlists, and enjoy Watch Together with friends.",
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Free Movie & TV Streaming Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Stream Movies & TV Shows Free`,
    description: "Watch unlimited movies and TV shows online free. No subscription required. HD quality streaming with Watch Together feature.",
    images: ["/og-image.jpg"],
    creator: "@riocut",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate Google Analytics Measurement ID format (G-XXXXXXXXXX)
  const isValidGAId = (id: string | undefined): boolean => {
    if (!id) return false;
    // GA4 format: G- followed by 10 alphanumeric characters
    const ga4Pattern = /^G-[A-Z0-9]{10}$/;
    return ga4Pattern.test(id);
  };

  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const validGAId = isValidGAId(gaMeasurementId) ? gaMeasurementId : null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.publisher,
        url: siteConfig.url,
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}/icon-512.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          siteConfig.links.twitter,
          siteConfig.links.github,
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
        },
      },
    ],
  };

  // Enhanced structured data
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema(siteConfig.url);

  return (
    <html lang="en" data-scroll-behavior="smooth" className="dark" suppressHydrationWarning>
      <head>
        {/* Enhanced Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Enhanced Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicons - Multiple formats for better compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* RSS Feed Discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Riocut Blog RSS Feed"
          href="https://blog.riocut.com/blog/rss.xml"
        />

        {/* Sitemap Reference */}
        <link rel="sitemap" type="application/xml" href="/sitemap-index.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <QueryProvider>
            <PerformanceMonitor />
            <ServiceWorker />
            {children}
          </QueryProvider>
        </SessionProvider>

        {/* Google Analytics */}
        {validGAId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${validGAId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                /**
                 * @type {any[]}
                 */
                window.dataLayer = window.dataLayer || [];
                /**
                 * Google Analytics gtag function
                 * @param {...any} args
                 */
                function gtag(...args) { window.dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', '${validGAId}');
              `}
            </Script>
          </>
        )}

        {/* Umami Analytics */}

        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id='ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53'
          strategy="afterInteractive"
        />

      </body>
    </html>
  );
}