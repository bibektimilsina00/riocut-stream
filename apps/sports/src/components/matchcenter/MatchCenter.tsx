'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useMatchCenter } from '@/lib/hooks/useMatchCenter';
import type { MatchCenter as MC, MCIncident, MCStat, MCPlayer } from '@/lib/bsd/types';
import { Activity, Goal, RefreshCw, Repeat, Square, Flag, MapPin, User, Users, ShieldAlert } from 'lucide-react';

const HOME = '#14b8a6'; // teal-500
const AWAY = '#9ca3af'; // gray-400

export default function MatchCenter({
    home,
    away,
    date,
}: {
    home: string | undefined;
    away: string | undefined;
    date: number | undefined;
}) {
    const { data, isLoading } = useMatchCenter(home, away, date);

    if (isLoading) {
        return <div className="h-40 rounded-2xl bg-gray-900/60 border border-gray-800 animate-pulse" />;
    }
    if (!data?.found) return null;

    const ex = data.extras;
    return (
        <div className="space-y-4">
            <ScoreHeader mc={data} />
            {data.incidents.length > 0 ? <GameEvents mc={data} /> : null}
            {ex.momentum.length > 0 ? <Momentum data={data} /> : null}
            {(data.possession || data.stats.length > 0) ? <StatsPanel mc={data} /> : null}
            {ex.shotmap.length > 0 ? <Shotmap data={data} /> : null}
            {ex.mlPrediction ? <MLPredictionCard mc={data} /> : (data.prediction ? <Prediction mc={data} /> : null)}
            {ex.h2h ? <H2HCard mc={data} /> : null}
            {data.lineups ? <Lineups mc={data} /> : null}
            <GameInfo mc={data} />
        </div>
    );
}

// ---------- shared bits ----------

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/70">
            <header className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
                {icon}
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

// ---------- score header ----------

function ScoreHeader({ mc }: { mc: MC }) {
    return (
        <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="text-right">
                    <TeamName name={mc.home.name} teamId={mc.home.teamId} />
                    {mc.home.coach ? <p className="text-[11px] text-gray-500">{mc.home.coach}</p> : null}
                </div>
                <div className="flex flex-col items-center">
                    {mc.live ? (
                        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400 ring-1 ring-red-500/30">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                            {mc.minute != null ? `${mc.minute}'` : 'LIVE'}
                        </span>
                    ) : (
                        <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">{mc.statusLabel}</span>
                    )}
                    <div className="text-3xl font-black tabular-nums text-white">
                        {mc.home.score ?? '-'} <span className="text-gray-600">:</span> {mc.away.score ?? '-'}
                    </div>
                    {mc.home.htScore != null && mc.away.htScore != null ? (
                        <p className="mt-0.5 text-[11px] text-gray-500">HT {mc.home.htScore} - {mc.away.htScore}</p>
                    ) : null}
                </div>
                <div className="text-left">
                    <TeamName name={mc.away.name} teamId={mc.away.teamId} />
                    {mc.away.coach ? <p className="text-[11px] text-gray-500">{mc.away.coach}</p> : null}
                </div>
            </div>
            {(mc.home.xg != null || mc.away.xg != null) ? (
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                    <span className="tabular-nums text-gray-400">{mc.home.xg?.toFixed(2) ?? '—'}</span>
                    <span className="uppercase tracking-wide">xG</span>
                    <span className="tabular-nums text-gray-400">{mc.away.xg?.toFixed(2) ?? '—'}</span>
                </div>
            ) : null}
        </section>
    );
}

function TeamName({ name, teamId }: { name: string; teamId: number | null }) {
    if (teamId) {
        return <Link href={`/teams/${teamId}`} className="text-base font-bold text-white hover:text-teal-300">{name}</Link>;
    }
    return <p className="text-base font-bold text-white">{name}</p>;
}

// ---------- game events ----------

function incidentIcon(i: MCIncident) {
    if (i.type === 'goal') return <Goal className="h-4 w-4 text-emerald-400" />;
    if (i.type === 'substitution') return <Repeat className="h-4 w-4 text-teal-400" />;
    if (i.type === 'card') return <Square className={`h-3.5 w-3.5 ${i.card === 'red' ? 'text-red-500 fill-red-500' : 'text-yellow-400 fill-yellow-400'}`} />;
    if (i.type === 'var') return <ShieldAlert className="h-4 w-4 text-purple-400" />;
    if (i.type === 'injuryTime') return <RefreshCw className="h-4 w-4 text-gray-500" />;
    return <Flag className="h-4 w-4 text-gray-500" />;
}

