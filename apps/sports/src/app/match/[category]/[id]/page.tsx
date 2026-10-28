'use client';

import { use } from 'react';
import Link from 'next/link';
import { sportMeta } from '@/lib/sports';
import Image from 'next/image';
import { useMatchDetail } from '@/lib/hooks/useSports';
import { getMatchKickoff, isMatchLive } from '@/lib/sportsrc';
import EmbedMatchPlayer from '@/components/EmbedMatchPlayer';
import PlayerNotice from '@/components/PlayerNotice';
import MatchCenter from '@/components/matchcenter/MatchCenter';
import CommentSection from '@/components/CommentSection';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@riocut/ui/components/ui/button';
import { Users, CalendarClock, ArrowLeft } from 'lucide-react';

export default function MatchDetailPage({ params }: { params: Promise<{ category: string; id: string }> }) {
    const { category, id } = use(params);
    const { data: detail, isLoading, error } = useMatchDetail(category, id);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-4">
                <div className="aspect-video bg-gray-900 rounded-xl animate-pulse" />
                <div className="h-8 w-2/3 bg-gray-900 rounded animate-pulse" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400">Match not found.</p>
                <Link href={`/sports/${category}`} className="mt-3 inline-block text-sm underline text-teal-400">
                    ← Back to {category}
                </Link>
            </div>
        );
    }

    const home = detail.teams?.home;
    const away = detail.teams?.away;
    const kickoff = getMatchKickoff(detail);
    const live = isMatchLive(detail);
    const cat = detail.category || category;

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <Link href={`/sports/${cat}`} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400">
                <ArrowLeft className="h-3 w-3" /> Back to {sportMeta(cat).label}
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                    <EmbedMatchPlayer
                        sources={detail.sources ?? []}
                        title={detail.title}
                        matchKey={`${cat}:${detail.id}`}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="text-xs uppercase tracking-wider text-gray-500">{detail.league ? `${sportMeta(cat).label} · ${detail.league}` : sportMeta(cat).label}</p>
                                {live ? <LiveBadge /> : null}
                            </div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3 flex-wrap">
                                {home?.badge ? (
                                    <Image src={home.badge} alt={home.name} width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
                                ) : null}
                                <span>{home?.name ?? 'Home'}</span>
                                {away?.name ? (
                                    <>
                                        <span className="text-gray-500 text-base">vs</span>
                                        <span>{away.name}</span>
                                    </>
                                ) : null}
                                {away?.badge ? (
                                    <Image src={away.badge} alt={away.name} width={28} height={28} className="h-7 w-7 object-contain" unoptimized />
                                ) : null}
                            </h1>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {kickoff ? kickoff.toLocaleString() : 'Time TBD'}
                            </div>
                        </div>
                    </div>

                    <PlayerNotice />
                </div>

                <aside className="space-y-4">
                    <CommentSection matchKey={`${cat}:${detail.id}`} />

                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Watch together</h3>
                        <p className="text-xs text-gray-400">
                            Create a private room and watch this match in sync with friends, with chat and live video.
                        </p>
                        <Link href={`/match/${encodeURIComponent(cat)}/${encodeURIComponent(detail.id)}/watch-together`}>
                            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                                <Users className="h-4 w-4 mr-1.5" /> Start watch-together
                            </Button>
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-white">Match info</h3>
                        <dl className="text-xs space-y-1">
                            <div className="flex justify-between"><dt className="text-gray-500">Sport</dt><dd className="text-gray-300">{sportMeta(cat).label}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Streams</dt><dd className="text-gray-300">{detail.sources?.length ?? 0}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="text-gray-300">{live ? 'Live' : (kickoff && kickoff.getTime() < Date.now() ? 'Finished' : 'Scheduled')}</dd></div>
                        </dl>
                    </div>
                </aside>
            </div>

            {/* Match center is backed by a football-only API (BSD); on other sports a
                same-named football fixture could be shown by mistake. */}
            {cat === 'football' ? <MatchCenter home={home?.name} away={away?.name} date={detail.date} /> : null}
        </div>
    );
}
