import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    lib: {
      entry: 'src/element.tsx',
      name: 'ReleaseHistoryViewerBundle',
      formats: ['iife'],
      fileName: () => 'release-history-viewer.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    minify: 'esbuild',
    target: 'es2019'
  }
});
