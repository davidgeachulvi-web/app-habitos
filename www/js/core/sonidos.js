/* AWAKE — sistema de sonidos de la interfaz.
 * Los efectos se reproducen desde ficheros de audio (carpeta /snd) declarados
 * en el MANIFIESTO. Hasta que un id tiene ruta de fichero, reproducirSonido()
 * es un no-op silencioso: la app funciona sin sonido y sin errores.
 * Respeta la preferencia del usuario (Ajustes → Sonido, awake_feedback_prefs). */
window.awakeSonidos = (function () {
    'use strict';
    var PREFS_KEY = 'awake_feedback_prefs';

    // MANIFIESTO de sonidos: id → ruta dentro de /snd.
    // Rellenar cuando lleguen los ficheros (p. ej. 'sello': 'snd/sello.mp3').
    var MANIFIESTO = {
        'sello': 'snd/sello.mp3',             // sellar un hábito
        'toque_ui': 'snd/click.mp3',          // pulsar elementos de la interfaz
        'background': 'snd/background.mp3',   // pulsar el fondo (animación de estrellas)
        'logro': 'snd/logro.mp3',             // insignia desbloqueada + día sellado
        'eliminar': 'snd/delete.mp3',         // eliminar algo (se reproduce al borrarse de verdad)
        'ajustes_activar': 'snd/click.mp3',   // confirmar al activar el sonido en Ajustes
        'chat_rec_inicio': null,              // grabación de voz (pendiente)
        'chat_rec_bloqueo': null,
        'chat_rec_descarte': null,
        'chat_rec_envio': null
    };
    var cache = {};

    function prefsSonido() {
        try {
            const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
            let nivel = typeof saved.volumen === 'number' ? saved.volumen : 100;
            nivel = Math.max(0, Math.min(100, Math.round(nivel)));
            // Sonido apagado: volumen 0 (el antiguo switch off se migra a volumen 0).
            if (saved.sonido === false && !(typeof saved.volumen === 'number')) nivel = 0;
            const activo = saved.sonido !== false && nivel > 0;
            return { activo: activo, nivel: activo ? nivel : 0 };
        } catch (e) {
            return { activo: true, nivel: 100 };
        }
    }

    function sonidoActivo() {
        return prefsSonido().activo;
    }

    function reproducir(id, opts) {
        if (!id || !MANIFIESTO[id]) return;
        const p = prefsSonido();
        if (!p.activo || p.nivel <= 0) return;
        var ruta = MANIFIESTO[id];
        var audio = cache[ruta];
        if (!audio) {
            try { audio = cache[ruta] = new Audio(ruta); } catch (e) { return; }
        }
        try {
            audio.currentTime = 0;
            var vol = (opts && typeof opts.volume === 'number' && opts.volume > 0) ? opts.volume : 1;
            audio.volume = Math.max(0, Math.min(1, (p.nivel / 100) * vol));
            var pr = audio.play();
            if (pr && pr.catch) pr.catch(function () {});
        } catch (e) {}
    }

    function registrar(id, ruta) {
        if (id && ruta) MANIFIESTO[id] = ruta;
    }

    return {
        reproducir: reproducir,
        registrar: registrar,
        manifiesto: MANIFIESTO
    };
})();

function reproducirSonido(id, opts) { window.awakeSonidos.reproducir(id, opts); }
