import { NextRequest, NextResponse } from 'next/server';
import { getPublishedBlogPosts } from '@/lib/services/blogService';
import { siteConfig } from '@/lib/seo';

export async function GET(request: NextRequest) {
    const { posts } = await getPublishedBlogPosts({}, 1, 50); // Latest 50 posts for RSS

    const rssItems = posts
        .map((post: any) => {
            const postUrl = `${siteConfig.url}/blog/${post.slug}`;
            const imageUrl = post.featuredImage ||
                (post.mediaBackdropPath ? `https://image.tmdb.org/t/p/w500${post.mediaBackdropPath}` : '') ||
                `${siteConfig.url}/og-image-blog.jpg`;

            return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.excerpt || ''}]]></description>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
            <category><![CDATA[${post.category}]]></category>
            <author><![CDATA[${post.author?.name || 'Riocut Editorial Team'}]]></author>
            ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg"/>` : ''}
            ${post.tags?.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('') || ''}
        </item>`;
        })
        .join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
        <title><![CDATA[${siteConfig.name}]]></title>
        <description><![CDATA[${siteConfig.description}]]></description>
        <link>${siteConfig.url}/blog</link>
        <language>en-US</language>
        <managingEditor>editorial@riocut.com (Riocut Editorial Team)</managingEditor>
        <webMaster>webmaster@riocut.com (Riocut Webmaster)</webMaster>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <category><![CDATA[Entertainment]]></category>
        <category><![CDATA[Movies]]></category>
        <category><![CDATA[TV Shows]]></category>
        <category><![CDATA[Reviews]]></category>
        <ttl>60</ttl>
        <atom:link href="${siteConfig.url}/blog/feed.xml" rel="self" type="application/rss+xml"/>
        <image>
            <url>${siteConfig.url}/logo.png</url>
            <title><![CDATA[${siteConfig.name}]]></title>
            <link>${siteConfig.url}/blog</link>
            <description><![CDATA[${siteConfig.description}]]></description>
        </image>
        ${rssItems}
    </channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
}