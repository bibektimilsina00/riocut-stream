import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listMatchComments, createMatchComment, type CommentAuthor } from '@riocut/services';
import { emitComment } from '@riocut/realtime/commentBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Session = { user?: { id?: string; name?: string | null; role?: string } } | null;

function isAdmin(session: Session): boolean {
    const role = session?.user?.role;
    return role === 'admin' || role === 'moderator';
}

/**
 * Build an author identity. Members post under their account name; everyone
 * else posts as "Anonymous" (a per-device guest id is still used behind the
 * scenes so a guest can react once and delete their own comments).
 */
function authorFrom(session: Session, guestId?: string | null): CommentAuthor | null {
    if (session?.user?.id) {
        return { authorKey: session.user.id, authorName: session.user.name ?? 'Member', isGuest: false, userId: session.user.id };
    }
    const gid = (guestId ?? '').trim();
    if (gid) {
        return { authorKey: `guest:${gid}`, authorName: 'Anonymous', isGuest: true, userId: null };
    }
    return null;
}

/** Viewer identity key used only to mark "your" reactions / deletable comments. */
function viewerKey(session: Session, guestId?: string | null): string | undefined {
    if (session?.user?.id) return session.user.id;
    const gid = (guestId ?? '').trim();
    return gid ? `guest:${gid}` : undefined;
}

/** GET /api/match-comments?matchKey=&gid= — public list. */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const matchKey = searchParams.get('matchKey')?.trim();
    if (!matchKey) return NextResponse.json({ error: 'Missing matchKey' }, { status: 400 });
    const session = (await auth()) as Session;
    const comments = await listMatchComments(matchKey, viewerKey(session, searchParams.get('gid')), isAdmin(session));
    return NextResponse.json({ comments });
}

/** POST /api/match-comments — create a comment (member or anonymous guest). */
export async function POST(req: NextRequest) {
    const session = (await auth()) as Session;
    let body: { matchKey?: string; content?: string; parentId?: string | null; guestId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const author = authorFrom(session, body.guestId);
    if (!author) return NextResponse.json({ error: 'Missing identity' }, { status: 401 });
    if (!body.matchKey || !body.content?.trim()) return NextResponse.json({ error: 'Missing matchKey or content' }, { status: 400 });

    try {
        const comment = await createMatchComment(author, { matchKey: body.matchKey, content: body.content, parentId: body.parentId ?? null });
        emitComment(body.matchKey, 'comment:new', comment);
        return NextResponse.json({ comment }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 400 });
    }
}
