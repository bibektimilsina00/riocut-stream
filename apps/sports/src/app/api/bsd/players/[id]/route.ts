import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, getPlayer } from '@/lib/bsd/v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/bsd/players/[id] — full player profile (bio + stats + career + transfers). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numId = Number(id);
    if (!bsdConfigured() || !Number.isFinite(numId)) {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    try {
        const player = await getPlayer(numId);
        if (!player) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json(player, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
        });
    } catch {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
}
