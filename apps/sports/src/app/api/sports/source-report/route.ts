import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sports/source-report
 * Body: { matchKey, sourceKey, providerName, reason }
 * Records that a source didn't work for this user. Aggregated to demote bad
 * sources globally. No PII stored — only country from edge headers.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
        }
        const { matchKey, sourceKey, providerName, reason } = body as Record<string, unknown>;
        if (typeof matchKey !== 'string' || typeof sourceKey !== 'string' || typeof providerName !== 'string' || typeof reason !== 'string') {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        if (!['auto-failed', 'user-report', 'stall'].includes(reason)) {
            return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
        }
        // Trim to sane sizes so a malicious client can't blow up storage.
        const country =
            request.headers.get('cf-ipcountry') ||
            request.headers.get('x-vercel-ip-country') ||
            request.headers.get('x-country') ||
            null;

        await prisma.sportsSourceReport.create({
            data: {
                matchKey: matchKey.slice(0, 256),
                sourceKey: sourceKey.slice(0, 256),
                providerName: providerName.slice(0, 64),
                reason,
                country: country ? country.slice(0, 2).toUpperCase() : null,
            },
        });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('source-report failed', e);
        // Never surface the error to the client — this is a fire-and-forget signal.
        return NextResponse.json({ ok: true });
    }
}
