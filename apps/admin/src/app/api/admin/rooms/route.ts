import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Mock data for rooms
        const rooms = [
            {
                id: '1',
                roomCode: 'MOVIE-123',
                mediaTitle: 'Inception',
                creatorName: 'John Doe',
                participantCount: 3,
                createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
                isActive: true,
            },
            {
                id: '2',
                roomCode: 'SHOW-456',
                mediaTitle: 'Breaking Bad - S01E01',
                creatorName: 'Jane Smith',
                participantCount: 2,
                createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
                isActive: true,
            },
        ];

        return NextResponse.json({
            rooms,
            total: rooms.length,
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
