#!/bin/sh
# scripts/start.sh — EduFund Portal production startup for Railway

set -e

echo ""
echo "================================================"
echo "  EduFund Portal — Starting"
echo "================================================"
echo "  PORT     : ${PORT:-3000}"
echo "  NODE_ENV : ${NODE_ENV:-production}"
echo ""

# ── Database migrations (skip gracefully if DB not ready) ──
if [ -z "$DATABASE_URL" ]; then
  echo "[!] DATABASE_URL not set — skipping migrations"
  echo "    Set DATABASE_URL in Railway environment variables"
else
  echo "[1/2] Running database migrations..."
  if npx prisma migrate deploy 2>&1; then
    echo "      ✓ Migrations complete"

    # Auto-seed on first deploy (if users table is empty)
    USER_COUNT=$(node -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      p.user.count()
        .then(c => { console.log(c); p.\$disconnect(); })
        .catch(() => { console.log('0'); });
    " 2>/dev/null || echo "0")

    if [ "$USER_COUNT" = "0" ]; then
      echo "      Seeding initial data..."
      node_modules/.bin/tsx prisma/seed.ts 2>&1 || echo "      [!] Seed skipped (non-fatal)"
    else
      echo "      ✓ Database has $USER_COUNT users — skipping seed"
    fi
  else
    echo "      [!] Migration failed — starting anyway"
  fi
fi

# ── Start Next.js server ───────────────────────────────────
echo "[2/2] Starting Next.js on port ${PORT:-3000}..."
exec node server.js
