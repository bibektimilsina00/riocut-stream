import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export async function PATCH(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const url = new URL(request.url);
        const userId = url.pathname.split('/').pop();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { isBanned, role } = body;

        const data: any = {};
        if (isBanned !== undefined) data.isBanned = isBanned;
        if (role !== undefined) data.role = role;

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBanned: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const url = new URL(request.url);
        const userId = url.pathname.split('/').pop();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Delete user and all related data (cascading)
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
