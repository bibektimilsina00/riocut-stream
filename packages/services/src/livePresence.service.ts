import { prisma } from '@riocut/db';

/** A heartbeat older than this is considered gone — tab closed, network died, whatever. */
export const LIVE_PRESENCE_TTL_MS = 45_000;

/**
 * Upsert one viewer's heartbeat and opportunistically prune stale rows.
 * Called by the sports app's /api/sports/presence on each ~20s beat.
 * sourceKey is optional — callers that don't track which stream a viewer is
 * on yet (e.g. the current AdminViewerCount widget) just get bucketed under
 * 'default'; wire a real sourceKey through later for a per-stream breakdown.
 */
export async function heartbeatLiveViewer(matchKey: string, cid: string, sourceKey = 'default'): Promise<void> {
    await prisma.liveViewer.deleteMany({ where: { lastSeen: { lt: new Date(Date.now() - LIVE_PRESENCE_TTL_MS) } } });
    await prisma.liveViewer.upsert({
        where: { matchKey_cid: { matchKey, cid } },
        create: { matchKey, sourceKey, cid },
        update: { sourceKey },
    });
}

export interface LiveMatchSummary {
    matchKey: string;
    viewers: number;
    bySource: { sourceKey: string; viewers: number }[];
}

/** Current live matches with viewer counts, for the admin "Live Now" dashboard. */
export async function listLiveMatches(): Promise<LiveMatchSummary[]> {
    const rows = await prisma.liveViewer.findMany({
        where: { lastSeen: { gte: new Date(Date.now() - LIVE_PRESENCE_TTL_MS) } },
        select: { matchKey: true, sourceKey: true },
    });
    const byMatch = new Map<string, Map<string, number>>();
    for (const r of rows) {
        const sources = byMatch.get(r.matchKey) ?? byMatch.set(r.matchKey, new Map()).get(r.matchKey)!;
        sources.set(r.sourceKey, (sources.get(r.sourceKey) ?? 0) + 1);
    }
    return [...byMatch.entries()]
        .map(([matchKey, sources]) => ({
            matchKey,
            viewers: [...sources.values()].reduce((a, b) => a + b, 0),
            bySource: [...sources.entries()]
                .map(([sourceKey, viewers]) => ({ sourceKey, viewers }))
                .sort((a, b) => b.viewers - a.viewers),
        }))
        .sort((a, b) => b.viewers - a.viewers);
}
