import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, listPlayers } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

/** GET /api/bsd/players?name=&position=&page= — paged player list. */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!bsdConfigured()) return NextResponse.json({ count: 0, results: [] });

    const name = searchParams.get('name')?.trim() || undefined;
    const position = searchParams.get('position')?.trim() || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    try {
        const data = await listPlayers({ name, position, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
        });
    } catch {
        return NextResponse.json({ count: 0, results: [] });
    }
}
