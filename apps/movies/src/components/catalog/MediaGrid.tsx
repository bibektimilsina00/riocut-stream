'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import MediaCard from './MediaCard';
import { BaseMovie, BaseTVShow } from '@/lib/api/tmdb';

interface MediaGridProps {
    initialItems: (BaseMovie | BaseTVShow)[];
    type: 'movie' | 'tv';
    fetchMore: (page: number) => Promise<{ results: (BaseMovie | BaseTVShow)[]; page: number; total_pages: number }>;
}

export default function MediaGrid({ initialItems, type, fetchMore }: MediaGridProps) {
    const [items, setItems] = useState<(BaseMovie | BaseTVShow)[]>(initialItems);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const { ref, inView } = useInView({
        threshold: 0.1,
    });

    const loadMore = useCallback(async () => {
        setLoading(true);
        try {
            const nextPage = page + 1;
            const data = await fetchMore(nextPage);

            if (data.results.length > 0) {
                setItems((prev) => [...prev, ...data.results]);
                setPage(nextPage);
                setHasMore(nextPage < data.total_pages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            setLoading(false);
        }
    }, [page, fetchMore]);

    useEffect(() => {
        if (inView && !loading && hasMore) {
            loadMore();
        }
    }, [inView, loading, hasMore, loadMore]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((item) => (
                    <MediaCard key={item.id} item={item} type={type} />
                ))}
            </div>

            {/* Loading indicator */}
            {hasMore && (
                <div ref={ref} className="flex justify-center py-8">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-8 w-8 animate-spin text-teal-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span className="text-gray-400">Loading more...</span>
                        </div>
                    ) : (
                        <div className="h-8 w-8"></div>
                    )}
                </div>
            )}

            {!hasMore && items.length > 0 && (
                <div className="text-center text-gray-500 py-8">
                    You&apos;ve reached the end!
                </div>
            )}
        </div>
    );
}
