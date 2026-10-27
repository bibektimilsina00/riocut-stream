'use client'

import { useEffect } from 'react'
import { structuredData } from '@/lib/seo'

// Common FAQs about free streaming on Riocut
const faqData = [
    {
        question: 'Is Riocut really free to use?',
        answer: 'Yes! Riocut is completely free. You can watch unlimited movies and TV shows without any subscription, payment, or registration required.'
    },
    {
        question: 'Do I need to create an account?',
        answer: 'No account is required to watch content. However, creating a free account lets you save favorites to your watchlist and use the Watch Together feature with friends.'
    },
    {
        question: 'What quality are the streams?',
        answer: 'Most content is available in HD quality. We provide multiple streaming servers so you can choose the best quality for your internet connection.'
    },
    {
        question: 'Can I watch with friends?',
        answer: 'Yes! Use our Watch Together feature to watch movies and TV shows with friends in real-time, with synchronized playback and video chat.'
    },
    {
        question: 'Are there any ads?',
        answer: 'Our embedded video players may show minimal ads. We work hard to keep the viewing experience as clean as possible while providing free content.'
    },
]

export default function FAQSchema() {
    useEffect(() => {
        // Inject FAQ structured data
        const schema = structuredData.faq(faqData)
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.text = JSON.stringify(schema)
        script.id = 'faq-schema'

        // Remove old script if exists
        const oldScript = document.getElementById('faq-schema')
        if (oldScript) {
            oldScript.remove()
        }

        document.head.appendChild(script)

        return () => {
            const scriptToRemove = document.getElementById('faq-schema')
            if (scriptToRemove) {
                scriptToRemove.remove()
            }
        }
    }, [])

    return null
}
