import type { NextAuthConfig } from 'next-auth';

export interface AuthFactoryOptions {
    /**
     * The path for the sign-in page (default: '/login').
     */
    signInPage?: string;
    /**
     * Path prefixes that require an authenticated user. Anything not matching
     * is open. Default: `['/dashboard', '/watchlist', '/watch-party']`.
     */
    protectedPaths?: string[];
    /**
     * Path prefixes that require an authenticated user AND `role==='admin'`.
     * Non-admin users get redirected to the sign-in page. Use for admin panels.
     */
    adminPaths?: string[];
    /**
     * Cookie domain — set to `.your-apex.com` for cross-subdomain SSO across
     * sibling apps (e.g. `.riocut.com` shares the session cookie between
     * `riocut.com` and `sports.riocut.com`). Leave undefined for local dev.
     */
    cookieDomain?: string;
}

function buildCookies(domain?: string): NextAuthConfig['cookies'] {
    if (!domain) return undefined;
    const secure = true;
    const sameSite = 'lax' as const;
    return {
        sessionToken: {
            name: '__Secure-authjs.session-token',
            options: { httpOnly: true, sameSite, path: '/', secure, domain },
        },
        callbackUrl: {
            name: '__Secure-authjs.callback-url',
            options: { httpOnly: true, sameSite, path: '/', secure, domain },
        },
        csrfToken: {
            name: '__Host-authjs.csrf-token',
            options: { httpOnly: true, sameSite, path: '/', secure },
        },
    };
}

export function createAuthConfig(opts: AuthFactoryOptions = {}): NextAuthConfig {
    const signIn = opts.signInPage ?? '/login';
    const protectedPaths = opts.protectedPaths ?? ['/dashboard', '/watchlist', '/watch-party'];
    const adminPaths = opts.adminPaths ?? [];
    const cookies = buildCookies(opts.cookieDomain);

    return {
        pages: { signIn },
        ...(cookies ? { cookies } : {}),
        callbacks: {
            async jwt({ token, user }) {
                if (user) {
                    (token as unknown as Record<string, unknown>).role = (user as unknown as Record<string, unknown>).role;
                    (token as unknown as Record<string, unknown>).id = (user as unknown as Record<string, unknown>).id;
                }
                return token;
            },
            async session({ session, token }) {
                if (session.user) {
                    (session.user as unknown as Record<string, unknown>).role = (token as unknown as Record<string, unknown>).role;
                    (session.user as unknown as Record<string, unknown>).id = (token as unknown as Record<string, unknown>).id;
                }
                return session;
            },
            authorized({ auth, request: { nextUrl } }) {
                const isLoggedIn = !!auth?.user;
                const isAdmin = (auth?.user as unknown as Record<string, unknown> | undefined)?.role === 'admin';
                const requiresAdmin = adminPaths.some((p) => nextUrl.pathname.startsWith(p));
                if (requiresAdmin) return isLoggedIn && isAdmin;
                const requiresAuth = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
                if (requiresAuth) return isLoggedIn;
                return true;
            },
        },
        providers: [],
    } satisfies NextAuthConfig;
}
