'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';

interface Fav {
    channelId: string;
    name: string;
    logo: string | null;
    country: string | null;
}

export default function FavoritesPage() {
    const [items, setItems] = useState<Fav[]>([]);

    useEffect(() => {
        fetch('/api/tv/favorites')
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((d) => setItems(d.items ?? []))
            .catch(() => setItems([]));
    }, []);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <h1 className="text-2xl font-bold">Your favorites</h1>
            {items.length === 0 ? (
                <p className="text-muted-foreground">No favorites yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {items.map((c) => (
                        <Link
                            key={c.channelId}
                            href={`/channel/${encodeURIComponent(c.channelId)}`}
                            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary"
                        >
                            <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-muted">
                                {c.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={c.logo} alt={c.name} className="max-h-16 max-w-[80%] object-contain" />
                                ) : (
                                    <Tv className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <p className="truncate text-sm font-medium">{c.name}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
