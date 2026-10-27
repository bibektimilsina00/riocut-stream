'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { TvStream } from '@riocut/services';
import { Button } from '@riocut/ui/components/ui/button';

type Mode = 'direct' | 'proxy';

export interface ChannelRef {
    id: string;
    name: string;
    logo: string | null;
    country: string | null;
}

function proxify(stream: TvStream): string {
    const p = new URLSearchParams({ url: stream.url });
    if (stream.referrer) p.set('ref', stream.referrer);
    if (stream.userAgent) p.set('ua', stream.userAgent);
    return `/api/stream-proxy?${p.toString()}`;
}

export default function TvPlayer({
    streams,
    channelName,
    channelRef,
    onAllFailed,
}: {
    streams: TvStream[];
    channelName: string;
    channelRef?: ChannelRef;
    onAllFailed?: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const recordedRef = useRef(false);
    const [streamIdx, setStreamIdx] = useState(0);
    const [mode, setMode] = useState<Mode>('direct');
    const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading');

    // Fallback chain: direct -> proxy -> next stream's direct -> ... -> failed.
    const advance = useCallback(() => {
        setStatus('loading');
        if (mode === 'direct') {
            setMode('proxy');
            return;
        }
        if (streamIdx < streams.length - 1) {
            setStreamIdx((i) => i + 1);
            setMode('direct');
            return;
        }
        setStatus('failed');
        onAllFailed?.();
    }, [mode, streamIdx, streams.length, onAllFailed]);

    useEffect(() => {
        const video = videoRef.current;
        const stream = streams[streamIdx];
        if (!video || !stream) return;

        const src = mode === 'direct' ? stream.url : proxify(stream);
        let cancelled = false;

        const onPlaying = () => {
            if (cancelled) return;
            setStatus('playing');
            if (!recordedRef.current && channelRef) {
                recordedRef.current = true;
                fetch('/api/tv/recent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: channelRef.id,
                        name: channelRef.name,
                        logo: channelRef.logo,
                        country: channelRef.country,
                    }),
                }).catch(() => {});
            }
        };
        video.addEventListener('playing', onPlaying);

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_e, data) => {
                if (data.fatal && !cancelled) {
                    hls.destroy();
                    advance();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS. Proxy mode still works: we serve a rewritten playlist.
            video.src = src;
            const onMeta = () => video.play().catch(() => {});
            const onErr = () => {
                if (!cancelled) advance();
            };
            video.addEventListener('loadedmetadata', onMeta, { once: true });
            video.addEventListener('error', onErr, { once: true });
        } else {
            setStatus('failed');
            onAllFailed?.();
        }

        return () => {
            cancelled = true;
            video.removeEventListener('playing', onPlaying);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [streamIdx, mode, streams, advance, onAllFailed, channelRef]);

    const retry = () => {
        setStreamIdx(0);
        setMode('direct');
        setStatus('loading');
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden border border-border">
            <video ref={videoRef} controls playsInline className="absolute inset-0 h-full w-full" />
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}
            {status === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="text-sm">{channelName} is offline right now.</p>
                    <Button size="sm" variant="secondary" onClick={retry}>
                        Try again
                    </Button>
                </div>
            )}
        </div>
    );
}
