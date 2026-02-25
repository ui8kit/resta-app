import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3022,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@ui8kit/core': path.resolve(process.cwd(), '../dsl/src/components/index.ts'),
    },
  },
});
