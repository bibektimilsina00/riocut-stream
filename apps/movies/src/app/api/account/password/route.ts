import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { changeUserPassword } from '@riocut/auth/server';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { currentPassword, newPassword } = await req.json();
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        await changeUserPassword(session.user.email, currentPassword, newPassword);
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Password change failed';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
