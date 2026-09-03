# AWAKE — Registro de sesiones (10)

**Convención (ver `AGENTS.md` § 8):** al terminar cualquier sesión de trabajo, añadir una entrada aquí con
fecha, objetivo, cambios (archivos), decisiones, gates verificados y pendiente/próximo paso. Así la siguiente
sesión de IA arranca con contexto. Las entradas nuevas van **al final**, por fecha ascendente.

---

## 03/09/2026 — Auditoría externa, control de versiones y base de conocimiento

**Objetivo:** auditar el código (100 % generado por IA), proponer estructura, tomar el control del proyecto y
dejar una base para el desarrollo continuado con IA hasta el lanzamiento (Play Store).

**Cambios (commits en `main`):**
- `66a265e` — commit base del estado actual (354 archivos; incluye árboles muertos para que su borrado sea recuperable).
- `22359cb` — saneamiento: eliminados `legacy/www`, `proto/`, `proto2/`, `tmp-restaurar/`, `backup-icono-anterior/`, `scripts/out/`, logs (164 archivos, recuperables desde `66a265e`).
- `53b75e9` — `docs/07-auditoria-externa.md` (inventario real, hallazgos A-1…A-17, Opciones A/B); corrección de deriva en `docs/04`, `docs/05`, `README`.
- `aee54fc` — CI GitHub Actions + `scripts/check-sintaxis.js` + `npm run check`; `package.json` main corregido; eliminado `scripts/_fix-template.js` (roto, sin referencias).
- `8a55cff` (PR #1) — repo público + flujo PR documentado.
- Este commit — `AGENTS.md`, `docs/09-contexto-ia.md`, `docs/10-registro-sesiones.md`.

**Decisiones:**
- Estructura elegida: **Opción A** (modularización ESM nativa sin build step), incremental S1–S7
  (`docs/08-decision-estructura.md`). Opción B (Vite+TS) descartada por ahora, con criterios de re-evaluación.
- Repo remoto **público** `app-habitos` (requisito del plan free de GitHub para protección de ramas).
- `main` protegida: PR obligatorio + CI verde + sin force-push + historial lineal; **0 approvals** (GitHub
  no permite auto-aprobarse el propio PR; el mantenedor revisa el PR antes de mergear).
- Workflow estándar: rama → gates locales → push → PR → CI verde → squash merge.

**Gates verificados:** `npm test` 30/30 · `npm run check` OK · CI verde en GitHub (3 runs) · push directo a
main rechazado (protección activa) · PR #1 mergeado con squash.

**Hallazgos nuevos:** A-16 (copias nativas de SW en v169 vs `www/` v170 — la próxima `cap:copy` lo resuelve).

**Pendiente / próximo paso:** empezar **S1** del plan (store de estado + extracción de sesión a módulos ESM
con tests como red). También: remoto ya creado pero sin protección adicional del lado del mantenedor en la UI
(revisar regla en GitHub); resolver `docs/04`/`docs/05` obsoletos cuando toque; auditoría RLS 5.5 pendiente.

**Nota de entorno:** este checkout es compartido y a veces aparecen/desaparecen archivos externos
(`proto/`, `scripts/_*.js`). No commitearlos (`AGENTS.md` § 6).
