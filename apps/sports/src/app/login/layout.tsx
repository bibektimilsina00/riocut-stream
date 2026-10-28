import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Sign In',
    description: 'Sign in to RioSports to save matches, host watch-together rooms and chat with friends.',
    path: '/login',
    keywords: ['RioSports sign in', 'RioSports login'],
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
