import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isInWatchlist } from '@riocut/services';

// GET - Check if item is in watchlist
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mediaId = searchParams.get('mediaId');
        const mediaType = searchParams.get('mediaType') as 'movie' | 'tv';

        if (!mediaId || !mediaType) {
            return NextResponse.json(
                { error: 'Missing mediaId or mediaType' },
                { status: 400 }
            );
        }

        const inWatchlist = await isInWatchlist(
            session.user.email,
            parseInt(mediaId),
            mediaType
        );

        return NextResponse.json({ inWatchlist });
    } catch (error) {
        console.error('Error checking watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to check watchlist' },
            { status: 500 }
        );
    }
}
