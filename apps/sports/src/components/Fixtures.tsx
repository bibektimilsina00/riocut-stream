'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { findStream, type EspnEvent } from '@/lib/espn';
import type { Match } from '@/lib/sportsrc';
import LiveBadge from '@/components/LiveBadge';

/** ESPN fixtures with a Watch button wherever we have a matching stream. */
export function FixtureList({ title, events, streams }: { title: string; events: EspnEvent[]; streams: Match[] }) {
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
                            {c.logo ? (
                                // ESPN hands out logo URLs that 404 for smaller teams (all of NPL).
                                <Image src={c.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" unoptimized onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                            ) : <span className="h-5 w-5" />}
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
