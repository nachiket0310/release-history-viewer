import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Library mode skips app-mode's automatic process.env.NODE_ENV replacement,
  // so React/antd's runtime checks leak a bare `process` reference into the
  // browser bundle unless it's statically defined here.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}'
  },
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
