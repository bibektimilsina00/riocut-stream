import axios, { AxiosInstance } from 'axios';
import type { Match, MatchDetail, SportCategory } from '../sportsrc';
import { SportsProvider, TokenBucket } from './base';

/**
 * sportsrc.org provider. Uses the query-param API scheme
 * (`?data=matches&category=…`) and returns matches with sources already
 * merged into the detail response. Image URLs are absolute.
 *
 * Note: the provider's per-sport `matches` buckets are currently empty; all
 * active matches are served from the single `live` bucket, so we fall back to
 * `live` (filtered by the match's own category) when a per-sport query is empty.
 */

const BASE_URL = 'https://api.sportsrc.org';

// sportsrc's /img/sport/* links 301 to the closed streamed.pk (bad cert), so
// every poster/badge rendered broken — and, winning dedupe, hid the working
// posters other providers have for the same match.
const DEAD_IMAGE = /^https?:\/\/(www\.)?sportsrc\.org\/img\//;
const liveImage = (u: string | null | undefined) => (u && !DEAD_IMAGE.test(u) ? u : null);

function withLiveImages<T extends Match>(m: T): T {
    return {
        ...m,
        poster: liveImage(m.poster),
        teams: {
            home: { ...m.teams?.home, name: m.teams?.home?.name ?? '', badge: liveImage(m.teams?.home?.badge) },
            away: { ...m.teams?.away, name: m.teams?.away?.name ?? '', badge: liveImage(m.teams?.away?.badge) },
        },
    };
}

interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export class SportsrcProvider implements SportsProvider {
    readonly name = 'sportsrc';
    private http: AxiosInstance;
    private bucket = new TokenBucket(20, 20);

    constructor(baseURL: string = BASE_URL) {
        this.http = axios.create({ baseURL, timeout: 15000, headers: { Accept: 'application/json' } });
    }

    private async get<T>(params: Record<string, string>): Promise<T> {
        await this.bucket.take();
        const res = await this.http.get<ApiEnvelope<T> | T>('/', { params });
        const body = res.data as ApiEnvelope<T>;
        if (body && typeof body === 'object' && 'success' in body) {
            if (body.success === false) throw new Error(body.error || 'sportsrc request failed');
            if ('data' in body) return body.data as T;
        }
        return body as T;
    }

    getSports(): Promise<SportCategory[]> {
        return this.get<SportCategory[]>({ data: 'sports' });
    }

    async getMatches(category: string): Promise<Match[]> {
        const direct = await this.get<Match[]>({ data: 'matches', category });
        if (Array.isArray(direct) && direct.length > 0) return this.tag(direct);
        if (category === 'live') return this.tag(direct ?? []);
        const live = await this.get<Match[]>({ data: 'matches', category: 'live' });
        if (!Array.isArray(live)) return [];
        return this.tag(live.filter((m) => (m.category ?? '').toLowerCase() === category.toLowerCase()));
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        const detail = await this.tryDetail(category, id) ?? (category !== 'live' ? await this.tryDetail('live', id) : null);
        if (!detail) return null;
        return { ...withLiveImages(detail), sources: (detail.sources ?? []).map((s) => ({ ...s, provider: this.name })) };
    }

    private async tryDetail(category: string, id: string): Promise<MatchDetail | null> {
        try {
            const data = await this.get<MatchDetail | null>({ data: 'detail', category, id });
            return data ?? null;
        } catch {
            return null;
        }
    }

    private tag(matches: Match[]): Match[] {
        return matches.map((m) => ({ ...withLiveImages(m), provider: this.name }));
    }
}
