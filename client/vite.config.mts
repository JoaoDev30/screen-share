import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: necessario para o Electron carregar via file:// no build.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      /*
       * O watcher precisa ignorar a saída do empacotador. Ele vasculha os
       * ~200 MB do Electron recém-extraídos e segura handles neles, e aí o
       * electron-builder falha com EPERM ao renomear a pasta temporária.
       */
      ignored: ['**/release/**', '**/build-out/**', '**/dist-electron/**'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
