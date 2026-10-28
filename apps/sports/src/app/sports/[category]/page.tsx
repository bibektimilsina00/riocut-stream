'use client';

import { use } from 'react';
import Link from 'next/link';
import { useLeagues, useMatchesByCategory, useScoreboards } from '@/lib/hooks/useSports';
import { FixtureList } from '@/components/Fixtures';
import { sportMeta } from '@/lib/sports';
import LeagueGrid from '@/components/LeagueGrid';
import { isMatchLive, getMatchKickoff, sortMatches } from '@/lib/sportsrc';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { Flame, Clock, CheckCircle2, CalendarOff, FlameKindling, History, Trophy, CalendarDays, Tv } from 'lucide-react';
import type { Match } from '@/lib/sportsrc';

const UPCOMING_LIMIT = 12;
const DAY = 24 * 60 * 60 * 1000;
// ESPN window around today: what's on, the coming week, the last few days.
const FIXTURES_AHEAD = 7 * DAY;
const RESULTS_BEHIND = 3 * DAY;
const RESULTS_LIMIT = 8;

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const category = decodeURIComponent(use(params).category);
    const meta = sportMeta(category);
    const base = `/sports/${encodeURIComponent(category)}`;
    const { data: matches = [], isLoading, error } = useMatchesByCategory(category);
    const { data: allLeagues = [] } = useLeagues();
    const leagues = allLeagues
        .filter((l) => l.sport === meta.espn)
        .sort((a, b) => Number(!!b.current) - Number(!!a.current))
        .slice(0, 6);
    // Series ESPN says are on right now (cricket today). Their fixtures fill
    // the hub even when no stream provider lists the match.
    const onNow = allLeagues.filter((l) => l.sport === meta.espn && l.current);
    const boards = useScoreboards(onNow);

    const now = Date.now();
    const live = sortMatches(matches.filter(isMatchLive));
    const upcoming = sortMatches(matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return !k || k.getTime() >= now;
    }));
    const past = matches
        .filter((m) => {
            if (isMatchLive(m)) return false;
            const k = getMatchKickoff(m);
            return k && k.getTime() < now;
        })
        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
    // Providers list always-on channels (Willow, Fox Cricket) with a stale
    // placeholder date; anything still listed days after "kickoff" is one.
    const finished = past.filter((m) => now - m.date < RESULTS_BEHIND);
    const channels = past.filter((m) => now - m.date >= RESULTS_BEHIND);

    const fixtures = onNow
        .map((l, i) => {
            const events = (boards[i]?.data?.events ?? []).filter((e) =>
                e.state === 'in' ||
                (e.state === 'pre' && e.date - now < FIXTURES_AHEAD) ||
                (e.state === 'post' && now - e.date < RESULTS_BEHIND));
            return { league: l, events };
        })
        .filter((f) => f.events.length > 0);
    // Empty stream sections are just noise once ESPN has the real fixtures.
    const hideEmptyStreams = !isLoading && fixtures.length > 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                    Failed to load matches. Try again in a moment.
                </div>
            ) : null}

            {hideEmptyStreams && live.length === 0 ? null : <Section
                title="Live now"
                count={live.length}
                accent="text-red-400"
                Icon={Flame}
                isLoading={isLoading}
                empty={<EmptyState Icon={FlameKindling} title={`No ${meta.label.toLowerCase()} live right now`} description="Check back when the next match kicks off — live matches will appear here." />}
            >
                <Grid items={live} category={category} />
            </Section>}

            {hideEmptyStreams && upcoming.length === 0 ? null : <Section
                title="Upcoming"
                count={upcoming.length}
                accent="text-teal-400"
                Icon={Clock}
                isLoading={isLoading}
                more={upcoming.length > UPCOMING_LIMIT ? { href: `${base}/schedule`, label: 'Full schedule' } : undefined}
                empty={<EmptyState Icon={CalendarOff} title="No upcoming matches" description="Nothing scheduled yet. Try another sport or check back later." />}
            >
                <Grid items={upcoming.slice(0, UPCOMING_LIMIT)} category={category} />
            </Section>}

            {fixtures.length > 0 ? (
                <section className="space-y-6">
                    <SectionTitle title="Scores & fixtures" accent="text-white" Icon={CalendarDays} />
                    {fixtures.map(({ league, events }) => (
                        <div key={league.id} className="space-y-3">
                            <Link href={`/leagues/${league.id}`} className="block text-sm font-semibold text-teal-300 hover:text-teal-200">
                                {league.name} →
                            </Link>
                            <FixtureList title="Live" events={events.filter((e) => e.state === 'in')} streams={matches} />
                            <FixtureList title="Upcoming" events={events.filter((e) => e.state === 'pre')} streams={matches} />
                            <FixtureList title="Results" events={events.filter((e) => e.state === 'post').reverse()} streams={matches} />
                        </div>
                    ))}
                </section>
            ) : null}

            {leagues.length > 0 ? (
                <section className="space-y-3">
                    <SectionTitle title="Competitions" accent="text-white" Icon={Trophy} more={{ href: `${base}/leagues`, label: 'All competitions' }} />
                    <LeagueGrid items={leagues} />
                </section>
            ) : null}

            {channels.length > 0 ? (
                <section className="space-y-3">
                    <SectionTitle title="24/7 channels" count={channels.length} accent="text-white" Icon={Tv} />
                    <Grid items={channels} category={category} />
                </section>
            ) : null}

            <Section
                title="Recent results"
                count={finished.length}
                accent="text-gray-400"
                Icon={CheckCircle2}
                isLoading={isLoading}
                empty={<EmptyState Icon={History} title="No recent results" description="Past results will show up here once matches wrap up." />}
            >
                <Grid items={finished.slice(0, RESULTS_LIMIT)} category={category} />
            </Section>
        </div>
    );
}

type More = { href: string; label: string };

function SectionTitle({ title, count, accent, Icon, more }: {
    title: string;
    count?: number;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
    more?: More;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${accent}`} />
            <h2 className={`text-xl font-semibold ${accent}`}>{title}</h2>
            {count !== undefined ? <span className="text-xs text-gray-500">({count})</span> : null}
            {more ? (
                <Link href={more.href} className="ml-auto text-sm text-gray-400 hover:text-teal-400">{more.label} →</Link>
            ) : null}
        </div>
    );
}

function Section({
    title, count, accent, Icon, isLoading, more, empty, children,
}: {
    title: string;
    count: number;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
    isLoading: boolean;
    more?: More;
    empty: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <SectionTitle title={title} count={count} accent={accent} Icon={Icon} more={more} />
            {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-52 rounded-xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : count === 0 ? (
                empty
            ) : (
                children
            )}
        </section>
    );
}

function Grid({ items, category }: { items: Match[]; category: string }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
                <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
            ))}
        </div>
    );
}
