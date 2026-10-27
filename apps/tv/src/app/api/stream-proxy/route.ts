import { NextRequest, NextResponse } from 'next/server';
import { getChannels, rewriteM3u8 } from '@riocut/services';

export const dynamic = 'force-dynamic';

let allowedHostsCache: { hosts: Set<string>; at: number } | null = null;
const ALLOW_TTL = 3600_000;

async function allowedHosts(): Promise<Set<string>> {
    if (allowedHostsCache && Date.now() - allowedHostsCache.at < ALLOW_TTL) return allowedHostsCache.hosts;
    const channels = await getChannels();
    const hosts = new Set<string>();
    for (const c of channels) {
        for (const s of c.streams) {
            try {
                hosts.add(new URL(s.url).hostname);
            } catch {
                /* skip malformed */
            }
        }
    }
    allowedHostsCache = { hosts, at: Date.now() };
    return hosts;
}

const PLAYLIST_RE = /\.m3u8($|\?)/i;

export async function GET(req: NextRequest) {
    const target = req.nextUrl.searchParams.get('url');
    if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    let url: URL;
    try {
        url = new URL(target);
    } catch {
        return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
    }

    // SSRF guard: only proxy hosts that appear in the ingested iptv-org stream set.
    const hosts = await allowedHosts();
    if (!hosts.has(url.hostname)) {
        return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
    }

    const referrer = req.nextUrl.searchParams.get('ref');
    const userAgent = req.nextUrl.searchParams.get('ua');
    const headers: Record<string, string> = {};
    if (referrer) headers['Referer'] = referrer;
    headers['User-Agent'] = userAgent || 'Mozilla/5.0';

    let upstream: Response;
    try {
        upstream = await fetch(url.toString(), { headers, redirect: 'follow' });
    } catch {
        return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
    }
    if (!upstream.ok) {
        return NextResponse.json({ error: 'Upstream error', status: upstream.status }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? '';
    const isPlaylist = PLAYLIST_RE.test(url.pathname) || contentType.includes('mpegurl');

    if (isPlaylist) {
        const text = await upstream.text();
        const finalUrl = upstream.url || url.toString();
        const toProxy = (abs: string) => {
            const p = new URLSearchParams({ url: abs });
            if (referrer) p.set('ref', referrer);
            if (userAgent) p.set('ua', userAgent);
            return `/api/stream-proxy?${p.toString()}`;
        };
        const rewritten = rewriteM3u8(text, finalUrl, toProxy);
        return new NextResponse(rewritten, {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
        });
    }

    // Binary passthrough (segments, keys).
    return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Cache-Control': 'no-store',
        },
    });
}
