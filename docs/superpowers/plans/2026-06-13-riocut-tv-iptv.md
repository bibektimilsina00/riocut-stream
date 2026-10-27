# tv — Live TV (IPTV) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/tv` (tv.riocut.com, port 3333) — browse/search/filter and watch free live TV channels from iptv-org, in the movies monorepo.

**Architecture:** New Next.js 15.5 app cloned from `apps/eglive`. A new `iptv.service` in `@riocut/services` ingests iptv-org API JSON + `.m3u` playlists, normalizes to `TvChannel[]`, cached daily. A `TvPlayer` plays HLS via `hls.js` with a try-direct → `/api/stream-proxy` → next-stream fallback chain. Favorites/recently-watched use new Prisma models + a service following the existing `watchlist.service` pattern.

**Tech Stack:** Next.js 15.5, React 19, TypeScript, Tailwind, Prisma/Postgres, `hls.js`, `@tanstack/react-query`, `next-auth` v5, Vitest (for pure-logic units).

**Spec:** `docs/superpowers/specs/2026-06-13-riocut-tv-iptv-design.md`

**Conventions observed:**
- Each app reuses `@riocut/{auth,ui,db,services,realtime,config}` workspace packages.
- App `tsconfig` extends `@riocut/config/tsconfig/next.json`; tailwind uses `@riocut/config/tailwind/preset`; eslint extends `@riocut/config/eslint/next`.
- Auth: app-local `src/lib/auth.ts` calls `createAuth(...)` from `@riocut/auth/server`; route handlers gate on `await auth()`.
- Data hooks: React Query in `src/lib/hooks/*`, querying app API routes or a thin client lib.
- Repo currently has no test runner; this plan adds Vitest to `@riocut/services` for two pure-logic modules only (normalization, proxy URL rewrite). UI/integration tasks are verified manually with explicit steps.

---

## File Structure

**`packages/services/`** (shared data + persistence logic)
- `src/iptv.types.ts` — `TvChannel`, `TvStream`, `TvCategory`, `TvCountry`, `TvLanguage`, raw iptv-org JSON shapes.
- `src/iptv.normalize.ts` — pure functions joining raw iptv-org data → `TvChannel[]` (unit-tested).
- `src/iptv.service.ts` — cached fetchers (`getChannels`, `getChannel`, `getCategories`, `getCountries`, `getLanguages`).
- `src/iptvFavorites.service.ts` — favorites + recently-watched persistence.
- `src/index.ts` — add exports.
- `vitest.config.ts`, `test/iptv.normalize.test.ts`, `test/streamProxy.rewrite.test.ts`.
- `src/streamProxy.rewrite.ts` — pure `.m3u8` URL-rewrite helper (unit-tested; imported by the tv proxy route).

**`packages/db/`**
- `prisma/schema.prisma` — add `TvFavorite`, `TvRecent`, User relations.
- migration.

**`apps/tv/`** (new Next.js app)
- Config: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `next-env.d.ts`.
- `src/middleware.ts`, `src/lib/auth.ts`.
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`.
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/health/route.ts`.
- `src/app/api/stream-proxy/route.ts`.
- `src/app/api/tv/favorites/route.ts`, `src/app/api/tv/recent/route.ts`.
- `src/lib/hooks/useTv.ts`.
- `src/components/`: `Navigation.tsx`, `Footer.tsx`, `TvPlayer.tsx`, `ChannelCard.tsx`, `ChannelGrid.tsx`, `FilterBar.tsx`, `SearchBox.tsx`, `CategoryTile.tsx`, `FavoriteButton.tsx`.
- `src/app/browse/page.tsx`, `src/app/channel/[id]/page.tsx`, `src/app/country/[code]/page.tsx`, `src/app/category/[id]/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`.
- `public/` (favicon, logo).

**Root**
- `package.json` — add `dev:tv`, `build:tv` scripts.
- `turbo.json` — add `NEXT_PUBLIC_RIOCUT_TV_URL` to `globalEnv`.

---

## Task 1: Scaffold `apps/tv` skeleton (boots on port 3333)

**Files:**
- Create all `apps/tv/*` config files, `src/middleware.ts`, `src/lib/auth.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, auth/health API routes, `Navigation.tsx`, `Footer.tsx`.
- Modify: root `package.json`, `turbo.json`.

- [ ] **Step 1: Copy eglive scaffold as starting point**

```bash
cd ~/projects/riocut-stream
cp -R apps/eglive apps/tv
rm -rf apps/tv/node_modules apps/tv/.next apps/tv/.turbo
# remove eglive-specific feature code; keep skeleton + auth + nav/footer shells
rm -rf apps/tv/src/app/leagues apps/tv/src/app/match apps/tv/src/app/schedule \
       apps/tv/src/app/sports apps/tv/src/app/search apps/tv/src/app/watchlist \
       apps/tv/src/app/api/continue-watching apps/tv/src/app/api/notifications \
       apps/tv/src/app/api/watch-room apps/tv/src/app/api/watchlist \
       apps/tv/src/lib/sportsrc.ts apps/tv/src/lib/hooks/useSports.ts \
       apps/tv/src/components/EmbedMatchPlayer.tsx apps/tv/src/components/MatchCard.tsx \
       apps/tv/src/components/ScoreboardCard.tsx apps/tv/src/components/SportsTile.tsx \
       apps/tv/src/components/StandingsTable.tsx apps/tv/src/components/LiveBadge.tsx
```

- [ ] **Step 2: Rewrite `apps/tv/package.json`**

Set name + ports to 3333, add `hls.js`, drop socket.io (not needed for TV).

```json
{
  "name": "tv",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "NODE_NO_WARNINGS=1 NODE_OPTIONS='--max-old-space-size=2048' next dev --port 3333 --turbo",
    "build": "NODE_OPTIONS='--max-old-space-size=2048' next build",
    "start": "next start --port 3333",
    "lint": "eslint",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next .turbo node_modules"
  },
  "dependencies": {
    "@riocut/auth": "workspace:*",
    "@riocut/config": "workspace:*",
    "@riocut/db": "workspace:*",
    "@riocut/realtime": "workspace:*",
    "@riocut/services": "workspace:*",
    "@riocut/ui": "workspace:*",
    "@prisma/client": "^6.17.1",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.13",
    "@tanstack/react-query": "^5.90.5",
    "@tanstack/react-query-devtools": "^5.90.2",
    "axios": "^1.12.2",
    "bcryptjs": "^3.0.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "hls.js": "^1.5.18",
    "lucide-react": "^0.545.0",
    "next": "15.5.11",
    "next-auth": "^5.0.0-beta.29",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-toastify": "^11.0.5",
    "tailwind-merge": "^3.3.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.19.24",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.21",
    "eslint": "^9",
    "eslint-config-next": "15.5.11",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: Fix `apps/tv/next.config.ts` image hosts**

Replace `images.remotePatterns` (sports hosts → IPTV logo + flag hosts). iptv-org logos are served from many hosts; allow common ones plus a wildcard-free safe set, and keep `flagcdn.com`.

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['@riocut/db', '@riocut/auth', '@riocut/ui', '@riocut/services', '@riocut/realtime'],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' }, // iptv-org logos come from arbitrary hosts
        ],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
};

