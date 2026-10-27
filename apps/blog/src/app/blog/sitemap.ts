import { MetadataRoute } from 'next';
import { getPublishedBlogPosts } from '@/lib/services/blogService';
import { siteConfig } from '@/lib/seo';

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = siteConfig.url;

    // Always include static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
    ];

    // Try to fetch blog posts
    let posts: Array<{
        slug: string;
        updatedAt?: Date | null;
        publishedAt?: Date | null;
        createdAt: Date;
    }> = [];

    try {
        const result = await getPublishedBlogPosts({}, 1, 1000);
        posts = result.posts;
    } catch (error) {
        console.error('Failed to fetch blog posts for sitemap:', error);
        // Return static pages only if database fails
        return staticPages;
    }

    // Blog posts
    const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Category pages (if you have them)
    // const categories = ['review', 'news', 'guide', 'analysis'];
    // const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
    //     url: `${baseUrl}/blog?category=${category}`,
    //     lastModified: new Date(),
    //     changeFrequency: 'daily' as const,
    //     priority: 0.6,
    // }));

    return [...staticPages, ...blogPosts,
        //  ...categoryPages
    ];
}