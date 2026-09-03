# AWAKE — app de hábitos con capa social

Árbol canónico: **`www/`** (layout por dominios: `js/core`, `js/domain`, `js/social`, `js/badges`, `js/vendor`), promovido como fuente de verdad el 1 de septiembre de 2026 (antes `awake-structured/`). El árbol plano anterior (`legacy/www/`) se eliminó del working tree el 3 de septiembre de 2026 y queda recuperable en el historial de Git (commits `22359cb`/`66a265e`).

**Stack:** SPA en JavaScript puro (sin build step) · PWA (service worker) · Capacitor 8 (Android/iOS) · Supabase (Postgres + RLS + Realtime + Edge Function) · Vercel · analítica local-first.

**Control de versiones:** Git iniciado el 3 de septiembre de 2026 (commit base `66a265e` + saneamiento `22359cb`). Sin remoto todavía.

**Comandos (raíz):**
- `npm run dev` — servidor local de `www/` (SPA-fallback)
- `npm test` — 30 tests (iconos, programación, smoke, recordatorios)
- `node scripts/check-imports.js` — valida el grafo del visor 3D (0 imports bare)
- `npm run deploy:web` — check-imports → bump SW → deploy Vercel → cap:copy
- `npm run cap:copy` — sincroniza `www/` en `ios/` y `android/`

**Estructura:**
- `www/` — la app (fuente de verdad)
- `docs/` — documentación del proyecto (MVP, roadmap, flujos, arquitectura, módulos, depuración, RLS; auditoría externa sept 2026 en `07-auditoria-externa.md`)
- `test/` — suite de tests (`node:test`, 30)
- `scripts/` — utilidades del pipeline
- `supabase/` — SQL (esquema/RLS) y Edge Functions
- `android/`, `ios/` — proyectos nativos Capacitor
