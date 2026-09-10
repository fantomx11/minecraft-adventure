import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'src',
  plugins: [preact(), viteSingleFile()],
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(rootDir, 'src/world-editor.html'),
    },
  },
});