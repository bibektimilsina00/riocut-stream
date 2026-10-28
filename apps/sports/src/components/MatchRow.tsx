'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getMatchKickoff, isMatchLive, type Match } from '@/lib/sportsrc';
import { useLiveScore } from '@/lib/hooks/useSports';
import { competitorFor } from '@/lib/espn';

/**
 * Dense, scannable match line (score-app style): when/LIVE · teams · score.
 * Used for every match list on the site.
 */
export default function MatchRow({ match, showLeague = true }: { match: Match; showLeague?: boolean }) {
    const live = isMatchLive(match);
    const score = useLiveScore(match, live);
    const kickoff = getMatchKickoff(match);
    const sides = match.teams?.away?.name ? [match.teams.home, match.teams.away] : null;
    const href = `/match/${encodeURIComponent(match.category)}/${encodeURIComponent(match.id)}`;

    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-800/60">
            <When live={live} kickoff={kickoff} status={score?.status} />
            <div className="min-w-0 flex-1 space-y-1">
                {showLeague && match.league && match.league.toLowerCase() !== match.category.toLowerCase() ? (
                    <p className="truncate text-[10px] uppercase tracking-wider text-gray-500">{match.league}</p>
                ) : null}
                {sides ? (
                    sides.map((t, i) => {
                        const c = score ? competitorFor(score, t.name) ?? score.competitors[i] : undefined;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <Badge src={t.badge ?? c?.logo} />
                                <span className="min-w-0 flex-1 truncate text-sm text-white">{t.name}</span>
                                {c?.score ? <span className="shrink-0 text-xs font-semibold tabular-nums text-white">{c.score}</span> : null}
                            </div>
                        );
                    })
                ) : (
                    <p className="truncate text-sm text-white">{match.title}</p>
                )}
            </div>
        </Link>
    );
}

/** Left column: LIVE + clock while on, otherwise kickoff time and day. */
export function When({ live, kickoff, status }: { live: boolean; kickoff: Date | null; status?: string }) {
    if (live) {
        return (
            <div className="w-14 shrink-0 text-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-red-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live
                </span>
                {status && status !== 'Live' ? <p className="mt-0.5 truncate text-[10px] text-gray-400">{status}</p> : null}
            </div>
        );
    }
    if (!kickoff) return <div className="w-14 shrink-0 text-center text-xs text-gray-500">TBD</div>;
    const today = kickoff.toDateString() === new Date().toDateString();
    const ended = kickoff.getTime() < Date.now();
    return (
        <div className="w-14 shrink-0 text-center whitespace-nowrap">
            <p className={`text-xs font-medium tabular-nums ${ended ? 'text-gray-500' : 'text-gray-200'}`}>
                {ended ? 'Ended' : kickoff.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?([AP]M)$/i, (_, ap) => ap.toLowerCase())}
            </p>
            <p className="text-[10px] text-gray-500">
                {today ? 'Today' : kickoff.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
            </p>
        </div>
    );
}

export function Badge({ src }: { src?: string | null }) {
    return src ? (
        <Image src={src} alt="" width={18} height={18} unoptimized className="h-[18px] w-[18px] shrink-0 object-contain"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
    ) : <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-gray-800" />;
}

/** Bordered list container for rows. */
export function RowList({ children }: { children: React.ReactNode }) {
    return <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800/80">{children}</div>;
}

/** Placeholder rows while data loads. */
export function RowSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <RowList>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <div className="h-8 w-14 rounded bg-gray-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-gray-800 animate-pulse" />
                        <div className="h-3 w-1/2 rounded bg-gray-800 animate-pulse" />
                    </div>
                </div>
            ))}
        </RowList>
    );
}
