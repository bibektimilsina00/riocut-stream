'use client';

import { useState, useMemo, useEffect } from 'react';
import { Tv, TrendingUp, Star, Calendar, Filter } from 'lucide-react';

import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@riocut/ui/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
    useTrending,
    usePopular,
    useTopRated,
    useGenres,
    useDiscoverByGenre
} from '@/lib/hooks/useTMDb';
import { MediaItem } from '@/lib/api/tmdb';
import Pagination from '@riocut/ui/components/ui/pagination';
import { useInfiniteScroll } from '@riocut/ui/hooks/useInfiniteScroll';

export default function TVShowsPage() {
    const [filter, setFilter] = useState<'popular' | 'top_rated' | 'trending'>('popular');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [allShows, setAllShows] = useState<MediaItem[]>([]);

    // Fetch genres
    const { data: genres = [], isLoading: genresLoading } = useGenres('tv');

    // Fetch TV shows
    const trendingQuery = useTrending('tv', 'week', { enabled: filter === 'trending' && !selectedGenre });
    const popularQuery = usePopular('tv', page, { enabled: filter === 'popular' && !selectedGenre });
    const topRatedQuery = useTopRated('tv', page, { enabled: filter === 'top_rated' && !selectedGenre });
    const discoverQuery = useDiscoverByGenre('tv', selectedGenre!, page, { enabled: !!selectedGenre });

    const activeQuery = selectedGenre
        ? discoverQuery
        : filter === 'trending'
            ? trendingQuery
            : filter === 'popular'
                ? popularQuery
                : topRatedQuery;

    const { data, isLoading, isError, error } = activeQuery;

    // Detect screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768); // md breakpoint
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Extract shows
    const shows = useMemo(() => {
        if (!data) return [];

        if (filter === 'trending' && !selectedGenre) return Array.isArray(data) ? data : [];

        return Array.isArray(data) ? data : (data.results || []);
    }, [data, filter, selectedGenre]);

    // Accumulate shows for infinite scroll on small screens
    useEffect(() => {
        if (isSmallScreen && shows.length > 0) {
            if (page === 1) {
                setAllShows(shows);
            } else {
                setAllShows(prev => [...prev, ...shows]);
            }
        }
    }, [shows, page, isSmallScreen]);

    const currentPage = data && 'page' in data ? data.page : 1;
    const totalPages = data && 'total_pages' in data ? data.total_pages : 1;

    const handleFilterChange = (newFilter: 'popular' | 'top_rated' | 'trending') => {
        setFilter(newFilter);
        setPage(1);
        setAllShows([]);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenreChange = (genreId: number | null) => {
        setSelectedGenre(genreId);
        setPage(1);
        setAllShows([]);
        if (filter === 'trending' && genreId !== null) setFilter('popular');
    };

    // Infinite scroll handler
    const handleLoadMore = () => {
        if (!isLoading && currentPage < totalPages) {
            setPage(prev => prev + 1);
        }
    };

    const sentinelRef = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore: currentPage < totalPages && filter !== 'trending',
        isLoading,
    });

    const isTrendingDisabled = !!selectedGenre;

    const getPageTitle = () => {
        if (filter === 'popular') return 'Popular TV Shows';
        if (filter === 'top_rated') return 'Top Rated TV Shows';
        if (filter === 'trending') return 'Trending TV Shows';
        return '';
    };

    const getSelectedGenreName = () => {
        if (selectedGenre) return genres.find(g => g.id === selectedGenre)?.name;
    };

    return (
        <div className="min-h-screen bg-gray-950 page-transition">
            <Navigation />

            {/* NEW Filters - Sticky header */}
            <div className="sticky top-[73px] z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur-lg shadow-xl shadow-gray-950/20">
                <div className="container mx-auto px-3 md:px-4">

                    {/* Main Filter Tabs (Popular, Top Rated, Trending) */}
                    <div className="flex border-b border-gray-800">
                        {[
                            { key: 'popular', label: 'Popular', icon: Star },
                            { key: 'top_rated', label: 'Top Rated', icon: Calendar },
                            { key: 'trending', label: 'Trending', icon: TrendingUp },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => handleFilterChange(key as typeof filter)}
                                disabled={isLoading || (key === 'trending' && isTrendingDisabled)}
                                title={key === 'trending' && isTrendingDisabled ? 'Trending not available with genre filter' : ''}
                                className={`
                                    flex items-center gap-2 py-3 px-6 text-sm font-medium transition-colors duration-200 
                                    ${filter === key
                                        ? 'text-white border-b-2 border-teal-500' // Active tab style
                                        : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600' // Inactive tab style
                                    }
                                    ${(key === 'trending' && isTrendingDisabled) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Genre Filter Scroll Row */}
                    <div className="py-3 flex items-center gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
                        <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />

                        {/* All Genres Button */}
                        <Button
                            onClick={() => handleGenreChange(null)}
                            size="sm"
                            disabled={genresLoading || isLoading}
                            className={`rounded-full px-4 py-1 text-sm flex-shrink-0 transition-all duration-200 
                                ${selectedGenre === null
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20 hover:bg-teal-500' // Active genre style
                                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' // Inactive genre style
                                }
                            `}
                        >
                            All Genres
                        </Button>

                        {/* Individual Genre Buttons */}
                        {genres.map((genre) => (
                            <Button
                                key={genre.id}
                                onClick={() => handleGenreChange(genre.id)}
                                size="sm"
                                disabled={genresLoading || isLoading}
                                className={`rounded-full px-4 py-1 text-sm flex-shrink-0 transition-all duration-200 
                                    ${selectedGenre === genre.id
                                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20 hover:bg-teal-500'
                                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                                    }
                                `}
                            >
                                {genre.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Page Title & Status */}
                <div className='flex flex-wrap gap-x-4 gap-y-2 items-center mb-8'>
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                        <Tv className="w-8 h-8 text-teal-500" />
                        {getPageTitle()}
                    </h1>
                    {selectedGenre && (
                        <>
                            <span className='text-white text-3xl hidden md:inline'> | </span>
                            <p className="text-teal-500 text-2xl font-semibold">
                                {getSelectedGenreName()}
                            </p>
                        </>
                    )}
                    {!isLoading && (isSmallScreen ? allShows : shows).length > 0 && 'total_results' in (data || {}) && (
                        <span className="text-gray-400 text-lg ml-auto">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <span className="font-semibold">{(data as any).total_results?.toLocaleString()}</span> shows
                        </span>
                    )}
                </div>

                {isError && (
                    <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Failed to load TV shows</p>
                        <p className="text-sm mt-1">
                            {error instanceof Error ? error.message : 'Please try again later'}
                        </p>
                    </div>
                )}

                {/* Initial Loading State */}
                {isLoading && (isSmallScreen ? allShows.length === 0 : true) ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
                        <p className="text-gray-400">Loading TV shows...</p>
                    </div>
                ) : (
                    <>
                        {(isSmallScreen ? allShows : shows).length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(isSmallScreen ? allShows : shows).map((show: any, index: number) => (
                                        <MediaCard
                                            key={`${show.id}-${show.name}-${index}`}
                                            item={show}
                                            type="tv"
                                        />
                                    ))}
                                </div>

                                {/* Infinite Scroll Sentinel for Small Screens */}
                                {isSmallScreen && filter !== 'trending' && currentPage < totalPages && (
                                    <div ref={sentinelRef} className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                                    </div>
                                )}

                                {/* Pagination for larger screens only */}
                                {!isSmallScreen && (filter !== 'trending') && totalPages > 1 && (
                                    <div className='mt-12'>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            isLoading={isLoading}
                                            showFirstLast={true}
                                            maxVisiblePages={7}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="text-gray-500 text-6xl mb-4">📺</div>
                                <p className="text-gray-400 text-lg">No TV shows found</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Try changing your filters
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}