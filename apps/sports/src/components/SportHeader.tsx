'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sportMeta } from '@/lib/sports';

/** Hub banner + tabs shared by every page that belongs to one sport. */
export default function SportHeader({ category }: { category: string }) {
    const pathname = usePathname();
    const meta = sportMeta(category);
    const base = `/sports/${encodeURIComponent(category)}`;
    const tabs = [
        { href: base, label: 'Overview' },
        { href: `${base}/schedule`, label: 'Schedule' },
        ...(meta.espn ? [{ href: `${base}/leagues`, label: 'Leagues' }] : []),
        ...(meta.sections ?? []),
    ];
    // Longest matching prefix wins, so /teams/123 lights up "Teams" and
    // /leagues/soccer/eng.1 lights up "Leagues".
    const active = pathname?.startsWith('/leagues/')
        ? `${base}/leagues`
        : tabs
            .filter((t) => pathname === t.href || (t.href !== base && pathname?.startsWith(t.href + '/')))
            .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    return (
        <div className={`border-b border-gray-800 bg-gradient-to-br ${meta.gradient}`}>
            <div className="container mx-auto px-4 pt-6">
                <Link href={base} className="flex items-center gap-3">
                    <span className="text-4xl leading-none" aria-hidden>{meta.emoji}</span>
                    <span>
                        <span className="block text-[11px] uppercase tracking-widest text-gray-400">Sport</span>
                        <span className="block text-2xl md:text-3xl font-bold text-white">{meta.label}</span>
                    </span>
                </Link>
                <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
                    {tabs.map((t) => (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={`shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${active === t.href
                                ? 'border-teal-400 text-white'
                                : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                            {t.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
