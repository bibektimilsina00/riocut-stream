import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Watch Together — Riocut Sports',
    description: 'Watch live matches together with friends in real-time. Chat, react, and share the moment in sync.',
    openGraph: {
        title: 'Watch Together — Riocut Sports',
        description: 'Watch live matches together with friends in real-time.',
    },
}

export default function WatchTogetherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
