import { Metadata } from 'next'
import { generateWatchlistMetadata } from '@/lib/seo'

export const metadata: Metadata = generateWatchlistMetadata()

export default function WatchlistLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
