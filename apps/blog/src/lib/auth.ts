import { createAuth, registerUser, getUserByEmail } from '@riocut/auth/server';

const { handlers, auth, signIn, signOut } = createAuth({
    signInPage: '/login',
    protectedPaths: [], // public blog — only comments require auth via API
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export { handlers, auth, signIn, signOut, registerUser, getUserByEmail };
