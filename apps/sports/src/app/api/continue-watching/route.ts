import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    getContinueWatching,
    saveContinueWatching,
    removeContinueWatching,
} from '@riocut/services';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ items: [] });
    const items = await getContinueWatching(session.user.id);
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const item = await saveContinueWatching(session.user.id, {
        mediaId: body.mediaId,
        mediaType: body.mediaType ?? 'match',
        title: body.title,
        posterPath: body.posterPath ?? null,
        progress: body.progress ?? 0,
        season: body.season ?? null,
        episode: body.episode ?? null,
        sport: body.sport ?? null,
        league: body.league ?? null,
        matchExternalId: body.matchExternalId ?? null,
        kickoffAt: body.kickoffAt ? new Date(body.kickoffAt) : null,
    });
    return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const mediaId = Number(searchParams.get('mediaId'));
    const mediaType = searchParams.get('mediaType') ?? 'match';
    if (!mediaId) return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    await removeContinueWatching(session.user.id, mediaId, mediaType);
    return NextResponse.json({ ok: true });
}
