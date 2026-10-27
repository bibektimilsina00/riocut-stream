import { PostHog } from 'posthog-node';

// Apps run as long-lived Node servers (Docker standalone), so one shared
// client with light batching is fine. ponytail: up to 5s of events can be lost on a hard restart.
let client: PostHog | null | undefined;

export function getPostHogServer(): PostHog | null {
    if (client !== undefined) return client;
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!token) {
        if (process.env.NODE_ENV === 'development') {
            throw new Error(
                'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
            );
        }
        return (client = null);
    }
    client = new PostHog(token, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 10,
        flushInterval: 5000,
        enableExceptionAutocapture: true,
    });
    return client;
}

type SessionLike = { user?: { id?: unknown; email?: string | null } | null } | null | undefined;

/** Stable distinct id for a logged-in user (matches client-side `identify`). */
export function distinctIdFromSession(session: SessionLike): string | undefined {
    const id = session?.user?.id;
    return typeof id === 'string' && id ? id : undefined;
}

/** Fire-and-forget server event. Never throws into the request path. */
export function captureServer(
    distinctId: string | undefined,
    event: string,
    properties?: Record<string, unknown>,
) {
    if (!distinctId) return;
    try {
        getPostHogServer()?.capture({ distinctId, event, properties: { source: 'server', ...properties } });
    } catch (e) {
        console.error('[posthog] capture failed', e);
    }
}

export function captureServerError(error: unknown, distinctId?: string, properties?: Record<string, unknown>) {
    try {
        getPostHogServer()?.captureException(error, distinctId, properties);
    } catch (e) {
        console.error('[posthog] captureException failed', e);
    }
}
