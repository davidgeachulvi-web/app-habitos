# Carpeta de sonidos (/snd)

Ficheros de audio de la interfaz (mp3 cortos). Registrados en el MANIFIESTO de
`www/js/core/sonidos.js` (id → ruta). Los puntos de anclaje de la app llaman a
`reproducirSonido(id)`; si un id tiene `null`, no suena nada (no-op silencioso).

## Ficheros activos

| Fichero | id | Momento de reproducción |
|---|---|---|
| `logro.mp3` | `logro` | Desbloquear una insignia (banner superior) y completar el día sellado (hoja «El ritual de hoy está cerrado») |
| `background.mp3` | `background` | Pulsar el fondo (solo fondo, sin elementos), a la vez que la animación de estrellas |
| `click.mp3` | `toque_ui`, `ajustes_activar` | Pulsar cualquier elemento de la interfaz; confirmación al activar el sonido en Ajustes |
| `sello.mp3` | `sello` | Sellar una tarea (hábito o deseo) |
| `delete.mp3` | `eliminar` | Cuando algo se elimina de verdad (tras confirmar el aviso): hábito, deseo, elemento del catálogo personal, registro del historial, comentario o foto de perfil |

## Ids aún sin fichero (silenciosos)

- `chat_rec_inicio`, `chat_rec_bloqueo`, `chat_rec_descarte`, `chat_rec_envio`
  (grabación de voz del chat — pendientes de esta tanda)