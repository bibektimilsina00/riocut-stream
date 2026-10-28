import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Create Account',
    description: 'Create a free RioSports account to host watch-together rooms, save matches and never miss a fixture.',
    path: '/register',
    keywords: ['RioSports register', 'create RioSports account', 'free sports account'],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
