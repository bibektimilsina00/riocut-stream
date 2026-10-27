#!/bin/bash

# Schema Sync Script
# This script keeps all app schemas in sync since they share the same database
# Apps: movies (main), riocut-admin (admin), worker (background jobs)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_SCHEMA="$SCRIPT_DIR/../prisma/schema.prisma"
ADMIN_SCHEMA="$SCRIPT_DIR/../../riocut-admin/prisma/schema.prisma"
WORKER_SCHEMA="$SCRIPT_DIR/../../riocut-admin/worker/prisma/schema.prisma"

echo "🔄 Syncing Prisma schemas across all apps..."

# Check if main schema exists
if [ ! -f "$MAIN_SCHEMA" ]; then
    echo "❌ Main schema not found at $MAIN_SCHEMA"
    exit 1
fi

# Copy main schema to admin
echo "   📋 Syncing to admin app..."
cp "$MAIN_SCHEMA" "$ADMIN_SCHEMA"

# Copy main schema to worker
echo "   📋 Syncing to worker..."
cp "$MAIN_SCHEMA" "$WORKER_SCHEMA"

echo ""
echo "✅ Schemas synced successfully across all 3 apps!"
echo ""
echo "📝 Next steps:"
echo "   1. Generate Prisma client in ALL 3 projects:"
echo "      cd movies && npm run db:generate"
echo "      cd riocut-admin && npm run db:generate"
echo "      cd riocut-admin/worker && npm run db:generate"
echo ""
echo "   2. Run migrations from ONE project only (main app):"
echo "      cd movies && npx prisma migrate dev --name <migration_name>"
echo ""

