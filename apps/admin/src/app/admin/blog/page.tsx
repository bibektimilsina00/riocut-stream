'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MoreVertical, Settings } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt: string | null;
    createdAt: string;
    viewCount: number;
    author: {
        name: string;
    };
    mediaTitle?: string;
    mediaType?: string;
    mediaId?: number;
    mediaCast?: string[];
}

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [searchQuery, statusFilter, categoryFilter, mediaTypeFilter, page]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (mediaTypeFilter !== 'all') params.append('mediaType', mediaTypeFilter);
            if (mediaTypeFilter !== 'all') params.append('mediaType', mediaTypeFilter);

            const response = await fetch(`/api/admin/blog?${params}`);
            const data = await response.json();

            setPosts(data.posts || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`/api/admin/blog?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: string) => {
        try {
            const endpoint = currentStatus === 'published'
                ? `/api/admin/blog/publish?id=${id}`
                : `/api/admin/blog/publish?id=${id}`;

            const method = currentStatus === 'published' ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, { method });

            if (response.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Error toggling publish status:', error);
        }
    };

    const handleSelectPost = (id: string) => {
        setSelectedPosts(prev =>
            prev.includes(id)
                ? prev.filter(postId => postId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedPosts.length === posts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(posts.map(post => post.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPosts.length === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedPosts.length} post(s)? This action cannot be undone.`;
        if (!confirm(confirmMessage)) return;

        setBulkDeleting(true);
        try {
            const response = await fetch('/api/admin/blog?bulk=true', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedPosts }),
            });

            const result = await response.json();

            if (response.ok) {
                fetchPosts();
                setSelectedPosts([]);

                if (result.notFoundIds && result.notFoundIds.length > 0) {
                    alert(`Deleted ${result.deletedCount} posts. ${result.notFoundIds.length} posts were already deleted.`);
                }
            } else {
                alert(result.error || 'Failed to delete posts');
            }
        } catch (error) {
            console.error('Error bulk deleting posts:', error);
            alert('Failed to delete posts');
        } finally {
            setBulkDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Blog Management</h1>
                    <p className="text-gray-400 mt-1">Create and manage blog posts</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/settings/ai"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                        title="Configure AI Settings"
                    >
                        <Settings className="w-5 h-5" />
                        AI Settings
                    </Link>
                    <Link
                        href="/admin/blog/auto-generate"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Auto-Generate
                    </Link>
                    <Link
                        href="/admin/blog/new"
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Post
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search posts..."
                                className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                    >
                        <option value="all">All Categories</option>
                        <option value="review">Review</option>
                        <option value="news">News</option>
                        <option value="guide">Guide</option>
                        <option value="analysis">Analysis</option>
                    </select>

                    {/* Media Type Filter */}
                    <select
                        value={mediaTypeFilter}
                        onChange={(e) => setMediaTypeFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                    >
                        <option value="all">All Media Types</option>
                        <option value="movie">Movies</option>
                        <option value="tv">TV Shows</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedPosts.length > 0 && (
                <div className="bg-teal-600/10 border border-teal-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-teal-400 font-medium">
                                {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={() => setSelectedPosts([])}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                Clear selection
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                        </button>
                    </div>
                </div>
            )}

            {/* Posts Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No posts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px]">
                            <thead className="bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th className="w-12 px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedPosts.length === posts.length && posts.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-600 focus:ring-teal-500 focus:ring-offset-gray-900"
                                        />
                                    </th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-80">Title</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-24 whitespace-nowrap">Category</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-28 whitespace-nowrap">Media Type</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-48 whitespace-nowrap">Media Info</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-32 whitespace-nowrap">Author</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-24 whitespace-nowrap">Status</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-20 whitespace-nowrap">Views</th>
                                    <th className="text-left px-4 py-4 text-gray-300 font-semibold w-28 whitespace-nowrap">Published</th>
                                    <th className="text-right px-4 py-4 text-gray-300 font-semibold w-32 whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedPosts.includes(post.id)}
                                                onChange={() => handleSelectPost(post.id)}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-600 focus:ring-teal-500 focus:ring-offset-gray-900"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="font-medium text-white text-sm leading-5">
                                                    {post.title}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                                    {post.excerpt}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full capitalize">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {post.mediaType ? (
                                                <span className={`px-2 py-1 text-xs rounded-full capitalize whitespace-nowrap ${post.mediaType === 'movie'
                                                    ? 'bg-teal-500/20 text-teal-400'
                                                    : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {post.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {post.mediaTitle ? (
                                                <div className="text-sm">
                                                    <div className="text-teal-400 font-medium truncate max-w-[180px]" title={post.mediaTitle}>
                                                        {post.mediaTitle}
                                                    </div>
                                                    {post.mediaId && (
                                                        <div className="text-xs text-gray-500">
                                                            ID: {post.mediaId}
                                                        </div>
                                                    )}
                                                    {post.mediaCast && post.mediaCast.length > 0 && (
                                                        <div className="text-xs text-green-400">
                                                            👥 {post.mediaCast.length} cast
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-300 truncate max-w-[120px]" title={post.author.name}>
                                                {post.author.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full capitalize ${post.status === 'published'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : post.status === 'draft'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                    }`}
                                            >
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-300">
                                                {post.viewCount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400 text-xs">
                                            {post.publishedAt
                                                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })
                                                : 'Not published'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/admin/blog/${post.id}/edit`}
                                                    className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-gray-800 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleTogglePublish(post.id, post.status)}
                                                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                                                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                                                >
                                                    {post.status === 'published' ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
