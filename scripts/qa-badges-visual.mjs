/**
 * Human-like visual QA for AWAKE badges (Social / Colección / moneda 3D).
 * Run: node scripts/qa-badges-visual.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'qa-badges-out');
const findings = [];

function note(level, msg, extra) {
  findings.push({ level, msg, extra: extra || null });
  console.log(`[${level.toUpperCase()}] ${msg}` + (extra ? ` :: ${JSON.stringify(extra)}` : ''));
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (file.endsWith('.woff2')) return 'font/woff2';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const file = path.join(WWW, urlPath.replace(/^\//, ''));
      if (!file.startsWith(WWW) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('missing'); return;
      }
      res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function shot(page, name) {
  const p = path.join(OUT, name + '.png');
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { server, base } = await startStaticServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch (e1) {
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e2) {
      browser = await chromium.launch({ headless: true });
    }
  }
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  try {
    await page.addInitScript(() => {
      const map = {
        _schema: 7,
        _showcase: ['sello-1', 'dia-1', 'oro-skip'],
        'sello-1': Date.now() - 86400000,
        'sello-2': Date.now() - 80000000,
        'dia-1': Date.now() - 70000000,
        'dia-5': Date.now() - 60000000,
        'racha-1': Date.now() - 50000000,
        'memoria-1': Date.now() - 40000000,
      };
      localStorage.setItem('awake_badges_unlocked:guest', JSON.stringify(map));
      localStorage.setItem('awake_onboarded', '1');
      localStorage.setItem('awake_first_seal', '1');
      localStorage.setItem('awake_first_seal_done', '1');
      localStorage.setItem('awake_onboard_done', '1');
    });

    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1800);
    await shot(page, '01-boot');

    for (const sel of [
      '#onboard-skip-btn', '#onboard-next-btn',
      'button:has-text("Ahora no")', 'button:has-text("SIGUIENTE")',
      'button:has-text("Continuar")', 'button:has-text("Empezar")',
      '.modal-overlay.active .btn-cancel', '#auth-guest-btn',
      'button:has-text("Seguir sin cuenta")'
    ]) {
      const el = page.locator(sel).first();
      if (await el.count() && await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    }
    await page.evaluate(() => {
      try {
        localStorage.setItem('awake_onboarded', '1');
        localStorage.setItem('awake_first_seal', '1');
        localStorage.setItem('awake_first_seal_done', '1');
      } catch (e) {}
      document.body.classList.remove('onboarding-open', 'awaiting-first-seal');
      const modal = document.getElementById('onboarding-modal');
      if (modal) modal.classList.remove('active');
      document.querySelectorAll('.tab-item.tab-deferred').forEach(t => t.classList.remove('tab-deferred'));
    });
    await page.waitForTimeout(400);

    await page.locator('.horizontal-tabs .tab-item').nth(2).click();
    await page.waitForTimeout(900);
    await shot(page, '02-social-perfil');

    const colBtn = page.locator('#social-section-btn-coleccion');
    const colSec = page.locator('#social-section-coleccion');
    if (!(await page.locator('#social-section-switch').isVisible())) note('fail', 'Switcher Social no visible');
    else note('ok', 'Switcher Social visible');

    await colBtn.click();
    await page.waitForTimeout(700);
    const colActive = await colSec.evaluate((el) => el.classList.contains('is-active'));
    const colHidden = await colSec.getAttribute('hidden');
    if (!colActive || colHidden !== null) note('fail', 'Colección no activa tras click', { colActive, colHidden });
    else note('ok', 'Colección activa');
    await shot(page, '03-coleccion');

    const sealCount = await page.locator('#awake-badges-root .badge-seal').count();
    note(sealCount >= 24 ? 'ok' : 'warn', `Sellos en Colección: ${sealCount}`);

    const locked = page.locator('#awake-badges-root .badge-card.is-locked .badge-seal').first();
    if (await locked.count()) {
      const metal = await locked.evaluate((el) => ({
        hi: getComputedStyle(el).getPropertyValue('--m-hi').trim(),
        mid: getComputedStyle(el).getPropertyValue('--m-mid').trim(),
        cls: el.className,
      }));
      note(metal.hi.toLowerCase() === '#8b929c' ? 'ok' : 'fail', 'Insignia locked usa metal ceniza', metal);
    } else note('warn', 'No hay cards locked para comprobar ceniza');

    const gold = page.locator('#awake-badges-root .badge-seal.level-5.is-on').first();
    if (await gold.count()) {
      const g = await gold.evaluate((el) => ({
        hi: getComputedStyle(el).getPropertyValue('--m-hi').trim(),
        cls: el.className,
      }));
      note(g.hi.toLowerCase() === '#ffe9a8' ? 'ok' : 'fail', 'Oro encendido con --m-hi correcto', g);
    } else note('warn', 'No se encontró level-5 is-on');

    await page.locator('#awake-badges-root .badge-card.is-on').first().click();
    await page.waitForTimeout(900);
    const stage = page.locator('#badge-detail-tilt');
    if (!(await stage.count())) note('fail', 'No apareció badge-detail-tilt');
    else note('ok', 'Detalle con moneda abierto');
    await page.waitForFunction(() => {
      const c = document.querySelector('.badge-coin-canvas');
      const host = document.getElementById('badge-detail-tilt');
      return c && c.width > 0 && host && host._badgeCoin && host._badgeCoin.frontTex;
    }, { timeout: 8000 }).catch(() => note('warn', 'Texturas moneda no cargaron a tiempo'));
    await page.waitForTimeout(200);
    await shot(page, '04-detalle-abierto');

    const coinInfo = await page.evaluate(() => {
      const host = document.getElementById('badge-detail-tilt');
      const canvas = document.querySelector('.badge-coin-canvas');
      const back = document.querySelector('.badge-coin-tex-back .badge-seal');
      const brand = document.querySelector('.badge-coin-tex-back .badge-seal-brand');
      return {
        metal: host && host.getAttribute('data-metal'),
        hasCanvas: !!canvas,
        canvasPx: canvas ? canvas.width : 0,
        renderer: !!(host && host._badgeCoin),
        hasFrontTex: !!(host && host._badgeCoin && host._badgeCoin.frontTex),
        hasBack: !!back,
        backIsReverse: !!(back && back.classList.contains('badge-seal-reverse')),
        brandText: brand ? brand.textContent : null,
      };
    });
    note(coinInfo.hasCanvas && coinInfo.renderer && coinInfo.hasFrontTex ? 'ok' : 'fail', 'Render canvas 3D activo', coinInfo);
    note(coinInfo.backIsReverse && coinInfo.brandText === 'AWAKE' ? 'ok' : 'fail', 'Reverso AWAKE presente', {
      brandText: coinInfo.brandText, backIsReverse: coinInfo.backIsReverse
    });

    const box = await stage.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 140, cy, { steps: 18 });
      await page.waitForTimeout(200);
      await shot(page, '05-giro-canto');
      const edge = await page.evaluate(() => {
        const r = document.getElementById('badge-detail-tilt')?._badgeCoin;
        return r ? { rotX: r.rotX, rotY: r.rotY } : null;
      });
      note(edge && typeof edge.rotY === 'number' ? 'ok' : 'fail', 'Transform apply tras drag', { edge });

      await page.evaluate(() => {
        const host = document.getElementById('badge-detail-tilt');
        const r = host && host._badgeCoin;
        if (r) {
          r.setRotation(-8, 90);
          r.render();
        }
      });
      await page.waitForTimeout(200);
      await shot(page, '05b-perfil-canto');
      const profile = await page.evaluate(() => {
        const c = document.querySelector('.badge-coin-canvas');
        if (!c) return null;
        const ctx = c.getContext('2d');
        const w = c.width;
        const h = c.height;
        const col = Math.floor(w * 0.5);
        let minY = h;
        let maxY = 0;
        let hits = 0;
        const data = ctx.getImageData(col - 2, 0, 5, h).data;
        for (let y = 0; y < h; y++) {
          const i = y * 5 * 4;
          const a = data[i + 3];
          if (a > 24) {
            hits++;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
        return { hits, thickPx: maxY - minY, canvasH: h };
      });
      note(profile && profile.thickPx >= 12 ? 'ok' : 'warn', 'Canto con grosor visible en canvas', profile);

      await page.mouse.move(cx + 280, cy + 40, { steps: 24 });
      await page.waitForTimeout(250);
      await shot(page, '06-giro-reverso');
      await page.mouse.up();

      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 220, cy - 30, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(900);
      await shot(page, '07-inercia');
      const afterFlick = await page.evaluate(() => {
        const r = document.getElementById('badge-detail-tilt')?._badgeCoin;
        return r ? { rotX: r.rotX, rotY: r.rotY } : null;
      });
      note(afterFlick && typeof afterFlick.rotY === 'number' ? 'ok' : 'warn', 'Inercia dejó transform', { afterFlick });

      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(400);
      const mid = await page.evaluate(() => {
        const r = document.getElementById('badge-detail-tilt')?._badgeCoin;
        return r ? { rotX: r.rotX, rotY: r.rotY } : null;
      });
      await page.waitForTimeout(500);
      const mid2 = await page.evaluate(() => {
        const r = document.getElementById('badge-detail-tilt')?._badgeCoin;
        return r ? { rotX: r.rotX, rotY: r.rotY } : null;
      });
      note(mid && mid2 && mid.rotX === mid2.rotX && mid.rotY === mid2.rotY ? 'ok' : 'warn', 'Tras toque, rotación estable (stop inercia)', { mid, mid2 });
    }

    const showBtn = page.locator('.badge-showcase-btn').first();
    if (await showBtn.count()) {
      note('ok', `Acción showcase visible: ${(await showBtn.textContent() || '').trim()}`);
      await shot(page, '08-accion-showcase');
    } else note('warn', 'Sin botón Mostrar/Quitar en detalle');

    await page.locator('#social-section-btn-perfil').click();
    await page.waitForTimeout(400);
    await page.locator('#profile-subtab-btn-insignias').click();
    await page.waitForTimeout(700);
    await shot(page, '09-showcase-perfil');
    const showCards = await page.locator('#awake-badges-showcase-root .badge-card').count();
    note(showCards >= 1 ? 'ok' : 'fail', `Cards en showcase: ${showCards}`);

    await page.locator('#awake-badges-showcase-root .badge-card').first().click();
    await page.waitForTimeout(500);
    const sliderBefore = await page.evaluate(() => document.getElementById('content-slider')?.style.transform || '');
    const sb = await page.locator('#badge-detail-tilt').boundingBox();
    if (sb) {
      await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
      await page.mouse.down();
      await page.mouse.move(sb.x + sb.width / 2 + 100, sb.y + sb.height / 2, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
    const sliderAfter = await page.evaluate(() => document.getElementById('content-slider')?.style.transform || '');
    note(sliderBefore === sliderAfter ? 'ok' : 'warn', 'Slider no se mueve al girar moneda', { sliderBefore, sliderAfter });
    await shot(page, '10-slider-aislado');

    await page.locator('#social-section-btn-coleccion').click();
    await page.waitForTimeout(500);
    const metals = await page.evaluate(() => {
      const grab = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { hi: cs.getPropertyValue('--m-hi').trim(), mid: cs.getPropertyValue('--m-mid').trim() };
      };
      return {
        alSello: grab('.badge-seal.theme-sello.level-1'),
        alDia: grab('.badge-seal.theme-dia.level-1'),
        ag: grab('.badge-seal.level-4.is-on'),
        pt: grab('.badge-seal.level-6.is-on'),
      };
    });
    if (metals.alSello && metals.alDia) {
      note(metals.alSello.hi === metals.alDia.hi ? 'ok' : 'fail', 'Aluminio igual entre temas', metals);
    }
    if (metals.ag) note(metals.ag.hi.toLowerCase() === '#fafcfe' ? 'ok' : 'warn', 'Plata blanquecina', metals.ag);
    if (metals.pt) {
      const greenish = /b7d4c6|f3faf6/i.test(metals.pt.hi + metals.pt.mid);
      note(greenish ? 'ok' : 'warn', 'Platino verdoso', metals.pt);
    }
    await shot(page, '11-coleccion-final');
  } catch (err) {
    note('fail', 'Excepción en QA', { error: String(err && err.stack || err) });
    try { await shot(page, '99-error'); } catch (e) {}
  } finally {
    await browser.close();
    server.close();
  }

  const summary = {
    fail: findings.filter(f => f.level === 'fail').length,
    warn: findings.filter(f => f.level === 'warn').length,
    ok: findings.filter(f => f.level === 'ok').length,
    findings,
    screenshots: fs.readdirSync(OUT).filter(f => f.endsWith('.png')),
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify({ fail: summary.fail, warn: summary.warn, ok: summary.ok, out: OUT }, null, 2));
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
