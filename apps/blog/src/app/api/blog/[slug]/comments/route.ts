/**
 * API Route: Blog Comments
 * GET /api/blog/[slug]/comments - Get all comments for a post
 * POST /api/blog/[slug]/comments - Create a new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

// Get comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Find the blog post
        const post = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Get comments (only top-level comments, replies are nested)
        const comments = await prisma.blogComment.findMany({
            where: {
                postId: post.id,
                parentId: null, // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            comments,
            count: comments.length,
        });
    } catch (error: any) {
        console.error('Get comments error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get comments' },
            { status: 500 }
        );
    }
}

// Create a new comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
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
        const { slug } = await params;
        const body = await request.json();
        const { content, parentId } = body;

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

        // Find the blog post
        const post = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // If parentId is provided, verify it exists
        if (parentId) {
            const parentComment = await prisma.blogComment.findUnique({
                where: { id: parentId },
            });

            if (!parentComment || parentComment.postId !== post.id) {
                return NextResponse.json(
                    { error: 'Parent comment not found' },
                    { status: 404 }
                );
            }
        }

        // Create the comment
        const comment = await prisma.blogComment.create({
            data: {
                postId: post.id,
                userId: userId,
                content: content.trim(),
                parentId: parentId || null,
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
            comment,
        });
    } catch (error: any) {
        console.error('Create comment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create comment' },
            { status: 500 }
        );
    }
}
