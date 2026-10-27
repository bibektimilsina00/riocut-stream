'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface BlogLike {
    id: string;
    userId: string;
    blogPostId: string;
    createdAt: Date;
}

interface BlogComment {
    id: string;
    content: string;
    userId: string;
    blogPostId: string;
    createdAt: Date;
    user: {
        name: string;
        email: string;
    };
}

// Hook for managing blog likes
export function useBlogLikes(blogPostId: string) {
    const [likes, setLikes] = useState<BlogLike[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // TODO: Fetch likes from API
        // For now, return empty array
        setLikes([]);
    }, [blogPostId]);

    return {
        likes,
        likeCount: likes.length,
        isLoading,
        error,
    };
}

// Hook for toggling blog likes
export function useToggleBlogLike() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const toggleLike = async (blogPostId: string) => {
        if (!session?.user) {
            throw new Error('Please login to like posts');
        }

        setIsLoading(true);
        try {
            // TODO: Implement API call to toggle like
            console.log('Toggling like for post:', blogPostId);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            return { success: true };
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        toggleLike,
        isLoading,
    };
}

// Hook for managing blog comments
export function useBlogComments(blogPostId: string) {
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // TODO: Fetch comments from API
        // For now, return empty array
        setComments([]);
    }, [blogPostId]);

    const addComment = async (content: string) => {
        // TODO: Implement API call to add comment
        console.log('Adding comment:', content);
        return { success: true };
    };

    return {
        comments,
        commentCount: comments.length,
        isLoading,
        error,
        addComment,
    };
}

// Hook for checking if user has liked a post
export function useUserBlogLike(blogPostId: string) {
    const { data: session } = useSession();
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!session?.user || !blogPostId) {
            setIsLiked(false);
            return;
        }

        // TODO: Check if user has liked this post
        // For now, return false
        setIsLiked(false);
    }, [session, blogPostId]);

    return {
        isLiked,
        isLoading,
    };
}

// Hook for blog generation status
export function useGenerationStatus() {
    const { data: session, status: sessionStatus } = useSession();
    const [status, setStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStatus = async () => {
        // Don't fetch if not authenticated
        if (sessionStatus !== 'authenticated' || !session?.user) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/blog/auto-generate/status');

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                console.error('Non-JSON response received:', response.status, await response.text());
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            } else {
                const errorData = await response.json();
                console.error('API error:', errorData);
            }
        } catch (error) {
            console.error('Error fetching generation status:', error);
            // Set default status to prevent UI issues
            setStatus({
                isRunning: false,
                mode: 'batch',
                sortBy: 'auto',
                total: 0,
                completed: 0,
                failed: 0,
                skipped: 0,
                currentMovie: null,
                errors: [],
                logs: [],
                startTime: null,
                lastGeneratedAt: null,
                postsPerHour: 2,
                nextScheduledAt: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Poll status every 2 seconds, but only when authenticated
    useEffect(() => {
        if (sessionStatus === 'authenticated' && session?.user) {
            fetchStatus();
            const interval = setInterval(fetchStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [sessionStatus, session]);

    return {
        data: status,
        isLoading,
        refetch: fetchStatus,
    };
}

// Hook for starting blog generation
export function useStartGeneration() {
    const [isLoading, setIsLoading] = useState(false);

    const startGeneration = async (options: any) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/blog/auto-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response received:', response.status, text);
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start generation');
            }

            return data;
        } catch (error) {
            console.error('Failed to start generation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        startGeneration,
        isLoading,
    };
}

// Hook for stopping blog generation
export function useStopGeneration() {
    const [isLoading, setIsLoading] = useState(false);

    const stopGeneration = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/blog/auto-generate/stop', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to stop generation');
            }

            return data;
        } catch (error) {
            console.error('Failed to stop generation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        stopGeneration,
        isLoading,
    };
}

// Hook for blog generation progress
export function useBlogGenerationProgress() {
    const [progress, setProgress] = useState({
        current: 0,
        total: 0,
        percentage: 0,
        status: 'idle' as 'idle' | 'running' | 'completed' | 'error',
        currentItem: null as any,
    });

    return {
        progress,
        isLoading: false,
    };
}

// Hook for resetting blog progress
export function useResetBlogProgress() {
    const [isLoading, setIsLoading] = useState(false);

    const resetProgress = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement reset progress API call
            console.log('Resetting blog progress');
        } catch (error) {
            console.error('Failed to reset progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        resetProgress,
        isLoading,
    };
}