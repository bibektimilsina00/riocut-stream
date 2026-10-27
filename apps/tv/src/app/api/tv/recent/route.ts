import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recordRecent, listRecent } from '@riocut/services';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ items: await listRecent(session.user.id) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.channelId || !body.name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const item = await recordRecent(session.user.id, {
        channelId: body.channelId,
        name: body.name,
        logo: body.logo ?? null,
        country: body.country ?? null,
    });
    return NextResponse.json({ item }, { status: 201 });
}
