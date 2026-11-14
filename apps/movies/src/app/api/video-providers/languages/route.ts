import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ponytail: fixed threshold; make it admin-tunable if spam becomes a problem.
const MIN_YES = 2;

/**
 * GET /api/video-providers/languages?type=movie|tv&tmdbId=123
 * → { verified: { [lang]: providerSlug[] } } — servers where viewers confirmed
 * hearing `lang` (>= MIN_YES yes votes and more yes than no), best first.
 */
export async function GET(request: NextRequest) {
    const q = new URL(request.url).searchParams;
    const type = q.get('type');
    const tmdbId = Number(q.get('tmdbId'));
    const verified: Record<string, string[]> = {};
    if (['movie', 'tv'].includes(type ?? '') && Number.isInteger(tmdbId)) {
        try {
            const rows = await prisma.titleLanguageReport.groupBy({
                by: ['lang', 'providerSlug', 'heard'], _count: { _all: true },
                where: { mediaType: type!, tmdbId },
            });
            const agg: Record<string, { lang: string; slug: string; yes: number; no: number }> = {};
            for (const r of rows) {
                const a = (agg[`${r.lang}|${r.providerSlug}`] ??= { lang: r.lang, slug: r.providerSlug, yes: 0, no: 0 });
                if (r.heard) a.yes += r._count._all; else a.no += r._count._all;
            }
            Object.values(agg)
                .filter((a) => a.yes >= MIN_YES && a.yes > a.no)
                .sort((a, b) => b.yes - b.no - (a.yes - a.no))
                .forEach((a) => (verified[a.lang] ??= []).push(a.slug));
        } catch (e) {
            console.error('title languages failed', e);
        }
    }
    return NextResponse.json({ verified }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
}
