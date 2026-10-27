import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
// Cache 5 minutes at the edge — rankings shift slowly and every player mount
// hits this endpoint, so a short TTL keeps DB load flat.
export const revalidate = 300;

/**
 * GET /api/sports/source-rankings?matchKey=...&country=XX
 * Returns { badSources: string[] } — sourceKeys that failed for >= threshold
 * users in the last 24h. Client uses this to reorder the source list.
 */
const REPORT_THRESHOLD = 3; // >= this many reports in the window → demote
const WINDOW_HOURS = 24;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const matchKey = searchParams.get('matchKey')?.trim();
        if (!matchKey) return NextResponse.json({ badSources: [] });

        const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

        // Group by sourceKey, count reports; a source with >= threshold reports
        // in the window is considered bad. `country` filter is optional — used
        // in future for region-specific ranking (currently ignored so all users
        // benefit from every other user's reports).
        const grouped = await prisma.sportsSourceReport.groupBy({
            by: ['sourceKey'],
            where: { matchKey, createdAt: { gte: since } },
            _count: { sourceKey: true },
            having: { sourceKey: { _count: { gte: REPORT_THRESHOLD } } },
        });

        return NextResponse.json({
            badSources: grouped.map((g) => g.sourceKey),
            windowHours: WINDOW_HOURS,
            threshold: REPORT_THRESHOLD,
        });
    } catch (e) {
        console.error('source-rankings failed', e);
        return NextResponse.json({ badSources: [] });
    }
}
