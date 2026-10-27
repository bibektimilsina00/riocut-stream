'use client'

import { useEffect } from 'react'
import { structuredData } from '@/lib/seo'
import { MediaItem } from '@/lib/api/tmdb'

interface HomePageSEOProps {
    trendingItems?: MediaItem[]
}

export default function HomePageSEO({ trendingItems }: HomePageSEOProps) {
    useEffect(() => {
        if (trendingItems && trendingItems.length > 0) {
            // Inject ItemList structured data for trending content
            const schema = structuredData.itemList(trendingItems, 'trending')
            const script = document.createElement('script')
            script.type = 'application/ld+json'
            script.text = JSON.stringify(schema)
            script.id = 'homepage-trending-schema'

            // Remove old script if exists
            const oldScript = document.getElementById('homepage-trending-schema')
            if (oldScript) {
                oldScript.remove()
            }

            document.head.appendChild(script)

            return () => {
                const scriptToRemove = document.getElementById('homepage-trending-schema')
                if (scriptToRemove) {
                    scriptToRemove.remove()
                }
            }
        }
    }, [trendingItems])

    return null
}
