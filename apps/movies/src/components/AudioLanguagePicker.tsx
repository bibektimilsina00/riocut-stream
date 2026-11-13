'use client';

import { Languages } from 'lucide-react';
import { langName } from '@/lib/languages';

/** Audio-language chips shown above the server list on watch pages. */
export default function AudioLanguagePicker({
  langs,
  value,
  onChange,
}: {
  langs: string[];
  value?: string;
  onChange: (code: string) => void;
}) {
  if (langs.length < 2) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <Languages className="w-3.5 h-3.5 text-orange-400" />
        Audio language
      </span>
      {langs.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${value === code
            ? 'bg-orange-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
        >
          {langName(code)}
        </button>
      ))}
      <span className="text-[11px] text-gray-500">
        Can&apos;t hear it? Open the player&apos;s settings (⚙) to switch audio, or try another server.
      </span>
    </div>
  );
}
