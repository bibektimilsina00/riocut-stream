'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Trash2, PlayCircle, Loader2, History, Film, Tv as TvIcon } from 'lucide-react';

interface CWItem {
    id: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    progress: number;
    season: number | null;
    episode: number | null;
    updatedAt: string;
}

export default function ContinueWatchingPage() {
    const [items, setItems] = useState<CWItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch('/api/continue-watching', { cache: 'no-store' });
            if (res.status === 401) {
                window.location.href = '/login?callbackUrl=/continue-watching';
                return;
            }
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Failed to load');
            } else {
                setItems(data.continueWatching ?? []);
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const remove = async (item: CWItem) => {
        setRemoving(item.id);
        try {
            const res = await fetch(
                `/api/continue-watching?mediaId=${item.mediaId}&mediaType=${item.mediaType}`,
                { method: 'DELETE' },
            );
            if (res.ok) {
                setItems((curr) => curr.filter((x) => x.id !== item.id));
            }
        } finally {
            setRemoving(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />
            <main className="container mx-auto px-4 py-10">
                <div className="flex items-center gap-3 mb-6">
                    <History className="w-7 h-7 text-teal-500" />
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Continue Watching</h1>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 text-sm">{error}</div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-12 text-center">
                        <PlayCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h2 className="text-lg font-semibold text-white mb-1">Nothing to resume</h2>
                        <p className="text-sm text-gray-400 mb-5">Start watching something and it&apos;ll show up here.</p>
                        <Link
                            href="/movies"
                            className="inline-flex items-center gap-2 rounded-full bg-teal-500 hover:bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors"
                        >
                            Browse Movies
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item) => (
                            <CWCard key={item.id} item={item} onRemove={remove} removing={removing === item.id} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

function CWCard({
    item,
    onRemove,
    removing,
}: {
    item: CWItem;
    onRemove: (i: CWItem) => void;
    removing: boolean;
}) {
    const href =
        item.mediaType === 'tv' && item.season && item.episode
            ? `/tv/${item.mediaId}/season/${item.season}/episode/${item.episode}`
            : `/${item.mediaType}/${item.mediaId}`;
    const pct = Math.max(0, Math.min(100, item.progress ?? 0));
    const poster = item.posterPath
        ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
        : '/placeholder-movie.jpg';

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg">
            <Link href={href} className="block">
                <div className="relative aspect-[2/3] bg-gray-950">
                    <Image
                        src={poster}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                        <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur px-2 py-0.5 text-[10px] uppercase font-semibold text-gray-100">
                        {item.mediaType === 'tv' ? <TvIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                        {item.mediaType === 'tv' ? `S${item.season ?? '?'} · E${item.episode ?? '?'}` : 'Movie'}
                    </span>
                </div>
            </Link>

            <button
                onClick={() => onRemove(item)}
                disabled={removing}
                aria-label="Remove from continue watching"
                className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/90 backdrop-blur p-1.5 rounded-full text-gray-200 transition-colors disabled:opacity-50"
            >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>

            <div className="p-3 space-y-2">
                <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                <div className="space-y-1">
                    <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-gray-500">{Math.round(pct)}% watched</p>
                </div>
            </div>
        </div>
    );
}
