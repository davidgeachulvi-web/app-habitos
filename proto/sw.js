const AWAKE_SW = 'awake-shell-v154';
const AWAKE_SHELL = [
    './index.html',
    './app.css',
    './app.js',
    './js/core/session.js',
    './js/core/analytics.js',
    './js/domain/icons.js',
    './js/domain/habits.js',
    './js/social/chat.js',
    './js/badges/badge-seal-art.js',
    './js/badges/badge-coin-3d.js',
    './js/badges/coin-studio.js',
    './js/badges/coin/coin-engine.js',
    './js/badges/coin/coin-geometry.js',
    './js/badges/coin/coin-materials.js',
    './js/badges/coin/coin-reliefs.js',
    './js/badges/coin/coin-scene.js',
    './js/badges/coin/coin-presets.json',
    './js/vendor/three.module.min.js',
    './js/vendor/three.core.min.js',
    './js/vendor/OrbitControls.js',
    './js/vendor/SVGLoader.js',
    './js/vendor/RoomEnvironment.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(AWAKE_SW);
        for (let i = 0; i < AWAKE_SHELL.length; i++) {
            try {
                const res = await fetch(AWAKE_SHELL[i], { cache: 'reload' });
                if (res && res.ok) await cache.put(AWAKE_SHELL[i], res);
            } catch (e) {}
        }
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== AWAKE_SW).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

function esRecursoShell(url) {
    if (/\/js\/badges\/coin\/coin-presets\.json$/.test(url.pathname)) return true;
    return /\/(index\.html|app\.css|app\.js|js\/core\/(?:session|analytics)\.js|js\/domain\/(?:icons|habits)\.js|js\/social\/chat\.js|js\/badges\/(?:badge-seal-art|badge-coin-3d|coin-studio)\.js|js\/badges\/coin\/coin-(?:engine|geometry|materials|reliefs|scene)\.js|js\/vendor\/(?:three\.module\.min|three\.core\.min|OrbitControls|SVGLoader|RoomEnvironment)\.js)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isNav = event.request.mode === 'navigate';
    if (!isNav && !esRecursoShell(url)) return;
    event.respondWith((async () => {
        try {
            const res = await fetch(event.request);
            if (res && res.ok) {
                const cache = await caches.open(AWAKE_SW);
                await cache.put(isNav ? './index.html' : event.request, res.clone());
            }
            return res;
        } catch (e) {
            const cache = await caches.open(AWAKE_SW);
            if (isNav) return (await cache.match('./index.html')) || Response.error();
            return (await cache.match(event.request)) || Response.error();
        }
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = (event.notification && event.notification.data) || {};
    event.waitUntil((async () => {
        const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (let i = 0; i < all.length; i++) {
            const client = all[i];
            if (client && 'focus' in client) {
                await client.focus();
                client.postMessage({ type: 'awake-notification-click', data: data });
                return;
            }
        }
        const url = data && data.senderId
            ? './?chat=' + encodeURIComponent(String(data.senderId))
            : './';
        if (self.clients.openWindow) await self.clients.openWindow(url);
    })());
});