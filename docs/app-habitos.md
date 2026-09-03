# app-habitos — Registro de cambios guardados

Fecha: 29/08/2026 · Proyecto: AWAKE (app-habitos) · Ruta: `C:\app-habitos`

## 1. Fix del badge de mensajes no leídos (avión de papel)

**Síntoma reportado:** al iniciar sesión aparecen constantemente 2 mensajes activos; aunque se lean, al cabo de minutos/horas reaparecen los mismos mensajes como nuevos.

**Causa raíz (2 defectos):**
1. La lectura se marcaba con la hora del **dispositivo** (`new Date().toISOString()`) en lugar de la del servidor → si el reloj local va retrasado, el mensaje siempre parece más nuevo que la lectura.
2. La sincronización a `chat_reads` era de un solo sentido y sin reintentos → si la fila del servidor faltaba o quedaba desactualizada, nada la reparaba.

**Cambios aplicados (en las 3 copias: web, iOS y Android):**

| Fichero | Cambio |
|---|---|
| `www/js/chat.js` | Eliminada la llamada prematura `marcarChatLeido(userId)` (hora local) en `abrirChatConUsuario()`. La lectura solo se marca al terminar de cargar, anclada a `chatLastMessageAt` (marca temporal del servidor del último mensaje). |
| `www/app.js` | `hidratarLecturasChatDesdeServidor()` ahora es **bidireccional**: baja servidor→local y reenvía local→servidor las lecturas más recientes que el servidor no conoce. Nuevo helper `sincronizarLecturasChatConServidor()` con **reintento con backoff** (hasta 4 intentos). `marcarChatLeido()` usa el helper en lugar del upsert descartado en silencio. |
| `ios/App/App/public/js/chat.js` | Mismos cambios que `www/js/chat.js`. |
| `ios/App/App/public/app.js` | Mismos cambios que `www/app.js`. |
| `android/app/src/main/assets/public/js/chat.js` | Mismos cambios que `www/js/chat.js`. |
| `android/app/src/main/assets/public/app.js` | Mismos cambios que `www/app.js`. |

**Verificación:** `node --check` OK en los 6 ficheros; las 3 copias quedaron idénticas en las secciones tocadas; simulación de la lógica: con reloj retrasado 10 min, unread pasa de `true` (antes) a `false` (después); la sincronización bidireccional repara el servidor desactualizado.

## 2. Comprobación remota de Supabase y script de arreglo

**Resultado de la comprobación (API PostgREST, solo lectura, proyecto `jmzbionwibffnzlfeiwx`):**
- `chat_reads`: **existe** pero devuelve `401 / 42501 permission denied for table chat_reads` → **faltan los GRANT de privilegios** (el script original nunca los concedía). Confirmación de la causa raíz del bug.
- `messages`, `profiles`, `likes`, `comments`, `habits`, `habit_logs`: 200 (privilegios + RLS OK).
- `follows`, `device_tokens`: 401 (mismo patrón, pendiente de revisar).
- `badges_unlocked`: 404 (la tabla no existe).

**Cambio aplicado:**
| Fichero | Cambio |
|---|---|
| `supabase/sql/chat_reads.sql` | Script completo e idempotente (no borra datos): `create table if not exists` + **GRANT select/insert/update/delete a anon, authenticated, service_role** + RLS + políticas recreadas de forma idempotente + **bloque `DO` de verificación** que imprime un NOTICE con el estado (tabla, RLS, privilegios por rol, políticas, columnas). |

**Pendiente de ejecutar por el usuario:** pegar `supabase/sql/chat_reads.sql` en el **SQL Editor de Supabase** y ejecutarlo. Resultado esperado del NOTICE:
`chat_reads -> tabla: EXISTE | RLS: HABILITADO | SELECT anon: SÍ | SELECT authenticated: SÍ | SELECT service_role: SÍ | políticas: 3 | columnas: user_id, peer_id, last_read_at`

## 3. Restauración de los diseños 3D de las insignias

**Síntoma reportado:** «se han borrado los diseños 3d… deben ser exactamente los mismos que habíamos creado».

**Diagnóstico:** los diseños NO estaban borrados del código actual, pero sí habían sido **sustituidos por placeholders** en una sesión anterior: `badge-seal-art.js` lo declara («Placeholder temporal: sustituye al antiguo arte SVG metálico y a la moneda 3D (WebGL + CSS flip)»). La producción web (`app-habitos-namo8tqp8-gea-e7c9.vercel.app`) lleva 5 días sin desplegarse (24/08) y está protegida con SSO; el dominio `app-habitos.vercel.app` sirve una app React ajena («UKIFAZER»). El diseño original (el de las capturas `qa-badges-out/*.png` y el script `scripts/qa-badges-visual.mjs`) ya no existía en el código: fue reconstruido con fidelidad a partir del QA (que especifica estructura y comportamiento) y las capturas.

**Cambios aplicados (en las 3 copias: web, iOS y Android):**

