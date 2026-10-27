import { prisma } from '@riocut/db';
import type { MediaTypeId } from './types';

export interface CreateWatchRoomData {
    roomCode: string;
    creatorId: string;
    mediaId: number;
    mediaType: MediaTypeId;
    mediaTitle: string;
    embedUrl?: string | null;
    posterPath?: string | null;
    season?: number | null;
    episode?: number | null;
    sport?: string | null;
    league?: string | null;
    matchExternalId?: string | null;
    kickoffAt?: Date | null;
}

export interface ChatMessageData {
    roomId: string;
    userId?: string;
    username: string;
    message: string;
}

/**
 * Create a new watch room
 */
export async function createWatchRoom(data: CreateWatchRoomData) {
    try {
        console.log('🎬 Creating watch room:', {
            roomCode: data.roomCode,
            mediaTitle: data.mediaTitle,
            embedUrl: data.embedUrl ? 'present' : 'missing'
        });

        const room = await prisma.watchRoom.create({
            data: {
                roomCode: data.roomCode,
                creatorId: data.creatorId,
                mediaId: data.mediaId,
                mediaType: data.mediaType,
                mediaTitle: data.mediaTitle,
                embedUrl: data.embedUrl ?? undefined,
                posterPath: data.posterPath ?? undefined,
                season: data.season ?? undefined,
                episode: data.episode ?? undefined,
                sport: data.sport ?? undefined,
                league: data.league ?? undefined,
                matchExternalId: data.matchExternalId ?? undefined,
                kickoffAt: data.kickoffAt ?? undefined,
            },
        });

        console.log('✅ Watch room created successfully:', room.id, 'with embedUrl:', room.embedUrl ? 'present' : 'missing');

        return room;
    } catch (error) {
        console.error('❌ Error creating watch room:', error);
        throw new Error('Failed to create watch room');
    }
}

/**
 * Get watch room by code
 */
export async function getWatchRoomByCode(roomCode: string) {
    try {
        console.log('🔍 Fetching watch room by code:', roomCode);

        const room = await prisma.watchRoom.findUnique({
            where: { roomCode },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                participants: {
                    where: {
                        leftAt: null, // Only active participants
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });

        if (room) {
            console.log('✅ Watch room found:', room.id, 'embedUrl:', room.embedUrl ? 'present' : 'missing');
        } else {
            console.log('❌ Watch room not found for code:', roomCode);
        }

        return room;
    } catch (error) {
        console.error('Error fetching watch room:', error);
        throw new Error('Failed to fetch watch room');
    }
}

/**
 * Get user's watch room history
 */
export async function getUserWatchRooms(userId: string, limit = 10) {
    try {
        const rooms = await prisma.watchRoom.findMany({
            where: {
                OR: [
                    { creatorId: userId },
                    {
                        participants: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                ],
            },
            orderBy: { lastActiveAt: 'desc' },
            take: limit,
            include: {
                creator: {
                    select: {
                        name: true,
                    },
                },
                participants: {
                    where: {
                        leftAt: null,
                    },
                },
            },
        });

        return rooms;
    } catch (error) {
        console.error('Error fetching user watch rooms:', error);
        throw new Error('Failed to fetch watch rooms');
    }
}

/**
 * Update room last active time
 */
export async function updateRoomActivity(roomCode: string) {
    try {
        await prisma.watchRoom.update({
            where: { roomCode },
            data: { lastActiveAt: new Date() },
        });
    } catch (error) {
        console.error('Error updating room activity:', error);
    }
}

/**
 * Close a watch room
 */
export async function closeWatchRoom(roomCode: string) {
    try {
        await prisma.watchRoom.update({
            where: { roomCode },
            data: {
                isActive: false,
                lastActiveAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error closing watch room:', error);
        throw new Error('Failed to close watch room');
    }
}

/**
 * Add participant to room
 */
export async function addRoomParticipant(
    roomCode: string,
    username: string,
    userId?: string
) {
    try {
        const room = await prisma.watchRoom.findUnique({
            where: { roomCode },
        });

        if (!room) {
            throw new Error('Room not found');
        }

        const participant = await prisma.roomParticipant.create({
            data: {
                roomId: room.id,
                userId,
                username,
            },
        });

        // Update room activity
        await updateRoomActivity(roomCode);

        return participant;
    } catch (error) {
        console.error('Error adding participant:', error);
        throw new Error('Failed to add participant');
    }
}

/**
 * Mark participant as left
 */
export async function removeRoomParticipant(participantId: string) {
    try {
        await prisma.roomParticipant.update({
            where: { id: participantId },
            data: { leftAt: new Date() },
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing participant:', error);
        throw new Error('Failed to remove participant');
    }
}

/**
 * Save chat message
 */
export async function saveChatMessage(data: ChatMessageData) {
    try {
        const message = await prisma.chatMessage.create({
            data: {
                roomId: data.roomId,
                userId: data.userId,
                username: data.username,
                message: data.message,
            },
        });

        return message;
    } catch (error) {
        console.error('Error saving chat message:', error);
        throw new Error('Failed to save chat message');
    }
}

/**
 * Get chat history for a room
 */
export async function getChatHistory(roomCode: string, limit = 50) {
    try {
        const room = await prisma.watchRoom.findUnique({
            where: { roomCode },
        });

        if (!room) {
            throw new Error('Room not found');
        }

        const messages = await prisma.chatMessage.findMany({
            where: { roomId: room.id },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });

        return messages;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw new Error('Failed to fetch chat history');
    }
}

/**
 * Get active rooms count
 */
export async function getActiveRoomsCount() {
    try {
        const count = await prisma.watchRoom.count({
            where: { isActive: true },
        });

        return count;
    } catch (error) {
        console.error('Error getting active rooms count:', error);
        return 0;
    }
}

/**
 * Clean up old inactive rooms (cleanup job)
 */
export async function cleanupInactiveRooms(hoursInactive = 24) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursInactive);

        const result = await prisma.watchRoom.updateMany({
            where: {
                isActive: true,
                lastActiveAt: {
                    lt: cutoffDate,
                },
            },
            data: {
                isActive: false,
            },
        });

        return { cleaned: result.count };
    } catch (error) {
        console.error('Error cleaning up inactive rooms:', error);
        return { cleaned: 0 };
    }
}
