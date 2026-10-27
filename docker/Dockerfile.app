# Monorepo-aware multi-stage Dockerfile.
#
# Build a specific app from the monorepo:
#   docker build --build-arg APP_NAME=movies  -f docker/Dockerfile.app -t riocut-movies:latest  .
#   docker build --build-arg APP_NAME=sports -f docker/Dockerfile.app -t riocut-sports:latest .
#   docker build --build-arg APP_NAME=tv    -f docker/Dockerfile.app -t riocut-tv:latest    .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---------- Pruner ----------
FROM base AS pruner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
COPY . .
RUN pnpm dlx turbo@2 prune --scope=${APP_NAME} --docker

# ---------- Deps ----------
FROM base AS deps
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---------- Builder ----------
FROM base AS builder
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TMDB_API_KEY
ARG NEXT_PUBLIC_BLOG_SITE_URL
ARG NEXT_PUBLIC_RIOCUT_URL
ARG NEXT_PUBLIC_RIOCUT_SPORTS_URL
ARG NEXT_PUBLIC_RIOCUT_TV_URL
ARG NEXT_PUBLIC_TURN_SERVER
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_BUILD_VERSION
ARG NEXT_PUBLIC_BUILD_DATE
ARG NEXT_PUBLIC_GIT_SHA
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_TMDB_API_KEY=${NEXT_PUBLIC_TMDB_API_KEY}
ENV NEXT_PUBLIC_BLOG_SITE_URL=${NEXT_PUBLIC_BLOG_SITE_URL}
ENV NEXT_PUBLIC_RIOCUT_URL=${NEXT_PUBLIC_RIOCUT_URL}
ENV NEXT_PUBLIC_RIOCUT_SPORTS_URL=${NEXT_PUBLIC_RIOCUT_SPORTS_URL}
ENV NEXT_PUBLIC_RIOCUT_TV_URL=${NEXT_PUBLIC_RIOCUT_TV_URL}
ENV NEXT_PUBLIC_TURN_SERVER=${NEXT_PUBLIC_TURN_SERVER}
ENV NEXT_PUBLIC_TURN_USERNAME=${NEXT_PUBLIC_TURN_USERNAME}
ENV NEXT_PUBLIC_BUILD_VERSION=${NEXT_PUBLIC_BUILD_VERSION}
ENV NEXT_PUBLIC_BUILD_DATE=${NEXT_PUBLIC_BUILD_DATE}
ENV NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}

# Bring in installed workspace then overlay the full source.
COPY --from=deps /repo/ ./
COPY --from=pruner /repo/out/full/ ./

RUN pnpm --filter @riocut/db db:generate
RUN pnpm --filter ${APP_NAME} build

# Materialise a self-contained production node_modules tree using `pnpm deploy`.
# Walks the workspace graph, resolves every transitive dep, emits a flat
# (symlink-free) directory. Canonical fix for the "standalone trace missed
# styled-jsx / next / etc" pnpm symlink trap.
RUN pnpm --filter ${APP_NAME} --prod deploy /deploy

# Overlay the built Next output + public + prisma into the deploy tree.
RUN cp -r apps/${APP_NAME}/.next /deploy/.next \
 && (cp -r apps/${APP_NAME}/public /deploy/public || true) \
 && cp apps/${APP_NAME}/package.json /deploy/package.json \
 && mkdir -p /deploy/packages/db \
 && cp -r packages/db/prisma /deploy/packages/db/prisma \
 && cp packages/db/package.json /deploy/packages/db/package.json

# Generate the Prisma client INSIDE /deploy. `pnpm deploy --prod` copies the
# @prisma/client package but not the generated `.prisma/client` engine output
# that PrismaClient s constructor needs at boot. Re-run prisma generate.
RUN cd /deploy && npx --yes prisma@6.17.1 generate --schema=./packages/db/prisma/schema.prisma

# ---------- Runner ----------
FROM base AS runner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Self-contained deploy tree (app + flat prod node_modules + prisma) from builder.
COPY --from=builder --chown=nextjs:nodejs /deploy ./

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1));"

# Run next directly from the deployed node_modules — no standalone tracer
# in the loop, no missing transitive dep surprises.
CMD ["sh", "-c", "node_modules/.bin/next start -p 3000 -H 0.0.0.0"]
