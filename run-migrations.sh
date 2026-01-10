#!/bin/bash
set -e

# Run migrations inside Azure container
echo "🔄 Running Prisma migrations..."
az container exec --resource-group rental-room-rg \
  --name rental-room-api \
  --exec-command "bash -c 'cd /app && npx prisma migrate deploy'"

echo "✅ Migrations completed!"
