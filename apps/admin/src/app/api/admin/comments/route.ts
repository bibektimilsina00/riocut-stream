import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

// GET /api/admin/comments?type=match|blog&page=1&limit=50
export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'match') as 'match' | 'blog';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    try {
        if (type === 'blog') {
            const [items, total] = await Promise.all([
                prisma.blogComment.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        post: { select: { id: true, title: true, slug: true } },
                    },
                }),
                prisma.blogComment.count(),
            ]);
            return NextResponse.json({ type, items, total, page, limit });
        }

        const [items, total] = await Promise.all([
            prisma.matchComment.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    _count: { select: { reactions: true, replies: true } },
                },
            }),
            prisma.matchComment.count(),
        ]);
        return NextResponse.json({ type, items, total, page, limit });
    } catch (e) {
        console.error('Error fetching comments:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
