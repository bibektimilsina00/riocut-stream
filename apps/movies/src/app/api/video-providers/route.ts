import { NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

/**
 * GET /api/video-providers
 * Get all enabled video providers (public endpoint)
 */
export async function GET() {
    try {
        const providers = await prisma.videoProvider.findMany({
            where: { isEnabled: true },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                quality: true,
                isDefault: true,
                movieTemplate: true,
                tvTemplate: true,
                supportsImdb: true,
                supportsTmdb: true,
                hasMultiQuality: true,
                hasSubtitles: true,
                hasAutoplay: true,
                description: true,
                logoUrl: true
            }
        });

        return NextResponse.json(providers, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        });
    } catch (error) {
        console.error('Error fetching video providers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video providers' },
            {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
            }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Max-Age': '86400',
        },
    });
}

export const dynamic = 'force-dynamic';
