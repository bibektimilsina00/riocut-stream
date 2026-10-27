'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Pagination from '@riocut/ui/components/ui/pagination';
import { useChannels, useFilters } from '@/lib/hooks/useTv';
import ChannelGrid from '@/components/ChannelGrid';
import SearchBox from '@/components/SearchBox';
import FilterBar from '@/components/FilterBar';

const PAGE_SIZE = 60;

export default function BrowsePage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <BrowseInner />
        </Suspense>
    );
}

function BrowseInner() {
    const { data: channels = [], isLoading } = useChannels();
    const { data: filters } = useFilters();
    const searchParams = useSearchParams();

    const [q, setQ] = useState('');
    const [country, setCountry] = useState('');
    const [category, setCategory] = useState('');
    const [language, setLanguage] = useState('');
    const [page, setPage] = useState(1);

    // Seed search from ?q= (e.g. nav search box).
    useEffect(() => {
        const initial = searchParams.get('q');
        if (initial) setQ(initial);
    }, [searchParams]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return channels.filter(
            (c) =>
                (!needle || c.name.toLowerCase().includes(needle)) &&
                (!country || c.country?.code === country) &&
                (!category || c.categories.includes(category)) &&
                (!language || c.languages.includes(language)),
        );
    }, [channels, q, country, category, language]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const reset = () => setPage(1);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <h1 className="text-2xl font-bold">Browse channels</h1>
            <div className="flex flex-col gap-4">
                <SearchBox
                    value={q}
                    onChange={(v) => {
                        setQ(v);
                        reset();
                    }}
                />
                {filters && (
                    <FilterBar
                        countries={filters.countries}
                        categories={filters.categories}
                        languages={filters.languages}
                        country={country}
                        category={category}
                        language={language}
                        onCountry={(v) => {
                            setCountry(v);
                            reset();
                        }}
                        onCategory={(v) => {
                            setCategory(v);
                            reset();
                        }}
                        onLanguage={(v) => {
                            setLanguage(v);
                            reset();
                        }}
                    />
                )}
            </div>
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">{filtered.length} channels</p>
                    <ChannelGrid channels={pageItems} />
                    {totalPages > 1 && <Pagination currentPage={current} totalPages={totalPages} onPageChange={setPage} />}
                </>
            )}
        </div>
    );
}
