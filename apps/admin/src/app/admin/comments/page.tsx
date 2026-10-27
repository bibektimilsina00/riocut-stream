'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, ExternalLink, Loader2 } from 'lucide-react';

type Author = { id: string; name: string | null; email: string | null } | null;

type MatchRow = {
    id: string;
    matchKey: string;
    authorName: string;
    isGuest: boolean;
    content: string;
    createdAt: string;
    user: Author;
    _count: { reactions: number; replies: number };
};

type BlogRow = {
    id: string;
    content: string;
    createdAt: string;
    user: Author;
    post: { id: string; title: string; slug: string };
};

type ApiResp<T> = { type: 'match' | 'blog'; items: T[]; total: number; page: number; limit: number };

export default function CommentsPage() {
    const [type, setType] = useState<'match' | 'blog'>('match');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<ApiResp<MatchRow | BlogRow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch(`/api/admin/comments?type=${type}&page=${page}&limit=50`);
            if (!r.ok) throw new Error('load failed');
            setData(await r.json());
        } catch (e) {
            console.error(e);
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [type, page]);

    async function handleDelete(id: string) {
        if (!confirm('Delete this comment?')) return;
        setDeletingId(id);
        try {
            const r = await fetch(`/api/admin/comments/${id}?type=${type}`, { method: 'DELETE' });
            if (!r.ok) throw new Error('delete failed');
            await load();
        } catch (e) {
            console.error(e);
            alert('Delete failed');
        } finally {
            setDeletingId(null);
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquare size={28} /> Comments
                    </h1>
                    <p className="text-gray-400 mt-2">Moderate live-chat and blog comments</p>
                </div>
                <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
                    {(['match', 'blog'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setType(t); setPage(1); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === t ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t === 'match' ? 'Sports (live)' : 'Blog'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        No {type === 'match' ? 'match' : 'blog'} comments yet.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3">Author</th>
                                <th className="text-left px-4 py-3">Content</th>
                                <th className="text-left px-4 py-3">{type === 'match' ? 'Match' : 'Post'}</th>
                                <th className="text-left px-4 py-3">When</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {data.items.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-800/40">
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-white font-medium">
                                            {'authorName' in c ? c.authorName : c.user?.name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {'isGuest' in c && c.isGuest
                                                ? 'guest'
                                                : c.user?.email || (('user' in c && c.user?.id) || '—')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-200 max-w-md">
                                        <div className="whitespace-pre-wrap break-words line-clamp-4">{c.content}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-300 text-xs">
                                        {'matchKey' in c ? (
                                            <span className="font-mono">{c.matchKey}</span>
                                        ) : (
                                            <a
                                                href={`/blog/${c.post.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-teal-400 hover:underline inline-flex items-center gap-1"
                                            >
                                                {c.post.title}
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {'_count' in c && (
                                            <div className="text-gray-500 mt-1">
                                                {c._count.reactions} reactions · {c._count.replies} replies
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top text-gray-400 text-xs whitespace-nowrap">
                                        {new Date(c.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            disabled={deletingId === c.id}
                                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {data && data.total > data.limit && (
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{data.total} total</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
                        >Prev</button>
                        <span>{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
                        >Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
