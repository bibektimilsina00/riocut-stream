import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Extract room ID from URL
        const url = new URL(request.url);
        const roomId = url.pathname.split('/').pop();

        if (!roomId) {
            return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
        }

        // TODO: Close the room and notify participants

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error closing room:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
