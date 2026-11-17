#!/bin/bash
# ============================================================
# update.sh — Script Update Otomatis di VPS Hostinger
# Menarik kode terbaru, rebuild frontend, dan restart backend
# ============================================================

set -e

echo "🚀 [1/4] Menarik kode terbaru dari GitHub..."
git pull origin main

echo "📦 [2/4] Update Backend & Restart PM2..."
cd backend
npm install --production
pm2 restart pkbm-backend || pm2 start ecosystem.config.cjs --env production
cd ..

echo "🎨 [3/4] Build Frontend React..."
cd frontend
npm install
npm run build
cd ..

echo "🔄 [4/4] Reload Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ SUKSES! Web PKBM Bina Mandiri berhasil diperbarui ke versi terbaru."
echo "Status PM2:"
pm2 status

