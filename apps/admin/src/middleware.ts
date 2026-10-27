import { createAuthMiddleware } from '@riocut/auth/middleware';

export default createAuthMiddleware({
    signInPage: '/login',
    protectedPaths: ['/admin'],
    adminPaths: ['/admin'],
});

export const config = {
    matcher: ['/((?!api|ingest|_next/static|_next/image|favicon.ico|public).*)'],
};
