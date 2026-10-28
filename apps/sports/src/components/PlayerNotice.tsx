'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const UBLOCK_URL = 'https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh';
const BRAVE_URL = 'https://brave.com/';
const KEY = 'riosports:hide-adblock-tip';

/** One-line, dismissible ad-blocker tip (third-party players can pop ads). */
export default function PlayerNotice() {
    // Hidden until mounted so a dismissed tip never flashes.
    const [show, setShow] = useState(false);
    useEffect(() => {
        try { setShow(localStorage.getItem(KEY) !== '1'); } catch { setShow(true); }
    }, []);
    if (!show) return null;
    const dismiss = () => {
        setShow(false);
        try { localStorage.setItem(KEY, '1'); } catch { /* private mode: hide for this visit only */ }
    };
    return (
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-500/20 bg-teal-500/5 px-3 py-2.5 text-xs text-gray-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            <p className="flex-1 leading-relaxed">
                Popups from a stream? Third-party players run their own ads —{' '}
                <a href={UBLOCK_URL} target="_blank" rel="noopener noreferrer" className="text-teal-300 underline-offset-2 hover:underline">uBlock Origin Lite</a>
                {' '}or{' '}
                <a href={BRAVE_URL} target="_blank" rel="noopener noreferrer" className="text-teal-300 underline-offset-2 hover:underline">Brave</a>
                {' '}blocks them.
            </p>
            <button onClick={dismiss} aria-label="Dismiss tip" className="shrink-0 text-gray-500 hover:text-gray-200">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
