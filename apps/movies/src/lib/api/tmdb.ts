import axios, { AxiosResponse } from 'axios';

// All TMDB calls go through our `/api/tmdb` proxy. The proxy reads the
// active TMDB key from the database (admin user's `tmdbApiKey`, with
// env fallback). This keeps the key off the client bundle and lets admins
// rotate it without redeploys.
const PROXY_PATH = '/api/tmdb';
const SSR_ORIGIN =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:8000';

function tmdbBaseUrl() {
    return typeof window === 'undefined' ? `${SSR_ORIGIN}${PROXY_PATH}` : PROXY_PATH;
}

const tmdbAxios = axios.create({
    baseURL: tmdbBaseUrl(),
    timeout: 10000,
});

// Add response interceptor for error handling
tmdbAxios.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
        console.error('TMDb API Error:', error instanceof Error ? error.message : String(error));
        return Promise.reject(error);
    }
);

// =============================================================================
// TypeScript Types for TMDb API
// =============================================================================

export interface BaseMovie {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_title: string;
    video: boolean;
    media_type?: 'movie';
}

export interface BaseTVShow {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_name: string;
    origin_country: string[];
    media_type?: 'tv';
}

export interface Genre {
    id: number;
    name: string;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
    adult: boolean;
    gender: number;
    known_for_department: string;
    original_name: string;
    popularity: number;
    cast_id: number;
    credit_id: string;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
    adult: boolean;
    gender: number;
    known_for_department: string;
    original_name: string;
    popularity: number;
    credit_id: string;
}

export interface Credits {
    cast: CastMember[];
    crew: CrewMember[];
}

export interface Video {
    key: string;
    name: string;
    site: string;
    type: string;
    size: number;
    iso_639_1: string;
    iso_3166_1: string;
    published_at: string;
    official: boolean;
    id: string;
}

export interface Videos {
    results: Video[];
}

export interface MovieDetails extends BaseMovie {
    runtime: number;
    genres: Genre[];
    budget: number;
    revenue: number;
    status: string;
    tagline: string;
    production_companies: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }>;
    production_countries: Array<{
        iso_3166_1: string;
        name: string;
    }>;
    spoken_languages: Array<{
        iso_639_1: string;
        name: string;
        english_name: string;
    }>;
    credits?: Credits;
    videos?: Videos;
    similar?: TMDbResponse<BaseMovie>;
    recommendations?: TMDbResponse<BaseMovie>;
}

export interface TVDetails extends BaseTVShow {
    genres: Genre[];
    number_of_episodes: number;
    number_of_seasons: number;
    episode_run_time: number[];
    status: string;
    tagline: string;
    type: string;
    networks: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }>;
    production_companies: Array<{
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }>;
    production_countries: Array<{
        iso_3166_1: string;
        name: string;
    }>;
    spoken_languages: Array<{
        iso_639_1: string;
        name: string;
        english_name: string;
    }>;
    seasons: Array<{
        id: number;
        name: string;
        overview: string;
        poster_path: string | null;
        season_number: number;
        episode_count: number;
        air_date: string;
    }>;
    credits?: Credits;
    videos?: Videos;
    similar?: TMDbResponse<BaseTVShow>;
    recommendations?: TMDbResponse<BaseTVShow>;
}

export interface TMDbResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface SearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    popularity: number;
}

export interface Episode {
    id: number;
    name: string;
    overview: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
    air_date: string;
    vote_average: number;
    vote_count: number;
    runtime: number | null;
}

export interface SeasonDetails {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    air_date: string;
    episodes: Episode[];
}

export type MediaItem = BaseMovie | BaseTVShow;

// =============================================================================
// Utility Functions
// =============================================================================

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Generate TMDb image URL with fallback
 */
