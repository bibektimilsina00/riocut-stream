'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Sparkles, TrendingUp, X, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMulti, getTrending } from '@/lib/tmdb';
import { SearchResult, MediaItem, TMDbResponse } from '@/lib/api/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSpinner from '@riocut/ui/components/LoadingSpinner';
import { useInfiniteScroll } from '@riocut/ui/hooks/useInfiniteScroll';

type MediaSearchResult = SearchResult & { media_type: 'movie' | 'tv' };

function detailHref(item: { id: number; media_type: 'movie' | 'tv' }) {
    return `/${item.media_type}/${item.id}`;
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlQuery = searchParams?.get('q') ?? '';

    const [input, setInput] = useState(urlQuery);
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Debounce input → effective query (300ms)
    const [activeQuery, setActiveQuery] = useState(urlQuery);
    useEffect(() => {
        const t = window.setTimeout(() => setActiveQuery(input.trim()), 300);
        return () => window.clearTimeout(t);
    }, [input]);

    // Sync URL with debounced query
    useEffect(() => {
        const current = searchParams?.get('q') ?? '';
        if (activeQuery === current) return;
        const sp = new URLSearchParams(searchParams?.toString() ?? '');
        if (activeQuery) sp.set('q', activeQuery);
        else sp.delete('q');
        const qs = sp.toString();
        router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
    }, [activeQuery, router, searchParams]);

    // Paginated results via useInfiniteQuery (single TMDB call per page)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery<TMDbResponse<SearchResult>>({
        queryKey: ['searchMulti', activeQuery],
        enabled: activeQuery.length > 0,
        initialPageParam: 1,
        queryFn: ({ pageParam }) => searchMulti(activeQuery, pageParam as number),
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 60_000,
    });

    const allResults = useMemo<MediaSearchResult[]>(() => {
        const out: MediaSearchResult[] = [];
        const seen = new Set<string>();
        for (const page of data?.pages ?? []) {
            for (const r of page.results) {
                if (r.media_type !== 'movie' && r.media_type !== 'tv') continue;
                const key = `${r.media_type}:${r.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                out.push(r as MediaSearchResult);
            }
        }
        return out;
    }, [data]);

    const totalResults = data?.pages[0]?.total_results ?? 0;

    // Trending (only when URL is empty / no query)
    useEffect(() => {
        if (activeQuery) return;
        if (trending.length > 0) return;
        let cancelled = false;
        (async () => {
            try {
                const items = await getTrending('all', 'day');
                if (!cancelled) setTrending(items.slice(0, 12));
            } catch (err) {
                console.error('Trending load failed', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [activeQuery, trending.length]);

    // Infinite scroll sentinel
    const sentinelRef = useInfiniteScroll({
        onLoadMore: () => fetchNextPage(),
        hasMore: !!hasNextPage,
        isLoading: isFetchingNextPage,
        rootMargin: '600px',
    });

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && allResults[0]) {
            e.preventDefault();
            router.push(detailHref(allResults[0]));
        } else if (e.key === 'Escape') {
            inputRef.current?.blur();
        }
    };

    const clearInput = () => {
        setInput('');
        setActiveQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-gray-950 page-transition">
            <Navigation />

            {/* Hero */}
            <div className="bg-gradient-to-b from-teal-950/20 to-gray-950 border-b border-gray-800">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-8 h-8 text-teal-400" />
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Search Riocut</h1>
                        </div>
                        <p className="text-gray-400 mb-6">Discover thousands of movies and TV shows</p>

                        <div className="relative">
                            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="search"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Search movies and TV shows..."
                                aria-label="Search movies and TV shows"
                                className="w-full bg-gray-800/50 backdrop-blur-sm text-white pl-14 pr-14 py-4 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all text-lg placeholder:text-gray-500"
                                autoFocus
                                autoComplete="off"
                            />
                            {input ? (
                                <button
                                    type="button"
                                    onClick={clearInput}
                                    aria-label="Clear search"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : null}

                        </div>
                    </div>
                </div>
            </div>

            {/* Results / empty / trending */}
            <main className="container mx-auto px-4 py-8">
                {activeQuery ? (
                    isLoading && allResults.length === 0 ? (
                        <ResultsSkeleton />
                    ) : allResults.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">
                                    Results for &ldquo;{activeQuery}&rdquo;
                                </h2>
                                <span className="text-gray-400 text-sm md:text-base flex items-center gap-2">
                                    {isFetching && !isFetchingNextPage ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    {totalResults.toLocaleString()} total
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in scale-in">
                                {allResults.map((item) => (
                                    <MediaCard
                                        key={`${item.media_type}-${item.id}`}
                                        item={item}
                                        type={item.media_type}
                                    />
                                ))}
                            </div>

                            {/* Sentinel + footer */}
                            <div ref={sentinelRef} aria-hidden className="h-12" />
                            {isFetchingNextPage ? (
                                <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Loading more…
                                </div>
                            ) : !hasNextPage && allResults.length > 0 ? (
                                <p className="text-center text-xs text-gray-500 py-4">End of results.</p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-center py-20 animate-in scale-in">
                            <div className="mb-6">
                                <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto">
                                    <SearchIcon className="w-12 h-12 text-gray-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                No results for &ldquo;{activeQuery}&rdquo;
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Try a different keyword or check the spelling.
                            </p>
                            <button
                                onClick={clearInput}
                                className="inline-flex items-center justify-center rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2 transition-colors"
                            >
                                Clear search
                            </button>
                        </div>
                    )
                ) : (
                    <div className="space-y-12 animate-in slide-in-from-bottom">
                        <div className="text-center py-12">
                            <div className="mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
                                    <SearchIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Start your search</h2>
                            <p className="text-gray-400 text-lg">Type above to find movies and TV shows.</p>
                        </div>

                        {trending.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-7 h-7 text-teal-500" />
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">Trending Now</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {trending.map((item) => {
                                        const mt = ('title' in item ? 'movie' : 'tv') as 'movie' | 'tv';
                                        return <MediaCard key={`${mt}-${item.id}`} item={item} type={mt} />;
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

function ResultsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-72 max-w-full bg-gray-800/60 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800/40 animate-pulse" />
                ))}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <SearchContent />
        </Suspense>
    );
}
