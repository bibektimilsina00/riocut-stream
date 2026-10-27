import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@riocut/db';

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { id } = await context.params;

        // Fetch the provider
        const provider = await prisma.videoProvider.findUnique({
            where: { id },
        });

        if (!provider) {
            return NextResponse.json(
                { error: 'Provider not found' },
                { status: 404 }
            );
        }

        // Test URL - use a sample TMDB ID for testing
        const testTmdbId = '550'; // Fight Club as test movie
        const testUrl = provider.movieTemplate.replace('{tmdbId}', testTmdbId);

        // Measure response time
        const startTime = performance.now();

        try {
            const response = await fetch(testUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            let status: 'healthy' | 'degraded' | 'offline' = 'healthy';

            if (response.ok) {
                if (responseTime > 3000) {
                    status = 'degraded';
                } else {
                    status = 'healthy';
                }
            } else {
                status = 'offline';
            }

            // Update provider with last check time and response time
            await prisma.videoProvider.update({
                where: { id },
                data: {
                    lastChecked: new Date(),
                    lastResponseTime: responseTime,
                    lastStatus: status,
                },
            });

            return NextResponse.json({
                status,
                responseTime,
                timestamp: new Date().toISOString(),
            });
        } catch (fetchError) {
            // Network error or timeout
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            await prisma.videoProvider.update({
                where: { id },
                data: {
                    lastChecked: new Date(),
                    lastResponseTime: responseTime,
                    lastStatus: 'offline',
                },
            });

            return NextResponse.json({
                status: 'offline',
                responseTime,
                timestamp: new Date().toISOString(),
                error: fetchError instanceof Error ? fetchError.message : 'Network error',
            });
        }
    } catch (error) {
        console.error('Error testing provider:', error);
        return NextResponse.json(
            { error: 'Failed to test provider' },
            { status: 500 }
        );
    }
}
