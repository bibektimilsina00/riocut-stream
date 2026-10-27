"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTVDetails } from "@/lib/hooks/useTMDb";
import { useState, useEffect } from "react";
import {
  Star,
  Calendar,
  Loader2,
  Info,
  Server,
  Globe,
  Film,
  Users,
  Tv,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { MediaCard } from "@/components/media-card";
import Image from "next/image";
import { getSeasonDetails, type Episode } from "@/lib/api/tmdb";
import { PageLoader } from "@riocut/ui/components/ui/loading-spinner";

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

export default function WatchTVPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvId = Number(params?.id as string);

  // Get season and episode from URL params or default to 1
  const initialSeason = Number(searchParams?.get("season")) || 1;
  const initialEpisode = Number(searchParams?.get("episode")) || 1;

  const { data: tv, isLoading } = useTVDetails(tvId);
  const [providers, setProviders] = useState<VideoProvider[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [showAllServers, setShowAllServers] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Get similar shows from TV details
  const similarShows = tv?.similar?.results || [];

  // Show first 5 servers by default
  const defaultServersCount = 5;
  const visibleServers = showAllServers
    ? providers
    : providers.slice(0, defaultServersCount);
  const hasMoreServers = providers.length > defaultServersCount;

  // Fetch video providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/video-providers");
        if (response.ok) {
          const data = await response.json();
          setProviders(data);

          // Set default provider as current
          const defaultIndex = data.findIndex(
            (p: VideoProvider) => p.isDefault,
          );
          if (defaultIndex !== -1) {
            setCurrentSourceIndex(defaultIndex);
          }
        }
      } catch (error) {
        console.error("Error fetching video providers:", error);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Fetch episodes for selected season
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvId || !selectedSeason) return;

      setEpisodesLoading(true);
      try {
        const seasonData = await getSeasonDetails(tvId, selectedSeason);
        setEpisodes(seasonData.episodes || []);
      } catch (error) {
        console.error("Error fetching episodes:", error);
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    };

    fetchEpisodes();
  }, [tvId, selectedSeason]);

  // Update URL when season/episode changes
  useEffect(() => {
    setIsPlayerLoading(true);
    const newUrl = `/tv/${tvId}/watch?season=${selectedSeason}&episode=${selectedEpisode}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedSeason, selectedEpisode, tvId, router]);

  // Loading state
  if (isLoading || !tv) {
    return <PageLoader text="Loading TV show..." />;
  }

  // No providers available
  if (!providersLoading && providers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-white text-2xl font-bold">
              No video providers available
            </h1>
            <p className="text-gray-400">Please contact support</p>
            <button
              onClick={() => router.push("/tv")}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
            >
              Browse TV Shows
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSource = providers[currentSourceIndex];
  const embedUrl = currentSource?.tvTemplate
    .replace(/\{\{tmdbId\}\}/g, tvId.toString())
    .replace(/\{tmdbId\}/g, tvId.toString())
    .replace(/\{\{season\}\}/g, selectedSeason.toString())
    .replace(/\{season\}/g, selectedSeason.toString())
    .replace(/\{\{episode\}\}/g, selectedEpisode.toString())
    .replace(/\{episode\}/g, selectedEpisode.toString());

  const posterUrl = tv.poster_path
    ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
    : "/placeholder-poster.jpg";

  // Get current season data
  const currentSeasonData = tv.seasons?.find(
    (s) => s.season_number === selectedSeason,
  );
  const episodeCount = currentSeasonData?.episode_count || 20;

  // Get available seasons (excluding season 0 - specials)
  const availableSeasons = tv.seasons?.filter((s) => s.season_number > 0) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-8 pb-6 max-w-[1600px]">
        {/* Video Player Section */}
        <div className="mb-8">
          <div className="bg-gray-900/50 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50 theater-mode-keep">
            {/* Player */}
            <div className="aspect-video relative bg-black">
              {isPlayerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
                    <div>
                      <p className="text-white text-lg font-semibold">
                        Loading {currentSource?.name}...
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Please wait while we prepare your stream
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {currentSource && (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={`${tv.name} - S${selectedSeason}E${selectedEpisode}`}
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
                  <span>
                    If current server doesn&apos;t work, try other servers
                  </span>
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-sm transition-all ${
                        isActive
                          ? "bg-teal-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
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
                    <span>
                      {showAllServers
                        ? "− Show Less"
                        : `+ ${providers.length - defaultServersCount} More`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Season & Episode Selection */}
        <div className="mb-8">
          <div className="bg-gray-900/50 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50 p-4">
            {/* Season Selection */}
            <div className="mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Tv className="w-5 h-5 text-teal-400" />
                Select Season
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSeasons.map((season) => {
                  const isActive = selectedSeason === season.season_number;
                  return (
                    <button
                      key={season.id}
                      onClick={() => {
                        setSelectedSeason(season.season_number);
                        setSelectedEpisode(1);
                        setIsPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                        isActive
                          ? "bg-teal-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                      }`}
                    >
                      Season {season.season_number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Episode Selection */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Film className="w-5 h-5 text-green-400" />
                Select Episode
              </h3>

              {episodesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
              ) : episodes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {episodes.map((episode) => {
                    const isActive = selectedEpisode === episode.episode_number;
                    const hasThumbnail = episode.still_path !== null;
                    const thumbnailUrl = hasThumbnail
                      ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                      : null;

                    return (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode.episode_number);
                          setIsPlayerLoading(true);
                        }}
                        className={`group relative rounded-lg overflow-hidden transition-all ${
                          isActive
                            ? "ring-2 ring-teal-500 scale-105"
                            : "hover:scale-105 hover:ring-2 hover:ring-gray-500"
                        }`}
                      >
                        {/* Episode Thumbnail */}
                        <div className="relative aspect-video bg-gray-800">
                          {hasThumbnail && thumbnailUrl ? (
                            <Image
                              src={thumbnailUrl}
                              alt={episode.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <Film className="w-12 h-12 text-gray-600" />
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                              <div className="bg-teal-600 rounded-full p-2">
                                <Film className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Episode Info */}
                        <div
                          className={`p-2 ${isActive ? "bg-teal-600" : "bg-gray-800"}`}
                        >
                          <p className="text-white font-semibold text-sm truncate">
                            Episode {episode.episode_number}
                          </p>
                          <p className="text-gray-300 text-xs truncate">
                            {episode.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map(
                    (ep) => {
                      const isActive = selectedEpisode === ep;
                      return (
                        <button
                          key={ep}
                          onClick={() => {
                            setSelectedEpisode(ep);
                            setIsPlayerLoading(true);
                          }}
                          className={`px-4 py-2 rounded-md font-medium text-sm transition-all min-w-[60px] ${
                            isActive
                              ? "bg-teal-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                          }`}
                        >
                          {ep}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TV Show Info Section */}
        <div className="mb-10">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/40 rounded-xl overflow-hidden shadow-2xl border border-gray-800/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row">
              {/* Left: Poster */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="relative aspect-[2/3] lg:aspect-auto lg:h-full">
                  <Image
                    src={posterUrl}
                    alt={tv.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 256px"
                    priority
                  />
                </div>
              </div>

              {/* Right: TV Show Details */}
              <div className="flex-1 p-6 lg:p-8">
                {/* Title and Rating */}
                <div className="mb-6">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                    {tv.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3">
                    {tv.vote_average && tv.vote_average > 0 && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-lg border border-yellow-500/30">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold text-lg">
                          {tv.vote_average.toFixed(1)}
                        </span>
                        <span className="text-gray-400 text-sm">/10</span>
                      </div>
                    )}

                    {tv.status && (
                      <span className="px-3 py-1.5 bg-teal-500/20 text-teal-400 text-sm font-semibold rounded-lg border border-teal-500/30">
                        {tv.status}
                      </span>
                    )}

                    {tv.number_of_seasons && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Tv className="w-4 h-4" />
                        <span className="font-medium">
                          {tv.number_of_seasons} Seasons
                        </span>
                      </div>
                    )}

                    {tv.first_air_date && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {new Date(tv.first_air_date).getFullYear()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Genres */}
                {tv.genres && tv.genres.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {tv.genres.map((genre) => (
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
                {tv.overview && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Overview
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {tv.overview}
                    </p>
                  </div>
                )}

                {/* Additional Info - Flex Wrap */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                    <Tv className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Type
                      </p>
                      <p className="text-gray-200 text-sm font-medium">
                        {tv.type || "TV Series"}
                      </p>
                    </div>
                  </div>

                  {tv.origin_country && tv.origin_country.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                      <Globe className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Country
                        </p>
                        <p className="text-gray-200 text-sm font-medium">
                          {tv.origin_country.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {tv.spoken_languages && tv.spoken_languages.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px]">
                      <Globe className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Language
                        </p>
                        <p className="text-gray-200 text-sm font-medium">
                          {tv.spoken_languages[0].english_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {tv.production_companies &&
                    tv.production_companies.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg min-w-[200px] flex-1">
                        <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                            Production
                          </p>
                          <p className="text-gray-200 text-sm font-medium">
                            {tv.production_companies
                              .slice(0, 2)
                              .map((c) => c.name)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar TV Shows Section */}
        {similarShows && similarShows.length > 0 && (
          <div className="pt-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarShows.slice(0, 12).map((item) => (
                <MediaCard key={item.id} media={item} mediaType="tv" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
