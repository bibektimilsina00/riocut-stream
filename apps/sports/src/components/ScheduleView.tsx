'use client';

import { useMemo, useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { getMatchKickoff } from '@/lib/sportsrc';
import { sportMeta } from '@/lib/sports';
import MatchRow, { RowList, RowSkeleton } from '@/components/MatchRow';
import EmptyState from '@/components/EmptyState';

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

// All-sports view: a busy football Saturday shouldn't bury every other sport.
const COLLAPSED = 8;

function DayMatches({ category, day, single }: { category: string; day: Date; single: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const dayStart = startOfDay(day).getTime();
    const filtered = [...matches].sort((a, b) => a.date - b.date).filter((m) => {
        const t = getMatchKickoff(m)?.getTime();
        return t !== undefined && t >= dayStart && t < dayStart + DAY;
    });
    if (isLoading && single) {
        return <RowSkeleton rows={5} />;
    }
    if (filtered.length === 0) {
        return single
            ? <EmptyState Icon={CalendarOff} title="No matches this day" description="Pick another day — fixtures show up here as soon as they're announced." />
            : null;
    }
    const meta = sportMeta(category);
    return (
        <div className="space-y-2">
            {single ? null : (
                <h3 className="text-sm font-semibold text-gray-300">{meta.emoji} {meta.label} <span className="text-xs font-normal text-gray-500">{filtered.length}</span></h3>
            )}
            <RowList>
                {(single || expanded ? filtered : filtered.slice(0, COLLAPSED)).map((m) => <MatchRow key={`${category}-${m.id}`} match={m} />)}
                {!single && !expanded && filtered.length > COLLAPSED ? (
                    <button onClick={() => setExpanded(true)} className="w-full px-3 py-2 text-center text-xs text-teal-300 hover:bg-gray-800/60">
                        Show {filtered.length - COLLAPSED} more {meta.label.toLowerCase()}
                    </button>
                ) : null}
            </RowList>
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
            <div className="grid grid-cols-7 gap-1.5">
                {days.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => setDayOffset(i)}
                        className={
                            'rounded-lg border px-1 py-2 text-[11px] sm:text-xs ' +
                            (i === dayOffset ? 'bg-teal-500/20 text-teal-200 border-teal-500/50' : 'border-gray-800 text-gray-300 hover:bg-gray-800')
                        }
                    >
                        <div className="font-semibold">
                            {i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </div>
                        <div className="opacity-70">{d.getDate()}</div>
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
