'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@riocut/ui/components/ui/button';

interface ChannelRef {
    id: string;
    name: string;
    logo: string | null;
    country: string | null;
}

export default function FavoriteButton({ channel }: { channel: ChannelRef }) {
    const [fav, setFav] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/tv/favorites')
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((d: { items?: { channelId: string }[] }) => {
                setFav(!!d.items?.some((i) => i.channelId === channel.id));
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [channel.id]);

    const toggle = async () => {
        const next = !fav;
        setFav(next);
        try {
            const res = next
                ? await fetch('/api/tv/favorites', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ channelId: channel.id, name: channel.name, logo: channel.logo, country: channel.country }),
                  })
                : await fetch(`/api/tv/favorites?channelId=${encodeURIComponent(channel.id)}`, { method: 'DELETE' });
            if (res.status === 401) {
                setFav(!next);
                toast.info('Log in to save favorites');
                return;
            }
            if (!res.ok) throw new Error();
        } catch {
            setFav(!next);
            toast.error('Could not update favorite');
        }
    };

    return (
        <Button variant={fav ? 'default' : 'secondary'} size="sm" onClick={toggle} disabled={!loaded}>
            <Heart className={`mr-2 h-4 w-4 ${fav ? 'fill-current' : ''}`} /> {fav ? 'Favorited' : 'Favorite'}
        </Button>
    );
}
