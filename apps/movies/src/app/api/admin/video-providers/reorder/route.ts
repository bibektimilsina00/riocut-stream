import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

/**
 * PATCH /api/admin/video-providers/reorder
 * Reorder video providers
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { providers }: { providers: { id: string; sortOrder: number }[] } = await request.json();

        if (!Array.isArray(providers)) {
            return NextResponse.json(
                { error: 'Invalid data format' },
                { status: 400 }
            );
        }

        // Update all providers with new sort orders
        await prisma.$transaction(
            providers.map((provider) =>
                prisma.videoProvider.update({
                    where: { id: provider.id },
                    data: { sortOrder: provider.sortOrder }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering video providers:', error);
        return NextResponse.json(
            { error: 'Failed to reorder video providers' },
            { status: 500 }
        );
    }
}
