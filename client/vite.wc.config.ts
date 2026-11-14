import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  publicDir: false,
  build: {
    outDir: 'public',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/web-component/register.ts'),
      name: 'AccessibleGateway',
      formats: ['iife'],
      fileName: () => 'accessible-gateway.js',
    },
    rollupOptions: {
      // Bundle React inside the Web Component so host pages do NOT need React installed
      external: [],
    },
  },
});
