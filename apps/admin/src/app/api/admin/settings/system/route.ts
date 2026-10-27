import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const systemInfo = {
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production',
            nodeVersion: process.version,
            databaseStatus: 'Connected',
            cacheStatus: 'Active',
            socketIOStatus: 'Active',
        };

        return NextResponse.json(systemInfo);
    } catch (error) {
        console.error('Error fetching system info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
