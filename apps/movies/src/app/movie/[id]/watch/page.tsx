'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMovieDetails } from '@/lib/hooks/useTMDb';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Calendar, Clock, Loader2, Info, Server, Globe, Film, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { MediaCard } from '@/components/media-card';
import Image from 'next/image';
import { PageLoader } from '@riocut/ui/components/ui/loading-spinner';

interface VideoProvider {
  id: string;
  name: string;
  slug: string;
  quality: string;
  isDefault: boolean;
  movieTemplate: string;
  tvTemplate: string;
  description?: string | null;
}

export default function WatchMoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.id as string);

  const { data: movie, isLoading } = useMovieDetails(movieId);
  const {
    data: providers = [],
    isLoading: providersLoading,
  } = useQuery<VideoProvider[]>({
    queryKey: ['video-providers'],
    queryFn: async () => {
      const r = await fetch('/api/video-providers');
      if (!r.ok) throw new Error('Failed to load providers');
      return r.json();
    },
    staleTime: 1000 * 60 * 10, // 10 min: providers list rarely changes
    gcTime: 1000 * 60 * 60,
  });

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showAllServers, setShowAllServers] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  // Pick the default provider once on load.
  useEffect(() => {
    if (providers.length === 0) return;
    const defaultIndex = providers.findIndex((p) => p.isDefault);
    setCurrentSourceIndex(defaultIndex >= 0 ? defaultIndex : 0);
  }, [providers]);

  // Get similar movies from movie details
  const similarMovies = movie?.similar?.results || [];

  // Show first 5 servers by default
  const defaultServersCount = 5;
  const visibleServers = useMemo(
    () => (showAllServers ? providers : providers.slice(0, defaultServersCount)),
    [showAllServers, providers],
  );
  const hasMoreServers = providers.length > defaultServersCount;

  // Loading state — block only while movie details are coming in. Providers
  // load in parallel; their own skeleton renders below once `providersLoading`
  // resolves.
  if (isLoading || !movie) {
    return <PageLoader text="Loading movie..." />;
  }

  // No providers available
  if (!providersLoading && providers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-white text-2xl font-bold">No video providers available</h1>
            <p className="text-gray-400">Please contact support</p>
            <button
              onClick={() => router.push('/movies')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
            >
              Browse Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSource = providers[currentSourceIndex];
  const embedUrl = currentSource?.movieTemplate
    .replace(/\{\{tmdbId\}\}/g, movieId.toString())
    .replace(/\{tmdbId\}/g, movieId.toString());

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-poster.jpg';

  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-8 pb-6 max-w-[1600px]">

        {/* Video Player Section */}
        <div className="mb-8">
          <div className="bg-gray-900/50 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
            {/* Player */}
            <div className="aspect-video relative bg-black">
              {isPlayerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
                    <div>
                      <p className="text-white text-lg font-semibold">Loading {currentSource?.name}...</p>
                      <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your stream</p>
                    </div>
                  </div>
                </div>
              )}
              {currentSource && (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  scrolling='no'
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={movie.title}
                  referrerPolicy="origin"
                  onLoad={() => setIsPlayerLoading(false)}
                  onError={() => setIsPlayerLoading(false)}
                />
              )}
            </div>

            {/* Server Selection Below Player */}
            <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  <span>If current server doesn&apos;t work, try other servers</span>
                </p>
                <span className="text-xs text-gray-500 font-medium">
                  {providers.length} servers
                </span>
              </div>

              {/* Server Buttons */}
              <div className="flex flex-wrap gap-2">
                {visibleServers.map((provider, index) => {
                  const isActive = currentSourceIndex === index;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setIsPlayerLoading(true);
                        setCurrentSourceIndex(index);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-sm transition-all ${isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>{provider.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* More Button */}
                {hasMoreServers && (
                  <button
                    onClick={() => setShowAllServers(!showAllServers)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-sm bg-gray-700/50 text-gray-400 hover:bg-gray-600 hover:text-white border border-gray-600 transition-all"
                  >
                    <span>{showAllServers ? '− Show Less' : `+ ${providers.length - defaultServersCount} More`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info Section - Improved Layout */}
        <div className="mb-10 theater-mode-dim">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/40 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row">
              {/* Left: Poster */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="relative aspect-[2/3] lg:aspect-auto lg:h-full">
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 256px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-gray-900/80" />
                </div>
              </div>

              {/* Right: Movie Details */}
              <div className="flex-1 p-6 lg:p-8">
                {/* Title and Rating */}
                <div className="mb-6">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                    {movie.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3">
                    {movie.vote_average && movie.vote_average > 0 && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-lg border border-yellow-500/30">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold text-lg">{movie.vote_average.toFixed(1)}</span>
                        <span className="text-gray-400 text-sm">/10</span>
                      </div>
                    )}

                    {movie.status && (
                      <span className="px-3 py-1.5 bg-teal-500/20 text-teal-400 text-sm font-semibold rounded-lg border border-teal-500/30">
                        {movie.status}
                      </span>
                    )}

                    {runtime && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{runtime}</span>
                      </div>
                    )}

                    {movie.release_date && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-3 py-1 bg-gray-800/60 text-gray-300 text-sm font-medium rounded-full border border-gray-700/50 hover:bg-gray-700/60 transition-colors"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overview */}
                {movie.overview && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                    <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                  </div>
                )}

                {/* Additional Info - Flex Wrap */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                    <Film className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Type</p>
                      <p className="text-gray-200 text-sm font-medium">Feature Film</p>
                    </div>
                  </div>

                  {movie.production_countries && movie.production_countries.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                      <Globe className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Country</p>
                        <p className="text-gray-200 text-sm font-medium">
                          {movie.production_countries.map(c => c.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {movie.spoken_languages && movie.spoken_languages.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                      <Globe className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Language</p>
                        <p className="text-gray-200 text-sm font-medium">
                          {movie.spoken_languages[0].english_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {movie.production_companies && movie.production_companies.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px] flex-1">
                      <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Production</p>
                        <p className="text-gray-200 text-sm font-medium">
                          {movie.production_companies.slice(0, 2).map(c => c.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies Section */}
        {similarMovies && similarMovies.length > 0 && (
          <div className="pt-8">
            <h2 className="text-2xl font-bold text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarMovies.slice(0, 12).map((item) => (
                <MediaCard key={item.id} media={item} mediaType="movie" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}