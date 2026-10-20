import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(process.cwd(), 'app.html'),
    },
  },
  plugins: [
    react(),
    {
      name: 'emit-docs-index',
      closeBundle() {
        const builtApp = path.resolve(process.cwd(), 'docs/app.html');
        const targetIndex = path.resolve(process.cwd(), 'docs/index.html');
        if (fs.existsSync(builtApp)) {
          fs.renameSync(builtApp, targetIndex);
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
