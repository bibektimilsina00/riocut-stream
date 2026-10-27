/**
 * Tiny bridge so app-router route handlers can broadcast comment events to
 * Socket.IO clients without importing the full socket server (or socket.io).
 *
 * The Socket.IO server (pages/api/socketio) and the app-router routes are
 * bundled separately by Next, so a plain module-level singleton would NOT be
 * shared between them. We stash the emitter on `globalThis`, which is shared
 * across all bundles in the same Node process.
 */

type Emitter = { to: (room: string) => { emit: (event: string, payload: unknown) => void } };

const KEY = '__riocutCommentIo';

export function setCommentIo(io: Emitter): void {
    (globalThis as unknown as Record<string, unknown>)[KEY] = io;
}

function getIo(): Emitter | undefined {
    return (globalThis as unknown as Record<string, Emitter | undefined>)[KEY];
}

export function commentRoom(matchKey: string): string {
    return `comments:${matchKey}`;
}

export type CommentEvent = 'comment:new' | 'comment:deleted' | 'comment:reactions';

/** Broadcast a comment event to everyone viewing this match. Best-effort. */
export function emitComment(matchKey: string, event: CommentEvent, payload: unknown): void {
    try {
        getIo()?.to(commentRoom(matchKey)).emit(event, payload);
    } catch {
        // socket server not initialised yet — clients still get it on next fetch
    }
}
