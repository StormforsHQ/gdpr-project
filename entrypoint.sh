#!/bin/sh
echo "Running database migrations..."
cd /prisma-cli

# Baseline: if _prisma_migrations table doesn't exist yet (first deploy after
# switching from db push), mark the initial migration as already applied.
./node_modules/.bin/prisma migrate resolve --applied 20260428000000_initial 2>/dev/null

./node_modules/.bin/prisma migrate deploy 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Database migration failed. Refusing to start with inconsistent schema."
  exit 1
fi
cd /app
echo "Starting server..."
exec node server.js
