// Production HTTP server for Railpack / Node.js deployment
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const COMPRESSIBLE = new Set([
  'text/html; charset=utf-8',
  'application/javascript; charset=utf-8',
  'text/css; charset=utf-8',
  'application/json; charset=utf-8',
  'application/xml; charset=utf-8',
  'text/plain; charset=utf-8',
  'application/manifest+json; charset=utf-8',
  'image/svg+xml',
]);

function getCacheHeader(urlPath) {
  if (urlPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  if (urlPath === '/sw.js' || urlPath === '/index.html' || urlPath === '/') {
    return 'no-store, no-cache, must-revalidate';
  }
  if (urlPath.startsWith('/data/chapters/')) {
    return 'public, max-age=604800, stale-while-revalidate=86400';
  }
  if (urlPath.endsWith('.webmanifest')) {
    return 'public, max-age=604800';
  }
  if (/\.(jpg|jpeg|png|webp|svg|ico|woff|woff2)$/.test(urlPath)) {
    return 'public, max-age=2592000';
  }
  if (/\.(xml|xsl|txt)$/.test(urlPath)) {
    return 'public, max-age=86400, no-transform';
  }
  return 'public, max-age=3600';
}

function resolveFilePath(reqPath) {
  // Decode URL and remove query strings
  let cleanPath = decodeURIComponent(reqPath.split('?')[0]);
  
  // Normalize path and prevent directory traversal
  let safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath.startsWith('/') || safePath.startsWith('\\')) {
    safePath = safePath.slice(1);
  }

  const directPath = path.join(DIST_DIR, safePath);

  // 1. Direct file check
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return { filePath: directPath, status: 200 };
  }

  // 2. Directory index.html check (prerendered SSG routes: /chapter/1 -> /chapter/1/index.html)
  const indexPath = path.join(directPath, 'index.html');
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    return { filePath: indexPath, status: 200 };
  }

  // 3. Root index.html check
  if (cleanPath === '' || cleanPath === '/') {
    const rootIndex = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) return { filePath: rootIndex, status: 200 };
  }

  // 4. Missing chapter data is a strict 404 (not HTML)
  if (cleanPath.startsWith('/data/')) {
    return { filePath: null, status: 404 };
  }

  // 5. 404 fallback page
  const notFoundPath = path.join(DIST_DIR, '404.html');
  if (fs.existsSync(notFoundPath)) {
    return { filePath: notFoundPath, status: 404 };
  }

  return { filePath: null, status: 404 };
}

const server = http.createServer((req, res) => {
  // Non-WWW to WWW 301 Redirect (checks both host and reverse-proxy x-forwarded-host)
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const host = rawHost.split(',')[0].trim().split(':')[0].toLowerCase();
  if (host === 'haikyuu.org') {
    res.writeHead(301, {
      Location: `https://www.haikyuu.org${req.url}`,
    });
    res.end();
    return;
  }

  const { filePath, status } = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheControl = getCacheHeader(req.url);

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = COMPRESSIBLE.has(contentType) && acceptEncoding.includes('gzip');

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer-when-downgrade',
  };

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(status, headers);
    const raw = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    raw.pipe(gzip).pipe(res);
  } else {
    const stat = fs.statSync(filePath);
    headers['Content-Length'] = stat.size;
    res.writeHead(status, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Railpack Server] Haikyu!! Manga running at http://${HOST}:${PORT}`);
  console.log(`[Railpack Server] Serving static files from ${DIST_DIR}`);
});
