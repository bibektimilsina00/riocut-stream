import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
    asteriskCensorStrategy,
} from 'obscenity';

/**
 * Guardrails for public chat (match live chat + watch-together rooms), where
 * anyone can post anonymously: mask bad words, block links, and rate-limit by
 * identity and by IP so one person can't flood a match.
 *
 * ponytail: limits live in process memory — fine for our single server. Move
 * the buckets to Redis if chat ever runs on more than one instance.
 */

export const CHAT_MAX_LEN = 500;

// ---------- Bad words ----------

const english = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
const censor = new TextCensor().setStrategy(asteriskCensorStrategy());

// Romanized Hindi/Nepali abuse that English datasets miss. Whole words only
// (with stretched letters allowed), so "computing" never trips on "puti".
const SOUTH_ASIAN = [
    'madarchod', 'maderchod', 'bhenchod', 'behenchod', 'bhanchod', 'chutiya', 'chutiye', 'chootiya',
    'bhosdike', 'bhosdi', 'bhosada', 'gandu', 'lund', 'lauda', 'lawda', 'randi', 'harami', 'kamina',
    'muji', 'machikne', 'machikney', 'randi ko', 'geda', 'puti', 'lado', 'chikne', 'chikney', 'boka',
];
const SOUTH_ASIAN_RE = new RegExp(
    `\\b(${SOUTH_ASIAN.map((w) => w.split('').map((ch) => (ch === ' ' ? '\\s*' : `${ch}+`)).join('')).join('|')})\\b`,
    'gi',
);

// "f u c k" / "f.u.c.k": join runs of single letters so the matchers see the word.
const SPACED_RE = /\b(?:\p{L}[\s._*-]){2,}\p{L}\b/gu;

export function maskProfanity(raw: string): string {
    const text = raw.replace(SPACED_RE, (m) => m.replace(/[\s._*-]/g, ''));
    const masked = censor.applyTo(text, english.getAllMatches(text));
    return masked.replace(SOUTH_ASIAN_RE, (w) => w[0] + '*'.repeat(Math.max(w.length - 1, 1)));
}

// ---------- Spam ----------

const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|xyz|top|site|live|io|me|in|np|pk|ru|tk|link|click|bet|casino)\b|t\.me\/|wa\.me\/)/i;

/** Collapse "gooooooool" / "!!!!!!!!!!" floods to at most 3 repeats. */
function collapseRepeats(text: string): string {
    return text.replace(/(.)\1{3,}/gu, '$1$1$1');
}

type Bucket = { hits: number[]; last?: string; lastAt?: number };
const buckets = new Map<string, Bucket>();

function bucket(key: string): Bucket {
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { hits: [] }));
    return b;
}

/** Count of hits for `key` inside the window, after recording a new one. */
function hit(b: Bucket, now: number, windowMs: number): number {
    b.hits = b.hits.filter((t) => now - t < windowMs);
    b.hits.push(now);
    return b.hits.length;
}

// Drop idle buckets so the map can't grow forever.
let lastSweep = Date.now();
function sweep(now: number) {
    if (now - lastSweep < 5 * 60_000) return;
    lastSweep = now;
    for (const [k, b] of buckets) if (!b.hits.length || now - b.hits[b.hits.length - 1] > 10 * 60_000) buckets.delete(k);
}

const LIMITS = {
    minGapMs: 2_000,
    perUser: { max: 5, windowMs: 30_000 },
    // Mobile carriers put many people behind one IP (CGNAT), so the IP cap is
    // looser: it stops someone rotating guest ids, not a busy shared network.
    perIp: { max: 12, windowMs: 60_000 },
    duplicateMs: 60_000,
};

export type ModerationResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Validate and clean one chat message. `identity` is the account id or guest
 * id; `ip` the client IP (best effort). Returns the text to store/broadcast.
 */
export function moderateChatMessage(identity: string, ip: string | null | undefined, raw: string, now = Date.now()): ModerationResult {
    sweep(now);
    const text = collapseRepeats((raw ?? '').replace(/\s+/g, ' ').trim());
    if (!text) return { ok: false, error: 'Message cannot be empty' };
    if (text.length > CHAT_MAX_LEN) return { ok: false, error: 'Message too long' };
    if (LINK_RE.test(text)) return { ok: false, error: 'Links are not allowed in chat' };

    const user = bucket(`u:${identity}`);
    if (user.lastAt && now - user.lastAt < LIMITS.minGapMs) return { ok: false, error: 'Slow down a little' };
    const norm = text.toLowerCase();
    if (user.last === norm && user.lastAt && now - user.lastAt < LIMITS.duplicateMs) {
        return { ok: false, error: 'You already sent that' };
    }
    if (hit(user, now, LIMITS.perUser.windowMs) > LIMITS.perUser.max) return { ok: false, error: 'Too many messages — wait a few seconds' };
    if (ip && hit(bucket(`ip:${ip}`), now, LIMITS.perIp.windowMs) > LIMITS.perIp.max) {
        return { ok: false, error: 'Too many messages from your network — wait a minute' };
    }

    user.last = norm;
    user.lastAt = now;
    return { ok: true, text: maskProfanity(text) };
}

/** Client IP from proxy headers (Cloudflare → nginx → app). */
export function clientIp(get: (name: string) => string | null | undefined): string | null {
    return get('cf-connecting-ip')?.trim()
        || get('x-forwarded-for')?.split(',')[0]?.trim()
        || get('x-real-ip')?.trim()
        || null;
}
