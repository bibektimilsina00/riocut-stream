'use client';

import { useMemo, useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { getMatchKickoff, sortMatches } from '@/lib/sportsrc';
import { sportMeta } from '@/lib/sports';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function DayMatches({ category, day, single }: { category: string; day: Date; single: boolean }) {
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const dayStart = startOfDay(day).getTime();
    const filtered = sortMatches(matches).filter((m) => {
        const t = getMatchKickoff(m)?.getTime();
        return t !== undefined && t >= dayStart && t < dayStart + DAY;
    });
    if (isLoading && single) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-52 rounded-xl bg-gray-900 animate-pulse" />)}
            </div>
        );
    }
    if (filtered.length === 0) {
        return single
            ? <EmptyState Icon={CalendarOff} title="No matches this day" description="Pick another day — fixtures show up here as soon as they're announced." />
            : null;
    }
    const meta = sportMeta(category);
    return (
        <div className="space-y-3">
            {single ? null : (
                <h3 className="text-sm font-semibold text-gray-400">{meta.emoji} {meta.label}</h3>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

/** 7-day picker over one or more sports' fixtures. */
export default function ScheduleView({ categories }: { categories: string[] }) {
    const [dayOffset, setDayOffset] = useState(0);
    const days = useMemo(() => {
        const today = startOfDay(new Date()).getTime();
        return Array.from({ length: 7 }, (_, i) => new Date(today + i * DAY));
    }, []);
    const day = days[dayOffset];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {days.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => setDayOffset(i)}
                        className={
                            'rounded-md border px-3 py-2 text-xs ' +
                            (i === dayOffset ? 'bg-teal-500/20 text-teal-200 border-teal-500/50' : 'border-gray-800 text-gray-300 hover:bg-gray-800')
                        }
                    >
                        <div className="font-semibold">
                            {i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </div>
                        <div className="opacity-70">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    </button>
                ))}
            </div>

            <div className="space-y-8">
                {categories.length === 0 ? (
                    <p className="text-sm text-gray-400">Loading sports…</p>
                ) : (
                    categories.map((c) => <DayMatches key={c} category={c} day={day} single={categories.length === 1} />)
                )}
            </div>
        </div>
    );
}
