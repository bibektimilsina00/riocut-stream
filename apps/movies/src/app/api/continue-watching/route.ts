import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    saveContinueWatching,
    getContinueWatching,
    removeContinueWatching,
    getProgress,
} from '@riocut/services';

// GET - Fetch user's continue watching list
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mediaId = searchParams.get('mediaId');
        const mediaType = searchParams.get('mediaType') as 'movie' | 'tv';

        // If mediaId and mediaType provided, get specific progress
        if (mediaId && mediaType) {
            const progress = await getProgress(
                session.user.email,
                parseInt(mediaId),
                mediaType
            );
            return NextResponse.json({ progress });
        }

        // Otherwise return full continue watching list
        const continueWatching = await getContinueWatching(session.user.email);

        return NextResponse.json({ continueWatching });
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        return NextResponse.json(
            { error: 'Failed to fetch continue watching' },
            { status: 500 }
        );
    }
}

// POST - Save continue watching progress
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { mediaId, mediaType, title, posterPath, progress, season, episode } = body;

        if (!mediaId || !mediaType || !title || progress === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const item = await saveContinueWatching(session.user.email, {
            mediaId,
            mediaType,
            title,
            posterPath,
            progress,
            season,
            episode,
        });

        return NextResponse.json({ success: true, item });
    } catch (error) {
        console.error('Error saving continue watching:', error);
        return NextResponse.json(
            { error: 'Failed to save continue watching' },
            { status: 500 }
        );
    }
}

// DELETE - Remove item from continue watching
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

        await removeContinueWatching(
            session.user.email,
            parseInt(mediaId),
            mediaType
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing continue watching:', error);
        return NextResponse.json(
            { error: 'Failed to remove continue watching' },
            { status: 500 }
        );
    }
}
