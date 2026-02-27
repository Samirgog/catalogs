import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
  },
  base: '/catalogs/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/jspdf/') || id.includes('/qrcode/')) {
            return 'vendor-qr-pdf';
          }

          if (id.includes('/@lottiefiles/dotlottie-react/')) {
            return 'vendor-lottie';
          }

          return undefined;
        },
      },
    },
  }
});
