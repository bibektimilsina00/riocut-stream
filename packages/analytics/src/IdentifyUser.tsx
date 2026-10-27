'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { posthog } from './client';

/**
 * Keeps PostHog's person in sync with the NextAuth session. Rendered once
 * inside the shared SessionProvider, so it covers login, signup (auto-login),
 * cross-subdomain SSO and logout in every app.
 */
export default function IdentifyUser() {
    const { data: session, status } = useSession();
    const user = session?.user as { id?: string; email?: string | null; name?: string | null; role?: string } | undefined;

    useEffect(() => {
        if (!posthog.__loaded || status === 'loading') return;
        if (status === 'authenticated' && user?.id) {
            if (posthog.get_distinct_id() !== user.id) {
                posthog.identify(user.id, { email: user.email, name: user.name, role: user.role });
            }
        } else if (status === 'unauthenticated' && posthog._isIdentified()) {
            // Logged out: don't let the next person on this browser inherit the identity.
            posthog.reset();
        }
    }, [status, user?.id, user?.email, user?.name, user?.role]);

    return null;
}
