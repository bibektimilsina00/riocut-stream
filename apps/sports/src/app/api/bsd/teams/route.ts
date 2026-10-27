import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, listTeams } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

/** GET /api/bsd/teams?name=&page= — paged team list. */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!bsdConfigured()) return NextResponse.json({ count: 0, results: [] });

    const name = searchParams.get('name')?.trim() || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    try {
        const data = await listTeams({ name, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
        });
    } catch {
        return NextResponse.json({ count: 0, results: [] });
    }
}
