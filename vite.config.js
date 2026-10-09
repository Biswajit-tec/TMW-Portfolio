/**
 * vite.config.js — Tubelight Media Works
 *
 * Configures:
 *   - Multi-page application rollup inputs (index, films, brands, sports)
 *   - Clean URL rewrite middleware for dev & preview servers
 */

import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware plugin: serves /films → /films.html, /brands → /brands.html, etc.
function domainPageMiddleware() {
  return {
    name: 'tmw-domain-page-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        _rewrite(req, res, next, server.config.root);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        _rewrite(req, res, next, process.cwd());
      });
    },
  };
}

function _rewrite(req, res, next, rootDir) {
  const slugs = ['films', 'brands', 'sports'];
  const url = req.url.split('?')[0]; // strip query string
  for (const slug of slugs) {
    if (url === `/${slug}` || url === `/${slug}/`) {
      const rootHtml = path.join(rootDir, `${slug}.html`);
      const publicHtml = path.join(rootDir, 'public', `${slug}.html`);
      const targetPath = fs.existsSync(rootHtml) ? rootHtml : publicHtml;
      
      if (fs.existsSync(targetPath)) {
        req.url = `/${slug}.html`;
        return next();
      }
    }
  }
  next();
}

export default defineConfig({
  plugins: [domainPageMiddleware()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        films: path.resolve(__dirname, 'films.html'),
        brands: path.resolve(__dirname, 'brands.html'),
        sports: path.resolve(__dirname, 'sports.html'),
      },
    },
  },
});
