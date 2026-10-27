'use client';

import posthog from 'posthog-js';

export type RiocutApp = 'movies' | 'sports' | 'tv' | 'blog' | 'admin';

const TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

/** Call once from each app's `src/instrumentation-client.ts`. */
export function initPostHog(app: RiocutApp) {
    if (!TOKEN) {
        if (process.env.NODE_ENV === 'development') {
            throw new Error(
                'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
            );
        }
        return; // production: no-op
    }

    posthog.init(TOKEN, {
        // First-party proxy (next.config rewrites) so ad blockers don't drop events.
        api_host: '/ingest',
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
        defaults: '2026-08-30',
        capture_exceptions: true,
        // Lets server-side errors/events link back to this browser session.
        tracing_headers: [window.location.hostname],
        // Same anonymous id across riocut.com and *.riocut.com.
        cross_subdomain_cookie: true,
        debug: process.env.NODE_ENV === 'development',
    });
    posthog.register({ app });
}

/** Safe capture: a no-op when PostHog isn't initialised. */
export function track(event: string, properties?: Record<string, unknown>) {
    if (posthog.__loaded) posthog.capture(event, properties);
}

export function trackError(error: unknown, properties?: Record<string, unknown>) {
    if (posthog.__loaded) posthog.captureException(error, properties);
}

export { posthog };
