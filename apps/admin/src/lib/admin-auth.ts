import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function requireAdminAuth() {
    const session = await auth();

    if (!session?.user) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            session: null,
        };
    }

    const user = session.user as any;
    if (user.role !== 'admin') {
        return {
            error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
            session: null,
        };
    }

    return { error: null, session };
}
