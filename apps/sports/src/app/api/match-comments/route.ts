import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listMatchComments } from '@riocut/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Session = { user?: { id?: string; name?: string | null; role?: string } } | null;

function isAdmin(session: Session): boolean {
    const role = session?.user?.role;
    return role === 'admin' || role === 'moderator';
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
// ponytail: chat temporarily disabled; restore the previous POST body (git log) to reopen.
export async function POST() {
    return NextResponse.json({ error: 'Live chat is temporarily disabled' }, { status: 503 });
}
