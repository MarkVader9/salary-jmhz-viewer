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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
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
          serveFile(indexPath, stat2, req, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });
      return;
    }
    serveFile(filePath, stat, req, res);
  });
});

function serveFile(filePath, stat, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const total = stat.size;
  const range = req.headers.range;

  // Podpora HTTP Range (přehrávání/posouvání videa a audia)
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      let start = match[1] === '' ? null : parseInt(match[1], 10);
      let end = match[2] === '' ? null : parseInt(match[2], 10);
      if (start === null) {
        start = total - end;
        end = total - 1;
      } else if (end === null || end >= total) {
        end = total - 1;
      }
      if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${total}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
      stream.pipe(res);
      return;
    }
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Content-Length': total,
  });
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
  stream.pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
