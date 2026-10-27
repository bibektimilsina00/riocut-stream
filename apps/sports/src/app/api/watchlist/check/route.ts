import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isInWatchlist } from '@riocut/services';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ inWatchlist: false });
    const { searchParams } = new URL(req.url);
    const mediaId = Number(searchParams.get('mediaId'));
    const mediaType = searchParams.get('mediaType') ?? 'match';
    if (!mediaId) return NextResponse.json({ inWatchlist: false });
    const inWatchlist = await isInWatchlist(session.user.id, mediaId, mediaType);
    return NextResponse.json({ inWatchlist });
}
