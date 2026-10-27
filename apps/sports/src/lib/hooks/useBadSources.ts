'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'bad-sources:v1';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type LocalStore = Record<string, number>; // `${matchKey}|${sourceKey}` → expiresAt

function safeParse(raw: string | null): LocalStore {
    try {
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed as LocalStore : {};
    } catch {
        return {};
    }
}

function pruneExpired(store: LocalStore, now: number): LocalStore {
    let changed = false;
    const out: LocalStore = {};
    for (const [k, exp] of Object.entries(store)) {
        if (exp > now) out[k] = exp;
        else changed = true;
    }
    return changed ? out : store;
}

/**
 * Sticky bad-source memory. Combines local storage (per-user, 7d TTL) with a
 * server-side ranking (global, 24h window). A source is "bad" for this user
 * if EITHER signal says so.
 */
export function useBadSources(matchKey: string) {
    const [local, setLocal] = useState<LocalStore>({});
    const [globalBad, setGlobalBad] = useState<Set<string>>(new Set());

    // Hydrate local + fetch global rankings on mount / matchKey change.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const now = Date.now();
        const pruned = pruneExpired(safeParse(raw), now);
        setLocal(pruned);
        if (raw && JSON.stringify(pruned) !== raw) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        }

        if (!matchKey) return;
        let cancelled = false;
        fetch(`/api/sports/source-rankings?matchKey=${encodeURIComponent(matchKey)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (cancelled || !d?.badSources) return;
                setGlobalBad(new Set<string>(d.badSources));
            })
            .catch(() => { /* silently ignore — non-critical */ });
        return () => { cancelled = true; };
    }, [matchKey]);

    const isBad = useCallback((sourceKey: string): boolean => {
        if (!sourceKey) return false;
        if (globalBad.has(sourceKey)) return true;
        const composite = `${matchKey}|${sourceKey}`;
        return (local[composite] ?? 0) > Date.now();
    }, [globalBad, local, matchKey]);

    const markBad = useCallback((sourceKey: string) => {
        if (typeof window === 'undefined' || !sourceKey) return;
        const composite = `${matchKey}|${sourceKey}`;
        const next: LocalStore = { ...local, [composite]: Date.now() + TTL_MS };
        setLocal(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch { /* quota / private-mode — ignore */ }
    }, [local, matchKey]);

    const reportToServer = useCallback((sourceKey: string, providerName: string, reason: 'auto-failed' | 'user-report' | 'stall') => {
        // Fire-and-forget. Never blocks UI.
        if (typeof window === 'undefined') return;
        void fetch('/api/sports/source-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchKey, sourceKey, providerName, reason }),
            keepalive: true,
        }).catch(() => { /* ignore */ });
    }, [matchKey]);

    return { isBad, markBad, reportToServer };
}
