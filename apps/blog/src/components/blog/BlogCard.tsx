'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, User, Film, Tv, Heart, MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useBlogLikes, useToggleBlogLike, useBlogComments } from '@/lib/hooks/useBlog';

interface BlogCardProps {
    post: {
        id: string;
        slug: string;
        title: string;
        excerpt: string;
        category: string;
        publishedAt: Date | string;
        readingTime: number;
        featuredImage: string | null;
        mediaBackdropPath: string | null;
        mediaType: string | null;
        mediaTitle: string | null;
        author: {
            name: string;
            role?: string;
        };
    };
}

export default function BlogCard({ post }: BlogCardProps) {
    const { data: session, status } = useSession();

    // Fetch likes and comments data
    const { likes, likeCount, isLoading: likesLoading } = useBlogLikes(post.slug);
    const { comments, commentCount, isLoading: commentsLoading } = useBlogComments(post.slug);
    const { toggleLike, isLoading: toggleLoading } = useToggleBlogLike();

    // Check if current user has liked this post
    const isLiked = session?.user?.id ? likes.some(like => like.userId === session.user!.id) : false;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (status !== 'authenticated') {
            alert('Please login to like this post');
            return;
        }

        try {
            await toggleLike(post.slug);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    return (
        <article className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-teal-500/50 transition-all duration-300">
            <Link href={`/blog/${post.slug}`}>
                {/* Featured Image */}
                <div className="relative h-48 bg-gray-800 overflow-hidden">
                    {post.featuredImage || post.mediaBackdropPath ? (
                        <Image
                            src={
                                post.featuredImage ||
                                `https://image.tmdb.org/t/p/w500${post.mediaBackdropPath}`
                            }
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-16 h-16 text-gray-600" />
                        </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-full capitalize">
                            {post.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readingTime} min read
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors line-clamp-2">
                        {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">{post.excerpt}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <User className="w-4 h-4" />
                            {post.author.role === 'admin' ? 'Riocut Admin' : post.author.name}
                        </div>
                        {post.mediaType && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                {post.mediaType === 'movie' ? (
                                    <Film className="w-3 h-3" />
                                ) : (
                                    <Tv className="w-3 h-3" />
                                )}
                                <span className="truncate max-w-[120px]">{post.mediaTitle}</span>
                            </div>
                        )}
                    </div>

                    {/* Like and Comment Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                        <button
                            onClick={handleLike}
                            disabled={toggleLoading || likesLoading}
                            className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${isLiked
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-gray-400 hover:text-red-500'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="font-medium">
                                {likesLoading ? '...' : likeCount}
                            </span>
                        </button>

                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-medium">
                                {commentsLoading ? '...' : commentCount}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
