import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const url = new URL(request.url);
        const notificationId = url.pathname.split('/').pop();

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }

        // TODO: Delete notification from database

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
