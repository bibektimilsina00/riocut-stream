import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id: userId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { isBanned } = body;

        if (typeof isBanned !== 'boolean') {
            return NextResponse.json({ error: 'isBanned must be a boolean' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isBanned },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBanned: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user ban status:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}