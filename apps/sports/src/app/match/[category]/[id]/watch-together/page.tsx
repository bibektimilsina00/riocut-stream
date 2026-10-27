'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMatchDetail } from '@/lib/hooks/useSports';
import { pickBestSource, matchExternalIdHash } from '@/lib/sportsrc';
import {
    Users, Loader2, ArrowRight, Sparkles, Copy, Check, Search, X,
} from 'lucide-react';

interface UserHit {
    id: string;
    name: string;
    email: string;
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function MatchWatchTogetherCreatePage({
    params,
}: {
    params: Promise<{ category: string; id: string }>;
}) {
    const { category, id } = use(params);
    const { data: detail, isLoading: detailLoading } = useMatchDetail(category, id);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [roomCode, setRoomCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [codeCopied, setCodeCopied] = useState(false);

    // Invite picker
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<UserHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [invitees, setInvitees] = useState<UserHit[]>([]);

    // Pre-generate code on mount so the host can share it before creating.
    useEffect(() => {
        if (!roomCode) setRoomCode(generateRoomCode());
    }, [roomCode]);

    // Debounced user search.
    useEffect(() => {
        const q = search.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }
        let active = true;
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
                if (!res.ok) throw new Error('search failed');
                const data: { users?: UserHit[] } | UserHit[] = await res.json();
                const list = Array.isArray(data) ? data : data.users ?? [];
                if (active) setResults(list);
            } catch {
                if (active) setResults([]);
            } finally {
                if (active) setSearching(false);
            }
        }, 300);
        return () => { active = false; clearTimeout(t); };
    }, [search]);

    const filteredResults = useMemo(
        () => results.filter((u) => !invitees.some((s) => s.id === u.id)),
        [results, invitees],
    );

    if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=/match/${category}/${id}/watch-together`);
        return null;
    }

    const home = detail?.teams?.home?.name ?? 'Home';
    const away = detail?.teams?.away?.name ?? 'Away';
    const mediaTitle = detail?.title ?? `${home} vs ${away}`;
    const embedUrl = pickBestSource(detail)?.embedUrl ?? null;
    const username = session?.user?.name ?? session?.user?.email ?? 'Guest';
    const canCreate = !detailLoading && !!detail && !!embedUrl && !creating;

    const addInvitee = (u: UserHit) => {
        setInvitees((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]));
        setSearch('');
        setResults([]);
    };

    const removeInvitee = (uid: string) => setInvitees((prev) => prev.filter((p) => p.id !== uid));

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 1500);
        } catch { /* ignore */ }
    };

    const createRoom = async () => {
        if (!canCreate) return;
        setCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/watch-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    mediaId: matchExternalIdHash(category, id),
                    mediaType: 'match',
                    mediaTitle,
                    embedUrl,
                    sport: category,
                    matchExternalId: String(id),
                }),
            });
            if (!res.ok) throw new Error('Failed to create room');
            const data = await res.json();
            const code = data.roomCode ?? data.room?.roomCode ?? roomCode;

            // Fire invite notifications in parallel — don't block navigation on them.
            if (invitees.length > 0) {
                await Promise.allSettled(
                    invitees.map((u) =>
                        fetch('/api/notifications/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                toUserId: u.id,
                                roomCode: code,
                                mediaTitle,
                                mediaId: matchExternalIdHash(category, id),
                                mediaType: 'match',
                                embedUrl,
                                sport: category,
                                matchExternalId: String(id),
                            }),
                        }),
                    ),
                );
            }

            router.push(`/watch-together?room=${encodeURIComponent(code)}&username=${encodeURIComponent(username)}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create room');
            setCreating(false);
        }
    };

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) return;
        router.push(`/watch-together?room=${encodeURIComponent(code)}&username=${encodeURIComponent(username)}`);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-600/15 blur-3xl" />
            </div>

            <div className="relative w-full max-w-2xl">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-teal-500/40 via-cyan-500/20 to-transparent blur-sm" aria-hidden />

                <div className="relative rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl p-7 space-y-6 shadow-2xl shadow-teal-500/10">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg shadow-teal-500/30 ring-1 ring-white/20">
                            <Users className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs uppercase tracking-widest text-teal-300/80">Watch Together</p>
                            <h1 className="text-xl font-bold text-white">{detailLoading ? 'Loading match…' : mediaTitle}</h1>
                            <p className="text-xs text-gray-400 capitalize">{category.replace(/-/g, ' ')}</p>
                        </div>
                    </div>

                    {/* Room code */}
                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5 space-y-4">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-teal-300 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-semibold text-white">Your room code</p>
                                <p className="text-xs text-gray-400">
                                    Hosting as <strong className="text-gray-300">{username}</strong>. Share this code or
                                    invite users by name below.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-xl border border-teal-500/30 bg-gray-950/60 px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-teal-200">
                                {roomCode || '------'}
                            </code>
                            <button
                                type="button"
                                onClick={copyCode}
                                disabled={!roomCode}
                                className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
                            >
                                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoomCode(generateRoomCode())}
                                title="Regenerate"
                                className="rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-3 text-xs text-gray-400 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                            >
                                ↻
                            </button>
                        </div>
                    </div>

                    {/* Invite */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">Invite users</p>
                            <span className="text-[11px] text-gray-500">{invitees.length} selected</span>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="block w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                            />
                            {searching ? (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                            ) : null}
                            {filteredResults.length > 0 ? (
                                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-800 bg-gray-950/95 shadow-2xl">
                                    {filteredResults.map((u) => (
                                        <li key={u.id}>
                                            <button
                                                type="button"
                                                onClick={() => addInvitee(u)}
                                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-teal-500/10 hover:text-teal-200"
                                            >
                                                <span className="truncate">
                                                    <span className="font-medium">{u.name || u.email}</span>
                                                    {u.name ? <span className="ml-2 text-xs text-gray-500">{u.email}</span> : null}
                                                </span>
                                                <span className="text-[10px] text-teal-300/80">add +</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        {invitees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {invitees.map((u) => (
                                    <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-200">
                                        {u.name || u.email}
                                        <button type="button" onClick={() => removeInvitee(u.id)} className="text-teal-300/70 hover:text-white" aria-label="Remove invitee">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-gray-500">Optional — anyone with the code can also join.</p>
                        )}
                    </div>

                    {/* Create CTA */}
                    <button
                        onClick={createRoom}
                        disabled={!canCreate}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                        <span>
                            {creating
                                ? 'Creating room…'
                                : detailLoading
                                    ? 'Loading match…'
                                    : !embedUrl
                                        ? 'No stream available yet'
                                        : invitees.length > 0
                                            ? `Create room & invite ${invitees.length}`
                                            : 'Create watch-together room'}
                        </span>
                        {!creating && canCreate ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden>
                            <div className="w-full border-t border-gray-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-900/80 px-3 text-[10px] uppercase tracking-widest text-gray-500">or join one</span>
                        </div>
                    </div>

                    <form onSubmit={joinRoom} className="space-y-3">
                        <p className="text-sm text-white">Have a room code?</p>
                        <div className="flex gap-2">
                            <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={12}
                                className="block flex-1 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-3 font-mono text-sm tracking-wider text-white placeholder:text-gray-600 outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                            />
                            <button
                                type="submit"
                                disabled={!joinCode.trim()}
                                className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Join
                            </button>
                        </div>
                    </form>

                    {error ? (
                        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    ) : null}

                    <div className="border-t border-gray-800 pt-4">
                        <Link href={`/match/${category}/${id}`} className="text-xs text-gray-400 hover:text-teal-300">
                            ← Back to match
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
