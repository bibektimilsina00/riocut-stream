/** Pure, client-safe formatting helpers for BSD player/team data. */

export function formatMarketValue(eur: number | null | undefined): string | null {
    if (!eur || eur <= 0) return null;
    if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(eur >= 10_000_000 ? 0 : 1)}M`;
    if (eur >= 1_000) return `€${Math.round(eur / 1_000)}K`;
    return `€${eur}`;
}

export function ageFromDob(dob: string | null | undefined, nowMs?: number): number | null {
    if (!dob) return null;
    const born = new Date(dob).getTime();
    if (Number.isNaN(born)) return null;
    const now = nowMs ?? Date.now();
    const age = Math.floor((now - born) / (365.25 * 24 * 3600 * 1000));
    return age > 0 && age < 120 ? age : null;
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

/** Map a country name to a flag emoji via a small alias table + fallback. */
const COUNTRY_A2: Record<string, string> = {
    argentina: 'AR', egypt: 'EG', brazil: 'BR', france: 'FR', spain: 'ES', germany: 'DE',
    england: 'GB', portugal: 'PT', italy: 'IT', netherlands: 'NL', belgium: 'BE',
    croatia: 'HR', usa: 'US', 'united states': 'US', mexico: 'MX', sudan: 'SD',
    morocco: 'MA', nigeria: 'NG', ghana: 'GH', senegal: 'SN', japan: 'JP', 'south korea': 'KR',
};

export function flagEmoji(country: string | null | undefined): string | null {
    if (!country) return null;
    const a2 = COUNTRY_A2[country.trim().toLowerCase()];
    if (!a2) return null;
    return a2.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
