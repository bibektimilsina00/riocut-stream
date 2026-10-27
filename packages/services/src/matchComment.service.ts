import { prisma } from '@riocut/db';

/** Allowed reaction types. Anything else is rejected. */
export const REACTION_TYPES = ['like', 'love', 'laugh', 'wow', 'sad', 'fire'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const MAX_LEN = 2000;
const MAX_NAME = 40;

/**
 * A comment author is either a signed-in member (authorKey = userId) or an
 * anonymous guest (authorKey = "guest:<uuid>"). authorKey is the single
 * identity used for ownership + reaction de-duplication.
 */
export interface CommentAuthor {
    authorKey: string;
    authorName: string;
    isGuest: boolean;
    userId: string | null;
}

export interface CommentReactionDTO {
    type: string;
    count: number;
    reacted: boolean;
}

export interface CommentDTO {
    id: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    parentId: string | null;
    author: { name: string; isGuest: boolean };
    reactions: CommentReactionDTO[];
    replies: CommentDTO[];
    canDelete: boolean;
}

interface RawReaction {
    type: string;
    authorKey: string;
}
interface RawComment {
    id: string;
    content: string;
    createdAt: Date;
    isEdited: boolean;
    parentId: string | null;
    authorKey: string;
    authorName: string;
    isGuest: boolean;
    reactions: RawReaction[];
    replies?: RawComment[];
}

const reactionSelect = { select: { type: true, authorKey: true } };

function aggregateReactions(reactions: RawReaction[], viewerKey?: string): CommentReactionDTO[] {
    const counts = new Map<string, { count: number; reacted: boolean }>();
    for (const r of reactions) {
        const entry = counts.get(r.type) ?? { count: 0, reacted: false };
        entry.count += 1;
        if (viewerKey && r.authorKey === viewerKey) entry.reacted = true;
        counts.set(r.type, entry);
    }
    return REACTION_TYPES.filter((t) => counts.has(t)).map((t) => ({ type: t, count: counts.get(t)!.count, reacted: counts.get(t)!.reacted }));
}

function toDTO(c: RawComment, viewerKey?: string, isAdmin = false): CommentDTO {
    return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        isEdited: c.isEdited,
        parentId: c.parentId,
        author: { name: c.authorName, isGuest: c.isGuest },
        reactions: aggregateReactions(c.reactions, viewerKey),
        replies: (c.replies ?? []).map((r) => toDTO(r, viewerKey, isAdmin)),
        canDelete: !!viewerKey && (c.authorKey === viewerKey || isAdmin),
    };
}

/** List threaded comments (newest top-level first, replies oldest first). */
export async function listMatchComments(matchKey: string, viewerKey?: string, isAdmin = false): Promise<CommentDTO[]> {
    const comments = await prisma.matchComment.findMany({
        where: { matchKey, parentId: null },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            reactions: reactionSelect,
            replies: { orderBy: { createdAt: 'asc' }, include: { reactions: reactionSelect } },
        },
    });
    return (comments as unknown as RawComment[]).map((c) => toDTO(c, viewerKey, isAdmin));
}

async function loadThread(id: string): Promise<CommentDTO> {
    const c = await prisma.matchComment.findUniqueOrThrow({
        where: { id },
        include: {
            reactions: reactionSelect,
            replies: { orderBy: { createdAt: 'asc' }, include: { reactions: reactionSelect } },
        },
    });
    return toDTO(c as unknown as RawComment);
}

function cleanName(name: string): string {
    const n = (name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
    return n || 'Guest';
}

export async function createMatchComment(
    author: CommentAuthor,
    input: { matchKey: string; content: string; parentId?: string | null },
): Promise<CommentDTO> {
    const content = (input.content ?? '').trim();
    if (!content) throw new Error('Comment cannot be empty');
    if (content.length > MAX_LEN) throw new Error('Comment too long');
    if (!input.matchKey) throw new Error('Missing matchKey');

    // Replies are only one level deep and must belong to the same match.
    let parentId: string | null = null;
    if (input.parentId) {
        const parent = await prisma.matchComment.findUnique({ where: { id: input.parentId }, select: { id: true, matchKey: true, parentId: true } });
        if (!parent || parent.matchKey !== input.matchKey) throw new Error('Invalid parent comment');
        parentId = parent.parentId ?? parent.id; // attach nested replies to the top-level parent
    }

    const created = await prisma.matchComment.create({
        data: {
            matchKey: input.matchKey,
            authorKey: author.authorKey,
            authorName: author.isGuest ? cleanName(author.authorName) : author.authorName,
            isGuest: author.isGuest,
            userId: author.userId,
            content,
            parentId,
        },
        select: { id: true },
    });
    // Return the top-level thread root so the client can slot the reply in.
    return loadThread(parentId ?? created.id);
}

export async function deleteMatchComment(viewerKey: string, commentId: string, isAdmin = false): Promise<{ matchKey: string }> {
    const comment = await prisma.matchComment.findUnique({ where: { id: commentId }, select: { authorKey: true, matchKey: true } });
    if (!comment) throw new Error('Comment not found');
    if (comment.authorKey !== viewerKey && !isAdmin) throw new Error('Forbidden');
    await prisma.matchComment.delete({ where: { id: commentId } });
    return { matchKey: comment.matchKey };
}

/** Toggle a reaction; returns the updated reaction summary + the match key. */
export async function toggleReaction(
    author: CommentAuthor,
    commentId: string,
    type: string,
): Promise<{ commentId: string; reactions: CommentReactionDTO[]; matchKey: string }> {
    if (!REACTION_TYPES.includes(type as ReactionType)) throw new Error('Invalid reaction type');
    const comment = await prisma.matchComment.findUnique({ where: { id: commentId }, select: { id: true, matchKey: true } });
    if (!comment) throw new Error('Comment not found');

    const existing = await prisma.matchCommentReaction.findUnique({
        where: { commentId_authorKey_type: { commentId, authorKey: author.authorKey, type } },
    });
    if (existing) {
        await prisma.matchCommentReaction.delete({ where: { id: existing.id } });
    } else {
        await prisma.matchCommentReaction.create({ data: { commentId, authorKey: author.authorKey, userId: author.userId, type } });
    }

    const reactions = await prisma.matchCommentReaction.findMany({ where: { commentId }, select: { type: true, authorKey: true } });
    return { commentId, reactions: aggregateReactions(reactions, author.authorKey), matchKey: comment.matchKey };
}
