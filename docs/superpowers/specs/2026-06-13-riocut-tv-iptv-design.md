# tv — Live TV (IPTV) App Design

**Date:** 2026-06-13
**Domain:** tv.riocut.com
**Status:** Approved (design phase)

## 1. Goal

A new app in the movies monorepo that streams free, publicly-available live TV
channels sourced from [iptv-org](https://github.com/iptv-org/iptv) and its
[API](https://github.com/iptv-org/api). Users browse, search, and filter
channels and watch them live in the browser, in a user-friendly UI (not a raw
playlist dump).

The streams are already live HLS feeds — "making it live" requires no extra
work beyond playing the `.m3u8` in a browser HLS player. The engineering effort
is in: ingesting/normalizing iptv-org data, reliable in-browser playback
(CORS / mixed-content / dead-stream handling), and a good browse/search/filter UX.

## 2. Non-goals (YAGNI)

- No transcoding / re-streaming infrastructure (only pass-through proxy when needed).
- No EPG / program guide in v1.
- No DVR, recording, or catch-up.
- No admin curation UI in v1 (curation = honoring iptv-org's blocklist).
- No multi-quality manual selection UI (hls.js auto-ABR is enough).

## 3. Legal note

iptv-org aggregates publicly-available streams; some are unofficial
rebroadcasts. The repo disclaims hosting any media. We mitigate by honoring
iptv-org's `blocklist` (channels flagged for copyright/DMCA) and by not acting
as an open relay. Final curation/region policy is the project owner's call.

## 4. App skeleton

- New app `apps/tv`, modeled on `apps/eglive` (Next.js 15.5, React 19,
  Tailwind, same tooling).
- Dev port **3333**; `start` also on 3333.
- Reuses workspace packages: `@riocut/auth`, `@riocut/ui`, `@riocut/db`,
  `@riocut/services`, `@riocut/config`.
- Adds `hls.js` as an app dependency.
- Root scripts: add `dev:tv` / `build:tv` filters.
- `turbo.json` `globalEnv`: add `NEXT_PUBLIC_RIOCUT_TV_URL`.
- Files to clone+adapt from eglive: `next.config.ts`, `tailwind.config.ts`,
  `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`, `components.json`,
  `middleware.ts`, `src/app/layout.tsx`, providers, `Navigation`, `Footer`,
  auth API routes (`/api/auth/*`), `/api/health`.

## 5. Data layer

New module `packages/services/src/iptv.service.ts` (+ `iptv.types.ts`).

**Sources (per approved "both"):**
- iptv-org **API JSON** (`https://iptv-org.github.io/api/*.json`):
  `channels`, `feeds`, `streams`, `logos`, `categories`, `countries`,
  `languages`, `regions`, `blocklist`.
- iptv-org **`.m3u` playlists** (raw, from the CDN) for the country/category
  grouping that the JSON alone doesn't fully express.

**Normalization** — join into a single `TvChannel`:
```
TvChannel {
  id: string            // iptv-org channel id, e.g. "BBCNews.uk"
  name: string
  logo: string | null
  country: { code, name, flag } | null
  categories: string[]  // category ids/names
  languages: string[]
  streams: TvStream[]    // one or more playable urls
  isNsfw: boolean
}
TvStream { url: string; quality?: string; httpReferrer?: string; userAgent?: string }
```

**Filtering at ingest:**
- Drop channels present in `blocklist`.
- Drop channels with zero streams.
- Flag NSFW categories (excluded from default browse; not built into v1 UI
  beyond exclusion).

**Caching / freshness (daily cached + ISR):**
- Wrap fetches in Next `unstable_cache` with `revalidate: 86400` (~24h) and
  tagged keys. One upstream fetch serves all users; iptv-org updates slowly.
- Expose: `getChannels()`, `getChannel(id)`, `getCategories()`,
  `getCountries()`, `getLanguages()`.
- Export from `packages/services/src/index.ts`.

## 6. Stream proxy + player ("proxy only when needed")

**`<TvPlayer>`** (client component, `apps/tv/src/components`):
- Uses `hls.js`; on Safari uses native HLS (`canPlayType`).
- Playback strategy per stream:
  1. Try the **direct** URL.
  2. On error (CORS / mixed-content / network) → retry via
     `/api/stream-proxy?url=<encoded>`.
  3. Still failing → try the channel's **next stream URL**.
  4. All exhausted → "Channel offline" state + "Report broken" action.
- Controls: play/pause, mute/volume, fullscreen, live indicator, loading
  spinner (reuse `@riocut/ui`).

**`/api/stream-proxy` route** (`apps/tv/src/app/api/stream-proxy/route.ts`):
- Fetches the requested `.m3u8`.
- Rewrites segment URLs and nested-playlist URLs (master → variant → segments)
  to route back through the proxy; resolves relative URLs against the upstream
  base; forces `https` where possible.
- Forwards iptv-org-provided `Referer` / `User-Agent` per-stream headers when present.
- **SSRF guard:** only proxy hosts that appear in the ingested stream set
  (allowlist derived from `getChannels()`), never arbitrary user-supplied hosts.
- Streams response back with appropriate `Content-Type`
  (`application/vnd.apple.mpegurl` for playlists, pass-through for segments).

## 7. Pages & routes

- `/` — home: featured categories, popular countries, "by category" rows
  (eglive tile style).
- `/browse` — channel grid + search box + filters (country, category,
  language); paginated via existing pagination component; state in URL params
  (shareable/back-button friendly).
- `/channel/[id]` — `<TvPlayer>` + channel metadata + alternate streams list +
  favorite button.
- `/country/[code]` and `/category/[id]` — pre-filtered grids.
- Auth pages `/login`, `/register` (cloned from eglive).

**Components:** `TvPlayer`, `ChannelCard`, `ChannelGrid`, `FilterBar`,
`SearchBox`, `CategoryTile`, `Navigation`, `Footer`.

**Data access:** React Query hooks (`useChannels`, `useChannel`,
`useCategories`, `useCountries`, `useLanguages`) over thin internal API routes
(or RSC server fetches) that call `iptv.service`.

## 8. Search & filters

- Dataset is small enough to filter client-side after the cached channel list
  loads.
- Search: case-insensitive substring on channel name.
- Filters: country, category, language (multi). Combined (AND across facets).
- All filter/search/page state encoded in URL query params.

## 9. Favorites + recently-watched

IPTV channel ids are **strings**; existing `WatchlistItem`/`ContinueWatching`
use `Int mediaId`, so we add **dedicated models** rather than overload them.

New Prisma models in `packages/db/prisma/schema.prisma`:
```
model TvFavorite {
  id        String   @id @default(cuid())
  userId    String
  channelId String          // iptv-org channel id
  name      String
  logo      String?
  country   String?
  addedAt   DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, channelId])
  @@index([userId])
}

model TvRecent {
  id         String   @id @default(cuid())
  userId     String
  channelId  String
  name       String
  logo       String?
  country    String?
  watchedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, channelId])
  @@index([userId])
}
```
Add `tvFavorites TvFavorite[]` and `tvRecent TvRecent[]` relations to `User`.
Create migration.

New `packages/services/src/iptvFavorites.service.ts` following the
`watchlist.service.ts` pattern: `addFavorite`, `removeFavorite`,
`listFavorites`, `recordRecent`, `listRecent`. Export from services index.

API routes in tv: `/api/tv/favorites` (GET/POST/DELETE),
`/api/tv/recent` (GET/POST). Gated behind `@riocut/auth`; anonymous users can
still browse + watch (favorite/recent UI prompts login).

## 10. Error handling

- iptv-org fetch failure → serve last cached data; if none, friendly empty state.
- Dead stream → automatic fallback chain (§6) then "report broken".
- Proxy upstream error → 502 with JSON error; player advances to next stream.
- Missing logos → placeholder.

## 11. Testing

- `iptv.service` normalization + blocklist filtering: unit tests with fixture JSON/m3u.
- `stream-proxy` URL-rewrite logic: unit tests (master/variant/relative/absolute cases) + SSRF allowlist rejection.
- `iptvFavorites.service`: unit tests against test db / mocked prisma.
- Player fallback logic: component test of the try-direct → proxy → next-stream chain.

## 12. Build order (high level)

1. Scaffold `apps/tv` from eglive (skeleton, auth, layout, nav) on port 3333.
2. `iptv.service` + types + caching; verify normalized data.
3. Browse/home pages with search + filters (no playback yet).
4. `stream-proxy` route + `TvPlayer` with fallback chain.
5. `/channel/[id]` wired to player.
6. DB models + migration + `iptvFavorites.service` + favorites/recent UI.
7. Wire root scripts, turbo env, deploy config.