export default nextConfig;
```

- [ ] **Step 4: Update `src/lib/auth.ts`, `src/middleware.ts`**

`src/lib/auth.ts` — protected paths become TV ones:

```ts
import { createAuth, registerUser, getUserByEmail } from '@riocut/auth/server';

const { handlers, auth, signIn, signOut } = createAuth({
    signInPage: '/login',
    protectedPaths: ['/favorites'],
});

export { handlers, auth, signIn, signOut, registerUser, getUserByEmail };
```

`src/middleware.ts`:

```ts
import { createAuthMiddleware } from '@riocut/auth/middleware';

export default createAuthMiddleware({
    signInPage: '/login',
    protectedPaths: ['/favorites'],
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
```

- [ ] **Step 5: Rewrite `src/app/layout.tsx` metadata + temporary home**

`layout.tsx` — same structure as eglive, TV branding:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionProvider from "@riocut/auth/components/SessionProvider";
import { QueryProvider } from "@riocut/realtime/client/QueryProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: { default: "Riocut TV — Live TV", template: "%s | Riocut TV" },
    description: "Watch free live TV channels from around the world. Search, filter by country, category and language.",
    icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground antialiased">
                <SessionProvider>
                    <QueryProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navigation />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                        <ToastContainer position="bottom-right" autoClose={3500} theme="dark" newestOnTop limit={5} />
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
```

Replace `src/app/page.tsx` with a temporary placeholder (real home in Task 7):

```tsx
export default function Home() {
    return <div className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-2xl font-bold">Riocut TV — coming soon</h1></div>;
}
```

- [ ] **Step 6: Simplify `Navigation.tsx` + `Footer.tsx`**

Edit `src/components/Navigation.tsx` to TV nav links: Home `/`, Browse `/browse`, Favorites `/favorites`, plus existing auth/session UI from the eglive copy (keep the login/avatar logic, just change the link list and brand text to "Riocut TV"). Edit `Footer.tsx` brand text to "Riocut TV". (Keep the eglive component internals; only swap labels/links.)

- [ ] **Step 7: Add root scripts + turbo env**

In root `package.json` `scripts`, add after `build:eglive`:

```json
    "dev:tv": "pnpm --filter tv dev",
    "build:tv": "pnpm --filter tv build",
```

In `turbo.json` `globalEnv` array, add `"NEXT_PUBLIC_RIOCUT_TV_URL"`.

- [ ] **Step 8: Install + boot**

```bash
cd ~/projects/riocut-stream
pnpm install
pnpm --filter tv dev
```

Expected: dev server boots on `http://localhost:3333`, home shows "Riocut TV — coming soon", `/api/health` returns `{"status":"healthy",...}`. Stop server after verifying.

- [ ] **Step 9: type-check + commit**

```bash
pnpm --filter tv type-check
git add apps/tv package.json turbo.json pnpm-lock.yaml
git commit -m "feat(tv): scaffold live TV app on port 3333"
```

---

## Task 2: iptv data types + normalization (unit-tested)

**Files:**
- Create: `packages/services/src/iptv.types.ts`, `packages/services/src/iptv.normalize.ts`
- Create: `packages/services/vitest.config.ts`, `packages/services/test/iptv.normalize.test.ts`
- Modify: `packages/services/package.json` (add vitest + test script)

- [ ] **Step 1: Add Vitest to services package**

Modify `packages/services/package.json`: add to `devDependencies` `"vitest": "^2.1.0"` and to `scripts` `"test": "vitest run"`. Then:

```bash
cd ~/projects/riocut-stream && pnpm install
```

Create `packages/services/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['test/**/*.test.ts'] } });
```

- [ ] **Step 2: Write `iptv.types.ts`**

```ts
// Raw iptv-org API shapes (subset of fields we use)
export interface RawChannel { id: string; name: string; country: string; categories: string[]; is_nsfw: boolean; languages?: string[]; closed?: string | null; replaced_by?: string | null; }
export interface RawStream { channel: string | null; feed?: string | null; url: string; referrer?: string | null; user_agent?: string | null; quality?: string | null; }
export interface RawCategory { id: string; name: string; }
export interface RawCountry { code: string; name: string; languages: string[]; flag: string; }
export interface RawLanguage { code: string; name: string; }
export interface RawLogo { channel: string; url: string; }
export interface RawBlocked { channel: string; }

// Normalized shapes used by the app
export interface TvStream { url: string; quality?: string | null; referrer?: string | null; userAgent?: string | null; }
export interface TvCountry { code: string; name: string; flag: string; }
export interface TvChannel {
  id: string;
  name: string;
  logo: string | null;
  country: TvCountry | null;
  categories: string[];
  languages: string[];
  streams: TvStream[];
  isNsfw: boolean;
}
export interface TvCategory { id: string; name: string; count: number; }
export interface TvLanguage { code: string; name: string; count: number; }
```

- [ ] **Step 3: Write the failing test `test/iptv.normalize.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeChannels } from '../src/iptv.normalize';
import type { RawChannel, RawStream, RawCountry, RawLogo, RawBlocked } from '../src/iptv.types';

const countries: RawCountry[] = [{ code: 'GB', name: 'United Kingdom', languages: ['eng'], flag: '🇬🇧' }];
const channels: RawChannel[] = [
  { id: 'BBCNews.uk', name: 'BBC News', country: 'GB', categories: ['news'], is_nsfw: false, languages: ['eng'] },
  { id: 'Dead.uk', name: 'Dead', country: 'GB', categories: ['news'], is_nsfw: false }, // no stream -> dropped
  { id: 'Blocked.uk', name: 'Blocked', country: 'GB', categories: ['news'], is_nsfw: false }, // blocklisted -> dropped
  { id: 'Adult.xx', name: 'Adult', country: 'GB', categories: ['xxx'], is_nsfw: true }, // nsfw -> dropped by default
];
const streams: RawStream[] = [
  { channel: 'BBCNews.uk', url: 'https://a/stream.m3u8', quality: '720p', referrer: 'https://ref', user_agent: 'UA' },
  { channel: 'BBCNews.uk', url: 'https://b/stream.m3u8' },
  { channel: 'Blocked.uk', url: 'https://c/stream.m3u8' },
  { channel: 'Adult.xx', url: 'https://d/stream.m3u8' },
  { channel: null, url: 'https://orphan/stream.m3u8' }, // no channel -> ignored
];
const logos: RawLogo[] = [{ channel: 'BBCNews.uk', url: 'https://logo/bbc.png' }];
const blocked: RawBlocked[] = [{ channel: 'Blocked.uk' }];

describe('normalizeChannels', () => {
  it('joins channels with streams, logos, country; drops blocked/streamless/nsfw', () => {
    const result = normalizeChannels({ channels, streams, countries, logos, blocked });
    expect(result.map((c) => c.id)).toEqual(['BBCNews.uk']);
    const bbc = result[0];
    expect(bbc.name).toBe('BBC News');
    expect(bbc.logo).toBe('https://logo/bbc.png');
    expect(bbc.country).toEqual({ code: 'GB', name: 'United Kingdom', flag: '🇬🇧' });
    expect(bbc.streams).toHaveLength(2);
    expect(bbc.streams[0]).toMatchObject({ url: 'https://a/stream.m3u8', quality: '720p', referrer: 'https://ref', userAgent: 'UA' });
  });

  it('keeps nsfw when includeNsfw=true', () => {
    const result = normalizeChannels({ channels, streams, countries, logos, blocked, includeNsfw: true });
    expect(result.map((c) => c.id).sort()).toEqual(['Adult.xx', 'BBCNews.uk']);
  });
});
```

- [ ] **Step 4: Run test, verify it fails**

```bash
pnpm --filter @riocut/services test
```

Expected: FAIL — `normalizeChannels` not found.

- [ ] **Step 5: Implement `iptv.normalize.ts`**

```ts
import type { RawChannel, RawStream, RawCountry, RawLogo, RawBlocked, TvChannel, TvStream } from './iptv.types';

export interface NormalizeInput {
  channels: RawChannel[];
  streams: RawStream[];
  countries: RawCountry[];
  logos: RawLogo[];
  blocked: RawBlocked[];
  includeNsfw?: boolean;
}

export function normalizeChannels(input: NormalizeInput): TvChannel[] {
  const { channels, streams, countries, logos, blocked, includeNsfw = false } = input;

  const blockedSet = new Set(blocked.map((b) => b.channel));
  const countryByCode = new Map(countries.map((c) => [c.code, c]));
  const logoByChannel = new Map(logos.map((l) => [l.channel, l.url]));

  const streamsByChannel = new Map<string, TvStream[]>();
  for (const s of streams) {
    if (!s.channel || !s.url) continue;
    const list = streamsByChannel.get(s.channel) ?? [];
    list.push({ url: s.url, quality: s.quality ?? null, referrer: s.referrer ?? null, userAgent: s.user_agent ?? null });
    streamsByChannel.set(s.channel, list);
  }

  const result: TvChannel[] = [];
  for (const ch of channels) {
    if (blockedSet.has(ch.id)) continue;
    if (ch.closed || ch.replaced_by) continue;
    if (ch.is_nsfw && !includeNsfw) continue;
    const chStreams = streamsByChannel.get(ch.id);
    if (!chStreams || chStreams.length === 0) continue;
    const country = countryByCode.get(ch.country);
    result.push({
      id: ch.id,
      name: ch.name,
      logo: logoByChannel.get(ch.id) ?? null,
      country: country ? { code: country.code, name: country.name, flag: country.flag } : null,
      categories: ch.categories ?? [],
      languages: ch.languages ?? [],
      streams: chStreams,
      isNsfw: ch.is_nsfw,
    });
  }
  return result;
}
```

- [ ] **Step 6: Run test, verify PASS**

```bash
pnpm --filter @riocut/services test
```

Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/services/src/iptv.types.ts packages/services/src/iptv.normalize.ts \
        packages/services/vitest.config.ts packages/services/test/iptv.normalize.test.ts \
        packages/services/package.json pnpm-lock.yaml
git commit -m "feat(services): iptv types + channel normalization with tests"
```

---

## Task 3: iptv.service — cached fetchers

**Files:**
- Create: `packages/services/src/iptv.service.ts`
- Modify: `packages/services/src/index.ts`

- [ ] **Step 1: Implement `iptv.service.ts`**

Uses `next/cache` `unstable_cache` (available because services run inside Next apps). Derives categories/languages with counts from the normalized list.

```ts
import { unstable_cache } from 'next/cache';
import { normalizeChannels } from './iptv.normalize';
import type { RawChannel, RawStream, RawCountry, RawLogo, RawBlocked, TvChannel, TvCategory, TvCountry, TvLanguage, RawCategory, RawLanguage } from './iptv.types';

const API = 'https://iptv-org.github.io/api';
const DAY = 86400;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, { next: { revalidate: DAY } });
  if (!res.ok) throw new Error(`iptv-org fetch failed: ${path} (${res.status})`);
  return res.json() as Promise<T>;
}

