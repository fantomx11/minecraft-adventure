import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'src', // Treats src/ as the root so editor.html is at the root level
  plugins: [preact(), viteSingleFile()],
  build: {
    outDir: '../dist',   // Places output into the project's main dist/ folder
    emptyOutDir: false, // Prevents deleting dist/index.html
    rollupOptions: {
      input: resolve(rootDir, 'src/editor.html'),
    },
  },
});