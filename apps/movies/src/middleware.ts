import { createAuthMiddleware } from '@riocut/auth/middleware';

export default createAuthMiddleware({
    signInPage: '/login',
    protectedPaths: ['/dashboard', '/watchlist', '/watch-party'],
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const config = {
    matcher: ['/((?!api|ingest|_next/static|_next/image|favicon.ico|public).*)'],
};
