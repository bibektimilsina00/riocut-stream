'use client';

import { useState } from 'react';
import { RotateCcw, TrendingUp, Info } from 'lucide-react';
import { useBlogGenerationProgress, useResetBlogProgress } from '@/lib/hooks/useBlog';

interface ProgressRecord {
    id: string;
    mediaType: string;
    sortBy: string;
    currentPage: number;
    currentIndex: number;
    totalGenerated: number;
    lastMediaId: number | null;
    lastUpdated: string;
}

export function BlogGenerationProgress() {
    const [resetLoading, setResetLoading] = useState<string | null>(null);

    // React Query hooks
    const { progress, isLoading } = useBlogGenerationProgress();
    const resetProgressMutation = useResetBlogProgress();

    const handleReset = async () => {
        setResetLoading('progress');

        try {
            await resetProgressMutation.resetProgress();
        } catch (error) {
            console.error('Failed to reset progress:', error);
        } finally {
            setResetLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-800 rounded w-1/4 mb-4"></div>
                    <div className="h-20 bg-gray-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
            </div>

            {progress.status === 'idle' ? (
                <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active generation process</p>
                    <p className="text-sm mt-1">Start generating to see progress</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Status:</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${progress.status === 'running' ? 'bg-teal-500/20 text-teal-400' :
                                progress.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    progress.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                            }`}>
                            {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Progress:</span>
                            <span className="text-white">{progress.current} / {progress.total}</span>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>

                        <div className="text-center text-xs text-gray-500">
                            {progress.percentage.toFixed(1)}% complete
                        </div>
                    </div>

                    {progress.currentItem && (
                        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Currently processing:</div>
                            <div className="text-sm text-white">
                                {progress.currentItem.title || progress.currentItem.name || 'Unknown item'}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button
                            onClick={handleReset}
                            disabled={resetLoading === 'progress'}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                            title="Reset progress"
                        >
                            <RotateCcw className={`w-4 h-4 ${resetLoading === 'progress' ? 'animate-spin' : ''}`} />
                            Reset Progress
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}