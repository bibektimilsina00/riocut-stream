import { prisma } from '@riocut/db';

// Database utility functions with retry logic
export class DatabaseError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'DatabaseError';
    }
}

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
};

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (attempt: number): number => {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
    const retryableErrorCodes = [
        'P1001', // Can't reach database server
        'P1008', // Operations timed out
        'P1017', // Server has closed the connection
        'E57P01', // terminating connection due to administrator command
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';

    return (
        retryableErrorCodes.includes(errorCode) ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('terminating connection') ||
        errorMessage.includes('server closed the connection')
    );
};

// Retry wrapper for database operations
export async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation'
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            // Ensure connection is healthy before operation
            await prisma.$connect();

            // Execute the operation
            const result = await operation();

            if (attempt > 1) {
                console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
            }

            return result;
        } catch (error) {
            lastError = error;

            console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error);

            // Don't retry if it's not a retryable error
            if (!isRetryableError(error)) {
                console.error(`🚫 Error is not retryable, giving up`);
                break;
            }

            // Don't wait after the last attempt
            if (attempt < RETRY_CONFIG.maxRetries) {
                const delay = getRetryDelay(attempt);
                console.log(`⏳ Retrying ${operationName} in ${delay}ms... (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);

                // Disconnect and reconnect before retry
                try {
                    await prisma.$disconnect();
                    await sleep(delay);
                    await prisma.$connect();
                } catch (reconnectError) {
                    console.error(`⚠️ Reconnection failed:`, reconnectError);
                }
            }
        }
    }

    throw new DatabaseError(
        `${operationName} failed after ${RETRY_CONFIG.maxRetries} attempts`,
        lastError
    );
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
    healthy: boolean;
    message: string;
    details?: any;
}> {
    try {
        // Simple query to test connection
        await prisma.$queryRaw`SELECT 1 as test`;

        return {
            healthy: true,
            message: 'Database connection is healthy'
        };
    } catch (error: any) {
        return {
            healthy: false,
            message: 'Database connection failed',
            details: {
                message: error.message,
                code: error.code,
            }
        };
    }
}

// Graceful database operations wrapper
export async function safeDbOperation<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    operationName?: string
): Promise<T | typeof fallbackValue> {
    try {
        return await withRetry(operation, operationName);
    } catch (error) {
        console.error(`🔥 Safe database operation failed:`, error);

        if (fallbackValue !== undefined) {
            console.log(`🔄 Returning fallback value for ${operationName}`);
            return fallbackValue;
        }

        throw error;
    }
}

// Database connection pool status
export async function getConnectionInfo(): Promise<any> {
    try {
        const info = await prisma.$queryRaw`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `;

        return info;
    } catch (error) {
        console.error('Failed to get connection info:', error);
        return null;
    }
}