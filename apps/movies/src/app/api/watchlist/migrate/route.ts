import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { migrateWatchlistFromLocalStorage } from '@riocut/services';

// POST - Migrate localStorage watchlist to database
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid items array' },
                { status: 400 }
            );
        }

        const result = await migrateWatchlistFromLocalStorage(
            session.user.email,
            items
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error migrating watchlist:', error);
        return NextResponse.json(
            { error: 'Failed to migrate watchlist' },
            { status: 500 }
        );
    }
}
