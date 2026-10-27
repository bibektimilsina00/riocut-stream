# Production-Only Dockerfile - Minimal & Lightweight
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies - Production only
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile

# Dependencies - All (including dev for building)
FROM base AS deps-dev
COPY package*.json ./
RUN npm ci --frozen-lockfile


# Builder
FROM base AS builder

# Accept build arguments
ARG NODE_ENV=production
ARG VERSION
ARG COMMIT_SHA
ARG TMDB_API_KEY
ARG NEXT_PUBLIC_TMDB_API_KEY
ARG NEXT_PUBLIC_TMDB_BASE_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BLOG_SITE_URL
ARG NEXT_PUBLIC_TURN_SERVER
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_BUILD_VERSION
ARG NEXT_PUBLIC_GIT_SHA
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1
ENV TMDB_API_KEY=$TMDB_API_KEY
ENV NEXT_PUBLIC_TMDB_API_KEY=$NEXT_PUBLIC_TMDB_API_KEY
ENV NEXT_PUBLIC_TMDB_BASE_URL=$NEXT_PUBLIC_TMDB_BASE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BLOG_SITE_URL=$NEXT_PUBLIC_BLOG_SITE_URL
ENV NEXT_PUBLIC_TURN_SERVER=$NEXT_PUBLIC_TURN_SERVER
ENV NEXT_PUBLIC_TURN_USERNAME=$NEXT_PUBLIC_TURN_USERNAME
ENV NEXT_PUBLIC_BUILD_VERSION=$NEXT_PUBLIC_BUILD_VERSION
ENV NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=$NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

COPY package*.json ./
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
# Generate Prisma client before building
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build (includes required node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://127.0.0.1:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]

