import Link from 'next/link';
import type { TeamListItem } from '@/lib/bsd/v2-types';
import { initials, flagEmoji } from '@/lib/bsd/format';
import { Shield } from 'lucide-react';

/** Compact team card for list + search grids. */
export default function TeamCard({ team }: { team: TeamListItem }) {
    const flag = flagEmoji(team.country);
    return (
        <Link
            href={`/teams/${team.id}`}
            className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 p-3 transition-all hover:-translate-y-0.5 hover:border-teal-500/40"
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-600/20 text-sm font-bold text-teal-200 ring-1 ring-teal-500/20">
                {team.name ? initials(team.name) : <Shield className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white group-hover:text-teal-300">{team.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    {flag ? <span>{flag}</span> : null}
                    <span className="truncate">{team.country ?? 'Club'}</span>
                </span>
            </span>
        </Link>
    );
}