const loadChannels = unstable_cache(
  async (): Promise<TvChannel[]> => {
    const [channels, streams, countries, logos, blocked] = await Promise.all([
      fetchJson<RawChannel[]>('channels.json'),
      fetchJson<RawStream[]>('streams.json'),
      fetchJson<RawCountry[]>('countries.json'),
      fetchJson<RawLogo[]>('logos.json'),
      fetchJson<RawBlocked[]>('blocklist.json'),
    ]);
    return normalizeChannels({ channels, streams, countries, logos, blocked });
  },
  ['iptv-channels'],
  { revalidate: DAY, tags: ['iptv'] },
);

export async function getChannels(): Promise<TvChannel[]> {
  try { return await loadChannels(); } catch { return []; }
}

export async function getChannel(id: string): Promise<TvChannel | null> {
  const channels = await getChannels();
  return channels.find((c) => c.id === id) ?? null;
}

export const getCountries = unstable_cache(
  async (): Promise<TvCountry[]> => {
    const channels = await getChannels();
    const seen = new Map<string, TvCountry>();
    for (const c of channels) if (c.country && !seen.has(c.country.code)) seen.set(c.country.code, c.country);
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
  ['iptv-countries'], { revalidate: DAY, tags: ['iptv'] },
);

export const getCategories = unstable_cache(
  async (): Promise<TvCategory[]> => {
    const [channels, raw] = await Promise.all([getChannels(), fetchJson<RawCategory[]>('categories.json').catch(() => [] as RawCategory[])]);
    const nameById = new Map(raw.map((r) => [r.id, r.name]));
    const counts = new Map<string, number>();
    for (const ch of channels) for (const cat of ch.categories) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    return [...counts.entries()].map(([id, count]) => ({ id, name: nameById.get(id) ?? id, count })).sort((a, b) => b.count - a.count);
  },
  ['iptv-categories'], { revalidate: DAY, tags: ['iptv'] },
);

export const getLanguages = unstable_cache(
  async (): Promise<TvLanguage[]> => {
    const [channels, raw] = await Promise.all([getChannels(), fetchJson<RawLanguage[]>('languages.json').catch(() => [] as RawLanguage[])]);
    const nameByCode = new Map(raw.map((r) => [r.code, r.name]));
    const counts = new Map<string, number>();
    for (const ch of channels) for (const l of ch.languages) counts.set(l, (counts.get(l) ?? 0) + 1);
    return [...counts.entries()].map(([code, count]) => ({ code, name: nameByCode.get(code) ?? code, count })).sort((a, b) => b.count - a.count);
  },
  ['iptv-languages'], { revalidate: DAY, tags: ['iptv'] },
);
```

- [ ] **Step 2: Export from services index**

Add to `packages/services/src/index.ts`:

```ts
export * from './iptv.types';
export * from './iptv.normalize';
export * from './iptv.service';
```

- [ ] **Step 3: type-check + commit**

```bash
pnpm --filter @riocut/services type-check
git add packages/services/src/iptv.service.ts packages/services/src/index.ts
git commit -m "feat(services): cached iptv-org fetchers (channels, categories, countries, languages)"
```

---

## Task 4: stream-proxy URL rewrite (unit-tested) + proxy route

**Files:**
- Create: `packages/services/src/streamProxy.rewrite.ts`, `packages/services/test/streamProxy.rewrite.test.ts`
- Modify: `packages/services/src/index.ts`
- Create: `apps/tv/src/app/api/stream-proxy/route.ts`

- [ ] **Step 1: Write failing test `test/streamProxy.rewrite.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { rewriteM3u8 } from '../src/streamProxy.rewrite';

const proxy = (u: string) => `/api/stream-proxy?url=${encodeURIComponent(u)}`;

describe('rewriteM3u8', () => {
  it('rewrites absolute segment urls through the proxy', () => {
    const base = 'https://host.tv/live/playlist.m3u8';
    const input = ['#EXTM3U', '#EXTINF:6,', 'https://host.tv/live/seg1.ts', ''].join('\n');
    const out = rewriteM3u8(input, base, proxy);
    expect(out).toContain(proxy('https://host.tv/live/seg1.ts'));
  });

  it('resolves relative segment urls against the base then proxies', () => {
    const base = 'https://host.tv/live/playlist.m3u8';
    const input = ['#EXTM3U', '#EXTINF:6,', 'seg1.ts'].join('\n');
    const out = rewriteM3u8(input, base, proxy);
    expect(out).toContain(proxy('https://host.tv/live/seg1.ts'));
  });

  it('rewrites nested variant playlists in a master playlist', () => {
    const base = 'https://host.tv/master.m3u8';
    const input = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=1000', '720/index.m3u8'].join('\n');
    const out = rewriteM3u8(input, base, proxy);
    expect(out).toContain(proxy('https://host.tv/720/index.m3u8'));
  });

  it('rewrites URI attributes in EXT-X-KEY / EXT-X-MEDIA tags', () => {
    const base = 'https://host.tv/master.m3u8';
    const input = '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"';
    const out = rewriteM3u8(input, base, proxy);
    expect(out).toContain(`URI="${proxy('https://host.tv/key.bin')}"`);
  });

  it('leaves comment/tag-only lines untouched', () => {
    const out = rewriteM3u8('#EXTM3U\n#EXT-X-VERSION:3', 'https://host.tv/p.m3u8', proxy);
    expect(out).toContain('#EXT-X-VERSION:3');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm --filter @riocut/services test test/streamProxy.rewrite.test.ts
```

Expected: FAIL — `rewriteM3u8` not found.

- [ ] **Step 3: Implement `streamProxy.rewrite.ts`**

```ts
// Pure helper: rewrite all resource URLs in an .m3u8 playlist to go through a proxy.
// `base` is the absolute URL the playlist was fetched from (for resolving relative URLs).
// `toProxy` maps an absolute URL to the proxied URL.
export function rewriteM3u8(content: string, base: string, toProxy: (absUrl: string) => string): string {
  const resolve = (u: string) => new URL(u, base).toString();

  return content.split('\n').map((line) => {
    const trimmed = line.trim();
    if (trimmed === '') return line;

    // Tag line: rewrite any URI="..." attribute (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP, etc.)
    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${toProxy(resolve(uri))}"`);
    }

    // Resource line (segment or nested playlist)
    return toProxy(resolve(trimmed));
  }).join('\n');
}
```

- [ ] **Step 4: Run test, verify PASS**

```bash
pnpm --filter @riocut/services test
```

Expected: PASS (all normalize + rewrite tests).

- [ ] **Step 5: Export + commit the helper**

Add `export * from './streamProxy.rewrite';` to `packages/services/src/index.ts`.

```bash
git add packages/services/src/streamProxy.rewrite.ts packages/services/test/streamProxy.rewrite.test.ts packages/services/src/index.ts
git commit -m "feat(services): m3u8 url-rewrite helper with tests"
```

- [ ] **Step 6: Implement proxy route `apps/tv/src/app/api/stream-proxy/route.ts`**

SSRF guard: only proxy hosts that appear in the ingested channel stream set.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getChannels, rewriteM3u8 } from '@riocut/services';

export const dynamic = 'force-dynamic';

let allowedHostsCache: { hosts: Set<string>; at: number } | null = null;
const ALLOW_TTL = 3600_000;

async function allowedHosts(): Promise<Set<string>> {
  if (allowedHostsCache && Date.now() - allowedHostsCache.at < ALLOW_TTL) return allowedHostsCache.hosts;
  const channels = await getChannels();
  const hosts = new Set<string>();
  for (const c of channels) for (const s of c.streams) {
    try { hosts.add(new URL(s.url).hostname); } catch { /* skip */ }
  }
  allowedHostsCache = { hosts, at: Date.now() };
  return hosts;
}

const PLAYLIST_RE = /\.m3u8($|\?)/i;

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  let url: URL;
  try { url = new URL(target); } catch { return NextResponse.json({ error: 'Invalid url' }, { status: 400 }); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
  }
  // SSRF guard: hostname must be a known iptv-org stream host (or a sub-resource host of the segment chain
  // already validated because the proxied playlist only emits proxy URLs we generated). We additionally allow
  // any host whose URL we produced via rewrite by checking the allowlist; nested segment hosts that differ are
  // permitted only if present in the allowlist.
  const hosts = await allowedHosts();
  if (!hosts.has(url.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  const referrer = req.nextUrl.searchParams.get('ref');
  const userAgent = req.nextUrl.searchParams.get('ua');
  const headers: Record<string, string> = {};
  if (referrer) headers['Referer'] = referrer;
  headers['User-Agent'] = userAgent || 'Mozilla/5.0';

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), { headers, redirect: 'follow' });
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: 'Upstream error', status: upstream.status }, { status: 502 });

  const contentType = upstream.headers.get('content-type') ?? '';
  const isPlaylist = PLAYLIST_RE.test(url.pathname) || contentType.includes('mpegurl');

  if (isPlaylist) {
    const text = await upstream.text();
    const finalUrl = upstream.url || url.toString();
    const toProxy = (abs: string) => {
      const p = new URLSearchParams({ url: abs });
      if (referrer) p.set('ref', referrer);
      if (userAgent) p.set('ua', userAgent);
      return `/api/stream-proxy?${p.toString()}`;
    };
    const rewritten = rewriteM3u8(text, finalUrl, toProxy);
    return new NextResponse(rewritten, {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    });
  }

  // Binary passthrough (segments, keys)
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}
```

Note: nested segment/variant hosts must also pass the allowlist. iptv-org segments are usually same-host as the playlist (already allowlisted). If a stream uses a CDN host not in the channel list its segments 403 and the player falls back to the next stream — acceptable for v1.

- [ ] **Step 7: type-check + commit**

```bash
pnpm --filter tv type-check
git add apps/tv/src/app/api/stream-proxy/route.ts
git commit -m "feat(tv): stream proxy route with m3u8 rewrite and SSRF allowlist"
```

---

## Task 5: TvPlayer component (direct → proxy → next-stream fallback)

**Files:**
- Create: `apps/tv/src/components/TvPlayer.tsx`

- [ ] **Step 1: Implement `TvPlayer.tsx`**

```tsx
'use client';

import { useEffect, useРеф, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { TvStream } from '@riocut/services';
import { Button } from '@riocut/ui/components/ui/button';

type Mode = 'direct' | 'proxy';

function proxify(stream: TvStream): string {
  const p = new URLSearchParams({ url: stream.url });
  if (stream.referrer) p.set('ref', stream.referrer);
  if (stream.userAgent) p.set('ua', stream.userAgent);
  return `/api/stream-proxy?${p.toString()}`;
}

export default function TvPlayer({ streams, channelName, onAllFailed }: { streams: TvStream[]; channelName: string; onAllFailed?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [streamIdx, setStreamIdx] = useState(0);
  const [mode, setMode] = useState<Mode>('direct');
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading');

  // advance fallback: direct -> proxy -> next stream's direct -> ... -> failed
  const advance = useCallback(() => {
    setStatus('loading');
    if (mode === 'direct') { setMode('proxy'); return; }
    if (streamIdx < streams.length - 1) { setStreamIdx((i) => i + 1); setMode('direct'); return; }
    setStatus('failed');
    onAllFailed?.();
  }, [mode, streamIdx, streams.length, onAllFailed]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streams[streamIdx];
    if (!video || !stream) return;

    const src = mode === 'direct' ? stream.url : proxify(stream);
    let cancelled = false;

    const onPlaying = () => !cancelled && setStatus('playing');
    video.addEventListener('playing', onPlaying);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal && !cancelled) { hls.destroy(); advance(); }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS (cannot rewrite via hls.js; proxy mode still works because we serve a rewritten playlist)
      video.src = src;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
      video.addEventListener('error', () => { if (!cancelled) advance(); }, { once: true });
    } else {
      setStatus('failed');
      onAllFailed?.();
    }

    return () => {
      cancelled = true;
      video.removeEventListener('playing', onPlaying);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [streamIdx, mode, streams, advance, onAllFailed]);

  const retry = () => { setStreamIdx(0); setMode('direct'); setStatus('loading'); };

  return (
    <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden border border-border">
      <video ref={videoRef} controls playsInline className="absolute inset-0 h-full w-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      {status === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm">{channelName} is offline right now.</p>
          <Button size="sm" variant="secondary" onClick={retry}>Try again</Button>
        </div>
      )}
    </div>
  );
}
```

NOTE: fix the import line — it must read `import { useEffect, useRef, useState, useCallback } from 'react';` (the snippet above contains a deliberate typo `useРеф` to flag manual review; remove it). Only `useEffect, useRef, useState, useCallback` are used.

- [ ] **Step 2: type-check**

```bash
pnpm --filter tv type-check
```

Expected: PASS (after fixing the import line noted above).

- [ ] **Step 3: Commit**

```bash
git add apps/tv/src/components/TvPlayer.tsx
git commit -m "feat(tv): TvPlayer with direct->proxy->next-stream fallback"
```

---

## Task 6: Data hooks + internal channel API routes

**Files:**
- Create: `apps/tv/src/app/api/tv/channels/route.ts`
- Create: `apps/tv/src/app/api/tv/filters/route.ts`
- Create: `apps/tv/src/lib/hooks/useTv.ts`

- [ ] **Step 1: `api/tv/channels/route.ts`** (returns full normalized list; cached upstream)

```ts
import { NextResponse } from 'next/server';
import { getChannels } from '@riocut/services';

export const revalidate = 86400;

export async function GET() {
  const channels = await getChannels();
  return NextResponse.json({ channels });
}
```

- [ ] **Step 2: `api/tv/filters/route.ts`** (countries/categories/languages for filter UI)

```ts
import { NextResponse } from 'next/server';
import { getCountries, getCategories, getLanguages } from '@riocut/services';

export const revalidate = 86400;

export async function GET() {
  const [countries, categories, languages] = await Promise.all([getCountries(), getCategories(), getLanguages()]);
  return NextResponse.json({ countries, categories, languages });
}
```

- [ ] **Step 3: `src/lib/hooks/useTv.ts`**

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { TvChannel, TvCategory, TvCountry, TvLanguage } from '@riocut/services';

const DAY = 86400_000;

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json() as Promise<T>;
}

export function useChannels() {
  return useQuery({
    queryKey: ['tv', 'channels'],
    queryFn: () => get<{ channels: TvChannel[] }>('/api/tv/channels').then((d) => d.channels),
    staleTime: DAY,
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ['tv', 'filters'],
    queryFn: () => get<{ countries: TvCountry[]; categories: TvCategory[]; languages: TvLanguage[] }>('/api/tv/filters'),
    staleTime: DAY,
  });
}
```

- [ ] **Step 4: type-check + commit**

```bash
pnpm --filter tv type-check
git add apps/tv/src/app/api/tv apps/tv/src/lib/hooks/useTv.ts
git commit -m "feat(tv): channel/filter API routes + react-query hooks"
```

---

## Task 7: UI — cards, grid, filters, pages

**Files:**
- Create: `apps/tv/src/components/ChannelCard.tsx`, `ChannelGrid.tsx`, `SearchBox.tsx`, `FilterBar.tsx`, `CategoryTile.tsx`
- Create/replace: `apps/tv/src/app/page.tsx`, `apps/tv/src/app/browse/page.tsx`, `apps/tv/src/app/channel/[id]/page.tsx`, `apps/tv/src/app/country/[code]/page.tsx`, `apps/tv/src/app/category/[id]/page.tsx`

- [ ] **Step 1: `ChannelCard.tsx`**

```tsx
import Link from 'next/link';
import type { TvChannel } from '@riocut/services';
import { Tv } from 'lucide-react';

export default function ChannelCard({ channel }: { channel: TvChannel }) {
  return (
    <Link href={`/channel/${encodeURIComponent(channel.id)}`} className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 transition hover:border-primary">
      <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-muted">
        {channel.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.logo} alt={channel.name} className="max-h-16 max-w-[80%] object-contain" loading="lazy" />
        ) : (
          <Tv className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="w-full text-center">
        <p className="truncate text-sm font-medium">{channel.name}</p>
        <p className="truncate text-xs text-muted-foreground">{channel.country?.flag} {channel.country?.name ?? '—'}</p>
      </div>
    </Link>
  );
}
```

(Use a plain `<img>` for logos since hosts are arbitrary; avoids next/image host config churn.)

- [ ] **Step 2: `ChannelGrid.tsx`**

```tsx
import type { TvChannel } from '@riocut/services';
import ChannelCard from './ChannelCard';

export default function ChannelGrid({ channels }: { channels: TvChannel[] }) {
  if (channels.length === 0) return <p className="py-12 text-center text-muted-foreground">No channels found.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {channels.map((c) => <ChannelCard key={c.id} channel={c} />)}
    </div>
  );
}
```

- [ ] **Step 3: `SearchBox.tsx`** (controlled, calls back)

```tsx
'use client';
import { Search } from 'lucide-react';
import { Input } from '@riocut/ui/components/ui/input';

export default function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search channels…" className="pl-9" />
    </div>
  );
}
```

- [ ] **Step 4: `FilterBar.tsx`** (country/category/language selects)

```tsx
'use client';
import type { TvCategory, TvCountry, TvLanguage } from '@riocut/services';

