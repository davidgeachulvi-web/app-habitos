/**
 * AWAKE — arte metálico de insignias (reconstrucción del diseño original).
 *
 * Sellos "moneda": gradiente radial metálico por nivel (Aluminio→Platino),
 * glifo en relieve, anillo exterior y reverso con marca AWAKE.
 * Contrato público para app.js: generarSelloInsigniaFrente / htmlGlifoInsignia
 * / generarSelloInsigniaReverso.
 */
(function (global) {
    'use strict';

    // Colores por nivel de metal (hi = brillo, mid = tono base).
    // Valores alineados con el QA visual: plata #fafcfe, oro #ffe9a8,
    // platino verdoso #f3faf6/#b7d4c6, bloqueada ceniza #8b929c/#555c66.
    var METALES = {
        1: { hi: '#8d99a7', mid: '#656f79' },
        2: { hi: '#e9bd84', mid: '#9c6a2f' },
        3: { hi: '#f2a47f', mid: '#a04824' },
        4: { hi: '#e9eff5', mid: '#99a6b3' },
        5: { hi: '#ffe9a8', mid: '#c69a2d' },
        6: { hi: '#d7ecdf', mid: '#80b092' }
    };
    var BLOQUEADA = { hi: '#8b929c', mid: '#555c66' };

    var seq = 0;

    function metalDeNivel(level, encendida) {
        if (!encendida) return BLOQUEADA;
        var n = Math.max(1, Math.min(6, Number(level) || 1));
        return METALES[n] || METALES[1];
    }

    // Símbolo de cada tema. Se dibuja con stroke (relleno vacío) para poder
    // aplicar el doble trazo de relieve (sombra oscura + luz).
    function htmlGlifoInsignia(theme, level) {
        if (theme === 'sello') {
            return '<path d="M20.3 31.6 L27.7 39 L45 20.1"/>';
        }
        if (theme === 'dia') {
            return '<path transform="translate(16.73 15.73) scale(0.1193)" vector-effect="non-scaling-stroke" d="M240,152H199.55a73.54,73.54,0,0,0,.45-8,72,72,0,0,0-144,0,73.54,73.54,0,0,0,.45,8H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM72,144a56,56,0,1,1,111.41,8H72.59A56.13,56.13,0,0,1,72,144Zm144,56a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H208A8,8,0,0,1,216,200ZM72.84,43.58a8,8,0,0,1,14.32-7.16l8,16a8,8,0,0,1-14.32,7.16Zm-56,48.84a8,8,0,0,1,10.74-3.57l16,8a8,8,0,0,1-7.16,14.31l-16-8A8,8,0,0,1,16.84,92.42Zm192,15.16a8,8,0,0,1,3.58-10.73l16-8a8,8,0,1,1,7.16,14.31l-16,8a8,8,0,0,1-10.74-3.58Zm-48-55.16,8-16a8,8,0,0,1,14.32,7.16l-8,16a8,8,0,1,1-14.32-7.16Z"/>';
        }
        if (theme === 'racha') {
            return '<path transform="translate(16.73 14.82) scale(0.1193)" vector-effect="non-scaling-stroke" d="M183.89,153.34a57.6,57.6,0,0,1-46.56,46.55,9,9,0,0,1-1.33.11,8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68ZM216,144a88,88,0,0,1-176,0c0-27.92,11-56.47,32.66-84.85a8,8,0,0,1,11.93-.89l24.12,23.41,22-60.41a8,8,0,0,1,12.63-3.41C165.21,36,216,84.55,216,144Zm-16,0c0-46.09-35.79-85.92-58.21-106.33l-22.27,61.07a8,8,0,0,1-13.09,3L80.06,76.16C64.09,99.21,56,122,56,144a72,72,0,0,0,144,0Z"/>';
        }
        return '<path transform="translate(16.73 16.21) scale(0.1193)" vector-effect="non-scaling-stroke" d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z"/>';
    }

    function sanitizarId(nombre) {
        return String(nombre || '').replace(/[^a-zA-Z0-9_-]/g, '');
    }

    function defsGradientes(uid, hi, mid) {
        return '<defs>'
            + '<radialGradient id="mg-' + uid + '" cx="34%" cy="26%" r="88%">'
            + '<stop offset="0%" stop-color="#ffffff"/>'
            + '<stop offset="0.30" stop-color="#ffffff" stop-opacity="0.92"/>'
            + '<stop offset="0.55" stop-color="' + hi + '"/>'
            + '<stop offset="1" stop-color="' + mid + '"/>'
            + '</radialGradient>'
            + '<linearGradient id="eg-' + uid + '" x1="0" y1="0" x2="0" y2="1">'
            + '<stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>'
            + '<stop offset="45%" stop-color="rgba(255,255,255,0.30)"/>'
            + '<stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>'
            + '</linearGradient>'
            + '<linearGradient id="gm-' + uid + '" x1="0" y1="0" x2="0.55" y2="1">'
            + '<stop offset="0%" stop-color="#ffffff"/>'
            + '<stop offset="0.45" stop-color="' + hi + '"/>'
            + '<stop offset="1" stop-color="' + mid + '"/>'
            + '</linearGradient>'
            + '</defs>';
    }

    function glifoConRelieve(theme, nivel, metal, uid) {
        var g = htmlGlifoInsignia(theme, nivel);
        return '<g class="badge-flat-glyph" transform="translate(32 32) scale(0.78) translate(-32 -32)">'
            + '<g fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.85 1.1)">' + g + '</g>'
            + '<g fill="none" stroke="url(#gm-' + uid + ')" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.25 0.3)">' + g + '</g>'
            + '<g fill="none" stroke="rgba(0,0,0,0.42)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.1 0.05)">' + g + '</g>'
            + '<g fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.35 -0.4)">' + g + '</g>'
            + '<g fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.35 0.55)">' + g + '</g>'
            + '</g>';
    }

    function generarSelloInsigniaFrente(theme, level, encendida, opts) {
        opts = opts || {};
        var nivel = Math.max(1, Math.min(6, Number(level) || 1));
        var metal = metalDeNivel(level, encendida);
        var uid = sanitizarId(opts.uid) || ('s' + (++seq));

        var cls = [
            'badge-seal',
            'badge-flat',
            'theme-' + (theme || 'sello'),
            'level-' + nivel,
            encendida ? 'is-on' : 'is-locked',
            opts.detail ? 'is-detail' : '',
            opts.justUnlocked ? 'is-just-unlocked' : ''
        ].filter(Boolean).join(' ');

        var lockedStyle = encendida ? '' : ' opacity:0.92;';

        return '<svg class="' + cls + '" viewBox="0 0 64 64" aria-hidden="true" style="--m-hi:' + metal.hi + ';--m-mid:' + metal.mid + ';' + lockedStyle + '">'
            + defsGradientes(uid, metal.hi, metal.mid)
            + '<circle class="badge-flat-ring" cx="32" cy="32" r="25.6" fill="none" stroke="url(#eg-' + uid + ')" stroke-width="2.3"/>'
            + '<circle class="badge-flat-disc" cx="32" cy="32" r="24.2" fill="url(#mg-' + uid + ')" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>'
            + '<circle class="badge-flat-rim" cx="32" cy="32" r="20.6" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>'
            + glifoConRelieve(theme || 'sello', nivel, metal, uid)
            + '</svg>';
    }

    function generarSelloInsigniaReverso(theme, level, opts) {
        opts = opts || {};
        var nivel = Math.max(1, Math.min(6, Number(level) || 1));
        var metal = metalDeNivel(level, true);
        var uid = sanitizarId(opts.uid) || ('r' + (++seq));

        var cls = [
            'badge-seal',
            'badge-flat',
            'badge-seal-reverse',
            'theme-' + (theme || 'sello'),
            'level-' + nivel,
            'is-on'
        ].filter(Boolean).join(' ');

        return '<svg class="' + cls + '" viewBox="0 0 64 64" aria-hidden="true" style="--m-hi:' + metal.hi + ';--m-mid:' + metal.mid + ';">'
            + defsGradientes(uid, metal.hi, metal.mid)
            + '<circle class="badge-flat-ring" cx="32" cy="32" r="25.6" fill="none" stroke="url(#eg-' + uid + ')" stroke-width="2.3"/>'
            + '<circle class="badge-flat-disc" cx="32" cy="32" r="24.2" fill="url(#mg-' + uid + ')" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>'
            + '<text x="32" y="33" text-anchor="middle" dominant-baseline="middle"'
            + ' font-family="\'Cinzel\', Georgia, serif" font-size="13" font-weight="700"'
            + ' letter-spacing="1.5" fill="#ffffff" style="paint-order:stroke;" stroke="rgba(0,0,0,0.55)" stroke-width="0.8">AWAKE</text>'
            + '</svg>';
    }

    global.generarSelloInsigniaFrente = generarSelloInsigniaFrente;
    global.generarSelloInsigniaReverso = generarSelloInsigniaReverso;
    global.htmlGlifoInsignia = htmlGlifoInsignia;
})(typeof window !== 'undefined' ? window : globalThis);
