import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, getVenueDetail } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numId = Number(id);
    if (!bsdConfigured() || !Number.isFinite(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
    try {
        const v = await getVenueDetail(numId);
        if (!v) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json(v, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' } });
    } catch {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
}
