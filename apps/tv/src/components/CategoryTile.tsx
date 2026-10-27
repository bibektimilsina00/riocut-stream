import Link from 'next/link';
import type { TvCategory } from '@riocut/services';

export default function CategoryTile({ category }: { category: TvCategory }) {
    return (
        <Link
            href={`/category/${encodeURIComponent(category.id)}`}
            className="rounded-lg border border-border bg-card px-4 py-6 text-center transition hover:border-teal-500"
        >
            <p className="font-semibold capitalize">{category.name}</p>
            <p className="text-xs text-muted-foreground">{category.count} channels</p>
        </Link>
    );
}
