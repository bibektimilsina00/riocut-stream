import { NextResponse } from 'next/server';
import { prisma } from '@riocut/db';

export async function GET() {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            app: 'admin',
            services: { database: 'connected', app: 'running' },
        });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
            app: 'admin',
            services: { database: 'disconnected', app: 'running' },
            error: 'Database connection failed',
            error_details: { name: e.name, message: e.message },
        }, { status: 503 });
    }
}
