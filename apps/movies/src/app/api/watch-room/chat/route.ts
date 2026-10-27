import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChatHistory } from '@riocut/services';

// GET - Get chat history for a room
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomCode = searchParams.get('roomCode');
        const limit = searchParams.get('limit');

        if (!roomCode) {
            return NextResponse.json(
                { error: 'Missing roomCode' },
                { status: 400 }
            );
        }

        const messages = await getChatHistory(
            roomCode,
            limit ? parseInt(limit) : 50
        );

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat history' },
            { status: 500 }
        );
    }
}
