'use client';

import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { findStream, type EspnEvent } from '@/lib/espn';
import type { Match } from '@/lib/sportsrc';
import { Badge, RowList, When } from './MatchRow';

/** ESPN fixtures as compact rows; a row links to the stream when we carry one. */
export function FixtureList({ title, events, streams }: { title?: string; events: EspnEvent[]; streams: Match[] }) {
    if (events.length === 0) return null;
    return (
        <section className="space-y-2">
            {title ? <h2 className="text-sm font-semibold text-white">{title} <span className="text-xs text-gray-500">({events.length})</span></h2> : null}
            <RowList>
                {events.map((e) => <FixtureRow key={e.id} event={e} stream={e.state === 'post' ? null : findStream(e, streams)} />)}
            </RowList>
        </section>
    );
}

export function FixtureRow({ event, stream }: { event: EspnEvent; stream: Match | null }) {
    const post = event.state === 'post';
    const body = (
        <>
            {post ? (
                <div className="w-14 shrink-0 text-center text-[11px] font-medium uppercase text-gray-500">Result</div>
            ) : (
                <When live={event.state === 'in'} kickoff={new Date(event.date)} />
            )}
            <div className="min-w-0 flex-1 space-y-1">
                {event.competitors.length === 2 ? (
                    event.competitors.map((c) => (
                        <div key={c.name} className="flex items-center gap-2">
                            <Badge src={c.logo} />
                            <span className={`min-w-0 flex-1 truncate text-sm ${post && c.winner === false ? 'text-gray-500' : 'text-white'}`}>{c.name}</span>
                            {c.score ? <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-200">{c.score}</span> : null}
                        </div>
                    ))
                ) : (
                    <p className="truncate text-sm text-white">{event.name}</p>
                )}
                {event.state !== 'pre' && event.status ? (
                    <p className={`truncate text-[11px] ${event.state === 'in' ? 'text-red-300' : 'text-gray-500'}`}>{event.status}</p>
                ) : null}
            </div>
            {stream ? <PlayCircle className="h-5 w-5 shrink-0 text-teal-400" aria-label="Watch" /> : null}
        </>
    );
    return stream ? (
        <Link
            href={`/match/${encodeURIComponent(stream.category)}/${encodeURIComponent(stream.id)}`}
            className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-800/60"
        >
            {body}
        </Link>
    ) : (
        <div className="flex items-center gap-3 px-3 py-2.5">{body}</div>
    );
}
