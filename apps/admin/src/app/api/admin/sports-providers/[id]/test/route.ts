import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

/**
 * Ping the upstream to measure health. Naive HEAD/GET against a well-known
 * endpoint per kind. Records lastChecked, lastStatus, lastResponseTime.
 *
 * status heuristic:
 *   healthy  → 2xx within 3s
 *   degraded → 2xx-3xx within 8s, or non-2xx but reachable
 *   offline  → network error / timeout
 */

const DEFAULTS: Record<string, string> = {
    sportsrc: 'https://api.sportsrc.org',
    streamed: 'https://streamed.pk',
    esportex: 'https://api.esportex.site',
    yono: 'https://yonotv-data.pages.dev',
};

function pingUrl(kind: string, baseUrl: string): string {
    const b = baseUrl.replace(/\/$/, '');
    switch (kind) {
        case 'sportsrc': return `${b}/?data=sports`;
        case 'streamed': return `${b}/api/sports`;
        case 'esportex': return `${b}/api/streams?cache=${Date.now()}`;
        case 'yono': return `${b}/api2.json`;
        default: return `${b}/`;
    }
}

async function timedFetch(url: string, timeoutMs: number): Promise<{ ok: boolean; status: number; ms: number; err?: string }> {
    const started = Date.now();
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { method: 'GET', signal: ctl.signal, headers: { Accept: 'application/json' } });
        return { ok: res.ok, status: res.status, ms: Date.now() - started };
    } catch (e: any) {
        return { ok: false, status: 0, ms: Date.now() - started, err: e?.message || 'network error' };
    } finally {
        clearTimeout(t);
    }
}

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;
        const p = await prisma.sportsProviderConfig.findUnique({ where: { id } });
        if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const base = p.baseUrl ?? DEFAULTS[p.kind];
        if (!base) return NextResponse.json({ error: 'No baseUrl configured' }, { status: 400 });

        const url = pingUrl(p.kind, base);
        const r = await timedFetch(url, 8_000);

        let status: 'healthy' | 'degraded' | 'offline';
        if (r.ok && r.ms < 3_000) status = 'healthy';
        else if (r.status > 0) status = 'degraded';
        else status = 'offline';

        const updated = await prisma.sportsProviderConfig.update({
            where: { id },
            data: {
                lastChecked: new Date(),
                lastResponseTime: r.ms,
                lastStatus: status,
            },
        });

        return NextResponse.json({
            provider: { ...updated, apiKey: null, hasApiKey: !!updated.apiKey },
            probe: { url, httpStatus: r.status, ms: r.ms, err: r.err },
        });
    } catch (e) {
        console.error('Error testing sports provider:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
