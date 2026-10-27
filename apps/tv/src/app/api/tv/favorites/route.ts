import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addFavorite, removeFavorite, listFavorites } from '@riocut/services';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ items: await listFavorites(session.user.id) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.channelId || !body.name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const item = await addFavorite(session.user.id, {
        channelId: body.channelId,
        name: body.name,
        logo: body.logo ?? null,
        country: body.country ?? null,
    });
    return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const channelId = new URL(req.url).searchParams.get('channelId');
    if (!channelId) return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
    await removeFavorite(session.user.id, channelId);
    return NextResponse.json({ ok: true });
}
