'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Counts = { ok: number; bad: number };
type Rankings = { title: Record<string, Counts>; global: Record<string, Counts> };
export type ProviderFlag = 'title-best' | 'reliable' | 'unreliable' | null;

const K = 4;              // prior strength: title data needs ~4 reports to outweigh the global record
const OK_DWELL_MS = 2 * 60_000;   // stayed this long → worked
const BAIL_MS = 45_000;           // left before this → probably didn't work
const TIMEOUT_MS = 15_000;        // iframe never fired onLoad

/**
 * Ranks providers per title: Bayesian blend of this title's record (did viewers
 * stay or bail?) over the provider's global record for the media type, so a
 * server can be great for one movie and bad for another. Unknown = 0.5, so new
 * servers still get explored. Admin sortOrder breaks ties (stable sort).
 *
 * Signals (cross-origin iframes give no playback info, so we infer):
 *  - ok: viewer stayed on a server >= OK_DWELL_MS (tab visible)
 *  - bailed: viewer left a server within BAIL_MS — only recorded once they then
 *    settle on another one ('ok'), so casual server-hopping isn't counted as failure
 *  - timeout: iframe onLoad never fired
 * `ranked` is empty until rankings resolve so the player doesn't swap servers mid-load.
 */
// Servers tagged for the chosen audio language first, untagged (unknown/multi) next,
// servers tagged only for other languages last.
const tier = (p: { languages?: string[] }, lang?: string) =>
    !lang || !p.languages?.length ? 1 : p.languages.includes(lang) ? 2 : 0;

export function useProviderRanking<P extends { slug: string; languages?: string[] }>(
    providers: P[],
    type: 'movie' | 'tv',
    tmdbId: number,
    activeIndex: number,
    loaded: boolean,
    lang?: string,
) {
    const [data, setData] = useState<Rankings | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!tmdbId) return;
        let off = false;
        setDone(false);
        fetch(`/api/video-providers/rankings?type=${type}&tmdbId=${tmdbId}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (!off) setData(d); })
            .catch(() => { })
            .finally(() => { if (!off) setDone(true); });
        return () => { off = true; };
    }, [type, tmdbId]);

    const stats = useMemo(() => {
        const out: Record<string, { score: number; titleN: number; n: number }> = {};
        for (const p of providers) {
            const g = data?.global[p.slug] ?? { ok: 0, bad: 0 };
            const t = data?.title[p.slug] ?? { ok: 0, bad: 0 };
            const prior = (g.ok + 1) / (g.ok + g.bad + 2);
            const titleN = t.ok + t.bad;
            out[p.slug] = { score: (t.ok + K * prior) / (titleN + K), titleN, n: titleN + g.ok + g.bad };
        }
        return out;
    }, [providers, data]);

    const ranked = useMemo(
        () => (done ? [...providers].sort((a, b) => tier(b, lang) - tier(a, lang) || stats[b.slug].score - stats[a.slug].score) : []),
        [providers, stats, done, lang],
    );

    const activeSlug = ranked[activeIndex]?.slug;

    const flagOf = useCallback((slug: string): ProviderFlag => {
        const s = stats[slug];
        if (!s || s.n < 10) return null;
        if (s.score >= 0.7) return s.titleN >= 3 ? 'title-best' : 'reliable';
        if (s.score <= 0.35) return 'unreliable';
        return null;
    }, [stats]);

    // ---- reporting ----
    const loadedRef = useRef(loaded);
    loadedRef.current = loaded;
    const pendingBails = useRef<string[]>([]);
    const send = useCallback((reports: { providerSlug: string; reason: string }[]) => {
        if (!reports.length || !tmdbId) return;
        void fetch('/api/video-providers/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reports: reports.map((r) => ({ ...r, mediaType: type, tmdbId })) }),
            keepalive: true,
        }).catch(() => { });
    }, [type, tmdbId]);

    // Per active server: timeout / ok / bail watchers. Reset when the title changes too.
    useEffect(() => {
        if (!activeSlug || !done) return;
        const started = Date.now();
        const timeout = setTimeout(() => { if (!loadedRef.current) send([{ providerSlug: activeSlug, reason: 'timeout' }]); }, TIMEOUT_MS);
        const ok = setTimeout(() => {
            if (document.visibilityState !== 'visible') return;
            send([{ providerSlug: activeSlug, reason: 'ok' }, ...pendingBails.current.map((s) => ({ providerSlug: s, reason: 'bailed' }))]);
            pendingBails.current = [];
        }, OK_DWELL_MS);
        return () => {
            clearTimeout(timeout);
            clearTimeout(ok);
            if (Date.now() - started < BAIL_MS && !pendingBails.current.includes(activeSlug)) pendingBails.current.push(activeSlug);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSlug, tmdbId, done]);

    return { ranked, flagOf };
}
