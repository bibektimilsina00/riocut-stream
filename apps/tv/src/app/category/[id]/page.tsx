import { getChannels } from '@riocut/services';
import ChannelGrid from '@/components/ChannelGrid';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cat = decodeURIComponent(id);
    const channels = (await getChannels()).filter((c) => c.categories.includes(cat));
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <h1 className="text-2xl font-bold capitalize">{cat}</h1>
            <ChannelGrid channels={channels} />
        </div>
    );
}
