import type { TvChannel } from '@riocut/services';
import ChannelCard from './ChannelCard';

export default function ChannelGrid({ channels }: { channels: TvChannel[] }) {
    if (channels.length === 0) {
        return <p className="py-12 text-center text-muted-foreground">No channels found.</p>;
    }
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {channels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
            ))}
        </div>
    );
}
