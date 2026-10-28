'use client';

import { use } from 'react';
import { Radio, Trophy } from 'lucide-react';
import { useLeagues } from '@/lib/hooks/useSports';
import { sportMeta } from '@/lib/sports';
import LeagueGrid from '@/components/LeagueGrid';
import EmptyState from '@/components/EmptyState';

export default function SportLeaguesPage({ params }: { params: Promise<{ category: string }> }) {
    const meta = sportMeta(decodeURIComponent(use(params).category));
    const { data = [], isLoading, error } = useLeagues();
    const leagues = data.filter((l) => l.sport === meta.espn);
    const current = leagues.filter((l) => l.current);
    const regular = leagues.filter((l) => !l.current);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    Failed to load competitions. Reload to try again.
                </div>
            ) : null}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-900 animate-pulse" />)}
                </div>
            ) : leagues.length === 0 ? (
                <EmptyState Icon={Trophy} title={`No ${meta.label.toLowerCase()} competitions`} description="We don't track standings for this sport yet — live matches are on the Overview tab." />
            ) : (
                <>
                    {current.length > 0 ? (
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Radio className="h-4 w-4 text-red-400" /> On now
                            </h2>
                            <LeagueGrid items={current} />
                        </section>
                    ) : null}
                    {regular.length > 0 ? (
                        <section className="space-y-3">
                            {current.length > 0 ? <h2 className="text-sm font-semibold text-white">Major competitions</h2> : null}
                            <LeagueGrid items={regular} />
                        </section>
                    ) : null}
                </>
            )}
        </div>
    );
}
