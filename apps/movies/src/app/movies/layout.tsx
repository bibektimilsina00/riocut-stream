import { Metadata } from 'next'
import { generateCategoryMetadata } from '@/lib/seo'

export const metadata: Metadata = generateCategoryMetadata('movies')

export default function MoviesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
