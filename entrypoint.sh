#!/bin/sh
echo "Pushing database schema..."
cd /prisma-cli
./node_modules/.bin/prisma db push --accept-data-loss 2>&1 || echo "Migration warning (may be OK if tables already exist)"
cd /app
echo "Starting server..."
exec node server.js
