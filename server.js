const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8',
  '.xsd': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const DENY_EXTENSIONS = new Set(['.php', '.env', '.ini', '.sh', '.sql', '.log', '.bak']);
const DENY_PATH_SEGMENTS = new Set(['.git', '.github', '.agents', '.local', '.cache', 'node_modules']);

function isDenied(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (DENY_EXTENSIONS.has(ext)) return true;
  const segments = relPath.split(path.sep);
  for (const seg of segments) {
    if (DENY_PATH_SEGMENTS.has(seg)) return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  try {
    urlPath = decodeURIComponent(urlPath);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  const filePath = path.resolve(ROOT, '.' + path.posix.normalize(urlPath));
  const relPath = path.relative(ROOT, filePath);

  if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (relPath && isDenied(relPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (err2, stat2) => {
        if (!err2 && stat2.isFile()) {
          serveFile(indexPath, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });
      return;
    }
    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
