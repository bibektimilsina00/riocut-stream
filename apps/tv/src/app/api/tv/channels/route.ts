import { NextResponse } from 'next/server';
import { getChannels } from '@riocut/services';

// ~4MB payload; backed by an in-memory TTL cache in the service layer.
export const dynamic = 'force-dynamic';

export async function GET() {
    const channels = await getChannels();
    return NextResponse.json({ channels });
}
