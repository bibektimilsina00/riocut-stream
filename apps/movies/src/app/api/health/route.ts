import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint for Docker container monitoring
 * Checks database connectivity without Redis dependency
 */
export async function GET() {
    const startTime = Date.now();
    console.log('[Health Check] Starting health check...');
    console.log('[Health Check] DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('[Health Check] DATABASE_URL value (masked):',
        process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

    try {
        // Dynamically import prisma to avoid initialization issues
        const { prisma } = await import('@riocut/db');

        // Test database connection - try simple query first, fallback to raw query
        console.log('[Health Check] Attempting database connection...');
        try {
            const userCount = await prisma.user.count();
            console.log('[Health Check] Database query successful, user count:', userCount);
        } catch {
            console.log('[Health Check] User count failed, trying raw query...');
            // If user table doesn't exist, try a basic connection test
            await prisma.$queryRaw`SELECT 1`;
            console.log('[Health Check] Raw query successful');
        }

        const duration = Date.now() - startTime;
        console.log(`[Health Check] ✅ Health check passed in ${duration}ms`);

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            duration_ms: duration,
            services: {
                database: 'connected',
                app: 'running'
            }
        }, { status: 200 });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('[Health Check] ❌ Health check failed:', error);
        console.error('[Health Check] Error name:', (error as Error)?.name);
        console.error('[Health Check] Error message:', (error as Error)?.message);
        console.error('[Health Check] Error stack:', (error as Error)?.stack);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration_ms: duration,
            services: {
                database: 'disconnected',
                app: 'running'
            },
            error: 'Database connection failed',
            error_details: {
                name: (error as Error)?.name,
                message: (error as Error)?.message
            }
        }, { status: 503 });
    }
}