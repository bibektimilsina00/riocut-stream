'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'egfilm:lang-prefs';
type Prefs = { audio?: string; sub?: string }; // audio 'original' = always original

/** Remembered audio/subtitle language, per browser. ponytail: localStorage only; sync to the account if wanted. */
export function useLangPrefs() {
    const [prefs, setPrefs] = useState<Prefs>({});
    useEffect(() => {
        try { setPrefs(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* private mode */ }
    }, []);
    const update = useCallback((patch: Prefs) => {
        setPrefs((p) => {
            const next = { ...p, ...patch };
            try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);
    return { prefs, update };
}
