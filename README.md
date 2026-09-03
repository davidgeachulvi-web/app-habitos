# AWAKE — app de hábitos con capa social

Árbol canónico: **`www/`** (layout por dominios: `js/core`, `js/domain`, `js/social`, `js/badges`, `js/vendor`), promovido como fuente de verdad el 1 de septiembre de 2026 (antes `awake-structured/`). El árbol plano anterior quedó archivado en `legacy/www/` — no se edita ni se despliega.

**Stack:** SPA en JavaScript puro (sin build step) · PWA (service worker) · Capacitor 8 (Android/iOS) · Supabase (Postgres + RLS + Realtime + Edge Function) · Vercel · analítica local-first.

**Comandos (raíz):**
- `npm run dev` — servidor local de `www/` (SPA-fallback)
- `npm test` — 30 tests (iconos, programación, smoke, recordatorios)
- `node scripts/check-imports.js` — valida el grafo del visor 3D (0 imports bare)
- `npm run deploy:web` — check-imports → bump SW → deploy Vercel → cap:copy
- `npm run cap:copy` — sincroniza `www/` en `ios/` y `android/`

**Estructura:**
- `www/` — la app (fuente de verdad)
- `docs/` — documentación del proyecto (MVP, roadmap, flujos, arquitectura, módulos, depuración, RLS)
- `test/` — suite de tests (`node:test`, 30)
- `scripts/` — utilidades del pipeline
- `supabase/` — SQL (esquema/RLS) y Edge Functions
- `android/`, `ios/` — proyectos nativos Capacitor
- `legacy/www/` — árbol plano anterior (archivado)
