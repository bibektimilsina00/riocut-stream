'use client';

import { useEffect, useState } from 'react';
import { Key, Loader2, Check, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

interface Status {
    hasKey: boolean;
    masked: string | null;
    updatedAt: string | null;
}

export default function TmdbSettingsPage() {
    const [status, setStatus] = useState<Status | null>(null);
    const [input, setInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const load = async () => {
        try {
            const res = await fetch('/api/admin/settings/tmdb', { cache: 'no-store' });
            if (res.ok) setStatus(await res.json());
        } catch {
            setError('Failed to load TMDB status');
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        if (!input.trim()) {
            setError('Paste a TMDB API key');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/tmdb', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tmdbApiKey: input.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Save failed');
            } else {
                setSaved(true);
                setInput('');
                await load();
                window.setTimeout(() => setSaved(false), 2500);
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const onClear = async () => {
        if (!confirm('Clear stored TMDB key? System will fall back to env var.')) return;
        setClearing(true);
        try {
            await fetch('/api/admin/settings/tmdb', { method: 'DELETE' });
            await load();
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <header>
                <h1 className="text-2xl font-bold">TMDB API Key</h1>
                <p className="text-sm text-gray-400 mt-1">
                    The active TMDB key powers movie + TV metadata on Riocut. Stored against
                    your admin user; the public app reads it through an in-memory cache
                    (5 min TTL) and never exposes it to the browser.
                </p>
            </header>

            <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                        <Key className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold">Current status</h2>
                        {status ? (
                            status.hasKey ? (
                                <p className="text-sm text-gray-300 mt-1">
                                    Active key: <code className="px-2 py-0.5 rounded bg-gray-800 text-emerald-300">{status.masked}</code>
                                    {status.updatedAt ? (
                                        <span className="text-xs text-gray-500 ml-2">
                                            updated {new Date(status.updatedAt).toLocaleString()}
                                        </span>
                                    ) : null}
                                </p>
                            ) : (
                                <p className="text-sm text-amber-300 mt-1">No key stored — system is using the env var fallback.</p>
                            )
                        ) : (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</p>
                        )}
                    </div>
                    {status?.hasKey ? (
                        <button
                            onClick={onClear}
                            disabled={clearing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Clear
                        </button>
                    ) : null}
                </div>
            </section>

            <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-semibold mb-3">Update key</h2>
                <form onSubmit={onSave} className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-gray-400 mb-1.5 inline-block">TMDB v3 API key</span>
                        <input
                            type="password"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j…"
                            autoComplete="off"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 outline-none font-mono"
                        />
                    </label>
                    {error ? (
                        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
                    ) : null}
                    <div className="flex items-center justify-end gap-3">
                        {saved ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Saved + cache busted
                            </span>
                        ) : null}
                        <button
                            type="submit"
                            disabled={saving || !input.trim()}
                            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Save key
                        </button>
                    </div>
                </form>
            </section>

            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                Need a key?
                <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                >
                    themoviedb.org/settings/api <ExternalLink className="w-3 h-3" />
                </a>
            </p>
        </div>
    );
}
