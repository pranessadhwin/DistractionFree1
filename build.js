import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

async function runBuild() {
  console.log('--- Starting Chrome Extension Multi-Target Build ---');

  // 1. Build Popup and Dashboard HTML pages
  console.log('1. Building Popup & Dashboard HTML apps...');
  await build({
    configFile: false,
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve('popup.html'),
          dashboard: resolve('dashboard.html')
        }
      }
    }
  });

  // 2. Build Background Service Worker (ES module)
  console.log('2. Building Background Service Worker (ESM)...');
  await build({
    configFile: false,
    plugins: [],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve('src/background/index.ts'),
        name: 'ServiceWorker',
        formats: ['es'],
        fileName: () => 'service-worker.js'
      }
    }
  });

  // 3. Build Standalone Content Script (IIFE - No ES imports, completely standalone)
  console.log('3. Building Standalone Content Script (IIFE)...');
  await build({
    configFile: false,
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve('src/content/index.tsx'),
        name: 'PastSelfContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    }
  });

  // 4. Copy manifest.json & icon.svg to dist/
  console.log('4. Copying manifest.json and icon.svg...');
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  if (fs.existsSync('public/icon.svg')) {
    fs.copyFileSync('public/icon.svg', 'dist/icon.svg');
  }

  console.log('✓ Extension build completed successfully into dist/ folder!');
}

runBuild().catch((err) => {
  console.error('Build error:', err);
  process.exit(1);
});
