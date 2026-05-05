#!/usr/bin/env bash
set -euo pipefail

echo "==> Build du frontend (ryzer-site)..."
pnpm --filter @workspace/ryzer-site run build

echo "==> Build de l'API (api-server)..."
pnpm --filter @workspace/api-server run build

echo "==> Copie des artefacts dans dist/..."
rm -rf dist
mkdir -p dist/api dist/frontend
cp -r artifacts/api-server/dist/. dist/api/
cp -r artifacts/ryzer-site/dist/. dist/frontend/

echo "==> Build de l'image Docker ARM64..."
docker build --platform linux/arm64 -t ryzer:latest .

echo "==> Image prête : ryzer:latest"
