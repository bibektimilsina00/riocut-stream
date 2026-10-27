import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

// PATCH /api/admin/sports-providers/:id
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();

        const existing = await prisma.sportsProviderConfig.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updated = await prisma.sportsProviderConfig.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.kind && { kind: body.kind }),
                ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl || null }),
                ...(body.apiKey !== undefined && { apiKey: body.apiKey || null }),
                ...(typeof body.isEnabled === 'boolean' && { isEnabled: body.isEnabled }),
                ...(typeof body.sortOrder === 'number' && { sortOrder: body.sortOrder }),
            },
        });
        return NextResponse.json({ provider: { ...updated, apiKey: null, hasApiKey: !!updated.apiKey } });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return NextResponse.json({ error: 'A provider with that name already exists' }, { status: 409 });
        }
        console.error('Error updating sports provider:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/sports-providers/:id
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;
        await prisma.sportsProviderConfig.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('Error deleting sports provider:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
