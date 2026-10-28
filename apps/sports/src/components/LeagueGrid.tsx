import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ESPN_SPORTS } from '@/lib/espn';

export default function LeagueGrid({ items }: { items: Array<{ id: string; name: string; sport: string }> }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
                <Link
                    key={l.id}
                    href={`/leagues/${l.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 transition-colors hover:border-teal-500/40"
                >
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{l.name}</span>
                        <span className="block text-[11px] uppercase tracking-wider text-gray-500">
                            {ESPN_SPORTS.find((s) => s.key === l.sport)?.label}
                        </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-teal-400" />
                </Link>
            ))}
        </div>
    );
}
