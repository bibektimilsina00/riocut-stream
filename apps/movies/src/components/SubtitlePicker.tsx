'use client';

import { Captions } from 'lucide-react';
import { FILTER_LANGUAGES, langName } from '@/lib/languages';

/** Default-subtitle chooser. Only affects servers that document a subtitle URL param. */
export default function SubtitlePicker({
  value,
  onChange,
  supported,
}: {
  value?: string;
  onChange: (code: string) => void; // '' = off
  supported: boolean; // does the ACTIVE server accept the param?
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <Captions className="w-3.5 h-3.5 text-orange-400" /> Subtitles
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 text-gray-200 text-xs rounded-md px-2 py-1 border border-gray-600"
      >
        <option value="">Off / player default</option>
        {FILTER_LANGUAGES.map((l) => <option key={l} value={l}>{langName(l)}</option>)}
      </select>
      {value && !supported && (
        <span className="text-[11px] text-gray-500">
          This server can&apos;t preset subtitles — use the player&apos;s CC menu, or pick a server marked CC.
        </span>
      )}
    </div>
  );
}
