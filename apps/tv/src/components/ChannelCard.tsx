import Link from 'next/link';
import { Tv } from 'lucide-react';
import type { TvChannel } from '@riocut/services';

export default function ChannelCard({ channel }: { channel: TvChannel }) {
    return (
        <Link
            href={`/channel/${encodeURIComponent(channel.id)}`}
            className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 transition hover:border-teal-500"
        >
            <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-muted">
                {channel.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={channel.logo} alt={channel.name} className="max-h-16 max-w-[80%] object-contain" loading="lazy" />
                ) : (
                    <Tv className="h-8 w-8 text-muted-foreground" />
                )}
            </div>
            <div className="w-full text-center">
                <p className="truncate text-sm font-medium">{channel.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {channel.country?.flag} {channel.country?.name ?? '—'}
                </p>
            </div>
        </Link>
    );
}
