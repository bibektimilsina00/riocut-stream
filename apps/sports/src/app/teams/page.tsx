'use client';

import { useEffect, useState } from 'react';
import { useTeams } from '@/lib/hooks/useBsd';
import TeamCard from '@/components/bsd/TeamCard';
import EmptyState from '@/components/EmptyState';
import { Search, Shield, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 30;

export default function TeamsPage() {
    const [input, setInput] = useState('');
    const [name, setName] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const id = setTimeout(() => { setName(input.trim()); setPage(1); }, 300);
        return () => clearTimeout(id);
    }, [input]);

    const { data, isLoading, isFetching } = useTeams({ name: name || undefined, page });
    const teams = data?.results ?? [];
    const total = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-teal-400" />
                <h1 className="text-3xl font-black tracking-tight text-white">Teams</h1>
                {total > 0 ? <span className="text-sm text-gray-500">{total.toLocaleString()} total</span> : null}
            </div>

            <label className="relative block max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search teams — Real Madrid, Arsenal, Argentina…"
                    className="block h-11 w-full rounded-xl border border-gray-800 bg-gray-900 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                />
            </label>

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-[70px] rounded-xl bg-gray-900 animate-pulse" />)}
                </div>
            ) : teams.length === 0 ? (
                <EmptyState Icon={Search} title={name ? `No teams for "${name}"` : 'No teams'} description="Try another name." />
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {teams.map((t) => <TeamCard key={t.id} team={t} />)}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-gray-500">Page {page} of {totalPages.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:border-teal-500/40 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Prev</button>
                            {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : null}
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:border-teal-500/40 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
