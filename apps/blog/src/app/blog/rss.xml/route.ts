import { NextResponse } from 'next/server';
import { getPublishedBlogPosts } from '@/lib/services/blogService';
import { siteConfig } from '@/lib/seo';

export async function GET() {
    try {
        const baseUrl = siteConfig.url;
        const { posts } = await getPublishedBlogPosts({}, 1, 50); // Get latest 50 posts

        const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title><![CDATA[${siteConfig.name} - Movie & TV Reviews]]></title>
        <description><![CDATA[Latest movie and TV show reviews, analysis, and entertainment insights from ${siteConfig.name}]]></description>
        <link>${baseUrl}/blog</link>
        <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
        <language>en-US</language>
        <managingEditor>contact@riocut.com (${siteConfig.name} Team)</managingEditor>
        <webMaster>contact@riocut.com (${siteConfig.name} Team)</webMaster>
        <category>Entertainment</category>
        <category>Movies</category>
        <category>TV Shows</category>
        <category>Reviews</category>
        <image>
            <title>${siteConfig.name} Blog</title>
            <url>${baseUrl}/logo.png</url>
            <link>${baseUrl}/blog</link>
        </image>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <ttl>60</ttl>
        
        ${posts.map((post: any) => {
            const postUrl = `${baseUrl}/blog/${post.slug}`;
            const imageUrl = post.featuredImage ||
                (post.mediaBackdropPath ? `https://image.tmdb.org/t/p/w1280${post.mediaBackdropPath}` : '');

            return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.excerpt || post.metaDescription}]]></description>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.createdAt).toUTCString()}</pubDate>
            <dc:creator><![CDATA[${post.author?.name || siteConfig.name}]]></dc:creator>
            <category><![CDATA[${post.category}]]></category>
            ${post.tags?.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('') || ''}
            ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg"/>` : ''}
            <content:encoded><![CDATA[
                ${imageUrl ? `<img src="${imageUrl}" alt="${post.title}" style="width:100%;height:auto;margin-bottom:20px;"/>` : ''}
                ${post.content}
            ]]></content:encoded>
        </item>`;
        }).join('')}
    </channel>
</rss>`;

        return new NextResponse(rssFeed, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
            },
        });
    } catch (error) {
        console.error('Error generating RSS feed:', error);
        return new NextResponse('Error generating RSS feed', { status: 500 });
    }
}