#!/bin/sh
echo "Running database migrations..."
cd /prisma-cli
./node_modules/.bin/prisma migrate deploy 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Database migration failed. Refusing to start with inconsistent schema."
  exit 1
fi
cd /app
echo "Starting server..."
exec node server.js
