'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useWorldCup } from '@/lib/hooks/useBsd';
import type { WCFixture, WCSquadPlayer } from '@/lib/bsd/v2-types';
import { initials } from '@/lib/bsd/format';
import { Trophy, Radio, Star } from 'lucide-react';

const ROUND_ORDER = ['Final', 'Match for 3rd place', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];

function roundRank(r: string | null): number {
    if (!r) return 999;
    const i = ROUND_ORDER.indexOf(r);
    return i === -1 ? 500 : i;
}

export default function WorldCupPage() {
    const { data, isLoading } = useWorldCup();
    const fixtures = useMemo(() => data?.fixtures ?? [], [data]);
    const squads = useMemo(() => data?.squads ?? [], [data]);

    const byRound = useMemo(() => {
        const groups = new Map<string, WCFixture[]>();
        for (const f of fixtures) {
            const key = f.round ?? 'Fixtures';
            (groups.get(key) ?? groups.set(key, []).get(key)!).push(f);
        }
        return [...groups.entries()].sort((a, b) => roundRank(a[0]) - roundRank(b[0]));
    }, [fixtures]);

    const standouts = useMemo(() => {
        const all: WCSquadPlayer[] = squads.flatMap((s) => s.players);
        return all
            .filter((p) => p.playerId)
            .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0) || (b.caps ?? 0) - (a.caps ?? 0))
            .slice(0, 24);
    }, [squads]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-yellow-500/10 via-gray-900 to-gray-950 p-6">
                <p className="text-xs uppercase tracking-widest text-yellow-400">FIFA</p>
                <h1 className="flex items-center gap-2 text-3xl font-black text-white"><Trophy className="h-7 w-7 text-yellow-400" /> World Cup 2026</h1>
                <p className="mt-1 text-gray-400">Fixtures, results and qualified-squad standouts.</p>
            </section>

            {isLoading ? (
                <div className="h-64 animate-pulse rounded-2xl bg-gray-900" />
            ) : (
                <>
                    {byRound.map(([round, list]) => (
                        <section key={round} className="space-y-3">
                            <h2 className="text-lg font-semibold text-white">{round}</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {list.map((f) => <FixtureCard key={f.id} f={f} />)}
                            </div>
                        </section>
                    ))}

                    {standouts.length > 0 ? (
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Star className="h-5 w-5 text-yellow-400" /> Squad standouts</h2>
                            <p className="text-xs text-gray-500">Most international goals among qualified squads.</p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {standouts.map((p, i) => <StandoutCard key={`${p.playerId}-${i}`} p={p} />)}
                            </div>
                        </section>
                    ) : null}

                    {fixtures.length === 0 && standouts.length === 0 ? (
                        <p className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">No World Cup data available right now.</p>
                    ) : null}
                </>
            )}
        </div>
    );
}

function FixtureCard({ f }: { f: WCFixture }) {
    const played = f.homeScore != null && f.awayScore != null;
    const when = f.date ? new Date(f.date) : null;
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
            {f.live ? <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400"><Radio className="h-3 w-3" /> LIVE</span> : null}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <TeamSide name={f.homeTeam} teamId={f.homeTeamId} align="right" />
                <span className="rounded bg-gray-800 px-2 py-1 text-sm font-bold tabular-nums text-white">
                    {played ? `${f.homeScore} - ${f.awayScore}` : 'vs'}
                </span>
                <TeamSide name={f.awayTeam} teamId={f.awayTeamId} align="left" />
            </div>
            {when ? <p className="mt-2 text-center text-[11px] text-gray-500">{when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p> : null}
        </div>
    );
}

function TeamSide({ name, teamId, align }: { name: string; teamId: number | null; align: 'left' | 'right' }) {
    const cls = `truncate text-sm font-semibold text-white ${align === 'right' ? 'text-right' : 'text-left'}`;
    if (teamId) return <Link href={`/teams/${teamId}`} className={`${cls} hover:text-teal-300`}>{name}</Link>;
    return <span className={cls}>{name}</span>;
}

function StandoutCard({ p }: { p: WCSquadPlayer }) {
    return (
        <Link href={`/players/${p.playerId}`} className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 p-3 transition-all hover:-translate-y-0.5 hover:border-teal-500/40">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-sm font-bold text-gray-200 ring-1 ring-gray-700">{initials(p.name)}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white group-hover:text-teal-300">{p.name}</span>
                <span className="truncate text-[11px] text-gray-500">{[p.position, p.club].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-emerald-400">{p.goals ?? 0}</span>
                <span className="block text-[10px] text-gray-500">goals</span>
            </span>
        </Link>
    );
}
