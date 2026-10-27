'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    X,
    ArrowLeft,
    Save,
    Eye,
    Upload,
    Image as ImageIcon,
    Tag,
    Globe,
    Film,
    Tv,
    Calendar,
    Star,
    Clock,
    FileText,
    Share2,
    Settings,
    CheckCircle,
    Trash2,
    RefreshCw,
    AlertCircle,
    Info
} from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '../../../../../components/RichTextEditor';
import { searchMulti } from '@/lib/tmdb';

interface MediaItem {
    id: number;
    title?: string;
    name?: string;
    media_type: 'movie' | 'tv';
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    overview?: string;
}

interface EditBlogPostPageProps {
    params: Promise<{ id: string }>;
}

interface FormData {
    title: string;
    content: string;
    slug: string;
    excerpt: string;
    status: string;
    tags: string;
    keywords: string;
    metaDescription: string;
    metaTitle: string;
    canonicalUrl: string;
    featuredImage: string;
    ogImage: string;
    twitterCardType: string;
    publishedAt: string | null;
    mediaId: number | null;
    mediaType: string;
    mediaTitle: string;
    mediaPosterPath: string;
    mediaBackdropPath: string;
    mediaReleaseDate: string;
    mediaGenres: any[];
    mediaRating: number | null;
    mediaOverview: string;
    category?: string;
    priority?: string;
    viewCount?: number;
    readingTime?: number;
    articleType?: string;
    isSponsored?: boolean;
    sponsorInfo?: string;
    socialMediaPreview: {
        twitter: string;
        facebook: string;
        linkedin: string;
    };
    robotsMeta?: string;
}

// SEO Utility Functions
const generateMetaTitle = (title: string, keywords: string): string => {
    const primaryKeyword = keywords.split(',')[0]?.trim();
    if (!primaryKeyword) return title;

    // If title doesn't contain primary keyword, add it
    if (!title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        const maxLength = 60;
        const keywordPhrase = ` - ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)}`;
        const availableLength = maxLength - keywordPhrase.length;
        const trimmedTitle = title.length > availableLength ? title.substring(0, availableLength).trim() : title;
        return `${trimmedTitle}${keywordPhrase}`;
    }
    return title;
};

const generateMetaDescription = (excerpt: string, keywords: string): string => {
    const primaryKeyword = keywords.split(',')[0]?.trim();
    if (!excerpt || !primaryKeyword) return excerpt;

    // Ensure primary keyword is in description
    if (!excerpt.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        const maxLength = 160;
        const keywordPhrase = `Learn about ${primaryKeyword}. `;
        const availableLength = maxLength - keywordPhrase.length;
        const trimmedExcerpt = excerpt.length > availableLength ? excerpt.substring(0, availableLength).trim() + '...' : excerpt;
        return `${keywordPhrase}${trimmedExcerpt}`;
    }
    return excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;
};

