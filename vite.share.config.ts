import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

const root = import.meta.dirname;

// Dedicated build config for producing one self-contained, shareable index.html
// (all JS/CSS inlined, relative asset paths) that opens directly via file:// with
// no server. Not used by `npm run dev` or the normal `npm run build`.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
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
  build: {
    outDir: 'dist-share',
    cssCodeSplit: false,
  },
});
