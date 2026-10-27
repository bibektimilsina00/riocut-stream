import Image from 'next/image';
import { ScoreEntry } from '@/lib/sportsrc';

export default function ScoreboardCard({ entry }: { entry: ScoreEntry }) {
    const dateLabel = entry.utcDate
        ? new Date(entry.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
    const home = entry.homeTeam ?? {};
    const away = entry.awayTeam ?? {};
    const hs = entry.score?.fullTime?.home ?? null;
    const as = entry.score?.fullTime?.away ?? null;
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-3 space-y-2">
            <p className="text-xs text-gray-500">
                {dateLabel}{entry.competition?.name ? ` · ${entry.competition.name}` : ''}
                {entry.status ? ` · ${entry.status}` : ''}
            </p>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 flex-1 min-w-0 text-white">
                    {home.crest ? (
                        <Image src={home.crest} alt={home.name ?? 'home'} width={18} height={18} className="h-4 w-4 object-contain shrink-0" unoptimized />
                    ) : null}
                    <span className="truncate">{home.name ?? '—'}</span>
                </span>
                <span className="px-2 font-mono font-semibold text-teal-400">{hs ?? '?'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 flex-1 min-w-0 text-white">
                    {away.crest ? (
                        <Image src={away.crest} alt={away.name ?? 'away'} width={18} height={18} className="h-4 w-4 object-contain shrink-0" unoptimized />
                    ) : null}
                    <span className="truncate">{away.name ?? '—'}</span>
                </span>
                <span className="px-2 font-mono font-semibold text-teal-400">{as ?? '?'}</span>
            </div>
        </div>
    );
}
