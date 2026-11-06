import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { listLiveMatches } from '@riocut/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/sports/live — currently-live matches with viewer counts. */
export async function GET() {
    const { error } = await requireAdminAuth();
    if (error) return error;

    const matches = await listLiveMatches();
    return NextResponse.json({ matches });
}
