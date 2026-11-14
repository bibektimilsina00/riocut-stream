/** Language helpers (ISO 639-1 codes as used by TMDB). */

// Browse-filter languages, Indian first.
export const FILTER_LANGUAGES = [
  'hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'pa', 'en', 'ko', 'ja', 'es', 'fr', 'zh', 'tr', 'th',
];

export function langName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Original language first, then the rest of spoken languages; deduped. */
export function titleLanguages(t: {
  original_language?: string;
  spoken_languages?: { iso_639_1: string }[];
}): string[] {
  const all = [t.original_language, ...(t.spoken_languages ?? []).map((l) => l.iso_639_1)];
  return [...new Set(all.filter((c): c is string => !!c && c !== 'xx'))];
}

/** Append the provider's documented default-subtitle param, e.g. ?ds_lang=hi. */
export function withSubtitle(url: string | undefined, param?: string | null, lang?: string | null): string | undefined {
  if (!url || !param || !lang) return url;
  try {
    const u = new URL(url);
    u.searchParams.set(param, lang);
    return u.toString();
  } catch {
    return url;
  }
}
