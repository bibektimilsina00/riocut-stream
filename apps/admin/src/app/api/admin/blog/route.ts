import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import {
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    deleteBlogPosts,
    getBlogPosts,
    publishBlogPost,
    unpublishBlogPost,
    isSlugAvailable,
    generateUniqueSlug,
} from '@/lib/services/blogService';
import { slugify, calculateReadingTime } from '@/lib/blogSeo';

// GET /api/admin/blog - Get all blog posts (with filters)
export async function GET(request: NextRequest) {
    try {
        const { session, error } = await requireAdminAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || undefined;
        const category = searchParams.get('category') || undefined;
        const search = searchParams.get('search') || undefined;
        const mediaType = searchParams.get('mediaType') || undefined;

        const result = await getBlogPosts(
            {
                status,
                category,
                search,
                mediaType,
            },
            page,
            limit
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    }
}

// POST /api/admin/blog - Create a new blog post
export async function POST(request: NextRequest) {
    try {
        const { session, error } = await requireAdminAuth();
        if (error) return error;

        const data = await request.json();

        // Generate slug if not provided
        if (!data.slug) {
            data.slug = slugify(data.title);
        }

        // Ensure slug is unique
        const availableSlug = await generateUniqueSlug(data.slug);
        data.slug = availableSlug;

        // Calculate reading time if not provided
        if (!data.readingTime) {
            data.readingTime = calculateReadingTime(data.content);
        }

        // Set author to current user
        data.authorId = session!.user!.id;

        const post = await createBlogPost(data);

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error creating blog post:', error);
        return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
    }
}

// PUT /api/admin/blog - Update a blog post
export async function PUT(request: NextRequest) {
    try {
        const { error } = await requireAdminAuth();
        if (error) return error;

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // If slug is changed, ensure it's unique
        if (data.slug) {
            const available = await isSlugAvailable(data.slug, data.id);
            if (!available) {
                return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
            }
        }

        // Recalculate reading time if content changed
        if (data.content) {
            data.readingTime = calculateReadingTime(data.content);
        }

        // Extract id from data and pass it separately
        const { id, ...updateData } = data;
        const post = await updateBlogPost(id, updateData);

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error updating blog post:', error);
        return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
    }
}

// DELETE /api/admin/blog - Delete blog post(s)
export async function DELETE(request: NextRequest) {
    try {
        const { error } = await requireAdminAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const bulk = searchParams.get('bulk');

        if (bulk === 'true') {
            // Bulk delete
            const body = await request.json();
            const { ids } = body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json({ error: 'Post IDs array is required for bulk delete' }, { status: 400 });
            }

            const result = await deleteBlogPosts(ids);

            return NextResponse.json({
                success: true,
                ...result
            });
        } else {
            // Single delete
            if (!id) {
                return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
            }

            await deleteBlogPost(id);

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error('Error deleting blog post(s):', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to delete blog post(s)'
        }, { status: 500 });
    }
}
