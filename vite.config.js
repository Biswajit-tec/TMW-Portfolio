/**
 * vite.config.js — Tubelight Media Works
 *
 * Minimal configuration:
 *   - Custom dev/preview middleware maps clean slugs → .html pages
 *     so /films, /brands, /sports work without the .html suffix.
 *   - No framework, no router library — pure Vite.
 *
 * Production note:
 *   The HTML files in public/ are copied to dist/ by the Vite build.
 *   To serve clean URLs in production, configure your hosting platform:
 *     Netlify: add a _redirects file in public/
 *     Vercel:  add a vercel.json with rewrites
 *     Nginx:   use try_files with rewrite rules
 *   For now, links also fall back to the .html extension if clean URLs
 *   are not configured on the hosting server.
 */

import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

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
      const htmlPath = path.join(rootDir, 'public', `${slug}.html`);
      if (fs.existsSync(htmlPath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(htmlPath, 'utf-8'));
        return;
      }
    }
  }
  next();
}

export default defineConfig({
  plugins: [domainPageMiddleware()],
});
