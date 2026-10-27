'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { structuredData } from '@/lib/seo'
import { useEffect, useMemo } from 'react'

interface BreadcrumbItem {
    name: string
    url: string
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    // Always include Home as first item
    const allItems: BreadcrumbItem[] = useMemo(() => [
        { name: 'Home', url: '/' },
        ...items,
    ], [items])

    useEffect(() => {
        // Inject structured data for breadcrumbs
        const schema = structuredData.breadcrumbList(allItems)
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.text = JSON.stringify(schema)
        script.id = 'breadcrumb-schema'

        // Remove old script if exists
        const oldScript = document.getElementById('breadcrumb-schema')
        if (oldScript) {
            oldScript.remove()
        }

        document.head.appendChild(script)

        return () => {
            const scriptToRemove = document.getElementById('breadcrumb-schema')
            if (scriptToRemove) {
                scriptToRemove.remove()
            }
        }
    }, [allItems])

    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-gray-400">
                {allItems.map((item, index) => {
                    const isLast = index === allItems.length - 1

                    return (
                        <li key={item.url} className="flex items-center gap-2">
                            {!isLast ? (
                                <>
                                    <Link
                                        href={item.url}
                                        className="hover:text-white transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            ) : (
                                <span className="text-white font-medium">
                                    {item.name}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
