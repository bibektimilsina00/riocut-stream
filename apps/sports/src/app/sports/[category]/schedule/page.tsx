'use client';

import { use } from 'react';
import ScheduleView from '@/components/ScheduleView';

export default function SportSchedulePage({ params }: { params: Promise<{ category: string }> }) {
    const category = decodeURIComponent(use(params).category);
    return (
        <div className="container mx-auto px-4 py-8">
            <ScheduleView categories={[category]} />
        </div>
    );
}
