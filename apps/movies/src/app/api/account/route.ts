import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAccount, updateUserName } from '@riocut/auth/server';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const account = await getUserAccount(session.user.email);
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ account });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { name } = body ?? {};
        if (typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
        }
        const updated = await updateUserName(session.user.email, name);
        return NextResponse.json({ account: updated });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
