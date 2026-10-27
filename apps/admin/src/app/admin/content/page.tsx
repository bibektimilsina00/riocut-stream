'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle, AlertCircle, Power, Plus, Edit, Trash2,
    GripVertical, X, Star, ArrowUpDown
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    useContentSources,
    useUpdateContentSource,
    useTestContentSource,
    type ContentSource,
} from '@/lib/hooks/useAdmin';

interface ProviderFormData {
    name: string;
    slug: string;
    baseUrl: string;
    movieTemplate: string;
    tvTemplate: string;
    quality: string;
    isEnabled: boolean;
    isDefault: boolean;
    description?: string;
    logoUrl?: string;
    homepage?: string;
    supportsImdb: boolean;
    supportsTmdb: boolean;
    hasMultiQuality: boolean;
    hasSubtitles: boolean;
    hasAutoplay: boolean;
}

// Sortable Card Component
function SortableSourceCard({
    source,
    index,
    testingSource,
    onTest,
    onEdit,
    onDelete,
    onToggle,
    onSetDefault
}: {
    source: ContentSource & { order?: number };
    index: number;
    testingSource: string | null;
    onTest: (id: string) => void;
    onEdit: (source: ContentSource) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
    onSetDefault: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: source.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle size={20} className="text-green-400" />;
            case 'degraded':
                return <AlertCircle size={20} className="text-yellow-400" />;
            case 'offline':
                return <AlertCircle size={20} className="text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'degraded':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'offline':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-gray-900 rounded-lg border ${source.isDefault ? 'border-yellow-500/50' : 'border-gray-800'
                } hover:border-gray-700 transition-all relative flex items-center gap-4 p-4`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing hover:bg-gray-800 p-2 rounded transition-colors flex-shrink-0"
            >
                <GripVertical size={20} className="text-gray-500" />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                {/* Title Row */}
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{source.name}</h3>
                    {source.isDefault && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-semibold flex items-center gap-1">
                            <Star size={12} fill="currentColor" />
                            DEFAULT
                        </span>
                    )}
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded text-xs font-semibold">
                        {source.quality}
                    </span>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{source.slug}</span>
                    <span className="flex items-center gap-1.5">
                        {getStatusIcon(source.status || 'unknown')}
                        <span className={getStatusColor(source.status || 'unknown').split(' ')[1]}>
                            {(source.status || 'unknown').charAt(0).toUpperCase() + (source.status || 'unknown').slice(1)}
                        </span>
                    </span>
                    <span>Response: <span className="text-white">{source.responseTime ?? 'N/A'}ms</span></span>
                    <span className="text-xs text-gray-500">
                        Checked: {source.lastChecked ? new Date(source.lastChecked).toLocaleTimeString() : 'Never'}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => onTest(source.id)}
                    disabled={testingSource === source.id}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    {testingSource === source.id ? 'Testing...' : 'Test'}
                </button>
                <button
                    onClick={() => onSetDefault(source.id)}
                    className={`p-2 rounded-lg transition-colors ${source.isDefault
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    title={source.isDefault ? 'Default provider' : 'Set as default'}
                >
                    <Star size={18} fill={source.isDefault ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={() => onEdit(source)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
                    title="Edit provider"
                >
                    <Edit size={18} />
                </button>
                <button
                    onClick={() => onDelete(source.id)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    title="Delete provider"
                >
                    <Trash2 size={18} />
                </button>
                <button
                    onClick={() => onToggle(source.id, !source.isEnabled)}
                    className={`p-2 rounded-lg transition-colors ${source.isEnabled
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                    title={source.isEnabled ? 'Disable source' : 'Enable source'}
                >
                    <Power size={18} />
                </button>
            </div>
        </div>
    );
}

export default function ContentPage() {
    const [testingSource, setTestingSource] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ContentSource | null>(null);
    const [orderedSources, setOrderedSources] = useState<(ContentSource & { order?: number })[]>([]);
    const [formData, setFormData] = useState<ProviderFormData>({
        name: '',
        slug: '',
        baseUrl: '',
        movieTemplate: '',
        tvTemplate: '',
        quality: 'HD',
        isEnabled: true,
        isDefault: false,
        description: '',
        logoUrl: '',
        homepage: '',
        supportsImdb: false,
        supportsTmdb: true,
        hasMultiQuality: false,
        hasSubtitles: false,
        hasAutoplay: false,
    });

    // Fetch video sources using React Query hook
    const { data: sources = [], isLoading } = useContentSources();

    // Mutations using React Query hooks
    const toggleSourceMutation = useUpdateContentSource();
    const testSourceMutation = useTestContentSource();

    // Initialize ordered sources
    useEffect(() => {
        if (sources.length > 0) {
            const sorted = [...sources]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((source) => ({ ...source, order: source.sortOrder }));
            setOrderedSources(sorted);
        }
    }, [sources]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = orderedSources.findIndex((s) => s.id === active.id);
            const newIndex = orderedSources.findIndex((s) => s.id === over.id);

            const newOrder = arrayMove(orderedSources, oldIndex, newIndex);
            setOrderedSources(newOrder);

            // Update order on server
            try {
                await Promise.all(
                    newOrder.map((source, index) =>
                        fetch(`/api/admin/content/sources/${source.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order: index }),
                        })
                    )
                );
            } catch (error) {
                console.error('Error updating order:', error);
            }
        }
    };

    const handleSetDefault = async (sourceId: string) => {
        try {
            // First, unset all defaults
            await Promise.all(
                orderedSources
                    .filter((s) => s.isDefault)
                    .map((source) =>
                        fetch(`/api/admin/content/sources/${source.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isDefault: false }),
                        })
                    )
            );

            // Then set the new default
            await fetch(`/api/admin/content/sources/${sourceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });

            window.location.reload();
        } catch (error) {
            console.error('Error setting default:', error);
        }
    };

    const handleTestSource = (sourceId: string) => {
        setTestingSource(sourceId);
        testSourceMutation.mutate(sourceId, {
            onSettled: () => setTestingSource(null),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProvider) {
            await handleEditProvider();
        } else {
            await handleAddProvider();
        }
    };

    const handleAddProvider = async () => {
        try {
            const response = await fetch('/api/admin/content/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, order: orderedSources.length }),
            });

            if (response.ok) {
                setShowAddModal(false);
                resetForm();
                window.location.reload();
            }
        } catch (error) {
            console.error('Error adding provider:', error);
        }
    };

    const handleEditProvider = async () => {
        if (!editingProvider) return;

        try {
            const response = await fetch(`/api/admin/content/sources/${editingProvider.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setEditingProvider(null);
                resetForm();
                window.location.reload();
            }
        } catch (error) {
            console.error('Error editing provider:', error);
        }
    };

    const handleDeleteProvider = async (id: string) => {
        if (!confirm('Are you sure you want to delete this provider?')) return;

        try {
            const response = await fetch(`/api/admin/content/sources/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting provider:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            baseUrl: '',
            movieTemplate: '',
            tvTemplate: '',
            quality: 'HD',
            isEnabled: true,
            isDefault: false,
            description: '',
            logoUrl: '',
            homepage: '',
            supportsImdb: false,
            supportsTmdb: true,
            hasMultiQuality: false,
            hasSubtitles: false,
            hasAutoplay: false,
        });
    };

    const openEditModal = async (source: ContentSource) => {
        try {
            const response = await fetch(`/api/admin/content/sources/${source.id}`);
            const data = await response.json();
            const provider = data.provider;

            setFormData({
                name: provider.name,
                slug: provider.slug,
                baseUrl: provider.baseUrl,
                movieTemplate: provider.movieTemplate,
                tvTemplate: provider.tvTemplate,
                quality: provider.quality,
                isEnabled: provider.isEnabled,
                isDefault: provider.isDefault,
                description: provider.description || '',
                logoUrl: provider.logoUrl || '',
                homepage: provider.homepage || '',
                supportsImdb: provider.supportsImdb,
                supportsTmdb: provider.supportsTmdb,
                hasMultiQuality: provider.hasMultiQuality,
                hasSubtitles: provider.hasSubtitles,
                hasAutoplay: provider.hasAutoplay,
            });
            setEditingProvider(source);
        } catch (error) {
            console.error('Error fetching provider details:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Management</h1>
                    <p className="text-gray-400 mt-2">Drag to reorder • Star to set default • Manage video sources</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Provider</span>
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-teal-500/20 border border-teal-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <ArrowUpDown size={20} className="text-teal-300 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-teal-300">Drag & Drop Ordering</h4>
                        <p className="text-sm text-teal-200 mt-1">
                            Drag providers using the <GripVertical size={14} className="inline" /> handle to reorder them.
                            The order determines player priority. Click <Star size={14} className="inline" /> to set the default provider.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sources List with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={orderedSources.map((s) => s.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                            </div>
                        ) : orderedSources.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-lg">
                                <p className="text-gray-300 font-medium mb-2">No providers configured</p>
                                <p className="text-gray-500 text-sm mb-6">
                                    Seed defaults from the shell:{' '}
                                    <code className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
                                        pnpm --filter @riocut/db seed
                                    </code>
                                    {' '}or click Add Provider above.
                                </p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                                >
                                    <Plus size={18} />
                                    Add Provider
                                </button>
                            </div>
                        ) : (
                            orderedSources.map((source, index) => (
                                <SortableSourceCard
                                    key={source.id}
                                    source={source}
                                    index={index}
                                    testingSource={testingSource}
                                    onTest={handleTestSource}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteProvider}
                                    onToggle={(id, enabled) =>
                                        toggleSourceMutation.mutate({
                                            sourceId: id,
                                            isEnabled: enabled,
                                        })
                                    }
                                    onSetDefault={handleSetDefault}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add/Edit Provider Modal - Keep existing modal code */}
            {(showAddModal || editingProvider) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full my-8">
                        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingProvider(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                                    Basic Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Provider Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                            placeholder="e.g., VidLink Pro"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Slug *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                            placeholder="e.g., vidlink-pro"
                                            pattern="[a-z0-9-]+"
                                            title="Only lowercase letters, numbers, and hyphens"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Base URL *
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.baseUrl}
                                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                        placeholder="e.g., https://vidlink.pro"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Quality
                                    </label>
                                    <select
                                        value={formData.quality}
                                        onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="720p">720p</option>
                                        <option value="1080p">1080p</option>
                                        <option value="4k">4K</option>
                                    </select>
                                </div>
                            </div>

                            {/* URL Templates */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                                    URL Templates
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Use placeholders: {`{{tmdbId}}, {{imdbId}}, {{season}}, {{episode}}`}
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Movie Template *
                                    </label>
                                    <textarea
                                        value={formData.movieTemplate}
                                        onChange={(e) => setFormData({ ...formData, movieTemplate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-mono text-sm"
                                        rows={3}
                                        placeholder="e.g., https://vidlink.pro/movie/{{tmdbId}}"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        TV Show Template *
                                    </label>
                                    <textarea
                                        value={formData.tvTemplate}
                                        onChange={(e) => setFormData({ ...formData, tvTemplate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-mono text-sm"
                                        rows={3}
                                        placeholder="e.g., https://vidlink.pro/tv/{{tmdbId}}/{{season}}/{{episode}}"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Optional Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                                    Optional Information
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                        rows={2}
                                        placeholder="Brief description of the provider"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Logo URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.logoUrl}
                                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Homepage
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.homepage}
                                            onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                                    Features
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.supportsImdb}
                                            onChange={(e) => setFormData({ ...formData, supportsImdb: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Supports IMDB IDs</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.supportsTmdb}
                                            onChange={(e) => setFormData({ ...formData, supportsTmdb: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Supports TMDB IDs</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasMultiQuality}
                                            onChange={(e) => setFormData({ ...formData, hasMultiQuality: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Multiple Qualities</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasSubtitles}
                                            onChange={(e) => setFormData({ ...formData, hasSubtitles: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Has Subtitles</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasAutoplay}
                                            onChange={(e) => setFormData({ ...formData, hasAutoplay: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Has Autoplay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
                                    Status
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isEnabled}
                                            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Enabled</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                            className="w-5 h-5 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-gray-300">Set as Default</span>
                                    </label>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800 sticky bottom-0 bg-gray-900 pb-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingProvider(null);
                                        resetForm();
                                    }}
                                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingProvider ? 'Update Provider' : 'Add Provider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
