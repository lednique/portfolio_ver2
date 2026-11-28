import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'rewrite-root-to-app-html',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/app.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
      output: {
        // Split the heavy third-party libs out of the entry chunk so the landing
        // page does not pay for the admin bundle / physics / lottie up front.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils')
          ) {
            return 'vendor-motion';
          }
          if (id.includes('matter-js')) return 'vendor-matter';
          if (id.includes('dotlottie')) return 'vendor-lottie';
          return undefined;
        },
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/app-[hash][extname]',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
