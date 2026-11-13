import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/video-providers/report
 * Body: { providerSlug, mediaType, tmdbId, reason }  (batch: { reports: [...] })
 * Fire-and-forget crowd signal. No PII; country from edge headers only.
 */
const REASONS = ['ok', 'bailed', 'timeout'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const list: unknown[] = Array.isArray(body?.reports) ? body.reports.slice(0, 10) : body ? [body] : [];
        const country = (request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || '').slice(0, 2).toUpperCase() || null;
        const data = list.flatMap((r) => {
            const { providerSlug, mediaType, tmdbId, reason } = (r ?? {}) as Record<string, unknown>;
            if (typeof providerSlug !== 'string' || !['movie', 'tv'].includes(mediaType as string)
                || !Number.isInteger(tmdbId) || !REASONS.includes(reason as string)) return [];
            return [{ providerSlug: providerSlug.slice(0, 64), mediaType: mediaType as string, tmdbId: tmdbId as number, reason: reason as string, country }];
        });
        if (data.length) await prisma.videoProviderReport.createMany({ data });
    } catch (e) {
        console.error('video-provider report failed', e);
    }
    return NextResponse.json({ ok: true });
}
