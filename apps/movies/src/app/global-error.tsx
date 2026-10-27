'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console
        if (error) {
            console.error('Global error:', error);
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen bg-black flex items-center justify-center px-4">
                    <div className="max-w-md w-full">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-gray-400 mb-2">
                                {error?.message || 'An unexpected error occurred'}
                            </p>
                            {error?.digest && (
                                <p className="text-gray-500 text-sm mb-6">
                                    Error ID: {error.digest}
                                </p>
                            )}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => reset()}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    Try Again
                                </button>
                                <Link
                                    href="/"
                                    className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                                >
                                    Go Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
