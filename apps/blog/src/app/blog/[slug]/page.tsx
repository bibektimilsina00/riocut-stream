import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/services/blogService';
import AdminNavigation from '@/components/AdminNavigation';
import Footer from '@/components/Footer';
import BlogPostClient from '@/components/blog/BlogPostClient';
import { siteConfig, seoKeywords, generateBlogPostStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo';

// Force dynamic rendering to ensure view count updates on each visit
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate comprehensive SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found | Riocut Blog',
            description: 'The requested blog post could not be found.',
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || siteConfig.url;
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const imageUrl = post.featuredImage ||
        (post.mediaBackdropPath ? `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}` : null) ||
        `${siteUrl}/og-image-blog.jpg`;

    // Create rich meta description
    const metaDescription = post.excerpt ||
        `Read our comprehensive review and analysis of ${post.mediaTitle || post.title}. ${post.category} insights, ratings, cast details and more on Riocut Blog.`;

    // Generate rich keywords
    const baseKeywords = [
        ...seoKeywords.blog,
        post.category.toLowerCase(),
        ...(post.tags || []).map(tag => tag.toLowerCase()),
    ];

    if (post.mediaTitle) {
        baseKeywords.push(
            `${post.mediaTitle} review`,
            `${post.mediaTitle} ${post.mediaType}`,
            post.mediaType === 'movie' ? 'movie review' : 'tv show review'
        );
    }

    return {
        title: `${post.title} | Riocut Blog - Movie & TV Reviews`,
        description: metaDescription,
        keywords: baseKeywords.join(', '),

        // Open Graph
        openGraph: {
            title: post.title,
            description: metaDescription,
            type: 'article',
            siteName: siteConfig.name,
            url: postUrl,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            publishedTime: post.publishedAt?.toISOString(),
            modifiedTime: post.updatedAt?.toISOString(),
            authors: [post.author.name],
            section: post.category,
            tags: post.tags,
        },

        // Twitter Card
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: metaDescription,
            images: [imageUrl],
            creator: '@riocut',
            site: '@riocut',
        },

        // Additional SEO
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },

        // Canonical URL
        alternates: {
            canonical: postUrl,
        },

        // Article metadata
        other: {
            ...(post.publishedAt && { 'article:published_time': post.publishedAt.toISOString() }),
            ...(post.updatedAt && { 'article:modified_time': post.updatedAt.toISOString() }),
            'article:author': post.author.name,
            'article:section': post.category,
            ...(post.tags && { 'article:tag': post.tags.join(',') }),
            'reading-time': `${post.readingTime} minutes`,
        },
    };
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post || post.status !== 'published') {
        notFound();
    }

    const relatedPosts = await getRelatedBlogPosts(post.id, 3);
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || siteConfig.url;
    const postUrl = `${siteUrl}/blog/${post.slug}`;

    // Generate structured data for SEO
    const structuredData = generateBlogPostStructuredData(post, postUrl);

    // Generate breadcrumb structured data
    const breadcrumbData = generateBreadcrumbStructuredData([
        { name: 'Home', url: '/blog' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
    ]);

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Structured Data for SEO */}
            {structuredData.map((data, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
                />
            ))}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />

            <AdminNavigation />

            <BlogPostClient post={post as any} relatedPosts={relatedPosts} postUrl={postUrl} />

            <Footer />
        </div>
    );
}