const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = process.cwd();

const MIME = {
  html: 'text/html; charset=utf-8',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  md: 'text/markdown; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath);

  // Directory → index.html
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch (_) {
    // file doesn't exist yet, will 404 below
  }

  if (!path.extname(filePath)) filePath += '.html';

  const ext = path.extname(filePath).slice(1);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + filePath);
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    }
  });
}).listen(PORT, () => {
  console.log('Novel Reader dev server: http://localhost:' + PORT);
});
