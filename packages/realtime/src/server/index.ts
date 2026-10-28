import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../types/socket';
import {
    addRoomParticipant,
    removeRoomParticipant,
    saveChatMessage,
    updateRoomActivity,
    moderateChatMessage,
    clientIp,
} from '@riocut/services';
import { setCommentIo, commentRoom } from './commentBus';

/** Same chat guardrails as the match live chat; refusals go back to the sender only. */
function moderate(socket: { handshake: { headers: Record<string, string | string[] | undefined>; address: string }; emit: (ev: string, data: unknown) => void }, identity: string, text: unknown) {
    const header = (name: string) => {
        const v = socket.handshake.headers[name];
        return Array.isArray(v) ? v[0] : v;
    };
    const mod = moderateChatMessage(identity, clientIp(header) ?? socket.handshake.address, typeof text === 'string' ? text : '');
    if (!mod.ok) socket.emit('chat-error', { error: mod.error });
    return mod;
}

export const config = {
    api: {
        bodyParser: false,
    },
};

interface WatchParty {
    id: string;
    host: string;
    movieTitle: string;
    videoUrl: string;
    users: Map<string, { id: string; name: string }>;
    currentTime: number;
    isPlaying: boolean;
}

interface WatchTogetherRoom {
    roomCode: string;
    hostUsername: string;
    movieTitle: string;
    embedUrl: string;
    participants: Map<string, {
        id: string;
        username: string;
        userId?: string;
        participantDbId?: string; // Database ID for participant
        hasVideo: boolean;
        hasAudio: boolean;
    }>;
    messages: Array<{
        id: string;
        username: string;
        message: string;
        timestamp: number;
    }>;
    createdAt: number;
}

