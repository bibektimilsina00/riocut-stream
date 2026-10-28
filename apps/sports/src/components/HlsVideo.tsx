'use client';

import { useEffect, useRef } from 'react';

/**
 * Our own player for sources that are a raw .m3u8 (Yono TV): no third-party
 * wrapper page, so no wrapper ads. Safari plays HLS natively; everyone else
 * gets hls.js, loaded on demand so iframe-only matches don't pay for it.
 */
/** Browsers block autoplay with sound; fall back to muted so the stream still starts. */
function start(video: HTMLVideoElement) {
    video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => { });
    });
}

export default function HlsVideo({ src, title, onReady, onFatal }: {
    src: string;
    title?: string;
    onReady: () => void;
    onFatal: () => void;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    // hls.js and the <video> element can both report the same failure; advance once.
    const failed = useRef(false);
    const fail = () => { if (!failed.current) { failed.current = true; onFatal(); } };

    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        let destroy = () => { };
        let cancelled = false;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            start(video);
        } else {
            import('hls.js').then(({ default: Hls }) => {
                if (cancelled || !Hls.isSupported()) { if (!cancelled) fail(); return; }
                const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => { onReady(); start(video); });
                hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) fail(); });
                destroy = () => hls.destroy();
            }).catch(fail);
        }
        return () => { cancelled = true; destroy(); };
        // Callbacks change identity every render; the stream only restarts on a new src.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    return (
        <video
            ref={ref}
            title={title}
            className="absolute inset-0 h-full w-full bg-black"
            controls
            autoPlay
            playsInline
            onLoadedData={onReady}
            onError={fail}
        />
    );
}
