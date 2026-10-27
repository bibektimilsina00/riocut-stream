import { Metadata } from 'next'

// Static metadata for watch together layout
export const metadata: Metadata = {
    title: 'Watch Together - Riocut',
    description: 'Watch movies and TV shows together with friends in real-time. Share moments, chat, and enjoy synchronized playback.',
    openGraph: {
        title: 'Watch Together - Riocut',
        description: 'Watch movies and TV shows together with friends in real-time.',
    },
}

export default function WatchTogetherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
