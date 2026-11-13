import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };

/**
 * GET /api/video-providers/rankings?type=movie|tv&tmdbId=123
 * Returns per-provider counts for THIS title and globally for this media type
 * (last 7 days). Scoring/sorting happens client-side (see useProviderRanking).
 */
type Counts = { ok: number; bad: number };
const DAYS = 7;

export async function GET(request: NextRequest) {
    const q = new URL(request.url).searchParams;
    const type = q.get('type');
    const tmdbId = Number(q.get('tmdbId'));
    const empty = { title: {}, global: {} };
    if (!['movie', 'tv'].includes(type ?? '')) return NextResponse.json(empty);
    try {
        const since = new Date(Date.now() - DAYS * 86400_000);
        const [t, g] = await Promise.all([
            Number.isInteger(tmdbId)
                ? prisma.videoProviderReport.groupBy({
                    by: ['providerSlug', 'reason'], _count: { _all: true },
                    where: { mediaType: type!, tmdbId, createdAt: { gte: since } },
                })
                : Promise.resolve([]),
            prisma.videoProviderReport.groupBy({
                by: ['providerSlug', 'reason'], _count: { _all: true },
                where: { mediaType: type!, createdAt: { gte: since } },
            }),
        ]);
        const fold = (rows: typeof g) => {
            const out: Record<string, Counts> = {};
            for (const r of rows) {
                const c = (out[r.providerSlug] ??= { ok: 0, bad: 0 });
                if (r.reason === 'ok') c.ok += r._count._all; else c.bad += r._count._all;
            }
            return out;
        };
        return NextResponse.json({ title: fold(t), global: fold(g) }, { headers: CACHE });
    } catch (e) {
        console.error('video-provider rankings failed', e);
        return NextResponse.json(empty);
    }
}
