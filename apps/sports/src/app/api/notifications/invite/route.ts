import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendWatchInvite } from '@riocut/services';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.toUserId || !body.roomCode || !body.mediaTitle) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const notification = await sendWatchInvite(
        session.user.email,
        body.toUserId,
        body.roomCode,
        body.mediaTitle,
        body.mediaId ?? 0,
        body.mediaType ?? 'match',
        body.embedUrl ?? '',
        { sport: body.sport ?? null, matchExternalId: body.matchExternalId ?? null, notificationType: 'match_invite' },
    );
    return NextResponse.json({ notification }, { status: 201 });
}
