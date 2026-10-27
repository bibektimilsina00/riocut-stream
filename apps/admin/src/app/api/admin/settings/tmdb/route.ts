import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    getActiveTmdbKeyStatus,
    setActiveTmdbKey,
    clearActiveTmdbKey,
} from '@riocut/services';

function requireAdmin(session: unknown): string | null {
    const s = session as { user?: { id?: string; role?: string } } | null;
    if (!s?.user?.id) return null;
    return s.user.role === 'admin' ? s.user.id : null;
}

export async function GET() {
    const session = await auth();
    if (!requireAdmin(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const status = await getActiveTmdbKeyStatus();
    return NextResponse.json(status);
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    const adminId = requireAdmin(session);
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const tmdbApiKey = typeof body?.tmdbApiKey === 'string' ? body.tmdbApiKey.trim() : '';
    if (!tmdbApiKey) {
        return NextResponse.json({ error: 'tmdbApiKey required' }, { status: 400 });
    }
    await setActiveTmdbKey(tmdbApiKey, adminId as string);
    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    const session = await auth();
    if (!requireAdmin(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await clearActiveTmdbKey();
    return NextResponse.json({ ok: true });
}
