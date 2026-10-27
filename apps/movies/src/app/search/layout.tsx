import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Search',
    description: 'Search for movies and TV shows',
}

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
