import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const settings = {
            maintenanceMode: false,
            maxConcurrentRooms: 100,
            maxRoomSize: 50,
            sessionTimeout: 30,
            enableAnalytics: true,
            enableNotifications: true,
            apiRateLimit: 120,
            defaultLanguage: 'en',
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const body = await request.json();
        // TODO: Save settings to database or config

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
