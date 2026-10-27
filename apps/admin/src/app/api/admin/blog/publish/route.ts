import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { publishBlogPost, unpublishBlogPost } from '@/lib/services/blogService';

// POST /api/admin/blog/publish?id={id} - Publish a blog post
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireAdminAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const post = await publishBlogPost(id);

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error publishing blog post:', error);
        return NextResponse.json({ error: 'Failed to publish blog post' }, { status: 500 });
    }
}

// DELETE /api/admin/blog/publish?id={id} - Unpublish a blog post
export async function DELETE(request: NextRequest) {
    try {
        const { error } = await requireAdminAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const post = await unpublishBlogPost(id);

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error unpublishing blog post:', error);
        return NextResponse.json({ error: 'Failed to unpublish blog post' }, { status: 500 });
    }
}
