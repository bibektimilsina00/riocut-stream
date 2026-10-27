import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, getReferee } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numId = Number(id);
    if (!bsdConfigured() || !Number.isFinite(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
    try {
        const r = await getReferee(numId);
        if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json(r, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } });
    } catch {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
}
