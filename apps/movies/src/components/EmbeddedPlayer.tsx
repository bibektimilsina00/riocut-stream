'use client';

import { useState, useEffect } from 'react';
import { X, Maximize, Minimize, ChevronDown, Loader2 } from 'lucide-react';

interface VideoProvider {
    id: string;
    name: string;
    slug: string;
    quality: string;
    isDefault: boolean;
    movieTemplate: string;
    tvTemplate: string;
    description?: string | null;
}

interface EmbeddedPlayerProps {
    title: string;
    embedUrl: string;
    onClose: () => void;
    type: 'movie' | 'tv';
    tmdbId: number;
    season?: number;
    episode?: number;
}

export default function EmbeddedPlayer({
    title,
    embedUrl: initialUrl,
    onClose,
    type,
    tmdbId,
    season,
    episode
}: EmbeddedPlayerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [providers, setProviders] = useState<VideoProvider[]>([]);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [showSourceMenu, setShowSourceMenu] = useState(false);
    const [embedUrl, setEmbedUrl] = useState(initialUrl);
    const [isPlayerLoading, setIsPlayerLoading] = useState(true);
    const [providersLoading, setProvidersLoading] = useState(true);

    // Fetch video providers
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const response = await fetch('/api/video-providers');
                if (response.ok) {
                    const data = await response.json();
                    setProviders(data);

                    // Set default provider as current
                    const defaultIndex = data.findIndex((p: VideoProvider) => p.isDefault);
                    if (defaultIndex !== -1) {
                        setCurrentSourceIndex(defaultIndex);
                    }
                }
            } catch (error) {
                console.error('Error fetching video providers:', error);
            } finally {
                setProvidersLoading(false);
            }
        };

        fetchProviders();
    }, []);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changeSource = (index: number) => {
        setIsPlayerLoading(true);
        setCurrentSourceIndex(index);
        const source = providers[index];

        let newUrl: string;
        if (type === 'movie') {
            newUrl = source.movieTemplate.replace('{tmdbId}', tmdbId.toString());
        } else {
            newUrl = source.tvTemplate
                .replace('{tmdbId}', tmdbId.toString())
                .replace('{season}', season?.toString() || '1')
                .replace('{episode}', episode?.toString() || '1');
        }

        setEmbedUrl(newUrl);
        setShowSourceMenu(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex-1">
                    <h2 className="text-white text-xl font-semibold truncate">
                        {title}
                    </h2>
                    {type === 'tv' && season && episode && (
                        <p className="text-gray-400 text-sm">
                            Season {season}, Episode {episode}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Source Selector */}
                    {!providersLoading && providers.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowSourceMenu(!showSourceMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                <span className="text-sm">
                                    {providers[currentSourceIndex]?.name || 'Select Source'}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showSourceMenu && (
                                <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[200px] z-50">
                                    <div className="p-2">
                                        <div className="text-xs text-gray-400 px-3 py-2">
                                            Select Server
                                        </div>
                                        {providers.map((source, index) => (
                                            <button
                                                key={source.id}
                                                onClick={() => changeSource(index)}
                                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors ${currentSourceIndex === index
                                                    ? 'bg-teal-600 text-white'
                                                    : 'text-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{source.name}</span>
                                                    <span className="text-xs bg-green-600 px-2 py-0.5 rounded">
                                                        {source.quality}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fullscreen */}
                    <button
                        onClick={handleFullscreen}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-5 h-5 text-white" />
                        ) : (
                            <Maximize className="w-5 h-5 text-white" />
                        )}
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        title="Close Player"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black relative">
                {isPlayerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                            <p className="text-white text-lg">Loading player...</p>
                            <p className="text-gray-400 text-sm mt-2">If player doesn&apos;t load, try switching servers</p>
                        </div>
                    </div>
                )}
                <iframe
                    key={embedUrl}
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    scrolling='no'
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={title}
                    referrerPolicy="origin"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                    onLoad={() => setIsPlayerLoading(false)}
                    onError={() => setIsPlayerLoading(false)}
                />
            </div>
        </div>
    );
}
