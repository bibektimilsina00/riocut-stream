import type { Match, MatchDetail, SportCategory } from '../sportsrc';

/**
 * A stream provider is one upstream host (e.g. sportsrc.org or a streamed.*
 * mirror) that can list sports/matches and resolve a match's playable sources.
 * All providers normalise their responses to the same model so the app never
 * needs to know which one served a given request.
 */
export interface SportsProvider {
    /** Stable short id, surfaced in logs and on each resolved source. */
    readonly name: string;
    getSports(): Promise<SportCategory[]>;
    getMatches(category: string): Promise<Match[]>;
    getMatchDetail(category: string, id: string): Promise<MatchDetail | null>;
}

/** Simple token-bucket rate limiter, one per provider host. */
export class TokenBucket {
    private tokens: number;
    private last: number;
    constructor(private capacity: number, private refillPerSecond: number) {
        this.tokens = capacity;
        this.last = Date.now();
    }
    async take(): Promise<void> {
        const now = Date.now();
        const elapsed = (now - this.last) / 1000;
        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
        this.last = now;
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return;
        }
        const waitMs = ((1 - this.tokens) / this.refillPerSecond) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        return this.take();
    }
}
