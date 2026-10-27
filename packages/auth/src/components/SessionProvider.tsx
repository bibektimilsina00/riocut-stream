'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import IdentifyUser from '@riocut/analytics/components/IdentifyUser';

export default function SessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NextAuthSessionProvider>
            <IdentifyUser />
            {children}
        </NextAuthSessionProvider>
    );
}
