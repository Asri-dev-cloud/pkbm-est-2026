// ============================================================
// src/main.jsx — Entry Point Utama Aplikasi React
// ============================================================
// File ini adalah titik masuk pertama yang dipanggil oleh Vite.
// Tugasnya: merender komponen <App /> ke dalam <div id="root">
// yang ada di index.html.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';

// BrowserRouter: menyediakan konteks routing berbasis URL browser
// (menggunakan History API, bukan hash #)
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';

// Import CSS global — styling dasar untuk seluruh aplikasi
import './index.css';

// Ambil elemen <div id="root"> dari index.html sebagai target render
const rootElement = document.getElementById('root');

// Pembersihan otomatis cache browser lama dan service worker yang tertinggal
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    }).catch(() => {});
  }

  // ── Penanganan Otomatis Gagal Load Chunk / Versi Baru (Anti Halaman Macet) ──
  // Menangani event preload error dari Vite saat navigasi client-side
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('[Vite] Preload chunk error terdeteksi, memuat ulang halaman untuk mengambil versi aset terbaru...');
    window.location.reload();
  });

  // Tangkap error dynamic module failure secara global
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('ChunkLoadError')
    ) {
      console.warn('[App] Gagal memuat chunk modul dinamis, memuat ulang halaman...');
      const key = 'pkbm_global_chunk_reload';
      const last = Number(sessionStorage.getItem(key) || 0);
      const now = Date.now();
      if (now - last > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    }
  });
}

// Buat root React dan render aplikasi
// React.StrictMode: mengaktifkan peringatan tambahan saat development
// BrowserRouter: membungkus App agar semua komponen bisa pakai useNavigate, Link, dll.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
