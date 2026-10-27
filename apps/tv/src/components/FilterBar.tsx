'use client';

import type { TvCategory, TvCountry, TvLanguage } from '@riocut/services';

interface Props {
    countries: TvCountry[];
    categories: TvCategory[];
    languages: TvLanguage[];
    country: string;
    category: string;
    language: string;
    onCountry: (v: string) => void;
    onCategory: (v: string) => void;
    onLanguage: (v: string) => void;
}

export default function FilterBar(p: Props) {
    const sel = 'rounded-md border border-border bg-card px-3 py-2 text-sm';
    return (
        <div className="flex flex-wrap gap-3">
            <select className={sel} value={p.country} onChange={(e) => p.onCountry(e.target.value)}>
                <option value="">All countries</option>
                {p.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                    </option>
                ))}
            </select>
            <select className={sel} value={p.category} onChange={(e) => p.onCategory(e.target.value)}>
                <option value="">All categories</option>
                {p.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name} ({c.count})
                    </option>
                ))}
            </select>
            <select className={sel} value={p.language} onChange={(e) => p.onLanguage(e.target.value)}>
                <option value="">All languages</option>
                {p.languages.map((l) => (
                    <option key={l.code} value={l.code}>
                        {l.name} ({l.count})
                    </option>
                ))}
            </select>
        </div>
    );
}
