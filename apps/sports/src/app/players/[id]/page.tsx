'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/lib/hooks/useBsd';
import type { PlayerDetail } from '@/lib/bsd/v2-types';
import { formatMarketValue, ageFromDob, initials, flagEmoji } from '@/lib/bsd/format';
import { ArrowLeft, Shirt, Ruler, Weight, Footprints, TrendingUp, HeartPulse, CalendarClock, Star } from 'lucide-react';

export default function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: p, isLoading, error } = usePlayer(id);

    if (isLoading) return <div className="container mx-auto px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-gray-900" /></div>;
    if (error || !p) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400">Player not found.</p>
                <Link href="/players" className="mt-3 inline-block text-sm text-teal-400 underline">← Back to players</Link>
            </div>
        );
    }

    const age = ageFromDob(p.dateOfBirth);
    const flag = flagEmoji(p.nationality);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
            <Link href="/players" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400">
                <ArrowLeft className="h-3 w-3" /> Players
            </Link>

            {/* header */}
            <section className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-600/30 text-2xl font-black text-white ring-1 ring-teal-500/30">
                    {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black text-white">{p.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                        {p.specificPosition || p.position ? <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300">{p.specificPosition ?? p.position}</span> : null}
                        {p.jerseyNumber ? <span className="inline-flex items-center gap-1"><Shirt className="h-3.5 w-3.5" />#{p.jerseyNumber}</span> : null}
                        {p.nationality ? <span>{flag ? `${flag} ` : ''}{p.nationality}</span> : null}
                        {p.team ? <Link href={`/teams/${p.team.id}`} className="text-teal-400 hover:underline">{p.team.name}</Link> : null}
                    </div>
                </div>
                {formatMarketValue(p.marketValueEur) ? (
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Market value</p>
                        <p className="text-lg font-black text-emerald-400">{formatMarketValue(p.marketValueEur)}</p>
                    </div>
                ) : null}
            </section>

            {/* key facts */}
            <Facts p={p} age={age} />

            {p.attributes && Object.keys(p.attributes).length > 0 ? <Attributes attributes={p.attributes} /> : null}

            {(p.strengths.length > 0 || p.weaknesses.length > 0) ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {p.strengths.length > 0 ? <Chips title="Strengths" items={p.strengths} tone="emerald" /> : null}
                    {p.weaknesses.length > 0 ? <Chips title="Weaknesses" items={p.weaknesses} tone="red" /> : null}
                </div>
            ) : null}

            {p.stats.length > 0 ? <StatsTable p={p} /> : null}
            {p.career.length > 0 ? <Career p={p} /> : null}
            {p.transfers.length > 0 ? <Transfers p={p} /> : null}
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/70">
            <header className="border-b border-gray-800 px-4 py-3"><h2 className="text-sm font-semibold text-white">{title}</h2></header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Facts({ p, age }: { p: PlayerDetail; age: number | null }) {
    const items: Array<[React.ReactNode, string, string | null]> = [
        [<CalendarClock key="a" className="h-4 w-4" />, 'Age', age != null ? `${age}` : null],
        [<Ruler key="h" className="h-4 w-4" />, 'Height', p.heightCm ? `${p.heightCm} cm` : null],
        [<Weight key="w" className="h-4 w-4" />, 'Weight', p.weightKg ? `${p.weightKg} kg` : null],
        [<Footprints key="f" className="h-4 w-4" />, 'Foot', p.preferredFoot],
        [<Star key="r" className="h-4 w-4" />, 'Rating', p.rating != null ? p.rating.toFixed(1) : null],
        [<TrendingUp key="p" className="h-4 w-4" />, 'Potential', p.potential != null ? `${p.potential}` : null],
        [<CalendarClock key="c" className="h-4 w-4" />, 'Contract until', p.contractUntil],
        [<HeartPulse key="i" className="h-4 w-4" />, 'Injury risk', p.injuryRisk],
    ];
    const visible = items.filter(([, , v]) => v);
    if (!visible.length) return null;
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {visible.map(([icon, label, value], i) => (
                <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">{icon}{label}</div>
                    <p className="mt-1 text-sm font-semibold capitalize text-white">{value}</p>
                </div>
            ))}
        </div>
    );
}

function Attributes({ attributes }: { attributes: Record<string, number> }) {
    const entries = Object.entries(attributes).filter(([, v]) => typeof v === 'number');
    return (
        <Card title="Attributes">
            <div className="grid gap-3 sm:grid-cols-2">
                {entries.map(([k, v]) => (
                    <div key={k}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="capitalize text-gray-400">{k.replace(/_/g, ' ')}</span>
                            <span className="font-semibold tabular-nums text-white">{Math.round(v)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function Chips({ title, items, tone }: { title: string; items: string[]; tone: 'emerald' | 'red' }) {
    const cls = tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30' : 'bg-red-500/10 text-red-300 ring-red-500/30';
    return (
        <Card title={title}>
            <div className="flex flex-wrap gap-2">
                {items.map((it, i) => <span key={i} className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${cls}`}>{it.replace(/_/g, ' ')}</span>)}
            </div>
        </Card>
    );
}

function StatsTable({ p }: { p: PlayerDetail }) {
    return (
        <Card title="Season stats">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                            <th className="pb-2 pr-3 font-medium">Competition</th>
                            <th className="pb-2 px-2 text-right font-medium">Apps</th>
                            <th className="pb-2 px-2 text-right font-medium">Goals</th>
                            <th className="pb-2 px-2 text-right font-medium">Assists</th>
                            <th className="pb-2 px-2 text-right font-medium">Mins</th>
                            <th className="pb-2 pl-2 text-right font-medium">Rating</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-200">
                        {p.stats.map((r, i) => (
                            <tr key={i} className="border-t border-gray-800/60">
                                <td className="py-2 pr-3">{r.competition ?? '—'}{r.season ? <span className="text-gray-500"> · {r.season}</span> : null}</td>
                                <td className="px-2 py-2 text-right tabular-nums">{r.appearances ?? '—'}</td>
                                <td className="px-2 py-2 text-right tabular-nums">{r.goals ?? '—'}</td>
                                <td className="px-2 py-2 text-right tabular-nums">{r.assists ?? '—'}</td>
                                <td className="px-2 py-2 text-right tabular-nums">{r.minutes ?? '—'}</td>
                                <td className="pl-2 py-2 text-right tabular-nums">{r.rating != null ? r.rating.toFixed(1) : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function Career({ p }: { p: PlayerDetail }) {
    return (
        <Card title="Career">
            <ul className="space-y-2">
                {p.career.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white">{c.team ?? '—'}</span>
                        <span className="text-xs text-gray-500">{[c.from, c.to].filter(Boolean).join(' – ') || '—'}{c.appearances != null ? ` · ${c.appearances} apps` : ''}{c.goals != null ? ` · ${c.goals}g` : ''}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

function Transfers({ p }: { p: PlayerDetail }) {
    return (
        <Card title="Transfers">
            <ul className="space-y-2">
                {p.transfers.map((t, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-200">{[t.from, t.to].filter(Boolean).join(' → ') || '—'}</span>
                        <span className="text-xs text-gray-500">{[t.date, t.fee, t.type].filter(Boolean).join(' · ')}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}
