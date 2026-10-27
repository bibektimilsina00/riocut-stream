'use client';

import { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import MediaCard from '@/components/catalog/MediaCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getWatchlist, removeFromWatchlist } from '@/lib/storage';
import { Button } from '@riocut/ui/components/ui/button';
import { MediaItem } from '@/lib/tmdb';
import { MediaGridSkeleton } from '@riocut/ui/components/ui/loading-skeletons';

export default function WatchlistPage() {
    const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWatchlist();
    }, []);

    const loadWatchlist = () => {
        setLoading(true);
        const data = getWatchlist();
        // Convert WatchlistItem[] to MediaItem[]
        const mediaItems: MediaItem[] = data.map(item => ({
            id: item.id,
            title: item.title || '',
            name: item.name || '',
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            overview: item.overview,
            release_date: item.release_date || '',
            first_air_date: item.first_air_date || '',
            vote_average: item.vote_average,
            genre_ids: item.genre_ids,
            media_type: item.media_type,
        }));
        setWatchlist(mediaItems);
        setLoading(false);
    };

    const handleRemove = (id: number, type: 'movie' | 'tv') => {
        removeFromWatchlist(id, type);
        loadWatchlist();
    };

    return (
        <div className="min-h-screen bg-gray-950 page-transition">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white" fill="white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            My Watchlist
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <MediaGridSkeleton title="" count={12} />
                ) : watchlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in scale-in">
                        {watchlist.map((item) => (
                            <div key={`${item.media_type}-${item.id}`} className="relative group">
                                <MediaCard item={item} type={item.media_type!} />

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(item.id, item.media_type!)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                                    title="Remove from watchlist"
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 animate-in scale-in">
                        <div className="mb-6">
                            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto">
                                <Heart className="w-12 h-12 text-gray-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Your Watchlist is Empty
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Start adding movies and TV shows you want to watch later
                        </p>
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="default"
                            size="lg"
                        >
                            Browse Content
                        </Button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
