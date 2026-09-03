/* AWAKE — analytics ligero y privado.
 * Modo local por defecto: registra eventos en consola + localStorage.
 * Si se carga el script oficial de Plausible (o cualquier proveedor que
 * exponga window.plausible), los eventos se envían automáticamente sin
 * tocar el código de instrumentación. Sin cookies. */
window.awakeAnalytics = (function () {
    var LOCAL_KEY = 'awake_analytics_log';
    var MAX_LOCAL = 300;

    function registrarLocal(name, props) {
        try {
            var arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
            arr.push({ t: Date.now(), n: name, p: props || {} });
            localStorage.setItem(LOCAL_KEY, JSON.stringify(arr.slice(-MAX_LOCAL)));
        } catch (e) {}
        try { console.info('[analytics]', name, props || ''); } catch (e) {}
    }

    function rastrear(name, props) {
        if (!name || typeof name !== 'string') return;
        try {
            if (typeof window.plausible === 'function') {
                window.plausible(name, { props: props || {} });
                return;
            }
        } catch (e) {}
        registrarLocal(name, props);
    }

    return { track: rastrear, LOCAL_KEY: LOCAL_KEY };
})();