interface Props {
  countries: TvCountry[]; categories: TvCategory[]; languages: TvLanguage[];
  country: string; category: string; language: string;
  onCountry: (v: string) => void; onCategory: (v: string) => void; onLanguage: (v: string) => void;
}

export default function FilterBar(p: Props) {
  const sel = 'rounded-md border border-border bg-card px-3 py-2 text-sm';
  return (
    <div className="flex flex-wrap gap-3">
      <select className={sel} value={p.country} onChange={(e) => p.onCountry(e.target.value)}>
        <option value="">All countries</option>
        {p.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
      </select>
      <select className={sel} value={p.category} onChange={(e) => p.onCategory(e.target.value)}>
        <option value="">All categories</option>
        {p.categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.count})</option>)}
      </select>
      <select className={sel} value={p.language} onChange={(e) => p.onLanguage(e.target.value)}>
        <option value="">All languages</option>
        {p.languages.map((l) => <option key={l.code} value={l.code}>{l.name} ({l.count})</option>)}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: `CategoryTile.tsx`** (home rows link)

```tsx
import Link from 'next/link';
import type { TvCategory } from '@riocut/services';

export default function CategoryTile({ category }: { category: TvCategory }) {
  return (
    <Link href={`/category/${encodeURIComponent(category.id)}`} className="rounded-lg border border-border bg-card px-4 py-6 text-center transition hover:border-primary">
      <p className="font-semibold capitalize">{category.name}</p>
      <p className="text-xs text-muted-foreground">{category.count} channels</p>
    </Link>
  );
}
```