export function getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return '/placeholder-movie.jpg';
    return `${IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Get formatted runtime string
 */
export function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

/**
 * Get year from date string
 */
export function getYear(dateString: string): string {
    return dateString ? new Date(dateString).getFullYear().toString() : '';
}

/**
 * Format vote average to one decimal place
 */
export function formatVoteAverage(voteAverage: number): string {
    return voteAverage.toFixed(1);
}

// =============================================================================
// API Service Functions
// =============================================================================

/**
 * Fetch trending content
 */
export async function getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week'
): Promise<MediaItem[]> {
    const response: AxiosResponse<TMDbResponse<MediaItem>> = await tmdbAxios.get(
        `/trending/${mediaType}/${timeWindow}`
    );
    return response.data.results;
}

/**
 * Fetch popular content with pagination
 */
export async function getPopular(
    mediaType: 'movie' | 'tv',
    page: number = 1
): Promise<TMDbResponse<MediaItem>> {
    const response: AxiosResponse<TMDbResponse<MediaItem>> = await tmdbAxios.get(
        `/${mediaType}/popular`,
        { params: { page } }
    );
    return response.data;
}

/**
 * Fetch top rated content with pagination
 */
export async function getTopRated(
    mediaType: 'movie' | 'tv',
    page: number = 1
): Promise<TMDbResponse<MediaItem>> {
    const response: AxiosResponse<TMDbResponse<MediaItem>> = await tmdbAxios.get(
        `/${mediaType}/top_rated`,
        { params: { page } }
    );
    return response.data;
}

/**
 * Fetch detailed movie information
 */
export async function getMovieDetails(id: number): Promise<MovieDetails> {
    const response: AxiosResponse<MovieDetails> = await tmdbAxios.get(`/movie/${id}`, {
        params: {
            append_to_response: 'credits,videos,similar,recommendations',
        },
    });
    return response.data;
}

/**
 * Fetch detailed TV show information
 */
export async function getTVDetails(id: number): Promise<TVDetails> {
    const response: AxiosResponse<TVDetails> = await tmdbAxios.get(`/tv/${id}`, {
        params: {
            append_to_response: 'credits,videos,similar,recommendations',
        },
    });
    return response.data;
}

/**
 * Search across movies, TV shows, and people
 */
export async function searchMulti(
    query: string,
    page: number = 1
): Promise<TMDbResponse<SearchResult>> {
    const response: AxiosResponse<TMDbResponse<SearchResult>> = await tmdbAxios.get(
        '/search/multi',
        {
            params: { query, page },
        }
    );
    return response.data;
}

/**
 * Fetch genres for a specific media type
 */
export async function getGenres(mediaType: 'movie' | 'tv'): Promise<Genre[]> {
    const response: AxiosResponse<{ genres: Genre[] }> = await tmdbAxios.get(
        `/genre/${mediaType}/list`
    );
    return response.data.genres;
}

/**
 * Fetch season details with all episodes
 */
export async function getSeasonDetails(
    tvId: number,
    seasonNumber: number
): Promise<SeasonDetails> {
    const response: AxiosResponse<SeasonDetails> = await tmdbAxios.get(
        `/tv/${tvId}/season/${seasonNumber}`
    );
    return response.data;
}

/**
 * Discover content by genre
 */
export async function discoverByGenre(
    mediaType: 'movie' | 'tv',
    genreId: number,
    page: number = 1
): Promise<TMDbResponse<MediaItem>> {
    const response: AxiosResponse<TMDbResponse<MediaItem>> = await tmdbAxios.get(
        `/discover/${mediaType}`,
        {
            params: {
                with_genres: genreId,
                page,
                sort_by: 'popularity.desc',
            },
        }
    );
    return response.data;
}

/**
 * Fetch now playing movies
 */
export async function getNowPlaying(page: number = 1): Promise<TMDbResponse<BaseMovie>> {
    const response: AxiosResponse<TMDbResponse<BaseMovie>> = await tmdbAxios.get(
        '/movie/now_playing',
        { params: { page } }
    );
    return response.data;
}

/**
 * Fetch upcoming movies
 */
export async function getUpcoming(page: number = 1): Promise<TMDbResponse<BaseMovie>> {
    const response: AxiosResponse<TMDbResponse<BaseMovie>> = await tmdbAxios.get(
        '/movie/upcoming',
        { params: { page } }
    );
    return response.data;
}

/**
 * Fetch TV shows airing today
 */
export async function getAiringToday(page: number = 1): Promise<TMDbResponse<BaseTVShow>> {
    const response: AxiosResponse<TMDbResponse<BaseTVShow>> = await tmdbAxios.get(
        '/tv/airing_today',
        { params: { page } }
    );
    return response.data;
}

/**
 * Fetch TV shows on the air
 */
export async function getOnTheAir(page: number = 1): Promise<TMDbResponse<BaseTVShow>> {
    const response: AxiosResponse<TMDbResponse<BaseTVShow>> = await tmdbAxios.get(
        '/tv/on_the_air',
        { params: { page } }
    );
    return response.data;
}