'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, SkipForward } from 'lucide-react';
import { resolveEmbedUrl, type MatchSource } from '@/lib/sportsrc';
import { useBadSources } from '@/lib/hooks/useBadSources';

/**
 * Multi-source player with automatic + user-driven failover.
 *
 * Reliability signals (invisible to viewers — no strikethrough, no shame chips):
 *  - LOAD_GRACE_MS: iframe never signals a load → auto-advance + report.
 *  - STALL_MS: no postMessage from iframe + no user interaction → show a "stuck?"
 *    nudge. Viewer's click on the nudge's Try next → report + blacklist.
 *  - useBadSources reorders sources under the hood so bad ones are picked last
 *    on auto-failover, but the UI shows every source the same.
 *
 * Layout:
 *  - Language filter tabs so a viewer of a French match doesn't have to
 *    scroll past 20 English chips.
 *  - Within a language, HD sources are pulled to the front.
 *  - Provider tag is a small dimmed pill on each chip.
 */

const LOAD_GRACE_MS = 12_000;
const STALL_MS = 60_000;
const LANG_ALL = '__all__';

function sourceKeyOf(s: MatchSource): string {
    return `${s.provider ?? ''}|${s.source ?? ''}|${s.id}|${s.streamNo}`;
}

function langOf(s: MatchSource): string {
    return (s.language || 'Other').trim();
}

/** Order within a language group: HD first, then original order. */
function orderInGroup(list: MatchSource[]): MatchSource[] {
    return [...list].sort((a, b) => Number(!!b.hd) - Number(!!a.hd));
}

