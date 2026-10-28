import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

const VALID_KINDS = new Set(['sportsrc', 'streamed', 'esportex', 'yono']);

// GET /api/admin/sports-providers — list all configs
export async function GET() {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const providers = await prisma.sportsProviderConfig.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        // Mask apiKey in the response — reveal only whether one is set.
        const safe = providers.map((p) => ({
            ...p,
            apiKey: p.apiKey ? '••••' + p.apiKey.slice(-4) : null,
            hasApiKey: !!p.apiKey,
        }));
        return NextResponse.json({ providers: safe });
    } catch (e) {
        console.error('Error listing sports providers:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/sports-providers — create a new provider row
export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const body = await request.json();
        if (!body.kind || !VALID_KINDS.has(body.kind)) {
            return NextResponse.json({ error: `kind must be one of: ${Array.from(VALID_KINDS).join(', ')}` }, { status: 400 });
        }
        if (!body.name || typeof body.name !== 'string') {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const max = await prisma.sportsProviderConfig.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const created = await prisma.sportsProviderConfig.create({
            data: {
                kind: body.kind,
                name: body.name,
                baseUrl: body.baseUrl || null,
                apiKey: body.apiKey || null,
                isEnabled: body.isEnabled !== false,
                sortOrder: (max?.sortOrder ?? -1) + 1,
            },
        });
        return NextResponse.json({ provider: { ...created, apiKey: null, hasApiKey: !!created.apiKey } }, { status: 201 });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return NextResponse.json({ error: 'A provider with that name already exists' }, { status: 409 });
        }
        console.error('Error creating sports provider:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
