import Link from 'next/link';
import { SportCategory } from '@/lib/sportsrc';

interface SportLook {
    emoji: string;
    /** Tailwind gradient classes (from/via/to). */
    gradient: string;
    /** Glow color for hover ring. */
    glow: string;
}

const FALLBACK: SportLook = {
    emoji: '🏆',
    gradient: 'from-teal-500/20 via-gray-900 to-gray-950',
    glow: 'group-hover:shadow-teal-500/30',
};

const LOOKS: Record<string, SportLook> = {
    football: { emoji: '⚽', gradient: 'from-emerald-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-emerald-500/30' },
    basketball: { emoji: '🏀', gradient: 'from-orange-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-orange-500/30' },
    'american-football': { emoji: '🏈', gradient: 'from-amber-600/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-amber-600/30' },
    hockey: { emoji: '🏒', gradient: 'from-cyan-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-cyan-500/30' },
    baseball: { emoji: '⚾', gradient: 'from-rose-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-rose-500/30' },
    'motor-sports': { emoji: '🏎️', gradient: 'from-red-600/30 via-gray-900 to-gray-950', glow: 'group-hover:shadow-red-600/30' },
    fight: { emoji: '🥊', gradient: 'from-red-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-red-500/30' },
    tennis: { emoji: '🎾', gradient: 'from-lime-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-lime-500/30' },
    rugby: { emoji: '🏉', gradient: 'from-yellow-600/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-yellow-600/30' },
    golf: { emoji: '⛳', gradient: 'from-green-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-green-500/30' },
    billiards: { emoji: '🎱', gradient: 'from-cyan-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-cyan-500/30' },
    afl: { emoji: '🏉', gradient: 'from-pink-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-pink-500/30' },
    darts: { emoji: '🎯', gradient: 'from-fuchsia-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-fuchsia-500/30' },
    cricket: { emoji: '🏏', gradient: 'from-teal-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-teal-500/30' },
    other: { emoji: '🏆', gradient: 'from-teal-500/25 via-gray-900 to-gray-950', glow: 'group-hover:shadow-teal-500/30' },
};

export default function SportsTile({ sport }: { sport: SportCategory }) {
    const cat = sport.id ?? sport.name.toLowerCase();
    const look = LOOKS[cat] ?? FALLBACK;

    return (
        <Link
            href={`/sports/${encodeURIComponent(cat)}`}
            className={
                'group relative flex h-28 flex-col justify-end overflow-hidden rounded-2xl border border-gray-800 ' +
                'bg-gradient-to-br ' + look.gradient + ' p-3 transition-all ' +
                'hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg ' + look.glow
            }
        >
            <div
                className="absolute -right-2 -top-2 text-[5rem] leading-none select-none pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))' }}
                aria-hidden
            >
                {look.emoji}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Browse</p>
                <p className="text-lg font-bold capitalize text-white drop-shadow-md">{sport.name}</p>
            </div>
        </Link>
    );
}
