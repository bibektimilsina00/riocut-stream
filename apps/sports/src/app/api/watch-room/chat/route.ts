import { NextRequest, NextResponse } from 'next/server';
import { getChatHistory } from '@riocut/services';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('roomCode');
    if (!code) return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 });
    const messages = await getChatHistory(code);
    return NextResponse.json({ messages });
}
