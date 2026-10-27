import { notFound } from 'next/navigation';
import { getChannel } from '@riocut/services';
import TvPlayer from '@/components/TvPlayer';
import FavoriteButton from '@/components/FavoriteButton';

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const channel = await getChannel(decodeURIComponent(id));
    if (!channel) notFound();

    const ref = { id: channel.id, name: channel.name, logo: channel.logo, country: channel.country?.name ?? null };

    return (
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
            <TvPlayer streams={channel.streams} channelName={channel.name} channelRef={ref} />
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {channel.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={channel.logo} alt={channel.name} className="h-12 w-12 object-contain" />
                    )}
                    <div>
                        <h1 className="text-xl font-bold">{channel.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {channel.country?.flag} {channel.country?.name} · {channel.categories.join(', ')}
                        </p>
                    </div>
                </div>
                <FavoriteButton channel={ref} />
            </div>
        </div>
    );
}
