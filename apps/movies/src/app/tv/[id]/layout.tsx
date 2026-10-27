import { generateTVMetadata, generateTVJSONLD } from '@/lib/seo'
import Script from 'next/script'

interface TVLayoutProps {
    children: React.ReactNode
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TVLayoutProps) {
    const { id } = await params
    return generateTVMetadata(id)
}

export default async function TVLayout({ children, params }: TVLayoutProps) {
    const { id } = await params
    const jsonLd = await generateTVJSONLD(id)

    return (
        <>
            {jsonLd && (
                <Script
                    id="tv-jsonld"
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