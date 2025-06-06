// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Wichtig für den Build-Vorgang: Sorgt dafür, dass Pfade in der HTML korrekt sind
  base: '/', 

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false, // Auf 'true' setzen, wenn Ihr Backend HTTPS verwendet
      },
      // Falls WebSockets benötigt werden:
      // '/socket.io': { // Beispielpfad, anpassen falls nötig
      //   target: 'ws://localhost:3000',
      //   ws: true,
      // },
    },
    port: 5173, 
    host: true, 
  },

  build: {
    outDir: 'dist', 
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },  
});