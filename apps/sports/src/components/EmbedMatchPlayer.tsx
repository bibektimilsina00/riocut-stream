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
 *  - OK_DWELL_MS: viewer stayed on a source (tab visible, no switch) → report
 *    'ok'. Rankings put sources other viewers stayed on first, unknown next,
 *    reported-bad last — so early viewers explore and later ones land on a
 *    working stream immediately. The UI shows every source the same.
 *
 * Layout:
 *  - Language filter tabs so a viewer of a French match doesn't have to
 *    scroll past 20 English chips.
 *  - Provider tag is a small dimmed pill on each chip.
 */

const LOAD_GRACE_MS = 12_000;
const STALL_MS = 60_000;
const OK_DWELL_MS = 3 * 60_000;
const LANG_ALL = '__all__';

function sourceKeyOf(s: MatchSource): string {
    return `${s.provider ?? ''}|${s.source ?? ''}|${s.id}|${s.streamNo}`;
}

function langOf(s: MatchSource): string {
    return (s.language || 'Other').trim();
}

export default function EmbedMatchPlayer({
    sources,
    title,
    matchKey,
}: {
    sources: MatchSource[];
    title?: string;
    /** "<category>:<id>" — required to enable sticky bad-source memory. */
    matchKey?: string;
}) {
    const effectiveMatchKey = matchKey ?? '';
    const { isBad, goodRank, markBad, reportToServer } = useBadSources(effectiveMatchKey);

    // Global order: proven-good (by crowd score) → unknown → bad. Bad ones are
    // silently deprioritized — never rendered differently.
    const globallyOrdered = useMemo(() => {
        if (!sources?.length) return [];
        const good: MatchSource[] = [];
        const unknown: MatchSource[] = [];
        const bad: MatchSource[] = [];
        for (const s of sources) {
            const key = sourceKeyOf(s);
            if (isBad(key)) bad.push(s);
            else if (goodRank(key) !== -1) good.push(s);
            else unknown.push(s);
        }
        good.sort((a, b) => goodRank(sourceKeyOf(a)) - goodRank(sourceKeyOf(b)));
        unknown.sort((a, b) => Number(!!b.hd) - Number(!!a.hd)); // untested: try HD first
        return [...good, ...unknown, ...bad];
    }, [sources, isBad, goodRank]);

    // Distinct language tabs, ordered by descending count so the most common
    // language for this match shows first.
    const languages = useMemo(() => {
        const counts = new Map<string, number>();
        for (const s of globallyOrdered) counts.set(langOf(s), (counts.get(langOf(s)) ?? 0) + 1);
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count }));
    }, [globallyOrdered]);

    const [lang, setLang] = useState<string>(LANG_ALL);
    // Tracked by source key, not index: the ranked list reorders when rankings
    // load or a source is marked bad, and an index would then point elsewhere.
    // null = "nothing picked yet" → follow the top-ranked source.
    const [pickedKey, setPickedKey] = useState<string | null>(null);
    const [failed, setFailed] = useState<Set<string>>(new Set());
    const [showStall, setShowStall] = useState(false);
    const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivity = useRef<number>(Date.now());
    const reportedOk = useRef<Set<string>>(new Set());

    // Visible sources under the current language filter, in ranked order.
    const visible = useMemo(
        () => (lang === LANG_ALL ? globallyOrdered : globallyOrdered.filter((s) => langOf(s) === lang)),
        [globallyOrdered, lang],
    );

    const active = visible.find((s) => sourceKeyOf(s) === pickedKey) ?? visible[0] ?? null;
    const activeIndex = active ? visible.indexOf(active) : -1;
    const activeSrc = active ? resolveEmbedUrl(active) : '';
    const activeKey = active ? sourceKeyOf(active) : '';

    const advance = useCallback((opts: { report: 'auto-failed' | 'stall' | null }) => {
        const nextFailed = new Set(failed).add(activeKey);
        setFailed(nextFailed);
        // Next untried source after the current one, wrapping around. Once all
        // were tried, manual "Try next" keeps cycling; auto-failover stops.
        const rotated = [...visible.slice(activeIndex + 1), ...visible.slice(0, activeIndex)];
        const candidate = rotated.find((s) => !nextFailed.has(sourceKeyOf(s))) ?? (opts.report ? undefined : rotated[0]);
        if (candidate) setPickedKey(sourceKeyOf(candidate));
        if (opts.report && active && effectiveMatchKey) {
            markBad(activeKey);
            reportToServer(activeKey, active.provider ?? 'unknown', opts.report);
        }
        setShowStall(false);
    }, [failed, activeIndex, visible, active, activeKey, effectiveMatchKey, markBad, reportToServer]);

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

    // Success signal: viewer stayed on this source → tell the ranker.
    useEffect(() => {
        if (!active || !effectiveMatchKey || reportedOk.current.has(activeKey)) return;
        const t = setTimeout(() => {
            if (document.visibilityState !== 'visible') return;
            reportedOk.current.add(activeKey);
            reportToServer(activeKey, active.provider ?? 'unknown', 'ok');
        }, OK_DWELL_MS);
        return () => clearTimeout(t);
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
                        onClick={() => setPickedKey(sourceKeyOf(s))}
                        className={
                            'text-xs px-3 py-1.5 rounded-md border transition-colors flex items-center gap-2 ' +
                            (i === activeIndex
                                ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                                : failed.has(sourceKeyOf(s))
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
