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
    port: 3000,
  },
  build: {
    outDir: '../nudgeme-server/static/build',
    sourcemap: false,  // prod
  },
  base: '/',
  server: {
    port: 3000,
  },
});

