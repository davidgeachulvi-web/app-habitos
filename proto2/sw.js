/* AWAKE — Prototipo (proto2): SIN service worker.
 * Este shell es un laboratorio aislado: no registra caché ni interfiere con
 * la app oficial (www) ni con su deploy de producción. Cualquier intento de
 * registro queda anulado y libera cachés heredadas. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {}
        await self.registration.unregister();
        try {
            const clientList = await self.clients.matchAll({ includeUncontrolled: true });
            clientList.forEach(client => client.navigate(client.url));
        } catch (e) {}
    })());
});
