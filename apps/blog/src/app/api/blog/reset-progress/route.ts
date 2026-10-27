import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@riocut/db';

/**
 * Reset blog generation progress for a user
 * This allows starting fresh from page 1, index 0
 */
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { mediaType, sortBy } = await request.json();

        if (!mediaType || !sortBy) {
            return NextResponse.json(
                { error: 'mediaType and sortBy are required' },
                { status: 400 }
            );
        }

        // Delete the progress record (will be recreated on next generation)
        await prisma.blogGenerationProgress.deleteMany({
            where: {
                userId: session.user.id,
                mediaType,
                sortBy,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Progress reset for ${mediaType} - ${sortBy}`,
        });
    } catch (error) {
        console.error('Error resetting progress:', error);
        return NextResponse.json(
            { error: 'Failed to reset progress' },
            { status: 500 }
        );
    }
}

/**
 * Get all progress records for the current user
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const progressRecords = await prisma.blogGenerationProgress.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                lastUpdated: 'desc',
            },
        });

        return NextResponse.json({ progressRecords });
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}
