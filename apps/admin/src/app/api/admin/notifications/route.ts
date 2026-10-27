import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Mock data for notifications
        const notifications = [
            {
                id: '1',
                title: 'System Maintenance',
                message: 'Platform will be down for maintenance tonight',
                type: 'maintenance',
                isActive: true,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
        ];

        return NextResponse.json({
            notifications,
            total: notifications.length,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const body = await request.json();
        const { title, message, type, expiresIn } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
        }

        // TODO: Create notification in database

        return NextResponse.json({
            id: 'new-id',
            title,
            message,
            type: type || 'info',
            isActive: true,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