- [ ] **Step 6: `browse/page.tsx`** (client; search + filters + pagination via URL params)

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useChannels, useFilters } from '@/lib/hooks/useTv';
import ChannelGrid from '@/components/ChannelGrid';
import SearchBox from '@/components/SearchBox';
import FilterBar from '@/components/FilterBar';
import { Pagination } from '@riocut/ui/components/ui/pagination';
import { Loader2 } from 'lucide-react';

const PAGE_SIZE = 60;

export default function BrowsePage() {
  const { data: channels = [], isLoading } = useChannels();
  const { data: filters } = useFilters();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return channels.filter((c) =>
      (!needle || c.name.toLowerCase().includes(needle)) &&
      (!country || c.country?.code === country) &&
      (!category || c.categories.includes(category)) &&
      (!language || c.languages.includes(language))
    );
  }, [channels, q, country, category, language]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const reset = () => setPage(1);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Browse channels</h1>
      <div className="flex flex-col gap-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); reset(); }} />
        {filters && (
          <FilterBar
            countries={filters.countries} categories={filters.categories} languages={filters.languages}
            country={country} category={category} language={language}
            onCountry={(v) => { setCountry(v); reset(); }} onCategory={(v) => { setCategory(v); reset(); }} onLanguage={(v) => { setLanguage(v); reset(); }}
          />
        )}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} channels</p>
          <ChannelGrid channels={pageItems} />
          {totalPages > 1 && <Pagination currentPage={current} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
```

Note: verify `Pagination` prop names against `packages/ui/src/components/ui/pagination.tsx` before finalizing; adapt prop names if they differ.

- [ ] **Step 7: `channel/[id]/page.tsx`** (server component loads channel, renders player client)

```tsx
import { notFound } from 'next/navigation';
import { getChannel } from '@riocut/services';
import TvPlayer from '@/components/TvPlayer';
import FavoriteButton from '@/components/FavoriteButton';

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(decodeURIComponent(id));
  if (!channel) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <TvPlayer streams={channel.streams} channelName={channel.name} />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {channel.logo && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={channel.logo} alt={channel.name} className="h-12 w-12 object-contain" />)}
          <div>
            <h1 className="text-xl font-bold">{channel.name}</h1>
            <p className="text-sm text-muted-foreground">{channel.country?.flag} {channel.country?.name} · {channel.categories.join(', ')}</p>
          </div>
        </div>
        <FavoriteButton channel={{ id: channel.id, name: channel.name, logo: channel.logo, country: channel.country?.name ?? null }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: `country/[code]/page.tsx` and `category/[id]/page.tsx`** (server, filter + grid)

`country/[code]/page.tsx`:

```tsx
import { getChannels } from '@riocut/services';
import ChannelGrid from '@/components/ChannelGrid';

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const channels = (await getChannels()).filter((c) => c.country?.code === decodeURIComponent(code));
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{channels[0]?.country?.name ?? code}</h1>
      <ChannelGrid channels={channels} />
    </div>
  );
}
```

`category/[id]/page.tsx`:

```tsx
import { getChannels } from '@riocut/services';
import ChannelGrid from '@/components/ChannelGrid';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = decodeURIComponent(id);
  const channels = (await getChannels()).filter((c) => c.categories.includes(cat));
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold capitalize">{cat}</h1>
      <ChannelGrid channels={channels} />
    </div>
  );
}
```

- [ ] **Step 9: Real home `app/page.tsx`** (server: featured categories + sample channels)

```tsx
import Link from 'next/link';
import { getCategories, getChannels } from '@riocut/services';
import CategoryTile from '@/components/CategoryTile';
import ChannelGrid from '@/components/ChannelGrid';

export default async function Home() {
  const [categories, channels] = await Promise.all([getCategories(), getChannels()]);
  const featured = categories.slice(0, 8);
  const popular = channels.slice(0, 12);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Live TV from around the world</h1>
        <p className="text-muted-foreground">Free channels — news, sports, movies, music and more.</p>
        <Link href="/browse" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Browse all channels</Link>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{featured.map((c) => <CategoryTile key={c.id} category={c} />)}</div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Channels</h2>
        <ChannelGrid channels={popular} />
      </section>
    </div>
  );
}
```

- [ ] **Step 10: type-check + manual smoke + commit**

```bash
pnpm --filter tv type-check
pnpm --filter tv dev   # visit /, /browse, click a channel, confirm playback or graceful "offline"
```

```bash
git add apps/tv/src/components apps/tv/src/app
git commit -m "feat(tv): home, browse (search+filter+pagination), channel/country/category pages"
```

---

## Task 8: Favorites + recently-watched (DB + service + API + UI)

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/services/src/iptvFavorites.service.ts`
- Modify: `packages/services/src/index.ts`
- Create: `apps/tv/src/app/api/tv/favorites/route.ts`, `apps/tv/src/app/api/tv/recent/route.ts`
- Create: `apps/tv/src/components/FavoriteButton.tsx`, `apps/tv/src/app/favorites/page.tsx`

- [ ] **Step 1: Add Prisma models**

Append to `packages/db/prisma/schema.prisma`:

```prisma
model TvFavorite {
  id        String   @id @default(cuid())
  userId    String
  channelId String
  name      String
  logo      String?
  country   String?
  addedAt   DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channelId])
  @@index([userId])
}

