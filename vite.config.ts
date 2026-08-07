import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const root = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@assets': path.resolve(root, 'src/assets'),
      '@components': path.resolve(root, 'src/components'),
      '@pages': path.resolve(root, 'src/pages'),
      '@routes': path.resolve(root, 'src/routes'),
      '@services': path.resolve(root, 'src/services'),
      '@hooks': path.resolve(root, 'src/hooks'),
      '@store': path.resolve(root, 'src/store'),
      '@context': path.resolve(root, 'src/context'),
      '@utils': path.resolve(root, 'src/utils'),
      '@theme': path.resolve(root, 'src/theme'),
      '@types': path.resolve(root, 'src/types'),
      '@mock': path.resolve(root, 'src/mock'),
      '@styles': path.resolve(root, 'src/styles'),
      '@layouts': path.resolve(root, 'src/layouts'),
      '@config': path.resolve(root, 'src/config'),
    },
  },
  server: {
    port: 5173,
  },
});
