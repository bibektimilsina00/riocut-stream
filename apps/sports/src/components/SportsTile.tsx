import Link from 'next/link';
import { SportCategory } from '@/lib/sportsrc';
import { sportMeta } from '@/lib/sports';

export default function SportsTile({ sport }: { sport: SportCategory }) {
    const cat = sport.id ?? sport.name.toLowerCase();
    const look = sportMeta(cat);

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
