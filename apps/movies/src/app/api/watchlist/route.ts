import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
} from '@riocut/services';

// GET - Fetch user's watchlist
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const watchlist = await getWatchlist(session.user.email);

        return NextResponse.json({ watchlist });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to fetch watchlist' },
            { status: 500 }
        );
    }
}

// POST - Add item to watchlist
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { mediaId, mediaType, title, posterPath } = body;

        if (!mediaId || !mediaType || !title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const item = await addToWatchlist(session.user.email, {
            mediaId,
            mediaType,
            title,
            posterPath,
        });

        return NextResponse.json({ success: true, item });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to add to watchlist' },
            { status: 500 }
        );
    }
}

// DELETE - Remove item from watchlist
export async function DELETE(request: NextRequest) {
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

        await removeFromWatchlist(session.user.email, parseInt(mediaId), mediaType);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to remove from watchlist' },
            { status: 500 }
        );
    }
}
