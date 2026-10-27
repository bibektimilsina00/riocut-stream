import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

/**
 * GET /api/admin/video-providers/[id]
 * Get a specific video provider
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const provider = await prisma.videoProvider.findUnique({
            where: { id: params.id }
        });

        if (!provider) {
            return NextResponse.json(
                { error: 'Provider not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(provider);
    } catch (error) {
        console.error('Error fetching video provider:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video provider' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/video-providers/[id]
 * Update a video provider
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const session = await auth(); if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // If this is set as default, unset other defaults
        if (data.isDefault) {
            await prisma.videoProvider.updateMany({
                where: {
                    isDefault: true,
                    NOT: { id: params.id }
                },
                data: { isDefault: false }
            });
        }

        const provider = await prisma.videoProvider.update({
            where: { id: params.id },
            data
        });

        return NextResponse.json(provider);
    } catch (error: unknown) {
        console.error('Error updating video provider:', error);
        if (error && typeof error === 'object' && 'code' in error) {
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { error: 'Provider not found' },
                    { status: 404 }
                );
            }
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Provider with this name or slug already exists' },
                    { status: 400 }
                );
            }
        }
        return NextResponse.json(
            { error: 'Failed to update video provider' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/video-providers/[id]
 * Delete a video provider
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.videoProvider.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error deleting video provider:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Provider not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete video provider' },
            { status: 500 }
        );
    }
}
