'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Film, Tv, Tag, Calendar, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BlogFiltersProps {
    categories: Array<{ value: string; label: string; icon: string }>;
    currentCategory?: string;
}

// Icon mapping
const iconMap: Record<string, any> = {
    Tag,
    Film,
    Calendar,
    Tv,
    User,
};

export default function BlogFilters({ categories, currentCategory }: BlogFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
    const mediaType = searchParams?.get('mediaType') || 'all';

    // Update search query when URL changes
    useEffect(() => {
        setSearchQuery(searchParams?.get('search') || '');
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters({ search: searchQuery });
    };

    const handleMediaTypeChange = (type: string) => {
        updateFilters({ mediaType: type === 'all' ? undefined : type });
    };

    const clearSearch = () => {
        setSearchQuery('');
        updateFilters({ search: undefined });
    };

    const updateFilters = (updates: { search?: string; mediaType?: string }) => {
        const params = new URLSearchParams(searchParams?.toString() || '');

        // Update or remove search param
        if (updates.search !== undefined) {
            if (updates.search) {
                params.set('search', updates.search);
            } else {
                params.delete('search');
            }
        }

        // Update or remove mediaType param
        if (updates.mediaType !== undefined) {
            if (updates.mediaType) {
                params.set('mediaType', updates.mediaType);
            } else {
                params.delete('mediaType');
            }
        }

        // Reset to page 1 when filters change
        params.delete('page');

        router.push(`/?${params.toString()}`);
    };

    const mediaTypes = [
        { value: 'all', label: 'All', icon: null as string | null },
        { value: 'movie', label: 'Movies', icon: 'Film' },
        { value: 'tv', label: 'TV', icon: 'Tv' },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Category Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((cat) => {
                    const IconComponent = iconMap[cat.icon];
                    const isActive = currentCategory === cat.value || (!currentCategory && cat.value === 'all');
                    return (
                        <a
                            key={cat.value}
                            href={cat.value === 'all' ? '/' : `/?category=${cat.value}${mediaType !== 'all' ? `&mediaType=${mediaType}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${isActive
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'bg-transparent text-white hover:bg-gray-800 border border-gray-700'
                                }`}
                        >
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            {cat.label}
                        </a>
                    );
                })}
            </div>

            {/* Media Type Filter + Search */}
            <div className="flex gap-2 overflow-x-auto flex-1">
                {mediaTypes.map((type) => {
                    const IconComponent = type.icon ? iconMap[type.icon] : null;
                    const isActive = mediaType === type.value;
                    return (
                        <button
                            key={type.value}
                            onClick={() => handleMediaTypeChange(type.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${isActive
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'bg-transparent text-white hover:bg-gray-800'
                                }`}
                        >
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            {type.label}
                        </button>
                    );
                })}

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative ml-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                        className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all w-48 lg:w-64 text-sm placeholder:text-gray-500"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                    >
                        <Search className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                    </button>
                </form>
            </div>
        </div>
    );
}
