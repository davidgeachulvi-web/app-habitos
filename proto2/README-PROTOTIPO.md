# proto2 — Prototipo aislado de AWAKE

Copia exacta de `www/` para **probar nuevas ideas sin tocar la app oficial**.

## Qué la hace aislada
- **Datos propios:** todas las claves de `localStorage`/`sessionStorage` de este
  shell usan prefijo `proto2` (p. ej. `proto2monolith_app_state:guest`,
  `proto2awake_badges_unlocked`). Renombradas directamente en sus ficheros JS —
  nada comparte estado con `www/`, ni siquiera en el mismo origen.
- **Sin service worker:** su `sw.js` es un no-op que se autodesregistra, y el
  shim de `index.html` bloquea cualquier registro. Sin cachés que estorben.
- **Sin deploy:** no tiene `vercel.json` ni `.vercelignore`; nunca se despliega.
- **Identidad visual:** título `AWAKE — PROTOTIPO (aislado)` y manifest propio.
- **Marca JS:** `window.__AWAKE_PROTO2__ === true` dentro del prototipo.

## Cómo arrancarla
```
node proto2/proto2-server.cjs
# → http://127.0.0.1:8200  (puerto 8200, separado del 4173 de la app oficial)
```

## Reglas
1. Experimenta aquí; si una idea convence, se porta **a mano** a `www/` (nunca
   copiar ficheros enteros sin revisión: las claves de storage difieren).
2. No subir `proto2/` a producción: no está en el deploy de Vercel (solo `www`).
3. Este servidor es solo desarrollo local.
