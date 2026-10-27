import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '@riocut/services';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await getUserNotifications(session.user.id);
    return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (body.markAll) {
        await markAllAsRead(session.user.id);
        return NextResponse.json({ ok: true });
    }
    if (body.id) {
        await markAsRead(body.id, session.user.id);
        return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Missing id or markAll' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteNotification(id, session.user.id);
    return NextResponse.json({ ok: true });
}
