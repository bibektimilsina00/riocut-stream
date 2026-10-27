import { generateMovieMetadata, generateMovieJSONLD } from '@/lib/seo'
import Script from 'next/script'

interface MovieLayoutProps {
    children: React.ReactNode
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MovieLayoutProps) {
    const { id } = await params
    return generateMovieMetadata(id)
}

export default async function MovieLayout({ children, params }: MovieLayoutProps) {
    const { id } = await params
    const jsonLd = await generateMovieJSONLD(id)

    return (
        <>
            {jsonLd && (
                <Script
                    id="movie-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd),
                    }}
                />
            )}
            {children}
        </>
    )
}