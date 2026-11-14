'use client';

import { useCallback, useEffect, useState } from 'react';

/** Languages viewers have confirmed per server for this title: { hi: ['vidlink-pro', ...] }. */
export function useTitleLanguages(type: 'movie' | 'tv', tmdbId: number) {
    const [verified, setVerified] = useState<Record<string, string[]>>({});
    useEffect(() => {
        if (!tmdbId) return;
        let off = false;
        fetch(`/api/video-providers/languages?type=${type}&tmdbId=${tmdbId}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (!off && d?.verified) setVerified(d.verified); })
            .catch(() => { });
        return () => { off = true; };
    }, [type, tmdbId]);

    const report = useCallback((lang: string, providerSlug: string, heard: boolean) => {
        void fetch('/api/video-providers/language-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaType: type, tmdbId, lang, providerSlug, heard }),
            keepalive: true,
        }).catch(() => { });
    }, [type, tmdbId]);

    return { verified, report };
}
