import { NextResponse } from 'next/server';
import { bsdConfigured, getWorldCup } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/bsd/worldcup — World Cup 2026 fixtures + qualified squads. */
export async function GET() {
    if (!bsdConfigured()) return NextResponse.json({ fixtures: [], squads: [] });
    try {
        const data = await getWorldCup();
        return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    } catch {
        return NextResponse.json({ fixtures: [], squads: [] });
    }
}
