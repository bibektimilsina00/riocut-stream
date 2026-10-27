import { NextRequest, NextResponse } from 'next/server';
import { getActiveTmdbKey } from '@riocut/services';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const { path } = await params;
    const key = await getActiveTmdbKey();
    if (!key) {
        return NextResponse.json(
            { error: 'TMDB API key not configured. Set tmdbApiKey on an admin user.' },
            { status: 503 },
        );
    }

    const target = new URL(`${TMDB_BASE}/${path.map(encodeURIComponent).join('/')}`);
    req.nextUrl.searchParams.forEach((v, k) => {
        if (k !== 'api_key') target.searchParams.set(k, v);
    });
    target.searchParams.set('api_key', key);

    try {
        const res = await fetch(target.toString(), {
            headers: { Accept: 'application/json' },
            // upstream caching handled below
            next: { revalidate: 300 },
        });
        const body = await res.text();
        return new NextResponse(body, {
            status: res.status,
            headers: {
                'Content-Type': res.headers.get('content-type') ?? 'application/json',
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            },
        });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json(
            { error: 'TMDB upstream error', message: e.message },
            { status: 502 },
        );
    }
}

export const dynamic = 'force-dynamic';
