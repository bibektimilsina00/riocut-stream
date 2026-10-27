'use client';

import { useSportsCategories } from '@/lib/hooks/useSports';
import SportsTile from '@/components/SportsTile';

export default function SportsPage() {
    const { data: sports = [], isLoading } = useSportsCategories();

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">All Sports</h1>
                <p className="text-gray-400">Pick a sport to browse live and upcoming matches.</p>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-gray-800 animate-pulse" />
                    ))
                    : sports.map((s, i) => (
                        <SportsTile key={(s.id ?? s.name ?? i).toString()} sport={s} />
                    ))}
            </div>
        </div>
    );
}
