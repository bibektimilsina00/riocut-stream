import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/video-providers/stats?days=7&type=movie|tv&tmdbId=123
 * Per-provider success rate from crowd reports. With tmdbId: that title only,
 * so you can see which server is bad for one movie but fine elsewhere.
 * Without tmdbId: global, plus the 10 titles each provider fails on most.
 */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const q = new URL(request.url).searchParams;
    const days = Math.min(Math.max(Number(q.get('days')) || 7, 1), 90);
    const type = q.get('type');
    const tmdbId = Number(q.get('tmdbId'));
    const where = {
        createdAt: { gte: new Date(Date.now() - days * 86400_000) },
        ...(type === 'movie' || type === 'tv' ? { mediaType: type } : {}),
        ...(Number.isInteger(tmdbId) && tmdbId > 0 ? { tmdbId } : {}),
    };

    const rows = await prisma.videoProviderReport.groupBy({
        by: ['providerSlug', 'reason'], _count: { _all: true }, where,
    });
    const providers: Record<string, { ok: number; bailed: number; timeout: number; successRate: number | null; worstTitles?: { mediaType: string; tmdbId: number; bad: number }[] }> = {};
    for (const r of rows) {
        const p = (providers[r.providerSlug] ??= { ok: 0, bailed: 0, timeout: 0, successRate: null });
        if (r.reason === 'ok' || r.reason === 'bailed' || r.reason === 'timeout') p[r.reason] += r._count._all;
    }
    for (const p of Object.values(providers)) {
        const n = p.ok + p.bailed + p.timeout;
        p.successRate = n ? Math.round((p.ok / n) * 100) / 100 : null;
    }

    if (!where.tmdbId) {
        const bad = await prisma.videoProviderReport.groupBy({
            by: ['providerSlug', 'mediaType', 'tmdbId'], _count: { _all: true },
            where: { ...where, reason: { in: ['bailed', 'timeout'] } },
            orderBy: { _count: { tmdbId: 'desc' } }, take: 200,
        });
        for (const b of bad) {
            const p = providers[b.providerSlug];
            if (p && (p.worstTitles ??= []).length < 10) p.worstTitles!.push({ mediaType: b.mediaType, tmdbId: b.tmdbId, bad: b._count._all });
        }
    }
    return NextResponse.json({ days, providers });
}
