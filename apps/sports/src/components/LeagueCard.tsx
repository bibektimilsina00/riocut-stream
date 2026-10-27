'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Trophy, BarChart3, ArrowRight, ListOrdered } from 'lucide-react';
import { getLeagueMeta, getEmblemUrl } from '@/lib/leagueMeta';
import { useStandings } from '@/lib/hooks/useSports';

interface Props {
    id: string;
    name: string;
    featured?: boolean;
}

export default function LeagueCard({ id, name, featured = false }: Props) {
    const meta = getLeagueMeta(id);
    const emblem = getEmblemUrl(id);
    const [emblemBroken, setEmblemBroken] = useState(false);

    if (featured) {
        return <FeaturedLeagueCard id={id} name={name} />;
    }

    return (
        <Link
            href={`/leagues/${encodeURIComponent(id)}/tables`}
            className={
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-800 ' +
                'bg-gradient-to-br ' + meta.gradient + ' p-5 transition-all ' +
                'hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/15'
            }
        >
            {/* Watermark flag */}
            <span
                className="pointer-events-none absolute -right-3 -top-3 text-7xl leading-none opacity-25 select-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))' }}
                aria-hidden
            >
                {meta.flag}
            </span>

            <div className="relative flex items-start gap-3">
                {emblemBroken ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                        <Trophy className="h-5 w-5 text-teal-300" />
                    </div>
                ) : (
                    <div className="relative h-10 w-10 shrink-0 rounded-lg bg-white/95 p-1 ring-1 ring-white/20">
                        <Image
                            src={emblem}
                            alt={`${name} emblem`}
                            width={32}
                            height={32}
                            className="h-full w-full object-contain"
                            onError={() => setEmblemBroken(true)}
                            unoptimized
                        />
                    </div>
                )}
                <div className="min-w-0 space-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/60">{meta.country}</p>
                    <h3 className="text-base font-bold text-white truncate">{name}</h3>
                    <p className="text-[11px] text-white/60 truncate">{meta.tagline}</p>
                </div>
            </div>

            <div className="relative mt-auto flex items-center gap-2 pt-5">
                <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-200 group-hover:bg-teal-500/20 transition-colors">
                    <ListOrdered className="h-3 w-3" /> Table
                </span>
                <Link
                    href={`/leagues/${encodeURIComponent(id)}/scores`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-700 bg-gray-900/50 px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
                >
                    <BarChart3 className="h-3 w-3" /> Scores
                </Link>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-300" />
            </div>
        </Link>
    );
}

function FeaturedLeagueCard({ id, name }: { id: string; name: string }) {
    const meta = getLeagueMeta(id);
    const emblem = getEmblemUrl(id);
    const [emblemBroken, setEmblemBroken] = useState(false);

    const { data: tables } = useStandings(id);
    const topRows = tables?.standings?.find((g) => g.type === 'TOTAL')?.table?.slice(0, 4)
        ?? tables?.standings?.[0]?.table?.slice(0, 4)
        ?? [];

    return (
        <Link
            href={`/leagues/${encodeURIComponent(id)}/tables`}
            className={
                'group relative block overflow-hidden rounded-3xl border border-gray-800 ' +
                'bg-gradient-to-br ' + meta.gradient + ' p-6 transition-all ' +
                'hover:border-teal-500/40 hover:shadow-2xl hover:shadow-teal-500/20'
            }
        >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
            {/* Watermark flag */}
            <span
                className="pointer-events-none absolute -right-6 -bottom-6 text-[10rem] leading-none opacity-25 select-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.45))' }}
                aria-hidden
            >
                {meta.flag}
            </span>

            <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {emblemBroken ? (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                <Trophy className="h-7 w-7 text-teal-300" />
                            </div>
                        ) : (
                            <div className="relative h-14 w-14 rounded-xl bg-white p-1.5 ring-1 ring-white/30 shadow-lg">
                                <Image
                                    src={emblem}
                                    alt={`${name} emblem`}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-contain"
                                    onError={() => setEmblemBroken(true)}
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="space-y-0.5">
                            <p className="text-[11px] uppercase tracking-widest text-white/70">{meta.country}</p>
                            <h2 className="text-2xl font-black text-white tracking-tight">{name}</h2>
                            <p className="text-xs text-white/70">{meta.tagline}</p>
                        </div>
                    </div>
                    {topRows.length > 0 ? (
                        <ul className="grid gap-1.5 max-w-md">
                            {topRows.map((r) => (
                                <li
                                    key={r.team.id ?? r.position}
                                    className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm"
                                >
                                    <span className="w-5 text-right font-mono text-white/60">{r.position}</span>
                                    {r.team.crest ? (
                                        <Image
                                            src={r.team.crest}
                                            alt={r.team.shortName ?? r.team.name}
                                            width={16}
                                            height={16}
                                            className="h-4 w-4 object-contain shrink-0"
                                            unoptimized
                                        />
                                    ) : null}
                                    <span className="flex-1 truncate">{r.team.shortName ?? r.team.name}</span>
                                    <span className="font-mono font-semibold text-teal-300">{r.points}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-white/50">Tap to load full standings →</p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/40 bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-100 group-hover:bg-teal-500/25 transition-colors">
                        <ListOrdered className="h-3.5 w-3.5" /> Full table
                    </span>
                    <Link
                        href={`/leagues/${encodeURIComponent(id)}/scores`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-700 bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
                    >
                        <BarChart3 className="h-3.5 w-3.5" /> Live scores
                    </Link>
                </div>
            </div>
        </Link>
    );
}
