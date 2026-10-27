import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

// DELETE /api/admin/comments/:id?type=match|blog
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;
        const type = new URL(request.url).searchParams.get('type') || 'match';

        if (type === 'blog') {
            await prisma.blogComment.delete({ where: { id } });
        } else {
            await prisma.matchComment.delete({ where: { id } });
        }
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('Error deleting comment:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
