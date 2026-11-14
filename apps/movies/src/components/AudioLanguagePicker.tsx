'use client';

import { useEffect, useState } from 'react';
import { Languages, Check } from 'lucide-react';
import { FILTER_LANGUAGES, langName } from '@/lib/languages';

/**
 * Audio chips: Original (always), then languages viewers confirmed for THIS title (✓),
 * then everything else under "more" as unverified. Verified languages only list the
 * servers that were confirmed to carry them (the watch page filters the server list).
 */
export default function AudioLanguagePicker({
  original,
  spoken,
  verified,
  value,
  onChange,
  providerSlug,
  onHeard,
}: {
  original?: string;
  spoken: string[];
  verified: Record<string, string[]>;
  value?: string;
  onChange: (code: string) => void;
  providerSlug?: string;
  onHeard: (lang: string, providerSlug: string, heard: boolean) => void;
}) {
  const [more, setMore] = useState(false);
  const [asked, setAsked] = useState(false);
  const [answered, setAnswered] = useState<string>('');
  const isOriginal = !value || value === original;
  const confirmed = !isOriginal && !!verified[value!]?.length;

  // Ask "are you hearing X?" after the viewer has stayed on a server for a while.
  useEffect(() => {
    setAsked(false);
    if (isOriginal || !providerSlug) return;
    const t = setTimeout(() => document.visibilityState === 'visible' && setAsked(true), 25_000);
    return () => clearTimeout(t);
  }, [value, providerSlug, isOriginal]);

  if (!original) return null;
  const verifiedLangs = Object.keys(verified).filter((l) => l !== original && verified[l].length);
  const others = [...new Set([...spoken, ...FILTER_LANGUAGES])].filter((l) => l !== original && !verifiedLangs.includes(l));
  const key = `${value}|${providerSlug}`;

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${active
      ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <Languages className="w-3.5 h-3.5 text-orange-400" /> Audio
        </span>
        <button onClick={() => onChange(original)} className={chip(isOriginal)}>
          {langName(original)} <span className="opacity-70">· Original</span>
        </button>
        {verifiedLangs.map((l) => (
          <button key={l} onClick={() => onChange(l)} className={chip(value === l)}>
            {langName(l)} <Check className="w-3 h-3 text-green-300" />
          </button>
        ))}
        <button onClick={() => setMore(!more)} className="text-xs text-gray-400 hover:text-white underline-offset-2 hover:underline">
          {more ? 'less' : 'more languages ▾'}
        </button>
      </div>

      {more && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span className="text-[11px] text-gray-500">Unverified — may not exist for this title:</span>
          {others.map((l) => (
            <button key={l} onClick={() => onChange(l)} className={chip(value === l) + ' opacity-80'}>
              {langName(l)}
            </button>
          ))}
        </div>
      )}

      {!isOriginal && !confirmed && (
        <p className="text-[11px] text-yellow-300/90">
          {langName(value!)} isn&apos;t confirmed for this title yet, so all servers are shown. Try one and tell us if it works.
        </p>
      )}

      {!isOriginal && asked && providerSlug && answered !== key && (
        <div className="flex items-center gap-2 text-xs text-gray-300">
          Hearing {langName(value!)}?
          <button className="px-2 py-0.5 rounded bg-green-600/80 text-white" onClick={() => { onHeard(value!, providerSlug, true); setAnswered(key); }}>Yes</button>
          <button className="px-2 py-0.5 rounded bg-gray-600 text-white" onClick={() => { onHeard(value!, providerSlug, false); setAnswered(key); }}>No</button>
        </div>
      )}
      {!isOriginal && answered === key && <p className="text-[11px] text-green-300">Thanks — that helps other viewers.</p>}
    </div>
  );
}
