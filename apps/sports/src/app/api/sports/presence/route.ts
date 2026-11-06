import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { heartbeatLiveViewer, listLiveMatches } from '@riocut/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sports/presence { matchKey, cid } — heartbeat from a player page.
 * Everyone gets `{ok:true}`; ONLY a session with role==='admin' gets `count`.
 * The count is decided server-side, so it never reaches non-admin clients.
 *
 * DB-backed (not in-memory): the admin app is a separate process/container
 * and needs to read this for its "Live Now" dashboard.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    const matchKey = typeof body?.matchKey === 'string' ? body.matchKey.slice(0, 256) : '';
    const cid = typeof body?.cid === 'string' ? body.cid.slice(0, 64) : '';
    if (!matchKey || !cid) return NextResponse.json({ ok: true });

    await heartbeatLiveViewer(matchKey, cid);

    const session = await auth();
    if ((session?.user as { role?: string } | undefined)?.role !== 'admin') {
        return NextResponse.json({ ok: true });
    }
    const match = (await listLiveMatches()).find((m) => m.matchKey === matchKey);
    return NextResponse.json({ ok: true, count: match?.viewers ?? 0 });
}
