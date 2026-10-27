'use client';

import { useEffect, useState, useMemo, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Play, ArrowLeft, Star, Calendar, Clock, Heart, Share2, Users, Check } from 'lucide-react';

import { useMovieDetails } from '@/lib/hooks/useTMDb';
import { getImageUrl, formatVoteAverage, formatRuntime, CastMember, BaseMovie } from '@/lib/api/tmdb';
import { Button } from '@riocut/ui/components/ui/button';
import { PlayButton } from '@riocut/ui/components/ui/play-button';
import MediaCard from '@/components/catalog/MediaCard';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, addToHistory } from '@/lib/storage';
import { getMovieEmbedUrl } from '@/lib/videoSources';
import WatchTogetherModal from '@riocut/realtime/components/WatchTogetherModal';
import Breadcrumb from '@/components/Breadcrumb';

/**
 * Movie details page component
 */
export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.id as string);
  const { status } = useSession();

  // React Query hook for movie details
  const {
    data: movie,
    isLoading,
    error,
    refetch
  } = useMovieDetails(movieId);

  // Local state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showWatchTogether, setShowWatchTogether] = useState(false);
  const [isNavigatingToWatch, startWatchTransition] = useTransition();

  // Memoize handlers
  const handleBack = useCallback(() => router.back(), [router]);
  const handleGoHome = useCallback(() => router.push('/'), [router]);
  const handleWatchNow = useCallback(() => {
    startWatchTransition(() => {
      router.push(`/movie/${movieId}/watch`);
    });
  }, [router, movieId]);

  // Prefetch watch route + warm providers cache so play-button click feels instant.
  useEffect(() => {
    if (!movieId) return;
    router.prefetch(`/movie/${movieId}/watch`);
    // Warm CDN/browser cache for providers list (response is now Cache-Control: 5 min).
    fetch('/api/video-providers').catch(() => { /* ignore */ });
  }, [router, movieId]);
  const handleWatchTogether = useCallback(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else {
      setShowWatchTogether(true);
    }
  }, [status, router]);

  // Memoize trailer data
  const trailer = useMemo(() =>
    movie?.videos?.results?.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ),
    [movie?.videos?.results]
  );

  // Memoize cast slice
  const topCast = useMemo(() =>
    movie?.credits?.cast?.slice(0, 16) || [],
    [movie?.credits?.cast]
  );

  // Memoize similar movies slice
  const similarMovies = useMemo(() =>
    movie?.similar?.results?.slice(0, 10) || [],
    [movie?.similar?.results]
  );

  // Update watchlist status and add to history
  useEffect(() => {
    if (movie) {
      setInWatchlist(isInWatchlist(movie.id, 'movie'));
      addToHistory(movie, 'movie');
    }
  }, [movie]);

  // Watchlist toggle handler (memoized)
  const toggleWatchlist = useCallback(() => {
    if (!movie) return;

    if (inWatchlist) {
      removeFromWatchlist(movie.id, 'movie');
      setInWatchlist(false);
    } else {
      addToWatchlist(movie, 'movie');
      setInWatchlist(true);
    }
  }, [movie, inWatchlist]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="bg-black/50 backdrop-blur-sm border-gray-700 hover:bg-black/70"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Movie Not Found</h1>
            <p className="text-gray-400 mb-6">We couldn&apos;t load this movie. Please try again.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => refetch()} variant="default">
                Try Again
              </Button>
              <Button onClick={handleGoHome} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 page-transition">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={handleBack}
          variant="outline"
          size="icon"
          className="bg-black/50 backdrop-blur-sm border-gray-700 hover:bg-black/70"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh]">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
            alt={movie.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              <div className="hidden md:block w-48 lg:w-64 flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    fill
                    className="object-cover object-center"
                    priority
                    quality={85}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {movie.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400 font-semibold">
                        {formatVoteAverage(movie.vote_average)}
                      </span>
                    </div>
                  )}

                  {movie.release_date && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  )}

                  {movie.runtime && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-gray-300 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <p className="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
                  {movie.overview}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <PlayButton
                    onClick={handleWatchNow}
                    loading={isNavigatingToWatch}
                  >
                    {isNavigatingToWatch ? 'Loading…' : 'Play Now'}
                  </PlayButton>

                  <Button
                    onClick={handleWatchTogether}
                    variant="secondary"
                    className="gap-2"
                    size="lg"
                  >
                    <Users className="w-5 h-5" />
                    Watch Together
                  </Button>

                  {trailer && (
                    <Button
                      size="lg"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                      variant="outline"
                      className="gap-2"
                    >
                      <Play className="w-5 h-5 fill-black" />
                      Watch Trailer
                    </Button>
                  )}

                  <Button
                    onClick={toggleWatchlist}
                    size="lg"
                    className="gap-2"
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {inWatchlist ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">In Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        <span className="hidden sm:inline">Watchlist</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: movie.title,
                          text: movie.overview,
                          url: window.location.href,
                        });
                      }
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { name: 'Movies', url: '/movies' },
            { name: movie.title, url: `/movie/${movie.id}` },
          ]}
        />

        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Top Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {topCast.map((person: CastMember) => (
                <div key={person.id} className="group cursor-pointer">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-800 group-hover:ring-2 group-hover:ring-teal-500 transition-all">
                    {person.profile_path ? (
                      <Image
                        src={getImageUrl(person.profile_path, 'w185')}
                        alt={person.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium text-xs truncate" title={person.name}>{person.name}</p>
                  <p className="text-gray-400 text-xs truncate" title={person.character}>{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.similar?.results && movie.similar.results.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarMovies.map((item: BaseMovie) => (
                <MediaCard key={item.id} item={item} type="movie" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Watch Together Modal */}
      {showWatchTogether && movie && (
        <WatchTogetherModal
          isOpen={showWatchTogether}
          onClose={() => setShowWatchTogether(false)}
          movieTitle={movie.title}
          movieId={movieId}
          embedUrl={getMovieEmbedUrl(movieId)}
          type="movie"
        />
      )}
    </div>
  );
}