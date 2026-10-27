import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

/**
 * GET /api/admin/video-providers
 * Get all video providers (ordered by sortOrder)
 */
export async function GET() {
    try {
        const session = await auth();

        // Check if user is admin
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const providers = await prisma.videoProvider.findMany({
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(providers);
    } catch (error) {
        console.error('Error fetching video providers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video providers' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/video-providers
 * Create a new video provider
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.slug || !data.baseUrl || !data.movieTemplate || !data.tvTemplate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // If this is set as default, unset other defaults
        if (data.isDefault) {
            await prisma.videoProvider.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        // Get the highest sortOrder and add 1
        const maxOrder = await prisma.videoProvider.findFirst({
            select: { sortOrder: true },
            orderBy: { sortOrder: 'desc' }
        });

        const provider = await prisma.videoProvider.create({
            data: {
                ...data,
                sortOrder: data.sortOrder ?? ((maxOrder?.sortOrder ?? -1) + 1)
            }
        });

        return NextResponse.json(provider, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating video provider:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Provider with this name or slug already exists' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create video provider' },
            { status: 500 }
        );
    }
}
