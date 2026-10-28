'use client';

import { use } from 'react';
import Link from 'next/link';
import { useLeagues, useMatchesByCategory, useScoreboards } from '@/lib/hooks/useSports';
import { isMatchLive, getMatchKickoff, sortMatches } from '@/lib/sportsrc';
import { sportMeta } from '@/lib/sports';
import { CURATED_LEAGUES, findStream, type EspnEvent } from '@/lib/espn';
import MatchRow, { RowList, RowSkeleton } from '@/components/MatchRow';
import { FixtureRow } from '@/components/Fixtures';
import EmptyState from '@/components/EmptyState';
import { Flame, Clock, CheckCircle2, CalendarOff, Trophy, Tv } from 'lucide-react';

const DAY = 24 * 60 * 60 * 1000;
const LIVE_LIMIT = 8;
const UPCOMING_LIMIT = 6;
const RESULTS_LIMIT = 4;
const PANEL_LIMIT = 6;
const PANEL_ROWS = 3;
// ESPN window around today: what's on, the coming week, the last few days.
const FIXTURES_AHEAD = 7 * DAY;
const RESULTS_BEHIND = 3 * DAY;

/** The few fixtures worth a glance: live first, then the next ones, then the latest results. */
function highlights(events: EspnEvent[]): EspnEvent[] {
    const live = events.filter((e) => e.state === 'in');
    const next = events.filter((e) => e.state === 'pre').sort((a, b) => a.date - b.date);
    const done = events.filter((e) => e.state === 'post').sort((a, b) => b.date - a.date);
    return [...live, ...next, ...done].slice(0, PANEL_ROWS);
}

