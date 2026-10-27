'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AdminStats {
    totalUsers: number;
    totalMovies: number;
    totalTvShows: number;
    recentActivity: number;
    isLoading: boolean;
    error: string | null;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ContentSource {
    id: string;
    name: string;
    slug: string;
    baseUrl: string;
    movieTemplate: string;
    tvTemplate: string;
    quality: string;
    description?: string | null;
    logoUrl?: string | null;
    homepage?: string | null;
    isEnabled: boolean;
    isDefault: boolean;
    sortOrder: number;
    supportsImdb: boolean;
    supportsTmdb: boolean;
    hasMultiQuality: boolean;
    hasSubtitles: boolean;
    hasAutoplay: boolean;
    lastChecked?: string | null;
    lastResponseTime?: number | null;
    lastStatus?: string | null;
    status?: 'active' | 'inactive' | 'testing' | 'error' | 'healthy' | 'degraded' | 'offline';
    responseTime?: number;
    errorMessage?: string;
}


export function useAdmin() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalMovies: 0,
        totalTvShows: 0,
        recentActivity: 0,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setStats(prev => ({ ...prev, isLoading: true, error: null }));

                // Since we're on client side, we'll need to create API routes for these
                const response = await fetch('/api/admin/stats');
                if (!response.ok) {
                    throw new Error('Failed to fetch admin stats');
                }

                const data = await response.json();
                setStats({
                    totalUsers: data.totalUsers || 0,
                    totalMovies: data.totalMovies || 0,
                    totalTvShows: data.totalTvShows || 0,
                    recentActivity: data.recentActivity || 0,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                setStats(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                }));
            }
        };

        fetchStats();
    }, []);

    return stats;
}

export function useStatsOverview() {
    return useQuery({
        queryKey: ['admin', 'stats', 'overview'],
        queryFn: async () => {
            const response = await fetch('/api/admin/stats/overview');
            if (!response.ok) {
                throw new Error('Failed to fetch stats overview');
            }
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

// Users management hooks using React Query
export function useUsers(page?: number, searchTerm?: string, role?: string) {
    return useQuery({
        queryKey: ['admin', 'users', page, searchTerm, role],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (page) params.append('page', page.toString());
            if (searchTerm) params.append('search', searchTerm);
            if (role && role !== 'all') params.append('role', role);

            const response = await fetch(`/api/admin/users?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch users data
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

export function useUpdateUserBanStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
            const response = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isBanned }),
            });
            if (!response.ok) {
                throw new Error('Failed to update user ban status');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch users data
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Content sources management hooks
export function useContentSources() {
    return useQuery({
        queryKey: ['admin', 'content', 'sources'],
        queryFn: async () => {
            const response = await fetch('/api/admin/content/sources');
            if (!response.ok) {
                throw new Error('Failed to fetch content sources');
            }
            const data = await response.json();
            return data.sources || [];
        },
    });
}

export function useUpdateContentSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sourceId, isEnabled }: { sourceId: string; isEnabled: boolean }) => {
            const response = await fetch(`/api/admin/content/sources/${sourceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isEnabled }),
            });
            if (!response.ok) {
                throw new Error('Failed to update content source');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch content sources data
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'sources'] });
        },
    });
}

export function useTestContentSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sourceId: string) => {
            const response = await fetch(`/api/admin/content/sources/${sourceId}/test`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to test content source');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch content sources data
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'sources'] });
        },
    });
}