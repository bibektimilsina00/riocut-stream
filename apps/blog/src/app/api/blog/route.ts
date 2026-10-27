import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/services/blogService';
import { withRetry } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || undefined;
        const status = searchParams.get('status') as 'all' | 'published' | 'draft' || 'published';
        const tag = searchParams.get('tag') || undefined;

        // Use retry logic for database operation
        const result = await withRetry(async () => {
            return await getBlogPosts({
                search,
                status,
            }, page, limit);
        }, 'Fetch blog posts');

        // Filter by tag if specified (since our getBlogPosts doesn't support tag filtering)
        if (tag && result.posts) {
            result.posts = result.posts.filter((post: any) =>
                post.tags.includes(tag)
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}