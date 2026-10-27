import { prisma } from '@riocut/db';

export interface TvChannelRef {
    channelId: string;
    name: string;
    logo?: string | null;
    country?: string | null;
}

export async function addFavorite(userId: string, ch: TvChannelRef) {
    return prisma.tvFavorite.upsert({
        where: { userId_channelId: { userId, channelId: ch.channelId } },
        update: { name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
        create: { userId, channelId: ch.channelId, name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
    });
}

export async function removeFavorite(userId: string, channelId: string) {
    await prisma.tvFavorite.deleteMany({ where: { userId, channelId } });
    return { ok: true };
}

export async function listFavorites(userId: string) {
    return prisma.tvFavorite.findMany({ where: { userId }, orderBy: { addedAt: 'desc' } });
}

export async function recordRecent(userId: string, ch: TvChannelRef) {
    return prisma.tvRecent.upsert({
        where: { userId_channelId: { userId, channelId: ch.channelId } },
        update: { name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
        create: { userId, channelId: ch.channelId, name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
    });
}

export async function listRecent(userId: string, limit = 20) {
    return prisma.tvRecent.findMany({ where: { userId }, orderBy: { watchedAt: 'desc' }, take: limit });
}
