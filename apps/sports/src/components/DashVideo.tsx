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
    // DVR window (this feed keeps ~1h) and where we are in it; drag holds the thumb while scrubbing.
    const [range, setRange] = useState({ start: 0, end: 0, cur: 0 });
    const [drag, setDrag] = useState<number | null>(null);
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
    const commitSeek = () => {
        if (drag !== null) video().currentTime = drag;
        setDrag(null);
    };
    // We sit ~10s behind the edge on purpose (presentation delay), so allow some slack.
    const behind = Math.max(0, range.end - (drag ?? range.cur));
    const atLive = behind < 20;

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
                onTimeUpdate={(e) => {
                    const r = playerRef.current?.seekRange();
                    if (r) setRange({ start: r.start, end: r.end, cur: e.currentTarget.currentTime });
                }}
            />
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity ${paused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                {range.end > range.start && (
                    <input
                        type="range"
                        aria-label="Seek"
                        className="mb-1 block w-full cursor-pointer accent-red-500"
                        min={range.start}
                        max={range.end}
                        step={1}
                        value={drag ?? range.cur}
                        onChange={(e) => setDrag(Number(e.currentTarget.value))}
                        onPointerUp={commitSeek}
                        onKeyUp={commitSeek}
                    />
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
                    onClick={() => { playerRef.current?.goToLive(); void video().play(); }}
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
