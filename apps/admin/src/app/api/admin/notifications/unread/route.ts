import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        return NextResponse.json({ count: 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