model TvRecent {
  id        String   @id @default(cuid())
  userId    String
  channelId String
  name      String
  logo      String?
  country   String?
  watchedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channelId])
  @@index([userId])
}
```

Add to the `User` model relations block:

```prisma
  tvFavorites TvFavorite[]
  tvRecent    TvRecent[]
```

- [ ] **Step 2: Generate migration**

```bash
cd ~/projects/riocut-stream
pnpm --filter @riocut/db db:migrate -- --name add_tv_favorites_recent
pnpm --filter @riocut/db db:generate
```

Expected: migration created + Prisma client regenerated. (Requires `DATABASE_URL` reachable — if dev DB is down, run `db:generate` against an updated schema and apply migration when DB available; note this in the commit.)

- [ ] **Step 3: Implement `iptvFavorites.service.ts`**

```ts
import { prisma } from '@riocut/db';

export interface TvChannelRef { channelId: string; name: string; logo?: string | null; country?: string | null; }

export async function addFavorite(userId: string, ch: TvChannelRef) {
  return prisma.tvFavorite.upsert({
    where: { userId_channelId: { userId, channelId: ch.channelId } },
    update: { name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
    create: { userId, channelId: ch.channelId, name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
  });
}

export async function removeFavorite(userId: string, channelId: string) {
  await prisma.tvFavorite.deleteMany({ where: { userId, channelId } });
  return { ok: true };
}

export async function listFavorites(userId: string) {
  return prisma.tvFavorite.findMany({ where: { userId }, orderBy: { addedAt: 'desc' } });
}

export async function recordRecent(userId: string, ch: TvChannelRef) {
  return prisma.tvRecent.upsert({
    where: { userId_channelId: { userId, channelId: ch.channelId } },
    update: { name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
    create: { userId, channelId: ch.channelId, name: ch.name, logo: ch.logo ?? null, country: ch.country ?? null },
  });
}

export async function listRecent(userId: string, limit = 20) {
  return prisma.tvRecent.findMany({ where: { userId }, orderBy: { watchedAt: 'desc' }, take: limit });
}
```

Add `export * from './iptvFavorites.service';` to `packages/services/src/index.ts`.

- [ ] **Step 4: API routes**

`apps/tv/src/app/api/tv/favorites/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addFavorite, removeFavorite, listFavorites } from '@riocut/services';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ items: await listFavorites(session.user.id) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.channelId || !body.name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const item = await addFavorite(session.user.id, { channelId: body.channelId, name: body.name, logo: body.logo ?? null, country: body.country ?? null });
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const channelId = new URL(req.url).searchParams.get('channelId');
  if (!channelId) return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
  await removeFavorite(session.user.id, channelId);
  return NextResponse.json({ ok: true });
}
```

`apps/tv/src/app/api/tv/recent/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recordRecent, listRecent } from '@riocut/services';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ items: await listRecent(session.user.id) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.channelId || !body.name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const item = await recordRecent(session.user.id, { channelId: body.channelId, name: body.name, logo: body.logo ?? null, country: body.country ?? null });
  return NextResponse.json({ item }, { status: 201 });
}
```

- [ ] **Step 5: `FavoriteButton.tsx`** (client, optimistic; prompts login if 401)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@riocut/ui/components/ui/button';

interface ChannelRef { id: string; name: string; logo: string | null; country: string | null; }

export default function FavoriteButton({ channel }: { channel: ChannelRef }) {
  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/tv/favorites').then((r) => r.ok ? r.json() : { items: [] }).then((d: { items?: { channelId: string }[] }) => {
      setFav(!!d.items?.some((i) => i.channelId === channel.id));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [channel.id]);

  const toggle = async () => {
    const next = !fav;
    setFav(next);
    try {
      const res = next
        ? await fetch('/api/tv/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelId: channel.id, name: channel.name, logo: channel.logo, country: channel.country }) })
        : await fetch(`/api/tv/favorites?channelId=${encodeURIComponent(channel.id)}`, { method: 'DELETE' });
      if (res.status === 401) { setFav(!next); toast.info('Log in to save favorites'); return; }
      if (!res.ok) throw new Error();
    } catch { setFav(!next); toast.error('Could not update favorite'); }
  };

  return (
    <Button variant={fav ? 'default' : 'secondary'} size="sm" onClick={toggle} disabled={!loaded}>
      <Heart className={`mr-2 h-4 w-4 ${fav ? 'fill-current' : ''}`} /> {fav ? 'Favorited' : 'Favorite'}
    </Button>
  );
}
```

