/**
 * API Route: Manage Individual Comment
 * PATCH /api/blog/comments/[id] - Update a comment
 * DELETE /api/blog/comments/[id] - Delete a comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

// Update a comment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { error: 'Comment is too long (max 2000 characters)' },
                { status: 400 }
            );
        }

        // Find the comment
        const comment = await prisma.blogComment.findUnique({
            where: { id },
        });

        if (!comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            return NextResponse.json(
                { error: 'You can only edit your own comments' },
                { status: 403 }
            );
        }

        // Update the comment
        const updatedComment = await prisma.blogComment.update({
            where: { id },
            data: {
                content: content.trim(),
                isEdited: true,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            comment: updatedComment,
        });
    } catch (error: any) {
        console.error('Update comment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update comment' },
            { status: 500 }
        );
    }
}

// Delete a comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;
        const { id } = await params;

        // Find the comment
        const comment = await prisma.blogComment.findUnique({
            where: { id },
        });

        if (!comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Check if user owns the comment or is admin
        if (comment.userId !== userId && userRole !== 'admin') {
            return NextResponse.json(
                { error: 'You can only delete your own comments' },
                { status: 403 }
            );
        }

        // Delete the comment (will cascade delete replies)
        await prisma.blogComment.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Comment deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete comment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
