import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();
        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password too short' }, { status: 400 });
        }
        const user = await registerUser(email, password, name);
        return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Registration failed';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
