import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Account — RioSports',
    description: 'Manage your RioSports profile and password.',
    robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return children;
}
