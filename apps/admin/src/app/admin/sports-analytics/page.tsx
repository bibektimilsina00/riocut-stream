'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Loader2, Globe, AlertTriangle, RotateCcw } from 'lucide-react';

type Data = {
    window: string;
    total: number;
    bySource: { sourceKey: string; providerName: string; count: number }[];
    byProvider: { providerName: string; count: number }[];
    byMatch: { matchKey: string; count: number }[];
    byCountry: { country: string | null; count: number }[];
};

const WINDOWS = [
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-200">{title}</div>
            {children}
        </div>
    );
}

function Bar({ label, count, max, tone = 'blue' }: { label: React.ReactNode; count: number; max: number; tone?: 'blue' | 'red' | 'purple' | 'green' }) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    const color = tone === 'red' ? 'bg-red-500/50' : tone === 'purple' ? 'bg-purple-500/50' : tone === 'green' ? 'bg-green-500/50' : 'bg-teal-500/50';
    return (
        <div className="px-4 py-2 hover:bg-gray-800/40">
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-300 truncate max-w-[70%]">{label}</span>
                <span className="text-gray-400 font-mono">{count}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function SportsAnalyticsPage() {
    const [window, setWindow] = useState('7d');
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);

    function load() {
        setLoading(true);
        fetch(`/api/admin/sports-analytics?window=${window}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setData(d))
            .finally(() => setLoading(false));
    }

    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [window]);

    async function reset(mode: 'all' | 'prune') {
        const url = mode === 'prune'
            ? '/api/admin/sports-analytics?olderThan=30d'
            : '/api/admin/sports-analytics';
        const label = mode === 'prune'
            ? 'Delete reports older than 30 days?'
            : 'Wipe ALL reliability reports? Every source becomes unflagged again.';
        if (!confirm(label)) return;
        setResetting(true);
        try {
            const r = await fetch(url, { method: 'DELETE' });
            const d = await r.json().catch(() => ({}));
            alert(`Removed ${d.deleted ?? 0} report(s).`);
            load();
        } finally {
            setResetting(false);
        }
    }

    const maxSource = Math.max(1, ...(data?.bySource ?? []).map((x) => x.count));
    const maxProvider = Math.max(1, ...(data?.byProvider ?? []).map((x) => x.count));
    const maxMatch = Math.max(1, ...(data?.byMatch ?? []).map((x) => x.count));
    const maxCountry = Math.max(1, ...(data?.byCountry ?? []).map((x) => x.count));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 size={28} /> Sports Stream Reliability
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Reports of broken streams from viewers. Higher = worse.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
                        {WINDOWS.map((w) => (
                            <button
                                key={w.key}
                                onClick={() => setWindow(w.key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${window === w.key ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => reset('prune')}
                        disabled={resetting}
                        className="text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
                        title="Delete reports older than 30 days"
                    >
                        Prune 30d+
                    </button>
                    <button
                        onClick={() => reset('all')}
                        disabled={resetting}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 disabled:opacity-50"
                        title="Wipe all reports — every source becomes unflagged"
                    >
                        <RotateCcw size={14} />
                        Reset all flags
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : !data ? (
                <div className="text-center py-16 text-gray-500">Failed to load analytics.</div>
            ) : data.total === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    No reports in this window. Either everything works, or nobody's watching.
                </div>
            ) : (
                <>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 flex items-center justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wider text-gray-500">Total reports</div>
                            <div className="text-3xl font-bold text-white mt-1">{data.total.toLocaleString()}</div>
                        </div>
                        <div className="text-xs text-gray-500">{data.window} window</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Worst upstream providers">
                            <div className="divide-y divide-gray-800">
                                {data.byProvider.length === 0
                                    ? <div className="px-4 py-6 text-center text-gray-500 text-sm">No data</div>
                                    : data.byProvider.map((r) => (
                                        <Bar key={r.providerName} label={r.providerName} count={r.count} max={maxProvider} tone="red" />
                                    ))}
                            </div>
                        </Card>

                        <Card title="Reports by country">
                            <div className="divide-y divide-gray-800">
                                {data.byCountry.length === 0
                                    ? <div className="px-4 py-6 text-center text-gray-500 text-sm">No geo data (edge headers missing)</div>
                                    : data.byCountry.map((r) => (
                                        <Bar
                                            key={r.country ?? 'unknown'}
                                            label={<><Globe className="inline w-3 h-3 mr-1" />{r.country ?? 'unknown'}</>}
                                            count={r.count}
                                            max={maxCountry}
                                            tone="purple"
                                        />
                                    ))}
                            </div>
                        </Card>
                    </div>

                    <Card title="Worst individual sources (top 50)">
                        <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
                            {data.bySource.map((r) => (
                                <Bar
                                    key={r.sourceKey}
                                    label={`${r.providerName} · ${r.sourceKey}`}
                                    count={r.count}
                                    max={maxSource}
                                    tone="red"
                                />
                            ))}
                        </div>
                    </Card>

                    <Card title="Matches with most complaints (top 25)">
                        <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
                            {data.byMatch.map((r) => (
                                <Bar key={r.matchKey} label={r.matchKey} count={r.count} max={maxMatch} tone="blue" />
                            ))}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