const watchParties = new Map<string, WatchParty>();
const watchTogetherRooms = new Map<string, WatchTogetherRoom>();

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const httpServer = res.socket.server as any as NetServer;
        const io = new SocketIOServer(httpServer, {
            path: '/api/socketio',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        res.socket.server.io = io;
        setCommentIo(io);

        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // ---- match comments: clients join a per-match room to receive
            // live comment/reaction updates (writes still go via the REST API).
            socket.on('join-comments', ({ matchKey }: { matchKey?: string }) => {
                if (matchKey) socket.join(commentRoom(matchKey));
            });
            socket.on('leave-comments', ({ matchKey }: { matchKey?: string }) => {
                if (matchKey) socket.leave(commentRoom(matchKey));
            });

            // Create a new watch party
            socket.on('create-party', ({ movieTitle, videoUrl, userName }) => {
                const partyId = Math.random().toString(36).substring(7);
                const party: WatchParty = {
                    id: partyId,
                    host: socket.id,
                    movieTitle,
                    videoUrl,
                    users: new Map([[socket.id, { id: socket.id, name: userName }]]),
                    currentTime: 0,
                    isPlaying: false,
                };

                watchParties.set(partyId, party);
                socket.join(partyId);

                socket.emit('party-created', {
                    partyId,
                    partyData: {
                        ...party,
                        users: Array.from(party.users.values()),
                    },
                });

                console.log(`Party created: ${partyId}`);
            });

            // Join an existing watch party
            socket.on('join-party', ({ partyId, userName }) => {
                const party = watchParties.get(partyId);

                if (!party) {
                    socket.emit('party-error', { message: 'Party not found' });
                    return;
                }

                party.users.set(socket.id, { id: socket.id, name: userName });
                socket.join(partyId);

                // Notify user who joined
                socket.emit('party-joined', {
                    partyId,
                    partyData: {
                        ...party,
                        users: Array.from(party.users.values()),
                    },
                });

                // Notify other users in the party
                socket.to(partyId).emit('user-joined', {
                    user: { id: socket.id, name: userName },
                    users: Array.from(party.users.values()),
                });

                console.log(`User ${userName} joined party: ${partyId}`);
            });

            // Sync play/pause
            socket.on('play-pause', ({ partyId, isPlaying, currentTime }) => {
                const party = watchParties.get(partyId);
                if (!party) return;

                party.isPlaying = isPlaying;
                party.currentTime = currentTime;

                socket.to(partyId).emit('sync-play-pause', { isPlaying, currentTime });
            });

            // Sync seek
            socket.on('seek', ({ partyId, currentTime }) => {
                const party = watchParties.get(partyId);
                if (!party) return;

                party.currentTime = currentTime;
                socket.to(partyId).emit('sync-seek', { currentTime });
            });

            // Send chat message
            socket.on('chat-message', ({ partyId, message, userName }) => {
                const mod = moderate(socket, socket.id, message);
                if (!mod.ok) return;
                io.to(partyId).emit('chat-message', {
                    message: mod.text,
                    userName,
                    timestamp: Date.now(),
                });
            });

            // Watch Together - Join room
            socket.on('join-watch-together', async ({ roomCode, username, userId }) => {
                console.log(`📥 User ${username} joining room ${roomCode} with socket ${socket.id}, userId: ${userId || 'guest'}`);

                let room = watchTogetherRooms.get(roomCode);

                if (!room) {
                    console.log(`🆕 Creating new room: ${roomCode}`);
                    // Create room if it doesn't exist
                    room = {
                        roomCode,
                        hostUsername: username,
                        movieTitle: '',
                        embedUrl: '',
                        participants: new Map(),
                        messages: [],
                        createdAt: Date.now()
                    };
                    watchTogetherRooms.set(roomCode, room);
                }

                // Remove and disconnect any previous participant with the same userId
                // Only do this if userId is not null (to avoid matching all guests)
                if (userId) {
                    for (const [sid, participant] of room.participants.entries()) {
                        if (participant.userId && participant.userId === userId) {
                            console.log(`🔄 Disconnecting duplicate participant with userId ${userId} (socket ${sid})`);
                            room.participants.delete(sid);
                            const oldSocket = io.sockets.sockets.get(sid);
                            if (oldSocket) {
                                oldSocket.emit('force-disconnect', { reason: 'Another session joined with your account.' });
                                oldSocket.disconnect(true);
                            }
                        }
                    }
                }

                // Check if this socket is already in the room
                if (room.participants.has(socket.id)) {
                    console.log(`⚠️ Socket ${socket.id} already in room, skipping duplicate join`);
                    socket.emit('room-joined', {
                        roomCode,
                        participants: Array.from(room.participants.values()),
                        messages: room.messages
                    });
                    return;
                }

                // Save participant to database
                let participantDbId: string | undefined;
                try {
                    console.log(`💾 Saving participant ${username} to database...`);
                    const dbParticipant = await addRoomParticipant(roomCode, username, userId);
                    participantDbId = dbParticipant.id;
                    console.log(`✅ Participant saved with DB ID: ${participantDbId}`);
                } catch (error) {
                    console.error('❌ Error saving participant to database:', error);
                }

                // Add participant to in-memory room
                room.participants.set(socket.id, {
                    id: socket.id,
                    username,
                    userId,
                    participantDbId,
                    hasVideo: false,
                    hasAudio: true
                });

                socket.join(roomCode);
                console.log(`✅ User ${username} joined room ${roomCode}, total participants: ${room.participants.size}`);

                // Send room data to the user
                const roomData = {
                    roomCode,
                    participants: Array.from(room.participants.values()),
                    messages: room.messages
                };
                console.log(`📤 Emitting room-joined to ${socket.id}:`, roomData);
                socket.emit('room-joined', roomData);

                // Notify others
                socket.to(roomCode).emit('participant-joined', {
                    participants: Array.from(room.participants.values()),
                    newParticipant: {
                        id: socket.id,
                        username
                    }
                });
                console.log(`📢 Notified other participants about ${username} joining`);
            });

            // Watch Together - Leave room
            socket.on('leave-watch-together', async ({ roomCode, username }) => {
                const room = watchTogetherRooms.get(roomCode);
                if (!room) return;

                const participant = room.participants.get(socket.id);

                // Mark participant as left in database
                if (participant?.participantDbId) {
                    try {
                        await removeRoomParticipant(participant.participantDbId);
                    } catch (error) {
                        console.error('Error marking participant as left:', error);
                    }
                }

                room.participants.delete(socket.id);
                socket.leave(roomCode);

                // Notify others
                socket.to(roomCode).emit('participant-left', {
                    participants: Array.from(room.participants.values()),
                    participantId: socket.id,
                    username
                });

                // Delete room if empty
                if (room.participants.size === 0) {
                    watchTogetherRooms.delete(roomCode);
                    console.log(`Watch Together room deleted: ${roomCode}`);
                }
            });

            // Watch Together - Send chat message
            socket.on('send-chat-message', async ({ roomCode, message }) => {
                const room = watchTogetherRooms.get(roomCode);
                if (!room) return;

                const mod = moderate(socket, room.participants.get(socket.id)?.userId || socket.id, message?.message);
                if (!mod.ok) return;
                message = { ...message, message: mod.text };
                room.messages.push(message);

                // Send to everyone in the room INCLUDING the sender
                // This ensures all clients (including sender) receive the message
                io.to(roomCode).emit('chat-message', message);

                // Save message to database
                try {
                    const participant = room.participants.get(socket.id);
                    const roomData = await import('@riocut/services').then(m =>
                        m.getWatchRoomByCode(roomCode)
                    );

                    if (roomData) {
                        await saveChatMessage({
                            roomId: roomData.id,
                            userId: participant?.userId,
                            username: message.username,
                            message: message.message,
                        });

                        // Update room activity
                        await updateRoomActivity(roomCode);
                    }
                } catch (error) {
                    console.error('Error saving chat message:', error);
                }
            });

            // Watch Together - Update media status
            socket.on('update-media-status', ({ roomCode, hasVideo, hasAudio }) => {
                console.log(`🎬 [MEDIA UPDATE] Socket: ${socket.id}, Room: ${roomCode}, Video: ${hasVideo}, Audio: ${hasAudio}`);

                const room = watchTogetherRooms.get(roomCode);
                if (!room) {
                    console.error(`❌ [MEDIA ERROR] Room not found: ${roomCode}`);
                    return;
                }

                const participant = room.participants.get(socket.id);
                if (participant) {
                    const oldVideo = participant.hasVideo;
                    const oldAudio = participant.hasAudio;

                    participant.hasVideo = hasVideo;
                    participant.hasAudio = hasAudio;

                    console.log(`✅ [MEDIA UPDATED] ${participant.username}: Video ${oldVideo}→${hasVideo}, Audio ${oldAudio}→${hasAudio}`);
                    console.log(`📊 [ROOM STATE] Room: ${roomCode}, Total participants: ${room.participants.size}`);

                    // Log all participants' media status
                    room.participants.forEach((p, socketId) => {
                        console.log(`  - ${p.username} (${socketId.substring(0, 8)}...): Video=${p.hasVideo}, Audio=${p.hasAudio}`);
                    });

                    // Notify others
                    console.log(`📤 [BROADCAST] Notifying other participants about ${participant.username}'s media update`);
                    socket.to(roomCode).emit('participant-updated', {
                        participantId: socket.id,
                        hasVideo,
                        hasAudio,
                        username: participant.username
                    });
                } else {
                    console.error(`❌ [MEDIA ERROR] Participant not found in room: ${roomCode}`);
                }
            });

            // Watch Together - Typing indicators
            socket.on('typing', ({ roomCode, username }) => {
                socket.to(roomCode).emit('user-typing', { username });
            });

            socket.on('stop-typing', ({ roomCode, username }) => {
                socket.to(roomCode).emit('user-stopped-typing', { username });
            });

            // Watch Together - WebRTC Signaling
            socket.on('webrtc-offer', ({ roomCode, to, offer }) => {
                console.log(`🎥 [WEBRTC OFFER] From: ${socket.id.substring(0, 8)}... → To: ${to.substring(0, 8)}... (Room: ${roomCode})`);
                console.log(`   Offer type: ${offer.type}, SDP length: ${offer.sdp?.length || 0}`);
                socket.to(to).emit('webrtc-offer', {
                    from: socket.id,
                    offer
                });
            });

            socket.on('webrtc-answer', ({ roomCode, to, answer }) => {
                console.log(`🎤 [WEBRTC ANSWER] From: ${socket.id.substring(0, 8)}... → To: ${to.substring(0, 8)}... (Room: ${roomCode})`);
                console.log(`   Answer type: ${answer.type}, SDP length: ${answer.sdp?.length || 0}`);
                socket.to(to).emit('webrtc-answer', {
                    from: socket.id,
                    answer
                });
            });

            socket.on('webrtc-ice-candidate', ({ roomCode, to, candidate }) => {
                console.log(`❄️ [ICE CANDIDATE] From: ${socket.id.substring(0, 8)}... → To: ${to.substring(0, 8)}... (Room: ${roomCode})`);
                console.log(`   Candidate: ${candidate.candidate?.substring(0, 50)}...`);
                socket.to(to).emit('webrtc-ice-candidate', {
                    from: socket.id,
                    candidate
                });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);

                // Remove user from all parties
                watchParties.forEach((party, partyId) => {
                    if (party.users.has(socket.id)) {
                        const user = party.users.get(socket.id);
                        party.users.delete(socket.id);

                        // Notify other users
                        socket.to(partyId).emit('user-left', {
                            userId: socket.id,
                            userName: user?.name,
                            users: Array.from(party.users.values()),
                        });

                        // Delete party if empty
                        if (party.users.size === 0) {
                            watchParties.delete(partyId);
                            console.log(`Party deleted: ${partyId}`);
                        }
                    }
                });

                // Remove from Watch Together rooms
                watchTogetherRooms.forEach(async (room, roomCode) => {
                    if (room.participants.has(socket.id)) {
                        const participant = room.participants.get(socket.id);

                        // Mark participant as left in database
                        if (participant?.participantDbId) {
                            try {
                                await removeRoomParticipant(participant.participantDbId);
                            } catch (error) {
                                console.error('Error marking participant as left on disconnect:', error);
                            }
                        }

                        room.participants.delete(socket.id);

                        // Notify others
                        socket.to(roomCode).emit('participant-left', {
                            participants: Array.from(room.participants.values()),
                            participantId: socket.id,
                            username: participant?.username
                        });

                        // Delete room if empty
                        if (room.participants.size === 0) {
                            watchTogetherRooms.delete(roomCode);
                            console.log(`Watch Together room deleted: ${roomCode}`);
                        }
                    }
                });
            });
        });
    }
    res.end();
};

export default SocketHandler;
export const createSocketHandler = () => SocketHandler;

