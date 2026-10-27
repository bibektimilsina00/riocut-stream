/**
 * API Route: Like/Unlike Blog Post
 * POST /api/blog/[slug]/like
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';

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

        // Check if already liked
        const existingLike = await prisma.blogLike.findUnique({
            where: {
                postId_userId: {
                    postId: post.id,
                    userId: userId,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.blogLike.delete({
                where: { id: existingLike.id },
            });

            // Get updated like count
            const likeCount = await prisma.blogLike.count({
                where: { postId: post.id },
            });

            return NextResponse.json({
                success: true,
                liked: false,
                likeCount,
            });
        } else {
            // Like
            await prisma.blogLike.create({
                data: {
                    postId: post.id,
                    userId: userId,
                },
            });

            // Get updated like count
            const likeCount = await prisma.blogLike.count({
                where: { postId: post.id },
            });

            return NextResponse.json({
                success: true,
                liked: true,
                likeCount,
            });
        }
    } catch (error: any) {
        console.error('Like/Unlike error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to like/unlike post' },
            { status: 500 }
        );
    }
}

// Get like status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();
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

        // Get like count
        const likeCount = await prisma.blogLike.count({
            where: { postId: post.id },
        });

        // Check if current user liked
        let liked = false;
        if (session?.user) {
            const userId = (session.user as any).id;
            const userLike = await prisma.blogLike.findUnique({
                where: {
                    postId_userId: {
                        postId: post.id,
                        userId: userId,
                    },
                },
            });
            liked = !!userLike;
        }

        return NextResponse.json({
            success: true,
            liked,
            likeCount,
        });
    } catch (error: any) {
        console.error('Get like status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get like status' },
            { status: 500 }
        );
    }
}
