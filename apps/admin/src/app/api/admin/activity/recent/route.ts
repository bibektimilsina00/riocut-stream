import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

interface ActivityItem {
    id: string;
    type: string;
    user: string;
    description: string;
    timestamp: Date;
}

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Get recent activity from various models
        const activities: ActivityItem[] = [];

        // Recent watch rooms created
        const recentRooms = await prisma.watchRoom.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            select: { id: true, mediaTitle: true, creator: { select: { name: true } }, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        recentRooms.forEach((room: any) => {
            activities.push({
                id: room.id,
                type: 'room_created',
                user: room.creator.name,
                description: `Created watch room for "${room.mediaTitle}"`,
                timestamp: room.createdAt,
            });
        });

        // Recent users joined
        const recentUsers = await prisma.user.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            select: { id: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        recentUsers.forEach((user: any) => {
            activities.push({
                id: user.id,
                type: 'user_signup',
                user: user.name,
                description: `New user joined the platform`,
                timestamp: user.createdAt,
            });
        });

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return NextResponse.json({
            activities: activities.slice(0, 10).map(a => ({
                ...a,
                timestamp: a.timestamp.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
