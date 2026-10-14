import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  // GitHub Pages serves the game from /tximtxom/; set VITE_BASE for that build.
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
    // Only used in server mode (VITE_SERVER_URL=/): forward Socket.IO to the Node server.
    proxy: { '/socket.io': { target: 'http://localhost:3001', ws: true } },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
