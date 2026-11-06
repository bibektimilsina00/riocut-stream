'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

/**
 * Heartbeats presence for this match. Renders nothing unless the server
 * includes `count` in the response, which it does only for admins.
 */
export default function AdminViewerCount({ matchKey }: { matchKey: string }) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const cid = crypto.randomUUID();
        const beat = () =>
            fetch('/api/sports/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchKey, cid }),
            })
                .then((r) => r.json())
                .then((d) => setCount(typeof d.count === 'number' ? d.count : null))
                .catch(() => {});
        beat();
        const t = setInterval(beat, 20_000);
        return () => clearInterval(t);
    }, [matchKey]);

    if (count === null) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300" title="Live viewers (admin only)">
            <Eye className="h-3 w-3" /> {count}
        </span>
    );
}
