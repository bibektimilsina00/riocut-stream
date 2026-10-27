import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (currentUser?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { userId, role } = await req.json();

        // Validate input
        if (!userId || !role) {
            return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
        }

        // Validate role value
        if (!['user', 'moderator', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Prevent admin from demoting themselves
        if (userId === session.user.id && role !== 'admin') {
            return NextResponse.json({ error: 'You cannot change your own admin role' }, { status: 400 });
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
