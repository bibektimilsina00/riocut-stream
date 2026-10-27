import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;

        const provider = await prisma.videoProvider.findUnique({
            where: { id },
        });

        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        return NextResponse.json({ provider });
    } catch (error) {
        console.error('Error fetching provider:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if provider exists
        const existingProvider = await prisma.videoProvider.findUnique({
            where: { id },
        });

        if (!existingProvider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        // If setting this as default, unset all other defaults
        if (body.isDefault === true) {
            await prisma.videoProvider.updateMany({
                where: {
                    isDefault: true,
                    NOT: { id }
                },
                data: { isDefault: false },
            });
        }

        // Update the provider
        const provider = await prisma.videoProvider.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.slug && { slug: body.slug }),
                ...(body.baseUrl && { baseUrl: body.baseUrl }),
                ...(body.movieTemplate && { movieTemplate: body.movieTemplate }),
                ...(body.tvTemplate && { tvTemplate: body.tvTemplate }),
                ...(body.quality && { quality: body.quality }),
                ...(typeof body.isEnabled === 'boolean' && { isEnabled: body.isEnabled }),
                ...(typeof body.isDefault === 'boolean' && { isDefault: body.isDefault }),
                ...(typeof body.supportsImdb === 'boolean' && { supportsImdb: body.supportsImdb }),
                ...(typeof body.supportsTmdb === 'boolean' && { supportsTmdb: body.supportsTmdb }),
                ...(typeof body.hasMultiQuality === 'boolean' && { hasMultiQuality: body.hasMultiQuality }),
                ...(typeof body.hasSubtitles === 'boolean' && { hasSubtitles: body.hasSubtitles }),
                ...(typeof body.hasAutoplay === 'boolean' && { hasAutoplay: body.hasAutoplay }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
                ...(body.homepage !== undefined && { homepage: body.homepage }),
                ...(typeof body.order === 'number' && { sortOrder: body.order }),
            },
        });

        return NextResponse.json({
            success: true,
            provider,
            status: provider.isEnabled ? 'active' : 'inactive'
        });
    } catch (error) {
        console.error('Error updating provider:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await params;

        await prisma.videoProvider.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }
        console.error('Error deleting provider:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
