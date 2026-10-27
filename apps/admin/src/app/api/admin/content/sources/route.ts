import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@riocut/db';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Fetch video providers from database
        const providers = await prisma.videoProvider.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        // Transform to match ContentSource interface with health monitoring fields
        const sources = providers.map(provider => ({
            id: provider.id,
            name: provider.name,
            slug: provider.slug,
            baseUrl: provider.baseUrl,
            movieTemplate: provider.movieTemplate,
            tvTemplate: provider.tvTemplate,
            quality: provider.quality,
            description: provider.description,
            logoUrl: provider.logoUrl,
            homepage: provider.homepage,
            isEnabled: provider.isEnabled,
            isDefault: provider.isDefault,
            sortOrder: provider.sortOrder,
            supportsImdb: provider.supportsImdb,
            supportsTmdb: provider.supportsTmdb,
            hasMultiQuality: provider.hasMultiQuality,
            hasSubtitles: provider.hasSubtitles,
            hasAutoplay: provider.hasAutoplay,
            lastChecked: provider.lastChecked?.toISOString(),
            lastResponseTime: provider.lastResponseTime,
            lastStatus: provider.lastStatus,
            status: (provider.lastStatus as any) || (provider.isEnabled ? 'active' : 'inactive'),
            responseTime: provider.lastResponseTime ?? undefined,
        }));

        return NextResponse.json({ sources });
    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.baseUrl || !body.movieTemplate || !body.tvTemplate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the highest sortOrder
        const maxOrder = await prisma.videoProvider.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        // If isDefault is true, unset all other defaults
        if (body.isDefault) {
            await prisma.videoProvider.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        // Create new provider
        const provider = await prisma.videoProvider.create({
            data: {
                name: body.name,
                slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
                baseUrl: body.baseUrl,
                movieTemplate: body.movieTemplate,
                tvTemplate: body.tvTemplate,
                quality: body.quality || 'HD',
                isEnabled: body.isEnabled !== false,
                isDefault: body.isDefault || false,
                sortOrder: (maxOrder?.sortOrder || 0) + 1,
                supportsImdb: body.supportsImdb !== false,
                supportsTmdb: body.supportsTmdb !== false,
                hasMultiQuality: body.hasMultiQuality || false,
                hasSubtitles: body.hasSubtitles || false,
                hasAutoplay: body.hasAutoplay || false,
                description: body.description,
                logoUrl: body.logoUrl,
                homepage: body.homepage,
            },
        });

        return NextResponse.json({ provider }, { status: 201 });
    } catch (error) {
        console.error('Error creating provider:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
