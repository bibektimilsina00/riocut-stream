import axios from 'axios';

// Use internal API proxy to hide API key from client
const TMDB_BASE_URL = '/api/tmdb';

export const tmdbApi = axios.create({
    baseURL: TMDB_BASE_URL,
});

export interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date: string;
    vote_average: number;
    genre_ids: number[];
    media_type?: 'movie';
}

export interface TVShow {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    first_air_date: string;
    vote_average: number;
    genre_ids: number[];
    media_type?: 'tv';
}

export interface MediaDetail extends Movie {
    runtime?: number;
    genres: { id: number; name: string }[];
    credits?: {
        cast: Array<{
            id: number;
            name: string;
            character: string;
            profile_path: string | null;
        }>;
    };
    videos?: {
        results: Array<{
            key: string;
            site: string;
            type: string;
        }>;
    };
    similar?: {
        results: MediaItem[];
    };
}

export type MediaItem = Movie | TVShow;

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return '/placeholder-movie.jpg';
    return `${IMAGE_BASE_URL}/${size}${path}`;
}

// API Methods
export async function getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return response.data.results;
}

export async function getPopular(mediaType: 'movie' | 'tv', page: number = 1) {
    const response = await tmdbApi.get(`/${mediaType}/popular`, { params: { page } });
    return response.data;
}

export async function getTopRated(mediaType: 'movie' | 'tv', page: number = 1) {
    const response = await tmdbApi.get(`/${mediaType}/top_rated`, { params: { page } });
    return response.data;
}

export async function getMovieDetails(id: number) {
    const response = await tmdbApi.get(`/movie/${id}`, {
        params: {
            append_to_response: 'credits,videos,similar',
        },
    });
    return response.data;
}

export async function getTVDetails(id: number) {
    const response = await tmdbApi.get(`/tv/${id}`, {
        params: {
            append_to_response: 'credits,videos,similar',
        },
    });
    return response.data;
}

export async function searchMulti(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/multi', {
        params: { query, page },
    });
    return response.data;
}

export async function getGenres(mediaType: 'movie' | 'tv') {
    const response = await tmdbApi.get(`/genre/${mediaType}/list`);
    return response.data.genres;
}

export async function discoverByGenre(
    mediaType: 'movie' | 'tv',
    genreId: number,
    page: number = 1
) {
    const response = await tmdbApi.get(`/discover/${mediaType}`, {
        params: {
            with_genres: genreId,
            page,
            sort_by: 'popularity.desc',
        },
    });
    return response.data;
}