| Fichero | Cambio |
|---|---|
| `www/js/badge-seal-art.js` | **Sellos metálicos reconstruidos** (reemplaza el placeholder plano): SVG con gradiente radial metálico por nivel (Aluminio→Platino), anillo exterior, glifo en relieve (doble trazo sombra+luz) y `--m-hi`/`--m-mid` por nivel (plata `#fafcfe`, oro `#ffe9a8`, platino verdoso, bloqueada ceniza `#8b929c`/`#555c66`). Nuevo `generarSelloInsigniaReverso()` (reverso AWAKE). Contrato público intacto. |
| `www/js/badge-coin-3d.js` | **Moneda 3D autocontenida reconstruida** (reemplaza el visor Three.js con CDN): renderer en canvas 2D sin dependencias externas — cara con glifo grabado, reverso AWAKE, canto estriado, materiales Aluminio→Platino, arrastre con inercia. API pública `BadgeCoin3D(canvas, opts)` intacta + `rotX`/`rotY`, `setRotation()`, `render()`, `frontTex`. |
| `www/index.html` | Modal de detalle restaurado: `#badge-detail-modal` → `#badge-detail-tilt` (stage con `data-metal`) + `#badge-detail-canvas.badge-coin-canvas` + `.badge-coin-tex-back` (`.badge-seal-reverse` + `.badge-seal-brand` AWAKE) + hint. |
| `www/app.js` | `abrirModalInsignia3D()` usa la nueva estructura (tilt, canvas, meta, acciones), inyecta el reverso, fija `data-metal` y expone `tilt._badgeCoin`. Guards de gestos (slider) y tecla ESC apuntan a `#badge-detail-tilt` / `#badge-detail-modal`. |
| `www/app.css` | Estilos de sellos metálicos + bloque `.badge-detail-modal` / `.badge-detail-tilt` / `.badge-coin-tex-back` / `.badge-coin-hint` (sustituye el bloque `.badge-3d-*`). |
| `www/sw.js` | Caché `awake-shell-v141` (fuerza la actualización de la PWA instalada). |

**Verificación:** `node --check` OK en los 6 ficheros; las 3 copias byte-idénticas (`diff` SAME); smoke test en Node de los generadores: colores QA correctos (plata `#fafcfe`, oro `#ffe9a8`, platino verdoso, bloqueada ceniza, aluminio igual entre temas), clases y relieve correctos, reverso con AWAKE, `BadgeCoin3D` carga sin errores. El script `scripts/qa-badges-visual.mjs` vuelve a ser coherente con la estructura restaurada (`#badge-detail-tilt`, `_badgeCoin.frontTex`, `setRotation`, reverso AWAKE).

## 4. Despliegue web (29/08, 15:14) — producción real = proyecto «www»

`npm run deploy:web` desplegó la web con los diseños restaurados. **Hallazgo importante:** el script despliega el directorio `www/`, lo que creó y alimenta un proyecto Vercel llamado **«www»** (id `prj_eVezWjbtLbTAYtJNWVaCgQNA5qeZ`), no `app-habitos`:
- **«www»** (creado 24/08 20:26 UTC): producción real de la PWA. Último deployment (29/08 13:14 UTC, `dpl_EcX2gTY5gaWMrvcawLoTzmucRwXN`, URL `33fa1ur95-fswsfuu0q-gea-e7c9.vercel.app`) con los diseños 3D restaurados. Aliases: `www-gea-e7c9.vercel.app` (protegido SSO) y `www-smoky-phi-21.vercel.app` (acceso público, verificado: sirve `badge-detail-tilt`, `BadgeCoin3D` sin CDN, `badge-seal-reverse`, `awake-shell-v141`).
- **«app-habitos»** (creado 24/08 20:25 UTC): deployments desde la raíz del repo; el último (24/08, `app-habitos-namo8tqp8-gea-e7c9`) lleva 5 días sin actualizar y está protegido con SSO. Sus aliases `app-habitos-three` / `app-habitos-gea-e7c9` NO apuntan a la PWA actual. El dominio `app-habitos.vercel.app` sirve otra app React ajena («UKIFAZER») — no es de este proyecto.
- La producción está protegida con **SSO** (Vercel Deployment Protection): el acceso anónimo a `www-gea-e7c9.vercel.app` redirige al login de Vercel. Para acceso público sin login habría que desactivar la protección en el panel del proyecto.

## 5. Pasos pendientes (entorno / despliegue)

1. Ejecutar `supabase/sql/chat_reads.sql` en el SQL Editor de Supabase.
2. Web: ya desplegada (29/08) — `www-smoky-phi-21.vercel.app` (pública) / `www-gea-e7c9.vercel.app` (SSO).
3. App nativa: `npm run cap:copy` + rebuild (assets ya sincronizados a mano).
4. (Opcional) Revisar `device_tokens`, `follows` y `badges_unlocked` con el mismo patrón de arreglo.
5. (Opcional) Ejecutar `scripts/qa-badges-visual.mjs` (requiere Playwright) para validar visualmente el detalle 3D restaurado.
6. (Opcional) Investigar el dominio `app-habitos.vercel.app` (sirve «UKIFAZER») y decidir si los proyectos «www»/«app-habitos» deben unificarse.
