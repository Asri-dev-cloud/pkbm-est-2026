#!/bin/bash
# ============================================================
# deploy/update.sh — Script Update Otomatis PKBM Bina Mandiri di VPS
# Jalankan di terminal VPS: bash /var/www/pkbm/deploy/update.sh
# ============================================================

set -e

echo "🚀 [1/4] Mengambil perubahan terbaru dari GitHub..."
cd /var/www/pkbm
git pull origin main

echo "📦 [2/4] Memperbarui dependensi & me-restart Backend..."
cd /var/www/pkbm/backend
npm install --production
pm2 restart pkbm-backend || pm2 start ecosystem.config.cjs --env production

echo "🎨 [3/4] Mengompilasi ulang Frontend (Vite build)..."
cd /var/www/pkbm/frontend
npm install
npm run build

echo "🔄 [4/4] Memuat ulang service Nginx..."
sudo systemctl reload nginx

echo "============================================================"
echo "🎉 Update VPS Berhasil! Versi terbaru sudah aktif."
echo "💡 Tip: Lakukan Hard Refresh di browser (Ctrl + F5) agar cache terbarui."
echo "============================================================"
