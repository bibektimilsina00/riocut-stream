import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toggleReaction, type CommentAuthor } from '@riocut/services';
import { emitComment } from '@riocut/realtime/commentBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/match-comments/[id]/react { type, guestId?, guestName? } — toggle a reaction (member or guest). */
type Session = { user?: { id?: string; name?: string | null } } | null;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = (await auth()) as Session;
    const { id } = await params;
    let body: { type?: string; guestId?: string; guestName?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    if (!body.type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

    let author: CommentAuthor | null = null;
    if (session?.user?.id) {
        author = { authorKey: session.user.id, authorName: session.user.name ?? 'Member', isGuest: false, userId: session.user.id };
    } else if (body.guestId?.trim()) {
        author = { authorKey: `guest:${body.guestId.trim()}`, authorName: 'Anonymous', isGuest: true, userId: null };
    }
    if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { reactions, matchKey } = await toggleReaction(author, id, body.type);
        emitComment(matchKey, 'comment:reactions', { commentId: id, reactions });
        return NextResponse.json({ reactions });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 400 });
    }
}