export default function EmbedMatchPlayer({
    sources,
    title,
    matchKey,
    initialIndex = 0,
}: {
    sources: MatchSource[];
    title?: string;
    /** "<category>:<id>" — required to enable sticky bad-source memory. */
    matchKey?: string;
    initialIndex?: number;
}) {
    const effectiveMatchKey = matchKey ?? '';
    const { isBad, markBad, reportToServer } = useBadSources(effectiveMatchKey);

    // Global order: good sources first, bad-ranked sources tail. Bad ones are
    // silently deprioritized — never rendered differently.
    const globallyOrdered = useMemo(() => {
        if (!sources?.length) return [];
        const good: MatchSource[] = [];
        const bad: MatchSource[] = [];
        for (const s of sources) (isBad(sourceKeyOf(s)) ? bad : good).push(s);
        return [...good, ...bad];
    }, [sources, isBad]);

    // Distinct language tabs, ordered by descending count so the most common
    // language for this match shows first.
    const languages = useMemo(() => {
        const counts = new Map<string, number>();
        for (const s of globallyOrdered) counts.set(langOf(s), (counts.get(langOf(s)) ?? 0) + 1);
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count }));
    }, [globallyOrdered]);

    const [lang, setLang] = useState<string>(LANG_ALL);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [showStall, setShowStall] = useState(false);
    const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivity = useRef<number>(Date.now());

    // Visible sources under the current language filter. HD first within.
    const visible = useMemo(() => {
        const filtered = lang === LANG_ALL ? globallyOrdered : globallyOrdered.filter((s) => langOf(s) === lang);
        return orderInGroup(filtered);
    }, [globallyOrdered, lang]);

    // Clamp activeIndex when the visible list changes (language filter, ranker).
    useEffect(() => {
        if (activeIndex >= visible.length) setActiveIndex(0);
    }, [visible.length, activeIndex]);

    const active = visible[activeIndex] ?? null;
    const activeSrc = active ? resolveEmbedUrl(active) : '';
    const activeKey = active ? sourceKeyOf(active) : '';

    const advance = useCallback((opts: { report: 'auto-failed' | 'stall' | null }) => {
        setFailed((prev) => {
            const next = new Set(prev).add(activeIndex);
            const candidate = visible.findIndex((_, i) => !next.has(i));
            if (candidate !== -1) setActiveIndex(candidate);
            return next;
        });
        if (opts.report && active && effectiveMatchKey) {
            markBad(activeKey);
            reportToServer(activeKey, active.provider ?? 'unknown', opts.report);
        }
        setShowStall(false);
    }, [activeIndex, visible, active, activeKey, effectiveMatchKey, markBad, reportToServer]);

    const autoAdvance = useCallback((reason: 'auto-failed' | 'stall') => advance({ report: reason }), [advance]);
    const manualSwitch = useCallback(() => advance({ report: null }), [advance]);

    // Initial-load watchdog.
    useEffect(() => {
        if (!active) return;
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(() => autoAdvance('auto-failed'), LOAD_GRACE_MS);
        return () => {
            if (loadTimer.current) clearTimeout(loadTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSrc]);

    // Stall watchdog + postMessage listener.
    useEffect(() => {
        if (!active) return;
        setShowStall(false);
        lastActivity.current = Date.now();

        function ping() {
            lastActivity.current = Date.now();
            setShowStall(false);
            armStall();
        }
        function armStall() {
            if (stallTimer.current) clearTimeout(stallTimer.current);
            stallTimer.current = setTimeout(() => setShowStall(true), STALL_MS);
        }
        function onMsg() { ping(); }
        function onInteract() { ping(); }

        window.addEventListener('message', onMsg);
        window.addEventListener('pointerdown', onInteract);
        window.addEventListener('keydown', onInteract);
        armStall();

        return () => {
            window.removeEventListener('message', onMsg);
            window.removeEventListener('pointerdown', onInteract);
            window.removeEventListener('keydown', onInteract);
            if (stallTimer.current) clearTimeout(stallTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSrc]);

    function onLoad() {
        if (loadTimer.current) clearTimeout(loadTimer.current);
    }

    if (!sources || sources.length === 0 || !active) {
        return (
            <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 bg-gray-900 text-gray-400 rounded-xl border border-gray-800">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">No stream available for this match.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                <iframe
                    key={activeSrc}
                    src={activeSrc}
                    title={title ?? 'Live stream'}
                    className="absolute inset-0 h-full w-full"
                    allow="encrypted-media; picture-in-picture; fullscreen; autoplay"
                    allowFullScreen
                    referrerPolicy="origin"
                    onLoad={onLoad}
                    onError={() => autoAdvance('auto-failed')}
                />

                {showStall && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/90 border border-yellow-500/40 px-4 py-2 shadow-xl">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-100 text-xs">Stream feels stuck?</span>
                        <button
                            onClick={() => autoAdvance('stall')}
                            className="ml-1 text-xs px-3 py-1 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 font-medium"
                        >
                            Try next
                        </button>
                        <button
                            onClick={() => setShowStall(false)}
                            className="text-yellow-300/60 hover:text-yellow-100 text-xs"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>

            {/* Header — Try next + counter */}
            <div className="flex flex-wrap items-center gap-2">
                {visible.length > 1 && (
                    <button
                        onClick={manualSwitch}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-teal-500/40 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20"
                    >
                        <SkipForward className="h-3.5 w-3.5" /> Try next
                    </button>
                )}
                <span className="ml-auto text-xs text-gray-500">
                    Source {activeIndex + 1} of {visible.length}
                    {lang !== LANG_ALL && <span className="text-gray-600"> · {lang}</span>}
                </span>
            </div>

            {/* Language filter tabs */}
            {languages.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-800 pb-2">
                    <button
                        onClick={() => setLang(LANG_ALL)}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${lang === LANG_ALL
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                            : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-200'
                            }`}
                    >
                        All <span className="text-gray-500 ml-1">{globallyOrdered.length}</span>
                    </button>
                    {languages.map(({ lang: L, count }) => (
                        <button
                            key={L}
                            onClick={() => setLang(L)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${lang === L
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-200'
                                }`}
                        >
                            {L} <span className="text-gray-500 ml-1">{count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Source chips */}
            <div className="flex flex-wrap items-center gap-2">
                {visible.map((s, i) => (
                    <button
                        key={sourceKeyOf(s)}
                        onClick={() => setActiveIndex(i)}
                        className={
                            'text-xs px-3 py-1.5 rounded-md border transition-colors flex items-center gap-2 ' +
                            (i === activeIndex
                                ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                                : failed.has(i)
                                    ? 'border-gray-800 bg-gray-900 text-gray-500 hover:text-gray-300'
                                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-teal-500/40 hover:text-teal-400')
                        }
                    >
                        <span>{s.source ?? `#${s.streamNo}`}</span>
                        {s.hd && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 leading-none">HD</span>
                        )}
                        {s.provider && (
                            <span className="text-[10px] text-gray-500">· {s.provider}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
