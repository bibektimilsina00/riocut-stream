import type { Instrumentation } from 'next';

/**
 * Re-export from each app's `src/instrumentation.ts`:
 *   export { onRequestError } from '@riocut/analytics/instrumentation';
 * Reports server-side render/route errors to PostHog error tracking,
 * linked to the browser session via the PostHog tracing headers.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    const { getPostHogServer } = await import('./server');
    const ph = getPostHogServer();
    if (!ph) return;

    const header = (name: string) => {
        const v = request.headers[name];
        return Array.isArray(v) ? v[0] : v;
    };
    ph.captureException(err, header('x-posthog-distinct-id'), {
        $session_id: header('x-posthog-session-id'),
        path: request.path,
        method: request.method,
        router_kind: context.routerKind,
        route_path: context.routePath,
        route_type: context.routeType,
        source: 'server',
    });
};
