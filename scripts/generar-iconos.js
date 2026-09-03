/* AWAKE — genera iconos PWA/app desde icon.png (150x150 RGBA8).
 * Sin dependencias: decodifica PNG con zlib, reescala, re-encodea.
 * Salida: www/icons/icon-192.png (any), www/icons/icon-512.png (any),
 *         www/icons/icon-512-maskable.png (maskable, contenido al 72%),
 *         www/icons/apple-touch-icon.png (180x180).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodePng(file) {
    const b = fs.readFileSync(file);
    let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, raw = Buffer.alloc(0);
    while (off < b.length) {
        const len = b.readUInt32BE(off);
        const type = b.slice(off + 4, off + 8).toString();
        const data = b.slice(off + 8, off + 8 + len);
        if (type === 'IHDR') {
            w = data.readUInt32BE(0); h = data.readUInt32BE(4);
            bitDepth = data[8]; colorType = data[9];
        } else if (type === 'IDAT') {
            raw = Buffer.concat([raw, data]);
        } else if (type === 'IEND') break;
        off += 12 + len;
    }
    if (bitDepth !== 8 || colorType !== 6 || !w || !h) throw new Error('PNG no soportado: ' + bitDepth + '/' + colorType);
    const inflated = zlib.inflateSync(raw);
    const stride = w * 4;
    const out = Buffer.alloc(w * h * 4);
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < h; y++) {
        const filter = inflated[y * (stride + 1)];
        const line = inflated.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        const cur = Buffer.alloc(stride);
        for (let x = 0; x < stride; x++) {
            const a = x >= 4 ? cur[x - 4] : 0;
            const bb = prev[x];
            const c = x >= 4 ? prev[x - 4] : 0;
            let v = line[x];
            switch (filter) {
                case 0: break;
                case 1: v = (v + a) & 255; break;
                case 2: v = (v + bb) & 255; break;
                case 3: v = (v + ((a + bb) >> 1)) & 255; break;
                case 4: {
                    const p = a + bb - c;
                    const pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
                    const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c);
                    v = (v + pr) & 255;
                    break;
                }
                default: throw new Error('filtro desconocido ' + filter);
            }
            cur[x] = v;
        }
        cur.copy(out, y * stride);
        prev = cur;
    }
    return { w, h, data: out };
}

function encodePng(w, h, rgba) {
    const stride = w * 4;
    const rawLine = Buffer.alloc(stride);
    const rows = Buffer.alloc(h * (stride + 1));
    for (let y = 0; y < h; y++) {
        rgba.copy(rawLine, 0, y * stride, (y + 1) * stride);
        rows[y * (stride + 1)] = 0; // filtro None
        rawLine.copy(rows, y * (stride + 1) + 1);
    }
    const idat = zlib.deflateSync(rows, { level: 9 });
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const chunk = (type, data) => {
        const t = Buffer.from(type, 'ascii');
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const crcBuf = Buffer.concat([t, data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(crcBuf) >>> 0, 0);
        return Buffer.concat([len, crcBuf, crc]);
    };
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', idat),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

// Muestreo bilineal
function resize(src, sw, sh, outSize) {
    const out = Buffer.alloc(outSize * outSize * 4);
    const scale = sw / outSize;
    for (let y = 0; y < outSize; y++) {
        for (let x = 0; x < outSize; x++) {
            const sx = (x + 0.5) * scale - 0.5;
            const sy = (y + 0.5) * scale - 0.5;
            const x0 = Math.max(0, Math.min(sw - 1, Math.floor(sx)));
            const y0 = Math.max(0, Math.min(sh - 1, Math.floor(sy)));
            const x1 = Math.min(sw - 1, x0 + 1);
            const y1 = Math.min(sh - 1, y0 + 1);
            const fx = sx - x0, fy = sy - y0;
            for (let c = 0; c < 4; c++) {
                const v00 = src[(y0 * sw + x0) * 4 + c];
                const v10 = src[(y0 * sw + x1) * 4 + c];
                const v01 = src[(y1 * sw + x0) * 4 + c];
                const v11 = src[(y1 * sw + x1) * 4 + c];
                const top = v00 + (v10 - v00) * fx;
                const bot = v01 + (v11 - v01) * fx;
                out[(y * outSize + x) * 4 + c] = Math.round(top + (bot - top) * fy);
            }
        }
    }
    return out;
}

const src = decodePng('www/icon.png');
const iconsDir = path.join('www', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// any: contenido completo
function save(name, size) {
    const data = resize(src.data, src.w, src.h, size);
    fs.writeFileSync(path.join(iconsDir, name), encodePng(size, size, data));
    console.log('OK', name, size + 'x' + size, path.join(iconsDir, name));
}

// maskable: contenido al 72% centrado sobre fondo negro (zona segura 80%)
function saveMaskable(name, size) {
    const inner = Math.round(size * 0.72);
    const innerData = resize(src.data, src.w, src.h, inner);
    const out = Buffer.alloc(size * size * 4); // negro (0,0,0,0 -> rellenar alpha 255)
    for (let i = 3; i < out.length; i += 4) out[i] = 255;
    const pad = Math.round((size - inner) / 2);
    for (let y = 0; y < inner; y++) {
        innerData.copy(out, ((pad + y) * size + pad) * 4, y * inner * 4, (y + 1) * inner * 4);
    }
    fs.writeFileSync(path.join(iconsDir, name), encodePng(size, size, out));
    console.log('OK', name, size + 'x' + size, '(maskable, contenido al 72%)');
}

save('icon-192.png', 192);
save('icon-512.png', 512);
saveMaskable('icon-512-maskable.png', 512);
save('apple-touch-icon.png', 180);
console.log('Generados en', iconsDir);
