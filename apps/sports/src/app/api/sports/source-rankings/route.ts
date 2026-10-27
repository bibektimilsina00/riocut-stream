import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
// Must be dynamic: with `revalidate` Next prerendered this at build time, the
// catch below swallowed the dynamic-usage error, and every viewer got a frozen
// empty ranking. Caching is done with a short CDN header instead.
export const dynamic = 'force-dynamic';
const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' };

/**
 * GET /api/sports/source-rankings?matchKey=...
 * Returns
 *  - goodSources: sourceKeys viewers stayed on (reason 'ok'), best first
 *  - badSources:  sourceKeys with >= REPORT_THRESHOLD failures that outnumber successes
 * Client plays good → unknown → bad, so the first viewers explore and everyone
 * after them lands on what's working.
 */
const REPORT_THRESHOLD = 3;
const WINDOW_HOURS = 6;

export async function GET(request: NextRequest) {
    try {
        const matchKey = new URL(request.url).searchParams.get('matchKey')?.trim();
        if (!matchKey) return NextResponse.json({ goodSources: [], badSources: [] });

        const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
        const grouped = await prisma.sportsSourceReport.groupBy({
            by: ['sourceKey', 'reason'],
            where: { matchKey, createdAt: { gte: since } },
            _count: { sourceKey: true },
        });

        const tally = new Map<string, { ok: number; fail: number }>();
        for (const g of grouped) {
            const t = tally.get(g.sourceKey) ?? { ok: 0, fail: 0 };
            if (g.reason === 'ok') t.ok += g._count.sourceKey;
            else t.fail += g._count.sourceKey;
            tally.set(g.sourceKey, t);
        }

        const entries = Array.from(tally.entries());
        const goodSources = entries
            .filter(([, t]) => t.ok > t.fail)
            .sort((a, b) => (b[1].ok - b[1].fail) - (a[1].ok - a[1].fail))
            .map(([k]) => k);
        const badSources = entries
            .filter(([, t]) => t.fail >= REPORT_THRESHOLD && t.fail > t.ok)
            .map(([k]) => k);

        return NextResponse.json({ goodSources, badSources, windowHours: WINDOW_HOURS }, { headers: CACHE });
    } catch (e) {
        console.error('source-rankings failed', e);
        return NextResponse.json({ goodSources: [], badSources: [] });
    }
}
