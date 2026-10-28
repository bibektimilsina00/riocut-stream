'use client';

import { useSportsCategories } from '@/lib/hooks/useSports';
import ScheduleView from '@/components/ScheduleView';

export default function SchedulePage() {
    const { data: sports = [] } = useSportsCategories();
    const categories = sports.map((s) => (s.id ?? s.name ?? '').toString().toLowerCase());

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Schedule</h1>
                <p className="text-gray-400">Upcoming matches across all sports.</p>
            </div>
            <ScheduleView categories={categories} />
        </div>
    );
}
