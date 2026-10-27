import { Prisma } from '@prisma/client';
import { prisma } from '@riocut/db';

export interface CreateBlogPostData {
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    authorId: string;
    status?: 'draft' | 'published';
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
}

export interface UpdateBlogPostData {
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    status?: 'draft' | 'published';
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
}

export async function createBlogPost(data: CreateBlogPostData) {
    const {
        title,
        content,
        excerpt,
        slug,
        authorId,
        status = 'draft',
        tags = [],
        metaTitle,
        metaDescription,
        featuredImage,
    } = data;

    // Generate slug if not provided
    const finalSlug = slug || generateSlugFromTitle(title);

    // Ensure slug is unique
    const uniqueSlug = await generateUniqueSlug(finalSlug);

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    return prisma.blogPost.create({
        data: {
            title,
            content,
            excerpt: excerpt || generateExcerpt(content),
            slug: uniqueSlug,
            authorId,
            status,
            tags,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt || generateExcerpt(content),
            featuredImage,
            readingTime,
            publishedAt: status === 'published' ? new Date() : null,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

export async function updateBlogPost(id: string, data: UpdateBlogPostData) {
    const { slug, content, ...rest } = data;

    let finalSlug = slug;
    if (slug) {
        // Ensure new slug is unique
        finalSlug = await generateUniqueSlug(slug, id);
    }

    const updateData: any = { ...rest };
    if (finalSlug) updateData.slug = finalSlug;
    if (content) {
        updateData.content = content;
        updateData.readingTime = calculateReadingTime(content);
    }

    return prisma.blogPost.update({
        where: { id },
        data: updateData,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

export async function deleteBlogPost(id: string) {
    // First check if the blog post exists
    const existingPost = await prisma.blogPost.findUnique({
        where: { id },
    });

    if (!existingPost) {
        throw new Error(`Blog post with ID ${id} not found`);
    }

    return prisma.blogPost.delete({
        where: { id },
    });
}

export async function deleteBlogPosts(ids: string[]) {
    // Filter out non-existent posts
    const existingPosts = await prisma.blogPost.findMany({
        where: { id: { in: ids } },
        select: { id: true },
    });

    const existingIds = existingPosts.map(post => post.id);

    if (existingIds.length === 0) {
        throw new Error('None of the specified blog posts were found');
    }

    const result = await prisma.blogPost.deleteMany({
        where: { id: { in: existingIds } },
    });

    return {
        deletedCount: result.count,
        requestedIds: ids,
        existingIds,
        notFoundIds: ids.filter(id => !existingIds.includes(id)),
    };
}

export async function getBlogPosts(
    filters: {
        status?: string;
        category?: string;
        search?: string;
        mediaType?: string;
        authorId?: string;
    } = {},
    page: number = 1,
    limit: number = 10
) {
    const where: any = {};

    // Status filter
    if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
        where.category = filters.category;
    }

    // Media type filter
    if (filters.mediaType && filters.mediaType !== 'all') {
        where.mediaType = filters.mediaType;
    }

    // Search filter
    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
            { excerpt: { contains: filters.search, mode: 'insensitive' } },
            { mediaTitle: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    // Author filter
    if (filters.authorId) {
        where.authorId = filters.authorId;
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return {
        posts,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
    };
}

export async function publishBlogPost(id: string) {
    return prisma.blogPost.update({
        where: { id },
        data: {
            status: 'published',
            publishedAt: new Date(),
        },
    });
}

export async function unpublishBlogPost(id: string) {
    return prisma.blogPost.update({
        where: { id },
        data: {
            status: 'draft',
            publishedAt: null,
        },
    });
}

export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const where: any = { slug };
    if (excludeId) {
        where.NOT = { id: excludeId };
    }

    const existingPost = await prisma.blogPost.findFirst({ where });
    return !existingPost;
}

export async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (!(await isSlugAvailable(slug, excludeId))) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

// Helper functions
function generateSlugFromTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function generateExcerpt(content: string, maxLength: number = 160): string {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');

    if (plainText.length <= maxLength) {
        return plainText;
    }

    // Find the last complete word within the limit
    const excerpt = plainText.substring(0, maxLength);
    const lastSpaceIndex = excerpt.lastIndexOf(' ');

    return lastSpaceIndex > 0
        ? excerpt.substring(0, lastSpaceIndex) + '...'
        : excerpt + '...';
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string) {
    const post = await prisma.blogPost.findFirst({
        where: {
            slug,
            status: 'published',
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    return post;
}

// Get related blog posts
export async function getRelatedBlogPosts(postId: string, limit: number = 3) {
    const posts = await prisma.blogPost.findMany({
        where: {
            id: { not: postId },
            status: 'published',
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });

    return posts;
}

// Add the missing function for public blog posts
export async function getPublishedBlogPosts(
    filters: {
        category?: string;
        search?: string;
        mediaType?: string;
        language?: string;
    } = {},
    page: number = 1,
    limit: number = 12
) {
    const where: Prisma.BlogPostWhereInput = {
        status: 'published',
    };

    // Add filters
    if (filters.category && filters.category !== 'all') {
        where.category = filters.category;
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
            { excerpt: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    if (filters.mediaType) {
        where.mediaType = filters.mediaType;
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return {
        posts,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
    };
}

function calculateReadingTime(content: string): number {
    // Remove HTML tags and count words
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;

    // Average reading speed is ~200 words per minute
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);

    return Math.max(1, minutes); // Minimum 1 minute
}