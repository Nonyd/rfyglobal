#!/bin/bash
set -e

echo "⚙️  First-time setup for Room For You on Webuzo..."

npm ci

npx prisma generate

npx prisma migrate deploy

npm run build

mkdir -p logs

pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Setup complete. App running on port 3000."
echo "Configure Nginx/Apache on Webuzo to proxy rfyglobal.org → localhost:3000"
