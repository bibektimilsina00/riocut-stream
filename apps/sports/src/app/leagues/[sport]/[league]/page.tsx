'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PlayCircle, Trophy, CalendarOff } from 'lucide-react';
import { useMatchesByCategory, useScoreboard, useStandings } from '@/lib/hooks/useSports';
import { espnSport, findStream, type EspnEvent, type StandingsGroupView } from '@/lib/espn';
import type { Match } from '@/lib/sportsrc';
import EmptyState from '@/components/EmptyState';
import LiveBadge from '@/components/LiveBadge';

export default function LeaguePage({ params }: { params: Promise<{ sport: string; league: string }> }) {
    const { sport, league } = use(params);
    const meta = espnSport(sport);
    const { data: board, isLoading, error } = useScoreboard(sport, league);
    const { data: standings = [] } = useStandings(sport, league);
    // Our playable matches for this sport, to attach Watch buttons to fixtures.
    const { data: streams = [] } = useMatchesByCategory(meta?.category);
    const [tab, setTab] = useState<'matches' | 'standings'>('matches');

    const events = board?.events ?? [];
    const live = events.filter((e) => e.state === 'in');
    const upcoming = events.filter((e) => e.state === 'pre');
    const results = events.filter((e) => e.state === 'post').reverse();

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <Link href={`/leagues?sport=${sport}`} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400">
                <ArrowLeft className="h-3 w-3" /> All {meta?.label ?? ''} competitions
            </Link>

            <header className="flex items-center gap-4">
                {board?.league.logo ? (
                    <Image src={board.league.logo} alt="" width={56} height={56} className="h-14 w-14 object-contain" unoptimized />
                ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-900 text-gray-500"><Trophy className="h-6 w-6" /></div>
                )}
                <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">{meta?.label ?? sport}</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{board?.league.name ?? (isLoading ? '…' : league)}</h1>
                </div>
            </header>

            {standings.length > 0 ? (
                <div className="flex gap-1.5 border-b border-gray-800 pb-2">
                    {(['matches', 'standings'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${tab === t
                                ? 'bg-teal-500/20 text-teal-200 border-teal-500/50'
                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'}`}
                        >
                            {t === 'standings' && sport === 'cricket' ? 'Points table' : t}
                        </button>
                    ))}
                </div>
            ) : null}

            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    Couldn&apos;t load this competition. Try again in a moment.
                </div>
            ) : null}

            {tab === 'standings' && standings.length > 0 ? (
                <div className="space-y-6">
                    {standings.map((g) => <StandingsTable key={g.name} group={g} />)}
                </div>
            ) : isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-900 animate-pulse" />)}
                </div>
            ) : events.length === 0 ? (
                <EmptyState Icon={CalendarOff} title="No fixtures right now" description="This competition has no matches scheduled in the current window." />
            ) : (
                <div className="space-y-8">
                    <FixtureList title="Live" events={live} streams={streams} />
                    <FixtureList title="Upcoming" events={upcoming} streams={streams} />
                    <FixtureList title="Results" events={results.slice(0, 30)} streams={streams} />
                </div>
            )}
        </div>
    );
}

function FixtureList({ title, events, streams }: { title: string; events: EspnEvent[]; streams: Match[] }) {
    if (events.length === 0) return null;
    return (
        <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">{title} <span className="text-xs text-gray-500">({events.length})</span></h2>
            <div className="space-y-2">
                {events.map((e) => <FixtureRow key={e.id} event={e} stream={e.state === 'post' ? null : findStream(e, streams)} />)}
            </div>
        </section>
    );
}

function FixtureRow({ event, stream }: { event: EspnEvent; stream: Match | null }) {
    const when = new Date(event.date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1.5">
                {event.competitors.length === 2 ? (
                    event.competitors.map((c) => (
                        <div key={c.name} className="flex items-center gap-2">
                            {c.logo ? <Image src={c.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" unoptimized /> : <span className="h-5 w-5" />}
                            <span className={`truncate text-sm ${event.state === 'post' && c.winner === false ? 'text-gray-500' : 'text-white font-medium'}`}>{c.name}</span>
                            {c.score ? <span className="ml-auto shrink-0 text-xs tabular-nums text-gray-300">{c.score}</span> : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm font-medium text-white">{event.name}</p>
                )}
                <p className="text-xs text-gray-500">
                    {event.state === 'pre' ? when : event.status}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:w-40 sm:justify-end">
                {event.state === 'in' ? <LiveBadge /> : null}
                {stream ? (
                    <Link
                        href={`/match/${encodeURIComponent(stream.category)}/${encodeURIComponent(stream.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                    >
                        <PlayCircle className="h-3.5 w-3.5" /> Watch
                    </Link>
                ) : event.state === 'pre' ? (
                    <span className="text-[11px] text-gray-500">Stream opens near start</span>
                ) : event.state === 'in' ? (
                    <span className="text-[11px] text-gray-500">No stream yet</span>
                ) : null}
            </div>
        </div>
    );
}

function StandingsTable({ group }: { group: StandingsGroupView }) {
    return (
        <section className="space-y-2">
            {group.name ? <h2 className="text-sm font-semibold text-white">{group.name}</h2> : null}
            <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                    <thead className="bg-gray-900 text-xs text-gray-400">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">#</th>
                            <th className="px-3 py-2 text-left font-medium">Team</th>
                            {group.columns.map((c, i) => <th key={`${c}-${i}`} className="px-3 py-2 text-right font-medium">{c}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {group.rows.map((r, i) => (
                            <tr key={r.name} className="bg-gray-950/40">
                                <td className="px-3 py-2 text-gray-500 tabular-nums">{i + 1}</td>
                                <td className="px-3 py-2">
                                    <span className="flex items-center gap-2">
                                        {r.logo ? <Image src={r.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" unoptimized /> : null}
                                        <span className="truncate text-white">{r.name}</span>
                                    </span>
                                </td>
                                {r.values.map((v, j) => <td key={j} className="px-3 py-2 text-right tabular-nums text-gray-300">{v}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
