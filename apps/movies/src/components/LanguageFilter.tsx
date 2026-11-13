'use client';

import { Languages } from 'lucide-react';
import { FILTER_LANGUAGES, langName } from '@/lib/languages';

/** Scrollable language chip row for browse pages. */
export default function LanguageFilter({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
  disabled?: boolean;
}) {
  const chip = (active: boolean) =>
    `rounded-full px-4 py-1 text-sm flex-shrink-0 transition-all duration-200 ${active
      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:bg-orange-500'
      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'}`;
  return (
    <div className="pb-3 flex items-center gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
      <Languages className="w-5 h-5 text-gray-500 flex-shrink-0" />
      <button disabled={disabled} onClick={() => onChange(null)} className={chip(value === null)}>
        All Languages
      </button>
      {FILTER_LANGUAGES.map((code) => (
        <button key={code} disabled={disabled} onClick={() => onChange(code)} className={chip(value === code)}>
          {langName(code)}
        </button>
      ))}
    </div>
  );
}
