import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

// Middleware to check admin role
async function requireAdmin() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return null;
    }
    return session;
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total users
        const totalUsers = await prisma.user.count();

        // Get movies and TV shows from watchlist items
        const totalMovies = await prisma.watchlistItem.count({
            where: { mediaType: 'movie' },
        });

        const totalTvShows = await prisma.watchlistItem.count({
            where: { mediaType: 'tv' },
        });

        // Get recent activity (rooms created in last 24 hours)
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const recentActivity = await prisma.watchRoom.count({
            where: { createdAt: { gte: yesterday } },
        });

        return NextResponse.json({
            totalUsers,
            totalMovies,
            totalTvShows,
            recentActivity,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}