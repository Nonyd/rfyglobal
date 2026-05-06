#!/bin/bash
set -e

echo "🚀 Deploying Room For You to Webuzo..."

git pull origin main

npm ci --production=false

npx prisma generate

npx prisma migrate deploy

npm run build

pm2 reload ecosystem.config.js --update-env

echo "✅ Deployment complete — rfyglobal.org"
