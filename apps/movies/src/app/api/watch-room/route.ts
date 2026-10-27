import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';
import {
    createWatchRoom,
    getWatchRoomByCode,
    getUserWatchRooms,
    closeWatchRoom,
} from '@riocut/services';

// GET - Get watch room by code or user's room history
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomCode = searchParams.get('roomCode');
        const history = searchParams.get('history');

        // Get specific room by code
        if (roomCode) {
            const room = await getWatchRoomByCode(roomCode);

            if (!room) {
                return NextResponse.json({ error: 'Room not found' }, { status: 404 });
            }

            return NextResponse.json({ room });
        }

        // Get user's room history
        if (history === 'true') {
            const rooms = await getUserWatchRooms(session.user.email);
            return NextResponse.json({ rooms });
        }

        return NextResponse.json(
            { error: 'Missing roomCode or history parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error fetching watch room:', error);
        return NextResponse.json(
            { error: 'Failed to fetch watch room' },
            { status: 500 }
        );
    }
}

// POST - Create new watch room
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            console.log('❌ Unauthorized: No session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { roomCode, mediaId, mediaType, mediaTitle, embedUrl, posterPath, season, episode } = body;

        console.log('📝 Creating watch room with data:', {
            roomCode,
            mediaId,
            mediaType,
            mediaTitle,
            embedUrl: embedUrl ? 'present' : 'missing',
        });

        if (!roomCode || !mediaId || !mediaType || !mediaTitle) {
            console.log('❌ Missing required fields:', { roomCode, mediaId, mediaType, mediaTitle });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Look up user by email to get their ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            console.log('❌ User not found:', session.user.email);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('👤 User found:', user.id);

        const room = await createWatchRoom({
            roomCode,
            creatorId: user.id, // Use actual user ID, not email
            mediaId,
            mediaType,
            mediaTitle,
            embedUrl, // <-- pass embedUrl
            posterPath,
            season,
            episode,
        });

        console.log('✅ Room created and returned:', room.id);

        return NextResponse.json({ success: true, room });
    } catch (error) {
        console.error('❌ Error creating watch room:', error);
        return NextResponse.json(
            { error: 'Failed to create watch room' },
            { status: 500 }
        );
    }
}

// PATCH - Close watch room
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { roomCode } = body;

        if (!roomCode) {
            return NextResponse.json(
                { error: 'Missing roomCode' },
                { status: 400 }
            );
        }

        await closeWatchRoom(roomCode);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error closing watch room:', error);
        return NextResponse.json(
            { error: 'Failed to close watch room' },
            { status: 500 }
        );
    }
}
