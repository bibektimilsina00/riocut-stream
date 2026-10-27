import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(__dirname, '..', '..'),
    outputFileTracingIncludes: {
        '/**/*': [
            './node_modules/next/**/*',
            './node_modules/next/package.json',
            './node_modules/@next/**/*',
            './node_modules/.pnpm/next@*/**/*',
            './node_modules/styled-jsx/**/*',
            './node_modules/styled-jsx/package.json',
        ],
    },
    transpilePackages: [
        '@riocut/analytics',
        '@riocut/db',
        '@riocut/auth',
        '@riocut/ui',
        '@riocut/services',
        '@riocut/realtime',
    ],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'api.sportsrc.org', pathname: '/**' },
            { protocol: 'https', hostname: 'sportsrc.org', pathname: '/**' },
            { protocol: 'https', hostname: 'streamed.pk', pathname: '/**' },
            { protocol: 'https', hostname: 'streamed.st', pathname: '/**' },
            { protocol: 'https', hostname: 'media.api-sports.io', pathname: '/**' },
            { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
    // Old football-data.org league codes → ESPN league pages (indexed URLs).
    async redirects() {
        const codes: Record<string, string> = {
            PL: 'eng.1', PD: 'esp.1', SA: 'ita.1', BL1: 'ger.1', FL1: 'fra.1', DED: 'ned.1',
            PPL: 'por.1', ELC: 'eng.2', BSA: 'bra.1', CL: 'uefa.champions', WC: 'fifa.world', EC: 'uefa.euro',
        };
        return Object.entries(codes).map(([code, slug]) => ({
            source: `/leagues/${code}/:tab(tables|scores)`,
            destination: `/leagues/soccer/${slug}`,
            permanent: true,
        }));
    },
    // PostHog first-party proxy (see packages/analytics).
    skipTrailingSlashRedirect: true,
    async rewrites() {
        return [
            { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
            { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
        ];
    },
};

export default nextConfig;