function GameEvents({ mc }: { mc: MC }) {
    const rows = mc.incidents.filter((i) => i.type !== 'period' || i.detail);
    return (
        <Card title="Game Events" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            <ol className="space-y-1.5">
                {rows.map((i, idx) => {
                    const left = i.side === 'home';
                    const right = i.side === 'away';
                    return (
                        <li key={idx} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                            <div className={`flex items-center gap-2 ${left ? 'justify-end text-right' : 'opacity-0 pointer-events-none'}`}>
                                {left ? <EventLabel i={i} /> : null}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-semibold tabular-nums text-gray-400">
                                    {i.minute != null ? `${i.minute}'` : '·'}
                                </span>
                                {incidentIcon(i)}
                                {i.homeScore != null && i.type === 'goal' ? (
                                    <span className="text-[10px] font-bold text-emerald-400">{i.homeScore}-{i.awayScore}</span>
                                ) : null}
                            </div>
                            <div className={`flex items-center gap-2 ${right ? 'justify-start text-left' : 'opacity-0 pointer-events-none'}`}>
                                {right ? <EventLabel i={i} /> : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

function EventLabel({ i }: { i: MCIncident }) {
    return (
        <div className="min-w-0">
            <p className="truncate font-medium text-white">{i.player ?? i.detail ?? i.type}</p>
            {i.player && i.detail ? <p className="truncate text-[11px] text-gray-500">{i.detail}</p> : null}
        </div>
    );
}

// ---------- stats ----------

function StatsPanel({ mc }: { mc: MC }) {
    return (
        <Card title="Match Stats" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            {mc.possession ? <PossessionDonut home={mc.possession.home} away={mc.possession.away} /> : null}
            <div className="mt-2 space-y-3">
                {mc.stats.map((s) => <StatBar key={s.label} s={s} />)}
            </div>
        </Card>
    );
}

function PossessionDonut({ home, away }: { home: number; away: number }) {
    const total = home + away || 1;
    const homePct = (home / total) * 100;
    const r = 42;
    const c = 2 * Math.PI * r;
    const homeLen = (homePct / 100) * c;
    return (
        <div className="flex flex-col items-center">
            <div className="relative h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r={r} fill="none" stroke={AWAY} strokeWidth="10" />
                    <circle cx="50" cy="50" r={r} fill="none" stroke={HOME} strokeWidth="10" strokeDasharray={`${homeLen} ${c}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">Possession</span>
                </div>
            </div>
            <div className="mt-1 flex w-full items-center justify-between px-2 text-sm font-bold">
                <span style={{ color: HOME }}>{home}%</span>
                <span style={{ color: AWAY }}>{away}%</span>
            </div>
        </div>
    );
}

function StatBar({ s }: { s: MCStat }) {
    const total = s.home + s.away || 1;
    const homePct = (s.home / total) * 100;
    const fmt = (v: number) => (s.label.includes('xG') ? v.toFixed(2) : String(v));
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold tabular-nums text-white">{fmt(s.home)}</span>
                <span className="text-gray-400">{s.label}</span>
                <span className="font-semibold tabular-nums text-white">{fmt(s.away)}</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div style={{ width: `${homePct}%`, background: HOME }} />
                <div style={{ width: `${100 - homePct}%`, background: AWAY }} />
            </div>
        </div>
    );
}

// ---------- prediction ----------

function Prediction({ mc }: { mc: MC }) {
    const p = mc.prediction!;
    return (
        <Card title="Who will win?" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-gray-800">
                <div style={{ width: `${p.home}%`, background: HOME }} />
                <div style={{ width: `${p.draw}%` }} className="bg-gray-600" />
                <div style={{ width: `${p.away}%`, background: AWAY }} />
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="text-left"><p className="font-bold text-white">{p.home}%</p><p className="text-gray-500">{mc.home.name}</p></div>
                <div className="text-center"><p className="font-bold text-white">{p.draw}%</p><p className="text-gray-500">Draw</p></div>
                <div className="text-right"><p className="font-bold text-white">{p.away}%</p><p className="text-gray-500">{mc.away.name}</p></div>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-600">Implied from market odds</p>
        </Card>
    );
}

// ---------- lineups ----------

function Lineups({ mc }: { mc: MC }) {
    const l = mc.lineups!;
    return (
        <Card title="Lineups" icon={<Users className="h-4 w-4 text-teal-400" />}>
            <div className="grid grid-cols-2 gap-4">
                <LineupCol title={mc.home.name} players={l.home} subs={l.homeSubs} />
                <LineupCol title={mc.away.name} players={l.away} subs={l.awaySubs} align="right" />
            </div>
        </Card>
    );
}

function LineupCol({ title, players, subs, align = 'left' }: { title: string; players: MCPlayer[]; subs: MCPlayer[]; align?: 'left' | 'right' }) {
    const right = align === 'right';
    return (
        <div>
            <p className={`mb-2 text-xs font-semibold text-gray-400 ${right ? 'text-right' : ''}`}>{title}</p>
            <ul className="space-y-1">
                {players.map((p, i) => (
                    <li key={i} className={`flex items-center gap-1.5 text-xs text-gray-200 ${right ? 'flex-row-reverse text-right' : ''}`}>
                        <span className="w-5 shrink-0 tabular-nums text-gray-500">{p.number ?? ''}</span>
                        {p.id ? (
                            <Link href={`/players/${p.id}`} className="truncate hover:text-teal-300">{p.name}</Link>
                        ) : (
                            <span className="truncate">{p.name}</span>
                        )}
                        {p.goals ? <Goal className="h-3 w-3 shrink-0 text-emerald-400" /> : null}
                        {p.yellow ? <span className="h-2.5 w-2 shrink-0 rounded-[1px] bg-yellow-400" /> : null}
                        {p.red ? <span className="h-2.5 w-2 shrink-0 rounded-[1px] bg-red-500" /> : null}
                    </li>
                ))}
            </ul>
            {subs.length > 0 ? (
                <>
                    <p className={`mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-600 ${right ? 'text-right' : ''}`}>Subs</p>
                    <ul className="space-y-1">
                        {subs.map((p, i) => (
                            <li key={i} className={`flex items-center gap-1.5 text-[11px] text-gray-500 ${right ? 'flex-row-reverse text-right' : ''}`}>
                                <span className="w-5 shrink-0 tabular-nums">{p.number ?? ''}</span>
                                <span className="truncate">{p.name}</span>
                            </li>
                        ))}
                    </ul>
                </>
            ) : null}
        </div>
    );
}

// ---------- momentum ----------

function Momentum({ data }: { data: MC }) {
    const pts = data.extras.momentum;
    const max = Math.max(1, ...pts.map((p) => Math.abs(p.value)));
    return (
        <Card title="Momentum" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            <div className="flex h-24 items-center gap-[1px]">
                {pts.map((p, i) => {
                    const h = (Math.abs(p.value) / max) * 50;
                    const up = p.value >= 0;
                    return (
                        <div key={i} className="flex h-full flex-1 flex-col justify-center" title={`${p.minute}'`}>
                            <div className="flex h-1/2 items-end">{up ? <div className="w-full rounded-sm" style={{ height: `${h}%`, background: HOME }} /> : null}</div>
                            <div className="flex h-1/2 items-start">{!up ? <div className="w-full rounded-sm" style={{ height: `${h}%`, background: AWAY }} /> : null}</div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span style={{ color: HOME }}>{data.home.name}</span>
                <span style={{ color: AWAY }}>{data.away.name}</span>
            </div>
        </Card>
    );
}

// ---------- shotmap ----------

function Shotmap({ data }: { data: MC }) {
    const shots = data.extras.shotmap;
    // Home attacks left→right; mirror away shots so the two teams face opposite goals.
    return (
        <Card title="Shotmap" icon={<Goal className="h-4 w-4 text-teal-400" />}>
            <div className="w-full overflow-hidden rounded-lg bg-gray-950/60 ring-1 ring-gray-800">
                <svg viewBox="0 0 105 68" className="h-auto w-full">
                    <rect x="0.5" y="0.5" width="104" height="67" fill="none" stroke="#374151" strokeWidth="0.4" />
                    <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" stroke="#374151" strokeWidth="0.3" />
                    <circle cx="52.5" cy="34" r="8" fill="none" stroke="#374151" strokeWidth="0.3" />
                    <rect x="0.5" y="14" width="16" height="40" fill="none" stroke="#374151" strokeWidth="0.3" />
                    <rect x="88.5" y="14" width="16" height="40" fill="none" stroke="#374151" strokeWidth="0.3" />
                    {shots.map((sh, i) => {
                        const cx = (sh.home ? sh.x : 100 - sh.x) / 100 * 105;
                        const cy = sh.y / 100 * 68;
                        const r = 0.7 + Math.min(3, sh.xg * 4);
                        const color = sh.home ? HOME : AWAY;
                        return (
                            <circle key={i} cx={cx} cy={cy} r={r}
                                fill={sh.isGoal ? color : 'none'} stroke={color}
                                strokeWidth={sh.isGoal ? 0.6 : 0.5} opacity={sh.isGoal ? 1 : 0.75}>
                                <title>{`${sh.minute ?? ''}' ${sh.isGoal ? 'GOAL ' : ''}xG ${sh.xg.toFixed(2)}${sh.body ? ` · ${sh.body}` : ''}`}</title>
                            </circle>
                        );
                    })}
                </svg>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span><span style={{ color: HOME }}>●</span> {data.home.name}</span>
                <span>Circle size = xG · filled = goal</span>
                <span>{data.away.name} <span style={{ color: AWAY }}>●</span></span>
            </div>
        </Card>
    );
}

// ---------- ML prediction ----------

function MLPredictionCard({ mc }: { mc: MC }) {
    const p = mc.extras.mlPrediction!;
    return (
        <Card title="Prediction" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-gray-800">
                <div style={{ width: `${p.probHome}%`, background: HOME }} />
                <div style={{ width: `${p.probDraw}%` }} className="bg-gray-600" />
                <div style={{ width: `${p.probAway}%`, background: AWAY }} />
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="text-left"><p className="font-bold text-white">{p.probHome}%</p><p className="text-gray-500">{mc.home.name}</p></div>
                <div className="text-center"><p className="font-bold text-white">{p.probDraw}%</p><p className="text-gray-500">Draw</p></div>
                <div className="text-right"><p className="font-bold text-white">{p.probAway}%</p><p className="text-gray-500">{mc.away.name}</p></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {p.mostLikelyScore ? <Stat label="Likely score" value={p.mostLikelyScore} /> : null}
                {p.expGoalsHome != null && p.expGoalsAway != null ? <Stat label="xG" value={`${p.expGoalsHome.toFixed(1)}–${p.expGoalsAway.toFixed(1)}`} /> : null}
                {p.over25 != null ? <Stat label="Over 2.5" value={`${Math.round(p.over25)}%`} /> : null}
                {p.bttsYes != null ? <Stat label="BTTS" value={`${Math.round(p.bttsYes)}%`} /> : null}
            </div>
            {p.confidence != null ? <p className="mt-2 text-center text-[10px] text-gray-600">Model confidence {p.confidence}%</p> : null}
        </Card>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
        </div>
    );
}

// ---------- head to head ----------

function H2HCard({ mc }: { mc: MC }) {
    const h = mc.extras.h2h!;
    const total = Math.max(1, h.total);
    return (
        <Card title="Head to Head" icon={<Activity className="h-4 w-4 text-teal-400" />}>
            <div className="mb-3 flex items-center justify-between text-center text-xs">
                <div><p className="text-lg font-black" style={{ color: HOME }}>{h.homeWins}</p><p className="text-gray-500">{mc.home.name}</p></div>
                <div><p className="text-lg font-black text-gray-400">{h.draws}</p><p className="text-gray-500">Draws</p></div>
                <div><p className="text-lg font-black" style={{ color: AWAY }}>{h.awayWins}</p><p className="text-gray-500">{mc.away.name}</p></div>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div style={{ width: `${(h.homeWins / total) * 100}%`, background: HOME }} />
                <div style={{ width: `${(h.draws / total) * 100}%` }} className="bg-gray-600" />
                <div style={{ width: `${(h.awayWins / total) * 100}%`, background: AWAY }} />
            </div>
            {h.recent.length > 0 ? (
                <ul className="mt-3 space-y-1">
                    {h.recent.map((m, i) => (
                        <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                            <span className="truncate text-right text-gray-300">{m.home}</span>
                            <span className="rounded bg-gray-800 px-1.5 py-0.5 font-bold tabular-nums text-white">{m.homeScore ?? '-'}–{m.awayScore ?? '-'}</span>
                            <span className="truncate text-gray-300">{m.away}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </Card>
    );
}

// ---------- game info ----------

function GameInfo({ mc }: { mc: MC }) {
    const stadiumLabel = mc.venue ? `${mc.venue.name}${mc.venue.city ? ` (${mc.venue.city})` : ''}` : null;
    const rows: Array<[ReactNode, string, ReactNode]> = [
        [<MapPin key="v" className="h-3.5 w-3.5" />, 'Stadium', stadiumLabel ? (mc.venueId ? <Link href={`/venues/${mc.venueId}`} className="text-teal-400 hover:underline">{stadiumLabel}</Link> : stadiumLabel) : null],
        [<Users key="c" className="h-3.5 w-3.5" />, 'Capacity', mc.venue?.capacity ? mc.venue.capacity.toLocaleString() : null],
        [<User key="r" className="h-3.5 w-3.5" />, 'Referee', mc.referee ? (mc.refereeId ? <Link href={`/referees/${mc.refereeId}`} className="text-teal-400 hover:underline">{mc.referee}</Link> : mc.referee) : null],
        [<Flag key="f" className="h-3.5 w-3.5" />, 'Form', mc.home.form || mc.away.form ? `${mc.home.form ?? '—'}  vs  ${mc.away.form ?? '—'}` : null],
    ];
    const visible = rows.filter(([, , v]) => v);
    if (!visible.length) return null;
    return (
        <Card title="Game Info" icon={<Flag className="h-4 w-4 text-teal-400" />}>
            <dl className="space-y-2 text-xs">
                {visible.map(([icon, label, value], i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <dt className="flex items-center gap-1.5 text-gray-500">{icon}{label}</dt>
                        <dd className="text-right text-gray-200">{value}</dd>
                    </div>
                ))}
            </dl>
        </Card>
    );
}
