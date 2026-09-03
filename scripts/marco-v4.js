
/* ================= MARCO COSMICO v4 · minimalista (proto2) ================= */
(function () {
    const CLAVE = 'proto2_marco_variante';
    const VARIANTES = ['linea', 'norte'];

    function aplicarVariante(id) {
        const el = document.getElementById('marco-cosmico');
        if (!el) return;
        if (!id || VARIANTES.indexOf(id) === -1) id = null;
        if (id) { el.setAttribute('data-variante', id); } else { el.removeAttribute('data-variante'); }
        document.querySelectorAll('#marco-dev-panel .marco-dev-opcion').forEach(function (b) {
            b.classList.toggle('activo', b.getAttribute('data-variante') === id);
        });
        try { if (id) localStorage.setItem(CLAVE, id); else localStorage.removeItem(CLAVE); } catch (e) {}
    }

    window.seleccionarMarcoProto = function (id) {
        const el = document.getElementById('marco-cosmico');
        const actual = el ? el.getAttribute('data-variante') : null;
        aplicarVariante(actual === id ? null : id);
        if (window.reproducirSonidoClick) { try { window.reproducirSonidoClick(); } catch (e) {} }
    };

    window.alternarPanelMarcos = function (ev) {
        if (ev) { try { ev.stopPropagation(); } catch (e) {} }
        const panel = document.getElementById('marco-dev-panel');
        if (!panel) return;
        panel.classList.toggle('abierto');
        if (panel.classList.contains('abierto') && window.reproducirSonidoClick) {
            try { window.reproducirSonidoClick(); } catch (e) {}
        }
    };

    document.addEventListener('click', function (e) {
        const panel = document.getElementById('marco-dev-panel');
        if (!panel || !panel.classList.contains('abierto')) return;
        if (e.target.closest('#marco-dev-panel') || e.target.closest('#marco-dev-btn')) return;
        panel.classList.remove('abierto');
    });

    function ajustarBase() {
        const nav = document.querySelector('.horizontal-tabs');
        if (!nav) return;
        const h = Math.round(nav.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--marco-bottom', h + 'px');
    }

    function iniciar() {
        try { localStorage.removeItem('proto2_marco_activo'); localStorage.removeItem('proto2_marco_brillo'); } catch (e) {}
        let guardado = null;
        try { guardado = localStorage.getItem(CLAVE); } catch (e) {}
        aplicarVariante(guardado);
        ajustarBase();
        window.addEventListener('resize', ajustarBase);
        window.addEventListener('orientationchange', ajustarBase);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
