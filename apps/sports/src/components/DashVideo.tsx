'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

/**
 * Our own player for DASH + ClearKey feeds (Yono's wtvplyrrr wrapper, FanCode).
 * The manifest is CORS-open, so we skip the wrapper page and show only video.
 */

/** `.../wtvplyrrr?manifest=X&keyid=K&key=V` → the stream it plays, else null. */
export function dashOf(url: string): { manifest: string; keys: Record<string, string> } | null {
    try {
        const u = new URL(url);
        const manifest = u.searchParams.get('manifest');
        if (!/\/wtvplyrrr$/.test(u.pathname) || !manifest) return null;
        const keyid = u.searchParams.get('keyid');
        const key = u.searchParams.get('key');
        return { manifest, keys: keyid && key ? { [keyid]: key } : {} };
    } catch {
        return null;
    }
}

const STALL_MS = 10_000;

/** 135 → "2:15", 3725 → "1:02:05" */
const clock = (sec: number) => {
    const s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

export default function DashVideo({ manifest, keys, title, onReady, onFatal, onStall }: {
    manifest: string;
    keys: Record<string, string>;
    title?: string;
    onReady: () => void;
    onFatal: () => void;
    onStall: (stalled: boolean) => void;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const playerRef = useRef<{ goToLive: () => void; seekRange: () => { start: number; end: number } } | null>(null);
    // DVR window (this feed keeps ~1h) and where we are in it.
    const [range, setRange] = useState({ start: 0, end: 0, cur: 0 });
    // Where the viewer is seeking to. Held from first touch until the video reports
    // `seeked`, so the thumb never snaps back to the old time mid-seek.
    const [target, setTarget] = useState<number | null>(null);
    const [scrubbing, setScrubbing] = useState(false);
    const bar = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const waiting = () => {
        if (!stallTimer.current) stallTimer.current = setTimeout(() => onStall(true), STALL_MS);
    };
    const playing = () => {
        if (stallTimer.current) { clearTimeout(stallTimer.current); stallTimer.current = null; }
        onStall(false);
    };
    useEffect(() => () => { if (stallTimer.current) clearTimeout(stallTimer.current); }, []);

    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        let destroy = () => { };
        let cancelled = false;
        import('shaka-player/dist/shaka-player.compiled').then(async ({ default: shaka }) => {
            if (cancelled) return;
            shaka.polyfill.installAll();
            if (!shaka.Player.isBrowserSupported()) return onFatal();
            const player = new shaka.Player();
            playerRef.current = player;
            destroy = () => { void player.destroy(); };
            await player.attach(video);
            player.configure({
                drm: { clearKeys: keys },
                manifest: {
                    // FanCode's MPD says "2s behind live" + "30s min buffer": impossible
                    // together, so Shaka stalls waiting for buffer that doesn't exist yet.
                    // Sit ~10s (≈5 segments) back and ignore the 30s rule instead.
                    defaultPresentationDelay: 10,
                    dash: { ignoreSuggestedPresentationDelay: true, ignoreMinBufferTime: true, autoCorrectDrift: true },
                },
                streaming: { rebufferingGoal: 2, bufferingGoal: 10 },
            });
            player.addEventListener('error', (e: Event) => {
                if ((e as unknown as { detail?: { severity?: number } }).detail?.severity === 2) onFatal();
            });
            await player.load(manifest);
            if (cancelled) return;
            onReady();
            video.play().catch(() => { video.muted = true; void video.play().catch(() => { }); });
        }).catch(() => { if (!cancelled) onFatal(); });
        return () => { cancelled = true; destroy(); };
        // Restart only on a new stream; callbacks change identity every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifest]);

    const video = () => ref.current!;
    const togglePlay = () => (video().paused ? void video().play() : video().pause());
    const fullscreen = () => {
        if (document.fullscreenElement) return void document.exitFullscreen();
        if (box.current?.requestFullscreen) return void box.current.requestFullscreen();
        (video() as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.(); // iOS
    };
    const btn = 'p-1.5 rounded hover:bg-white/15 text-white';
    // We sit ~10s behind the edge on purpose (presentation delay), so allow some slack.
    const LIVE_SLACK = 20;
    const span = range.end - range.start;
    const pos = target ?? range.cur;
    const behind = Math.max(0, range.end - pos);
    const atLive = behind < LIVE_SLACK;
    // At live, pin the fill to 100% instead of letting it wobble as the window slides.
    const pct = atLive ? 100 : Math.min(100, Math.max(0, ((pos - range.start) / span) * 100));

    const timeAt = (clientX: number) => {
        const r = bar.current!.getBoundingClientRect();
        return range.start + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * span;
    };
    const seekTo = (t: number) => {
        if (range.end - t < LIVE_SLACK) {
            // Seeking right to the edge outruns the buffer; let Shaka pick the live point.
            setTarget(null);
            playerRef.current?.goToLive();
        } else {
            setTarget(t);
            video().currentTime = t;
        }
        void video().play();
    };

    // Native controls show a clock counted from the channel's 2025 start
    // ("14178:51:45"), so we draw our own: DVR seek bar, play, sound, LIVE, fullscreen.
    return (
        <div ref={box} className="group absolute inset-0 bg-black">
            <video
                ref={ref}
                title={title}
                className="h-full w-full"
                autoPlay
                playsInline
                onClick={togglePlay}
                onWaiting={waiting}
                onPlaying={playing}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
                onSeeked={() => { if (!scrubbing) setTarget(null); }}
                onTimeUpdate={(e) => {
                    const r = playerRef.current?.seekRange();
                    if (r) setRange({ start: r.start, end: r.end, cur: e.currentTarget.currentTime });
                }}
            />
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity ${paused || scrubbing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                {span > 0 && (
                    <div
                        ref={bar}
                        role="slider"
                        tabIndex={0}
                        aria-label="Seek"
                        aria-valuemin={0}
                        aria-valuemax={Math.round(span)}
                        aria-valuenow={Math.round(span - behind)}
                        aria-valuetext={atLive ? 'Live' : `${clock(behind)} behind live`}
                        className="group/bar relative mb-1 flex h-4 cursor-pointer touch-none items-center outline-none"
                        onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setScrubbing(true);
                            setTarget(timeAt(e.clientX));
                        }}
                        onPointerMove={(e) => { if (scrubbing) setTarget(timeAt(e.clientX)); }}
                        onPointerUp={(e) => { setScrubbing(false); seekTo(timeAt(e.clientX)); }}
                        onPointerCancel={() => { setScrubbing(false); setTarget(null); }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') seekTo(Math.max(range.start, pos - 10));
                            else if (e.key === 'ArrowRight') seekTo(pos + 10);
                            else return;
                            e.preventDefault();
                        }}
                    >
                        <div className={`relative w-full rounded-full bg-white/25 transition-[height] duration-150 ${scrubbing ? 'h-1.5' : 'h-1 group-hover/bar:h-1.5'}`}>
                            <div className="absolute inset-y-0 left-0 rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                            <div
                                className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-md shadow-black/40 ring-2 ring-white/90 transition-transform duration-150 group-focus-visible/bar:scale-100 ${scrubbing ? 'scale-100' : 'scale-0 group-hover/bar:scale-100'}`}
                                style={{ left: `${pct}%` }}
                            />
                        </div>
                        {scrubbing && (
                            <div
                                className="pointer-events-none absolute bottom-5 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white"
                                style={{ left: `${pct}%` }}
                            >
                                {atLive ? 'LIVE' : `−${clock(behind)}`}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button className={btn} onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </button>
                    <button className={btn} onClick={() => { video().muted = !video().muted; }} aria-label={muted ? 'Unmute' : 'Mute'}>
                        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <button
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold tracking-wide text-white hover:bg-white/15"
                        onClick={() => { setTarget(null); playerRef.current?.goToLive(); void video().play(); }}
                        aria-label="Jump to live"
                    >
                        <span className={`h-2 w-2 rounded-full ${atLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} /> LIVE
                    </button>
                    {!atLive && <span className="text-xs tabular-nums text-gray-300">−{clock(behind)}</span>}
                    <button className={`${btn} ml-auto`} onClick={fullscreen} aria-label="Fullscreen">
                        <Maximize className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
