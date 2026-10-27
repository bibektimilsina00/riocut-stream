import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, getManager } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numId = Number(id);
    if (!bsdConfigured() || !Number.isFinite(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
    try {
        const m = await getManager(numId);
        if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json(m, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } });
    } catch {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
}
