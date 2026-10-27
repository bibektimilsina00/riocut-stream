'use client';

import { use } from 'react';
import Link from 'next/link';
import { useVenue } from '@/lib/hooks/useBsd';
import { flagEmoji } from '@/lib/bsd/format';
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react';

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: v, isLoading, error } = useVenue(id);

    if (isLoading) return <div className="container mx-auto px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-gray-900" /></div>;
    if (error || !v) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400">Venue not found.</p>
                <Link href="/" className="mt-3 inline-block text-sm text-teal-400 underline">← Home</Link>
            </div>
        );
    }

    const facts: Array<[string, string | null]> = [
        ['Capacity', v.capacity != null ? v.capacity.toLocaleString() : null],
        ['Built', v.builtYear != null ? `${v.builtYear}` : null],
        ['Pitch', v.pitchLengthM && v.pitchWidthM ? `${v.pitchLengthM} × ${v.pitchWidthM} m` : null],
        ['Country', v.country],
    ].filter(([, val]) => val) as Array<[string, string]>;

    const maps = v.latitude != null && v.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}` : null;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400"><ArrowLeft className="h-3 w-3" /> Back</Link>
            <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Stadium</p>
                <h1 className="text-2xl font-black text-white">{v.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    {v.city ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{v.city}{v.country ? `, ${v.country}` : ''}</span> : null}
                    {v.country ? <span>{flagEmoji(v.country) ?? ''}</span> : null}
                    {maps ? <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-400 hover:underline">Map <ExternalLink className="h-3 w-3" /></a> : null}
                </div>
            </section>

            {facts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {facts.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
                            <p className="mt-1 text-lg font-bold text-white">{value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
