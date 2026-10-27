#!/usr/bin/env bash
# ===================================================================
#   Riocut monorepo deploy — movies + sports + tv on shared Postgres.
#   Pulls fresh images, runs prisma migrate, brings up all apps,
#   smoke-tests /api/health. Postgres volume is preserved.
# ===================================================================
set -Eeuo pipefail

cd ~/riocut

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
APPS=(movies sports tv blog admin)

log()  { echo -e "\n${GREEN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
fail() { echo -e "${RED}✗ $*${NC}"; exit 1; }

trap 'echo -e "\n${RED}✗ deploy failed — dumping logs${NC}"; docker compose logs --tail=40 "${APPS[@]}" 2>/dev/null || true' ERR

# ---------- load .env ----------------------------------------------
[[ -f .env ]] || fail ".env not found in $(pwd)"
set -a; source .env; set +a
log "Loaded .env"

# Only redeploy the apps that actually changed this run. The CI workflow
# writes DEPLOY_APPS (space-separated) into .env; if absent, deploy all.
# Unlisted apps keep their running container + image untouched.
if [[ -n "${DEPLOY_APPS:-}" ]]; then
    read -r -a APPS <<< "$DEPLOY_APPS"
fi
log "Deploying apps: ${APPS[*]}"
echo "  movies  → ${RIOCUT_IMAGE_NAME:-<unset>}"
echo "  sports → ${RIOCUT_SPORTS_IMAGE_NAME:-<unset>}"
echo "  tv    → ${RIOCUT_TV_IMAGE_NAME:-<unset>}"
echo "  blog  → ${RIOCUT_BLOG_IMAGE_NAME:-<unset>}"
echo "  admin → ${RIOCUT_ADMIN_IMAGE_NAME:-<unset>}"

# ---------- disk hygiene -------------------------------------------
# Free space BEFORE pulling so registry pull doesn't run out of disk.
# Old app containers keep serving during pull (near-zero-downtime).
# `docker image prune -af` only reaps images with NO running container,
# so the in-use images stay. Volumes (postgres data) never touched.
log "Disk hygiene (volumes preserved, apps still serving)"
df -h / | awk 'NR==2 {printf "  before: %s used of %s (%s)\n", $3, $2, $5}'
docker image prune -af     >/dev/null 2>&1 || true
docker container prune -f  >/dev/null 2>&1 || true
docker network prune -f    >/dev/null 2>&1 || true
docker builder prune -af   >/dev/null 2>&1 || true
docker buildx prune -af    >/dev/null 2>&1 || true
command -v journalctl >/dev/null && journalctl --vacuum-size=200M >/dev/null 2>&1 || true
df -h / | awk 'NR==2 {printf "  after:  %s used of %s (%s)\n", $3, $2, $5}'

# ---------- registry login -----------------------------------------
if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
    log "Logging into ${REGISTRY:-ghcr.io}"
    echo "$REGISTRY_TOKEN" \
        | docker login "${REGISTRY:-ghcr.io}" -u "${DEPLOY_USER:-deploy}" --password-stdin >/dev/null \
        || warn "docker login failed — falling back to cached creds"
else
    warn "REGISTRY_TOKEN unset — falling back to cached creds"
fi

# ---------- postgres ready -----------------------------------------
log "Starting postgres"
docker compose up -d postgres

echo -n "  waiting for postgres "
pg_ready=0
for _ in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        pg_ready=1; break
    fi
    echo -n .
    sleep 2
done
if [[ $pg_ready -eq 1 ]]; then
    echo -e " ${GREEN}ready${NC}"
else
    echo
    docker compose logs --tail=60 postgres || true
    fail "postgres did not become healthy in 120s"
fi

ensure_image() {
    local app=$1
    if [[ "${BUILD_LOCAL:-}" == "true" ]]; then
        log "Building image locally for ${app}"
        docker compose build "$app" && return 0
    fi
    for i in 1 2 3 4 5; do
        if docker compose pull "$app" 2>/dev/null; then
            return 0
        fi
        warn "pull ${app} failed (${i}/5) — retry in 5s"
        sleep 5
    done
    log "Pull failed or non-existent — building ${app} locally on host architecture"
    docker compose build "$app" && return 0
    fail "could not pull or build image for ${app}"
}

# ---------- prisma migrate (shared schema) -------------------------
# Use the *current* movies image (pre-deploy) as runner. Pin prisma@6
# (Prisma 7 dropped env() syntax). Migration runs once against shared DB
# before we start replacing app containers — same behaviour for all apps.
# Runner = first app being deployed; every app image bundles packages/db, and
# its :VERSION image is guaranteed to exist (it was just built). Schema changes
# live in packages/db (shared) which rebuilds all apps, so migrations are always
# present in the runner. When only an app changed, there is nothing to migrate.
log "Running prisma migrate deploy (runner: ${APPS[0]})"
ensure_image "${APPS[0]}"
docker compose run --rm --remove-orphans "${APPS[0]}" sh -c \
    'cd packages/db && npx --yes prisma@6.17.1 migrate deploy --schema=./prisma/schema.prisma' \
    || warn "prisma migrate failed — continuing (manual fix may be needed)"

# ---------- rolling per-app: stop → rm → prune → pull → up ---------
# 24GB VPS can't fit 5 × ~2GB images × 2 versions during a global pull,
# so we do it one app at a time. Stopping the old container first frees
# the old image for pruning, which makes room for the new pull. Per-app
# blip ~30-60s (pull + start); other 4 apps keep serving meanwhile.

log "Rolling per-app replace (frees old image before updating new)"
for app in "${APPS[@]}"; do
    echo "  → ${app}"
    docker compose stop "$app" 2>/dev/null || true
    docker compose rm -f "$app" 2>/dev/null || true
    # Prune now: previous image of THIS app has no container → reclaimable.
    docker image prune -af >/dev/null 2>&1 || true
    ensure_image "$app"
    docker compose up -d --wait --remove-orphans "$app"
done

# ---------- health checks ------------------------------------------
log "Health checks"
check_health() {
    local port=$1 name=$2
    echo -n "  ${name} :${port}/api/health "
    if timeout 60 bash -c "until curl -sf http://localhost:${port}/api/health >/dev/null; do sleep 2; done"; then
        echo -e "${GREEN}✓${NC}"
    else
        fail "${name} health check failed on :${port}"
    fi
}
# Only health-check the apps we (re)deployed; the others were never touched.
declare -A APP_PORT=(
    [movies]="${RIOCUT_PORT:-8000}"
    [sports]="${RIOCUT_SPORTS_PORT:-5555}"
    [tv]="${RIOCUT_TV_PORT:-3333}"
    [blog]="${RIOCUT_BLOG_PORT:-4444}"
    [admin]="${RIOCUT_ADMIN_PORT:-5566}"
)
for app in "${APPS[@]}"; do
    check_health "${APP_PORT[$app]}" "$app"
done

log "Deploy complete"
