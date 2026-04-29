const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdnjs.cloudflare.com",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob: https:"
].join('; ');

function withCharset(type) {
  if (/^(text\/|application\/(javascript|json))/.test(type)) {
    return `${type}; charset=utf-8`;
  }
  return type;
}

function buildSecurityHeaders(contentType) {
  return {
    'Content-Type': withCharset(contentType),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY
  };
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname || '/');
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = path.join(__dirname, normalizedPath === path.sep ? 'index.html' : normalizedPath);

  if (!filePath.startsWith(__dirname) || path.basename(filePath).startsWith('.')) {
    res.writeHead(403, buildSecurityHeaders('text/plain'));
    res.end('Forbidden');
    return;
  }

  if (!path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        fs.readFile(path.join(__dirname, '404.html'), (err, content404) => {
          res.writeHead(404, buildSecurityHeaders('text/html'));
          res.end(content404 || '404 Not Found');
        });
      }
      else {
        res.writeHead(500, buildSecurityHeaders('text/plain'));
        res.end('Internal Server Error: '+error.code+' ..\n');
      }
    }
    else {
      res.writeHead(200, buildSecurityHeaders(contentType));
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
