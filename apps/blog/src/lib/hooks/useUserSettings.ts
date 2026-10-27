'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface AISettings {
    geminiApiKey: string;
    openaiApiKey: string;
    anthropicApiKey: string;
    tmdbApiKey: string;
    preferredAiModel: string;
    hasGeminiKey: boolean;
    hasOpenaiKey: boolean;
    hasAnthropicKey: boolean;
    hasTmdbKey: boolean;
}

// Fetch AI settings from API
const fetchAISettings = async (): Promise<AISettings> => {
    const response = await fetch('/api/admin/settings/ai');
    if (!response.ok) {
        throw new Error('Failed to fetch AI settings');
    }
    return response.json();
};

// Update AI settings via API
const updateAISettings = async (settings: Partial<AISettings>): Promise<any> => {
    const response = await fetch('/api/admin/settings/ai', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update AI settings');
    }

    return response.json();
};

// Hook for AI settings management
export function useAISettings() {
    const { data: session } = useSession();

    return useQuery({
        queryKey: ['aiSettings'],
        queryFn: fetchAISettings,
        enabled: !!session?.user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}

// Separate hook for updating AI settings (for component convenience)
export function useUpdateAISettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAISettings,
        onSuccess: () => {
            // Invalidate and refetch AI settings
            queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
        },
        onError: (error) => {
            console.error('Failed to update AI settings:', error);
        },
    });
}

// Hook for user preferences
export function useUserPreferences() {
    const { data: session } = useSession();
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        language: 'en',
        notifications: true,
        autoSave: true,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // TODO: Load user preferences from API/database
        // For now, use defaults
    }, [session]);

    const updatePreference = async (key: string, value: any) => {
        setIsLoading(true);
        try {
            // TODO: Save preference to API/database
            setPreferences(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Failed to update preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        preferences,
        updatePreference,
        isLoading,
    };
}