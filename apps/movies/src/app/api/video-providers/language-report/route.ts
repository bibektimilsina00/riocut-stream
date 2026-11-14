import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST { mediaType, tmdbId, lang, providerSlug, heard } — "did you hear <lang> on this server?" */
export async function POST(request: NextRequest) {
    try {
        const b = await request.json().catch(() => null);
        if (b && ['movie', 'tv'].includes(b.mediaType) && Number.isInteger(b.tmdbId)
            && typeof b.lang === 'string' && /^[a-z]{2,3}$/.test(b.lang)
            && typeof b.providerSlug === 'string' && typeof b.heard === 'boolean') {
            await prisma.titleLanguageReport.create({
                data: { mediaType: b.mediaType, tmdbId: b.tmdbId, lang: b.lang, providerSlug: b.providerSlug.slice(0, 64), heard: b.heard },
            });
        }
    } catch (e) {
        console.error('language report failed', e);
    }
    return NextResponse.json({ ok: true });
}
