'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { useSportsCategories, useLeagues, sportsKeys } from '@/lib/hooks/useSports';
import { ESPN_SPORTS } from '@/lib/espn';
import { sportsrc, sortMatches, isMatchLive, type Match } from '@/lib/sportsrc';
import { Search, Loader2, Radio, CalendarClock, Trophy, Activity } from 'lucide-react';

/**
 * Realtime search box for the top bar. Results appear in a dropdown as the user
 * types (debounced), across matches / leagues / sports. Enter opens the full
 * search page; clicking a result jumps straight to it.
 */
export default function SearchBox({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
    const router = useRouter();
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const boxRef = useRef<HTMLDivElement>(null);

    // debounce input
    useEffect(() => {
        const id = setTimeout(() => setDebounced(q.trim().toLowerCase()), 200);
        return () => clearTimeout(id);
    }, [q]);

    // close on outside click
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const enabled = debounced.length >= 2;
    const { data: sports = [] } = useSportsCategories();
    const { data: leagues = [] } = useLeagues();

    const matchQueries = useQueries({
        queries: sports.map((s) => ({
            queryKey: sportsKeys.matches(s.id),
            queryFn: () => sportsrc.getMatches(s.id),
            staleTime: 60_000,
            enabled,
        })),
    });
    const matchesLoading = enabled && matchQueries.some((qq) => qq.isLoading);

    const results = useMemo(() => {
        if (!enabled) return { matches: [], leagues: [], sports: [] };
        const term = debounced;
        const allMatches: Array<{ match: Match; category: string }> = [];
        matchQueries.forEach((qq, i) => {
            const cat = sports[i]?.id;
            if (!cat || !qq.data) return;
            for (const m of qq.data) allMatches.push({ match: m, category: cat });
        });
        const matches = sortMatches(
            allMatches
                .filter(({ match: m }) =>
                    (m.title ?? '').toLowerCase().includes(term) ||
                    (m.teams?.home?.name ?? '').toLowerCase().includes(term) ||
                    (m.teams?.away?.name ?? '').toLowerCase().includes(term),
                )
                .map((x) => x.match),
        )
            .slice(0, 6)
            .map((m) => ({ m, category: m.category }));

        const lg = leagues
            .filter((l) => l.name.toLowerCase().includes(term))
            .slice(0, 4);
        const sp = sports
            .filter((s) => (s.name ?? '').toLowerCase().includes(term) || (s.id ?? '').toLowerCase().includes(term))
            .slice(0, 4);
        return { matches, leagues: lg, sports: sp };
    }, [enabled, debounced, matchQueries, sports, leagues]);

    // flat list for keyboard nav
    const flat = useMemo(() => {
        const items: Array<{ href: string; label: string }> = [];
        results.matches.forEach(({ m, category }) => items.push({ href: `/match/${encodeURIComponent(category)}/${encodeURIComponent(m.id)}`, label: m.title }));
        results.leagues.forEach((l) => items.push({ href: `/leagues/${l.id}`, label: l.name }));
        results.sports.forEach((s) => items.push({ href: `/sports/${encodeURIComponent(s.id)}`, label: s.name }));
        return items;
    }, [results]);

    useEffect(() => setActive(0), [debounced]);

    function go(href: string) {
        setOpen(false);
        setQ('');
        router.push(href);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); setOpen(true); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (open && flat[active]) go(flat[active].href);
            else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
        } else if (e.key === 'Escape') setOpen(false);
    }

    const width = variant === 'desktop' ? 'w-48 lg:w-64 xl:w-72' : 'w-full';
    const hasResults = flat.length > 0;

    return (
        <div ref={boxRef} className={`relative ${variant === 'desktop' ? 'hidden md:block' : ''}`}>
            <div className="relative">
                <input
                    type="text"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder="Search matches, teams, leagues..."
                    className={`bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all ${width} text-sm placeholder:text-gray-500`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {matchesLoading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Search className="w-4 h-4 text-gray-400" />}
                </span>
            </div>

            {open && enabled ? (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-xl border border-gray-800 bg-gray-950/98 shadow-2xl backdrop-blur">
                    {!hasResults ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                            {matchesLoading ? 'Searching…' : `No results for "${q.trim()}"`}
                        </div>
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto py-1">
                            <Group label="Matches">
                                {results.matches.map(({ m, category }, i) => (
                                    <Row key={m.id} active={active === i} onClick={() => go(`/match/${encodeURIComponent(category)}/${encodeURIComponent(m.id)}`)}
                                        icon={isMatchLive(m) ? <Radio className="h-3.5 w-3.5 text-red-500" /> : <CalendarClock className="h-3.5 w-3.5 text-gray-500" />}
                                        title={m.title} subtitle={category} badge={m.popular ? 'Popular' : isMatchLive(m) ? 'LIVE' : undefined} />
                                ))}
                            </Group>
                            <Group label="Leagues">
                                {results.leagues.map((l, i) => (
                                    <Row key={l.id} active={active === results.matches.length + i} onClick={() => go(`/leagues/${l.id}`)}
                                        icon={<Trophy className="h-3.5 w-3.5 text-gray-500" />} title={l.name} subtitle={ESPN_SPORTS.find((x) => x.key === l.sport)?.label ?? ''} />
                                ))}
                            </Group>
                            <Group label="Sports">
                                {results.sports.map((s, i) => (
                                    <Row key={s.id} active={active === results.matches.length + results.leagues.length + i} onClick={() => go(`/sports/${encodeURIComponent(s.id)}`)}
                                        icon={<Activity className="h-3.5 w-3.5 text-gray-500" />} title={s.name} subtitle="Sport" />
                                ))}
                            </Group>
                            <button onMouseDown={(e) => { e.preventDefault(); go(`/search?q=${encodeURIComponent(q.trim())}`); }}
                                className="w-full border-t border-gray-800 px-4 py-2.5 text-left text-xs text-teal-400 hover:bg-gray-900">
                                See all results for “{q.trim()}” →
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    const arr = Array.isArray(children) ? children.filter(Boolean) : children;
    if (Array.isArray(arr) && arr.length === 0) return null;
    return (
        <div>
            <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-600">{label}</p>
            {children}
        </div>
    );
}

function Row({ active, onClick, icon, title, subtitle, badge }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; badge?: string;
}) {
    return (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className={`flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors ${active ? 'bg-teal-500/10' : 'hover:bg-gray-900'}`}
        >
            <span className="shrink-0">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{title}</span>
                {subtitle ? <span className="block truncate text-[11px] capitalize text-gray-500">{subtitle}</span> : null}
            </span>
            {badge ? <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-gray-300">{badge}</span> : null}
        </button>
    );
}
