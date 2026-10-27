import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { auth } from '@/lib/auth';
import {
    createWatchRoom,
    getWatchRoomByCode,
    closeWatchRoom,
} from '@riocut/services';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const room = await createWatchRoom({
        roomCode: body.roomCode ?? uuid(),
        creatorId: session.user.id,
        mediaId: body.mediaId,
        mediaType: body.mediaType ?? 'match',
        mediaTitle: body.mediaTitle ?? 'Live match',
        posterPath: body.posterPath ?? null,
        embedUrl: body.embedUrl ?? null,
        season: body.season ?? null,
        episode: body.episode ?? null,
        sport: body.sport ?? null,
        league: body.league ?? null,
        matchExternalId: body.matchExternalId ?? null,
        kickoffAt: body.kickoffAt ? new Date(body.kickoffAt) : null,
    });
    return NextResponse.json({ room, roomCode: room.roomCode }, { status: 201 });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    // Accept either `code` (sports originals) or `roomCode` (movies's watch-together
    // lobby uses this name); without the alias the lobby got a 404 → fell back to
    // an empty localStorage and the iframe rendered "No video source available".
    const code = searchParams.get('code') ?? searchParams.get('roomCode');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    const room = await getWatchRoomByCode(code);
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ room });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { roomCode } = await req.json();
    if (!roomCode) return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 });
    await closeWatchRoom(roomCode);
    return NextResponse.json({ ok: true });
}
