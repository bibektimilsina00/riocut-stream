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
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
            { protocol: 'https', hostname: '**' },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
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
