import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
    title: 'Create Account',
    description: 'Create a free Riocut Sports account to host watch-together rooms, save matches and never miss a fixture.',
    path: '/register',
    keywords: ['Riocut Sports register', 'create Riocut Sports account', 'free sports account'],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