const calculateSEOScore = (data: any): number => {
    let score = 0;
    const checks = [
        { condition: data.metaTitle && data.metaTitle.length >= 30 && data.metaTitle.length <= 60, points: 15 },
        { condition: data.metaDescription && data.metaDescription.length >= 120 && data.metaDescription.length <= 160, points: 15 },
        { condition: data.keywords && data.keywords.split(',').length >= 3, points: 10 },
        { condition: data.slug && data.slug.length > 0, points: 10 },
        { condition: data.featuredImage && data.featuredImage.length > 0, points: 10 },
        { condition: data.ogImage && data.ogImage.length > 0, points: 8 },
        { condition: data.canonicalUrl && data.canonicalUrl.length > 0, points: 7 },
        { condition: data.excerpt && data.excerpt.length > 50, points: 5 },
        { condition: data.keywords && data.metaTitle && data.metaTitle.toLowerCase().includes(data.keywords.split(',')[0]?.trim().toLowerCase()), points: 10 },
        { condition: data.keywords && data.metaDescription && data.metaDescription.toLowerCase().includes(data.keywords.split(',')[0]?.trim().toLowerCase()), points: 10 },
    ];

    checks.forEach(check => {
        if (check.condition) score += check.points;
    });

    return Math.min(score, 100);
};

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
    console.log('Component rendering');
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        slug: '',
        excerpt: '',
        status: 'draft',
        tags: '',
        keywords: '',
        metaDescription: '',
        metaTitle: '',
        canonicalUrl: '',
        featuredImage: '',
        ogImage: '',
        twitterCardType: 'summary_large_image',
        publishedAt: null,
        mediaId: null,
        mediaType: '',
        mediaTitle: '',
        mediaPosterPath: '',
        mediaBackdropPath: '',
        mediaReleaseDate: '',
        mediaGenres: [],
        mediaRating: null,
        mediaOverview: '',
        category: '',
        priority: '',
        viewCount: 0,
        readingTime: 0,
        articleType: 'BlogPosting',
        isSponsored: false,
        sponsorInfo: '',
        socialMediaPreview: {
            twitter: '',
            facebook: '',
            linkedin: ''
        }
    });

    // Additional state variables that are used throughout the component
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showMediaSearch, setShowMediaSearch] = useState(false);
    const [mediaSearch, setMediaSearch] = useState('');
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [postId, setPostId] = useState<string | null>(null);

    // Initialize postId from params and load post data
    useEffect(() => {
        const loadPostData = async () => {
            try {
                const resolvedParams = await params;
                const id = resolvedParams.id;
                setPostId(id);

                // Fetch the blog post data
                const response = await fetch(`/api/admin/blog?id=${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch post');
                }

                const data = await response.json();

                if (data.posts && data.posts.length > 0) {
                    const post = data.posts[0];

                    // Pre-fill the form with existing data
                    setFormData({
                        title: post.title || '',
                        content: post.content || '',
                        slug: post.slug || '',
                        excerpt: post.excerpt || '',
                        status: post.status || 'draft',
                        tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
                        keywords: Array.isArray(post.keywords) ? post.keywords.join(', ') : (post.keywords || ''),
                        metaDescription: post.metaDescription || '',
                        metaTitle: post.metaTitle || '',
                        canonicalUrl: post.canonicalUrl || '',
                        featuredImage: post.featuredImage || '',
                        ogImage: post.ogImage || '',
                        twitterCardType: post.twitterCardType || 'summary_large_image',
                        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : null,
                        mediaId: post.mediaId || null,
                        mediaType: post.mediaType || '',
                        mediaTitle: post.mediaTitle || '',
                        mediaPosterPath: post.mediaPosterPath || '',
                        mediaBackdropPath: post.mediaBackdropPath || '',
                        mediaReleaseDate: post.mediaReleaseDate || '',
                        mediaGenres: post.mediaGenres || [],
                        mediaRating: post.mediaRating || null,
                        mediaOverview: post.mediaOverview || '',
                        category: post.category || '',
                        priority: post.priority || '',
                        viewCount: post.viewCount || 0,
                        readingTime: post.readingTime || 0,
                        articleType: post.articleType || 'BlogPosting',
                        isSponsored: post.isSponsored || false,
                        sponsorInfo: post.sponsorInfo || '',
                        socialMediaPreview: {
                            twitter: post.socialMediaPreview?.twitter || '',
                            facebook: post.socialMediaPreview?.facebook || '',
                            linkedin: post.socialMediaPreview?.linkedin || ''
                        }
                    });
                }

            } catch (error) {
                console.error('Error loading post:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPostData();
    }, [params]);



    if (loading) {
        return <div className="p-6 text-white">Loading...</div>;
    }

    // Form validation function that sets errors
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        }

        if (!formData.excerpt.trim()) {
            newErrors.excerpt = 'Excerpt is required';
        } else if (formData.excerpt.length > 500) {
            newErrors.excerpt = 'Excerpt must be less than 500 characters';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        }

        if (formData.metaDescription && formData.metaDescription.length > 160) {
            newErrors.metaDescription = 'Meta description should be less than 160 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Check if form is valid without setting errors (for use in render)
    const isFormValid = () => {
        return formData.title.trim() &&
            formData.slug.trim() &&
            formData.excerpt.trim() &&
            formData.content.trim() &&
            formData.title.length <= 200 &&
            formData.excerpt.length <= 500 &&
            /^[a-z0-9-]+$/.test(formData.slug) &&
            (!formData.metaDescription || formData.metaDescription.length <= 160);
    };

    // Auto-save function
    const handleAutoSave = async () => {
        if (!validateForm() || !postId) return;

        try {
            const payload = {
                id: postId,
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
                autoSave: true
            };

            await fetch('/api/admin/blog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setLastSaved(new Date());
            setIsDirty(false);
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    // Generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Generate canonical URL from slug
    const generateCanonicalUrl = (slug: string) => {
        if (!slug) return '';
        // Use environment variable or fallback to production URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://riocut.com';
        return `${baseUrl}/blog/${slug}`;
    };

    // Update form data with change tracking
    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...updates };

            // Auto-generate slug if title changes and slug is empty
            if (updates.title && !prev.slug) {
                const newSlug = generateSlug(updates.title || '');
                newData.slug = newSlug;
                // Only generate canonical URL if it's empty
                if (!prev.canonicalUrl) {
                    newData.canonicalUrl = generateCanonicalUrl(newSlug);
                }
            }

            // Auto-generate canonical URL only when slug is explicitly changed and canonical URL is empty
            if (updates.slug && !prev.canonicalUrl) {
                newData.canonicalUrl = generateCanonicalUrl(updates.slug);
            }

            return newData;
        });
        setIsDirty(true);
    };

    // Handle input changes for form fields
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        updateFormData({
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleMediaSearch = async (query: string) => {
        setMediaSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const results = await searchMulti(query);
            setSearchResults(results.slice(0, 6));
        } catch (error) {
            console.error('Media search error:', error);
        }
    };

    const selectMedia = (media: MediaItem) => {
        setFormData({
            ...formData,
            mediaId: media.id,
            mediaType: media.media_type,
            mediaTitle: media.title || media.name || '',
            mediaPosterPath: media.poster_path || '',
            mediaBackdropPath: media.backdrop_path || '',
            mediaReleaseDate: media.release_date || media.first_air_date || '',
            mediaGenres: [],
            mediaRating: media.vote_average || null,
            mediaOverview: media.overview || '',
        });
        setShowMediaSearch(false);
        setMediaSearch('');
        setSearchResults([]);
    };

    const clearMedia = () => {
        updateFormData({
            mediaId: null,
            mediaType: '',
            mediaTitle: '',
            mediaPosterPath: '',
            mediaBackdropPath: '',
            mediaReleaseDate: '',
            mediaGenres: [],
            mediaRating: null,
            mediaOverview: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            alert('Please fix the validation errors before saving.');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                id: postId,
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            };

            const response = await fetch('/api/admin/blog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update post');
                return;
            }

            setLastSaved(new Date());
            setIsDirty(false);
            router.push('/admin/blog');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);

        try {
            const payload = {
                id: postId,
                ...formData,
                status: 'draft', // Ensure it's saved as draft
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            };

            const response = await fetch('/api/admin/blog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to save draft');
                return;
            }

            setLastSaved(new Date());
            setIsDirty(false);

            // Show success message but stay on edit page
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            successMessage.textContent = 'Draft saved successfully!';
            document.body.appendChild(successMessage);

            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 3000);

        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!validateForm()) {
            alert('Please fix the validation errors before publishing.');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                id: postId,
                ...formData,
                status: 'published',
                publishedAt: new Date().toISOString(),
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            };

            const response = await fetch('/api/admin/blog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to publish post');
                return;
            }

            setLastSaved(new Date());
            setIsDirty(false);
            router.push('/admin/blog');
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Failed to publish post');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-full px-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/blog"
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Edit Blog Post</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-gray-400">Update existing blog post</p>
                            {isDirty && (
                                <span className="text-yellow-400 text-sm flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Unsaved changes
                                </span>
                            )}
                            {lastSaved && (
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Last saved: {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Count & Status */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formData.viewCount} views
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formData.readingTime} min read
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : formData.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {formData.status}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>

                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Draft
                        </button>

                        {formData.status !== 'published' && (
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Publish
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-Width Main Content */}
            <div className="w-full">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2">
                                    Title *
                                    {errors.title && <span className="text-red-400 text-sm ml-2">{errors.title}</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateFormData({ title: e.target.value })}
                                    className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg border transition-colors focus:outline-none ${errors.title ? 'border-red-500' : 'border-gray-700 focus:border-teal-500'
                                        }`}
                                    placeholder="Enter an engaging blog post title"
                                    maxLength={200}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>This will be the main heading of your post</span>
                                    <span>{formData.title.length}/200</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">
                                    Slug *
                                    {errors.slug && <span className="text-red-400 text-sm ml-2">{errors.slug}</span>}
                                </label>
                                <div className="flex">
                                    <span className="bg-gray-700 text-gray-300 px-3 py-3 rounded-l-lg border border-r-0 border-gray-600 text-sm">
                                        /blog/
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => updateFormData({ slug: e.target.value })}
                                        className={`flex-1 bg-gray-800 text-white px-4 py-3 rounded-r-lg border transition-colors focus:outline-none ${errors.slug ? 'border-red-500' : 'border-gray-700 focus:border-teal-500'
                                            }`}
                                        placeholder="url-friendly-slug"
                                        pattern="[a-z0-9-]+"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateFormData({ slug: generateSlug(formData.title) })}
                                        className="ml-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm"
                                        disabled={!formData.title}
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens allowed</p>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">
                                    Excerpt *
                                    {errors.excerpt && <span className="text-red-400 text-sm ml-2">{errors.excerpt}</span>}
                                </label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => updateFormData({ excerpt: e.target.value })}
                                    rows={4}
                                    maxLength={500}
                                    className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg border transition-colors focus:outline-none resize-y ${errors.excerpt ? 'border-red-500' : 'border-gray-700 focus:border-teal-500'
                                        }`}
                                    placeholder="Write a compelling summary that will appear in search results and social media previews..."
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>This appears in search results and social media</span>
                                    <span>{formData.excerpt.length}/500</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => updateFormData({ category: e.target.value })}
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                    >
                                        <option value="review">🎭 Review</option>
                                        <option value="news">📰 News</option>
                                        <option value="guide">📋 Guide</option>
                                        <option value="analysis">🔍 Analysis</option>
                                        <option value="interview">🎤 Interview</option>
                                        <option value="behind-scenes">🎬 Behind the Scenes</option>
                                        <option value="opinion">💭 Opinion</option>
                                        <option value="list">📝 List</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => updateFormData({ priority: e.target.value as any })}
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                    >
                                        <option value="low">🟢 Low Priority</option>
                                        <option value="normal">🟡 Normal Priority</option>
                                        <option value="high">🔴 High Priority</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">
                                    Tags
                                    <span className="text-gray-500 text-sm ml-2">(comma-separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => updateFormData({ tags: e.target.value })}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                    placeholder="horror, thriller, stephen king, adaptation"
                                />
                                <p className="text-xs text-gray-500 mt-1">Help users discover your content with relevant tags</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Media Association Section */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Film className="w-5 h-5 text-teal-400" />
                            Media Association
                        </h3>

                        {!formData.mediaId ? (
                            /* Compact No Media Selected State */
                            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">No Media Selected</p>
                                        <p className="text-gray-400 text-xs">Associate with a movie or TV show</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMediaSearch(!showMediaSearch)}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Search className="w-4 h-4" />
                                    Search
                                </button>
                            </div>
                        ) : (
                            /* Compact Media Selected State */
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center gap-4">
                                    {/* Compact Media Image */}
                                    <div className="w-16 h-24 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                                        {formData.mediaPosterPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w154${formData.mediaPosterPath}`}
                                                alt={formData.mediaTitle}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Media Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-white font-medium text-sm truncate pr-2">{formData.mediaTitle}</h4>
                                            <button
                                                type="button"
                                                onClick={clearMedia}
                                                className="text-red-400 hover:text-red-300 flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${formData.mediaType === 'movie'
                                                ? 'bg-teal-500/20 text-teal-400'
                                                : 'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                {formData.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                                            </span>
                                            {formData.mediaReleaseDate && (
                                                <span className="text-xs text-gray-400">
                                                    {new Date(formData.mediaReleaseDate).getFullYear()}
                                                </span>
                                            )}
                                            {formData.mediaRating && (
                                                <span className="text-xs text-yellow-400">
                                                    ⭐ {formData.mediaRating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMediaSearch(!showMediaSearch)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                                            >
                                                <Search className="w-3 h-3" />
                                                Change
                                            </button>
                                            <span className="text-xs text-gray-500">ID: {formData.mediaId}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Compact Media Search */}
                        {showMediaSearch && (
                            <div className="mt-4 space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={mediaSearch}
                                        onChange={(e) => handleMediaSearch(e.target.value)}
                                        placeholder="Search movies and TV shows..."
                                        className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none text-sm"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {searchResults.map((media) => (
                                            <button
                                                key={media.id}
                                                type="button"
                                                onClick={() => selectMedia(media)}
                                                className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 hover:border-gray-500 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                                                        {media.poster_path ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w92${media.poster_path}`}
                                                                alt={media.title || media.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="w-3 h-3 text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">
                                                            {media.title || media.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`px-1 py-0.5 rounded text-xs ${media.media_type === 'movie'
                                                                ? 'bg-teal-500/20 text-teal-400'
                                                                : 'bg-purple-500/20 text-purple-400'
                                                                }`}>
                                                                {media.media_type}
                                                            </span>
                                                            {(media.release_date || media.first_air_date) && (
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(media.release_date || media.first_air_date!).getFullYear()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowMediaSearch(false)}
                                    className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Editor - Full Width */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Content Editor
                            {errors.content && <span className="text-red-400 text-sm ml-2">{errors.content}</span>}
                        </h2>

                        <RichTextEditor
                            value={formData.content}
                            onChange={(content: string) => updateFormData({ content })}
                            placeholder="Start writing your amazing blog post..."
                            onSave={handleAutoSave}
                            autoSave={true}
                            maxLength={50000}
                        />
                    </div>

                    {/* Advanced SEO Optimization Suite */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        {/* SEO Header with Score */}
                        <div className="bg-gray-800 p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <Globe className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">SEO Optimization Center</h2>
                                        <p className="text-gray-400 text-sm">Advanced search engine optimization tools</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">
                                        {(() => {
                                            let score = 0;
                                            if (formData.metaTitle && formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60) score += 20;
                                            if (formData.metaDescription && formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160) score += 20;
                                            if (formData.keywords && formData.keywords.split(',').length >= 3) score += 15;
                                            if (formData.slug && formData.slug.length > 0) score += 10;
                                            if (formData.featuredImage) score += 10;
                                            if (formData.ogImage) score += 10;
                                            if (formData.canonicalUrl) score += 5;
                                            if (formData.excerpt && formData.excerpt.length > 50) score += 10;
                                            return Math.min(score, 100);
                                        })()}%
                                    </div>
                                    <div className="text-xs text-gray-400">SEO Score</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Primary SEO Fields */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-white">Primary SEO Elements</h3>
                                </div>

                                {/* Enhanced Meta Title */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-gray-300 font-medium">
                                            Meta Title *
                                            {errors.metaTitle && <span className="text-red-400 text-sm ml-2">{errors.metaTitle}</span>}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60 ? (
                                                <span className="text-green-400 text-xs flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Optimal
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400 text-xs flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Needs optimization
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.metaTitle}
                                        onChange={(e) => updateFormData({ metaTitle: e.target.value })}
                                        className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60
                                            ? 'border-green-500 focus:ring-green-500/20'
                                            : errors.metaTitle
                                                ? 'border-red-500 focus:ring-red-500/20'
                                                : 'border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                                            }`}
                                        placeholder="Write a compelling, keyword-rich title (30-60 characters)"
                                        maxLength={70}
                                    />
                                    <div className="flex justify-between items-center text-xs mt-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500">Appears in search results & browser tabs</span>
                                            {formData.keywords && formData.metaTitle.toLowerCase().includes(formData.keywords.split(',')[0]?.trim().toLowerCase()) && (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Contains primary keyword
                                                </span>
                                            )}
                                        </div>
                                        <span className={`font-medium ${formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60
                                            ? 'text-green-400'
                                            : formData.metaTitle.length > 60
                                                ? 'text-red-400'
                                                : 'text-yellow-400'
                                            }`}>
                                            {formData.metaTitle.length}/70
                                        </span>
                                    </div>
                                    {/* Title Preview */}
                                    <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                                        <div className="text-xs text-gray-500 mb-1">Search Result Preview:</div>
                                        <div className="text-teal-400 text-sm font-medium hover:underline cursor-pointer">
                                            {formData.metaTitle || formData.title || "Your Blog Post Title"}
                                        </div>
                                        <div className="text-green-600 text-xs mt-1">
                                            riocut.com › blog › {formData.slug || "your-post-slug"}
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Meta Description */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-gray-300 font-medium">
                                            Meta Description *
                                            {errors.metaDescription && <span className="text-red-400 text-sm ml-2">{errors.metaDescription}</span>}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160 ? (
                                                <span className="text-green-400 text-xs flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Perfect length
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400 text-xs flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Optimize length
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <textarea
                                        value={formData.metaDescription}
                                        onChange={(e) => updateFormData({ metaDescription: e.target.value })}
                                        className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 resize-none ${formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160
                                            ? 'border-green-500 focus:ring-green-500/20'
                                            : errors.metaDescription
                                                ? 'border-red-500 focus:ring-red-500/20'
                                                : 'border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                                            }`}
                                        placeholder="Write a compelling description that includes your primary keyword and encourages clicks (120-160 characters)"
                                        rows={3}
                                        maxLength={200}
                                    />
                                    <div className="flex justify-between items-center text-xs mt-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500">Appears below title in search results</span>
                                            {formData.keywords && formData.metaDescription.toLowerCase().includes(formData.keywords.split(',')[0]?.trim().toLowerCase()) && (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Contains primary keyword
                                                </span>
                                            )}
                                        </div>
                                        <span className={`font-medium ${formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160
                                            ? 'text-green-400'
                                            : formData.metaDescription.length > 160
                                                ? 'text-red-400'
                                                : 'text-yellow-400'
                                            }`}>
                                            {formData.metaDescription.length}/200
                                        </span>
                                    </div>
                                    {/* Description Preview */}
                                    <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                                        <div className="text-xs text-gray-500 mb-1">Search Result Preview:</div>
                                        <div className="text-gray-300 text-sm leading-relaxed">
                                            {formData.metaDescription || formData.excerpt || "Your compelling meta description that encourages users to click through to your blog post..."}
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Keywords Section */}
                                <div>
                                    <label className="text-gray-300 font-medium mb-2 block">
                                        Focus Keywords & Phrases
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.keywords}
                                        onChange={(e) => updateFormData({ keywords: e.target.value })}
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                        placeholder="primary keyword, secondary keyword, long-tail phrase"
                                    />
                                    <div className="mt-2 text-xs text-gray-500">
                                        <p>Enter 3-5 keywords/phrases separated by commas. First keyword is primary.</p>
                                        {formData.keywords && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {formData.keywords.split(',').map((keyword, index) => (
                                                    <span key={index} className={`px-2 py-1 rounded-full text-xs ${index === 0
                                                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                                        : 'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {index === 0 && '🎯'} {keyword.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced SEO Fields */}
                            <div className="border-t border-gray-700 pt-6 space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-white">Advanced SEO Settings</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Enhanced Slug */}
                                    <div className="lg:col-span-2">
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            SEO-Friendly URL Slug
                                        </label>
                                        <div className="flex">
                                            <span className="bg-gray-700 text-gray-300 px-3 py-3 rounded-l-lg border border-r-0 border-gray-600 text-sm">
                                                riocut.com/blog/
                                            </span>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => updateFormData({ slug: e.target.value })}
                                                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-r-lg border border-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                                placeholder="seo-friendly-url-slug"
                                                pattern="[a-z0-9-]+"
                                            />
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                                            <span>Use hyphens, lowercase letters, and numbers only</span>
                                            {formData.keywords && formData.slug.includes(formData.keywords.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-')) && (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Contains primary keyword
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Canonical URL */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-gray-300 font-medium">
                                                Canonical URL
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => updateFormData({ canonicalUrl: generateCanonicalUrl(formData.slug) })}
                                                disabled={!formData.slug}
                                                className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded hover:bg-teal-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={!formData.slug ? "Add a slug first" : "Generate canonical URL from slug"}
                                            >
                                                <RefreshCw className="w-3 h-3 inline mr-1" />
                                                Auto-generate
                                            </button>
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.canonicalUrl}
                                            onChange={(e) => updateFormData({ canonicalUrl: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                            placeholder="https://riocut.com/blog/your-post"
                                        />
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-500">
                                                Prevents duplicate content issues. Auto-generates from slug when changed.
                                            </p>
                                            {formData.canonicalUrl && (
                                                <span className="flex items-center gap-1 text-xs">
                                                    {formData.canonicalUrl === generateCanonicalUrl(formData.slug) ? (
                                                        <span className="text-green-400 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Auto-generated
                                                        </span>
                                                    ) : (
                                                        <span className="text-teal-400 flex items-center gap-1">
                                                            <Info className="w-3 h-3" />
                                                            Custom URL
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* robots meta */}
                                    <div>
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            Robots Meta Tag
                                        </label>
                                        <select
                                            value={formData.robotsMeta || 'index,follow'}
                                            onChange={(e) => updateFormData({ robotsMeta: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                        >
                                            <option value="index,follow">Index, Follow (Default)</option>
                                            <option value="index,nofollow">Index, No Follow</option>
                                            <option value="noindex,follow">No Index, Follow</option>
                                            <option value="noindex,nofollow">No Index, No Follow</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Controls how search engines crawl this page</p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media & Rich Snippets */}
                            <div className="border-t border-gray-700 pt-6 space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-white">Social Media & Rich Snippets</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Featured Image */}
                                    <div>
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            Featured Image URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.featuredImage}
                                            onChange={(e) => updateFormData({ featuredImage: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="https://example.com/featured-image.jpg"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Main blog post image (16:9 ratio recommended)</p>
                                    </div>

                                    {/* OG Image */}
                                    <div>
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            Open Graph Image
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.ogImage}
                                            onChange={(e) => updateFormData({ ogImage: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="https://example.com/og-image.jpg"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Social sharing image (1200x630px)</p>
                                    </div>

                                    {/* Twitter Card Type */}
                                    <div>
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            Twitter Card Type
                                        </label>
                                        <select
                                            value={formData.twitterCardType || 'summary_large_image'}
                                            onChange={(e) => updateFormData({ twitterCardType: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        >
                                            <option value="summary">Summary</option>
                                            <option value="summary_large_image">Summary Large Image</option>
                                            <option value="app">App</option>
                                            <option value="player">Player</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">How your post appears on Twitter</p>
                                    </div>

                                    {/* Article Type */}
                                    <div>
                                        <label className="text-gray-300 font-medium mb-2 block">
                                            Article Type
                                        </label>
                                        <select
                                            value={formData.articleType || 'BlogPosting'}
                                            onChange={(e) => updateFormData({ articleType: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        >
                                            <option value="BlogPosting">Blog Post</option>
                                            <option value="NewsArticle">News Article</option>
                                            <option value="Review">Review</option>
                                            <option value="HowTo">How-To Guide</option>
                                            <option value="Recipe">Recipe</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Schema.org structured data type</p>
                                    </div>
                                </div>
                            </div>

                            {/* SEO Checklist */}
                            <div className="border-t border-gray-700 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-white">SEO Checklist</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        {[
                                            { check: formData.metaTitle && formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60, text: "Meta title is 30-60 characters" },
                                            { check: formData.metaDescription && formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160, text: "Meta description is 120-160 characters" },
                                            { check: formData.keywords && formData.keywords.split(',').length >= 3, text: "At least 3 focus keywords added" },
                                            { check: formData.slug && formData.slug.length > 0, text: "SEO-friendly URL slug set" },
                                            { check: formData.featuredImage && formData.featuredImage.length > 0, text: "Featured image added" }
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                {item.check ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={item.check ? 'text-green-400' : 'text-gray-400'}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { check: formData.ogImage && formData.ogImage.length > 0, text: "Open Graph image set" },
                                            { check: formData.canonicalUrl && formData.canonicalUrl.length > 0, text: "Canonical URL specified" },
                                            { check: formData.excerpt && formData.excerpt.length > 50, text: "Compelling excerpt written" },
                                            { check: formData.keywords && formData.metaTitle.toLowerCase().includes(formData.keywords.split(',')[0]?.trim().toLowerCase()), text: "Primary keyword in title" },
                                            { check: formData.keywords && formData.metaDescription.toLowerCase().includes(formData.keywords.split(',')[0]?.trim().toLowerCase()), text: "Primary keyword in description" }
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                {item.check ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={item.check ? 'text-green-400' : 'text-gray-400'}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Advanced Settings & Publishing - Side by Side 50-50 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Advanced Settings - 50% Width */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Advanced Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Priority */}
                            <div>
                                <label className="block text-gray-300 mb-2">Content Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => updateFormData({ priority: e.target.value as 'low' | 'normal' | 'high' })}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="low">🟢 Low Priority</option>
                                    <option value="normal">🟡 Normal Priority</option>
                                    <option value="high">🔴 High Priority</option>
                                </select>
                            </div>

                            {/* Sponsored Content */}
                            <div>
                                <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSponsored}
                                        onChange={(e) => updateFormData({ isSponsored: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                                    />
                                    <span>This is sponsored content</span>
                                </label>
                                {formData.isSponsored && (
                                    <input
                                        type="text"
                                        value={formData.sponsorInfo}
                                        onChange={(e) => updateFormData({ sponsorInfo: e.target.value })}
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none mt-3"
                                        placeholder="Sponsor information or disclosure"
                                    />
                                )}
                            </div>

                            {/* Social Media Previews */}
                            <div>
                                <label className="block text-gray-300 mb-3">Social Media Preview Text</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Twitter</label>
                                        <input
                                            type="text"
                                            value={formData.socialMediaPreview.twitter}
                                            onChange={(e) => updateFormData({
                                                socialMediaPreview: {
                                                    ...formData.socialMediaPreview,
                                                    twitter: e.target.value
                                                }
                                            })}
                                            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                                            placeholder="Twitter-specific text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Facebook</label>
                                        <input
                                            type="text"
                                            value={formData.socialMediaPreview.facebook}
                                            onChange={(e) => updateFormData({
                                                socialMediaPreview: {
                                                    ...formData.socialMediaPreview,
                                                    facebook: e.target.value
                                                }
                                            })}
                                            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                                            placeholder="Facebook-specific text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">LinkedIn</label>
                                        <input
                                            type="text"
                                            value={formData.socialMediaPreview.linkedin}
                                            onChange={(e) => updateFormData({
                                                socialMediaPreview: {
                                                    ...formData.socialMediaPreview,
                                                    linkedin: e.target.value
                                                }
                                            })}
                                            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                                            placeholder="LinkedIn-specific text"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Publishing Settings - 50% Width */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-teal-400" />
                            Publishing Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-gray-300 mb-2">Publication Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => updateFormData({ status: e.target.value as any })}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                >
                                    <option value="draft">📝 Draft</option>
                                    <option value="published">✅ Published</option>
                                    <option value="archived">📦 Archived</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.status === 'published' ? 'Visible to all users' :
                                        formData.status === 'draft' ? 'Only visible to administrators' :
                                            'Hidden from public view'}
                                </p>
                            </div>

                            {/* Publishing Date */}
                            <div>
                                <label className="block text-gray-300 mb-2">Publish Date</label>
                                <input
                                    type="datetime-local"
                                    value={formData.publishedAt || ''}
                                    onChange={(e) => updateFormData({ publishedAt: e.target.value || null })}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately</p>
                            </div>

                            {/* Reading Time */}
                            <div>
                                <label className="block text-gray-300 mb-2">Estimated Reading Time</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.readingTime}
                                        onChange={(e) => updateFormData({ readingTime: parseInt(e.target.value) || 0 })}
                                        className="w-20 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none"
                                        min="0"
                                        max="120"
                                    />
                                    <span className="text-gray-400 text-sm">minutes</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
                                            const readingTime = Math.max(1, Math.ceil(wordCount / 200));
                                            updateFormData({ readingTime });
                                        }}
                                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors"
                                    >
                                        Auto Calculate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Average reading speed: 200 words per minute</p>
                            </div>

                            {/* View Count (Read-only) */}
                            <div>
                                <label className="block text-gray-300 mb-2">View Statistics</label>
                                <div className="bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Total Views:</span>
                                        <span className="text-white font-medium">{(formData.viewCount ?? 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 mt-8">
                    <div className="flex items-center justify-between max-w-full mx-auto">
                        <div className="flex items-center gap-4">
                            {lastSaved && (
                                <span className="text-sm text-gray-400">
                                    Last saved: {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                            {isDirty && (
                                <span className="text-sm text-yellow-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Unsaved changes
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={saving || !isDirty}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    // Preview functionality - could open in new tab
                                    const previewUrl = `/blog/${formData.slug}?preview=true`;
                                    window.open(previewUrl, '_blank');
                                }}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>

                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={saving || !isFormValid()}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                            >
                                <Globe className="w-4 h-4" />
                                {formData.status === 'published' ? 'Update' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
