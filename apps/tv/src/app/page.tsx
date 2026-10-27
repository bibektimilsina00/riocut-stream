import Link from 'next/link';
import { getCategories, getChannels } from '@riocut/services';
import CategoryTile from '@/components/CategoryTile';
import ChannelGrid from '@/components/ChannelGrid';
import { Tv } from 'lucide-react';

export const revalidate = 86400;

export default async function Home() {
    const [categories, channels] = await Promise.all([getCategories(), getChannels()]);
    const featured = categories.slice(0, 8);
    const popular = channels.slice(0, 12);

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <section className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-teal-500/10 via-gray-900 to-gray-950 p-8">
                <div className="max-w-2xl space-y-3">
                    <p className="text-xs uppercase tracking-widest text-teal-400">Riocut TV</p>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                        Live TV from around the world.
                    </h1>
                    <p className="text-gray-400">
                        Free channels — news, sports, movies, music and more. Search and filter by country, category and language.
                    </p>
                    <Link
                        href="/browse"
                        className="inline-block rounded-full bg-teal-500 hover:bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-all"
                    >
                        Browse all channels
                    </Link>
                </div>
                <Tv className="absolute -bottom-6 -right-6 h-48 w-48 text-teal-500/10" />
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Categories</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {featured.map((c) => (
                        <CategoryTile key={c.id} category={c} />
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Channels</h2>
                <ChannelGrid channels={popular} />
            </section>
        </div>
    );
}
