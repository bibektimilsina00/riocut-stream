'use client';

import { useMemo, useState } from 'react';
import { useSportsCategories, useMatchesByCategory } from '@/lib/hooks/useSports';
import MatchCard from '@/components/MatchCard';
import { getMatchKickoff } from '@/lib/sportsrc';

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function ScheduleForCategory({ category, day }: { category: string; day: Date }) {
    const { data: matches = [] } = useMatchesByCategory(category);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const filtered = matches.filter((m) => {
        const k = getMatchKickoff(m);
        if (!k) return false;
        const t = k.getTime();
        return t >= dayStart && t < dayEnd;
    });
    if (filtered.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold capitalize text-gray-400">{category}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

export default function SchedulePage() {
    const { data: sports = [] } = useSportsCategories();
    const [dayOffset, setDayOffset] = useState(0);

    const days = useMemo(() => {
        const arr: Date[] = [];
        const today = startOfDay(new Date());
        for (let i = 0; i < 7; i++) arr.push(new Date(today.getTime() + i * 86400000));
        return arr;
    }, []);

    const day = days[dayOffset];

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Schedule</h1>
                <p className="text-gray-400">Upcoming matches across all sports.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {days.map((d, i) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    const active = i === dayOffset;
                    return (
                        <button
                            key={i}
                            onClick={() => setDayOffset(i)}
                            className={
                                'rounded-md border px-3 py-2 text-xs ' +
                                (active ? 'bg-primary text-primary-foreground border-primary' : 'border-gray-800 hover:bg-gray-800')
                            }
                        >
                            <div className="font-semibold">
                                {isToday ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                            <div className="opacity-70">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-8">
                {sports.length === 0 ? (
                    <p className="text-sm text-gray-400">Loading sports…</p>
                ) : (
                    sports.slice(0, 8).map((s) => (
                        <ScheduleForCategory
                            key={(s.id ?? s.name).toString()}
                            category={(s.id ?? s.name ?? '').toString().toLowerCase()}
                            day={day}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
