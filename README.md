# movies + sports monorepo

Two Next.js 15 streaming apps sharing a common Postgres, NextAuth, shadcn UI library, and a socket.io watch-together engine.

- **apps/movies** — movies + TV via TMDB.
- **apps/sports** — live sports via sportsrc.org (`https://api.sportsrc.org/`).

## Layout

```
apps/
  movies/              # movies + TV streaming (port 8000)
  sports/              # live sports streaming (port 8001)
packages/
  config/              # tsconfig, tailwind preset, eslint shareables
  db/                  # Prisma schema + client (single source of truth)
  auth/                # NextAuth v5 factory (shared across apps)
  ui/                  # shadcn primitives + chrome components
  services/            # Prisma-backed services (watchlist, rooms, notifications)
  realtime/            # socket.io server + watch-together hooks
docker/
  Dockerfile.app       # monorepo-aware multi-stage, takes ARG APP_NAME
docker-compose.yml     # postgres + movies + sports
deploy.sh              # loops over both apps
turbo.json             # build/dev/lint/db pipelines
pnpm-workspace.yaml
```

## Quick start (local dev)

```bash
pnpm install
pnpm db:generate
# optional: bring up postgres in docker
# docker compose up -d postgres
pnpm db:migrate            # applies all migrations incl. 20260613 sports

pnpm dev:movies            # http://localhost:8000
pnpm dev:sports            # http://localhost:8001
```

Both apps read `.env` from their own `apps/<name>/.env`. Copy `.env.example` and fill in DB + auth + (movies only) TMDB.

## Workspace scripts

| Script               | Action                                                |
|----------------------|-------------------------------------------------------|
| `pnpm dev`           | turbo runs `dev` across all apps                      |
| `pnpm dev:movies`    | movies dev only (port 8000)                           |
| `pnpm dev:sports`    | sports dev only (port 8001)                           |
| `pnpm build`         | turbo builds all apps with caching                    |
| `pnpm lint`          | eslint across the workspace                           |
| `pnpm type-check`    | tsc --noEmit per package                              |
| `pnpm db:generate`   | regen Prisma client                                   |
| `pnpm db:migrate`    | run dev migrations                                    |
| `pnpm db:migrate:deploy` | apply migrations (prod)                            |
| `pnpm db:studio`     | open Prisma Studio                                    |
| `pnpm clean`         | nuke build artifacts + node_modules                   |

## Docker

```bash
docker build --build-arg APP_NAME=movies -f docker/Dockerfile.app -t riocut-movies:latest .
docker build --build-arg APP_NAME=sports -f docker/Dockerfile.app -t riocut-sports:latest .

docker compose up -d   # postgres + movies + sports
```

## Sportsrc API (sports)

| Endpoint                                                  | Purpose            |
|-----------------------------------------------------------|--------------------|
| `GET /?data=sports`                                       | All sports         |
| `GET /?data=matches&category={cat}`                       | Match list         |
| `GET /?data=detail&category={cat}&id={id}`                | Match + embed      |
| `GET /?data=results&category={leagues\|tables\|scores}&league={code}` | Standings/scores |

Free tier: 20 rps. No API key. Eglive's client (`apps/sports/src/lib/sportsrc.ts`) ships a token bucket to stay under the limit and a React Query layer (`apps/sports/src/lib/hooks/useSports.ts`).