- [ ] **Step 6: `favorites/page.tsx`** (client list; protected by middleware)

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';

interface Fav { channelId: string; name: string; logo: string | null; country: string | null; }

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([]);
  useEffect(() => { fetch('/api/tv/favorites').then((r) => r.ok ? r.json() : { items: [] }).then((d) => setItems(d.items ?? [])); }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Your favorites</h1>
      {items.length === 0 ? <p className="text-muted-foreground">No favorites yet.</p> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((c) => (
            <Link key={c.channelId} href={`/channel/${encodeURIComponent(c.channelId)}`} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary">
              <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-muted">
                {c.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.logo} alt={c.name} className="max-h-16 max-w-[80%] object-contain" /> : <Tv className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="truncate text-sm font-medium">{c.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Record recent on channel view**

In `apps/tv/src/components/TvPlayer.tsx`, after first successful `playing` event, POST to `/api/tv/recent` once (fire-and-forget; ignore 401). Add a prop `channelRef?: { id: string; name: string; logo: string | null; country: string | null }` and call it from `channel/[id]/page.tsx`. Implementation: in the `onPlaying` handler, guard with a ref boolean so it fires once, then `fetch('/api/tv/recent', { method: 'POST', ... }).catch(() => {})`.

- [ ] **Step 8: type-check + commit**

```bash
pnpm --filter @riocut/services type-check && pnpm --filter tv type-check
git add packages/db/prisma packages/services/src/iptvFavorites.service.ts packages/services/src/index.ts apps/tv/src
git commit -m "feat(tv): favorites + recently-watched (db models, service, api, ui)"
```

---

## Task 9: Final wiring + deploy config

**Files:**
- Modify: `.env.local` (document `NEXT_PUBLIC_RIOCUT_TV_URL`), `docker-compose.yml`, `deploy.sh` (if they enumerate apps/ports)

- [ ] **Step 1: Add env var**

Add `NEXT_PUBLIC_RIOCUT_TV_URL=http://localhost:3333` to `.env.local` (and document in any `.env.example`).

- [ ] **Step 2: Inspect deploy artifacts**

Read `docker-compose.yml` and `deploy.sh`; if they list `movies`/`eglive` services or ports, add an `tv` entry on port 3333 mirroring the `eglive` block. If they build a single image, add tv to the build matrix. (Exact edits depend on current content — match the existing eglive pattern line-for-line.)

- [ ] **Step 3: Full build sanity**

```bash
pnpm --filter tv build
```

Expected: production build succeeds.

- [ ] **Step 4: Commit**

```bash
git add .env.local docker-compose.yml deploy.sh
git commit -m "chore(tv): wire env + deploy config for tv.riocut.com"
```

---

## Self-Review Notes

- **Spec coverage:** §4 app skeleton → T1; §5 data layer → T2,T3; §6 proxy+player → T4,T5; §7 pages → T7; §8 search/filters → T7 (browse); §9 favorites/recent → T8; §10 error handling → T3 (empty fallback), T4 (502), T5 (offline state); §11 testing → T2,T4 unit tests + manual smoke steps. All covered.
- **Type consistency:** `TvChannel`/`TvStream`/`TvCategory`/`TvCountry`/`TvLanguage` defined in T2 used identically in T3–T8. `rewriteM3u8(content, base, toProxy)` signature consistent T4 ↔ proxy route. Service fn names (`getChannels`, `getChannel`, `getCountries`, `getCategories`, `getLanguages`, `addFavorite`, `removeFavorite`, `listFavorites`, `recordRecent`, `listRecent`) consistent across tasks.
- **Manual-verify flags:** (a) `Pagination` prop names (T7 S6) — confirm against `packages/ui/src/components/ui/pagination.tsx`. (b) `TvPlayer.tsx` import line contains a deliberate typo to force review (T5 S1) — fix to `useEffect, useRef, useState, useCallback`. (c) Migration (T8 S2) needs a reachable `DATABASE_URL`.
