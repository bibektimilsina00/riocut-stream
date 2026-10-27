import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteMatchComment } from '@riocut/services';
import { emitComment } from '@riocut/realtime/commentBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** DELETE /api/match-comments/[id]?gid= — delete own comment (member/guest) or any (admin). */
type Session = { user?: { id?: string; role?: string } } | null;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = (await auth()) as Session;
    const gid = new URL(req.url).searchParams.get('gid')?.trim();
    const key = session?.user?.id ?? (gid ? `guest:${gid}` : undefined);
    if (!key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session?.user?.role;
    const isAdmin = role === 'admin' || role === 'moderator';
    const { id } = await params;
    try {
        const { matchKey } = await deleteMatchComment(key, id, isAdmin);
        emitComment(matchKey, 'comment:deleted', { id });
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed';
        return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 400 });
    }
}
