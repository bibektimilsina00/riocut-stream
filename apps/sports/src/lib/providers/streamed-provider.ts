import axios, { AxiosInstance } from 'axios';
import type { Match, MatchDetail, MatchSource, MatchTeam, SportCategory } from '../sportsrc';
import { SportsProvider, TokenBucket } from './base';

/**
 * Streamed-family provider (streamed.pk, streamed.st, and other mirrors of the
 * same upstream project that sportsrc.org is derived from). Uses the RESTful
 * API scheme:
 *   GET /api/sports
 *   GET /api/matches/{sport}            ← per-sport buckets WORK here
 *   GET /api/matches/live | all
 *   GET /api/stream/{source}/{id}       ← resolves a match source to streams
 *
 * Differences from sportsrc that this adapter normalises away:
 *  - Poster paths are relative (`/api/images/proxy/…`) → absolutised to host.
 *  - Team badges are raw ids → wrapped as `/api/images/badge/{id}.webp`.
 *  - A match carries `sources: [{source, id}]` pointers; the playable stream
 *    list must be fetched per source and flattened.
 */

interface RawTeam {
    name: string;
    badge?: string | null;
}
interface RawMatch {
    id: string;
    title: string;
    category: string;
    date: number;
    popular?: boolean;
    poster?: string | null;
    teams?: { home?: RawTeam; away?: RawTeam };
    sources?: Array<{ source: string; id: string }>;
}
interface RawStream {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source?: string;
    viewers?: number;
}

export class StreamedProvider implements SportsProvider {
    readonly name: string;
    private base: string;
    private http: AxiosInstance;
    private bucket = new TokenBucket(20, 20);

    constructor(baseURL: string, name?: string) {
        this.base = baseURL.replace(/\/$/, '');
        this.name = name ?? new URL(baseURL).hostname;
        this.http = axios.create({ baseURL: this.base, timeout: 15000, headers: { Accept: 'application/json' } });
    }

    private async get<T>(path: string): Promise<T> {
        await this.bucket.take();
        const res = await this.http.get<T>(path);
        return res.data;
    }

    private absPoster(poster?: string | null): string | null {
        if (!poster) return null;
        if (/^https?:\/\//.test(poster)) return poster;
        return `${this.base}${poster.startsWith('/') ? '' : '/'}${poster}`;
    }

    private absBadge(badge?: string | null): string | null {
        if (!badge) return null;
        if (/^https?:\/\//.test(badge)) return badge;
        return `${this.base}/api/images/badge/${badge}.webp`;
    }

    private team(t?: RawTeam): MatchTeam {
        return { name: t?.name ?? '', badge: this.absBadge(t?.badge) };
    }

    private toMatch(m: RawMatch): Match {
        return {
            id: m.id,
            title: m.title,
            category: m.category,
            date: m.date,
            popular: m.popular,
            poster: this.absPoster(m.poster),
            teams: { home: this.team(m.teams?.home), away: this.team(m.teams?.away) },
            provider: this.name,
        };
    }

    getSports(): Promise<SportCategory[]> {
        return this.get<SportCategory[]>('/api/sports');
    }

    async getMatches(category: string): Promise<Match[]> {
        const raw = await this.get<RawMatch[]>(`/api/matches/${encodeURIComponent(category)}`);
        return Array.isArray(raw) ? raw.map((m) => this.toMatch(m)) : [];
    }

    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        const raw = await this.findRawMatch(category, id);
        if (!raw) return null;
        const sources = await this.resolveSources(raw);
        return { ...this.toMatch(raw), sources };
    }

    /** Streamed has no by-id detail endpoint, so locate the match in its bucket. */
    private async findRawMatch(category: string, id: string): Promise<RawMatch | null> {
        for (const bucket of [category, 'all', 'live']) {
            try {
                const list = await this.get<RawMatch[]>(`/api/matches/${encodeURIComponent(bucket)}`);
                const hit = Array.isArray(list) ? list.find((m) => m.id === id) : null;
                if (hit) return hit;
            } catch {
                // try next bucket
            }
        }
        return null;
    }

    private async resolveSources(m: RawMatch): Promise<MatchSource[]> {
        const out: MatchSource[] = [];
        for (const src of m.sources ?? []) {
            try {
                const streams = await this.get<RawStream[]>(`/api/stream/${encodeURIComponent(src.source)}/${encodeURIComponent(src.id)}`);
                for (const s of streams ?? []) {
                    out.push({
                        id: s.id,
                        streamNo: s.streamNo,
                        language: s.language,
                        hd: s.hd,
                        embedUrl: s.embedUrl,
                        source: s.source ?? src.source,
                        viewers: s.viewers,
                        provider: this.name,
                    });
                }
            } catch {
                // skip a source that fails to resolve; others may still work
            }
        }
        return out;
    }
}
