import Link from 'next/link';
import Image from 'next/image';
import { Match, getMatchKickoff, isMatchLive } from '@/lib/sportsrc';
import LiveBadge from './LiveBadge';
import { CalendarClock, Trophy } from 'lucide-react';

export default function MatchCard({ match, category }: { match: Match; category: string }) {
    const kickoff = getMatchKickoff(match);
    const live = isMatchLive(match);
    const href = `/match/${encodeURIComponent(category)}/${encodeURIComponent(match.id)}`;
    const cat = match.category || category;
    // Single-sided events (F1 GP, golf) come through with an empty away team.
    const hasAway = !!match.teams?.away?.name;

    return (
        <Link href={href} className="block group">
            <div className="h-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all group-hover:-translate-y-0.5 group-hover:border-teal-500/40 group-hover:shadow-lg">
                {match.poster ? (
                    <div className="relative aspect-video bg-gray-950">
                        <Image
                            src={match.poster}
                            alt={match.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 25vw"
                            className="object-cover"
                            unoptimized
                        />
                        {live ? (
                            <div className="absolute top-2 right-2">
                                <LiveBadge />
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-400 uppercase">
                            <Trophy className="h-3 w-3" /> {match.league && match.league.toLowerCase() !== cat ? match.league : cat}
                        </span>
                        {live && !match.poster ? <LiveBadge /> : null}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.teams?.home?.badge ? (
                                <Image
                                    src={match.teams.home.badge}
                                    alt={match.teams.home.name}
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 object-contain shrink-0"
                                    unoptimized
                                />
                            ) : null}
                            <span className="truncate font-semibold text-white text-sm">
                                {match.teams?.home?.name ?? 'Home'}
                            </span>
                        </div>
                        {hasAway ? <div className="text-gray-500 text-xs px-1">vs</div> : null}
                        {hasAway ? <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="truncate font-semibold text-white text-sm text-right">
                                {match.teams?.away?.name ?? 'Away'}
                            </span>
                            {match.teams?.away?.badge ? (
                                <Image
                                    src={match.teams.away.badge}
                                    alt={match.teams.away.name}
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 object-contain shrink-0"
                                    unoptimized
                                />
                            ) : null}
                        </div> : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {kickoff
                            ? kickoff.toLocaleString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })
                            : 'Time TBD'}
                    </div>
                </div>
            </div>
        </Link>
    );
}
