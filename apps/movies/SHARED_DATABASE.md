# Shared Database Setup

## Overview

Both `movies` (main app) and `riocut-admin` (blog/admin) **share the same PostgreSQL database** but maintain separate codebases. This document explains how to manage this setup properly.

## Architecture

```
PostgreSQL Database (riocut-database)
├── User (shared across both apps)
├── Watchlist, ContinueWatching, WatchRoom (main app)
├── BlogPost, BlogComment, BlogLike (admin app)
└── VideoProvider (main app, managed by admin)
```

## Important Rules

### ✅ DO:
1. **Keep schemas in sync** - Both projects must have identical `schema.prisma` files
2. **Run migrations from ONE project only** - Choose either main or admin (we recommend main)
3. **Generate Prisma client in BOTH projects** after schema changes
4. **Use the sync script** before making schema changes

### ❌ DON'T:
1. **Never run migrations from both projects** - This causes conflicts
2. **Never modify schema in only one project** - Always sync after changes
3. **Never deploy without generating Prisma client** in both projects

## Workflow

### Making Schema Changes

```bash
# 1. Edit schema in MAIN app
cd movies
nano prisma/schema.prisma

# 2. Sync to admin
./scripts/sync-schema.sh

# 3. Generate Prisma client in BOTH projects
cd movies
npm run db:generate

cd ../riocut-admin
npm run db:generate

# 4. Create and run migration (from MAIN app only)
cd ../movies
npx prisma migrate dev --name your_migration_name

# 5. Commit changes in BOTH repositories
git add prisma/
git commit -m "Update schema: your_migration_name"
```

### Deploying Schema Changes

```bash
# Main app will run migrations automatically via deploy.sh
# Admin app only needs to generate Prisma client

# In riocut-admin:
npm run db:generate
```

## NPM Scripts

Add these to both `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:reset": "prisma migrate reset"
  }
}
```

## Troubleshooting

### Schema Drift Detected

```bash
# Reset and re-apply migrations
cd movies
npx prisma migrate reset
npx prisma migrate deploy

# Regenerate in both projects
npm run db:generate
cd ../riocut-admin && npm run db:generate
```

### Models Not Found

```bash
# Regenerate Prisma client
npm run db:generate
```

### Migration Conflicts

```bash
# Delete conflicting migrations and recreate
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

## Why Shared Database?

**Advantages:**
- ✅ Shared User authentication
- ✅ Single database to manage
- ✅ No data syncing needed
- ✅ Simpler deployment

**Disadvantages:**
- ⚠️ Must keep schemas in sync
- ⚠️ Coupled deployment for schema changes
- ⚠️ Both apps see all tables (not a security issue if both are trusted)

## Video Provider Management

The `VideoProvider` model is:
- **Defined in:** Main app (`movies`)
- **Managed by:** Admin app (`riocut-admin`)
- **Used by:** Main app for playback

This allows admins to add/edit/reorder video sources without touching code.

## CI/CD Considerations

### GitHub Actions (Main App)

```yaml
# .github/workflows/deploy-production.yml
- name: Run Prisma Migrations
  run: npx prisma migrate deploy
```

### GitHub Actions (Admin App)

```yaml
# Only generate, don't migrate!
- name: Generate Prisma Client
  run: npx prisma generate
```

## Emergency Procedures

### If Databases Get Out of Sync

```bash
# 1. Backup database
pg_dump -h your_host -U your_user riocut-database > backup.sql

# 2. Reset migrations in main app
cd movies
npx prisma migrate reset

# 3. Sync schema
./scripts/sync-schema.sh

# 4. Regenerate in both
npm run db:generate
cd ../riocut-admin && npm run db:generate
```

### If You Accidentally Ran Migrations from Both Apps

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Resolve conflicts manually in _prisma_migrations table
# Or reset and re-apply all migrations

# 3. Ensure only one project handles migrations going forward
```

## Best Practices

1. **Always use the sync script** - Don't manually copy schema files
2. **Run migrations from main app** - Keep it consistent
3. **Test locally first** - Never push untested schema changes
4. **Document changes** - Add comments for complex schema updates
5. **Use transactions** - When creating related records across apps

## Quick Reference

```bash
# Sync schemas
./scripts/sync-schema.sh

# Generate clients (both apps)
npm run db:generate

# Run migrations (main app only)
npx prisma migrate dev --name <name>

# Deploy migrations (production)
npx prisma migrate deploy

# View database
npx prisma studio
```

## Contact

If you have questions about the shared database setup, refer to this document or check:
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
