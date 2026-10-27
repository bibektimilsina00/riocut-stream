'use client';

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Info, TrendingUp, Star, Tv, Film, Clock } from 'lucide-react';

// Note: For client components, SEO metadata is handled in layout.tsx
// This component focuses on structured data and content optimization

import {
  useTrending,
  usePopular,
  useTopRated
} from '@/lib/hooks/useTMDb';
import { getImageUrl, formatVoteAverage } from '@/lib/api/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@riocut/ui/components/ui/button';
import { PlayButton } from '@riocut/ui/components/ui/play-button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HomePageSEO from '@/components/HomePageSEO';
import FAQSchema from '@/components/FAQSchema';
import { getContinueWatching } from '@/lib/storage';
import { HomePageSkeleton, MediaGridSkeleton } from '@riocut/ui/components/ui/loading-skeletons';
import { ErrorState } from '@riocut/ui/components/ui/error-states';
import type { MediaItem } from '@/lib/api/tmdb';
import type { ContinueWatchingItem } from '@/lib/storage';

/**
 * Reusable section component with icon and title
 * Memoized to prevent unnecessary re-renders
 */
const Section = memo(function Section({
  title,
  icon,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-teal-500">{icon}</div>}
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
});

/**
 * Hero section component with trending content
 * Memoized to prevent re-renders when media doesn't change
 */
const HeroSection = memo(function HeroSection({ media }: { media: MediaItem | undefined }) {
  if (!media) return null;

  const heroTitle = 'title' in media ? media.title : media.name;
  const heroType = media.media_type || ('title' in media ? 'movie' : 'tv');

  return (
    <section className="relative h-[70vh] md:h-[80vh] flex items-end page-transition">
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(media.backdrop_path || media.poster_path, 'original')}
          alt={heroTitle || 'Hero'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pb-16 md:pb-24 z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <span className="text-teal-400 font-semibold uppercase text-sm">Trending Now</span>
          </div>

          <h1 className="mb-4 max-w-2xl text-5xl font-bold text-white md:text-6xl">{heroTitle}</h1>
          <p className="mb-6 max-w-2xl text-lg text-gray-200 line-clamp-3">{media.overview}</p>

          <div className="flex flex-wrap gap-4 animate-in">
            <Link href={`/${heroType}/${media.id}/watch`} prefetch={true}>
              <PlayButton className="btn-press" />
            </Link>
            <Link href={`/${heroType}/${media.id}`} prefetch={true}>
              <Button variant="outline" size="lg" className="gap-2 btn-press">
                <Info className="w-5 h-5" />
                More Info
              </Button>
            </Link>

            {media.vote_average > 0 && (
              <div className="ml-4 inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{formatVoteAverage(media.vote_average)}</span>
                <span className="text-gray-300 text-sm uppercase">{heroType === 'movie' ? 'Movie' : 'TV Show'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

/**
 * Media grid component with error handling and loading states
 * Memoized to prevent re-renders when props don't change
 */
const MediaGrid = memo(function MediaGrid({
  data,
  isLoading,
  error,
  title,
  icon,
  type,
  onRetry
}: {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  title: string;
  icon: React.ReactNode;
  type: 'movie' | 'tv';
  onRetry: () => void;
}) {
  if (isLoading) {
    return <MediaGridSkeleton title={title} />;
  }

  if (error) {
    return (
      <Section title={title} icon={icon}>
        <ErrorState
          title="Failed to load content"
          message="We couldn't load this section. Please try again."
          onRetry={onRetry}
        />
      </Section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Section title={title} icon={icon}>
        <div className="text-center py-12">
          <p className="text-gray-400">No content available</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={title} icon={icon}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.slice(0, 12).map((media) => (
          <MediaCard key={media.id} item={media} type={type} />
        ))}
      </div>
    </Section>
  );
});

/**
 * Main homepage component with React Query integration
 */
export default function HomePage() {
  // Continue watching state (local storage)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  // React Query hooks for different content sections
  const trendingAll = useTrending('all', 'day');
  const trendingMovies = useTrending('movie', 'week');
  const trendingTV = useTrending('tv', 'week');
  const popularMovies = usePopular('movie', 1);
  const topRatedMovies = useTopRated('movie', 1);

  // Load continue watching from localStorage
  useEffect(() => {
    const continueData = getContinueWatching();
    setContinueWatching(continueData);
  }, []);

  // Memoize retry callbacks to prevent re-creating functions
  const handleTrendingMoviesRetry = useCallback(() => trendingMovies.refetch(), [trendingMovies]);
  const handleTrendingTVRetry = useCallback(() => trendingTV.refetch(), [trendingTV]);
  const handlePopularMoviesRetry = useCallback(() => popularMovies.refetch(), [popularMovies]);
  const handleTopRatedMoviesRetry = useCallback(() => topRatedMovies.refetch(), [topRatedMovies]);

  // Memoize hero media to prevent unnecessary recalculations
  const heroMedia = useMemo(() => trendingAll.data?.[0], [trendingAll.data]);

  // Memoize continue watching slice
  const continueWatchingSlice = useMemo(() => continueWatching.slice(0, 10), [continueWatching]);

  // Show initial loading state when all critical data is loading
  const isInitialLoading = trendingAll.isLoading && trendingMovies.isLoading && trendingTV.isLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <HomePageSkeleton />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* SEO - Structured Data for Trending Content */}
      <HomePageSEO trendingItems={trendingAll.data} />
      {/* SEO - FAQ Schema */}
      <FAQSchema />

      <Navigation />

      {/* Hero Section */}
      <HeroSection media={heroMedia} />

      {/* Content Sections */}
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <Section title="Continue Watching" icon={<Clock className="w-6 h-6" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {continueWatchingSlice.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative">
                  <MediaCard item={item} type={item.media_type} />
                  {/* Progress Bar */}
                  {item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Trending Movies */}
        <MediaGrid
          data={trendingMovies.data}
          isLoading={trendingMovies.isLoading}
          error={trendingMovies.error}
          title="Trending Movies"
          icon={<TrendingUp className="w-6 h-6" />}
          type="movie"
          onRetry={handleTrendingMoviesRetry}
        />

        {/* Trending TV Shows */}
        <MediaGrid
          data={trendingTV.data}
          isLoading={trendingTV.isLoading}
          error={trendingTV.error}
          title="Trending TV Shows"
          icon={<Tv className="w-6 h-6" />}
          type="tv"
          onRetry={handleTrendingTVRetry}
        />

        {/* Popular Movies */}
        <MediaGrid
          data={popularMovies.data?.results}
          isLoading={popularMovies.isLoading}
          error={popularMovies.error}
          title="Popular Movies"
          icon={<Film className="w-6 h-6" />}
          type="movie"
          onRetry={handlePopularMoviesRetry}
        />

        {/* Top Rated Movies */}
        <MediaGrid
          data={topRatedMovies.data?.results}
          isLoading={topRatedMovies.isLoading}
          error={topRatedMovies.error}
          title="Top Rated Movies"
          icon={<Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}
          type="movie"
          onRetry={handleTopRatedMoviesRetry}
        />
      </main>

      <Footer />
    </div>
  );
}