const curatedRank = (sport: string, slug: string) => {
    const i = CURATED_LEAGUES.findIndex((l) => l.sport === sport && l.slug === slug);
    return i === -1 ? CURATED_LEAGUES.length : i;
};

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const category = decodeURIComponent(use(params).category);
    const meta = sportMeta(category);
    const base = `/sports/${encodeURIComponent(category)}`;
    const { data: matches = [], isLoading, error } = useMatchesByCategory(category);
    const { data: allLeagues = [] } = useLeagues();
    const sportLeagues = allLeagues.filter((l) => l.sport === meta.espn);

    // Series ESPN says are on right now (cricket today); each becomes a panel.
    const onNow = sportLeagues.filter((l) => l.current);
    const boards = useScoreboards(onNow);

    const now = Date.now();
    const live = sortMatches(matches.filter(isMatchLive));
    const upcoming = sortMatches(matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return !k || k.getTime() >= now;
    }));
    const past = matches
        .filter((m) => !isMatchLive(m) && (getMatchKickoff(m)?.getTime() ?? now) < now)
        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
    // Providers list always-on channels (Willow, Fox Cricket) with a stale
    // placeholder date; anything still listed days after "kickoff" is one.
    const results = past.filter((m) => now - m.date < RESULTS_BEHIND);
    const channels = past.filter((m) => now - m.date >= RESULTS_BEHIND);

    const panels = onNow
        .map((league, i) => {
            const events = (boards[i]?.data?.events ?? []).filter((e) =>
                e.state === 'in' ||
                (e.state === 'pre' && e.date - now < FIXTURES_AHEAD) ||
                (e.state === 'post' && now - e.date < RESULTS_BEHIND));
            return { league, events, live: events.filter((e) => e.state === 'in').length };
        })
        .filter((p) => p.events.length > 0)
        // Big, hand-picked competitions first (NPL, IPL…), then whatever is busiest.
        .sort((a, b) => curatedRank(a.league.sport, a.league.slug) - curatedRank(b.league.sport, b.league.slug) || b.live - a.live);
    const boardsLoading = boards.some((b) => b.isLoading);
    const nothing = !isLoading && !boardsLoading && !live.length && !upcoming.length && !results.length && !panels.length && !channels.length;

    return (
        <div className="container mx-auto px-4 py-6 space-y-8">
            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                    Failed to load matches. Try again in a moment.
                </div>
            ) : null}

            {isLoading ? <RowSkeleton rows={4} /> : null}

            {live.length > 0 ? (
                <Section title="Live now" count={live.length} accent="text-red-400" Icon={Flame}>
                    <RowList>{live.slice(0, LIVE_LIMIT).map((m) => <MatchRow key={m.id} match={m} />)}</RowList>
                </Section>
            ) : null}

            {panels.length > 0 ? (
                <Section title="Competitions on now" accent="text-white" Icon={Trophy} more={{ href: `${base}/leagues`, label: 'All' }}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {panels.slice(0, PANEL_LIMIT).map(({ league, events, live: n }) => (
                            <div key={league.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Link href={`/leagues/${league.id}`} className="min-w-0 truncate text-sm font-semibold text-teal-300 hover:text-teal-200">
                                        {league.name}
                                    </Link>
                                    {n > 0 ? <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300">{n} live</span> : null}
                                    <Link href={`/leagues/${league.id}`} className="ml-auto shrink-0 text-xs text-gray-400 hover:text-teal-400">
                                        View all {events.length} →
                                    </Link>
                                </div>
                                <RowList>
                                    {highlights(events).map((e) => (
                                        <FixtureRow key={e.id} event={e} stream={e.state === 'post' ? null : findStream(e, matches)} />
                                    ))}
                                </RowList>
                            </div>
                        ))}
                    </div>
                </Section>
            ) : boardsLoading ? <RowSkeleton /> : null}

            {upcoming.length > 0 ? (
                <Section
                    title="Upcoming streams"
                    count={upcoming.length}
                    accent="text-teal-400"
                    Icon={Clock}
                    more={upcoming.length > UPCOMING_LIMIT ? { href: `${base}/schedule`, label: 'Full schedule' } : undefined}
                >
                    <RowList>{upcoming.slice(0, UPCOMING_LIMIT).map((m) => <MatchRow key={m.id} match={m} />)}</RowList>
                </Section>
            ) : null}

            {panels.length === 0 && sportLeagues.length > 0 ? (
                <Section title="Competitions" accent="text-white" Icon={Trophy} more={{ href: `${base}/leagues`, label: 'All' }}>
                    <div className="flex flex-wrap gap-2">
                        {sportLeagues.slice(0, 10).map((l) => (
                            <Link key={l.id} href={`/leagues/${l.id}`} className="rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 hover:border-teal-500/40 hover:text-teal-300">
                                {l.name}
                            </Link>
                        ))}
                    </div>
                </Section>
            ) : null}

            {channels.length > 0 ? (
                <Section title="24/7 channels" accent="text-white" Icon={Tv}>
                    <div className="flex flex-wrap gap-2">
                        {channels.map((m) => (
                            <Link key={m.id} href={`/match/${encodeURIComponent(m.category)}/${encodeURIComponent(m.id)}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 hover:border-teal-500/40 hover:text-teal-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {m.title}
                            </Link>
                        ))}
                    </div>
                </Section>
            ) : null}

            {results.length > 0 ? (
                <Section title="Recent results" accent="text-gray-400" Icon={CheckCircle2}>
                    <RowList>{results.slice(0, RESULTS_LIMIT).map((m) => <MatchRow key={m.id} match={m} />)}</RowList>
                </Section>
            ) : null}

            {nothing ? (
                <EmptyState Icon={CalendarOff} title={`No ${meta.label.toLowerCase()} right now`} description="Nothing live or scheduled this week. Check back soon or pick another sport above." />
            ) : null}
        </div>
    );
}

function Section({ title, count, accent, Icon, more, children }: {
    title: string;
    count?: number;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
    more?: { href: string; label: string };
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${accent}`} />
                <h2 className={`text-lg font-semibold ${accent}`}>{title}</h2>
                {count !== undefined ? <span className="text-xs text-gray-500">{count}</span> : null}
                {more ? <Link href={more.href} className="ml-auto text-xs text-gray-400 hover:text-teal-400">{more.label} →</Link> : null}
            </div>
            {children}
        </section>
    );
}

