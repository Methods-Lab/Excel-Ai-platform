import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'chrome120',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'chrome120',
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
      '@excellence/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types/src/index.ts'
      ),
    },
  },
});
