/* Panel de detalles visuales v3 (prototipo) — conmutador en vivo sobre <html class="det-*"> */
(function () {
    'use strict';
    var STORE = 'awake_proto_detalles_v3';
    var html = document.documentElement;

    var DETAILS = [
        { id: 'cb-circ',      g: 'shape', name: 'Checkbox circular',    desc: 'El sello del hábito pasa a círculo, como una moneda.' },
        { id: 'shape-squircle', g: 'shape', name: 'Esquinas redondeadas', desc: 'Tarjetas, ritual y botones con radios generosos y suaves.' },
        { id: 'anim-shine',   g: 'anim',  name: 'Reflejo que barre',    desc: 'Destello periódico SOLO en las tareas aún no cumplidas.' },
        { id: 'anim-seal-pulse', g: 'anim', name: 'Onda al sellar',     desc: 'Onda circular del color del tema al completar un hábito.' }
    ];

    function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } }
    function save(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {} }

    var state = load();
    if (typeof state.hue !== 'number') state.hue = 195;
    if (!state.on) state.on = {};

    var btn = document.getElementById('studio-toggle');
    var panel = document.getElementById('studio-panel');
    var hueInput = document.getElementById('sl-hue');
    var hueVal = document.getElementById('val-hue');

    function activeCount() {
        var n = 0;
        for (var k in state.on) if (state.on[k]) n++;
        return n;
    }

    function applyAll() {
        for (var i = 0; i < DETAILS.length; i++) {
            html.classList.toggle('det-' + DETAILS[i].id, !!state.on[DETAILS[i].id]);
        }
        html.style.setProperty('--accent-hue', String(state.hue));
        btn.classList.toggle('has-detalles', activeCount() > 0);
        if (hueInput) { hueInput.value = state.hue; hueVal.textContent = state.hue + '°'; }
    }

    function build() {
        var groups = { shape: 'sp-list-shape', anim: 'sp-list-anim' };
        for (var g in groups) {
            var list = document.getElementById(groups[g]);
            if (!list) continue;
            list.innerHTML = '';
            DETAILS.forEach(function (d) {
                if (d.g !== g) return;
                var item = document.createElement('div');
                item.className = 'sp-item' + (state.on[d.id] ? ' on' : '');
                item.setAttribute('role', 'switch');
                item.setAttribute('aria-checked', state.on[d.id] ? 'true' : 'false');
                item.tabIndex = 0;
                item.innerHTML = '<span class="sp-dot"></span><span class="sp-copy"><span class="sp-name"></span><span class="sp-desc"></span></span><span class="sp-switch"></span>';
                item.querySelector('.sp-name').textContent = d.name;
                item.querySelector('.sp-desc').textContent = d.desc;
                item.addEventListener('click', function () {
                    state.on[d.id] = !state.on[d.id];
                    item.classList.toggle('on', state.on[d.id]);
                    item.setAttribute('aria-checked', state.on[d.id] ? 'true' : 'false');
                    html.classList.toggle('det-' + d.id, state.on[d.id]);
                    btn.classList.toggle('has-detalles', activeCount() > 0);
                    save(state);
                });
                item.addEventListener('keydown', function (ev) {
                    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); item.click(); }
                });
                list.appendChild(item);
            });
        }
    }

    function togglePanel(open) {
        var willOpen = typeof open === 'boolean' ? open : !panel.classList.contains('open');
        panel.classList.toggle('open', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    /* Limpieza: elimina clases det-* obsoletas de versiones anteriores */
    [].slice.call(html.classList).forEach(function (c) { if (c.indexOf('det-') === 0) html.classList.remove(c); });

    btn.addEventListener('click', function () { togglePanel(); });
    document.getElementById('sp-close').addEventListener('click', function () { togglePanel(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') togglePanel(false); });

    hueInput.addEventListener('input', function () {
        state.hue = parseInt(hueInput.value, 10) || 195;
        hueVal.textContent = state.hue + '°';
        html.style.setProperty('--accent-hue', String(state.hue));
        save(state);
    });

    document.getElementById('sp-reset').addEventListener('click', function () {
        state.on = {};
        state.hue = 195;
        save(state);
        build();
        applyAll();
    });

    build();
    applyAll();
})();
