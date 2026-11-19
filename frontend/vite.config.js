import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Penting agar asset dipanggil dengan path root yang benar saat build
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('exceljs')) return 'exceljs';
          if (id.includes('react') || id.includes('scheduler')) return 'react-core';
          if (id.includes('axios')) return 'axios';
          return 'vendor';
        },
      },
    },
  },

  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 400,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'https://pkbmbinamandiri.sch.id',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_PROXY_TARGET || 'https://pkbmbinamandiri.sch.id',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
