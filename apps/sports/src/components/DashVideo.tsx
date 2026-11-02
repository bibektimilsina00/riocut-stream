'use client';

import { useEffect, useRef } from 'react';

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

export default function DashVideo({ manifest, keys, title, onReady, onFatal, onStall }: {
    manifest: string;
    keys: Record<string, string>;
    title?: string;
    onReady: () => void;
    onFatal: () => void;
    onStall: (stalled: boolean) => void;
}) {
    const ref = useRef<HTMLVideoElement>(null);
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
            destroy = () => { void player.destroy(); };
            await player.attach(video);
            player.configure({ drm: { clearKeys: keys } });
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

    return (
        <video
            ref={ref}
            title={title}
            className="absolute inset-0 h-full w-full bg-black"
            controls
            autoPlay
            playsInline
            onWaiting={waiting}
            onPlaying={playing}
        />
    );
}
