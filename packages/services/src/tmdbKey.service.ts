import { prisma } from '@riocut/db';

// Single global setting key used in the AppSetting table.
const TMDB_SETTING_KEY = 'tmdb_api_key';

// In-memory cache so we don't hit the DB on every TMDB call. Single-process;
// each replica caches its own. invalidateTmdbKeyCache() flushes after a save.
const TTL_MS = 5 * 60 * 1000;
let cached: { key: string; expires: number } | null = null;

/**
 * Resolves the active TMDB API key.
 *
 * Resolution order:
 *  1. In-memory cache (5 min TTL).
 *  2. AppSetting row with key `tmdb_api_key` (set by any admin; globally shared).
 *  3. `process.env.TMDB_API_KEY` fallback.
 *
 * Returns `null` if no key is available anywhere.
 */
export async function getActiveTmdbKey(): Promise<string | null> {
    if (cached && cached.expires > Date.now()) return cached.key;

    let key: string | null = null;
    try {
        const row = await prisma.appSetting.findUnique({
            where: { key: TMDB_SETTING_KEY },
            select: { value: true },
        });
        key = row?.value ?? null;
    } catch (err) {
        console.error('[tmdbKey] DB lookup failed; using env fallback:', err);
    }

    if (!key) key = process.env.TMDB_API_KEY ?? null;
    if (key) cached = { key, expires: Date.now() + TTL_MS };
    return key;
}

/** Persist a new key. Audit who set it. Returns the masked tail for display. */
export async function setActiveTmdbKey(value: string, updatedBy?: string): Promise<void> {
    await prisma.appSetting.upsert({
        where: { key: TMDB_SETTING_KEY },
        create: { key: TMDB_SETTING_KEY, value, updatedBy },
        update: { value, updatedBy },
    });
    invalidateTmdbKeyCache();
}

/** Remove the stored key so the system falls back to env. */
export async function clearActiveTmdbKey(): Promise<void> {
    await prisma.appSetting.delete({ where: { key: TMDB_SETTING_KEY } }).catch(() => {
        // already absent — fine
    });
    invalidateTmdbKeyCache();
}

/** Returns metadata for the stored key without exposing the value. */
export async function getActiveTmdbKeyStatus(): Promise<{
    hasKey: boolean;
    masked: string | null;
    updatedAt: Date | null;
    updatedBy: string | null;
}> {
    const row = await prisma.appSetting
        .findUnique({
            where: { key: TMDB_SETTING_KEY },
            select: { value: true, updatedAt: true, updatedBy: true },
        })
        .catch(() => null);
    if (!row) return { hasKey: false, masked: null, updatedAt: null, updatedBy: null };
    return {
        hasKey: true,
        masked: `••••${row.value.slice(-4)}`,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
    };
}

/** Clear the cache so the next call re-reads the DB. */
export function invalidateTmdbKeyCache(): void {
    cached = null;
}
