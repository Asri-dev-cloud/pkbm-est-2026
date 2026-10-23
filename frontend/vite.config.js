import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Penting agar asset dipanggil dengan path root yang benar saat build
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('axios')) return 'axios';
          if (id.includes('react')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },

  server: {
    port: 5173,
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
