import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role');

        const where: any = {
            AND: [
                search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {},
                role ? { role } : {},
            ],
        };

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                isBanned: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const total = await prisma.user.count({ where });

        return NextResponse.json({ users, total });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
