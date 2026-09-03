/* AWAKE — hábitos, agenda y ficha. Script global; se carga antes de app.js. */

        function determinarMomentoActual() {
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 14) return 'MAÑANA';
            if (hour >= 14 && hour < 21) return 'TARDE';
            return 'NOCHE';
        }

        let ultimaClaveDiaRitual = null;
        let ultimoMomentoRitual = null;

        function sincronizarRelojRitual(forzar) {
            const ahora = new Date();
            const claveHoy = claveDiaLocal(ahora);
            const momento = determinarMomentoActual();
            let cambioFecha = false;
            let cambioFiltro = false;

            if (ultimaClaveDiaRitual !== claveHoy) {
                ultimaClaveDiaRitual = claveHoy;
                selectedDate = ahora;
                cambioFecha = true;
            }

            if (activeFilter !== 'TODOS' && (forzar || ultimoMomentoRitual !== momento)) {
                if (activeFilter !== momento) {
                    activeFilter = momento;
                    cambioFiltro = true;
                }
                ultimoMomentoRitual = momento;
            }

            if (forzar || cambioFecha) renderCalendarStrip();
            if (forzar || cambioFiltro) sincronizarFiltroVisualActivo();
            if (!forzar && (cambioFecha || cambioFiltro)) renderizarMiRutina();
        }

        function iniciarRelojRitual() {
            sincronizarRelojRitual(true);
            if (ritualClockId) clearInterval(ritualClockId);
            ritualClockId = setInterval(() => sincronizarRelojRitual(false), 30000);
            if (habitCountdownId) clearInterval(habitCountdownId);
            habitCountdownId = setInterval(actualizarCuentasAtrasHabitos, 1000);
            actualizarCuentasAtrasHabitos();
        }

        function arrancarIntervalosHabitos() {
            if (habitReminderIntervalId) clearInterval(habitReminderIntervalId);
            habitReminderIntervalId = setInterval(verificarRecordatoriosHabitos, 15000);
            iniciarRelojRitual();
        }

        function momentoDeLogHabito(l) {
            const m = String((l && l.texto) || '').match(/^\[(MAÑANA|TARDE|NOCHE|24\/7|CUALQUIER)\]/);
            return m ? m[1] : '';
        }

        function habitoDesdeRef(habitRef) {
            if (habitRef && typeof habitRef === 'object') return habitRef;
            return habitoPorNombre(habitRef);
        }

        function claveDiaDeLog(l) {
            if (l && l.dia) return String(l.dia);
            return claveDiaLocal(fechaDeLogHabito(l));
        }

        function instanteMediodiaLocal(date) {
            const d = inicioDiaLocal(date);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
        }

        function logCoincideMomento(l, momento) {
            if (!momento) return true;
            const tag = momentoDeLogHabito(l);
            if (tag) return tag === momento;
            if (momentoSoloEnTodos(momento)) return true;
            return !!(l && l.texto && l.texto.indexOf('[' + momento + ']') !== -1);
        }

        function logsDeHabito(habitRef) {
            const h = habitoDesdeRef(habitRef);
            const name = cleanHabitName((h && h.nombre) || habitRef || '');
            const hid = h && h.id ? String(h.id) : '';
            const out = [];
            const seen = new Set();
            Object.keys(historialAgrupado || {}).forEach(k => {
                (historialAgrupado[k] || []).forEach(l => {
                    if (!l) return;
                    if (typeof selloIdEstaEliminado === 'function' && selloIdEstaEliminado(l.id)) return;
                    const sk = String(l.id || '') + '#' + String(l.timestamp || l.fecha || '');
                    if (seen.has(sk)) return;
                    if (hid && l.habitId) {
                        if (String(l.habitId) !== hid) return;
                    } else if (cleanHabitName(l.nombre || k) !== name) {
                        return;
                    }
                    seen.add(sk);
                    out.push(l);
                });
            });
            return out;
        }

        function logsDelDiaHabito(habitRef, date, momento) {
            const dia = claveDiaLocal(date);
            return logsDeHabito(habitRef).filter(l => claveDiaDeLog(l) === dia && logCoincideMomento(l, momento));
        }

        function quitarLogDeHistorial(log) {
            if (!log) return;
            if (log.id) marcarSelloEliminado(log.id);
            Object.keys(historialAgrupado || {}).forEach(k => {
                const arr = historialAgrupado[k];
                if (!arr || !arr.length) return;
                for (let i = arr.length - 1; i >= 0; i--) {
                    const l = arr[i];
                    if (l === log || (log.id && l && String(l.id) === String(log.id))) arr.splice(i, 1);
                }
            });
        }

        function camposSelloHabito(h, dateTarget, momento) {
            const day = instanteMediodiaLocal(dateTarget);
            return {
                habitId: (h && h.id) || null,
                dia: claveDiaLocal(day),
                dateObj: day,
                timestamp: day.getTime(),
                momento: momento || ''
            };
        }

        function estadoSelloEnFecha(habitRef, date, momento) {
            const h = habitoDesdeRef(habitRef) || habitoPorNombre(habitRef);
            const logs = logsDelDiaHabito(h || habitRef, date, momento);
            const recaida = logs.find(logEsRecaida);
            const omitido = logs.find(logEsOmitido);
            const hecho = logs.find(l => !logEsRecaida(l) && !logEsOmitido(l));
            if (h && habitEsAbstinencia(h)) {
                if (esFechaFutura(date) || !habitNacidoEnFecha(h, date)) return 'pending';
                if (recaida) return 'recaida';
                if (omitido) return 'omitido';
                if (hecho) return 'done';
                if (claveDiaLocal(date) === claveDiaLocal(new Date())) return 'virtual';
                return 'pending';
            }
            if (recaida) return 'recaida';
            if (omitido) return 'omitido';
            if (hecho) return 'done';
            return 'pending';
        }

        function selloCuentaComoHecho(estado) {
            return estado === 'done' || estado === 'omitido' || estado === 'virtual';
        }

        function estaCompletadoEnFecha(habitName, date, momento) {
            return selloCuentaComoHecho(estadoSelloEnFecha(habitName, date, momento));
        }

        function estaOmitidoEnFecha(habitName, date, momento) {
            return estadoSelloEnFecha(habitName, date, momento) === 'omitido';
        }

        function obtenerLogEnFecha(habitName, date) {
            const logs = logsDelDiaHabito(habitName, date, null);
            if (!logs.length) return null;
            return logs.find(l => logHabitoTieneFoto(l)) || logs[0];
        }

        function sellosRealesEnSemanaHasta(h, date, inclusive) {
            if (!h) return 0;
            const weekStart = inicioSemanaPreferida(date);
            const end = inicioDiaLocal(date);
            let n = 0;
            for (let x = weekStart; x <= end; x = sumarDiasLocal(x, 1)) {
                if (!inclusive && x.getTime() >= end.getTime()) break;
                if (inclusive && x.getTime() > end.getTime()) break;
                const logs = logsDelDiaHabito(h, x, null);
                // Solo sellos reales (no omisiones/recaídas): alimenta el badge "X/Y" y "X de Y esta semana".
                if (logs.some(l => l && !logEsMarcaRitual(l))) n++;
            }
            return n;
        }

        function calcularRachaHastaFecha(habitName, fechaRef) {
            const h = habitoPorNombre(habitName);
            let racha = 0;
            let d = inicioDiaLocal(fechaRef);
            let guard = 0;
            while (guard++ < 420) {
                if (h && !habitProgramadoEnFecha(h, d)) {
                    d = sumarDiasLocal(d, -1);
                    continue;
                }
                const momento = h && (h.momentos || []).indexOf('24/7') !== -1 ? '24/7' : null;
                if (selloCuentaComoHecho(estadoSelloEnFecha(habitName, d, momento))) {
                    racha++;
                    d = sumarDiasLocal(d, -1);
                } else {
                    break;
                }
            }
            return racha;
        }

        function fechaDeLogHabito(l) {
            let d = l && l.dateObj ? new Date(l.dateObj) : null;
            if (!d || isNaN(d.getTime())) d = new Date((l && (l.timestamp || l.fecha)) || Date.now());
            return d;
        }

        function inicioDiaLocal(date) {
            const s = date ? new Date(date) : new Date();
            return new Date(s.getFullYear(), s.getMonth(), s.getDate());
        }

        function esFechaFutura(dateLike) {
            return inicioDiaLocal(dateLike).getTime() > inicioDiaLocal(new Date()).getTime();
        }

        function sumarDiasLocal(date, n) {
            const d = inicioDiaLocal(date);
            d.setDate(d.getDate() + n);
            return d;
        }

        function inicioSemanaPreferida(date) {
            const d = inicioDiaLocal(date);
            const day = d.getDay();
            if (weekStartDay === 0) {
                d.setDate(d.getDate() - day);
                return d;
            }
            d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
            return d;
        }

        function inicioSemanaLunes(date) {
            return inicioSemanaPreferida(date);
        }

        function offsetPrimeraCeldaMes(firstDayOfMonth) {
            const jsDay = firstDayOfMonth.getDay();
            if (weekStartDay === 0) return jsDay;
            return jsDay === 0 ? 6 : jsDay - 1;
        }

        function etiquetasSemanaCortas() {
            return weekStartDay === 0 ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        }

        function etiquetasSemanaStrip() {
            return weekStartDay === 0
                ? ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
                : ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
        }

        function logHabitoTieneFoto(l) {
            const u = (l && l.imagenes && l.imagenes[0]) || (l && l.image_url);
            return !!(u && String(u).trim());
        }

        function habitProgramadoEnFecha(h, date) {
            if (!h || habitEsArchivado(h)) return false;
            const d = inicioDiaLocal(date);
            if (habitEsUnaVez(h)) {
                const dk = claveDiaLocal(d);
                return fechasUnicasDeHabito(h).some(iso => {
                    const u = parseIsoFechaLocal(iso);
                    return !!(u && claveDiaLocal(u) === dk);
                });
            }
            if (h.createdAt && d < fechaNacimientoHabito(h)) return false;
            if (h.momentos && h.momentos.includes('24/7')) return true;
            const n = Number(h.vecesPorSemana || 0);
            if (n > 0) {
                return sellosRealesEnSemanaHasta(h, d, false) < n;
            }
            const dias = h.dias;
            if (!dias || !dias.length) return true;
            return dias.includes(date.getDay());
        }

        function conjuntoDiasCumplidosHabito(habitName) {
            const h = habitoPorNombre(habitName);
            const logs = logsDeHabito(h || habitName);
            const set = new Set();
            logs.forEach(l => {
                if (logEsRecaida(l)) return;
                const key = claveDiaDeLog(l);
                if (key) set.add(key);
            });
            if (h && habitEsAbstinencia(h)) {
                const hoy = inicioDiaLocal(new Date());
                if (estadoSelloEnFecha(h, hoy, '24/7') === 'virtual') set.add(claveDiaLocal(hoy));
            }
            return set;
        }

        function tasaVentanaHabito(h, start, end, doneSet) {
            const hoy = inicioDiaLocal(new Date());
            let prog = 0;
            let ok = 0;
            for (let d = inicioDiaLocal(start); d <= end; d = sumarDiasLocal(d, 1)) {
                if (d > hoy) break;
                if (!habitProgramadoEnFecha(h, d)) continue;
                prog++;
                if (doneSet.has(claveDiaLocal(d))) ok++;
            }
            return { prog, ok, pct: prog ? Math.round((ok / prog) * 100) : 0 };
        }

        function estadisticasRachaHabito(h, doneSet) {
            const hoy = inicioDiaLocal(new Date());
            const logs = logsDeHabito(h);
            if (!logs.length) return { actual: 0, maxima: 0, ultimaRota: null };
            let first = hoy;
            logs.forEach(l => {
                const d = inicioDiaLocal(fechaDeLogHabito(l));
                if (!isNaN(d.getTime()) && d < first) first = d;
            });
            let fin = hoy;
            if (habitProgramadoEnFecha(h, hoy) && !doneSet.has(claveDiaLocal(hoy))) {
                fin = sumarDiasLocal(hoy, -1);
            }
            const runs = [];
            let run = 0;
            for (let d = first; d <= fin; d = sumarDiasLocal(d, 1)) {
                if (!habitProgramadoEnFecha(h, d)) continue;
                if (doneSet.has(claveDiaLocal(d))) run++;
                else {
                    if (run) runs.push(run);
                    run = 0;
                }
            }
            if (run) runs.push(run);
            const actual = runs.length ? runs[runs.length - 1] : 0;
            const maxima = runs.reduce((m, n) => Math.max(m, n), 0);
            const ultimaRota = runs.length >= 2 ? runs[runs.length - 2] : null;
            return { actual, maxima, ultimaRota };
        }

        function seriesBarrasFichaHabito(h, doneSet, modo) {
            const hoy = inicioDiaLocal(new Date());
            const items = [];
            if (modo === 'semana') {
                const monday = inicioSemanaLunes(hoy);
                for (let i = 7; i >= 0; i--) {
                    const start = sumarDiasLocal(monday, -i * 7);
                    const end = sumarDiasLocal(start, 6);
                    let ok = 0;
                    for (let d = start; d <= end; d = sumarDiasLocal(d, 1)) {
                        if (d > hoy) break;
                        if (habitProgramadoEnFecha(h, d) && doneSet.has(claveDiaLocal(d))) ok++;
                    }
                    items.push({
                        label: start.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
                        valor: ok
                    });
                }
            } else {
                for (let i = 7; i >= 0; i--) {
                    const d0 = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                    const d1 = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0);
                    let ok = 0;
                    for (let d = d0; d <= d1; d = sumarDiasLocal(d, 1)) {
                        if (d > hoy) break;
                        if (habitProgramadoEnFecha(h, d) && doneSet.has(claveDiaLocal(d))) ok++;
                    }
                    items.push({
                        label: d0.toLocaleDateString('es', { month: 'short' }),
                        valor: ok
                    });
                }
            }
            return items;
        }

        function publicacionesDeLogsHabito(cleanHName) {
            const logs = logsDeHabito(cleanHName);
            const nickEl = document.getElementById('display-nickname');
            return logs.map(l => {
                const img = srcImagenHabito((l.imagenes && l.imagenes[0]) || l.image_url) || null;
                return {
                    id: l.id,
                    user_id: l.user_id || (currentUser ? currentUser.id : null),
                    nombre: cleanHName,
                    fecha: l.fecha,
                    dateObj: l.dateObj ? new Date(l.dateObj) : new Date(0),
                    texto: l.texto,
                    score: l.score,
                    imgUrl: img,
                    privacidad: l.privacidad || 'seguidores',
                    likes: l.likes || 0,
                    likedByMe: l.likedByMe || false,
                    comentarios: l.comentarios || [],
                    owner: nickEl ? nickEl.textContent : '',
                    avatar: window.userHasAvatar ? document.getElementById('avatar-img').src : null
                };
            });
        }

        function etiquetaDiasHabito(h) {
            if (habitEsUnaVez(h)) {
                const fechas = fechasUnicasDeHabito(h).map(parseIsoFechaLocal).filter(Boolean).sort((a, b) => a - b);
                const hora = normalizarHoraHHMM(h.startTime || '', null);
                const suf = hora ? ` · ${hora}` : '';
                if (!fechas.length) return 'Una vez' + suf;
                if (fechas.length === 1) {
                    const fechaTxt = fechas[0].toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
                    return fechaTxt + suf;
                }
                const lista = fechas.map(d => d.toLocaleDateString('es', { day: 'numeric', month: 'short' })).join(', ');
                return `${fechas.length} días · ${lista}` + suf;
            }
            const map = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
            const order = [1, 2, 3, 4, 5, 6, 0];
            if (h.momentos && h.momentos.includes('24/7')) return 'Todos los días';
            if (h.vecesPorSemana) return `${h.vecesPorSemana} veces / semana`;
            const dias = h.dias || [];
            if (!dias.length || dias.length === 7) return 'Todos los días';
            return order.filter(d => dias.includes(d)).map(d => map[d]).join(' · ');
        }

        function htmlSubtituloTarjetaHabito(h) {
            const nat = naturalezaHabito(h);
            if (nat === 'unaVez') {
                return `<span class="habit-card-sub">${escapeHtmlChat(etiquetaDiasHabito(h))}</span>`;
            }
            if (nat === 'abstinencia') {
                return `<span class="habit-card-sub">Abstinencia · 24/7</span>`;
            }
            return '';
        }

        function htmlMenuContextoHabito(h, globalIndex, momento, estado) {
            const {
                futuroBloqueado,
                completadoHoy,
                omitidoHoy,
                esAbst,
                permiteFoto
            } = estado;
            const nat = naturalezaHabito(h);
            const esUnaVez = nat === 'unaVez';
            const restIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 6h5L3 13h5"/><path d="M10 4h4l-4 6h4"/><path d="M16 2h3l-3 4h3"/></svg>`;
            const editIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
            const trashIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
            const descansoLabel = h.enDescanso ? 'Reanudar' : 'Descansar';
            let items = [];

            if (!esUnaVez && !futuroBloqueado && !esHabitoContinuo(h, momento) && !completadoHoy) {
                items.push(`<button type="button" class="ctx-item" onclick="omitirHabitoHoy(${globalIndex}, '${momento}')">${svgPhosphorPorClave('moon', 15)} Omitir hoy</button>`);
            }
            if (!esUnaVez && !futuroBloqueado && omitidoHoy) {
                items.push(`<button type="button" class="ctx-item" onclick="deshacerOmisionHabito(${globalIndex}, '${momento}')">${svgPhosphorPorClave('moon', 15)} Deshacer omisión</button>`);
            }
            if (!futuroBloqueado && esAbst && completadoHoy) {
                items.push(`<button type="button" class="ctx-item" onclick="clicCheckboxHabito(${globalIndex}, '${momento}')">${svgPhosphorPorClave('cigarette-slash', 15)} Hoy recaí</button>`);
            }
            if (!esUnaVez && !futuroBloqueado && habitPermiteTimer(h) && !completadoHoy) {
                items.push(`<button type="button" class="ctx-item" onclick="abrirSelloTimer(${globalIndex}, '${momento}')">${svgPhosphorPorClave('target', 15)} Sello cronometrado</button>`);
            }
            if (completadoHoy && !omitidoHoy && permiteFoto) {
                items.push(`<button type="button" class="ctx-item" onclick="abrirModalFotoNota(${globalIndex}, '${momento}')">${svgPhosphorPorClave('camera', 15)} Foto o nota</button>`);
            }
            if (completadoHoy && !omitidoHoy && !permiteFoto && !esAbst) {
                items.push(`<button type="button" class="ctx-item" onclick="abrirModalFotoNota(${globalIndex}, '${momento}')">${svgPhosphorPorClave('notebook', 15)} Nota</button>`);
            }
            if (!esUnaVez) {
                items.push(`<button type="button" class="ctx-item" onclick="toggleDescansoHabito(${globalIndex})">${restIcon} ${descansoLabel}</button>`);
                items.push(`<button type="button" class="ctx-item" onclick="archivarHabito(${globalIndex})">${svgPhosphorPorClave('book-open', 15)} Archivar</button>`);
            }
            items.push(`<button type="button" class="ctx-item" onclick="abrirEditarHabito(${globalIndex})">${editIcon} Editar</button>`);
            items.push(`<button type="button" class="ctx-item" onclick="solicitarEliminarHabito(${globalIndex})" style="color: #f87171;">${trashIcon} Eliminar</button>`);
            return items.join('');
        }

        function htmlBadgeVecesSemana(h) {
            const n = Number(h && h.vecesPorSemana) || 0;
            if (!n) return '';
            const hechos = sellosRealesEnSemanaHasta(h, selectedDate, true);
            return `<span class="habit-week-n${hechos >= n ? ' is-done' : ''}">${hechos}/${n}</span>`;
        }

        function abrirFichaHabito(event, index) {
            if (event) event.stopPropagation();
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            if (!misHabitos[index]) return;
            fichaHabitoIndex = index;
            fichaHabitoMes = new Date();
            const modal = document.getElementById('habit-ficha-modal');
            if (modal) modal.classList.add('active');
            renderizarFichaHabito();
            actualizarBotonAtrasIOS();
        }

        function cerrarFichaHabito() {
            const modal = document.getElementById('habit-ficha-modal');
            if (modal) modal.classList.remove('active');
            fichaHabitoIndex = null;
            actualizarBotonAtrasIOS();
        }

        function cambiarRangoFichaHabito(modo) {
            fichaHabitoRango = modo === 'semana' ? 'semana' : 'mes';
            renderizarFichaHabito();
        }

        function navegarMesFichaHabito(dir) {
            const curr = fichaHabitoMes || new Date();
            fichaHabitoMes = new Date(curr.getFullYear(), curr.getMonth() + dir, 1);
            renderizarFichaHabito();
        }

        function abrirRegistroDesdeFicha(logId, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (fichaHabitoIndex == null) return;
            const h = misHabitos[fichaHabitoIndex];
            if (!h) return;
            const posts = publicacionesDeLogsHabito(cleanHabitName(h.nombre));
            abrirFeedPublicacionesVertical(posts, logId);
        }

        function refrescarFichaHabitoAbierta() {
            const modal = document.getElementById('habit-ficha-modal');
            if (!modal || !modal.classList.contains('active')) return;
            if (fichaHabitoIndex == null || !misHabitos[fichaHabitoIndex]) {
                cerrarFichaHabito();
                return;
            }
            renderizarFichaHabito();
        }

        function renderizarFichaHabito() {
            const h = misHabitos[fichaHabitoIndex];
            const titleEl = document.getElementById('habit-ficha-title');
            const countEl = document.getElementById('habit-ficha-countdown');
            const metaEl = document.getElementById('habit-ficha-meta');
            const body = document.getElementById('habit-ficha-body');
            if (!h || !body) return;
            const cleanName = cleanHabitName(h.nombre);
            const doneSet = conjuntoDiasCumplidosHabito(h.nombre);
            const logs = historialAgrupado[cleanName] || [];
            const hoy = inicioDiaLocal(new Date());
            const t30 = tasaVentanaHabito(h, sumarDiasLocal(hoy, -29), hoy, doneSet);
            const tPrev = tasaVentanaHabito(h, sumarDiasLocal(hoy, -59), sumarDiasLocal(hoy, -30), doneSet);
            const delta = tPrev.prog ? t30.pct - tPrev.pct : null;
            const rachas = estadisticasRachaHabito(h, doneSet);
            const series = seriesBarrasFichaHabito(h, doneSet, fichaHabitoRango);
            const maxBar = Math.max(1, ...series.map(s => s.valor));
            const momentos = (h.momentos || []).map(etiquetaMomentoHabito).filter(Boolean).join(' · ');
            const deltaTxt = delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`;
            const deltaCls = delta == null ? '' : (delta > 0 ? ' is-up' : (delta < 0 ? ' is-down' : ''));

            if (titleEl) titleEl.innerHTML = htmlTituloHabito(cleanName, h.glyph, colorAcentoHabito(h));
            if (countEl) {
                const proximoRec = !h.enDescanso ? proximoInstanteRecordatorio(h) : null;
                countEl.innerHTML = proximoRec ? htmlCuentaAtrasHabito(fichaHabitoIndex, proximoRec, 18) : '';
            }
            if (metaEl) {
                const bits = [copiaNaturalezaHabito(h).metaCorta, etiquetaDiasHabito(h)];
                if (h.vecesPorSemana) {
                    const hechos = sellosRealesEnSemanaHasta(h, hoy, true);
                    bits.push(`${hechos} de ${h.vecesPorSemana} esta semana`);
                }
                if (momentos && naturalezaHabito(h) !== 'unaVez') bits.push(momentos);
                if (h.enDescanso) bits.push('Descansando');
                metaEl.textContent = bits.filter(Boolean).join(' · ');
            }

            if (naturalezaHabito(h) === 'unaVez') {
                const fechasUna = fechasUnicasDeHabito(h).map(parseIsoFechaLocal).filter(Boolean).sort((a, b) => a - b);
                const fechaAct = fechasUna.find(f => f >= hoy) || fechasUna[fechasUna.length - 1] || hoy;
                const momentoUna = (h.momentos || []).find(m => String(m).indexOf('U:') !== 0) || momentoDesdeHora(h.startTime) || 'CUALQUIER';
                const estado = estadoSelloEnFecha(h, fechaAct, momentoUna);
                const hecho = selloCuentaComoHecho(estado);
                const logUna = logsDeHabito(h)[0] || logs[0];
                const nota = logUna ? textoRitualLimpio(logUna.texto) : '';
                const img = logUna ? srcImagenHabito((logUna.imagenes && logUna.imagenes[0]) || logUna.image_url) : '';
                body.innerHTML = `
                    <div class="ficha-stack">
                        <div class="ficha-section">
                            <div class="ficha-sec-title">${svgPhosphorPorClave('calendar-dots', 16)}<span>Actividad puntual</span></div>
                            <div class="ficha-kpis">
                                <div class="ficha-kpi"><div class="ficha-kpi-n" style="font-size:0.95rem;">${escapeHtmlChat(etiquetaDiasHabito(h))}</div><div class="ficha-kpi-l">Cuándo</div></div>
                                <div class="ficha-kpi"><div class="ficha-kpi-n" style="font-size:0.95rem;">${hecho ? 'Hecha' : 'Pendiente'}</div><div class="ficha-kpi-l">Estado</div></div>
                            </div>
                        </div>
                        ${img || nota ? `<div class="ficha-section">
                            <div class="ficha-sec-title">${svgPhosphorPorClave('notebook', 16)}<span>Registro</span></div>
                            ${img ? `<img class="ficha-once-img" src="${htmlImgSrc(img)}" alt="">` : ''}
                            ${nota ? `<p class="ficha-once-note">${escapeHtmlChat(nota)}</p>` : ''}
                        </div>` : `<div class="ficha-section"><p class="ficha-once-empty">Sin foto ni nota todavía.</p></div>`}
                    </div>
                `;
                aplicarTemaGlobalHabitos(currentThemeHue);
                actualizarCuentasAtrasHabitos();
                return;
            }

            const monthDate = fichaHabitoMes || hoy;
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            let startDayOfWeek = offsetPrimeraCeldaMes(firstDayOfMonth);

            let calHtml = '';
            for (let i = 0; i < startDayOfWeek; i++) {
                calHtml += `<div class="calendar-day-cell" style="opacity:0.2"></div>`;
            }
            for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
                const cellDate = new Date(year, month, day);
                const key = claveDiaLocal(cellDate);
                const isFuture = cellDate > hoy;
                const prog = habitProgramadoEnFecha(h, cellDate);
                const done = doneSet.has(key);
                const logRecord = obtenerLogEnFecha(cleanName, cellDate);
                const skipped = logRecord && logEsOmitido(logRecord);
                const isToday = claveDiaLocal(cellDate) === claveDiaLocal(hoy);
                let cls = 'calendar-day-cell';
                if (isToday) cls += ' is-today';
                if (isFuture) cls += ' is-future';
                else if (!prog) cls += ' is-off';
                if (skipped) cls += ' is-skipped';
                else if (done) cls += ' is-done';
                let click = 'onclick="event.preventDefault(); event.stopPropagation();"';
                if (done && logRecord && logRecord.id) {
                    click = `onclick="abrirRegistroDesdeFicha('${jsStrHtml(logRecord.id)}', event)"`;
                }
                calHtml += `<div class="${cls}" ${click}><span>${day}</span><div class="cal-dot ${skipped ? 'skipped' : (done ? 'completed' : 'empty')}"></div></div>`;
            }

            const bars = series.map(s => {
                const hPct = Math.max(6, Math.round((s.valor / maxBar) * 100));
                return `<div class="ficha-bar-col"><span class="ficha-bar-n">${s.valor}</span><div class="ficha-bar-track"><div class="ficha-bar-fill" style="height:${hPct}%"></div></div><span class="ficha-bar-l">${s.label}</span></div>`;
            }).join('');

            body.innerHTML = `
                <div class="ficha-stack">
                    <div class="ficha-section">
                        <div class="ficha-kpis">
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${t30.pct}%</div><div class="ficha-kpi-l">30 días</div></div>
                            <div class="ficha-kpi"><div class="ficha-kpi-n${deltaCls}">${deltaTxt}</div><div class="ficha-kpi-l">vs mes ant.</div></div>
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${logs.length}</div><div class="ficha-kpi-l">Registros</div></div>
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${t30.ok}/${t30.prog || 0}</div><div class="ficha-kpi-l">Hechos</div></div>
                        </div>
                    </div>
                    <div class="ficha-section">
                        <div class="ficha-sec-title">${svgPhosphorPorClave('fire', 17)}<span>Rachas</span></div>
                        <div class="ficha-kpis">
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${rachas.actual}</div><div class="ficha-kpi-l">Actual</div></div>
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${rachas.maxima}</div><div class="ficha-kpi-l">Máxima</div></div>
                            <div class="ficha-kpi"><div class="ficha-kpi-n">${rachas.ultimaRota == null ? '—' : rachas.ultimaRota}</div><div class="ficha-kpi-l">Última rota</div></div>
                        </div>
                    </div>
                    <div class="ficha-section">
                        <div class="ficha-block-head">
                            <div class="ficha-sec-title">${svgPhosphorPorClave('clipboard-text', 16)}<span>Historial</span></div>
                            <div class="ficha-range">
                                <button type="button" class="ficha-range-btn ${fichaHabitoRango === 'semana' ? 'active' : ''}" onclick="cambiarRangoFichaHabito('semana')">Semana</button>
                                <button type="button" class="ficha-range-btn ${fichaHabitoRango === 'mes' ? 'active' : ''}" onclick="cambiarRangoFichaHabito('mes')">Mes</button>
                            </div>
                        </div>
                        <div class="ficha-bars">${bars}</div>
                    </div>
                    <div class="ficha-section ficha-cal">
                        <div class="ficha-sec-title">${svgPhosphorPorClave('calendar-dots', 16)}<span>Calendario</span></div>
                        <div class="calendar-month-container" onclick="event.stopPropagation()">
                            <div class="calendar-month-header">
                                <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesFichaHabito(-1)">‹</button>
                                <span>${monthNames[month]} ${year}</span>
                                <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesFichaHabito(1)">›</button>
                            </div>
                            <div class="calendar-weekdays-row">${etiquetasSemanaCortas().map(w => `<span>${w}</span>`).join('')}</div>
                            <div class="calendar-days-grid">${calHtml}</div>
                        </div>
                    </div>
                </div>
            `;
            aplicarTemaGlobalHabitos(currentThemeHue);
            actualizarCuentasAtrasHabitos();
        }

        function toggleMomentConfig(momento, el) {
            if (el && el.classList.contains('locked-pill')) return;
            const cual = selectedMomentsConfig.indexOf('CUALQUIER');
            if (cual > -1) selectedMomentsConfig.splice(cual, 1);
            const index = selectedMomentsConfig.indexOf(momento);
            if (index > -1) selectedMomentsConfig.splice(index, 1);
            else selectedMomentsConfig.push(momento);
            pintarPillsMomento('config');
        }

        function toggleDayConfig(day, el) {
            if (selectedMomentsConfig.includes('24/7')) return; 
            const index = selectedDaysConfig.indexOf(day);
            if (index > -1) {
                selectedDaysConfig.splice(index, 1);
                el.classList.remove('active');
            } else {
                selectedDaysConfig.push(day);
                el.classList.add('active');
            }
        }

        function revelarOpcionesRecordatorio(container) {
            if (!container || container.style.display === 'none') return;
            const body = container.closest('.sheet-body');
            const ir = () => {
                if (body) {
                    const max = Math.max(0, body.scrollHeight - body.clientHeight);
                    body.scrollTo({ top: max, behavior: 'smooth' });
                    return;
                }
                container.scrollIntoView({ behavior: 'smooth', block: 'end' });
            };
            requestAnimationFrame(() => requestAnimationFrame(ir));
        }

        function toggleReminderConfigPill() {
            configReminderActive = !configReminderActive;
            const pill = document.getElementById('reminder-toggle-pill');
            const container = document.getElementById('reminder-options-container');
            if(pill) pill.classList.toggle('active', configReminderActive);
            const esUnaVez = !!(tempSelectedHabit && (tempSelectedHabit.unaVez || tempSelectedHabit.tipo === 'Una vez'));
            if(container) {
                container.style.display = configReminderActive ? 'flex' : 'none';
                pintarLayoutRecordatorioConfig(esUnaVez);
            }
            if (configReminderActive) revelarOpcionesRecordatorio(container);
        }

        function pintarLayoutRecordatorioConfig(esUnaVez) {
            const onceOnly = document.getElementById('config-once-reminder-only');
            const ritualFields = document.getElementById('config-reminder-ritual-fields');
            if (onceOnly) onceOnly.classList.toggle('hidden', !esUnaVez);
            if (ritualFields) ritualFields.style.display = esUnaVez ? 'none' : 'flex';
        }

        function toggleEditReminderConfigPill() {
            editReminderActive = !editReminderActive;
            const pill = document.getElementById('edit-reminder-toggle-pill');
            const container = document.getElementById('edit-reminder-options-container');
            if(pill) pill.classList.toggle('active', editReminderActive);
            const h = habitToEditIndex != null ? misHabitos[habitToEditIndex] : null;
            if(container) container.style.display = (!habitEsUnaVez(h) && editReminderActive) ? 'flex' : 'none';
            if (editReminderActive) revelarOpcionesRecordatorio(container);
        }

        function toggleEditMoment(momento, el) {
            if (el && el.classList.contains('locked-pill')) return;
            const cual = editSelectedMoments.indexOf('CUALQUIER');
            if (cual > -1) editSelectedMoments.splice(cual, 1);
            const index = editSelectedMoments.indexOf(momento);
            if (index > -1) editSelectedMoments.splice(index, 1);
            else editSelectedMoments.push(momento);
            pintarPillsMomento('edit');
        }

        function pintarPillsMomento(modo) {
            const arr = modo === 'edit' ? editSelectedMoments : selectedMomentsConfig;
            const root = document.getElementById(modo === 'edit' ? 'edit-moment-selector' : 'moment-selector');
            if (!root) return;
            const isAny = arr.includes('CUALQUIER');
            root.querySelectorAll('[data-moment]').forEach(el => {
                const m = el.getAttribute('data-moment');
                if (m === 'ANY') el.classList.toggle('active', isAny && !arr.includes('24/7'));
                else if (m === '24/7') el.classList.toggle('active', arr.includes('24/7'));
                else el.classList.toggle('active', arr.includes(m));
            });
        }

        function toggleMomentAny(modo) {
            const arr = modo === 'edit' ? editSelectedMoments : selectedMomentsConfig;
            if (arr.includes('24/7')) return;
            const i = arr.indexOf('CUALQUIER');
            if (i > -1) {
                arr.splice(i, 1);
            } else {
                arr.length = 0;
                arr.push('CUALQUIER');
            }
            pintarPillsMomento(modo);
        }

        function toggleEditDay(day, el) {
            if (editSelectedMoments.includes('24/7')) return;
            const index = editSelectedDays.indexOf(day);
            if (index > -1) {
                editSelectedDays.splice(index, 1);
                el.classList.remove('active');
            } else {
                editSelectedDays.push(day);
                el.classList.add('active');
            }
        }

        function filtrarRutina(momento, el) {
            activeFilter = momento;
            document.querySelectorAll('#time-filters-container .filter-pill').forEach(p => p.classList.remove('active'));
            if(el) el.classList.add('active');
            aplicarTemaGlobalHabitos(currentThemeHue);
            renderizarMiRutina();
        }

        function abrirModalCrearHabito(naturaleza) {
            const leftover = document.getElementById('add-wish-modal');
            if (leftover) leftover.classList.remove('active');
            const modal = document.getElementById('add-habit-modal');
            if(modal) modal.classList.add('active');
            
            document.getElementById('modal-view-blocks').classList.remove('hidden');
            document.getElementById('modal-view-habits').classList.add('hidden');
            const mainSearch = document.getElementById('habit-search-main');
            if(mainSearch) mainSearch.value = '';
            bloqueActualSeleccionado = null;
            catalogoNaturaleza = naturaleza === 'deseo' ? 'deseo' : (naturaleza === 'abstinencia' ? 'abstinencia' : 'ritual');
            const due = document.getElementById('wish-due-date');
            if (due) due.value = '';
            const wishName = document.getElementById('config-wish-nombre');
            if (wishName) wishName.value = '';
            pintarEtiquetaFechaDeseo();
            sincronizarNaturalezaCatalogo();
            renderizarBloquesHabitos();
        }

        function htmlArteBloqueHabitos(bloque) {
            const keys = ((bloque.iconos || []).filter(k => PH_ICON_PATHS[k])).slice(0, 4);
            if (!keys.length) keys.push('sparkle');
            const frames = keys.map((k, i) => `<span class="block-rect-frame${i === 0 ? ' is-on' : ''}">${svgPhosphorPorClave(k, 28)}</span>`).join('');
            return `<div class="catalog-item-main" style="flex:1; min-width:0;">
                <div class="block-rect-art" data-frame="0">${frames}</div>
                <div class="block-rect-title">${bloque.titulo}</div>
            </div>
            <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
        }

        function habitoDeCatalogoPorNombre(nombre) {
            const n = cleanHabitName(nombre);
            for (let i = 0; i < bloquesHabitos.length; i++) {
                const h = (bloquesHabitos[i].habitos || []).find(x => cleanHabitName(x.nombre) === n);
                if (h) return h;
            }
            return null;
        }

        /** Hábito/abstinencia/actividad del catálogo integrado (no creado por el usuario). */
        function esHabitoCatalogoDefecto(nombre) {
            const n = cleanHabitName(nombre);
            if (!n) return false;
            if (habitoDeCatalogoPorNombre(n)) return true;
            if (esNombreDeseoUnicoCatalogo(n)) return true;
            return false;
        }

        function limpiarCatalogoPersonalIntegrado() {
            let changed = false;
            ['rituales', 'abstinencias', 'unaVez'].forEach(bucket => {
                if (!Array.isArray(catalogoPersonal[bucket])) return;
                const before = catalogoPersonal[bucket].length;
                catalogoPersonal[bucket] = catalogoPersonal[bucket].filter(x => !esHabitoCatalogoDefecto(x.nombre));
                if (catalogoPersonal[bucket].length !== before) changed = true;
            });
            if (changed) guardarEstadoLocal();
        }

        function catalogoItemsAbstinencia() {
            const out = [];
            (bloquesHabitos || []).forEach(b => {
                (b.habitos || []).forEach(h => {
                    if (h && h.permite247 && habitEsAbstinencia(h)) out.push(h);
                });
            });
            return out;
        }

        function htmlItemCatalogoHabito(h) {
            return `
                <div class="catalog-item" onclick="seleccionarHabitoDesdeCatalogoDefecto('${jsStrHtml(h.nombre)}', '${jsStrHtml(h.tipo)}', ${!!h.permite247})">
                    <div class="catalog-item-main">
                        ${htmlGlifoHabito(h.nombre, 20, h.glyph, colorAcentoHabito(h))}
                        <div class="catalog-item-title">${escapeHtmlChat(cleanHabitName(h.nombre))}</div>
                    </div>
                    <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            `;
        }

        function ordenarCatalogoPorNombre(items, getNombre) {
            return (items || []).slice().sort((a, b) =>
                cleanHabitName(getNombre(a)).localeCompare(cleanHabitName(getNombre(b)), 'es')
            );
        }

        function normalizarEntradaCatalogoPersonal(x) {
            const nombre = cleanHabitName((x && x.nombre) || '');
            if (!nombre) return null;
            const bgRaw = String((x && x.bgColor) || '').trim();
            return {
                nombre,
                glyph: glyphElegidoUsuario(x && x.glyph) || '',
                bgColor: bgRaw && !/^#10151f$/i.test(bgRaw) ? bgRaw : '',
                tipo: String((x && x.tipo) || '').trim()
            };
        }

        function htmlItemCatalogoMerged(item) {
            if (item && item._origen === 'personal') {
                return htmlItemCatalogoPersonal(
                    { nombre: item.nombre, glyph: item.glyph, bgColor: item.bgColor },
                    item._naturaleza || 'ritual'
                );
            }
            return htmlItemCatalogoHabito(item);
        }

        function itemsCatalogoAbstinenciaMerged(filtroTexto) {
            const q = String(filtroTexto || '').toLowerCase().trim();
            const defecto = catalogoItemsAbstinencia().map(h => ({ ...h, _origen: 'defecto' }));
            const personal = itemsCatalogoPersonalDisponibles('abstinencia').map(item => ({
                nombre: cleanHabitName(item.nombre),
                tipo: item.tipo || 'Abstinencia',
                permite247: true,
                glyph: item.glyph || '',
                bgColor: item.bgColor || '',
                _origen: 'personal',
                _naturaleza: 'abstinencia'
            }));
            const seen = {};
            let all = [];
            personal.concat(defecto).forEach(x => {
                const k = claveNombreHabito(x.nombre);
                if (!k || seen[k]) return;
                seen[k] = true;
                all.push(x);
            });
            if (q) all = all.filter(x => x.nombre.toLowerCase().includes(q));
            return ordenarCatalogoPorNombre(all, x => x.nombre);
        }

        function tituloBloquePorId(id) {
            const bloque = (bloquesHabitos || []).find(b => b.id === id);
            return bloque ? bloque.titulo : '';
        }

        function tipoBloqueCatalogoPersonal(item) {
            let tipo = String((item && item.tipo) || '').trim();
            if (tipo && tipo !== 'Ritual' && tipo !== 'Abstinencia' && tipo !== 'Una vez') return tipo;
            const h = typeof habitoPorNombre === 'function' ? habitoPorNombre(item.nombre) : null;
            if (h) {
                const ht = String(h.tipo || '').trim();
                if (ht && ht !== 'Ritual' && ht !== 'Una vez' && ht !== 'Abstinencia') return ht;
            }
            return '';
        }

        function ritualPerteneceABloque(item, bloque) {
            if (!bloque) return false;
            return tipoBloqueCatalogoPersonal(item) === bloque.titulo;
        }

        function repararTiposCatalogoPersonalRituales() {
            let changed = false;
            (catalogoPersonal.rituales || []).forEach(item => {
                const actual = String(item.tipo || '').trim();
                if (actual && actual !== 'Ritual') return;
                const inferido = tipoBloqueCatalogoPersonal(item);
                if (inferido && inferido !== actual) {
                    item.tipo = inferido;
                    changed = true;
                }
            });
            if (changed) guardarEstadoLocal();
        }

        function sincronizarTipoBloqueConfig() {
            if (!tempSelectedHabit || tempSelectedHabit.unaVez || tempSelectedHabit.permite247) return;
            if (!necesitaSelectorBloque(tempSelectedHabit)) return;
            const titulo = tituloBloquePorId(configBloqueId);
            if (titulo) tempSelectedHabit.tipo = titulo;
        }

        function itemsCatalogoRitualBloqueMerged(bloque, filtroTexto) {
            if (!bloque) return [];
            const q = String(filtroTexto || '').toLowerCase().trim();
            const defecto = (bloque.habitos || []).map(h => ({ ...h, _origen: 'defecto' }));
            const personal = itemsCatalogoPersonal('ritual')
                .filter(item => ritualPerteneceABloque(item, bloque))
                .map(item => ({
                    nombre: cleanHabitName(item.nombre),
                    tipo: tipoBloqueCatalogoPersonal(item) || bloque.titulo,
                    permite247: false,
                    glyph: item.glyph || '',
                    bgColor: item.bgColor || '',
                    _origen: 'personal',
                    _naturaleza: 'ritual'
                }));
            const seen = {};
            let all = [];
            personal.concat(defecto).forEach(x => {
                const k = claveNombreHabito(x.nombre);
                if (!k || seen[k]) return;
                seen[k] = true;
                all.push(x);
            });
            if (q) all = all.filter(x => x.nombre.toLowerCase().includes(q));
            return ordenarCatalogoPorNombre(all, x => x.nombre);
        }

        function itemsCatalogoRitualBusquedaMerged(filtroTexto) {
            const q = String(filtroTexto || '').toLowerCase().trim();
            if (!q) return [];
            const defecto = [];
            (bloquesHabitos || []).forEach(b => {
                (b.habitos || []).forEach(h => {
                    if (h.nombre.toLowerCase().includes(q)) defecto.push({ ...h, _origen: 'defecto' });
                });
            });
            const personal = itemsCatalogoPersonal('ritual')
                .filter(item => cleanHabitName(item.nombre).toLowerCase().includes(q))
                .map(item => ({
                    nombre: cleanHabitName(item.nombre),
                    tipo: tipoBloqueCatalogoPersonal(item) || '',
                    permite247: false,
                    glyph: item.glyph || '',
                    bgColor: item.bgColor || '',
                    _origen: 'personal',
                    _naturaleza: 'ritual'
                }));
            const seen = {};
            let all = [];
            personal.concat(defecto).forEach(x => {
                const k = claveNombreHabito(x.nombre);
                if (!k || seen[k]) return;
                seen[k] = true;
                all.push(x);
            });
            return ordenarCatalogoPorNombre(all, x => x.nombre);
        }

        function bucketCatalogoPersonal(naturaleza) {
            if (naturaleza === 'unaVez' || naturaleza === 'deseo') return 'unaVez';
            if (naturaleza === 'abstinencia') return 'abstinencias';
            return 'rituales';
        }

        function entradaCatalogoPersonal(nombre, naturaleza) {
            const bucket = bucketCatalogoPersonal(naturaleza);
            const clave = claveNombreHabito(nombre);
            if (!clave || !catalogoPersonal[bucket]) return null;
            return catalogoPersonal[bucket].find(x => claveNombreHabito(x.nombre) === clave) || null;
        }

        function itemsCatalogoPersonal(naturaleza) {
            const bucket = bucketCatalogoPersonal(naturaleza);
            return ordenarCatalogoPorNombre(catalogoPersonal[bucket] || [], x => x.nombre);
        }

        function habitActivoEnAgendaPorNombre(nombre) {
            const h = typeof habitoPorNombre === 'function' ? habitoPorNombre(nombre) : null;
            return !!(h && !habitEsArchivado(h));
        }

        /** Plantillas del usuario listas para elegir (no las que ya están activas en agenda). */
        function itemsCatalogoPersonalDisponibles(naturaleza) {
            return itemsCatalogoPersonal(naturaleza).filter(item => !habitActivoEnAgendaPorNombre(item.nombre));
        }

        function idMenuCatalogoPersonal(nombre, naturaleza) {
            const raw = String(naturaleza || '') + ':' + claveNombreHabito(nombre);
            return 'ctx-cat-' + raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 72);
        }

        function htmlItemCatalogoPersonal(item, naturaleza) {
            const nombre = cleanHabitName(item.nombre);
            const glyph = glyphElegidoUsuario(item.glyph || '') || '';
            const color = colorAcentoHabito({ bgColor: item.bgColor || '' });
            const menuId = idMenuCatalogoPersonal(nombre, naturaleza);
            const editIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
            const trashIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
            return `
                <div class="catalog-item catalog-item-personal">
                    <button type="button" class="catalog-item-pick" onclick="seleccionarHabitoDesdeCatalogoPersonal('${jsStrHtml(nombre)}', '${jsStrHtml(naturaleza)}')">
                        <span class="catalog-item-main">
                            ${htmlGlifoHabito(nombre, 20, glyph, color)}
                            <span class="catalog-item-title">${escapeHtmlChat(nombre)}</span>
                        </span>
                    </button>
                    <button type="button" class="habit-options-btn" onclick="toggleContextMenu(event, '${menuId}')" aria-label="Opciones">⋯</button>
                    <div id="${menuId}" class="habit-context-menu">
                        <button type="button" class="ctx-item" onclick="editarEntradaCatalogoPersonal('${jsStrHtml(nombre)}', '${jsStrHtml(naturaleza)}')">${editIcon} Editar</button>
                        <button type="button" class="ctx-item" style="color:#f87171;" onclick="solicitarEliminarDelCatalogoPersonal('${jsStrHtml(nombre)}', '${jsStrHtml(naturaleza)}')">${trashIcon} Eliminar</button>
                    </div>
                </div>
            `;
        }

        let catalogoEditMode = null;

        function resetBotonConfigurarHabito() {
            const btn = document.querySelector('#configure-habit-modal .modal-actions .btn-continue');
            if (btn) btn.textContent = 'Añadir';
        }

        function seleccionarHabitoDesdeCatalogoPersonal(nombre, naturaleza) {
            catalogoEditMode = null;
            resetBotonConfigurarHabito();
            const entry = entradaCatalogoPersonal(nombre, naturaleza);
            const esUnaVez = naturaleza === 'unaVez' || naturaleza === 'deseo';
            const permite247 = naturaleza === 'abstinencia';
            const tipo = esUnaVez ? 'Una vez' : (permite247 ? 'Abstinencia' : 'Ritual');
            seleccionarHabitoContextual(nombre, tipo, permite247, { origenCatalogo: 'personal' });
            if (!tempSelectedHabit) return;
            if (entry && entry.tipo && !esUnaVez && !permite247) {
                tempSelectedHabit.tipo = entry.tipo;
                const bloque = (bloquesHabitos || []).find(b => b.titulo === entry.tipo);
                if (bloque) configBloqueId = bloque.id;
            }
            if (entry && entry.glyph && PH_ICON_PATHS[entry.glyph]) {
                configGlyph = entry.glyph;
                glyphPickerTouched = true;
            }
            if (entry && entry.bgColor) {
                configAccent = colorAcentoHabito({ bgColor: entry.bgColor }) || entry.bgColor || '';
            }
            pintarPreviewLook('config');
        }

        function editarEntradaCatalogoPersonal(nombre, naturaleza) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            const entry = entradaCatalogoPersonal(nombre, naturaleza);
            if (!entry) return;
            catalogoEditMode = { nombre: cleanHabitName(nombre), naturaleza };
            const esUnaVez = naturaleza === 'unaVez' || naturaleza === 'deseo';
            const permite247 = naturaleza === 'abstinencia';
            const tipo = esUnaVez ? 'Una vez' : (permite247 ? 'Abstinencia' : 'Ritual');
            seleccionarHabitoContextual(nombre, tipo, permite247, { catalogEdit: true, origenCatalogo: 'personal' });
            if (!tempSelectedHabit) {
                catalogoEditMode = null;
                return;
            }
            if (entry && entry.tipo && !esUnaVez && !permite247) {
                tempSelectedHabit.tipo = entry.tipo;
                const bloque = (bloquesHabitos || []).find(b => b.titulo === entry.tipo);
                if (bloque) configBloqueId = bloque.id;
            }
            if (entry && entry.glyph && PH_ICON_PATHS[entry.glyph]) {
                configGlyph = entry.glyph;
                glyphPickerTouched = true;
            }
            if (entry && entry.bgColor) {
                configAccent = colorAcentoHabito({ bgColor: entry.bgColor }) || entry.bgColor || '';
            }
            pintarPreviewLook('config');
            const cfgTitle = document.querySelector('#configure-habit-modal .modal-header span');
            if (cfgTitle) cfgTitle.textContent = 'Editar en la lista';
            const btn = document.querySelector('#configure-habit-modal .modal-actions .btn-continue');
            if (btn) btn.textContent = 'Guardar';
            ['once-section-wrapper', 'moment-section-wrapper', 'days-section-wrapper', 'reminder-toggle-pill-wrapper', 'config-bloque-section', 'config-once-reminder-only'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.classList.add('hidden');
                el.style.display = 'none';
            });
            const remOpts = document.getElementById('reminder-options-container');
            if (remOpts) remOpts.style.display = 'none';
        }

        function guardarEdicionCatalogoPersonal(habitCleanName, glyph, bgColor) {
            if (!catalogoEditMode) return false;
            const nat = catalogoEditMode.naturaleza;
            const oldName = catalogoEditMode.nombre;
            const bucket = bucketCatalogoPersonal(nat);
            const claveOld = claveNombreHabito(oldName);
            const prev = (catalogoPersonal[bucket] || []).find(x => claveNombreHabito(x.nombre) === claveOld);
            if (catalogoPersonal[bucket]) {
                catalogoPersonal[bucket] = catalogoPersonal[bucket].filter(x => claveNombreHabito(x.nombre) !== claveOld);
            }
            catalogoEditMode = null;
            registrarCatalogoPersonal(habitCleanName, nat, {
                glyph,
                bgColor,
                tipo: (prev && prev.tipo) || (tempSelectedHabit && tempSelectedHabit.tipo) || ''
            });
            resetBotonConfigurarHabito();
            document.getElementById('configure-habit-modal').classList.remove('active');
            tempSelectedHabit = null;
            renderizarBloquesHabitos();
            mostrarToastLujo('Lista actualizada', { tipo: 'exito' });
            return true;
        }

        function solicitarEliminarDelCatalogoPersonal(nombre, naturaleza) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            resetConfirmModalButtons();
            document.getElementById('confirm-modal-title').textContent = 'Eliminar de la lista';
            document.getElementById('confirm-modal-text').textContent =
                'Se quita de «Añadir». No afecta a la agenda si ya lo tenías activo.';
            confirmModalAction = () => eliminarDelCatalogoPersonal(nombre, naturaleza);
            document.getElementById('confirm-modal').classList.add('active');
        }

        function eliminarDelCatalogoPersonal(nombre, naturaleza) {
            const bucket = bucketCatalogoPersonal(naturaleza);
            const clave = claveNombreHabito(nombre);
            if (!clave || !catalogoPersonal[bucket]) return;
            const before = catalogoPersonal[bucket].length;
            catalogoPersonal[bucket] = catalogoPersonal[bucket].filter(x => claveNombreHabito(x.nombre) !== clave);
            if (catalogoPersonal[bucket].length === before) return;
            guardarEstadoLocal();
            renderizarBloquesHabitos();
            mostrarToastLujo('Eliminado de la lista', { tipo: 'exito' });
        }

        function htmlItemCatalogoDeseoUnico(h) {
            return `
                <div class="catalog-item" onclick="abrirConfigurarDeseo('${jsStrHtml(h.nombre)}')">
                    <div class="catalog-item-main">
                        ${htmlGlifoHabito(h.nombre, 20, h.glyph, colorAcentoHabito(h))}
                        <div class="catalog-item-title">${escapeHtmlChat(cleanHabitName(h.nombre))}</div>
                    </div>
                    <svg class="settings-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            `;
        }

        function etiquetaBloqueCorto(bloque) {
            const map = { salud: 'Salud', mente: 'Mente', organizacion: 'Organización', desconexion: 'Desconexión' };
            return map[bloque.id] || bloque.titulo.split(' ')[0];
        }

        function necesitaSelectorBloque(habit) {
            if (!habit) return false;
            if (habit.unaVez || habit.tipo === 'Una vez') return false;
            if (habit.permite247 || habit.tipo === 'Abstinencia') return false;
            return !(bloquesHabitos || []).some(b => b.titulo === habit.tipo);
        }

        function pintarSelectorBloqueConfig() {
            const wrap = document.getElementById('config-bloque-section');
            const root = document.getElementById('config-bloque-selector');
            if (!wrap || !root) return;
            const show = necesitaSelectorBloque(tempSelectedHabit);
            wrap.classList.toggle('hidden', !show);
            if (!show) return;
            if (!configBloqueId && bloquesHabitos.length) {
                configBloqueId = bloquesHabitos[0].id;
                tempSelectedHabit.tipo = bloquesHabitos[0].titulo;
            }
            root.innerHTML = bloquesHabitos.map(b =>
                `<button type="button" class="config-pill${configBloqueId === b.id ? ' active' : ''}" data-bloque="${b.id}" onclick="elegirBloqueConfig('${b.id}', this)">${escapeHtmlChat(etiquetaBloqueCorto(b))}</button>`
            ).join('');
        }

        function elegirBloqueConfig(id, el) {
            configBloqueId = id;
            const bloque = bloquesHabitos.find(b => b.id === id);
            if (bloque && tempSelectedHabit) tempSelectedHabit.tipo = bloque.titulo;
            document.querySelectorAll('#config-bloque-selector .config-pill').forEach(p => p.classList.remove('active'));
            if (el) el.classList.add('active');
        }

        function esNombreDeseoUnicoCatalogo(nombre) {
            const k = claveNombreHabito(nombre);
            if (!k) return false;
            return (catalogoHabitos.deseosUnicos || []).some(h => claveNombreHabito(h.nombre) === k);
        }

        function esNombreDeseoUsuario(nombre) {
            const k = claveNombreHabito(nombre);
            if (!k) return false;
            return (misDeseos || []).some(d => claveNombreHabito(d.nombre) === k);
        }

        function registrarCatalogoPersonal(nombre, naturaleza, extra) {
            const n = cleanHabitName(nombre);
            if (!n) return;
            if (naturaleza === 'unaVez' || naturaleza === 'deseo') {
                if (esNombreDeseoUnicoCatalogo(n) || esNombreDeseoUsuario(n)) return;
            }
            if (esHabitoCatalogoDefecto(n)) return;
            const clave = claveNombreHabito(n);
            const bucket = bucketCatalogoPersonal(naturaleza);
            if (!catalogoPersonal[bucket]) catalogoPersonal[bucket] = [];
            const glyph = glyphElegidoUsuario((extra && extra.glyph) || '');
            const bgRaw = String((extra && extra.bgColor) || '').trim();
            const bgColor = bgRaw && !/^#10151f$/i.test(bgRaw) ? bgRaw : '';
            const tipo = String((extra && extra.tipo) || '').trim();
            const existing = catalogoPersonal[bucket].find(x => claveNombreHabito(x.nombre) === clave);
            if (existing) {
                if (glyph) existing.glyph = glyph;
                if (bgColor) existing.bgColor = bgColor;
                if (tipo) existing.tipo = tipo;
                existing.nombre = n;
                guardarEstadoLocal();
                return;
            }
            catalogoPersonal[bucket].push({ nombre: n, glyph, bgColor, tipo });
            guardarEstadoLocal();
        }

        function itemsCatalogoUnaVez() {
            return itemsCatalogoPersonalDisponibles('unaVez').filter(h => {
                const n = cleanHabitName(h.nombre);
                if (!n) return false;
                if (esNombreDeseoUnicoCatalogo(n) || esNombreDeseoUsuario(n)) return false;
                if (String((habitoPorNombre(n) || {}).tipo || '').toLowerCase().indexOf('deseo') !== -1) return false;
                return true;
            });
        }

        function renderizarCatalogoUnaVez() {
            const list = document.getElementById('global-search-results');
            if (!list) return;
            // Limpia residuos de cuando el catálogo de deseos se mezcló con «Una vez».
            if (Array.isArray(catalogoPersonal.unaVez)) {
                const before = catalogoPersonal.unaVez.length;
                catalogoPersonal.unaVez = catalogoPersonal.unaVez.filter(h =>
                    !esNombreDeseoUnicoCatalogo(h.nombre) && !esNombreDeseoUsuario(h.nombre)
                );
                if (catalogoPersonal.deseos) delete catalogoPersonal.deseos;
                if (catalogoPersonal.unaVez.length !== before) guardarEstadoLocal();
            }
            const searchInput = document.getElementById('habit-search-main');
            const filtroTexto = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const items = itemsCatalogoUnaVez().filter(h => h.nombre.toLowerCase().includes(filtroTexto));
            if (!items.length) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.82rem; font-weight: 600;">${filtroTexto ? 'No hay actividades con ese nombre.' : 'Cita, recado, gestión… Crea la primera con «Crear nuevo».'}</div>`;
                return;
            }
            list.innerHTML = items.map(h => htmlItemCatalogoPersonal(h, 'unaVez')).join('');
        }

        function elegirNaturalezaCatalogo(tipo) {
            catalogoNaturaleza = tipo === 'abstinencia' ? 'abstinencia' : (tipo === 'deseo' ? 'deseo' : 'ritual');
            sincronizarNaturalezaCatalogo();
            const viewHabits = document.getElementById('modal-view-habits');
            if (viewHabits && !viewHabits.classList.contains('hidden')) volverABloquesHabitos();
            else renderizarBloquesHabitos();
        }

        function sincronizarNaturalezaCatalogo() {
            document.querySelectorAll('#catalog-naturaleza .nat-card').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-nat') === catalogoNaturaleza);
            });
            const esUnaVez = catalogoNaturaleza === 'deseo';
            const crear = document.getElementById('catalog-crear-mio');
            if (crear) crear.classList.remove('hidden');
            const crearSub = document.getElementById('catalog-crear-sub');
            if (crearSub) {
                crearSub.textContent = esUnaVez
                    ? 'Este día, a esta hora. Médico, recado, cita.'
                    : (catalogoNaturaleza === 'abstinencia'
                        ? 'Nombre y el impulso que quieres cortar.'
                        : 'Nombre, días y tu propio ritmo.');
            }
            const natCopy = document.getElementById('catalog-naturaleza-copy');
            if (natCopy) {
                const next = esUnaVez
                    ? 'Algo puntual: este día, a esta hora. Médico, recado, cita.'
                    : (catalogoNaturaleza === 'abstinencia'
                        ? 'Empieza sellada. Solo la marcas si recaes o fallas.'
                        : 'Se repite. Mañana, tarde o noche. Días fijos o veces por semana.');
                if (natCopy.textContent !== next) {
                    natCopy.style.opacity = '0';
                    window.setTimeout(() => {
                        natCopy.textContent = next;
                        natCopy.style.opacity = '1';
                    }, 120);
                }
            }
            const viewBlocks = document.getElementById('modal-view-blocks');
            const viewHabits = document.getElementById('modal-view-habits');
            if (esUnaVez) {
                if (viewBlocks) viewBlocks.classList.remove('hidden');
                if (viewHabits) {
                    viewHabits.classList.add('hidden');
                    viewHabits.style.display = 'none';
                }
            } else if (viewHabits && viewHabits.classList.contains('hidden') && viewBlocks) {
                viewBlocks.classList.remove('hidden');
            }
            const search = document.getElementById('habit-search-main');
            if (search) {
                search.placeholder = esUnaVez
                    ? 'Buscar actividad...'
                    : (catalogoNaturaleza === 'abstinencia' ? 'Buscar abstinencia...' : 'Buscar hábito...');
            }
        }

        function abrirCreacionLibreCatalogo() {
            const esUnaVez = catalogoNaturaleza === 'deseo';
            const permite247 = catalogoNaturaleza === 'abstinencia';
            seleccionarHabitoContextual('', esUnaVez ? 'Una vez' : (permite247 ? 'Abstinencia' : 'Ritual'), permite247, { origenCatalogo: 'usuario' });
            if (!esUnaVez && !permite247 && bloqueActualSeleccionado) {
                configBloqueId = bloqueActualSeleccionado.id;
                if (tempSelectedHabit) tempSelectedHabit.tipo = bloqueActualSeleccionado.titulo;
                pintarSelectorBloqueConfig();
            }
            const nameEl = document.getElementById('config-habit-nombre');
            if (nameEl) {
                nameEl.value = '';
                nameEl.focus();
            }
        }

        function abrirCreacionLibreDeseo() {
            abrirConfigurarDeseo('');
        }

        function abrirConfigurarDeseo(nombre) {
            const nameEl = document.getElementById('config-wish-nombre');
            if (nameEl) {
                nameEl.value = recortarTexto(cleanHabitName(nombre), AWAKE_LIMITE_HABITO);
            }
            const due = document.getElementById('wish-due-date');
            if (due) due.value = '';
            pintarEtiquetaFechaDeseo();
            const modal = document.getElementById('configure-wish-modal');
            if (modal) modal.classList.add('active');
            if (nameEl && !nombre) {
                setTimeout(() => { try { nameEl.focus(); } catch (e) {} }, 40);
            }
        }

        function cerrarConfigurarDeseo() {
            cerrarAwakePick();
            const modal = document.getElementById('configure-wish-modal');
            if (modal) modal.classList.remove('active');
        }

        function guardarDeseoConfigurado() {
            const el = document.getElementById('config-wish-nombre');
            const nombre = el ? el.value.trim() : '';
            if (!nombre) {
                mostrarToastLujo('Escribe un nombre.', { tipo: 'error' });
                if (el) el.focus();
                return;
            }
            seleccionarDeseoUnico(nombre);
        }

        function pintarHintAbstinencia(idHint, nombre) {
            const el = document.getElementById(idHint);
            if (!el) return;
            el.classList.toggle('hidden', !habitEsAbstinencia({ nombre }));
        }

        let bloqueIconosTimer = null;
        function pararCicloIconosBloques() {
            if (bloqueIconosTimer) {
                clearInterval(bloqueIconosTimer);
                bloqueIconosTimer = null;
            }
        }
        function arrancarCicloIconosBloques() {
            pararCicloIconosBloques();
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const arts = document.querySelectorAll('#blocks-stack-container .block-rect-art');
            if (!arts.length) return;
            arts.forEach((art, i) => { art.dataset.frame = String(i % Math.max(1, art.querySelectorAll('.block-rect-frame').length)); });
            arts.forEach(art => {
                const frames = art.querySelectorAll('.block-rect-frame');
                const i = Number(art.dataset.frame || 0) % frames.length;
                frames.forEach((f, n) => f.classList.toggle('is-on', n === i));
            });
            bloqueIconosTimer = setInterval(() => {
                document.querySelectorAll('#blocks-stack-container .block-rect-art').forEach(art => {
                    const frames = art.querySelectorAll('.block-rect-frame');
                    if (frames.length < 2) return;
                    let i = Number(art.dataset.frame || 0) % frames.length;
                    frames[i].classList.remove('is-on');
                    i = (i + 1) % frames.length;
                    frames[i].classList.add('is-on');
                    art.dataset.frame = String(i);
                });
            }, 1800);
        }

        function renderizarBloquesHabitos() {
            const stackContainer = document.getElementById('blocks-stack-container');
            const searchResults = document.getElementById('global-search-results');
            const searchInput = document.getElementById('habit-search-main');
            
            if(!stackContainer) return;
            limpiarCatalogoPersonalIntegrado();
            repararTiposCatalogoPersonalRituales();
            sincronizarNaturalezaCatalogo();
            
            const filtroTexto = searchInput ? searchInput.value.toLowerCase().trim() : '';

            if (catalogoNaturaleza === 'deseo') {
                pararCicloIconosBloques();
                stackContainer.style.display = 'none';
                if (searchResults) {
                    searchResults.style.display = 'flex';
                    renderizarCatalogoUnaVez();
                }
                return;
            }

            if (catalogoNaturaleza === 'abstinencia') {
                pararCicloIconosBloques();
                stackContainer.style.display = 'none';
                if (searchResults) {
                    searchResults.style.display = 'flex';
                    const items = itemsCatalogoAbstinenciaMerged(filtroTexto);
                    if (!items.length) {
                        searchResults.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem; font-weight: 600;">No hay abstinencias${filtroTexto ? ' con ese nombre' : ''}.</div>`;
                    } else {
                        searchResults.innerHTML = items.map(htmlItemCatalogoMerged).join('');
                    }
                }
                return;
            }

            if (filtroTexto.length > 0) {
                pararCicloIconosBloques();
                stackContainer.style.display = 'none';
                if(searchResults) {
                    searchResults.style.display = 'flex';
                    const items = itemsCatalogoRitualBusquedaMerged(filtroTexto);
                    if (!items.length) {
                        searchResults.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem; font-weight: 600;">No se encontraron hábitos con ese nombre.</div>`;
                    } else {
                        searchResults.innerHTML = items.map(htmlItemCatalogoMerged).join('');
                    }
                }
                return;
            }

            if(searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            stackContainer.style.display = 'flex';
            stackContainer.innerHTML = '';

            bloquesHabitos.forEach(bloque => {
                const card = document.createElement('div');
                card.className = 'block-rect-card';
                card.dataset.block = bloque.id;
                card.onclick = () => seleccionarBloqueHabitos(bloque.id);

                card.innerHTML = htmlArteBloqueHabitos(bloque);
                stackContainer.appendChild(card);
            });
            aplicarTemaGlobalHabitos(currentThemeHue);
            arrancarCicloIconosBloques();
        }

        function filtrarCatalogoGeneral() {
            renderizarBloquesHabitos();
        }

        function seleccionarBloqueHabitos(blockId) {
            bloqueActualSeleccionado = bloquesHabitos.find(b => b.id === blockId);
            if(!bloqueActualSeleccionado) return;

            document.getElementById('modal-view-blocks').classList.add('hidden');
            const viewHabits = document.getElementById('modal-view-habits');
            viewHabits.classList.remove('hidden');
            viewHabits.style.display = 'flex';
            
            const searchInput = document.getElementById('habit-search');
            if(searchInput) searchInput.value = '';
            
            renderizarCatalogoBloque();
        }

        function volverABloquesHabitos() {
            bloqueActualSeleccionado = null;
            document.getElementById('modal-view-habits').classList.add('hidden');
            document.getElementById('modal-view-blocks').classList.remove('hidden');
            renderizarBloquesHabitos();
        }

        function cerrarOVolverModalHabito() {
            const viewHabits = document.getElementById('modal-view-habits');
            if (viewHabits && !viewHabits.classList.contains('hidden')) {
                volverABloquesHabitos();
            } else {
                document.getElementById('add-habit-modal').classList.remove('active');
            }
        }

        function filtrarCatalogoBloque() { renderizarCatalogoBloque(); }

        function renderizarCatalogoBloque() {
            const list = document.getElementById('catalog-list');
            if(!list || !bloqueActualSeleccionado) return;
            repararTiposCatalogoPersonalRituales();
            list.innerHTML = '';
            
            const searchInput = document.getElementById('habit-search');
            const filtroTexto = searchInput ? searchInput.value.toLowerCase() : '';
            const items = itemsCatalogoRitualBloqueMerged(bloqueActualSeleccionado, filtroTexto);

            if (items.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.82rem; font-weight: 600;">No se encontraron elementos en este bloque.</div>`;
                return;
            }

            list.innerHTML = items.map(htmlItemCatalogoMerged).join('');
        }

        function abrirModalCrearDeseo() {
            const leftover = document.getElementById('add-habit-modal');
            if (leftover) leftover.classList.remove('active');
            cerrarConfigurarDeseo();
            const modal = document.getElementById('add-wish-modal');
            if (modal) modal.classList.add('active');
            const search = document.getElementById('wish-search');
            if (search) search.value = '';
            renderizarCatalogoDeseosModal();
        }

        function cerrarModalCrearDeseo() {
            cerrarConfigurarDeseo();
            const modal = document.getElementById('add-habit-modal');
            if (modal) modal.classList.remove('active');
            const leftover = document.getElementById('add-wish-modal');
            if (leftover) leftover.classList.remove('active');
            const searchMain = document.getElementById('habit-search-main');
            if (searchMain) searchMain.value = '';
            const searchWish = document.getElementById('wish-search');
            if (searchWish) searchWish.value = '';
        }

        async function seleccionarDeseoUnico(nombre) {
            if (wishAddInFlight) return;
            const limpio = recortarTexto(cleanHabitName(nombre), AWAKE_LIMITE_HABITO);
            if ((misDeseos || []).some(d => !d.completado && cleanHabitName(d.nombre) === limpio)) {
                cerrarModalCrearDeseo();
                mostrarToastLujo('Ese deseo ya está en tu lista.', { tipo: 'error' });
                renderizarListaDeseos();
                return;
            }
            wishAddInFlight = true;
            const nuevo = {
                id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                nombre: limpio,
                fecha: new Date().toLocaleDateString(),
                completado: false,
                comentario: '',
                imagen: null,
                puntuacion: null,
                fechaObjetivo: (document.getElementById('wish-due-date') || {}).value || null
            };
            misDeseos.push(nuevo);
            cerrarModalCrearDeseo();
            renderizarListaDeseos();
            try {
                await persistirDeseoNube(nuevo);
                misDeseos = deduplicarDeseos(misDeseos);
                guardarEstadoLocal();
                avisarDiarioRemoto();
                renderizarListaDeseos();
            } finally {
                wishAddInFlight = false;
            }
        }

        function filtrarCatalogoDeseos() { renderizarCatalogoDeseosModal(); }

        function renderizarCatalogoDeseosModal() {
            const list = document.getElementById('catalog-wish-list');
            if (!list) return;
            const searchInput = document.getElementById('wish-search');
            const filtroTexto = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const items = (catalogoHabitos.deseosUnicos || []).filter(h =>
                h.nombre.toLowerCase().includes(filtroTexto)
            );

            if (!items.length) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.82rem; font-weight: 600;">No se encontraron deseos${filtroTexto ? ' con ese nombre' : ''}.</div>`;
                return;
            }

            list.innerHTML = items.map(htmlItemCatalogoDeseoUnico).join('');
        }

        function aplicarLayoutUnaVez(modo, esUnaVez) {
            const momentW = document.getElementById(modo === 'edit' ? 'edit-moment-section-wrapper' : 'moment-section-wrapper');
            const daysW = document.getElementById(modo === 'edit' ? 'edit-days-section-wrapper' : 'days-section-wrapper');
            const onceW = document.getElementById(modo === 'edit' ? 'edit-once-section-wrapper' : 'once-section-wrapper');
            const remOpts = document.getElementById(modo === 'edit' ? 'edit-reminder-options-container' : 'reminder-options-container');
            const remToggle = document.getElementById(modo === 'edit' ? 'edit-reminder-toggle-pill-wrapper' : 'reminder-toggle-pill-wrapper');
            const bloqueSec = document.getElementById('config-bloque-section');
            const nameWrap = document.getElementById(modo === 'edit' ? 'edit-name-wrapper' : 'config-name-wrapper');
            const nameEl = document.getElementById(modo === 'edit' ? 'edit-habit-name' : 'config-habit-nombre');
            const nameLabel = nameWrap ? nameWrap.querySelector('label') : null;
            if (momentW) momentW.style.display = esUnaVez ? 'none' : '';
            if (onceW) onceW.classList.toggle('hidden', !esUnaVez);
            if (bloqueSec && modo === 'config') bloqueSec.classList.toggle('hidden', esUnaVez || !necesitaSelectorBloque(tempSelectedHabit));
            if (nameEl) nameEl.placeholder = esUnaVez ? 'Nombre de la actividad' : 'Nombre del hábito';
            if (nameLabel) nameLabel.textContent = esUnaVez ? 'Nombre de la actividad' : 'Nombre';
            if (esUnaVez) {
                if (daysW) daysW.style.display = 'none';
                if (remToggle) remToggle.style.display = 'flex';
                if (remOpts && modo === 'config') {
                    remOpts.style.display = configReminderActive ? 'flex' : 'none';
                    pintarLayoutRecordatorioConfig(true);
                }
            } else if (remOpts && modo === 'config') {
                pintarLayoutRecordatorioConfig(false);
            }
        }

        function claveNombreHabito(nombre) {
            return cleanHabitName(nombre).toLocaleLowerCase('es');
        }

        function indiceHabitoPorNombre(nombre, exceptIndex) {
            const clave = claveNombreHabito(nombre);
            if (!clave) return -1;
            return (misHabitos || []).findIndex((h, i) => {
                if (exceptIndex != null && i === exceptIndex) return false;
                return claveNombreHabito(h.nombre) === clave;
            });
        }

        function avisarHabitoDuplicado(index) {
            const h = index > -1 ? misHabitos[index] : null;
            const esUna = !!(h && typeof habitEsUnaVez === 'function' && habitEsUnaVez(h));
            if (h && habitEsArchivado(h)) {
                mostrarToastLujo(esUna
                    ? 'Ya existe una actividad como esta. Está archivada.'
                    : 'Ya existe un hábito como este. Está archivado.', { tipo: 'error' });
                return;
            }
            mostrarToastLujo(esUna
                ? 'Ya existe una actividad como esta.'
                : 'Ya existe un hábito como este.', { tipo: 'error' });
        }

        function seleccionarHabitoDesdeCatalogoDefecto(nombre, tipo, permite247) {
            seleccionarHabitoContextual(nombre, tipo, permite247, { origenCatalogo: 'defecto' });
        }

        function seleccionarHabitoContextual(nombre, tipo, permite247, opts) {
            opts = opts || {};
            if (!opts.catalogEdit) {
                catalogoEditMode = null;
                resetBotonConfigurarHabito();
            }
            const nombreLimpio = recortarTexto(cleanHabitName(nombre), AWAKE_LIMITE_HABITO);
            if (nombreLimpio) {
                const dup = indiceHabitoPorNombre(nombreLimpio);
                if (dup > -1) {
                    avisarHabitoDuplicado(dup);
                    return;
                }
            }
            const origenCatalogo = opts.origenCatalogo || (nombreLimpio ? 'defecto' : 'usuario');
            tempSelectedHabit = { nombre: nombreLimpio, tipo, permite247, origenCatalogo };
            
            selectedMomentsConfig = [];
            selectedDaysConfig = [];
            
            const standardPills = document.querySelectorAll('.standard-moment-pill');
            const pill247 = document.getElementById('pill-247-config');
            const daysWrapper = document.getElementById('days-section-wrapper');
            const togglePillWrapper = document.getElementById('reminder-toggle-pill-wrapper');
            const reminderOptionsContainer = document.getElementById('reminder-options-container');

            standardPills.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'flex';
            });
            document.querySelectorAll('#day-selector-config .day-btn').forEach(b => {
                b.classList.remove('active');
                b.style.pointerEvents = 'auto';
            });

            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const realTimeStr = `${hh}:${mm}`;
            configStartValue = realTimeStr;
            seleccionarOpcionDropdown('config-start', realTimeStr, realTimeStr);

            const anyPill = document.querySelector('#moment-selector .moment-any-pill');
            const nameEl = document.getElementById('config-habit-nombre');
            if (nameEl) nameEl.value = recortarTexto(cleanHabitName(nombre), AWAKE_LIMITE_HABITO);

            if (permite247) {
                standardPills.forEach(p => p.style.display = 'none');
                if (anyPill) anyPill.style.display = 'none';
                if (pill247) {
                    pill247.classList.remove('hidden');
                    pill247.style.display = 'flex';
                    selectedMomentsConfig = ['24/7'];
                    selectedDaysConfig = [1, 2, 3, 4, 5, 6, 0];
                    pill247.classList.add('active', 'locked-pill');
                }
                if (daysWrapper) daysWrapper.style.display = 'none';
                if (togglePillWrapper) togglePillWrapper.style.display = 'flex';
                if (reminderOptionsContainer) reminderOptionsContainer.style.display = 'none';
                configReminderActive = false;
                const remPill = document.getElementById('reminder-toggle-pill');
                if (remPill) remPill.classList.remove('active');
            } else {
                standardPills.forEach(p => p.style.display = 'flex');
                if (anyPill) anyPill.style.display = 'flex';
                if (pill247) {
                    pill247.classList.add('hidden');
                    pill247.style.display = 'none';
                    pill247.classList.remove('active', 'locked-pill');
                }
                if (daysWrapper) daysWrapper.style.display = 'flex';
                if (togglePillWrapper) togglePillWrapper.style.display = 'flex';
                if (reminderOptionsContainer) reminderOptionsContainer.style.display = 'none';
                
                selectedMomentsConfig = [];

                configReminderActive = false;
                const remPill = document.getElementById('reminder-toggle-pill');
                if(remPill) remPill.classList.remove('active');
            }
            
            customModes['config-start'] = false;
            customModes['config-interval'] = false;
            document.getElementById('dropdown-config-start').style.display = 'block';
            document.getElementById('config-start-custom').classList.add('hidden');
            document.getElementById('config-start-custom').value = '';

            document.getElementById('dropdown-config-interval').style.display = 'block';
            document.getElementById('config-interval-custom').classList.add('hidden');
            document.getElementById('config-interval-custom').value = '';

            seleccionarOpcionDropdown('config-interval', '3h', 'Cada 3 hora(s)');

            configVecesPorSemana = 0;
            glyphPickerTouched = false;
            configGlyph = glifoCatalogoPorNombre(nombre);
            configAccent = '';
            pintarModoSemana('config');
            pintarPillsMomento('config');
            pintarPreviewLook('config');
            pintarHintAbstinencia('config-abst-hint', nombre);

            const esUnaVez = catalogoNaturaleza === 'deseo' || tipo === 'Una vez';
            tempSelectedHabit.unaVez = esUnaVez;
            if (esUnaVez) tempSelectedHabit.tipo = 'Una vez';
            if (esUnaVez) {
                const dateEl = document.getElementById('config-once-date');
                const timeEl = document.getElementById('config-once-time');
                const remEl = document.getElementById('config-once-reminder-time');
                if (dateEl) dateEl.value = isoFechaLocal(selectedDate || new Date());
                if (timeEl) timeEl.value = realTimeStr;
                if (remEl) remEl.value = realTimeStr;
                pintarEtiquetaFechaDeseo();
                pintarEtiquetaHoraUnica('config-once-time');
                pintarEtiquetaHoraUnica('config-once-reminder-time');
            }
            configBloqueId = '';
            const bloqueCat = (bloquesHabitos || []).find(b => b.titulo === tempSelectedHabit.tipo);
            if (bloqueCat) configBloqueId = bloqueCat.id;
            aplicarLayoutUnaVez('config', esUnaVez);
            pintarSelectorBloqueConfig();

            const cfgTitle = document.querySelector('#configure-habit-modal .modal-header span');
            if (cfgTitle) {
                const copia = copiaNaturalezaHabito(tempSelectedHabit);
                cfgTitle.textContent = copia.tituloConfigurar;
            }

            document.getElementById('configure-habit-modal').classList.add('active');
            aplicarTemaGlobalHabitos(currentThemeHue);
            if (nameEl && !nombre) nameEl.focus();
        }

        async function guardarHabitoConfigurado() {
            if (!tempSelectedHabit) return;
            const nameEl = document.getElementById('config-habit-nombre');
            const habitCleanName = recortarTexto(cleanHabitName(nameEl ? nameEl.value.trim() : (tempSelectedHabit.nombre || '')), AWAKE_LIMITE_HABITO);
            if (!habitCleanName) {
                mostrarToastLujo('Escribe un nombre.', { tipo: 'error' });
                if (nameEl) nameEl.focus();
                return;
            }
            if (catalogoEditMode) {
                const glyph = resolverGlyphAlGuardar(habitCleanName, configGlyph, glyphPickerTouched);
                const bgColor = configAccent || '';
                guardarEdicionCatalogoPersonal(habitCleanName, glyph, bgColor);
                return;
            }
            tempSelectedHabit.nombre = habitCleanName;
            const esUnaVez = !!(tempSelectedHabit.unaVez || tempSelectedHabit.tipo === 'Una vez');
            const dupAlta = indiceHabitoPorNombre(habitCleanName);
            if (dupAlta > -1) {
                avisarHabitoDuplicado(dupAlta);
                if (nameEl) nameEl.focus();
                return;
            }
            if (esUnaVez) {
                const fechas = fechasDesdeValor((document.getElementById('config-once-date') || {}).value || '');
                const hora = (document.getElementById('config-once-time') || {}).value || '';
                if (!fechas.length || !hora) {
                    mostrarToastLujo('Elige al menos un día y la hora.', { tipo: 'error' });
                    return;
                }
                selectedMomentsConfig = momentosDeUnaVezList(fechas, hora);
                selectedDaysConfig = Array.from(new Set(fechas.map(iso => {
                    const d = parseIsoFechaLocal(iso);
                    return d ? d.getDay() : new Date().getDay();
                })));
                configStartValue = hora;
                tempSelectedHabit.fechasUnicas = fechas;
                tempSelectedHabit.fechaUnica = fechas[0];
            }
            const usaN = configVecesPorSemana > 0 && !tempSelectedHabit.permite247 && !esUnaVez;
            if (!esUnaVez && !tempSelectedHabit.permite247 && necesitaSelectorBloque(tempSelectedHabit) && !configBloqueId) {
                mostrarToastLujo('Elige en qué bloque aparecerá.', { tipo: 'error' });
                return;
            }
            if (!esUnaVez && (selectedMomentsConfig.length === 0 || (!tempSelectedHabit.permite247 && !usaN && selectedDaysConfig.length === 0))) {                        mostrarToastLujo(selectedMomentsConfig.length === 0 ? 'Elige al menos un momento del día.' : 'Elige los días o las veces por semana.', { tipo: 'error' });
                return;
            }

            const reminderActive = configReminderActive;
            let startTime;
            let reminderInterval = 3;
            if (esUnaVez) {
                const horaActividad = (document.getElementById('config-once-time') || {}).value || '';
                if (reminderActive) {
                    const rem = (document.getElementById('config-once-reminder-time') || {}).value || '';
                    startTime = normalizarHoraHHMM(rem, null);
                    if (!startTime) {
                        mostrarToastLujo('Elige la hora del aviso.', { tipo: 'error' });
                        return;
                    }
                } else {
                    startTime = normalizarHoraHHMM(horaActividad, null) || horaActividad;
                }
                reminderInterval = 0;
            } else {
                const startTimeCustom = document.getElementById('config-start-custom').value.trim();
                startTime = customModes['config-start'] && startTimeCustom ? startTimeCustom : configStartValue;
                const intervalCustom = document.getElementById('config-interval-custom').value.trim();
                if (customModes['config-interval'] && intervalCustom) {
                    reminderInterval = parseInt(intervalCustom) || 3;
                } else {
                    reminderInterval = parseInt(configIntervalValue) || 3;
                }
            }

            await crearHabitoConfiguradoAhora(habitCleanName, reminderActive, startTime, reminderInterval);
        }

        async function crearHabitoConfiguradoAhora(habitCleanName, reminderActive, startTime, reminderInterval) {
            if (!tempSelectedHabit) return;
            sincronizarTipoBloqueConfig();
            const usaN = configVecesPorSemana > 0 && !tempSelectedHabit.permite247 && !tempSelectedHabit.unaVez;
            const esUnaVez = !!(tempSelectedHabit.unaVez || tempSelectedHabit.tipo === 'Una vez');
            const tipoRitual = esUnaVez ? 'Una vez' : (tempSelectedHabit.permite247 ? tempSelectedHabit.tipo : (tituloBloquePorId(configBloqueId) || tempSelectedHabit.tipo));
            const nuevoHabito = { 
                nombre: habitCleanName, 
                tipo: tipoRitual, 
                momentos: [...selectedMomentsConfig], 
                dias: (tempSelectedHabit.permite247 || usaN) ? [1,2,3,4,5,6,0] : [...selectedDaysConfig],
                permite247: esUnaVez ? false : (!!tempSelectedHabit.permite247 || selectedMomentsConfig.indexOf('24/7') !== -1),
                reminderActive: reminderActive,
                startTime: startTime,
                reminderInterval: esUnaVez ? 0 : reminderInterval,
                enDescanso: false,
                bgColor: configAccent || '#10151f',
                streak: 0,
                lastLogTime: null,
                archivado: false,
                vecesPorSemana: (esUnaVez || !usaN) ? 0 : configVecesPorSemana,
                unaVez: esUnaVez,
                fechasUnicas: esUnaVez ? (tempSelectedHabit.fechasUnicas || extraerFechasUnicas(selectedMomentsConfig)) : [],
                fechaUnica: esUnaVez ? (tempSelectedHabit.fechaUnica || extraerFechaUnica(selectedMomentsConfig)) : '',
                glyph: resolverGlyphAlGuardar(habitCleanName, configGlyph, glyphPickerTouched),
                createdAt: new Date().toISOString()
            };

            if (currentUser) {
                const data = await insertarHabitoNubeConReintento(nuevoHabito);
                if (data) {
                    nuevoHabito.id = data.id;
                    avisarDiarioRemoto();
                }
            }

            misHabitos.push(nuevoHabito);
try { if (window.awakeAnalytics) window.awakeAnalytics.track('habit_created', { nombre: nuevoHabito.nombre || '', tipo: nuevoHabito.tipo || '' }); } catch (e) {}
            if ((tempSelectedHabit && tempSelectedHabit.origenCatalogo) !== 'defecto') {
                registrarCatalogoPersonal(
                    habitCleanName,
                    esUnaVez ? 'unaVez' : (nuevoHabito.permite247 ? 'abstinencia' : 'ritual'),
                    {
                        glyph: nuevoHabito.glyph,
                        bgColor: nuevoHabito.bgColor,
                        tipo: esUnaVez ? 'Una vez' : (nuevoHabito.permite247 ? nuevoHabito.tipo : (tituloBloquePorId(configBloqueId) || nuevoHabito.tipo))
                    }
                );
            }
            pendingNewHabitIndex = misHabitos.length - 1;
            document.getElementById('configure-habit-modal').classList.remove('active');
            document.getElementById('add-habit-modal').classList.remove('active');
            tempSelectedHabit = null;
            if (esperaCoachPrimerSello()) mostrarAgendaCompleta();
            guardarEstadoLocal();
            renderizarMiRutina();
            actualizarEstadisticasPerfil();
            programarAlarmasNativasHabitos();
        }

        function htmlFechaObjetivoDeseo(iso) {
            if (!iso) return '';
            const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
            const d = m
                ? new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10))
                : inicioDiaLocal(iso);
            if (isNaN(d.getTime())) return '';
            const hoy = inicioDiaLocal(new Date());
            const diff = Math.round((inicioDiaLocal(d).getTime() - hoy.getTime()) / 86400000);
            const pretty = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
            let txt = `Objetivo ${pretty}`;
            let cls = '';
            if (diff === 0) { txt = `Objetivo hoy · ${pretty}`; cls = 'wish-due-soon'; }
            else if (diff === 1) { txt = `Objetivo mañana · ${pretty}`; cls = 'wish-due-soon'; }
            else if (diff > 1 && diff <= 7) { txt = `Objetivo en ${diff} días · ${pretty}`; }
            else if (diff < 0) {
                const n = -diff;
                txt = n === 1 ? `Objetivo ayer · ${pretty}` : `Objetivo hace ${n} días · ${pretty}`;
                cls = 'wish-due-late';
            }
            return ` • <span class="${cls}">${txt}</span>`;
        }

        let wishVista = 'pendientes';

        function sincronizarVistaDeseosPorDefecto() {
            wishVista = 'pendientes';
            document.querySelectorAll('#wish-view-switch .filter-pill').forEach(p => {
                const on = (p.getAttribute('data-wish-vista') || '') === 'pendientes'
                    || String(p.getAttribute('onclick') || '').indexOf("'pendientes'") !== -1;
                p.classList.toggle('active', on);
                p.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            aplicarTemaGlobalHabitos(currentThemeHue);
            renderizarListaDeseos();
        }

        function cambiarVistaDeseos(vista, el) {
            wishVista = vista === 'cumplidos' ? 'cumplidos' : 'pendientes';
            document.querySelectorAll('#wish-view-switch .filter-pill').forEach(p => {
                const on = el ? (p === el) : ((p.getAttribute('data-wish-vista') || '') === wishVista);
                p.classList.toggle('active', on);
                p.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            aplicarTemaGlobalHabitos(currentThemeHue);
            renderizarListaDeseos();
        }

        function renderizarListaDeseos() {
            const list = document.getElementById('my-wishes-list');
            if (!list) return;
            list.innerHTML = '';

            const pendientes = (misDeseos || []).filter(d => !d.completado);
            const cumplidos = (misDeseos || []).filter(d => d.completado);
            const verCumplidos = wishVista === 'cumplidos';
            const items = verCumplidos ? cumplidos : pendientes;

            if (!items.length) {
                list.innerHTML = htmlEstadoVacio({
                    title: 'Lista vacía',
                    icon: ICONO_VACIO_DESEO
                });
                if (!verCumplidos) {
                    list.insertAdjacentHTML('beforeend', htmlBotonAnadir('wish', !(misDeseos || []).length));
                }
                return;
            }

            items.forEach((deseo) => {
                const originalIdx = misDeseos.indexOf(deseo);
                const div = document.createElement('div');
                div.className = 'habit-card-inspired';
                if (verCumplidos) {
                    div.style.background = 'rgba(5, 150, 105, 0.12)';
                    div.style.borderColor = 'rgba(5, 150, 105, 0.4)';
                    const commentSnippet = deseo.comentario ? ` • "${escapeHtmlChat(deseo.comentario)}"` : '';
                    const scoreSnippet = deseo.puntuacion ? ` ⭐ ${escapeHtmlChat(deseo.puntuacion)}` : '';
                    div.innerHTML = `
                        <div class="habit-card-left">
                            <div class="task-checkbox checked" onclick="desmarcarDeseo(${originalIdx})" title="Marcar como pendiente">✓</div>
                            <div class="habit-details">
                                <h4 style="color: #34d399 !important;">${htmlTituloHabito(deseo.nombre)}</h4>
                                <span style="color: var(--text-muted);">Cumplido el ${deseo.fechaCompletado || deseo.fecha}${commentSnippet}${scoreSnippet}</span>
                            </div>
                        </div>
                        ${deseo.imagen ? `<button type="button" class="ig-btn-action" style="flex: 0 0 auto; padding: 6px 10px; font-size: 0.7rem;" onclick="verImagenDeseoPorIndice(${originalIdx})">${svgPhosphorPorClave('camera', 14)} Ver foto</button>` : ''}
                        <button type="button" class="habit-options-btn" onclick="eliminarDeseo(${originalIdx})" style="color: #f87171; font-size: 1rem;" title="Eliminar deseo">✕</button>
                    `;
                } else {
                    div.innerHTML = `
                        <div class="habit-card-left">
                            <div class="task-checkbox" onclick="clicCheckboxDeseo(${originalIdx})"></div>
                            <div class="habit-details">
                                <h4>${htmlTituloHabito(deseo.nombre)}</h4>
                                <span style="color: var(--text-muted);">Deseo único • Añadido el ${deseo.fecha}${htmlFechaObjetivoDeseo(deseo.fechaObjetivo)}</span>
                            </div>
                        </div>
                        <button type="button" class="habit-options-btn" onclick="eliminarDeseo(${originalIdx})" style="color: #f87171; font-size: 1rem;" title="Eliminar deseo">✕</button>
                    `;
                }
                list.appendChild(div);
            });

            if (!verCumplidos) {
                list.insertAdjacentHTML('beforeend', htmlBotonAnadir('wish', !items.length && !(misDeseos || []).length));
            }
        }

        function clicCheckboxDeseo(index) {
            wishIndexToComplete = index;
            document.getElementById('wish-completion-text').value = '';
            document.getElementById('wish-completion-image').value = '';
            document.getElementById('wish-toggle-score').checked = false;
            document.getElementById('wish-score-container').classList.add('hidden');
            const wishScore = document.getElementById('wish-completion-score');
            if (wishScore) wishScore.value = '10/10';
            pintarEtiquetaPuntuacion('wish-completion-score');
            document.getElementById('complete-wish-modal').classList.add('active');
        }

        function cerrarModalCompletarDeseo() {
            cerrarAwakePick();
            document.getElementById('complete-wish-modal').classList.remove('active');
            wishIndexToComplete = null;
        }

        function toggleWishScoreContainer(checkbox) {
            const container = document.getElementById('wish-score-container');
            if(container) container.classList.toggle('hidden', !checkbox.checked);
        }

        function guardarCompletacionDeseo() {
            if (wishIndexToComplete === null) return;
            const fileInput = document.getElementById('wish-completion-image');
            const textEl = document.getElementById('wish-completion-text');
            const scoreCheck = document.getElementById('wish-toggle-score');
            const scoreSelect = document.getElementById('wish-completion-score');

            const comentario = recortarTexto(textEl ? textEl.value.trim() : '', AWAKE_LIMITE_SELLO);
            const puntuacion = scoreCheck && scoreCheck.checked && scoreSelect ? scoreSelect.value : null;

            const procesarCompletadoDeseo = async (imagenBase64) => {
                let imagenUrl = imagenBase64 || null;
                if (imagenUrl && esDataUrlMedia(imagenUrl)) {
                    imagenUrl = await subirImagenOAvisar(imagenUrl, 'logs', 'jpg');
                }
                const d = misDeseos[wishIndexToComplete];
                d.completado = true;
try { if (window.awakeAnalytics) window.awakeAnalytics.track('deseo_completed', { nombre: cleanHabitName(d.nombre) }); } catch (e) {}
                d.fechaCompletado = new Date().toLocaleDateString();
                d.comentario = comentario;
                d.imagen = imagenUrl;
                d.puntuacion = puntuacion;

                const cleanName = cleanHabitName(d.nombre);
                const dateObj = new Date();
                const textCommentVal = d.comentario ? `[Deseo único] ${d.comentario}` : '[Deseo único cumplido]';

                let realId = null;
                if (currentUser) {
                    const { data, error } = await supabaseClient.from('habit_logs').insert([{
                        user_id: currentUser.id,
                        habit_name: cleanName,
                        text_comment: textCommentVal,
                        image_url: imagenUrl || null,
                        privacy: 'seguidores',
                        created_at: dateObj.toISOString()
                    }]).select('id').single();

                    if (error) {
                        console.error("Error al guardar deseo en Supabase:", error.message);
                        await borrarVariasMediaAwake(imagenUrl ? [imagenUrl] : []);
                        return;
                    }
                    if (data) {
                        realId = data.id;
                    }
                }

                if (!realId) {
                    realId = 'wish_reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                }

                const registroObj = {
                    id: realId,
                    user_id: currentUser ? currentUser.id : null,
                    nombre: cleanName,
                    fecha: d.fechaCompletado,
                    dateObj: dateObj,
                    timestamp: dateObj.getTime(),
                    texto: textCommentVal,
                    score: d.puntuacion,
                    imagenes: d.imagen ? [d.imagen] : [],
                    image_url: d.imagen,
                    privacidad: 'seguidores',
                    likes: 0,
                    likedByMe: false,
                    comentarios: []
                };

                if (!historialAgrupado[cleanName]) historialAgrupado[cleanName] = [];
                historialAgrupado[cleanName].unshift(registroObj);
                window.registrosGlobalMap[registroObj.id] = registroObj;
                marcarSelloReciente(registroObj.id);

                cerrarModalCompletarDeseo();
                await persistirDeseoNube(d);
                guardarEstadoLocal();
                avisarDiarioRemoto();
                renderizarListaDeseos();
                renderizarPerfilPublicacionesGrid();
                renderizarTabHistorial();
                actualizarEstadisticasPerfil();
                try { renderizarInsignias(); } catch (e) {}
            };

            if (fileInput && fileInput.files && fileInput.files[0]) {
                comprimirImagenSegura(fileInput.files[0], (base64) => {
                    procesarCompletadoDeseo(base64 || null);
                });
            } else {
                procesarCompletadoDeseo(null);
            }
        }

        async function desmarcarDeseo(index) {
            const d = misDeseos[index];
            d.completado = false;
            d.comentario = '';
            d.imagen = null;
            d.puntuacion = null;
            
            const cleanName = cleanHabitName(d.nombre);
            if (historialAgrupado[cleanName]) {
                const toRemove = historialAgrupado[cleanName].filter(l => l.texto && l.texto.includes('[Deseo único'));
                for (const tr of toRemove) {
                    if (tr && tr.id) marcarSelloEliminado(tr.id);
                    await borrarRegistroHabitLogYMedia(tr);
                    delete window.registrosGlobalMap[tr.id];
                }
                historialAgrupado[cleanName] = historialAgrupado[cleanName].filter(l => !l.texto.includes('[Deseo único'));
            }
            await persistirDeseoNube(d);
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarListaDeseos();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            actualizarEstadisticasPerfil();
        }

        function verImagenDeseoPorIndice(idx) {
            const deseo = misDeseos[idx];
            if (deseo && deseo.imagen) verImagenDeseo(deseo.imagen);
        }

        function verImagenDeseo(imgUrl) {
            const safe = urlMediaSegura(imgUrl);
            if (!safe) return;
            const lbImg = document.getElementById('lightbox-img');
            const lb = document.getElementById('lightbox');
            if(lbImg) lbImg.src = safe;
            if(lb) {
                lb.classList.add('active');
                lb.style.zIndex = '45000';
            }
        }

        function eliminarDeseo(idx) {
            const i = idx;
            resetConfirmModalButtons();
            confirmModalAction = async () => {
                const deseo = misDeseos[i];
                if (!deseo) return;
                const cleanName = cleanHabitName(deseo.nombre);
                if (historialAgrupado[cleanName]) {
                    for (const tr of historialAgrupado[cleanName]) {
                        await borrarRegistroHabitLogYMedia(tr);
                        delete window.registrosGlobalMap[tr.id];
                    }
                    delete historialAgrupado[cleanName];
                }
                const pos = misDeseos.indexOf(deseo);
                if (currentUser && !esIdDeseoLocal(deseo.id)) {
                    const { error } = await supabaseClient.from('wishes').delete().eq('id', deseo.id);
                    if (error) throw error;
                }
                if (pos > -1) misDeseos.splice(pos, 1);
                else misDeseos.splice(i, 1);
                guardarEstadoLocal();
                avisarDiarioRemoto();
                renderizarListaDeseos();
                renderizarPerfilPublicacionesGrid();
                renderizarTabHistorial();
                actualizarEstadisticasPerfil();
            };
            document.getElementById('confirm-modal-title').textContent = "Eliminar deseo";
            document.getElementById('confirm-modal-text').textContent = "Se quita de tu lista. Esta acción no se puede deshacer.";
            document.getElementById('confirm-modal').classList.add('active');
        }

        function htmlEstadoVacio({ title, text, icon, dataAttr }) {
            const extra = dataAttr ? ` ${dataAttr}` : '';
            const copy = text
                ? `<p class="empty-state-text">${escapeHtmlChat(text)}</p>`
                : '';
            return `
                <div class="empty-state"${extra}>
                    <div class="empty-state-head">
                        <div class="empty-state-orb" aria-hidden="true">${icon}</div>
                        <div class="empty-state-copy">
                            <h3 class="empty-state-title">${escapeHtmlChat(title)}</h3>
                            ${copy}
                        </div>
                    </div>
                </div>
            `;
        }

        function htmlBotonAnadir(tipo, esPrimero) {
            const esHabito = tipo === 'habit';
            const onclick = esHabito ? 'abrirModalCrearHabito()' : 'abrirModalCrearDeseo()';
            const label = esPrimero
                ? (esHabito ? 'Añade tu primer hábito' : 'Añade tu primer deseo')
                : (esHabito ? 'Añadir hábito' : 'Añadir deseo');
            const plus = `<svg${esPrimero ? ' class="add-item-plus"' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
            const btn = `<button type="button" class="add-item-btn${esPrimero ? ' is-first' : ''}" onclick="${onclick}">${plus}<span>${label}</span></button>`;
            return btn;
        }

        const ICONO_VACIO_HABITO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>';
        const ICONO_VACIO_DESEO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.9 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.9a2 2 0 0 1-1.2-1.2L21 12l-5.9-1.9a2 2 0 0 1-1.2-1.2L12 3z"/></svg>';
        const ICONO_VACIO_FOTO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 15-5-5L5 19"/></svg>';
        const ICONO_VACIO_CHAT = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
        const ICONO_VACIO_HISTORIAL = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

        function renderizarMiRutina() {
            ocultarAvisoRacha();
            const list = document.getElementById('my-routine-list');
            if(!list) return;
            list.innerHTML = '';

            let itemsParaRenderizar = [];

            misHabitos.forEach((h, globalIndex) => {
                if (habitEsArchivado(h)) return;
                if (!habitProgramadoEnFecha(h, selectedDate)) return;
                (h.momentos || []).forEach(momento => {
                    if (String(momento).indexOf('U:') === 0) return;
                    itemsParaRenderizar.push({ habit: h, globalIndex, momento });
                });
            });

            const filtrados = itemsParaRenderizar.filter(item => {
                if (momentoSoloEnTodos(item.momento)) {
                    return activeFilter === 'TODOS';
                }
                if (activeFilter === 'TODOS') return true;
                return item.momento === activeFilter;
            });

            if (filtrados.length === 0) {
                if (!habitosEnAgenda().length) {
                    list.innerHTML = htmlEstadoVacio({
                        title: 'Rutina vacía',
                        icon: ICONO_VACIO_HABITO
                    }) + htmlBotonAnadir('habit', !misHabitos.length);
                } else {
                    list.innerHTML = htmlEstadoVacio({
                        title: 'Agenda vacía',
                        icon: ICONO_VACIO_HABITO
                    }) + htmlBotonAnadir('habit', false);
                }
                aplicarMotionHabitoPendiente();
                actualizarBarraRitual();
                sincronizarCapaPrimerRitual();
                return;
            }

            const ORDEN_MOMENTO = { MAÑANA: 0, TARDE: 1, NOCHE: 2, CUALQUIER: 3, '24/7': 4 };
            let coachSeal = esperaCoachPrimerSello();
            if (activeFilter === 'TODOS') {
                filtrados.sort((a, b) => (ORDEN_MOMENTO[a.momento] ?? 9) - (ORDEN_MOMENTO[b.momento] ?? 9));
            }
            let ultimoBloqueAgenda = null;

            filtrados.forEach((item) => {
                if (activeFilter === 'TODOS' && item.momento !== ultimoBloqueAgenda) {
                    ultimoBloqueAgenda = item.momento;
                    const tit = document.createElement('div');
                    tit.className = 'agenda-block-title';
                    tit.textContent = etiquetaMomentoHabito(item.momento);
                    list.appendChild(tit);
                }
                const h = item.habit;
                const globalIndex = item.globalIndex;
                const momento = item.momento;
                
                const estadoSello = estadoSelloEnFecha(h, selectedDate, momento);
                const completadoHoy = selloCuentaComoHecho(estadoSello);
                const omitidoHoy = estadoSello === 'omitido';
                const cleanName = cleanHabitName(h.nombre);
                const habitKey = `${globalIndex}-${momento}`;
                const futuroBloqueado = esFechaFutura(selectedDate);
                const showCoach = coachSeal && !completadoHoy && !h.enDescanso && !futuroBloqueado;
                const esAbst = habitEsAbstinencia(h) || naturalezaHabito(h) === 'abstinencia';
                const pendiente = !completadoHoy && !omitidoHoy && !h.enDescanso && !futuroBloqueado;
                const nat = naturalezaHabito(h);

                const div = document.createElement('div');
                div.className = `habit-card-inspired${h.enDescanso ? ' is-resting' : ''}${futuroBloqueado ? ' is-future-locked' : ''}${showCoach ? ' is-first-seal' : ''}${pendiente ? ' is-open' : ''}${(completadoHoy || omitidoHoy) ? ' is-done' : ''}${nat === 'unaVez' ? ' is-once' : ''}${nat === 'abstinencia' ? ' is-abstinence' : ''}`;
                div.dataset.habitKey = habitKey;
                div.dataset.naturaleza = nat;
                if (showCoach) coachSeal = false;
                
                const checkMark = omitidoHoy ? '–' : (completadoHoy ? '✓' : (h.enDescanso ? svgPhosphorPorClave('moon-stars', 15) : ''));
                const rightControlHTML = `
                    <div class="task-checkbox ${omitidoHoy ? 'skipped' : (completadoHoy ? 'checked' : '')}${futuroBloqueado ? ' is-locked' : ''}" onclick="event.stopPropagation(); clicCheckboxHabito(${globalIndex}, '${momento}')">
                        ${checkMark}
                    </div>
                `;

                let descansoBadge = h.enDescanso ? ` <span style="color:#60a5fa; font-weight:700; display:inline-flex; align-items:center; gap:4px;">${svgPhosphorPorClave('moon-stars', 14)} Descansando</span>` : '';
                const logHoy = completadoHoy ? buscarLogHabitoEnFecha(h, selectedDate, momento) : null;
                const tieneFoto = !!(logHoy && srcImagenHabito((logHoy.imagenes && logHoy.imagenes[0]) || logHoy.image_url));
                const cameraSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
                const permiteFoto = habitoPermiteFoto(h, momento);
                const cameraBtn = completadoHoy && !omitidoHoy && !futuroBloqueado && permiteFoto
                    ? `<button type="button" class="habit-photo-btn${tieneFoto ? ' has-photo' : ''}" onclick="event.stopPropagation(); abrirModalFotoNota(${globalIndex}, '${momento}')" title="Foto o nota" aria-label="Foto o nota">${cameraSvg}</button>`
                    : '';

                div.innerHTML = `
                    <div class="habit-card-left">
                        ${rightControlHTML}
                        <div class="habit-details">
                            <h4 style="${h.enDescanso ? 'opacity: 0.7;' : ''}">${htmlTituloHabito(cleanName, h.glyph, colorAcentoHabito(h))}${htmlBadgeVecesSemana(h)}${descansoBadge}</h4>
                            ${htmlSubtituloTarjetaHabito(h)}
                        </div>
                    </div>
                    <div class="habit-card-actions">
                        <div class="habit-photo-slot">${cameraBtn}</div>
                        <button type="button" class="habit-options-btn" onclick="toggleContextMenu(event, 'ctx-${globalIndex}-${momento}')">⋯</button>
                    </div>
                    
                    <div id="ctx-${globalIndex}-${momento}" class="habit-context-menu">
                        ${htmlMenuContextoHabito(h, globalIndex, momento, { futuroBloqueado, completadoHoy, omitidoHoy, esAbst, permiteFoto })}
                    </div>
                `;
                div.addEventListener('click', (e) => {
                    if (e.target.closest('.task-checkbox, .habit-options-btn, .habit-photo-btn, .habit-context-menu')) return;
                    const menu = div.querySelector('.habit-context-menu.active');
                    if (menu) {
                        menu.classList.remove('active');
                        return;
                    }
                    if (div.classList.contains('is-first-seal') && !completadoHoy && !h.enDescanso && !futuroBloqueado) {
                        clicCheckboxHabito(globalIndex, momento);
                        return;
                    }
                    abrirFichaHabito(e, globalIndex);
                });
                list.appendChild(div);
            });
            if (!esperaCoachPrimerSello()) {
                list.insertAdjacentHTML('beforeend', htmlBotonAnadir('habit', false));
            }
            aplicarTemaGlobalHabitos(currentThemeHue);
            aplicarMotionHabitoPendiente();
            actualizarBarraRitual();
            refrescarFichaHabitoAbierta();
            actualizarCuentasAtrasHabitos();
            sincronizarCapaPrimerRitual();
        }

        function toggleContextMenu(event, menuId) {
            event.stopPropagation();
            document.querySelectorAll('.habit-context-menu').forEach(m => {
                if (m.id !== menuId) m.classList.remove('active');
            });
            const menu = document.getElementById(menuId);
            if(menu) menu.classList.toggle('active');
        }

        async function insertarRegistroMarca({ index, momento, dateTarget, texto, toast, celebrar, privacy }) {
            selloOperacionEnCurso();
            try {
            const h = misHabitos[index];
            if (!h) return null;
            const cleanHName = cleanHabitName(h.nombre);
            const targetDateObj = new Date(dateTarget);
            const extra = camposSelloHabito(h, targetDateObj, momento);
            const fechaFormateada = extra.dateObj.toLocaleDateString();
            const prevStreak = h.streak || 0;
            const privacidad = privacy || 'privado';
            const esPrimero = contarSellosDelDia(targetDateObj) === 0;
            if (!historialAgrupado[cleanHName]) historialAgrupado[cleanHName] = [];
            let realId = null;
            if (currentUser) {
                try {
                    const { data, error } = await supabaseClient.from('habit_logs').insert([{
                        user_id: currentUser.id,
                        habit_name: cleanHName,
                        text_comment: texto,
                        image_url: null,
                        privacy: privacidad,
                        created_at: extra.dateObj.toISOString()
                    }]).select('id').single();
                    if (error) {
                        console.error('Error al insertar marca:', error.message || error);
                        mostrarToastLujo('No se pudo guardar el sello.', { tipo: 'error' });
                        return null;
                    }
                    if (data) realId = data.id;
                } catch (e) {
                    mostrarToastLujo('No se pudo guardar el sello.', { tipo: 'error' });
                    return null;
                }
            }
            if (!realId) realId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const registroObj = {
                id: realId,
                user_id: currentUser ? currentUser.id : null,
                nombre: cleanHName,
                habitId: extra.habitId,
                dia: extra.dia,
                fecha: fechaFormateada,
                dateObj: extra.dateObj,
                timestamp: extra.timestamp,
                texto,
                score: null,
                imagenes: [],
                image_url: null,
                privacidad,
                likes: 0,
                likedByMe: false,
                comentarios: []
            };
            window.registrosGlobalMap[registroObj.id] = registroObj;
            historialAgrupado[cleanHName].unshift(registroObj);
            historialAgrupado[cleanHName].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            marcarSelloReciente(registroObj.id);
            if (!logEsMarcaRitual(registroObj)) totalCompletadas++;
            h.streak = calcularRachaHastaFecha(cleanHName, targetDateObj);
if (!logEsMarcaRitual(registroObj) && (texto || '').indexOf(AWAKE_MARK_OMITIDO) === -1 && (texto || '').indexOf(AWAKE_MARK_RECAIDA) === -1) { try { if (window.awakeAnalytics) window.awakeAnalytics.track('habit_sealed', { nombre: cleanHName }); } catch (e) {} }
try { if (typeof cancelarAvisoRiesgoHoySiProcede === 'function') cancelarAvisoRiesgoHoySiProcede(); } catch (e) {}
            if (currentUser && h.id) {
                try { await supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id); } catch (e) {}
            }
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            if (celebrar) {
                registrarSelloParaDeshacer({ index, momento, logId: registroObj.id, prevStreak });
            }
            actualizarEstadisticasPerfil();
            if (celebrar) {
                celebrarSello(cleanHName, esPrimero);
            } else if (toast) {
                mostrarToastLujo(toast, { tipo: 'exito' });
            }
            return registroObj;
            } finally {
                selloOperacionTerminada();
            }
        }

        function buscarLogHabitoEnFecha(habitRef, dateTarget, momento) {
            const logs = logsADesellarHabito(habitRef, dateTarget, momento);
            if (!logs.length) return null;
            const conFoto = logs.find(l => logHabitoTieneFoto(l));
            return conFoto || logs[0];
        }

        function logsADesellarHabito(habitRef, dateTarget, momento) {
            const h = habitoDesdeRef(habitRef) || habitoPorNombre(habitRef);
            const dia = claveDiaLocal(dateTarget);
            const name = cleanHabitName((h && h.nombre) || habitRef || '');
            const seen = new Set();
            const out = [];
            const considerar = (l) => {
                if (!l || !l.id) return;
                const sid = String(l.id);
                if (seen.has(sid)) return;
                if (typeof selloIdEstaEliminado === 'function' && selloIdEstaEliminado(l.id)) return;
                if (claveDiaDeLog(l) !== dia) return;
                if (!logCoincideMomento(l, momento)) return;
                const lName = cleanHabitName(l.nombre || '');
                if (name && lName && lName !== name) {
                    if (!(h && h.id && l.habitId && String(l.habitId) === String(h.id))) return;
                }
                seen.add(sid);
                out.push(l);
            };
            logsDelDiaHabito(h || habitRef, dateTarget, momento).forEach(considerar);
            Object.keys(historialAgrupado || {}).forEach(k => {
                (historialAgrupado[k] || []).forEach(considerar);
            });
            Object.keys(window.registrosGlobalMap || {}).forEach(id => {
                considerar(window.registrosGlobalMap[id]);
            });
            return out;
        }

        async function borrarLogDelDia(habitRef, dateTarget, momento) {
            await desellarSellosHabitoEnFecha(habitRef, dateTarget, momento);
        }

        async function desellarSellosHabitoEnFecha(habitRef, dateTarget, momento) {
            if (typeof selloOperacionEnCurso === 'function') selloOperacionEnCurso();
            try {
                const logs = logsADesellarHabito(habitRef, dateTarget, momento);
                if (!logs.length) return 0;
                for (let i = 0; i < logs.length; i++) {
                    const found = logs[i];
                    quitarLogDeHistorial(found);
                    try { await borrarRegistroHabitLogYMedia(found); } catch (e) {}
                    if (found && found.id) delete window.registrosGlobalMap[found.id];
                    if (found && !logEsMarcaRitual(found)) {
                        totalCompletadas = Math.max(0, (totalCompletadas || 0) - 1);
                    }
                }
                return logs.length;
            } finally {
                if (typeof selloOperacionTerminada === 'function') selloOperacionTerminada();
            }
        }

        function contarOmisionesEnDias(habitName, dias) {
            const desde = sumarDiasLocal(new Date(), -(dias - 1));
            const logs = logsDeHabito(habitName);
            return logs.filter(l => logEsOmitido(l) && inicioDiaLocal(fechaDeLogHabito(l)) >= desde).length;
        }

        async function omitirHabitoHoy(index, momento) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            const h = misHabitos[index];
            if (!h || esFechaFutura(selectedDate)) return;
            if (naturalezaHabito(h) === 'unaVez') {
                mostrarToastLujo('Las actividades de una vez no se omiten. Elimínala o edítala.', { tipo: 'error' });
                return;
            }
            if (esHabitoContinuo(h, momento)) {
                mostrarToastLujo('Las abstinencias 24/7 no se omiten.', { tipo: 'error' });
                return;
            }
            if (estaCompletadoEnFecha(h, selectedDate, momento)) {
                mostrarToastLujo('Este sello ya está cerrado.', { tipo: 'error' });
                return;
            }
            const n = contarOmisionesEnDias(h.nombre, 7);
            const go = async () => {
                await insertarRegistroMarca({
                    index,
                    momento,
                    dateTarget: selectedDate,
                    texto: `[${momento}] ${AWAKE_MARK_OMITIDO}`,
                    toast: 'Omitido. La racha sigue.'
                });
            };
            if (n >= 2) {
                resetConfirmModalButtons();
                document.getElementById('confirm-modal-title').textContent = 'Varias omisiones';
                document.getElementById('confirm-modal-text').textContent = 'Llevas varias omisiones esta semana. Úsalas con cuidado: el hábito sigue, pero el día no se sella de verdad.';
                confirmModalAction = go;
                document.getElementById('confirm-modal').classList.add('active');
                return;
            }
            await go();
        }

        async function deshacerOmisionHabito(index, momento) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            const h = misHabitos[index];
            if (!h) return;
            await borrarLogDelDia(h, selectedDate, momento);
            h.streak = calcularRachaHastaFecha(h.nombre, selectedDate);
            if (currentUser && h.id) {
                try { await supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id); } catch (e) {}
            }
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            renderizarTabHistorial();
            actualizarEstadisticasPerfil();
            try { renderizarInsignias(); } catch (e) {}
            mostrarToastLujo('Omisión deshecha', { tipo: 'exito' });
        }

        function diasLibreEstaSemana() {
            const start = inicioSemanaPreferida(selectedDate);
            const end = sumarDiasLocal(start, 6);
            const keys = new Set();
            (misHabitos || []).forEach(h => {
                (historialAgrupado[cleanHabitName(h.nombre)] || []).forEach(l => {
                    if (!logEsDiaLibre(l)) return;
                    const d = inicioDiaLocal(fechaDeLogHabito(l));
                    if (d >= start && d <= end) keys.add(claveDiaLocal(d));
                });
            });
            return keys.size;
        }

        function solicitarDiaLibre() {
            if (esFechaFutura(selectedDate)) {
                mostrarToastLujo('No se puede marcar un día futuro.', { tipo: 'error' });
                return;
            }
            const pendientes = habitosEnAgenda().filter(h => {
                if (h.enDescanso || esHabitoContinuo(h)) return false;
                if (!habitProgramadoEnFecha(h, selectedDate)) return false;
                return (h.momentos || []).some(m => !estaCompletadoEnFecha(h.nombre, selectedDate, m));
            });
            if (!pendientes.length) {
                mostrarToastLujo('No queda nada discreto por omitir.', { tipo: 'error' });
                return;
            }
            const ya = diasLibreEstaSemana();
            resetConfirmModalButtons();
            document.getElementById('confirm-modal-title').textContent = 'Día libre';
            document.getElementById('confirm-modal-text').textContent = ya >= 1
                ? 'Ya usaste un día libre esta semana. ¿Quieres omitir también los sellos discretos de esta fecha? Los 24/7 no se tocan.'
                : 'Se omiten los sellos discretos de esta fecha. Los rituales 24/7 siguen. La racha no se rompe.';
            confirmModalAction = () => aplicarDiaLibre();
            document.getElementById('confirm-modal').classList.add('active');
        }

        async function aplicarDiaLibre() {
            for (let i = 0; i < misHabitos.length; i++) {
                const h = misHabitos[i];
                if (!h || habitEsArchivado(h) || h.enDescanso || esHabitoContinuo(h)) continue;
                if (!habitProgramadoEnFecha(h, selectedDate)) continue;
                for (const momento of (h.momentos || [])) {
                    if (estaCompletadoEnFecha(h.nombre, selectedDate, momento)) continue;
                    await insertarRegistroMarca({
                        index: i,
                        momento,
                        dateTarget: selectedDate,
                        texto: `[${momento}] ${AWAKE_MARK_OMITIDO} ${AWAKE_MARK_DIA_LIBRE}`
                    });
                }
            }
            mostrarToastLujo('Día libre. La racha sigue.', { tipo: 'exito' });
        }

        async function archivarHabito(index) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            const h = misHabitos[index];
            if (!h || naturalezaHabito(h) === 'unaVez') return;
            h.archivado = true;
            h.enDescanso = false;
            await persistirCamposExtraHabito(h);
            if (currentUser && h.id) {
                try { await supabaseClient.from('habits').update({ en_descanso: false }).eq('id', h.id); } catch (e) {}
            }
            if (fichaHabitoIndex === index) cerrarFichaHabito();
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            renderizarTabHistorial();
            programarAlarmasNativasHabitos();
            const label = etiquetaNaturalezaHabito(h);
            const gen = naturalezaHabito(h) === 'ritual' ? 'o' : 'a';
            mostrarToastLujo(`${label} archivad${gen}. Lo encuentras en Historial.`, { tipo: 'exito' });
        }

        async function reactivarHabito(index) {
            const h = misHabitos[index];
            if (!h) return;
            h.archivado = false;
            await persistirCamposExtraHabito(h);
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            renderizarTabHistorial();
            programarAlarmasNativasHabitos();
            mostrarToastLujo('De vuelta en la agenda', { tipo: 'exito' });
        }

        function quizasCelebrarDiaSellado(items) {
            const discretos = (items || []).filter(i => i && i.h && !esHabitoContinuo(i.h, i.momento));
            if (!discretos.length) return;
            if (claveDiaLocal(selectedDate) !== claveDiaLocal(new Date())) return;
            if (!discretos.every(i => i.done)) return;
            if (discretos.every(i => i.skipped)) return;
            // Esperar a que expire Deshacer: no tapar el toast ni marcar el día si el usuario puede revertir.
            if (typeof lastSealSnapshot !== 'undefined' && lastSealSnapshot) return;
            const key = claveDiaLocal(selectedDate);
            if (daySealedToastKey === key) return;
            try {
                if (localStorage.getItem('awake_day_sealed_' + key) === '1') {
                    daySealedToastKey = key;
                    return;
                }
                localStorage.setItem('awake_day_sealed_' + key, '1');
            } catch (e) {}
            daySealedToastKey = key;
            const rachaDias = rachaDiasSelladosHasta(selectedDate);
            mostrarHojaDiaSellado(rachaDias);
        }

        function mostrarHojaDiaSellado(rachaDias) {
            const overlay = document.getElementById('dia-sellado-overlay');
            const sub = document.getElementById('dia-sellado-sub');
            if (sub) {
                sub.textContent = rachaDias > 1
                    ? `${rachaDias} días sellados seguidos.`
                    : 'Has sellado todo lo que había hoy.';
            }
            if (overlay) overlay.classList.add('active');
        }

        function cerrarHojaDiaSellado() {
            const overlay = document.getElementById('dia-sellado-overlay');
            if (overlay) overlay.classList.remove('active');
        }

        function agendaItemsFecha(date, filtro) {
            const f = filtro || 'TODOS';
            const items = [];
            habitosEnAgenda().forEach(h => {
                if (h.enDescanso || !habitProgramadoEnFecha(h, date)) return;
                (h.momentos || []).forEach(momento => {
                    if (f !== 'TODOS' && momento !== '24/7' && momento !== f) return;
                    if (f !== 'TODOS' && momento === '24/7') return;
                    const estado = estadoSelloEnFecha(h.nombre, date, momento);
                    items.push({ h, momento, done: selloCuentaComoHecho(estado), skipped: estado === 'omitido' });
                });
            });
            return items;
        }

        function diaAgendaCompleta(date) {
            const items = agendaItemsFecha(date, 'TODOS').filter(i => i && i.h && !esHabitoContinuo(i.h, i.momento));
            if (!items.length) return false;
            if (items.every(i => i.skipped)) return false;
            return items.every(i => i.done);
        }

        function rachaDiasSelladosHasta(fechaRef) {
            let n = 0;
            let d = inicioDiaLocal(fechaRef);
            for (let i = 0; i < 400; i++) {
                if (!diaAgendaCompleta(d)) break;
                n++;
                d = sumarDiasLocal(d, -1);
            }
            return n;
        }

        function diasSelladosEstaSemanaHasta(fechaRef) {
            const hoy = inicioDiaLocal(new Date());
            let end = inicioDiaLocal(fechaRef);
            if (end > hoy) end = hoy;
            const start = inicioSemanaPreferida(end);
            if (start > hoy) return { sealed: 0, elapsed: 0 };
            let elapsed = 0;
            let sealed = 0;
            for (let d = start; d <= end; d = sumarDiasLocal(d, 1)) {
                elapsed++;
                if (diaAgendaCompleta(d)) sealed++;
            }
            return { sealed, elapsed };
        }

        function resumenSemanaRitual() {
            const start = inicioSemanaPreferida(new Date());
            const hoy = inicioDiaLocal(new Date());
            let prog = 0;
            let ok = 0;
            for (let d = start; d <= hoy; d = sumarDiasLocal(d, 1)) {
                const items = agendaItemsFecha(d, 'TODOS');
                items.forEach(i => {
                    prog++;
                    if (i.done) ok++;
                });
            }
            return { ok, prog, racha: rachaDiasSelladosHasta(hoy) };
        }

        // Mensajes de notificaciones de ritual (extraídos como funciones puras para tests — ROADMAP 1.5 / B-04).
        function mensajeResumenSemanal(ok, prog, racha) {
            if (!(prog > 0)) return 'Esta semana no hubo sellos. ¡La próxima la llenas! 💪';
            return `Sellaste ${ok} de ${prog} sellos · racha de ${racha} día${racha === 1 ? '' : 's'}. ¡Sigue así!`;
        }

        function mensajeRachaEnRiesgo(total, nombres) {
            if (total === 1) return `Sin sellar hoy: ${nombres}. ¡No dejes que la racha se rompa!`;
            return `Te quedan ${total} sellos por cerrar hoy, entre ellos ${nombres}.`;
        }

        function abrirModalFotoNota(index, momento) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            const h = misHabitos[index];
            if (!h) return;
            habitIndexToComplete = index;
            completionMomentTarget = momento;
            const permiteFoto = habitoPermiteFoto(h, momento);
            const title = document.getElementById('complete-modal-title');
            if (title) title.textContent = permiteFoto ? 'Foto o nota' : 'Nota';
            const log = buscarLogHabitoEnFecha(h, selectedDate, momento);
            const textEl = document.getElementById('completion-text');
            const imgEl = document.getElementById('completion-image');
            const imgGroup = document.getElementById('completion-image-group');
            const scoreCheck = document.getElementById('toggle-score');
            const scoreSelect = document.getElementById('completion-score');
            const scoreBox = document.getElementById('score-container');
            if (imgGroup) imgGroup.style.display = permiteFoto ? '' : 'none';
            if (imgEl) imgEl.value = '';
            const previewWrap = document.getElementById('completion-image-preview-wrap');
            const previewImg = document.getElementById('completion-image-preview');
            const rawImg = permiteFoto && log && ((log.imagenes && log.imagenes[0]) || log.image_url);
            const safeImg = srcImagenHabito(rawImg);
            if (previewWrap && previewImg) {
                if (safeImg) {
                    previewImg.src = safeImg;
                    previewWrap.classList.remove('hidden');
                } else {
                    previewImg.removeAttribute('src');
                    previewWrap.classList.add('hidden');
                }
            }
            if (textEl) {
                const raw = log && log.texto ? String(log.texto).replace(/^\[[^\]]+\]\s*/, '') : '';
                textEl.value = (!raw || raw === 'Sin comentarios adicionales.' || raw === 'Completado') ? '' : raw;
            }
            if (scoreCheck && scoreBox) {
                const hasScore = !!(log && log.score);
                scoreCheck.checked = hasScore;
                scoreBox.classList.toggle('hidden', !hasScore);
                if (scoreSelect) {
                    scoreSelect.value = hasScore ? log.score : '10/10';
                    pintarEtiquetaPuntuacion('completion-score');
                }
            }
            currentCompletionPrivacy = (log && log.privacidad) || 'seguidores';
            document.querySelectorAll('#completion-privacy-selector .config-pill').forEach((p, i) => {
                p.classList.toggle('active', (i === 0 && currentCompletionPrivacy !== 'privado') || (i === 1 && currentCompletionPrivacy === 'privado'));
            });
            document.getElementById('complete-modal').classList.add('active');
        }

        async function toggleDescansoHabito(index) {
            const h = misHabitos[index];
            if (!h || naturalezaHabito(h) === 'unaVez') return;
            h.enDescanso = !h.enDescanso;
            if (currentUser && h.id) {
                await supabaseClient.from('habits').update({ en_descanso: h.enDescanso }).eq('id', h.id);
            }
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            programarAlarmasNativasHabitos();
            mostrarToastLujo(h.enDescanso ? 'En descanso' : 'De vuelta al ritual', { tipo: 'exito' });
        }

        function abrirEditarHabito(index) {
            habitToEditIndex = index;
            const h = misHabitos[index];
            const inputName = document.getElementById('edit-habit-name');
            if(inputName) inputName.value = cleanHabitName(h.nombre);
            const editTitle = document.querySelector('#edit-habit-modal .modal-header span');
            if (editTitle) editTitle.textContent = copiaNaturalezaHabito(h).tituloEditar;
            
            editSelectedMoments = h.momentos ? [...h.momentos] : [];
            editSelectedDays = h.dias ? [...h.dias] : [];
            editReminderActive = h.reminderActive ?? false;

            const pill247Edit = document.getElementById('pill-247-edit');
            const standardEditPills = document.querySelectorAll('.standard-edit-moment');
            const cleanHName = cleanHabitName(h.nombre);
            const permite247 = esHabitoContinuo(h) || editSelectedMoments.includes('24/7');

            const edTogglePillWrapper = document.getElementById('edit-reminder-toggle-pill-wrapper');
            const edContainer = document.getElementById('edit-reminder-options-container');

            const anyEdit = document.querySelector('#edit-moment-selector .moment-any-pill');
            if (permite247) {
                editSelectedMoments = ['24/7'];
                editSelectedDays = [1, 2, 3, 4, 5, 6, 0];
                standardEditPills.forEach(p => p.style.display = 'none');
                if (anyEdit) anyEdit.style.display = 'none';
                if (pill247Edit) {
                    pill247Edit.classList.remove('hidden');
                    pill247Edit.style.display = 'flex';
                    pill247Edit.classList.add('active', 'locked-pill');
                }
                if(edTogglePillWrapper) edTogglePillWrapper.style.display = 'flex';
                if(edContainer) edContainer.style.display = editReminderActive ? 'flex' : 'none';
                const edPill = document.getElementById('edit-reminder-toggle-pill');
                if(edPill) edPill.classList.toggle('active', editReminderActive);
                const edDaysWrap = document.getElementById('edit-days-section-wrapper');
                if (edDaysWrap) edDaysWrap.style.display = 'none';
            } else {
                standardEditPills.forEach(p => p.style.display = 'flex');
                if (anyEdit) anyEdit.style.display = 'flex';
                if (pill247Edit) {
                    pill247Edit.classList.add('hidden');
                    pill247Edit.style.display = 'none';
                    pill247Edit.classList.remove('active', 'locked-pill');
                }
                if(edTogglePillWrapper) edTogglePillWrapper.style.display = 'flex';
                if(edContainer) edContainer.style.display = editReminderActive ? 'flex' : 'none';
                
                const edPill = document.getElementById('edit-reminder-toggle-pill');
                if(edPill) edPill.classList.toggle('active', editReminderActive);
                const edDaysWrap = document.getElementById('edit-days-section-wrapper');
                if (edDaysWrap) edDaysWrap.style.display = 'flex';
            }
            
            customModes['edit-start'] = false;
            customModes['edit-interval'] = false;
            document.getElementById('dropdown-edit-start').style.display = 'block';
            document.getElementById('edit-start-custom').classList.add('hidden');
            document.getElementById('dropdown-edit-interval').style.display = 'block';
            document.getElementById('edit-interval-custom').classList.add('hidden');

            editStartValue = h.startTime || '08:00';
            seleccionarOpcionDropdown('edit-start', editStartValue, editStartValue);
            
            editIntervalValue = `${h.reminderInterval || 3}h`;
            seleccionarOpcionDropdown('edit-interval', editIntervalValue, `Cada ${h.reminderInterval || 3} hora(s)`);

            pintarPillsMomento('edit');

            document.querySelectorAll('#edit-day-selector .day-btn').forEach(btn => {
                const dayMatch = btn.getAttribute('onclick').match(/\d+/);
                if (dayMatch) {
                    const day = parseInt(dayMatch[0]);
                    btn.classList.toggle('active', editSelectedDays.includes(day));
                }
                if (editSelectedMoments.includes('24/7')) {
                    btn.style.pointerEvents = 'none';
                }
            });

            const esUnaVez = habitEsUnaVez(h);
            if (esUnaVez) {
                const dateEl = document.getElementById('edit-once-date');
                const timeEl = document.getElementById('edit-once-time');
                const fechas = fechasUnicasDeHabito(h);
                if (dateEl) dateEl.value = fechas.length ? fechas.join(',') : (fechaUnicaDeHabito(h) || isoFechaLocal(selectedDate || new Date()));
                if (timeEl) timeEl.value = h.startTime || '08:00';
                pintarEtiquetaFechaDeseo();
                pintarEtiquetaHoraUnica('edit-once-time');
            }
            aplicarLayoutUnaVez('edit', esUnaVez);

            document.getElementById('edit-habit-modal').classList.add('active');
            editVecesPorSemana = h.vecesPorSemana || 0;
            glyphPickerTouched = false;
            editGlyph = sanitizarGlifoPersistido(h) || glifoCatalogoPorNombre(h.nombre);
            editAccent = colorAcentoHabito(h);
            pintarModoSemana('edit');
            pintarPreviewLook('edit');
            pintarHintAbstinencia('edit-abst-hint', h.nombre);
            aplicarTemaGlobalHabitos(currentThemeHue);
        }

        async function guardarEdicionHabito() {
            if (habitToEditIndex === null) return;
            const inputName = document.getElementById('edit-habit-name');
            const nuevoNombre = recortarTexto(cleanHabitName(inputName ? inputName.value.trim() : ''), AWAKE_LIMITE_HABITO);

            if (!nuevoNombre) {
                mostrarToastLujo('Escribe un nombre.', { tipo: 'error' });
                if (inputName) inputName.focus();
                return;
            }
            const dupEdit = indiceHabitoPorNombre(nuevoNombre, habitToEditIndex);
            if (dupEdit > -1) {
                avisarHabitoDuplicado(dupEdit);
                if (inputName) inputName.focus();
                return;
            }
            const h = misHabitos[habitToEditIndex];
            const esUnaVez = habitEsUnaVez(h);
            if (esUnaVez) {
                const fechas = fechasDesdeValor((document.getElementById('edit-once-date') || {}).value || '');
                const hora = (document.getElementById('edit-once-time') || {}).value || '';
                if (!fechas.length || !hora) {
                    mostrarToastLujo('Elige al menos un día y la hora.', { tipo: 'error' });
                    return;
                }
                editSelectedMoments = momentosDeUnaVezList(fechas, hora);
                editSelectedDays = Array.from(new Set(fechas.map(iso => {
                    const d = parseIsoFechaLocal(iso);
                    return d ? d.getDay() : new Date().getDay();
                })));
                editStartValue = hora;
                h.unaVez = true;
                h.fechasUnicas = fechas;
                h.fechaUnica = fechas[0];
                h.tipo = 'Una vez';
            } else if (editSelectedMoments.length === 0 || (!nombreSugiereHabitoContinuo(nuevoNombre) && !editSelectedMoments.includes('24/7') && !editVecesPorSemana && editSelectedDays.length === 0)) {
                mostrarToastLujo(editSelectedMoments.length === 0 ? 'Elige al menos un momento del día.' : 'Elige los días o las veces por semana.', { tipo: 'error' });
                return;
            }

            const reminderActive = editReminderActive;
            const startTimeCustom = document.getElementById('edit-start-custom').value.trim();
            const startTime = esUnaVez ? editStartValue : (customModes['edit-start'] && startTimeCustom ? startTimeCustom : editStartValue);

            const intervalCustom = document.getElementById('edit-interval-custom').value.trim();
            let reminderInterval = 3;
            if (customModes['edit-interval'] && intervalCustom) {
                reminderInterval = parseInt(intervalCustom) || 3;
            } else {
                reminderInterval = parseInt(editIntervalValue) || 3;
            }

            h.nombre = nuevoNombre;
            h.momentos = [...editSelectedMoments];
            h.dias = editSelectedMoments.includes('24/7') ? [1,2,3,4,5,6,0] : [...editSelectedDays];
            h.permite247 = esUnaVez ? false : (editSelectedMoments.includes('24/7') || nombreSugiereHabitoContinuo(nuevoNombre));
            h.reminderActive = reminderActive;
            h.startTime = startTime;
            h.reminderInterval = esUnaVez ? 0 : reminderInterval;
            h.vecesPorSemana = esUnaVez ? 0 : ((h.permite247 || editSelectedMoments.includes('24/7')) ? 0 : (editVecesPorSemana || 0));
            if (h.vecesPorSemana) h.dias = [1, 2, 3, 4, 5, 6, 0];
            h.glyph = resolverGlyphAlGuardar(nuevoNombre, glyphPickerTouched ? editGlyph : (editGlyph || h.glyph), glyphPickerTouched);
            h.bgColor = editAccent || '#10151f';
            if (!esHabitoCatalogoDefecto(nuevoNombre)) {
                registrarCatalogoPersonal(
                    nuevoNombre,
                    esUnaVez ? 'unaVez' : (h.permite247 ? 'abstinencia' : 'ritual'),
                    { glyph: h.glyph, bgColor: h.bgColor, tipo: esUnaVez ? 'Una vez' : h.tipo }
                );
            }

            if (currentUser && h.id) {
                await actualizarHabitoNubeConReintento(h);
            }

            document.getElementById('edit-habit-modal').classList.remove('active');
            habitToEditIndex = null;
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            programarAlarmasNativasHabitos();
        }

        function solicitarEliminarHabito(index) {
            habitIndexToDelete = index;
            confirmModalAction = null;
            resetConfirmModalButtons();
            const h = misHabitos[index];
            const logs = h ? (historialAgrupado[cleanHabitName(h.nombre)] || []) : [];
            const copia = copiaNaturalezaHabito(h);
            document.getElementById('confirm-modal-title').textContent = copia.tituloEliminar;
            document.getElementById('confirm-modal-text').textContent = logs.length
                ? copia.conRegistros
                : copia.sinRegistros;
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            document.getElementById('confirm-modal').classList.add('active');
        }

        function cerrarModalConfirmacion() {
            document.getElementById('confirm-modal').classList.remove('active');
            habitIndexToDelete = null;
            wishIndexToDelete = null;
            confirmModalAction = null;
            resetConfirmModalButtons();
        }

        function ejecutarAccionConfirmada() {
            const accion = confirmModalAction;
            const indiceHabito = habitIndexToDelete;
            confirmModalAction = null;
            cerrarModalConfirmacion();
            if (accion) {
                const result = accion();
                if (result && typeof result.then === 'function') result.catch(err => console.error(err));
            } else if (indiceHabito !== null) {
                eliminarHabitoReal(indiceHabito);
            }
        }

        async function eliminarHabitoReal(index) {
            const h = misHabitos[index];
            if (!h) return;
            const nombre = cleanHabitName(h.nombre);
            const claves = Object.keys(historialAgrupado).filter(k => cleanHabitName(k) === nombre);
            const logsABorrar = claves.flatMap(k => historialAgrupado[k] || []);

            if (currentUser) {
                const idsRemotos = logsABorrar
                    .map(ej => ej && ej.id)
                    .filter(id => id && String(id).indexOf('reg_') !== 0);
                if (idsRemotos.length > 0) {
                    const { error } = await supabaseClient.from('habit_logs').delete().in('id', idsRemotos);
                    if (error) throw error;
                }
                const { error: namedLogsError } = await supabaseClient.from('habit_logs').delete().eq('user_id', currentUser.id).eq('habit_name', nombre);
                if (namedLogsError) throw namedLogsError;
                if (h.nombre && h.nombre !== nombre) {
                    const { error: originalNameError } = await supabaseClient.from('habit_logs').delete().eq('user_id', currentUser.id).eq('habit_name', h.nombre);
                    if (originalNameError) throw originalNameError;
                }
                if (h.id) {
                    const { error: habitError } = await supabaseClient.from('habits').delete().eq('id', h.id);
                    if (habitError) throw habitError;
                }
            }

            await borrarMediaDeRegistros(logsABorrar);

            logsABorrar.forEach(ej => {
                if (ej && ej.id) {
                    marcarSelloEliminado(ej.id);
                    delete window.registrosGlobalMap[ej.id];
                }
            });
            claves.forEach(k => delete historialAgrupado[k]);
            totalCompletadas = Math.max(0, (totalCompletadas || 0) - logsABorrar.length);

            misHabitos.splice(index, 1);
            if (fichaHabitoIndex === index) cerrarFichaHabito();
            else if (fichaHabitoIndex != null && fichaHabitoIndex > index) fichaHabitoIndex--;
            guardarEstadoLocal();
            avisarDiarioRemoto();
            renderizarMiRutina();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            actualizarEstadisticasPerfil();
            programarAlarmasNativasHabitos();
            mostrarToastLujo(copiaNaturalezaHabito(h).toastEliminado, { tipo: 'exito' });
        }

        function toggleScoreContainer(checkbox) {
            const container = document.getElementById('score-container');
            if(!container) return;
            container.classList.toggle('hidden', !checkbox.checked);
        }

        function clicCheckboxHabito(index, momento) {
            const h = misHabitos[index];
            if (esFechaFutura(selectedDate)) {
                mostrarToastLujo('Las tareas futuras aún no se pueden completar.', { tipo: 'error' });
                return;
            }
            if (estaOmitidoEnFecha(h, selectedDate, momento)) {
                deshacerOmisionHabito(index, momento);
                return;
            }
            const selectedStr = selectedDate.toDateString();
            const todayStr = new Date().toDateString();
            const isToday = (selectedStr === todayStr);
            const completadoHoy = estaCompletadoEnFecha(h, selectedDate, momento);

            if (!isToday && !completadoHoy) {
                document.getElementById('confirm-modal-title').textContent = "⚠️ Tarea fuera del día actual";
                document.getElementById('confirm-modal-text').textContent = "Estás intentando completar una tarea que no forma parte del día presente. ¿Deseas continuar?";
                confirmModalAction = () => {
                    ejecutarLogicaCheckboxHabito(index, momento, selectedDate, completadoHoy);
                };
                document.getElementById('confirm-modal').classList.add('active');
                return;
            }

            ejecutarLogicaCheckboxHabito(index, momento, selectedDate, completadoHoy);
        }

        function ejecutarLogicaCheckboxHabito(index, momento, dateTarget, completadoHoy) {
            if (esFechaFutura(dateTarget) && !completadoHoy) return;
            const h = misHabitos[index];
            const cleanHName = cleanHabitName(h.nombre);
            pendingHabitMotion = { key: `${index}-${momento}`, completing: !completadoHoy };

            if (habitEsAbstinencia(h)) {
                const estado = estadoSelloEnFecha(h, dateTarget, '24/7');
                if (estado === 'recaida') {
                    borrarLogDelDia(h, dateTarget, '24/7').then(() => {
                        h.streak = calcularRachaHastaFecha(h.nombre, dateTarget);
                        if (currentUser && h.id) supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id);
                        guardarEstadoLocal();
                        avisarDiarioRemoto();
                        renderizarMiRutina();
                        renderizarTabHistorial();
                        actualizarEstadisticasPerfil();
                        try { renderizarInsignias(); } catch (e) {}
                        mostrarToastLujo('Recaída deshecha', { tipo: 'exito' });
                    });
                    return;
                }
                resetConfirmModalButtons();
                document.getElementById('confirm-modal-title').textContent = 'Hoy recaí';
                document.getElementById('confirm-modal-text').textContent = 'El día dejará de estar sellado y la racha se rompe. ¿Continuar?';
                confirmModalAction = async () => {
                    await borrarLogDelDia(h, dateTarget, '24/7');
                    await insertarRegistroMarca({
                        index,
                        momento: '24/7',
                        dateTarget,
                        texto: `[24/7] ${AWAKE_MARK_RECAIDA}`,
                        toast: 'Recaída registrada. La racha se rompe.'
                    });
                };
                document.getElementById('confirm-modal').classList.add('active');
                pendingHabitMotion = null;
                return;
            }

            if (momento === '24/7') {
                if (completadoHoy) {
                    desellarSellosHabitoEnFecha(h, dateTarget, '24/7').then(() => {
                        if (!h.enDescanso) {
                            h.streak = calcularRachaHastaFecha(cleanHName, dateTarget);
                        }
                        if (currentUser && h.id) {
                            supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id);
                        }
                        guardarEstadoLocal();
                        avisarDiarioRemoto();
                        renderizarMiRutina();
                        renderizarPerfilPublicacionesGrid();
                        renderizarTabHistorial();
                        actualizarEstadisticasPerfil();
                        try { renderizarInsignias(); } catch (e) {}
                    });
                } else {
                    (async () => {
                        await insertarRegistroMarca({
                            index,
                            momento: '24/7',
                            dateTarget,
                            texto: '[24/7] Completado',
                            celebrar: true,
                            privacy: 'seguidores'
                        });
                    })();
                }
                return;
            }

            if (completadoHoy) {
                const copia = copiaNaturalezaHabito(h);
                const momTxt = etiquetaMomentoHabito(momento);
                const nat = naturalezaHabito(h);
                let textoDesellar = copia.desellarTexto;
                if (nat === 'ritual' && momTxt) {
                    textoDesellar = `Se elimina el sello de ${momTxt}, incluida cualquier foto.`;
                }
                document.getElementById('confirm-modal-title').textContent = copia.desellarTitulo;
                document.getElementById('confirm-modal-text').textContent = textoDesellar;
                confirmModalAction = async () => {
                    await desellarSellosHabitoEnFecha(h, dateTarget, momento);

                    if (!h.enDescanso) {
                        h.streak = calcularRachaHastaFecha(cleanHName, dateTarget);
                    }
                    if (currentUser && h.id) {
                        try { await supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id); } catch (e) {}
                    }

                    guardarEstadoLocal();
                    avisarDiarioRemoto();
                    pendingHabitMotion = { key: `${index}-${momento}`, completing: false };
                    renderizarMiRutina();
                    renderizarPerfilPublicacionesGrid();
                    renderizarTabHistorial();
                    actualizarEstadisticasPerfil();
                    try { renderizarInsignias(); } catch (e) {}
                };
                document.getElementById('confirm-modal').classList.add('active');
                pendingHabitMotion = null;
                return;
            }
            
            habitIndexToComplete = index;
            completionMomentTarget = momento;
            currentCompletionPrivacy = 'seguidores';
            const textEl = document.getElementById('completion-text');
            const imgEl = document.getElementById('completion-image');
            const scoreCheck = document.getElementById('toggle-score');
            const scoreBox = document.getElementById('score-container');
            if (textEl) textEl.value = '';
            if (imgEl) imgEl.value = '';
            const previewWrap = document.getElementById('completion-image-preview-wrap');
            const previewImg = document.getElementById('completion-image-preview');
            if (previewWrap && previewImg) {
                previewImg.removeAttribute('src');
                previewWrap.classList.add('hidden');
            }
            if (scoreCheck) scoreCheck.checked = false;
            if (scoreBox) scoreBox.classList.add('hidden');
            document.querySelectorAll('#completion-privacy-selector .config-pill').forEach((p, i) => {
                p.classList.toggle('active', i === 0);
            });
            guardarCompletado();
        }

        function cerrarModalCompletar() {
            cerrarAwakePick();
            document.getElementById('complete-modal').classList.remove('active');
            habitIndexToComplete = null;
            completionMomentTarget = null;
        }

        function comprimirImagenSegura(file, callback) {
            if (!file || !file.type || String(file.type).indexOf('image/') !== 0) {
                callback(null);
                return;
            }
            if (file.size > 12 * 1024 * 1024) {
                callback(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvasImg = document.createElement('canvas');
                    let widthC = img.width;
                    let heightC = img.height;
                    const maxDim = 900;
                    if (widthC > heightC && widthC > maxDim) {
                        heightC = Math.round((heightC * maxDim) / widthC);
                        widthC = maxDim;
                    } else if (heightC > maxDim) {
                        widthC = Math.round((widthC * maxDim) / heightC);
                        heightC = maxDim;
                    }
                    canvasImg.width = widthC;
                    canvasImg.height = heightC;
                    const ctxImg = canvasImg.getContext('2d');
                    ctxImg.drawImage(img, 0, 0, widthC, heightC);
                    callback(canvasImg.toDataURL('image/jpeg', 0.82));
                };
                img.onerror = () => callback(null);
                img.src = e.target.result;
            };
            reader.onerror = () => callback(null);
            reader.readAsDataURL(file);
        }

        async function guardarCompletado() {
            if (habitIndexToComplete === null) return;

            const fileInput = document.getElementById('completion-image');
            const textEl = document.getElementById('completion-text');
            const scoreCheck = document.getElementById('toggle-score');
            const scoreSelect = document.getElementById('completion-score');

            const rawText = textEl && textEl.value.trim() ? textEl.value.trim() : 'Completado';
            const userText = recortarTexto(rawText, AWAKE_LIMITE_SELLO);
            const comentario = `[${completionMomentTarget}] ${userText}`;
            const score = scoreCheck && scoreCheck.checked && scoreSelect ? scoreSelect.value : null;

            const h = misHabitos[habitIndexToComplete];
            const permiteFoto = habitoPermiteFoto(h, completionMomentTarget);
            const cleanHName = cleanHabitName(h.nombre);
            const prevStreak = h.streak || 0;
            const sealIndex = habitIndexToComplete;
            const sealMoment = completionMomentTarget;
            const esPrimero = contarSellosDelDia(selectedDate) === 0;
            const existing = buscarLogHabitoEnFecha(h, selectedDate, sealMoment);
            const hayArchivo = permiteFoto && fileInput && fileInput.files && fileInput.files[0];
            if (existing) {
                const aplicarUpdate = async (imagenUrl) => {
                    if (imagenUrl && esDataUrlMedia(imagenUrl)) imagenUrl = null;
                    const anteriores = imagenUrl ? urlsMediaDeRegistro(existing) : [];
                    existing.texto = comentario;
                    existing.score = score;
                    existing.privacidad = currentCompletionPrivacy;
                    if (imagenUrl) {
                        existing.imagenes = [imagenUrl];
                        existing.image_url = imagenUrl;
                    }
                    if (currentUser && existing.id && String(existing.id).indexOf('reg_') !== 0) {
                        const patch = {
                            text_comment: comentario,
                            privacy: currentCompletionPrivacy
                        };
                        if (imagenUrl) patch.image_url = imagenUrl;
                        try { await supabaseClient.from('habit_logs').update(patch).eq('id', existing.id); } catch (e) {}
                    }
                    if (imagenUrl) await borrarVariasMediaAwake(anteriores.filter(u => u !== imagenUrl));
                    guardarEstadoLocal();
                    avisarDiarioRemoto();
                    cerrarModalCompletar();
                    renderizarMiRutina();
                    renderizarPerfilPublicacionesGrid();
                    renderizarTabHistorial();
                };
                if (hayArchivo) {
                    comprimirImagenSegura(fileInput.files[0], async (base64Result) => {
                        if (!base64Result) {
                            mostrarToastLujo('No se pudo leer la imagen.', { tipo: 'error' });
                            return;
                        }
                        const url = await subirImagenOAvisar(base64Result, 'logs', 'jpg');
                        if (!url) return;
                        await aplicarUpdate(url);
                    });
                } else {
                    await aplicarUpdate(null);
                }
                return;
            }
            pendingHabitMotion = { key: `${sealIndex}-${sealMoment}`, completing: true };

            cerrarModalCompletar();

            const extra = camposSelloHabito(h, selectedDate, sealMoment);
            const dateObj = extra.dateObj;
            const fechaFormateada = dateObj.toLocaleDateString();

            if (!historialAgrupado[cleanHName]) {
                historialAgrupado[cleanHName] = [];
            }

            const revertirFalloSello = async (imagenUrl) => {
                pendingHabitMotion = null;
                await borrarVariasMediaAwake(imagenUrl ? [imagenUrl] : []);
                mostrarToastLujo('No se pudo sellar. Inténtalo de nuevo.', { tipo: 'error' });
                renderizarMiRutina();
            };

            const procesarRegistro = async (imagenUrl) => {
                selloOperacionEnCurso();
                try {
                    if (imagenUrl && esDataUrlMedia(imagenUrl)) imagenUrl = null;
                    let realId = null;

                    if (currentUser) {
                        const { data: insertedLog, error } = await supabaseClient.from('habit_logs').insert([{
                            user_id: currentUser.id,
                            habit_name: cleanHName,
                            text_comment: comentario,
                            image_url: imagenUrl || null,
                            privacy: currentCompletionPrivacy,
                            created_at: dateObj.toISOString()
                        }]).select('id').single();

                        if (error) {
                            console.error("Error al insertar log en Supabase:", error.message);
                            await revertirFalloSello(imagenUrl);
                            return;
                        }
                        if (insertedLog) {
                            realId = insertedLog.id;
                        }
                    }

                    if (!realId) {
                        realId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                    }

                    const registroObj = {
                        id: realId,
                        user_id: currentUser ? currentUser.id : null,
                        nombre: cleanHName,
                        habitId: extra.habitId,
                        dia: extra.dia,
                        fecha: fechaFormateada,
                        dateObj: extra.dateObj,
                        timestamp: extra.timestamp,
                        texto: comentario,
                        score: score,
                        imagenes: imagenUrl ? [imagenUrl] : [],
                        image_url: imagenUrl || null,
                        privacidad: currentCompletionPrivacy,
                        likes: 0,
                        likedByMe: false,
                        comentarios: []
                    };

                    window.registrosGlobalMap[registroObj.id] = registroObj;
                    historialAgrupado[cleanHName].unshift(registroObj);
                    historialAgrupado[cleanHName].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    marcarSelloReciente(registroObj.id);

                    if (!h.enDescanso) {
                        h.streak = calcularRachaHastaFecha(cleanHName, selectedDate);
                    }
                    if (currentUser && h.id) {
                        try {
                            await supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id);
                        } catch (e) {
                            console.error("Error al actualizar racha:", e);
                        }
                    }

                    totalCompletadas++;
                    try { if (window.awakeAnalytics) window.awakeAnalytics.track('habit_sealed', { nombre: cleanHName }); } catch (e) {}
                    try { if (typeof cancelarAvisoRiesgoHoySiProcede === 'function') cancelarAvisoRiesgoHoySiProcede(); } catch (e) {}
                    guardarEstadoLocal();
                    avisarDiarioRemoto();
                    registrarSelloParaDeshacer({
                        index: sealIndex,
                        momento: sealMoment,
                        logId: registroObj.id,
                        prevStreak
                    });
                    renderizarMiRutina();
                    renderizarPerfilPublicacionesGrid();
                    renderizarTabHistorial();
                    actualizarEstadisticasPerfil();
                    celebrarSello(cleanHName, esPrimero);
                } catch (err) {
                    console.error("Excepción al guardar completado:", err);
                    await revertirFalloSello(imagenUrl);
                } finally {
                    selloOperacionTerminada();
                }
            };

            if (hayArchivo) {
                comprimirImagenSegura(fileInput.files[0], async (base64Result) => {
                    if (!base64Result) {
                        mostrarToastLujo('No se pudo leer la imagen.', { tipo: 'error' });
                        await procesarRegistro(null);
                        return;
                    }
                    const url = await subirImagenOAvisar(base64Result, 'logs', 'jpg');
                    await procesarRegistro(url || null);
                });
            } else {
                await procesarRegistro(null);
            }
        }

        function elegirVecesPorSemana(n) {
            configVecesPorSemana = n > 0 ? n : 0;
            pintarModoSemana('config');
        }

        function elegirVecesPorSemanaEdit(n) {
            editVecesPorSemana = n > 0 ? n : 0;
            pintarModoSemana('edit');
        }

        function elegirModoSemana(modo, n) {
            if (modo === 'edit') elegirVecesPorSemanaEdit(n);
            else elegirVecesPorSemana(n);
        }

        function abrirSelectorVeces(modo) {
            const actual = modo === 'edit' ? editVecesPorSemana : configVecesPorSemana;
            if (actual > 0) {
                pintarModoSemana(modo);
                return;
            }
            if (modo === 'edit') elegirVecesPorSemanaEdit(3);
            else elegirVecesPorSemana(3);
        }

        function pintarModoSemana(modo) {
            const n = modo === 'edit' ? editVecesPorSemana : configVecesPorSemana;
            const root = document.getElementById(modo === 'edit' ? 'edit-week-n' : 'config-week-n');
            const days = document.getElementById(modo === 'edit' ? 'edit-day-selector' : 'day-selector-config');
            const nSel = document.getElementById(modo === 'edit' ? 'edit-week-n-selector' : 'config-week-n-selector');
            const wrap = document.getElementById(modo === 'edit' ? 'edit-days-section-wrapper' : 'days-section-wrapper');
            const label = wrap ? wrap.querySelector('label') : null;
            if (label) label.textContent = n > 0 ? 'Veces / semana' : 'Días';
            if (root) {
                root.querySelectorAll('.config-pill').forEach(p => {
                    const weekMode = p.getAttribute('data-week-mode');
                    p.classList.toggle('active', (n === 0 && weekMode === 'fixed') || (n > 0 && weekMode === 'n'));
                });
                const nBtn = root.querySelector('[data-week-mode="n"]');
                if (nBtn) nBtn.textContent = n > 0 ? (n + ' / semana') : 'Veces / semana';
            }
            if (days) {
                days.style.display = n > 0 ? 'none' : 'flex';
                days.classList.toggle('hidden', n > 0);
            }
            if (nSel) {
                nSel.classList.toggle('hidden', n <= 0);
                nSel.style.display = n > 0 ? 'flex' : 'none';
                nSel.querySelectorAll('[data-week-n]').forEach(b => {
                    b.classList.toggle('active', Number(b.getAttribute('data-week-n')) === n);
                });
            }
        }

        function pintarPreviewLook(modo) {
            const glyph = modo === 'edit' ? editGlyph : configGlyph;
            const accent = modo === 'edit' ? editAccent : configAccent;
            const name = modo === 'edit'
                ? ((document.getElementById('edit-habit-name') || {}).value || '')
                : ((document.getElementById('config-habit-nombre') || {}).value || (tempSelectedHabit && tempSelectedHabit.nombre) || '');
            const iconEl = document.getElementById(modo + '-icon-preview');
            const colorEl = document.getElementById(modo + '-color-preview');
            const fill = accent || colorIconoHabito(name) || PH_ICON_DEFAULT;
            if (iconEl) iconEl.innerHTML = htmlGlifoHabito(name || 'Ritual', 22, glyph || 'sparkle', fill);
            if (colorEl) colorEl.style.background = fill;
        }

        function elegirGlyphHabito(clave, modo) {
            glyphPickerTouched = true;
            if (modo === 'edit') editGlyph = clave;
            else configGlyph = clave;
            pintarPreviewLook(modo);
        }

        function elegirAcentoHabito(hex, modo) {
            if (modo === 'edit') editAccent = hex || '';
            else configAccent = hex || '';
            pintarPreviewLook(modo);
        }
