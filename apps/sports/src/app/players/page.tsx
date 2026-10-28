'use client';

import { useEffect, useState } from 'react';
import { usePlayers } from '@/lib/hooks/useBsd';
import PlayerCard from '@/components/bsd/PlayerCard';
import EmptyState from '@/components/EmptyState';
import { Search, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const POSITIONS = [
    { key: '', label: 'All' },
    { key: 'G', label: 'Goalkeepers' },
    { key: 'D', label: 'Defenders' },
    { key: 'M', label: 'Midfielders' },
    { key: 'F', label: 'Forwards' },
];
const PAGE_SIZE = 30;

export default function PlayersPage() {
    const [input, setInput] = useState('');
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [page, setPage] = useState(1);

    // debounce the search box
    useEffect(() => {
        const id = setTimeout(() => { setName(input.trim()); setPage(1); }, 300);
        return () => clearTimeout(id);
    }, [input]);

    const { data, isLoading, isFetching } = usePlayers({ name: name || undefined, position: position || undefined, page });
    const players = data?.results ?? [];
    const total = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-400" />
                <h1 className="text-3xl font-black tracking-tight text-white">Players</h1>
                {total > 0 ? <span className="text-sm text-gray-500">{total.toLocaleString()} total</span> : null}
            </div>

            <label className="relative block max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search players by name — Messi, Salah, Mbappé…"
                    className="block h-11 w-full rounded-xl border border-gray-800 bg-gray-900 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                />
            </label>

            <div className="flex flex-wrap gap-2">
                {POSITIONS.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => { setPosition(p.key); setPage(1); }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            position === p.key ? 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/40' : 'bg-gray-900 text-gray-400 ring-1 ring-gray-800 hover:text-gray-200'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <Grid skeleton />
            ) : players.length === 0 ? (
                <EmptyState Icon={Search} title={name ? `No players for "${name}"` : 'No players'} description="Try another name or position filter." />
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {players.map((p) => <PlayerCard key={p.id} player={p} />)}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-gray-500">Page {page} of {totalPages.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                            <PageBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /> Prev</PageBtn>
                            {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : null}
                            <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></PageBtn>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-teal-500/40 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}

function Grid({ skeleton }: { skeleton?: boolean }) {
    if (!skeleton) return null;
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-[70px] rounded-xl bg-gray-900 animate-pulse" />)}
        </div>
    );
}
