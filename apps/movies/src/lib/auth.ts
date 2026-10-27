import { createAuth, registerUser, getUserByEmail } from '@riocut/auth/server';

const { handlers, auth, signIn, signOut } = createAuth({
    signInPage: '/login',
    protectedPaths: ['/dashboard', '/watchlist', '/watch-party'],
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export { handlers, auth, signIn, signOut, registerUser, getUserByEmail };
