import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';

// The game version comes from the root package.json (see CHANGELOG.md).
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

// version.json, fetched past the cache by the check at the top of index.html:
// a page older than the deployed game reloads itself before it starts.
const versionFile: Plugin = {
  name: 'tximtxom-version',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%APP_VERSION%', version) },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version }) });
  },
};

export default defineConfig({
  plugins: [preact(), versionFile],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // GitHub Pages serves the game from /tximtxom/; set VITE_BASE for that build.
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
    // Only used in server mode (VITE_SERVER_URL=/): forward Socket.IO to the Node server.
    proxy: { '/socket.io': { target: 'http://localhost:3001', ws: true } },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
