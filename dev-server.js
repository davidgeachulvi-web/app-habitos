// Servidor estático mínimo para el preview local de AWAKE.
// Sirve el build estático de www/ con SPA-fallback a index.html.
// Puerto desde PORT (por defecto 4173).
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4173;
const ROOT = path.resolve(__dirname, 'www');

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
    try {
        urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch (e) {
        urlPath = '/';
    }
    // Endpoint de desarrollo: guarda en disco un .glb exportado desde el prototipo
    // (POST /__save/awake-coin.glb → www/proto/out/awake-coin.glb) para poder
    // post-procesarlo (p. ej. compresión Draco con @gltf-transform/cli).
    if (req.method === 'POST' && urlPath.startsWith('/__save/')) {
        const name = path.basename(urlPath.slice('/__save/'.length));
        if (!/^[\w.-]+\.glb$/.test(name)) {
            res.writeHead(400); res.end('bad name'); return;
        }
        const dir = path.join(ROOT, 'proto', 'out');
        fs.mkdir(dir, { recursive: true }, () => {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                const buf = Buffer.concat(chunks);
                fs.writeFile(path.join(dir, name), buf, (err) => {
                    if (err) { res.writeHead(500); res.end('write fail'); }
                    else { res.writeHead(200); res.end('saved ' + buf.length); }
                });
            });
        });
        return;
    }
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = path.normalize(path.join(ROOT, urlPath.replace(/^\/+/, '')));
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
    }

    fs.stat(filePath, (err, st) => {
        if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
        fs.readFile(filePath, (err2, data) => {
            if (err2) {
                // SPA fallback: rutas que no son archivos existentes → index.html
                fs.readFile(path.join(ROOT, 'index.html'), (err3, html) => {
                    if (err3) {
                        res.writeHead(404);
                        res.end('missing');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(html);
                });
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const type = MIME[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': type });
            res.end(data);
        });
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('AWAKE preview on http://localhost:' + PORT + ' rooted at ' + ROOT);
});