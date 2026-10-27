import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Continue Watching — Riocut',
    description: 'Pick up right where you left off.',
    robots: { index: false, follow: false },
};

export default function ContinueWatchingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
