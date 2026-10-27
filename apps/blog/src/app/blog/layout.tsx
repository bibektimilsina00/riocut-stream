import { Metadata } from 'next';

export const metadata: Metadata = {
    alternates: {
        types: {
            'application/rss+xml': [
                {
                    title: 'Riocut Blog RSS Feed - Movie & TV Reviews',
                    url: '/blog/rss.xml',
                },
            ],
        },
    },
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* RSS Feed Discovery */}
            <link
                rel="alternate"
                type="application/rss+xml"
                title="Riocut Blog RSS Feed - Movie & TV Reviews"
                href="/blog/rss.xml"
            />
            {children}
        </>
    );
}