import { getChannels } from '@riocut/services';
import ChannelGrid from '@/components/ChannelGrid';

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const channels = (await getChannels()).filter((c) => c.country?.code === decodeURIComponent(code));
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <h1 className="text-2xl font-bold">{channels[0]?.country?.name ?? code}</h1>
            <ChannelGrid channels={channels} />
        </div>
    );
}
