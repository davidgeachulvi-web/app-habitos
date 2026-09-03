// Servidor estático mínimo para el prototipo AWAKE (copia literal de www/).
// Sirve proto/ con SPA-fallback a ui.html. Puerto desde PROTO_PORT (defecto 4174).
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.PROTO_PORT) || 4174;
const ROOT = path.resolve(__dirname);
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};
const server = http.createServer((req, res) => {
    let urlPath;
    try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
    catch (e) { urlPath = '/'; }
    if (urlPath === '/') urlPath = '/ui.html';
    let filePath = path.normalize(path.join(ROOT, urlPath.replace(/^\/+/, '')));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.stat(filePath, (err, st) => {
        if (!err && st.isDirectory()) filePath = path.join(filePath, 'ui.html');
        fs.readFile(filePath, (err2, data) => {
            if (err2) {
                fs.readFile(path.join(ROOT, 'ui.html'), (err3, html) => {
                    if (err3) { res.writeHead(404); res.end('missing'); return; }
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                    res.end(html);
                });
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
            res.end(data);
        });
    });
});
server.listen(PORT, '127.0.0.1', () => {
    console.log('AWAKE prototipo en http://localhost:' + PORT + ' raíz: ' + ROOT);
});
