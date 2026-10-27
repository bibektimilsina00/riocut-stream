import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Mock analytics data
        const analytics = {
            pageViews: 15420,
            pageViewsTrend: '+12%',
            avgSessionDuration: 8,
            sessionTrend: '+5%',
            searchQueries: 3240,
            searchTrend: '+18%',
            bounceRate: 32,
            bounceRateTrend: '-8%',
            topContent: [
                { title: 'Inception', type: 'Movie', views: 1240 },
                { title: 'Breaking Bad', type: 'TV Show', views: 980 },
                { title: 'The Dark Knight', type: 'Movie', views: 875 },
            ],
            topSearches: [
                { query: 'action movies', count: 240 },
                { query: 'anime', count: 180 },
                { query: 'horror', count: 150 },
            ],
            dailyActiveUsers: [
                { day: 'Mon', count: 320 },
                { day: 'Tue', count: 380 },
                { day: 'Wed', count: 410 },
                { day: 'Thu', count: 350 },
                { day: 'Fri', count: 480 },
                { day: 'Sat', count: 520 },
                { day: 'Sun', count: 450 },
            ],
            platformStats: [
                { platform: 'Desktop', percentage: 55 },
                { platform: 'Mobile', percentage: 40 },
                { platform: 'Tablet', percentage: 5 },
            ],
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
