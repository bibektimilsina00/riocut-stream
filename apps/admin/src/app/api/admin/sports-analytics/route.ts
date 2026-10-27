import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOWS: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

/**
 * GET  /api/admin/sports-analytics?window=24h|7d|30d — aggregated stats.
 * DELETE /api/admin/sports-analytics                — reset ALL reports.
 * DELETE /api/admin/sports-analytics?olderThan=30d  — prune reports older than window.
 */
export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const windowKey = searchParams.get('window') || '7d';
        const ms = WINDOWS[windowKey] ?? WINDOWS['7d'];
        const since = new Date(Date.now() - ms);

        const [bySource, byProvider, byMatch, byCountry, total] = await Promise.all([
            prisma.sportsSourceReport.groupBy({
                by: ['sourceKey', 'providerName'],
                where: { createdAt: { gte: since }, reason: { not: 'ok' } },
                _count: { sourceKey: true },
                orderBy: { _count: { sourceKey: 'desc' } },
                take: 50,
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['providerName'],
                where: { createdAt: { gte: since }, reason: { not: 'ok' } },
                _count: { providerName: true },
                orderBy: { _count: { providerName: 'desc' } },
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['matchKey'],
                where: { createdAt: { gte: since }, reason: { not: 'ok' } },
                _count: { matchKey: true },
                orderBy: { _count: { matchKey: 'desc' } },
                take: 25,
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['country'],
                where: { createdAt: { gte: since }, reason: { not: 'ok' }, country: { not: null } },
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 25,
            }),
            prisma.sportsSourceReport.count({ where: { createdAt: { gte: since }, reason: { not: 'ok' } } }),
        ]);

        return NextResponse.json({
            window: windowKey,
            total,
            bySource: bySource.map((r) => ({ sourceKey: r.sourceKey, providerName: r.providerName, count: r._count.sourceKey })),
            byProvider: byProvider.map((r) => ({ providerName: r.providerName, count: r._count.providerName })),
            byMatch: byMatch.map((r) => ({ matchKey: r.matchKey, count: r._count.matchKey })),
            byCountry: byCountry.map((r) => ({ country: r.country, count: r._count.country })),
        });
    } catch (e) {
        console.error('sports-analytics failed', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Reset flags. With no query param, wipes the whole table (use when you want a
 * clean slate after fixing a broken upstream). With ?olderThan=30d it only
 * prunes old reports — safe periodic maintenance.
 */
export async function DELETE(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const olderThan = searchParams.get('olderThan');
        if (olderThan) {
            const ms = WINDOWS[olderThan];
            if (!ms) return NextResponse.json({ error: `olderThan must be one of: ${Object.keys(WINDOWS).join(', ')}` }, { status: 400 });
            const cutoff = new Date(Date.now() - ms);
            const result = await prisma.sportsSourceReport.deleteMany({ where: { createdAt: { lt: cutoff } } });
            return NextResponse.json({ deleted: result.count, mode: 'prune', olderThan });
        }
        const result = await prisma.sportsSourceReport.deleteMany({});
        return NextResponse.json({ deleted: result.count, mode: 'reset-all' });
    } catch (e) {
        console.error('sports-analytics DELETE failed', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
