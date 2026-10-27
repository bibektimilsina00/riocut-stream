import Link from 'next/link';
import type { PlayerListItem, SquadPlayer } from '@/lib/bsd/v2-types';
import { formatMarketValue, initials, flagEmoji } from '@/lib/bsd/format';

/** Compact player card used in list, search, and squad grids. */
export default function PlayerCard({ player }: { player: PlayerListItem | SquadPlayer }) {
    const mv = formatMarketValue(player.marketValueEur);
    const flag = flagEmoji(player.nationality);
    const pos = player.position ?? null;
    return (
        <Link
            href={`/players/${player.id}`}
            className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 p-3 transition-all hover:-translate-y-0.5 hover:border-teal-500/40"
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-sm font-bold text-gray-200 ring-1 ring-gray-700">
                {initials(player.name)}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white group-hover:text-teal-300">{player.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    {flag ? <span>{flag}</span> : null}
                    <span className="truncate">{player.nationality ?? 'Unknown'}</span>
                    {pos ? <span className="rounded bg-gray-800 px-1.5 py-0.5 font-medium text-gray-400">{pos}</span> : null}
                </span>
            </span>
            {mv ? <span className="shrink-0 text-xs font-semibold text-emerald-400">{mv}</span> : null}
        </Link>
    );
}
