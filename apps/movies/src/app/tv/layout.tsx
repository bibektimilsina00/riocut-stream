import { Metadata } from 'next'
import { generateCategoryMetadata } from '@/lib/seo'

export const metadata: Metadata = generateCategoryMetadata('tv')

export default function TVLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
