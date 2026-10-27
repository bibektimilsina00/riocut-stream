'use client';

import { useEffect } from 'react';
import { trackError } from './client';

/** Root error boundary for apps without their own `global-error.tsx`. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        trackError(error, { digest: error.digest, boundary: 'global-error' });
    }, [error]);

    return (
        <html lang="en">
            <body style={{ background: '#0a0f0f', color: '#fff', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'grid', placeItems: 'center', margin: 0 }}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                    <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
                    <p style={{ color: '#9ca3af', marginBottom: 20 }}>{error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred.'}</p>
                    <button onClick={() => reset()} style={{ background: '#0d9488', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', cursor: 'pointer', marginRight: 8 }}>Try again</button>
                    <a href="/" style={{ color: '#2dd4bf' }}>Go home</a>
                </div>
            </body>
        </html>
    );
}
