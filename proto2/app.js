
        let currentUser = null;
        let authMode = 'login'; 

        let canvas = null;
        let ctx = null;

        let width = 0;
        let height = 0;

        let savedBg = parseInt(localStorage.getItem('proto2monolith_bg_choice'));
        const FONDOS_DISPONIBLES = [1, 2];
        function normalizarFondo(id) {
            const n = parseInt(id, 10);
            if (n === 1) return 1;
            return 2;
        }
        let activeBackground = localStorage.getItem('proto2monolith_bg_choice') == null ? 2 : normalizarFondo(savedBg);
        let fondoForzadoOverlay = false;
        let animationFrameId = null;

        let spaceStars = [];
        let spaceComets = [];

        let activeDirectChatUser = null;
        let renderedChatMessageIds = new Set();
        let pendingOptimisticChatTexts = [];
        let dbRealtimeChannel = null;
        let diarioBroadcastChannel = null;
        let recargaDiarioTimer = null;
        let recargaDiarioPendiente = false;
        let diarioSyncInFlight = false;
        let diarioSyncIntervalId = null;
        let ultimaFirmaDiario = '';
        let prefsVisualesLocalAt = 0;
        let realtimeRetryTimer = null;
        let chatRealtimeChannel = null;
        let chatBroadcastChannel = null;
        let chatBroadcastPeerId = null;
        let chatPollIntervalId = null;
        let chatLoadGeneration = 0;
        let queuedChatInserts = [];
        let realtimeChatRetryTimer = null;
        let chatSyncInFlight = false;
        let pendingChatReply = null;
        let pendingFcmToken = null;
        let pendingChatOpenFromNotif = null;
        let exploreSearchTimer = null;
        let exploreSearchGen = 0;
        const AWAKE_LIMITE_NICK = 24;
        const AWAKE_LIMITE_BIO = 150;
        const AWAKE_LIMITE_COMENTARIO = 280;
        const AWAKE_LIMITE_CHAT = 1000;
        const AWAKE_LIMITE_SELLO = 400;
        const AWAKE_LIMITE_HABITO = 60;
        const awakeWriteStamp = {};
        let nativeNotifListenersBound = false;
        let nativePushReady = false;
        let chatMediaRecorder = null;
        let chatAudioChunks = [];
        let chatRecording = false;
        let chatRecordCancel = false;
        let chatRecordTimerId = null;
        let chatRecordStartedAt = 0;
        let chatHoldStartX = 0;
        let chatHoldStartY = 0;
        let chatHoldPointerId = null;
        let chatHoldActive = false;
        let chatHoldWindowBound = false;
        let chatMicStarting = false;
        let chatRecordLocked = false;
        let chatLockArmed = false;
        let chatLockPending = false;
        let chatHoldDownAt = 0;
        let chatStopping = false;
        let chatCancelLockTimer = null;
        let chatRecordPaused = false;
        let chatPauseStartedAt = 0;
        let chatPausedTotalMs = 0;
        let chatAnalyser = null;
        let chatWaveRaf = null;
        let chatWaveSource = null;
        const CHAT_LOCK_ARM_DY = -100;
        const CHAT_LOCK_SNAP_DY = -152;
        const CHAT_CANCEL_DX = -80;
        let habitReminderFiredKeys = new Set();
        let habitReminderIntervalId = null;
        let ritualClockId = null;
        let habitCountdownId = null;
        let cosmicAudioCtx = null;
        const FEEDBACK_PREFS_KEY = 'proto2awake_feedback_prefs';
        const IOS_ADAPT_KEY = 'proto2awake_ios_adapt';
        let prefsFeedback = { sonido: true, vibracion: true, volumen: 100 };
        let prefsIosAdapt = false;
        try {
            const savedFeedback = JSON.parse(localStorage.getItem(FEEDBACK_PREFS_KEY) || '{}');
            if (typeof savedFeedback.sonido === 'boolean') prefsFeedback.sonido = savedFeedback.sonido;
            if (typeof savedFeedback.vibracion === 'boolean') prefsFeedback.vibracion = savedFeedback.vibracion;
            if (typeof savedFeedback.volumen === 'number') {
                prefsFeedback.volumen = Math.max(0, Math.min(100, Math.round(savedFeedback.volumen)));
            } else if (savedFeedback.sonido === false) {
                prefsFeedback.volumen = 0;
            }
        } catch (e) {}
        try { prefsIosAdapt = localStorage.getItem(IOS_ADAPT_KEY) === '1'; } catch (e) {}
        let inboxLoadGeneration = 0;
        let chatLastMessageAt = null;
        const CHAT_HISTORIAL_LIMITE = 60;
        const CHAT_READS_KEY = 'proto2awake_chat_last_read';
        let lecturasChatHidratadasPara = null;
        const ONBOARD_KEY = 'proto2awake_onboarded';
        const FIRST_SEAL_KEY = 'proto2awake_first_seal';
        let toastTimerId = null;
        let toastOnHide = null;
        let streakHintTimer = null;
        let lastSealSnapshot = null;
        let badgeToastPendiente = null;
        let badgeBannerTimerId = null;
        let insigniasPendientesSello = [];
        let selloWriteInFlight = 0;
        const sellosIdsEliminados = new Set();
        const sellosIdsRecientes = new Set();

        function idSelloClave(id) {
            return id == null || id === '' ? '' : String(id);
        }

        function marcarSelloEliminado(id) {
            const sid = idSelloClave(id);
            if (!sid) return;
            sellosIdsEliminados.add(sid);
            sellosIdsRecientes.delete(sid);
        }

        function marcarSelloReciente(id) {
            const sid = idSelloClave(id);
            if (!sid || sellosIdsEliminados.has(sid)) return;
            sellosIdsRecientes.add(sid);
        }

        function selloIdEstaEliminado(id) {
            const sid = idSelloClave(id);
            return !!(sid && sellosIdsEliminados.has(sid));
        }

        function reconciliarIdsSellosTrasSync(fetchedIdSet) {
            const set = fetchedIdSet || new Set();
            Array.from(sellosIdsEliminados).forEach(sid => {
                if (!set.has(sid)) sellosIdsEliminados.delete(sid);
            });
            Array.from(sellosIdsRecientes).forEach(sid => {
                if (set.has(sid) || selloIdEstaEliminado(sid)) sellosIdsRecientes.delete(sid);
            });
        }
        let onboardHabitKey = 'hidratarse';
        let onboardSceneKey = 'cuerpo';
        let peerLastReadAt = null;
        let nativeAlarmIds = [];

        let slider = null;
        let tabs = [];
        let currentIndex = 0;
        let startX = 0;
        let startY = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;

        function anchoVistaSlider() {
            const vp = document.getElementById('content-viewport');
            return (vp && vp.clientWidth) ? vp.clientWidth : window.innerWidth;
        }

        function aplicarPosicionSlider(animar) {
            if (!slider) return;
            slider.style.transition = animar
                ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                : 'none';
            slider.style.transform = `translateX(-${currentIndex * 100}%)`;
            prevTranslate = -currentIndex * anchoVistaSlider();
            currentTranslate = prevTranslate;
            requestAnimationFrame(actualizarTabInk);
        }

        const ptrState = {
            armed: false,
            pulling: false,
            refreshing: false,
            startX: 0,
            startY: 0,
            dy: 0,
            scroller: null
        };
        const PTR_THRESHOLD = 72;
        const PTR_MAX = 128;
        const PTR_HOLD = 56;


        let misHabitos = [];
        let misDeseos = [];
        let activeFilter = determinarMomentoActual();
        let bloqueActualSeleccionado = null;
        let habitIndexToComplete = null;
        let wishIndexToComplete = null;
        let habitToEditIndex = null;
        let habitIndexToDelete = null; 
        let wishIndexToDelete = null;
        let wishAddInFlight = false;
        let historialAgrupado = {};
        window.registrosGlobalMap = {};
        window.userHasAvatar = false; 
        window.tempAvatarBase64 = null; 

        let selectedDate = new Date();
        let calendarStripWeekStart = null;
        let calStripOffset = 0;
        let calStripVwGuardado = 0;
        let fichaHabitoIndex = null;
        let fichaHabitoMes = new Date();
        let fichaHabitoRango = 'mes'; 
        let currentCompletionPrivacy = 'seguidores';
        let accountPrivacy = 'publico';
        let confirmModalAction = null;

        function normalizarPrivacidadCuenta(valor) {
            const p = String(valor || '').toLowerCase();
            return (p === 'privado' || p === 'private') ? 'privado' : 'publico';
        }

        function puedeVerHistorialCuenta(privacidad, isFollowing) {
            return normalizarPrivacidadCuenta(privacidad) !== 'privado' || !!isFollowing;
        }

        let misSeguidores = [];
        let misSeguidos = [];
        let viewingUserId = null; 
        let socialSeccionActiva = 'actividad';
        let badgeVistaActiva = 'showcase'; // 'showcase' | 'coleccion' 
        let currentActiveSocialTab = 'seguidores';
        let currentSocialTargetUserId = null;
        let navReturnStack = [];

        let historyExpanded = {};
        let historyVista = 'ritual';
        let weekStartDay = 1;
        let ritualPrefs = { digestManana: true, digestTarde: true, digestNoche: true, horaManana: '08:00', horaTarde: '15:00', horaNoche: '21:30', riesgoActivo: true, horaRiesgo: '18:00', resumenActivo: true, horaResumen: '20:00' };
        let lastDiarioSyncAt = 0;
        let selloTimerPaused = false;
        let configVecesPorSemana = 0;
        let editVecesPorSemana = 0;
        let configGlyph = '';
        let editGlyph = '';
        let configAccent = '';
        let editAccent = '';
        let glyphPickerTouched = false;
        let catalogoNaturaleza = 'ritual';
        let catalogoPersonal = { unaVez: [], rituales: [], abstinencias: [] };
        let configBloqueId = '';
        let cloudHabitsExtraCols = true;
        let cloudWishesDueDate = true;
        let cloudPrefsRitual = true;
        let cloudBadgesUnlocked = true;
        let confirmModalAltAction = null;
        let selloTimerHandle = null;
        let selloTimerLeft = 0;
        let selloTimerPayload = null;
        let daySealedToastKey = '';

        function habitoPorNombre(nombre) {
            const n = cleanHabitName(nombre);
            return (misHabitos || []).find(h => cleanHabitName(h.nombre) === n) || null;
        }

        function habitEsArchivado(h) {
            return !!(h && h.archivado);
        }

        function habitEsAbstinencia(h) {
            if (!h) return false;
            const clave = claveIconoHabito(h.nombre);
            return /dejar de fumar|dejar de vappear|no fumar|pasar tiempo sin redes|pasar tiempo sin movil/.test(clave);
        }

        function habitPermiteTimer(h) {
            if (!h) return false;
            const clave = claveIconoHabito(h.nombre);
            return /meditar|estiramiento|estirar/.test(clave);
        }

        function logEsOmitido(l) {
            return !!(l && l.texto && String(l.texto).indexOf(AWAKE_MARK_OMITIDO) !== -1);
        }

        function logEsRecaida(l) {
            return !!(l && l.texto && String(l.texto).indexOf(AWAKE_MARK_RECAIDA) !== -1);
        }

        function logEsDiaLibre(l) {
            return !!(l && l.texto && String(l.texto).indexOf(AWAKE_MARK_DIA_LIBRE) !== -1);
        }

        function logEsMarcaRitual(l) {
            return logEsOmitido(l) || logEsRecaida(l);
        }

        function textoRitualLimpio(texto) {
            return String(texto || '')
                .replace(/\[OMITIDO\]/g, '')
                .replace(/\[DIA-LIBRE\]/g, '')
                .replace(/\[RECAIDA\]/g, '')
                .replace(/\[(MAÑANA|TARDE|NOCHE|24\/7|CUALQUIER)\]/g, '')
                .replace(/\bCompletado\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function tituloSelloPublicacion(pub) {
            const name = cleanHabitName((pub && pub.nombre) || '');
            if (logEsRecaida(pub)) {
                const mom = etiquetaMomentoHabito(momentoDeLogHabito(pub));
                return mom ? (name + ' · Recaída · ' + mom) : (name + ' · Recaída');
            }
            const mom = etiquetaMomentoHabito(momentoDeLogHabito(pub));
            return mom ? (name + ' · ' + mom) : name;
        }

        function fechaNacimientoHabito(h) {
            if (h && h.createdAt) {
                const d = inicioDiaLocal(new Date(h.createdAt));
                if (!isNaN(d.getTime())) return d;
            }
            return inicioDiaLocal(new Date());
        }

        function habitNacidoEnFecha(h, date) {
            return inicioDiaLocal(date).getTime() >= fechaNacimientoHabito(h).getTime();
        }

        function normalizarHoraHHMM(v, fallback) {
            let s = String(v == null ? '' : v).trim();
            if (!s) return fallback != null ? fallback : null;
            if (s.indexOf(':') === -1) {
                const digits = s.replace(/\D/g, '');
                if (digits.length === 3) s = digits.charAt(0) + ':' + digits.slice(1);
                else if (digits.length === 4) s = digits.slice(0, 2) + ':' + digits.slice(2);
                else if (digits.length === 1 || digits.length === 2) s = digits + ':00';
            }
            const m = String(s).match(/(\d{1,2}):(\d{2})/);
            if (!m) return fallback != null ? fallback : null;
            const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
            const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
            if (!isFinite(h) || !isFinite(min)) return fallback != null ? fallback : null;
            return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        }

        function formatearEntradaHoraLibre(raw) {
            const digits = String(raw || '').replace(/\D/g, '').slice(0, 4);
            if (!digits) return '';
            if (digits.length <= 2) return digits;
            if (digits.length === 3) {
                const n0 = parseInt(digits.charAt(0), 10);
                if (n0 >= 3) return digits.charAt(0) + ':' + digits.slice(1);
                return digits.slice(0, 2) + ':' + digits.slice(2);
            }
            return digits.slice(0, 2) + ':' + digits.slice(2);
        }

        function alEscribirHoraLibre(el) {
            if (!el) return;
            const next = formatearEntradaHoraLibre(el.value);
            if (next === el.value) return;
            el.value = next;
            try {
                const pos = next.length;
                el.setSelectionRange(pos, pos);
            } catch (e) {}
        }

        function cargarPrefsRitualLocal() {
            try {
                const raw = localStorage.getItem(AWAKE_RITUAL_PREFS_KEY);
                if (!raw) return;
                const o = JSON.parse(raw);
                if (o.digestManana != null) ritualPrefs.digestManana = !!o.digestManana;
                if (o.digestTarde != null) ritualPrefs.digestTarde = !!o.digestTarde;
                if (o.digestNoche != null) ritualPrefs.digestNoche = !!o.digestNoche;
                if (o.horaManana) ritualPrefs.horaManana = normalizarHoraHHMM(o.horaManana, '08:00');
                if (o.horaTarde) ritualPrefs.horaTarde = normalizarHoraHHMM(o.horaTarde, '15:00');
                if (o.horaNoche) ritualPrefs.horaNoche = normalizarHoraHHMM(o.horaNoche, '21:30');
                if (o.riesgoActivo != null) ritualPrefs.riesgoActivo = !!o.riesgoActivo;
                if (o.horaRiesgo) ritualPrefs.horaRiesgo = normalizarHoraHHMM(o.horaRiesgo, '18:00');
                if (o.resumenActivo != null) ritualPrefs.resumenActivo = !!o.resumenActivo;
                if (o.horaResumen) ritualPrefs.horaResumen = normalizarHoraHHMM(o.horaResumen, '20:00');
            } catch (e) {}
            try {
                const t = parseInt(localStorage.getItem(AWAKE_LAST_SYNC_KEY) || '0', 10);
                if (t > 0) lastDiarioSyncAt = t;
            } catch (e) {}
        }

        function guardarPrefsRitualLocal() {
            try {
                localStorage.setItem(AWAKE_RITUAL_PREFS_KEY, JSON.stringify({
                    weekStartDay,
                    digestManana: ritualPrefs.digestManana,
                    digestTarde: ritualPrefs.digestTarde,
                    digestNoche: ritualPrefs.digestNoche,
                    horaManana: ritualPrefs.horaManana,
                    horaTarde: ritualPrefs.horaTarde,
                    horaNoche: ritualPrefs.horaNoche,
                    riesgoActivo: ritualPrefs.riesgoActivo,
                    horaRiesgo: ritualPrefs.horaRiesgo,
                    resumenActivo: ritualPrefs.resumenActivo,
                    horaResumen: ritualPrefs.horaResumen
                }));
            } catch (e) {}
        }

        function resetConfirmModalButtons() {
            const yes = document.getElementById('confirm-modal-yes-btn');
            const alt = document.getElementById('confirm-modal-alt-btn');
            if (yes) {
                yes.textContent = 'Sí';
                yes.style.backgroundColor = '#121824';
                yes.style.borderColor = '#f87171';
                yes.style.color = '#f87171';
            }
            if (alt) {
                alt.style.display = 'none';
                alt.textContent = '';
            }
            confirmModalAltAction = null;
        }

        function ejecutarAccionConfirmadaAlt() {
            const accion = confirmModalAltAction;
            confirmModalAltAction = null;
            cerrarModalConfirmacion();
            if (accion) {
                const result = accion();
                if (result && typeof result.then === 'function') result.catch(err => console.error(err));
            }
        }

        function mapearHabitoDesdeFila(h) {
            return aplicarModoContinuoHabito({
                id: h.id,
                nombre: h.title,
                tipo: h.habit_type,
                momentos: h.moments || [],
                dias: h.days || [1, 2, 3, 4, 5, 6, 0],
                reminderActive: h.reminder_active ?? false,
                startTime: h.start_time || '08:00',
                reminderInterval: h.reminder_interval || 3,
                enDescanso: h.en_descanso || false,
                bgColor: h.bg_color || '#10151f',
                streak: h.streak || 0,
                lastLogTime: null,
                archivado: !!h.archived,
                vecesPorSemana: h.times_per_week || 0,
                glyph: sanitizarGlifoPersistido({ nombre: h.title, glyph: h.glyph }),
                createdAt: h.created_at || null
            });
        }

        function payloadHabitoNube(h) {
            const base = {
                title: cleanHabitName(h.nombre),
                habit_type: h.tipo,
                moments: h.momentos || [],
                days: h.dias || [1, 2, 3, 4, 5, 6, 0],
                reminder_active: !!h.reminderActive,
                start_time: h.startTime || '08:00',
                reminder_interval: h.reminderInterval || 3,
                en_descanso: !!h.enDescanso,
                bg_color: h.bgColor || '#10151f',
                streak: h.streak || 0
            };
            if (cloudHabitsExtraCols) {
                base.archived = !!h.archivado;
                base.times_per_week = h.vecesPorSemana || null;
                base.glyph = sanitizarGlifoPersistido(h) || null;
            }
            return base;
        }

        function suavizarColumnasHabitoAusentes() {
            if (cloudHabitsExtraCols) {
                cloudHabitsExtraCols = false;
                return true;
            }
            return false;
        }

        async function insertarHabitoNubeConReintento(nuevoHabito) {
            if (!currentUser) return null;
            for (let i = 0; i < 3; i++) {
                const { data, error } = await supabaseClient.from('habits').insert([{
                    user_id: currentUser.id,
                    ...payloadHabitoNube(nuevoHabito)
                }]).select('id').single();
                if (!error && data) return data;
                if (!error || !errorEsRecursoAusente(error) || !suavizarColumnasHabitoAusentes()) {
                    mostrarToastLujo('No se pudo guardar el hábito en la nube. Revisa la conexión.', { tipo: 'error' });
                    return null;
                }
            }
            return null;
        }

        async function actualizarHabitoNubeConReintento(h) {
            if (!currentUser || !h || !h.id) return;
            for (let i = 0; i < 3; i++) {
                const { error } = await supabaseClient.from('habits').update(payloadHabitoNube(h)).eq('id', h.id);
                if (!error) return;
                if (!errorEsRecursoAusente(error) || !suavizarColumnasHabitoAusentes()) return;
            }
        }

        async function persistirCamposExtraHabito(h) {
            if (!currentUser || !h || !h.id) return;
            if (!cloudHabitsExtraCols) return;
            const patch = {
                archived: !!h.archivado,
                times_per_week: h.vecesPorSemana || null,
                glyph: sanitizarGlifoPersistido(h) || null
            };
            try {
                const { error } = await supabaseClient.from('habits').update(patch).eq('id', h.id);
                if (error && errorEsRecursoAusente(error)) suavizarColumnasHabitoAusentes();
            } catch (e) {}
        }

        function habitosEnAgenda() {
            return (misHabitos || []).filter(h => h && !habitEsArchivado(h));
        }

        let tempSelectedHabit = null;
        let selectedMomentsConfig = [];
        let selectedDaysConfig = [];
        let configReminderActive = false;

        let editSelectedMoments = [];
        let editSelectedDays = [];
        let editReminderActive = false;

        let configStartValue = '08:00';
        let configIntervalValue = '3h';
        let editStartValue = '08:00';
        let editIntervalValue = '3h';

        let customModes = {
            'config-start': false,
            'config-interval': false,
            'edit-start': false,
            'edit-interval': false
        };

        let cropImageObj = null;
        let cropScale = 1;
        let cropScaleMin = 0.5;
        let cropScaleMax = 3;
        let cropOffsetX = 0;
        let cropOffsetY = 0;
        let isDraggingCrop = false;
        let startDragX = 0;
        let startDragY = 0;
        let cropPinch = null;

        let totalCompletadas = 0;
        let completionMomentTarget = null;
        let currentThemeHue = null;
        let pendingHabitMotion = null;
        let pendingNewHabitIndex = null;

        function respetaMenosMovimiento() {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }

        function actualizarTabInk() {
            const ink = document.getElementById('tab-ink');
            if (!ink) return;
            const items = tabs && tabs.length ? tabs : document.querySelectorAll('.horizontal-tabs .tab-item');
            if (!items || !items.length) return;
            const active = items[currentIndex] || document.querySelector('.horizontal-tabs .tab-item.active') || items[0];
            if (!active) return;
            ink.style.left = `${active.offsetLeft}px`;
            ink.style.width = `${active.offsetWidth}px`;
        }

        function aplicarMotionHabitoPendiente() {
            if (respetaMenosMovimiento()) {
                pendingHabitMotion = null;
                pendingNewHabitIndex = null;
                return;
            }
            if (pendingNewHabitIndex != null) {
                document.querySelectorAll(`.habit-card-inspired[data-habit-key^="${pendingNewHabitIndex}-"]`).forEach(el => {
                    el.classList.add('card-enter');
                    setTimeout(() => el.classList.remove('card-enter'), 320);
                });
                pendingNewHabitIndex = null;
            }
            const motion = pendingHabitMotion;
            pendingHabitMotion = null;
            if (!motion || !motion.key) return;
            const card = document.querySelector(`.habit-card-inspired[data-habit-key="${motion.key}"]`);
            if (!card) return;
            if (motion.completing) {
                card.classList.add('just-completed');
                const cb = card.querySelector('.task-checkbox');
                if (cb) cb.classList.add('just-checked');
                const streak = card.querySelector('.habit-streak');
                if (streak) streak.classList.add('streak-up');
                setTimeout(() => {
                    card.classList.remove('just-completed');
                    if (cb) cb.classList.remove('just-checked');
                    if (streak) streak.classList.remove('streak-up');
                }, 320);
            } else {
                const streak = card.querySelector('.habit-streak');
                if (streak) {
                    streak.classList.add('streak-broken');
                    setTimeout(() => streak.classList.remove('streak-broken'), 280);
                }
            }
        }

        function animarContador(el, to, duration = 200) {
            if (!el) return;
            const target = Number(to) || 0;
            if (respetaMenosMovimiento()) {
                el.textContent = String(target);
                return;
            }
            const from = parseInt(el.textContent, 10);
            const startVal = Number.isFinite(from) ? from : 0;
            if (startVal === target) {
                el.textContent = String(target);
                return;
            }
            const start = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - start) / duration);
                el.textContent = String(Math.round(startVal + (target - startVal) * t));
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        function mostrarErrorAuth(msg) {
            const errDiv = document.getElementById('auth-main-error');
            if (!errDiv) return;
            errDiv.classList.remove('ui-error-in');
            errDiv.textContent = msg || '';
            if (!msg) return;
            void errDiv.offsetWidth;
            errDiv.classList.add('ui-error-in');
        }

        function textoErrorAuth(error, modo) {
            const raw = String((error && error.message) || error || '').toLowerCase();
            if (modo === 'recover') return '';
            if (modo === 'register') {
                if (raw.indexOf('password') !== -1) return 'La contraseña es demasiado corta o no es válida.';
                return 'No se pudo crear la cuenta. Prueba a iniciar sesión o usa otro correo.';
            }
            return 'Correo o contraseña incorrectos.';
        }

        function inicializarMicroanimaciones() {
            window.addEventListener('resize', actualizarTabInk);
            requestAnimationFrame(actualizarTabInk);
        }

        function pulsoHaptico(ms) {
            if (!prefsFeedback.vibracion) return;
            if (esPlataformaIOS()) {
                const Haptics = capacitorPlugin('Haptics');
                if (Haptics && Haptics.impact) {
                    const style = (ms && ms > 16) ? 'MEDIUM' : 'LIGHT';
                    Haptics.impact({ style }).catch(() => {});
                    return;
                }
            }
            try {
                if (navigator.vibrate) navigator.vibrate(ms || 14);
            } catch (e) {}
        }

        // Iconos SVG inline para el toast según su tipo (sin dependencias externas).
        const TOAST_ICONOS = {
            exito: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        };

        function mostrarToastLujo(mensaje, opts) {
            const toast = document.getElementById('awake-toast');
            const msgEl = document.getElementById('awake-toast-msg');
            const actEl = document.getElementById('awake-toast-action');
            const iconEl = document.getElementById('awake-toast-icon');
            if (!toast || !msgEl) return;
            if (toastTimerId) {
                clearTimeout(toastTimerId);
                toastTimerId = null;
            }
            toastOnHide = null;
            const texto = (mensaje || '').trim();
            msgEl.textContent = texto;
            msgEl.classList.toggle('hidden', !texto);
            // Tipo visual del aviso: exito (verde), error (rojo), info (neutro).
            // Las apps profesionales diferencian el tono del aviso para que el
            // usuario sepa de un vistazo si es una confirmación, un problema o
            // una nota — sin leer el texto.
            const tipo = (opts && (opts.tipo === 'exito' || opts.tipo === 'error' || opts.tipo === 'info'))
                ? opts.tipo
                : 'info';
            toast.classList.remove('tipo-exito', 'tipo-error', 'tipo-info');
            toast.classList.add('tipo-' + tipo);
            if (iconEl) {
                iconEl.innerHTML = TOAST_ICONOS[tipo] || '';
                iconEl.classList.toggle('hidden', tipo === 'info' && !texto);
            }
            const actionLabel = opts && opts.action;
            const onAction = opts && opts.onAction;
            const esToastDeshacerSello = !!(onAction && onAction === deshacerUltimoSellado);
            // Si otro aviso sustituye al de Deshacer, cierra la ventana de undo.
            if (lastSealSnapshot && !esToastDeshacerSello) {
                lastSealSnapshot = null;
                if (recargaDiarioPendiente) {
                    try { solicitarRecargaDiario(); } catch (e) {}
                }
            }
            const soloAccion = !texto && !!(actionLabel && onAction);
            toast.classList.toggle('is-action-only', soloAccion);
            toast.onclick = null;
            toastOnHide = (opts && typeof opts.onHide === 'function') ? opts.onHide : null;
            if (actEl) {
                if (actionLabel && onAction) {
                    actEl.textContent = actionLabel;
                    actEl.classList.remove('hidden');
                    const disparar = (e) => {
                        if (e) e.stopPropagation();
                        toast.classList.remove('show');
                        toast.onclick = null;
                        if (toastTimerId) {
                            clearTimeout(toastTimerId);
                            toastTimerId = null;
                        }
                        toastOnHide = null;
                        onAction();
                    };
                    actEl.onclick = disparar;
                    if (soloAccion) toast.onclick = disparar;
                } else {
                    actEl.classList.add('hidden');
                    actEl.onclick = null;
                }
            }
            toast.classList.add('show');
            const ttl = (opts && opts.ms) || 4200;
            toastTimerId = setTimeout(() => {
                toast.classList.remove('show');
                toastTimerId = null;
                const cb = toastOnHide;
                toastOnHide = null;
                if (cb) {
                    try { cb(); } catch (e) {}
                }
            }, ttl);
        }

        function selloOperacionEnCurso() {
            selloWriteInFlight++;
        }

        function selloOperacionTerminada() {
            selloWriteInFlight = Math.max(0, selloWriteInFlight - 1);
        }

        function selloUndoImpideRefrescoPesado() {
            return !!lastSealSnapshot || selloWriteInFlight > 0;
        }

        function cerrarVentanaDeshacerSello() {
            lastSealSnapshot = null;
            insigniasPendientesSello = [];
            if (recargaDiarioPendiente) {
                try { solicitarRecargaDiario(); } catch (e) {}
            }
            try { actualizarBarraRitual(); } catch (e) {}
            try { renderizarTabHistorial(); } catch (e) {}
            vaciarToastInsigniaPendiente();
        }

        function encolarToastInsignia(payload) {
            if (!payload || !payload.msg) return;
            badgeToastPendiente = payload;
            if (lastSealSnapshot) return;
            vaciarToastInsigniaPendiente();
        }

        function vaciarToastInsigniaPendiente() {
            if (!badgeToastPendiente) return;
            const p = badgeToastPendiente;
            badgeToastPendiente = null;
            mostrarBannerInsignia(p);
        }

        // Notificación de logro: banner superior (como apps profesionales). No
        // navega solo: informa del desbloqueo y ofrece "Ver" para abrir la
        // insignia. Se muestra UNA vez por insignia (los desbloqueos son
        // permanentes, ver sincronizarInsigniasConMetricas).
        function mostrarBannerInsignia(p) {
            marcarSonidoEspecifico();
            reproducirSonido('logro');
            const banner = document.getElementById('badge-banner');
            const textEl = document.getElementById('badge-banner-text');
            if (!banner || !textEl) {
                // Fallback si el banner no está en el DOM: toast inferior tradicional.
                mostrarToastLujo(p.msg, { action: 'Ver', onAction: () => irAInsigniaDesdeBanner(p), ms: 4800, tipo: 'exito' });
                return;
            }
            if (badgeBannerTimerId) {
                clearTimeout(badgeBannerTimerId);
                badgeBannerTimerId = null;
            }
            const seccion = (BADGE_THEMES.find(t => t.id === p.theme) || {}).label || '';
            const titleEl = document.getElementById('badge-banner-title');
            if (titleEl) {
                titleEl.textContent = seccion
                    ? 'Nueva insignia de ' + seccion
                    : '¡Nueva insignia!';
            }
            textEl.textContent = p.msg || '';
            const iconEl = document.getElementById('badge-banner-icon');
            if (iconEl) {
                try {
                    iconEl.innerHTML = generarSelloInsigniaFrente(p.theme, p.level, true, { uid: 'banner-' + (p.id || 'x') });
                } catch (e) {
                    iconEl.innerHTML = '<span aria-hidden="true">✦</span>';
                }
            }
            const disparar = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                cerrarBannerInsignia();
                irAInsigniaDesdeBanner(p);
            };
            banner.onclick = disparar;
            const btn = document.getElementById('badge-banner-action');
            if (btn) btn.onclick = disparar;
            banner.classList.add('show');
            badgeBannerTimerId = setTimeout(() => cerrarBannerInsignia(), 7000);
        }

        function cerrarBannerInsignia() {
            const banner = document.getElementById('badge-banner');
            if (banner) banner.classList.remove('show');
            if (badgeBannerTimerId) {
                clearTimeout(badgeBannerTimerId);
                badgeBannerTimerId = null;
            }
        }

        function irAInsigniaDesdeBanner(p) {
            const id = p && p.id;
            if (!id) return;
            if (viewingUserId) {
                try { volverAMiPerfil(); } catch (e) {}
            }
            cambiarTab(2);
            setTimeout(() => {
                try {
                    badgeDetalleId = id;
                    socialSeccionActiva = 'coleccion';
                    cambiarSeccionSocial('coleccion', document.getElementById('social-section-btn-coleccion'));
                    renderizarInsignias();
                    abrirModalInsignia3D(id);
                } catch (e2) {}
            }, 80);
        }

        function revocarInsigniasPendientesDeSello() {
            insigniasPendientesSello = [];
            badgeToastPendiente = null;
            sincronizarInsigniasConMetricas();
        }

        function ocultarAvisoRacha() {
            const hint = document.getElementById('streak-hint');
            const estaba = !!(hint && hint.classList.contains('show'));
            if (hint) hint.classList.remove('show');
            if (streakHintTimer) {
                clearTimeout(streakHintTimer);
                streakHintTimer = null;
            }
            return estaba;
        }

        function etiquetaMomentoHabito(momento) {
            if (momento === '24/7') return 'Todo el día';
            if (momento === 'CUALQUIER') return 'Cualquier momento';
            if (!momento) return '';
            return momento.charAt(0) + momento.slice(1).toLowerCase();
        }

        function momentoSoloEnTodos(momento) {
            return momento === '24/7' || momento === 'CUALQUIER';
        }

        function horaCortaDeFecha(dateLike) {
            const d = dateLike instanceof Date ? dateLike : new Date(dateLike || Date.now());
            if (isNaN(d.getTime())) return '';
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        function claveDiaLocal(dateLike) {
            const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
            if (isNaN(d.getTime())) return '';
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }

        function isoFechaLocal(dateLike) {
            const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
            if (isNaN(d.getTime())) return '';
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function parseIsoFechaLocal(iso) {
            const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return null;
            const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
            return isNaN(d.getTime()) ? null : d;
        }

        function etiquetaDiaChat(dateLike) {
            const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
            if (isNaN(d.getTime())) return '';
            const hoy = new Date();
            const ayer = new Date();
            ayer.setDate(hoy.getDate() - 1);
            if (claveDiaLocal(d) === claveDiaLocal(hoy)) return 'Hoy';
            if (claveDiaLocal(d) === claveDiaLocal(ayer)) return 'Ayer';
            return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' });
        }

        function textoRitualPublicacion(texto) {
            return String(texto || '').replace(/^\[(?:MAÑANA|TARDE|NOCHE|24\/7)\]\s*/i, '').trim();
        }

        function htmlSkeletonBandeja() {
            return Array.from({ length: 4 }).map(() => `
                <div class="skel-inbox">
                    <div class="skel-circle"></div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                        <div class="skel-line" style="width:42%;"></div>
                        <div class="skel-line" style="width:72%;"></div>
                    </div>
                </div>
            `).join('');
        }

        function claveLecturasChat() {
            return currentUser ? (CHAT_READS_KEY + ':' + currentUser.id) : (CHAT_READS_KEY + ':guest');
        }

        function leerMapaLecturasChat() {
            try {
                const keyed = JSON.parse(localStorage.getItem(claveLecturasChat()) || '{}') || {};
                if (keyed && Object.keys(keyed).length) return keyed;
                return JSON.parse(localStorage.getItem(CHAT_READS_KEY) || '{}') || {};
            } catch (e) {
                return {};
            }
        }

        function guardarMapaLecturasChat(map) {
            try { localStorage.setItem(claveLecturasChat(), JSON.stringify(map || {})); } catch (e) {}
        }

        function msIsoChat(iso) {
            const t = new Date(iso || 0).getTime();
            return isNaN(t) ? 0 : t;
        }

        function esChatNoLeido(msgIso, readIso) {
            if (!msgIso) return false;
            if (!readIso) return true;
            return msIsoChat(msgIso) > msIsoChat(readIso) + 2000;
        }

        async function hidratarLecturasChatDesdeServidor() {
            if (!currentUser) return;
            const uid = currentUser.id;
            if (lecturasChatHidratadasPara === uid) return;
            try {
                const { data } = await supabaseClient
                    .from('chat_reads')
                    .select('peer_id, last_read_at')
                    .eq('user_id', uid);
                const map = leerMapaLecturasChat();
                const enServidor = {};
                (data || []).forEach(row => {
                    if (!row || !row.peer_id || !row.last_read_at) return;
                    const pid = String(row.peer_id);
                    enServidor[pid] = row.last_read_at;
                    if (!map[pid] || msIsoChat(row.last_read_at) > msIsoChat(map[pid])) {
                        map[pid] = row.last_read_at;
                    }
                });
                guardarMapaLecturasChat(map);
                // Sincronización bidireccional: reenvía al servidor las lecturas locales
                // más recientes que el servidor no conoce (o tiene desactualizadas). Así se
                // repara el estado tras una escritura fallida, sin conexión o al cambiar de
                // dispositivo, y los mensajes ya leídos dejan de reaparecer como nuevos.
                const pendientes = [];
                Object.keys(map).forEach(pid => {
                    if (!map[pid]) return;
                    if (!enServidor[pid] || msIsoChat(map[pid]) > msIsoChat(enServidor[pid])) {
                        pendientes.push({ user_id: uid, peer_id: pid, last_read_at: map[pid] });
                    }
                });
                if (pendientes.length) sincronizarLecturasChatConServidor(pendientes, 1);
            } catch (e) {}
            lecturasChatHidratadasPara = uid;
        }

        function sincronizarLecturasChatConServidor(rows, intento) {
            if (!currentUser || !rows || !rows.length) return;
            let req = null;
            try {
                req = supabaseClient.from('chat_reads').upsert(rows, { onConflict: 'user_id,peer_id' });
            } catch (e) {}
            if (!req || typeof req.then !== 'function') return;
            req.then(() => {}).catch(() => {
                const n = (intento || 1) + 1;
                if (n > 4) return;
                setTimeout(() => sincronizarLecturasChatConServidor(rows, n), 2500 * n);
            });
        }

        function marcarChatLeido(peerId, iso) {
            if (!peerId) return;
            const map = leerMapaLecturasChat();
            const key = String(peerId);
            const next = iso || new Date().toISOString();
            if (!map[key] || msIsoChat(next) >= msIsoChat(map[key])) map[key] = next;
            guardarMapaLecturasChat(map);
            if (currentUser) {
                sincronizarLecturasChatConServidor([{
                    user_id: currentUser.id,
                    peer_id: peerId,
                    last_read_at: map[key]
                }], 1);
            }
            refrescarBadgeMensajes();
        }

        function pintarBadgeMensajes(n) {
            const badge = document.getElementById('badge-mensajes');
            if (!badge) return;
            const count = Math.max(0, parseInt(n, 10) || 0);
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.classList.toggle('hidden', count <= 0);
        }

        async function refrescarBadgeMensajes() {
            if (!currentUser) {
                pintarBadgeMensajes(0);
                return;
            }
            try {
                await hidratarLecturasChatDesdeServidor();
                const me = currentUser.id;
                const { data: rows } = await supabaseClient
                    .from('messages')
                    .select('sender_id, receiver_id, created_at')
                    .eq('receiver_id', me)
                    .order('created_at', { ascending: false })
                    .limit(200);
                const reads = leerMapaLecturasChat();
                const latest = {};
                (rows || []).forEach(m => {
                    if (!m || !m.sender_id || idsChatIguales(m.sender_id, me)) return;
                    if (!latest[m.sender_id]) latest[m.sender_id] = m.created_at;
                });
                let unread = 0;
                Object.keys(latest).forEach(uid => {
                    if (esChatNoLeido(latest[uid], reads[uid])) unread += 1;
                });
                pintarBadgeMensajes(unread);
            } catch (e) {
                /* silencioso: la bandeja refrescará el recuento */
            }
        }

        async function cargarLecturaDelPar(peerId) {
            peerLastReadAt = null;
            if (!currentUser || !peerId) return;
            try {
                const { data } = await supabaseClient
                    .from('chat_reads')
                    .select('last_read_at')
                    .eq('user_id', peerId)
                    .eq('peer_id', currentUser.id)
                    .maybeSingle();
                if (data && data.last_read_at) peerLastReadAt = data.last_read_at;
            } catch (e) {
                peerLastReadAt = null;
            }
        }

        function pintarVistosEnChatAbierto() {
            const list = document.getElementById('direct-chat-messages-list');
            if (!list || !peerLastReadAt) return;
            const mine = Array.from(list.querySelectorAll('.chat-msg-row.me .chat-msg-seen'));
            mine.forEach(el => { el.textContent = ''; });
            const last = mine[mine.length - 1];
            if (!last) return;
            const stamp = last.closest('.chat-msg-row') && last.closest('.chat-msg-row').dataset.createdAt;
            if (stamp && new Date(peerLastReadAt) >= new Date(stamp)) last.textContent = 'Visto';
        }

        function asegurarSeparadorDiaChat(list, createdAt) {
            if (!list || !createdAt) return;
            const key = claveDiaLocal(createdAt);
            const lastSep = list.querySelector('.chat-day-sep:last-of-type');
            const rows = list.querySelectorAll('.chat-msg-row');
            const lastRow = rows[rows.length - 1];
            const prevKey = lastRow ? lastRow.dataset.dayKey : (lastSep ? lastSep.dataset.dayKey : '');
            if (prevKey === key) return;
            const sep = document.createElement('div');
            sep.className = 'chat-day-sep';
            sep.dataset.dayKey = key;
            sep.textContent = etiquetaDiaChat(createdAt);
            list.appendChild(sep);
        }

        async function dataUrlABlob(dataUrl) {
            const s = String(dataUrl || '');
            const comma = s.indexOf(',');
            if (comma < 0) throw new Error('data-url');
            const header = s.slice(0, comma);
            const body = s.slice(comma + 1);
            const mimeMatch = header.match(/data:([^;,]+)/i);
            const mime = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';
            const isB64 = /;base64/i.test(header);
            let bytes;
            if (isB64) {
                const bin = atob(body);
                bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            } else {
                const decoded = decodeURIComponent(body);
                bytes = new Uint8Array(decoded.length);
                for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
            }
            return new Blob([bytes], { type: mime });
        }

        function extensionMediaDesdeMime(mime, extHint) {
            const t = String(mime || '').toLowerCase();
            if (t.indexOf('webm') !== -1) return 'webm';
            if (t.indexOf('ogg') !== -1) return 'ogg';
            if (t.indexOf('mp4') !== -1 || t.indexOf('m4a') !== -1 || t.indexOf('aac') !== -1) return 'm4a';
            if (t.indexOf('3gpp') !== -1 || t.indexOf('3gp') !== -1) return '3gp';
            if (t.indexOf('mpeg') !== -1 || t.indexOf('mp3') !== -1) return 'mp3';
            if (t.indexOf('png') !== -1) return 'png';
            if (t.indexOf('webp') !== -1) return 'webp';
            if (t.indexOf('jpeg') !== -1 || t.indexOf('jpg') !== -1) return 'jpg';
            return extHint || 'bin';
        }

        function mimeGrabacionAudioChat() {
            if (typeof MediaRecorder === 'undefined') return '';
            const candidatos = esPlataformaIOS()
                ? ['audio/mp4', 'audio/aac', 'audio/wav', 'audio/webm']
                : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/3gpp'];
            for (let i = 0; i < candidatos.length; i++) {
                try {
                    if (MediaRecorder.isTypeSupported(candidatos[i])) return candidatos[i];
                } catch (e) {}
            }
            return '';
        }

        function mimeMediaBase(mime, extHint) {
            let t = String(mime || '').toLowerCase().split(';')[0].trim();
            if (!t || t === 'application/octet-stream') {
                if (extHint === 'png') t = 'image/png';
                else if (extHint === 'jpg' || extHint === 'jpeg') t = 'image/jpeg';
                else if (extHint === 'webp') t = 'image/webp';
                else if (extHint === 'webm') t = 'audio/webm';
                else if (extHint === 'm4a' || extHint === 'mp4') t = 'audio/mp4';
                else if (extHint === 'ogg') t = 'audio/ogg';
                else if (extHint === 'mp3') t = 'audio/mpeg';
            }
            return t;
        }

        function mimeMediaPermitido(mime, folder) {
            const t = mimeMediaBase(mime, '');
            if (folder === 'chat') return t.indexOf('image/') === 0 || t.indexOf('audio/') === 0;
            return t.indexOf('image/') === 0;
        }

        async function subirMediaAwake(dataUrl, folder, extHint) {
            if (!dataUrl || typeof dataUrl !== 'string') return '';
            if (!dataUrl.startsWith('data:')) return dataUrl;
            if (!currentUser) return '';
            try {
                const blob = await dataUrlABlob(dataUrl);
                const mime = mimeMediaBase(blob.type, extHint);
                if (!mimeMediaPermitido(mime, folder)) return '';
                const maxBytes = folder === 'chat' && mime.indexOf('audio/') === 0 ? 8 * 1024 * 1024 : 6 * 1024 * 1024;
                if (blob.size > maxBytes) return '';
                const ext = extensionMediaDesdeMime(mime, extHint);
                const path = `${folder}/${currentUser.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
                const { error } = await supabaseClient.storage.from('awake-media').upload(path, blob, {
                    contentType: mime,
                    upsert: false
                });
                if (error) return '';
                const { data } = supabaseClient.storage.from('awake-media').getPublicUrl(path);
                return (data && data.publicUrl) || '';
            } catch (e) {
                return '';
            }
        }

        async function subirImagenOAvisar(dataUrl, folder, extHint) {
            // Invitado: la foto se conserva en local (data URL) y NO se publica.
            // Sigue siendo un registro del historial, pero sin likes ni comentarios.
            if (!currentUser) return dataUrl || '';
            const url = await subirMediaAwake(dataUrl, folder, extHint);
            if (url && !esDataUrlMedia(url)) return url;
            mostrarToastLujo('No se pudo guardar la foto. Inténtalo de nuevo.', { tipo: 'error' });
            return '';
        }

        function rutaMediaAwakeDesdeUrl(url) {
            if (!url || typeof url !== 'string') return null;
            const marca = '/storage/v1/object/public/awake-media/';
            const i = url.indexOf(marca);
            if (i < 0) return null;
            const raw = url.slice(i + marca.length).split('?')[0];
            try { return decodeURIComponent(raw); } catch (e) { return raw; }
        }

        function urlsMediaDeRegistro(reg) {
            const out = [];
            const seen = {};
            const add = (u) => {
                if (!u || typeof u !== 'string' || seen[u]) return;
                seen[u] = true;
                out.push(u);
            };
            if (!reg) return out;
            add(reg.image_url);
            (reg.imagenes || []).forEach(add);
            return out;
        }

        async function borrarVariasMediaAwake(urls) {
            if (!currentUser) return;
            const seen = {};
            const paths = [];
            const prefijo = currentUser.id;
            (urls || []).forEach(u => {
                const path = rutaMediaAwakeDesdeUrl(u);
                if (!path || seen[path]) return;
                if (
                    path.indexOf('avatars/' + prefijo + '/') !== 0 &&
                    path.indexOf('logs/' + prefijo + '/') !== 0 &&
                    path.indexOf('chat/' + prefijo + '/') !== 0
                ) return;
                seen[path] = true;
                paths.push(path);
            });
            if (!paths.length) return;
            try {
                await supabaseClient.storage.from('awake-media').remove(paths);
            } catch (e) {}
        }

        async function borrarMediaAwakeSiPropia(url) {
            await borrarVariasMediaAwake(url ? [url] : []);
        }

        async function borrarMediaDeRegistro(reg) {
            await borrarVariasMediaAwake(urlsMediaDeRegistro(reg));
        }

        async function borrarMediaDeRegistros(regs) {
            const urls = [];
            (regs || []).forEach(r => {
                urlsMediaDeRegistro(r).forEach(u => urls.push(u));
            });
            await borrarVariasMediaAwake(urls);
        }

        async function borrarRegistroHabitLogYMedia(log) {
            if (!log) return;
            if (currentUser && log.id && String(log.id).indexOf('reg_') !== 0 && String(log.id).indexOf('wish_reg_') !== 0) {
                const { error } = await supabaseClient.from('habit_logs').delete().eq('id', log.id);
                if (error) throw error;
            }
            await borrarMediaDeRegistro(log);
        }

        async function migrarAvatarLocalSiHaceFalta(url) {
            if (!currentUser || !esDataUrlMedia(url)) return;
            const subida = await subirMediaAwake(url, 'avatars', 'png');
            if (!subida || esDataUrlMedia(subida)) return;
            aplicarImagenAvatar(subida);
            try {
                await supabaseClient.from('profiles').update({ avatar_url: subida }).eq('id', currentUser.id);
            } catch (e) {}
        }

        async function migrarSellosLocalesSiHaceFalta() {
            if (!currentUser) return;
            let n = 0;
            const nombres = Object.keys(historialAgrupado || {});
            for (let i = 0; i < nombres.length && n < 12; i++) {
                const regs = historialAgrupado[nombres[i]] || [];
                for (let j = 0; j < regs.length && n < 12; j++) {
                    const reg = regs[j];
                    if (!reg || !reg.id || String(reg.id).indexOf('reg_') === 0) continue;
                    const raw = (reg.imagenes && reg.imagenes[0]) || reg.image_url;
                    if (!esDataUrlMedia(raw)) continue;
                    const url = await subirMediaAwake(raw, 'logs', 'jpg');
                    if (!url || esDataUrlMedia(url)) continue;
                    reg.image_url = url;
                    reg.imagenes = [url];
                    try {
                        await supabaseClient.from('habit_logs').update({ image_url: url }).eq('id', reg.id);
                    } catch (e) {}
                    n++;
                }
            }
            if (n) guardarEstadoLocal();
        }

        function catalogoOnboarding() {
            return {
                hidratarse: { nombre: 'Hidratarse', tipo: 'Salud y Vitalidad Física', momentos: ['24/7'], startTime: '08:00', permite247: true, ph: 'drop', when: 'Todo el día' },
                estiramientos: { nombre: 'Estiramientos', tipo: 'Salud y Vitalidad Física', momentos: ['MAÑANA'], startTime: '07:30', permite247: false, ph: 'person-arms-spread', when: 'Mañana' },
                'acostarse-temprano': { nombre: 'Acostarse temprano', tipo: 'Salud y Vitalidad Física', momentos: ['NOCHE'], startTime: '22:30', permite247: false, ph: 'bed', when: 'Noche' },
                meditar: { nombre: 'Meditar', tipo: 'Mente y Crecimiento Personal', momentos: ['NOCHE'], startTime: '21:30', permite247: false, ph: 'yin-yang', when: 'Noche' },
                leer: { nombre: 'Leer', tipo: 'Mente y Crecimiento Personal', momentos: ['NOCHE'], startTime: '21:00', permite247: false, ph: 'book-open', when: 'Noche' },
                diario: { nombre: 'Escribir un diario personal', tipo: 'Mente y Crecimiento Personal', momentos: ['NOCHE'], startTime: '21:00', permite247: false, ph: 'notebook', when: 'Noche' },
                'sin-redes': { nombre: 'Pasar tiempo sin redes sociales', tipo: 'Desconexión Digital y Bienestar Consciente', momentos: ['24/7'], startTime: '08:00', permite247: true, ph: 'device-mobile-slash', when: 'Todo el día' },
                'sin-movil': { nombre: 'Pasar tiempo sin móvil', tipo: 'Desconexión Digital y Bienestar Consciente', momentos: ['24/7'], startTime: '08:00', permite247: true, ph: 'device-mobile-slash', when: 'Todo el día' },
                'sin-movil-noche': { nombre: 'No usar el móvil antes de dormir', tipo: 'Desconexión Digital y Bienestar Consciente', momentos: ['NOCHE'], startTime: '22:00', permite247: false, ph: 'moon-stars', when: 'Noche' }
            };
        }

        const ESCENAS_ONBOARD = {
            cuerpo: { titulo: 'Cuerpo', keys: ['hidratarse', 'estiramientos', 'acostarse-temprano'], lead: 'Un ritual para el cuerpo. Elige uno; el resto puede esperar.' },
            mente: { titulo: 'Mente', keys: ['meditar', 'leer', 'diario'], lead: 'Un ritual para la mente. Elige uno; el resto puede esperar.' },
            desconexion: { titulo: 'Desconexión', keys: ['sin-redes', 'sin-movil', 'sin-movil-noche'], lead: 'Un ritual para soltar la pantalla. Elige uno; el resto puede esperar.' }
        };

        function primerSelloPendiente() {
            try { return localStorage.getItem(FIRST_SEAL_KEY) !== '1'; } catch (e) { return true; }
        }

        function haySellosGuardados() {
            return Object.keys(historialAgrupado || {}).some(k => (historialAgrupado[k] || []).length > 0)
                || (misHabitos || []).some(h => (h.streak || 0) > 0);
        }

        function esperaCoachPrimerSello() {
            if (!primerSelloPendiente()) return false;
            if (!misHabitos || !misHabitos.length) return false;
            if (haySellosGuardados()) return false;
            return true;
        }

        function recordarSelloSiYaExiste() {
            if (!primerSelloPendiente()) return;
            if (!haySellosGuardados()) return;
            try { localStorage.setItem(FIRST_SEAL_KEY, '1'); } catch (e) {}
        }

        function arrancarPermisoNotificacionesSiToca() {
            if (primerSelloPendiente()) return;
            try {
                solicitarPermisoNotificaciones().catch(() => {});
            } catch (e) {}
            try {
                inicializarPermisoNotificacionesWeb();
            } catch (e) {}
        }

        function marcarPrimerSelloHecho() {
            try { localStorage.setItem(FIRST_SEAL_KEY, '1'); } catch (e) {}
            document.querySelectorAll('.habit-card-inspired.is-first-seal').forEach(el => el.classList.remove('is-first-seal'));
            sincronizarCapaPrimerRitual();
            arrancarPermisoNotificacionesSiToca();
        }

        function sincronizarCapaPrimerRitual() {
            const modal = document.getElementById('onboarding-modal');
            const abierto = !!(modal && modal.classList.contains('active'));
            document.body.classList.toggle('onboarding-open', abierto);
            document.body.classList.toggle('awaiting-first-seal', !abierto && esperaCoachPrimerSello());
        }

        function mostrarAgendaCompleta() {
            activeFilter = 'TODOS';
            sincronizarFiltroVisualActivo();
        }

        function quizasMostrarOnboarding() {
            const modal = document.getElementById('onboarding-modal');
            try {
                if (localStorage.getItem(ONBOARD_KEY) === '1') {
                    if (modal) modal.classList.remove('active');
                    sincronizarCapaPrimerRitual();
                    return;
                }
            } catch (e) {}
            if (misHabitos && misHabitos.length > 0) {
                try { localStorage.setItem(ONBOARD_KEY, '1'); } catch (e) {}
                if (modal) modal.classList.remove('active');
                sincronizarCapaPrimerRitual();
                return;
            }
            onboardSceneKey = 'cuerpo';
            onboardHabitKey = 'hidratarse';
            const nameInp = document.getElementById('onboard-name');
            const nick = (document.getElementById('display-nickname') || {}).textContent;
            if (nameInp && nick && nick !== 'Anonymous') nameInp.value = nick;
            document.querySelectorAll('#onboard-step-scene .onboard-choice').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-scene') === 'cuerpo');
            });
            mostrarPasoEscenaOnboarding();
            if (modal) modal.classList.add('active');
            hidratarGlifosPhosphor(modal);
            sincronizarCapaPrimerRitual();
        }

        async function guardarNombreOnboarding() {
            const nameInp = document.getElementById('onboard-name');
            const name = recortarTexto(nameInp ? nameInp.value.trim() : '', AWAKE_LIMITE_NICK);
            if (!name) return;
            const nickEl = document.getElementById('display-nickname');
            const bioEl = document.getElementById('profile-bio-name');
            if (nickEl) nickEl.textContent = name;
            if (bioEl) bioEl.textContent = name;
            if (currentUser) {
                try { await supabaseClient.from('profiles').upsert([{ id: currentUser.id, username: name }]); } catch (e) {}
            }
        }

        function elegirEscenaOnboarding(el, key) {
            onboardSceneKey = key;
            document.querySelectorAll('#onboard-step-scene .onboard-choice').forEach(b => b.classList.remove('active'));
            if (el) el.classList.add('active');
        }

        function elegirHabitoOnboarding(el, key) {
            onboardHabitKey = key;
            document.querySelectorAll('#onboard-ritual-choices .onboard-choice').forEach(b => b.classList.remove('active'));
            if (el) el.classList.add('active');
        }

        function mostrarPasoEscenaOnboarding() {
            const scene = document.getElementById('onboard-step-scene');
            const ritual = document.getElementById('onboard-step-ritual');
            const next = document.getElementById('onboard-next-btn');
            if (scene) scene.classList.add('active');
            if (ritual) ritual.classList.remove('active');
            if (next) next.textContent = 'Siguiente';
        }

        function pintarRitualesOnboarding() {
            const escena = ESCENAS_ONBOARD[onboardSceneKey] || ESCENAS_ONBOARD.cuerpo;
            const cat = catalogoOnboarding();
            const lead = document.getElementById('onboard-ritual-lead');
            const box = document.getElementById('onboard-ritual-choices');
            if (lead) lead.textContent = escena.lead;
            if (!box) return;
            const keys = escena.keys || [];
            if (!keys.includes(onboardHabitKey)) onboardHabitKey = keys[0];
            box.innerHTML = keys.map(k => {
                const spec = cat[k];
                if (!spec) return '';
                const active = k === onboardHabitKey ? ' active' : '';
                return `<button type="button" class="onboard-choice${active}" data-habit="${k}" onclick="elegirHabitoOnboarding(this, '${k}')">
                    <span class="onboard-choice-mark" aria-hidden="true"></span>
                    <span data-ph="${spec.ph || 'sparkle'}"></span>
                    <span class="onboard-choice-body">
                        <span class="onboard-choice-name">${escapeHtmlChat(spec.nombre)}</span>
                        <span class="onboard-choice-when">${escapeHtmlChat(spec.when || '')}</span>
                    </span>
                </button>`;
            }).join('');
            hidratarGlifosPhosphor(box);
        }

        function mostrarPasoRitualOnboarding() {
            const scene = document.getElementById('onboard-step-scene');
            const ritual = document.getElementById('onboard-step-ritual');
            const next = document.getElementById('onboard-next-btn');
            pintarRitualesOnboarding();
            if (scene) scene.classList.remove('active');
            if (ritual) ritual.classList.add('active');
            if (next) next.textContent = 'Empezar';
        }

        function volverEscenaOnboarding() {
            mostrarPasoEscenaOnboarding();
        }

        function saltarOnboarding() {
            finalizarOnboarding(false);
        }

        async function avanzarOnboarding() {
            const ritual = document.getElementById('onboard-step-ritual');
            if (!ritual || !ritual.classList.contains('active')) {
                mostrarPasoRitualOnboarding();
                return;
            }
            await finalizarOnboarding(true);
        }

        async function finalizarOnboarding(conHabito) {
            await guardarNombreOnboarding();
            const cat = catalogoOnboarding();
            if (conHabito) {
                const spec = cat[onboardHabitKey] || cat.hidratarse;
                const yaExiste = (misHabitos || []).some(h => cleanHabitName(h.nombre) === cleanHabitName(spec.nombre));
                if (!yaExiste) {
                    const nuevoHabito = {
                        nombre: cleanHabitName(spec.nombre),
                        tipo: spec.tipo,
                        momentos: [...spec.momentos],
                        dias: [1, 2, 3, 4, 5, 6, 0],
                        permite247: !!spec.permite247 || (spec.momentos || []).indexOf('24/7') !== -1,
                        reminderActive: true,
                        startTime: spec.startTime,
                        reminderInterval: 0,
                        enDescanso: false,
                        bgColor: '#10151f',
                        streak: 0,
                        lastLogTime: null,
                        archivado: false,
                        vecesPorSemana: 0,
                        glyph: '',
                        createdAt: new Date().toISOString()
                    };
                    if (currentUser) {
                        try {
                            const { data } = await supabaseClient.from('habits').insert([{
                                user_id: currentUser.id,
                                ...payloadHabitoNube(nuevoHabito)
                            }]).select('id').single();
                            if (data) nuevoHabito.id = data.id;
                        } catch (e) {}
                    }
                    misHabitos.push(nuevoHabito);
                    pendingNewHabitIndex = misHabitos.length - 1;
                    avisarDiarioRemoto();
                }
            }
            try { localStorage.setItem(ONBOARD_KEY, '1'); } catch (e) {}
            const modal = document.getElementById('onboarding-modal');
            if (modal) modal.classList.remove('active');
            if (conHabito) mostrarAgendaCompleta();
try { if (window.awakeAnalytics) window.awakeAnalytics.track('onboarding_done'); } catch (e) {}
            guardarEstadoLocal();
            cambiarTab(0);
            renderizarMiRutina();
            renderizarListaDeseos();
            actualizarEstadisticasPerfil();
            programarAlarmasNativasHabitos();
            sincronizarCapaPrimerRitual();
            if (conHabito) {
                mostrarToastLujo('Toca el recuadro para sellar el hábito', { tipo: 'info' });
                quizasMostrarGuiaPermisosRitual();
            } else mostrarToastLujo('Añade tu primer hábito cuando quieras', { tipo: 'info' });
        }

        function actualizarBarraRitual() {
            const bar = document.getElementById('ritual-status-bar');
            if (!bar) return;
            const items = [];
            (misHabitos || []).forEach(h => {
                if (habitEsArchivado(h) || h.enDescanso) return;
                if (!habitProgramadoEnFecha(h, selectedDate)) return;
                (h.momentos || []).forEach(momento => {
                    if (activeFilter !== 'TODOS' && momentoSoloEnTodos(momento)) return;
                    if (activeFilter !== 'TODOS' && momento !== activeFilter) return;
                    const estado = estadoSelloEnFecha(h.nombre, selectedDate, momento);
                    items.push({ h, momento, done: selloCuentaComoHecho(estado), skipped: estado === 'omitido' });
                });
            });
            if (items.length === 0) {
                if (!(misHabitos && misHabitos.length)) {
                    bar.classList.add('hidden');
                    bar.innerHTML = '';
                    return;
                }
                bar.classList.remove('hidden');
                bar.classList.add('is-empty');
                const franja = activeFilter === 'TODOS'
                    ? 'hoy'
                    : (activeFilter === 'MAÑANA' ? 'por la mañana' : (activeFilter === 'TARDE' ? 'por la tarde' : 'por la noche'));
                bar.innerHTML = `
                    <div class="ritual-status-copy">
                        <div class="ritual-status-title">Sin tareas ${franja}</div>
                        <div class="ritual-status-sub">Nada que sellar en esta franja</div>
                    </div>
                    <div class="ritual-status-pills"></div>
                `;
                return;
            }
            const done = items.filter(i => i.done && !i.skipped).length;
            const skipped = items.filter(i => i.skipped).length;
            const rachas = habitosEnAgenda().map(h => calcularRachaHastaFecha(h.nombre, selectedDate));
            const maxRacha = rachas.length ? Math.max.apply(null, rachas) : 0;
            const dots = items.slice(0, 8).map(i => `<span class="ritual-dot${i.skipped ? ' skipped' : (i.done ? ' done' : '')}"></span>`).join('');
            const puedeDiaLibre = items.some(i => !esHabitoContinuo(i.h, i.momento));
            const week = diasSelladosEstaSemanaHasta(selectedDate);
            const subSemana = week.elapsed
                ? `${week.sealed} de ${week.elapsed} esta semana`
                : (maxRacha > 0 ? `Racha más larga: ${maxRacha}` : 'Empieza a sellar el día');
            bar.classList.remove('hidden');
            bar.classList.remove('is-empty');
            bar.innerHTML = `
                <div class="ritual-status-copy">
                    <div class="ritual-status-title">${done} de ${items.length} sellados${skipped ? ` · ${skipped} omitidos` : ''}</div>
                    <div class="ritual-status-sub">${subSemana}</div>
                </div>
                <div class="ritual-status-actions">
                    ${puedeDiaLibre ? `<button type="button" class="ritual-dayoff-btn" onclick="solicitarDiaLibre()">Día libre</button>` : ''}
                    <div class="ritual-status-pills">${dots}</div>
                </div>
            `;
            quizasCelebrarDiaSellado(items);
        }

        function registrarSelloParaDeshacer(payload) {
            lastSealSnapshot = payload || null;
        }

        async function deshacerUltimoSellado() {
            const snap = lastSealSnapshot;
            lastSealSnapshot = null;
            badgeToastPendiente = null;
            if (!snap) {
                mostrarToastLujo('Nada que deshacer', { tipo: 'info' });
                return;
            }
            const h = misHabitos[snap.index];
            if (!h) {
                insigniasPendientesSello = [];
                mostrarToastLujo('No se pudo deshacer', { tipo: 'error' });
                return;
            }
            const cleanHName = cleanHabitName(h.nombre);
            selloOperacionEnCurso();
            try {
                let logToRemove = (window.registrosGlobalMap && window.registrosGlobalMap[snap.logId]) || null;
                if (!logToRemove) {
                    const arr = historialAgrupado[cleanHName] || [];
                    logToRemove = arr.find(l => l && String(l.id) === String(snap.logId)) || null;
                }
                if (!logToRemove && typeof logsADesellarHabito === 'function') {
                    const cand = logsADesellarHabito(h, selectedDate || new Date(), snap.momento);
                    logToRemove = cand.find(l => String(l.id) === String(snap.logId)) || cand[0] || null;
                }
                if (logToRemove) {
                    quitarLogDeHistorial(logToRemove);
                    try { await borrarRegistroHabitLogYMedia(logToRemove); } catch (e) {}
                    delete window.registrosGlobalMap[logToRemove.id];
                    if (!logEsMarcaRitual(logToRemove)) {
                        totalCompletadas = Math.max(0, (totalCompletadas || 0) - 1);
                    }
                } else if (snap.logId) {
                    marcarSelloEliminado(snap.logId);
                }
                if (!h.enDescanso) {
                    if (snap.prevStreak != null) h.streak = Math.max(0, snap.prevStreak);
                    else h.streak = calcularRachaHastaFecha(cleanHName, selectedDate || new Date());
                }
                if (currentUser && h.id) {
                    try { await supabaseClient.from('habits').update({ streak: h.streak }).eq('id', h.id); } catch (e) {}
                }
                guardarEstadoLocal();
                try { avisarDiarioRemoto(); } catch (e) {}
                revocarInsigniasPendientesDeSello();
                // Al deshacer el sello, las insignias cuya métrica ya no se cumple
                // se revierten (B-57): badge y realidad siempre coordinados.
                revocarInsigniasSinMetrica();
                pendingHabitMotion = { key: `${snap.index}-${snap.momento}`, completing: false };
                renderizarMiRutina();
                renderizarPerfilPublicacionesGrid();
                renderizarTabHistorial();
                actualizarEstadisticasPerfil();
                try { renderizarInsignias(); } catch (e) {}
                mostrarToastLujo('Sello deshecho', { tipo: 'exito' });
            } finally {
                selloOperacionTerminada();
                if (recargaDiarioPendiente) {
                    try { solicitarRecargaDiario(); } catch (e) {}
                }
            }
        }

        function contarSellosDelDia(dateTarget) {
            const t = dateTarget instanceof Date ? dateTarget : new Date(dateTarget);
            if (isNaN(t.getTime())) return 0;
            let n = 0;
            Object.keys(historialAgrupado || {}).forEach(k => {
                (historialAgrupado[k] || []).forEach(l => {
                    if (!l || logEsMarcaRitual(l)) return;
                    const d = l.dateObj ? new Date(l.dateObj) : new Date(l.timestamp || l.fecha);
                    if (isNaN(d.getTime())) return;
                    if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()) n++;
                });
            });
            return n;
        }

        function celebrarSello(nombre, esPrimero) {
            const eraPrimerSello = primerSelloPendiente();
            pulsoHaptico(16);
            marcarSonidoEspecifico();
            reproducirSonido('sello');
            // Sin toast «Sellado · Deshacer»: cerramos al instante la ventana
            // de deshacer para que insignias pendientes y recargas se procesen.
            cerrarVentanaDeshacerSello();
            if (eraPrimerSello) marcarPrimerSelloHecho();
            renderizarInsignias();
        }

        window.onload = async function() {
            canvas = document.getElementById('bg-canvas');
            if (canvas) ctx = canvas.getContext('2d');
try { if (window.awakeAnalytics) window.awakeAnalytics.track('app_open'); } catch (e) {}

            resizeCanvas();
            arrancarLoopFondo();

            slider = document.getElementById('content-slider');
            tabs = document.querySelectorAll('.horizontal-tabs .tab-item');

            inicializarSliderGestos();
            inicializarGestoCalendarioStrip();
            inicializarPullToRefresh();
            inicializarMicroanimaciones();
            hidratarGlifosPhosphor();
            window.addEventListener('resize', () => {
                aplicarPosicionSlider(false);
                if (!calStripAnimando) renderCalendarStrip();
            });
            aplicarPreferenciasVisualesLocal();
            poblarCustomDropdowns();
            iniciarRelojRitual();
            cambiarTab(0);
            inicializarEventosRecortador();
            
            try {
                let { data: { session } } = await supabaseClient.auth.getSession();
                if (!session) session = await restaurarSesionDesdeRespaldo();
                if (session && session.user) {
                    currentUser = session.user;
                    if (session.access_token) supabaseClient.realtime.setAuth(session.access_token);
                    await cargarDatosUsuarioSupabase();
                } else {
                    cargarEstadoLocal('guest');
                    const g_login = document.getElementById('menu-login-btn');
                    if (g_login) g_login.style.display = 'flex';
                }
                solicitarAlmacenamientoPersistente();
                registrarServiceWorkerAwake();
            } catch (err) {
                console.error("Error al recuperar sesión:", err);
            }

            recordarSelloSiYaExiste();
            renderizarMiRutina();
            renderizarListaDeseos();
            actualizarEstadisticasPerfil();
            // Al abrir la app se evalúan los desbloqueos pendientes (p. ej. una
            // insignia de DÍA cuyo día terminó ayer) y se muestra su banner.
            try { renderizarInsignias(); } catch (e) {}
            quizasMostrarOnboarding();
            iniciarSistemaNotificaciones();
            consumirChatDesdeUrlWeb();
            iniciarNavegacionAtras();
            inicializarCapaNativa();
            aplicarAdaptacionIOS();
            iniciarObservadorCapasVisuales();
            suscribirCambiosRealtime();
            suscribirRealtimeMensajes();
            arrancarSincronizacionDiario();
            refrescarBadgeMensajes();
            quizasMostrarOnboarding();

            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session && session.access_token) {
                    supabaseClient.realtime.setAuth(session.access_token);
                    respaldarSesionAuthEnNavegador(session);
                }
                if (session && session.user) currentUser = session.user;
                if (event === 'SIGNED_IN') {
try { if (window.awakeAnalytics) window.awakeAnalytics.track('auth_completed'); } catch (e) {}
                    solicitarAlmacenamientoPersistente();
                    suscribirCambiosRealtime();
                    suscribirRealtimeMensajes();
                    arrancarSincronizacionDiario();
                    registrarTokenPushEnServidor();
                    consumirChatPendienteDeNotificacion();
                    refrescarBadgeMensajes();
                    programarAlarmasNativasHabitos();
                    solicitarRecargaDiario();
                    // Al iniciar sesión se evalúan desbloqueos pendientes y su banner.
                    try { renderizarInsignias(); } catch (e) {}
                } else if (event === 'SIGNED_OUT') {
                    resetEstadoPrivadoSesion();
                    cargarEstadoLocal('guest');
                    borrarRespaldoSesionAuth();
                    suscribirCambiosRealtime();
                    suscribirRealtimeMensajes();
                    cancelarAlarmasNativasHabitos();
                    arrancarIntervalosHabitos();
                    renderizarMiRutina();
                    renderizarListaDeseos();
                    renderizarPerfilPublicacionesGrid();
                    renderizarTabHistorial();
                }
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    detenerLoopFondo();
                    return;
                }
                arrancarLoopFondo();
                sincronizarRelojRitual(false);
                suscribirCambiosRealtime();
                suscribirRealtimeMensajes();
                if (activeDirectChatUser) suscribirBroadcastChat(activeDirectChatUser.id);
                sincronizarMensajesChatActivo();
                solicitarRecargaDiario();
                try { renderizarInsignias(); } catch (e) {}
            });
            window.addEventListener('focus', () => {
                sincronizarMensajesChatActivo();
                solicitarRecargaDiario();
                try { renderizarInsignias(); } catch (e) {}
            });
            iniciarSincronizacionAppNativa();
        };

        async function restaurarSesionDesdeRespaldo() {
            let raw = awakeAuthMemory.get(AWAKE_AUTH_STORAGE_KEY);
            if (!raw) {
                try { raw = localStorage.getItem(AWAKE_AUTH_STORAGE_KEY); } catch (e) {}
            }
            if (!raw) raw = await idbGetAwake(AWAKE_AUTH_STORAGE_KEY);
            const sess = extraerSesionAuthGuardada(inflarSesionAuth(raw));
            const rt = sess && sess.refresh_token;
            if (!rt) return null;
            try {
                const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: rt });
                if (error || !data || !data.session) return null;
                respaldarSesionAuthEnNavegador(data.session);
                return data.session;
            } catch (e) {
                return null;
            }
        }

        async function solicitarAlmacenamientoPersistente() {
            try {
                if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
            } catch (e) {}
        }

        function registrarServiceWorkerAwake() {
            try {
                if (!('serviceWorker' in navigator)) return;
                if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return;

                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (refreshing) return;
                    refreshing = true;
                    window.location.reload();
                });

                navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
                    reg.update().catch(function () {});
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') reg.update().catch(function () {});
                    });
                }).catch(function () {});

                if (!window._awakeSwMsgBound) {
                    window._awakeSwMsgBound = true;
                    navigator.serviceWorker.addEventListener('message', (ev) => {
                        const msg = ev && ev.data;
                        if (!msg || msg.type !== 'awake-notification-click') return;
                        const data = msg.data || {};
                        if (data.type === 'message' || data.senderId) abrirChatDesdeNotificacion(data);
                    });
                }
            } catch (e) {}
        }

        function resizeCanvas() {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initActiveBackgroundEngine();
        }

        window.addEventListener('resize', resizeCanvas);

        function initActiveBackgroundEngine() {
            spaceStars = [];
            spaceComets = [];
            if (activeBackground === 2 || fondoForzadoOverlay) inicializarEstrellasProfundidad();
            else inicializarPolvoObsidiana();
        }

        function tipoEspectralEstrella() {
            const r = Math.random();
            if (r < 0.1) return { cr: 160, cg: 198, cb: 255 };
            if (r < 0.26) return { cr: 196, cg: 220, cb: 255 };
            if (r < 0.64) return { cr: 232, cg: 238, cb: 255 };
            if (r < 0.84) return { cr: 255, cg: 244, cb: 214 };
            if (r < 0.95) return { cr: 255, cg: 208, cb: 168 };
            return { cr: 255, cg: 176, cb: 148 };
        }

        function sembrarPuntosCampo(n) {
            const pts = [];
            if (n <= 0 || width <= 0 || height <= 0) return pts;
            const aspect = width / Math.max(1, height);
            const cols = Math.max(1, Math.round(Math.sqrt(n * aspect)));
            const rows = Math.max(1, Math.ceil(n / cols));
            const cellW = width / cols;
            const cellH = height / rows;
            let i = 0;
            for (let r = 0; r < rows && i < n; r++) {
                for (let c = 0; c < cols && i < n; c++, i++) {
                    pts.push({
                        x: (c + 0.08 + Math.random() * 0.84) * cellW,
                        y: (r + 0.08 + Math.random() * 0.84) * cellH
                    });
                }
            }
            while (pts.length < n) pts.push({ x: Math.random() * width, y: Math.random() * height });
            return pts;
        }

        function envolverFondo(v, max) {
            if (max <= 0) return 0;
            v %= max;
            return v < 0 ? v + max : v;
        }

        function deltaToroidal(a, b, max) {
            let d = a - b;
            const half = max * 0.5;
            if (d > half) d -= max;
            else if (d < -half) d += max;
            return d;
        }

        function inicializarEstrellasProfundidad() {
            const mobile = width < 768;
            const capas = [
                { n: mobile ? 760 : 1220, size: [0.16, 0.52], speed: 0.0018, alpha: [0.12, 0.4], layer: 0, staticRatio: 0.97 },
                { n: mobile ? 310 : 530, size: [0.3, 0.82], speed: 0.0026, alpha: [0.16, 0.46], layer: 0, staticRatio: 0.94 },
                { n: mobile ? 42 : 64, size: [0.68, 1.42], speed: 0.012, alpha: [0.24, 0.58], layer: 1, staticRatio: 0.45 },
                { n: mobile ? 14 : 18, size: [1.15, 2.15], speed: 0.02, alpha: [0.32, 0.68], layer: 2, staticRatio: 0.2 }
            ];
            capas.forEach(capa => {
                const puntos = sembrarPuntosCampo(capa.n);
                for (let i = 0; i < capa.n; i++) {
                    const spec = tipoEspectralEstrella();
                    const casiFija = Math.random() < capa.staticRatio;
                    const spd = casiFija ? 0 : capa.speed * (0.55 + Math.random() * 0.5);
                    const ang = Math.random() * Math.PI * 2;
                    const vx = Math.cos(ang) * spd;
                    const vy = Math.sin(ang) * spd * 0.7;
                    const x = puntos[i] ? puntos[i].x : Math.random() * width;
                    const y = puntos[i] ? puntos[i].y : Math.random() * height;
                    spaceStars.push({
                        x,
                        y,
                        homeX: x,
                        homeY: y,
                        vx,
                        vy,
                        restVx: vx,
                        restVy: vy,
                        size: capa.size[0] + Math.random() * (capa.size[1] - capa.size[0]),
                        alpha: capa.alpha[0] + Math.random() * (capa.alpha[1] - capa.alpha[0]),
                        twinkleSpeed: Math.random() * (casiFija ? 0.008 : 0.014) + 0.002,
                        twinkleOffset: Math.random() * Math.PI * 2,
                        layer: capa.layer,
                        cr: spec.cr,
                        cg: spec.cg,
                        cb: spec.cb
                    });
                }
            });
        }

        let huecoEstelar = null;

        function factorRellenoHueco() {
            if (!huecoEstelar) return 0;
            const dt = performance.now() - huecoEstelar.t;
            if (dt < 850) return 0;
            const t = (dt - 850) / 7000;
            if (t >= 1.2) {
                huecoEstelar = null;
                return 0;
            }
            if (t >= 1) return 1;
            return t * t * (3 - 2 * t);
        }

        function inicializarPolvoObsidiana() {
            const n = window.innerWidth < 768 ? 58 : 95;
            for (let i = 0; i < n; i++) {
                const vx = (Math.random() - 0.5) * 0.012;
                const vy = (Math.random() - 0.5) * 0.012;
                spaceStars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx,
                    vy,
                    restVx: vx,
                    restVy: vy,
                    size: Math.random() * 1.1 + 0.35,
                    alpha: Math.random() * 0.28 + 0.08,
                    twinkleSpeed: Math.random() * 0.012 + 0.003,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    layer: 0
                });
            }
        }

        function abrirModalFondos() {
            FONDOS_DISPONIBLES.forEach(id => {
                const card = document.getElementById(`bg-card-${id}`);
                if (card) {
                    card.classList.toggle('active-bg', activeBackground === id);
                }
                renderizarPreviewFondoModal(id);
            });

            ocultarAjustesAlAbrirCapa();
            document.getElementById('backgrounds-modal').classList.add('active');
        }

        function renderizarPreviewFondoModal(id) {
            const pCanvas = document.getElementById(`preview-canvas-${id}`);
            if (!pCanvas) return;
            const pCtx = pCanvas.getContext('2d');
            pCanvas.width = pCanvas.clientWidth || 240;
            pCanvas.height = pCanvas.clientHeight || 188;
            const pw = pCanvas.width;
            const ph = pCanvas.height;

            pCtx.fillStyle = '#000000';
            pCtx.fillRect(0, 0, pw, ph);

            if (id === 2) dibujarPreviewSingularidad(pCtx, pw, ph);
            else dibujarPreviewObsidiana(pCtx, pw, ph);
        }

        function dibujarPreviewSingularidad(pCtx, pw, ph) {
            const cx = pw / 2, cy = ph / 2;
            const well = pCtx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(pw, ph) * 0.55);
            well.addColorStop(0, currentThemeHue == null ? 'rgba(38, 48, 68, 0.55)' : `hsla(${currentThemeHue}, 58%, 28%, 0.52)`);
            well.addColorStop(0.35, currentThemeHue == null ? 'rgba(8, 12, 20, 0.4)' : `hsla(${currentThemeHue}, 42%, 10%, 0.36)`);
            well.addColorStop(1, 'rgba(0,0,0,0)');
            pCtx.fillStyle = well;
            pCtx.fillRect(0, 0, pw, ph);
            const core = pCtx.createRadialGradient(cx, cy, 0, cx, cy, 28);
            core.addColorStop(0, 'rgba(0,0,0,1)');
            core.addColorStop(1, 'rgba(0,0,0,0)');
            pCtx.fillStyle = core;
            pCtx.fillRect(0, 0, pw, ph);
            for (let i = 0; i < 360; i++) {
                const r = Math.random();
                const col = r < 0.22
                    ? '196, 220, 255'
                    : r < 0.7
                        ? '232, 238, 255'
                        : r < 0.9
                            ? '255, 244, 214'
                            : '255, 208, 168';
                pCtx.fillStyle = `rgba(${col}, ${Math.random() * 0.5 + 0.18})`;
                pCtx.beginPath();
                pCtx.arc(Math.random() * pw, Math.random() * ph, Math.random() * 1.05 + 0.22, 0, Math.PI * 2);
                pCtx.fill();
            }
        }

        function dibujarPreviewObsidiana(pCtx, pw, ph) {
            const vg = pCtx.createRadialGradient(pw/2, ph*0.35, 8, pw/2, ph*0.45, Math.max(pw, ph) * 0.7);
            vg.addColorStop(0, 'rgba(18, 22, 30, 0.5)');
            vg.addColorStop(1, 'rgba(0,0,0,0.2)');
            pCtx.fillStyle = vg;
            pCtx.fillRect(0, 0, pw, ph);
            for (let i = 0; i < 18; i++) {
                pCtx.fillStyle = `rgba(210, 220, 235, ${Math.random() * 0.25 + 0.08})`;
                pCtx.beginPath();
                pCtx.arc(Math.random() * pw, Math.random() * ph, Math.random() * 0.9 + 0.3, 0, Math.PI * 2);
                pCtx.fill();
            }
        }

        function seleccionarFondoApp(id) {
            activeBackground = normalizarFondo(id);
            localStorage.setItem('proto2monolith_bg_choice', id);
            initActiveBackgroundEngine();
            persistirPrefsVisualesNube();
            avisarDiarioRemoto();
            document.getElementById('backgrounds-modal').classList.remove('active');
            volverAjustesSiPendiente();
        }

        function obtenerAudioCosmico() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return null;
            if (!cosmicAudioCtx || cosmicAudioCtx.state === 'closed') {
                cosmicAudioCtx = new AudioContext();
            }
            if (cosmicAudioCtx.state === 'suspended') cosmicAudioCtx.resume();
            return cosmicAudioCtx;
        }

        let ultimoToqueUiMs = 0;
        let toqueUiPuntero = null;
        function esObjetivoToqueUi(t) {
            if (!t || !t.closest) return false;
            if (t.closest('input, textarea, select, [contenteditable="true"]')) return false;
            if (t.closest('#chat-mic-btn, .ig-rec-bar, #bg-canvas, .settings-switch')) return false;
            return !!t.closest('button, .tab-item, .filter-pill, .cal-day, .day-btn, .config-pill, .habit-card-inspired, .history-thumb-card, .catalog-item, .block-rect-card, .ig-stat-box, .ig-btn-action, .ig-action-item, .ig-inbox-row, .settings-row, .hamburger-btn, .add-item-btn, .task-checkbox, .habit-options-btn, .habit-photo-btn, .profile-subtab, .history-habit-header, .bg-option-card, .onboard-choice, .dropdown-item, .ig-post-user-info, .calendar-day-cell, .cal-num, .ig-post-media, [onclick], [role="button"], [role="switch"]');
        }
        let clickDiferidoTimerId = null;
        let ultimoSonidoEspecificoMs = 0;

        // Un sonido específico (sello/logro/background) cancela el click genérico
        // pendiente del mismo gesto: nunca deben sonar a la vez.
        function marcarSonidoEspecifico() {
            ultimoSonidoEspecificoMs = Date.now();
            if (clickDiferidoTimerId) {
                clearTimeout(clickDiferidoTimerId);
                clickDiferidoTimerId = null;
            }
        }

        // Sonido de eliminación: se reproduce CUANDO algo se borra de verdad (tras
        // confirmar el aviso), nunca al abrir la opción. Cancela el click genérico
        // pendiente del gesto de confirmación para que sea el único sonido.
        function reproducirSonidoEliminar() {
            if (typeof marcarSonidoEspecifico === 'function') {
                try { marcarSonidoEspecifico(); } catch (e) {}
            }
            reproducirSonido('eliminar');
        }

        function feedbackToqueUi() {
            const now = Date.now();
            if (now - ultimoToqueUiMs < 90) return;
            ultimoToqueUiMs = now;
            pulsoHaptico(14);
            if (clickDiferidoTimerId) clearTimeout(clickDiferidoTimerId);
            clickDiferidoTimerId = setTimeout(() => {
                clickDiferidoTimerId = null;
                if (Date.now() - ultimoSonidoEspecificoMs < 140) return;
                reproducirSonido('toque_ui');
            }, 70);
        }

        function esElementoFondo(t) {
            if (!t) return false;
            if (t === canvas || t.id === 'bg-canvas') return true;
            if (t === document.body || t === document.documentElement) return true;
            if (t.closest('button, a, input, textarea, select, label')) return false;
            if (t.closest('.modal-overlay.active, .modal-card, .modal-card-full, .add-item-btn, .hamburger-btn, .dropdown-menu, .dropdown-item, .settings-row, .settings-switch, .habit-card-inspired, .habit-context-menu, .custom-dropdown, .horizontal-tabs, .tab-item, .profile-section, .calendar-strip, .time-filters, .filter-pill, .social-section-tab, .history-view-switch, .history-view-btn, .config-pill, .ig-stat-box, .ig-btn-action, .ig-profile-header, .ig-feed-scroll-container, .ig-avatar-large, .avatar-container, .profile-subtab, .history-habit-accordion, .history-habit-header, .history-thumb-card, .calendar-month-container, .calendar-month-nav-btn, .calendar-day-cell, .cal-num, .habit-ficha-back, .habit-ficha-edit, .ig-inbox-row, .chat-msg-row, #direct-chat-composer, .catalog-item, .block-rect-card, .task-checkbox, .habit-options-btn, .habit-photo-btn, #chat-mic-btn, .ig-rec-bar')) return false;
            const conClick = t.closest('[onclick]');
            if (conClick && conClick !== document.body) return false;
            return true;
        }

        function clickEsSobreFondo(e) {
            return esElementoFondo(e && e.target);
        }

        // Un toque sobre un checkbox de HÁBITO pendiente dispara su propio sonido
        // (sello.mp3 vía celebrarSello): el click genérico NO debe sonar a la vez.
        function toqueDisparaSello(t) {
            if (!t || !t.closest) return false;
            const cb = t.closest('.task-checkbox');
            if (!cb) return false;
            const oc = (cb.getAttribute && cb.getAttribute('onclick')) || '';
            if (oc.indexOf('clicCheckboxHabito') === -1) return false;
            if (cb.classList.contains('checked') || cb.classList.contains('skipped') || cb.classList.contains('is-locked')) return false;
            return true;
        }

        function empujarEstrellasEnToque(touchX, touchY, sobreFondo) {
            if (respetaMenosMovimiento()) return;
            if (!spaceStars.length) return;
            const dispersionRadius = window.innerWidth < 768 ? 160 : 240;
            const pushBase = window.innerWidth < 768 ? 3.0 : 4.6;
            huecoEstelar = { t: performance.now() };
            spaceStars.forEach(star => {
                const dx = star.x - touchX;
                const dy = star.y - touchY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < dispersionRadius && dist > 1) {
                    const angle = Math.atan2(dy, dx);
                    const pushForce = (1 - dist / dispersionRadius) * pushBase;
                    star.vx += Math.cos(angle) * pushForce;
                    star.vy += Math.sin(angle) * pushForce;
                }
            });
        }

        window.addEventListener('pointerdown', (e) => {
            if (!e.isPrimary) return;
            toqueUiPuntero = { x: e.clientX, y: e.clientY };
        }, true);
        window.addEventListener('pointerup', (e) => {
            if (!e.isPrimary || !toqueUiPuntero) return;
            const dx = Math.abs(e.clientX - toqueUiPuntero.x);
            const dy = Math.abs(e.clientY - toqueUiPuntero.y);
            toqueUiPuntero = null;
            if (dx > 14 || dy > 14) return;
            if (esObjetivoToqueUi(e.target) && !esElementoFondo(e.target) && !toqueDisparaSello(e.target)) feedbackToqueUi();
        }, true);
        window.addEventListener('click', (e) => {
            empujarEstrellasEnToque(e.clientX, e.clientY, clickEsSobreFondo(e));
            if (clickEsSobreFondo(e)) {
                if (!respetaMenosMovimiento()) {
                    marcarSonidoEspecifico();
                    reproducirSonido('background');
                }
                return;
            }
            if (esObjetivoToqueUi(e.target) && !toqueDisparaSello(e.target)) {
                feedbackToqueUi();
                return;
            }
        }, true);

        function maybeSpawnComet(lujo) {
            const chance = lujo ? 0.0009 : 0.0025;
            const maxC = lujo ? 1 : 2;
            if (Math.random() < chance && spaceComets.length < maxC) {
                const side = Math.random();
                let startX, startY, speedX, speedY;

                if (side < 0.5) {
                    startX = Math.random() * width;
                    startY = -50;
                    speedX = (Math.random() - 0.4) * 2.0;
                    speedY = Math.random() * 1.2 + 0.6;
                } else {
                    startX = Math.random() < 0.5 ? -50 : width + 50;
                    startY = Math.random() * (height * 0.4);
                    speedX = startX < 0 ? (Math.random() * 1.5 + 0.6) : -(Math.random() * 1.5 + 0.6);
                    speedY = Math.random() * 0.8 + 0.4;
                }

                spaceComets.push({
                    x: startX,
                    y: startY,
                    speedX: speedX,
                    speedY: speedY,
                    length: lujo ? (Math.random() * 140 + 110) : (Math.random() * 100 + 70),
                    alpha: Math.max(0.4, Math.random() * 0.65),
                    lujo: !!lujo
                });
            }
        }

        function dibujarVignette() {
            const vg = ctx.createRadialGradient(width * 0.5, height * 0.42, Math.min(width, height) * 0.12, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(0,0,0,0.62)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, width, height);
        }

        function dibujarSingularidadNueva() {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            const cx = width * 0.5;
            const cy = height * 0.46;
            const wellR = Math.max(width, height) * 0.55;
            const well = ctx.createRadialGradient(cx, cy, 6, cx, cy, wellR);
            well.addColorStop(0, currentThemeHue == null ? 'rgba(42, 54, 74, 0.42)' : `hsla(${currentThemeHue}, 58%, 26%, 0.48)`);
            well.addColorStop(0.14, currentThemeHue == null ? 'rgba(28, 38, 56, 0.28)' : `hsla(${currentThemeHue}, 52%, 18%, 0.30)`);
            well.addColorStop(0.28, currentThemeHue == null ? 'rgba(10, 16, 26, 0.45)' : `hsla(${currentThemeHue}, 42%, 9%, 0.36)`);
            well.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = well;
            ctx.fillRect(0, 0, width, height);

            const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.16);
            core.addColorStop(0, 'rgba(0,0,0,0.92)');
            core.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = core;
            ctx.fillRect(0, 0, width, height);

            const relleno = factorRellenoHueco();
            const stars = spaceStars;
            for (let i = 0, len = stars.length; i < len; i++) {
                const star = stars[i];
                star.twinkleOffset += star.twinkleSpeed;
                const currentAlpha = Math.max(0.04, Math.min(1, star.alpha * (0.55 + 0.45 * Math.sin(star.twinkleOffset))));
                const restVx = star.restVx || 0;
                const restVy = star.restVy || 0;
                star.vx += (restVx - star.vx) * 0.065;
                star.vy += (restVy - star.vy) * 0.065;
                star.x += star.vx;
                star.y += star.vy;
                if (relleno > 0 && star.homeX != null) {
                    star.x += deltaToroidal(star.homeX, star.x, width) * 0.0032 * relleno;
                    star.y += deltaToroidal(star.homeY, star.y, height) * 0.0032 * relleno;
                }
                star.x = envolverFondo(star.x, width);
                star.y = envolverFondo(star.y, height);

                if (star.layer === 2) {
                    ctx.fillStyle = `rgba(${star.cr}, ${star.cg}, ${star.cb}, ${currentAlpha * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size * 1.55, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = `rgba(${star.cr}, ${star.cg}, ${star.cb}, ${currentAlpha})`;
                if (star.size < 0.7) {
                    ctx.fillRect(star.x, star.y, star.size, star.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            maybeSpawnComet(true);
            dibujarCometas(true);
            dibujarVignette();
        }

        function dibujarObsidiana() {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            const sheen = ctx.createRadialGradient(width * 0.5, height * 0.28, 20, width * 0.5, height * 0.4, Math.max(width, height) * 0.7);
            sheen.addColorStop(0, currentThemeHue == null ? 'rgba(22, 26, 34, 0.45)' : `hsla(${currentThemeHue}, 18%, 14%, 0.32)`);
            sheen.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = sheen;
            ctx.fillRect(0, 0, width, height);

            spaceStars.forEach(star => {
                star.twinkleOffset += star.twinkleSpeed;
                const currentAlpha = Math.max(0.03, star.alpha * (0.5 + 0.5 * Math.sin(star.twinkleOffset)));
                const restVx = star.restVx || 0;
                const restVy = star.restVy || 0;
                star.vx += (restVx - star.vx) * 0.065;
                star.vy += (restVy - star.vy) * 0.065;
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0) star.x = width;
                if (star.x > width) star.x = 0;
                if (star.y < 0) star.y = height;
                if (star.y > height) star.y = 0;
                ctx.fillStyle = `rgba(214, 222, 232, ${currentAlpha})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            dibujarVignette();
        }

        function dibujarCometas(lujo) {
            spaceComets = spaceComets.filter(c => {
                c.x += c.speedX;
                c.y += c.speedY;
                c.alpha -= lujo ? 0.0014 : 0.002;
                const tailAngle = Math.atan2(c.speedY, c.speedX);
                const tailX = c.x - Math.cos(tailAngle) * c.length;
                const tailY = c.y - Math.sin(tailAngle) * c.length;
                const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
                grad.addColorStop(0, `rgba(240, 245, 255, ${Math.max(0, c.alpha)})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = lujo ? 2.4 : 1.2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, c.alpha)})`;
                ctx.beginPath();
                ctx.arc(c.x, c.y, lujo ? 2.1 : 1.5, 0, Math.PI * 2);
                ctx.fill();
                return !(c.x < -150 || c.x > width + 150 || c.y > height + 150 || c.alpha <= 0);
            });
        }

        function detenerLoopFondo() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        function arrancarLoopFondo() {
            if (animationFrameId || document.hidden) return;
            animationFrameId = requestAnimationFrame(masterBackgroundLoop);
        }

        function masterBackgroundLoop() {
            animationFrameId = null;
            if (document.hidden || !ctx) return;
            if (activeBackground === 2 || fondoForzadoOverlay) dibujarSingularidadNueva();
            else dibujarObsidiana();
            animationFrameId = requestAnimationFrame(masterBackgroundLoop);
        }

        async function ejecutarRefrescoManual() {
            if (currentUser) {
                await cargarDatosUsuarioSupabase();
            }
            const exploreModal = document.getElementById('explore-modal');
            if (exploreModal && exploreModal.classList.contains('active')) {
                await precargarDatosSocialesGlobalesOptimizado();
            }
            renderizarMiRutina();
            renderizarListaDeseos();
            actualizarEstadisticasPerfil();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            if (exploreModal && exploreModal.classList.contains('active')) {
                renderizarGridExplorar();
            }
        }

        function obtenerScrollerTabActivo() {
            const tabContents = document.querySelectorAll('#content-slider .tab-content');
            return tabContents[currentIndex] || null;
        }

        function ptrEstaBloqueado() {
            if (ptrState.refreshing) return true;
            if (document.querySelector('.modal-overlay.active')) return true;
            return false;
        }

        function ptrDistanciaResistida(dy) {
            return Math.min(PTR_MAX, Math.max(0, dy) * 0.42);
        }

        function aplicarPullToRefresh(dy) {
            const resisted = ptrDistanciaResistida(dy);
            const scroller = ptrState.scroller || obtenerScrollerTabActivo();
            if (scroller) {
                scroller.style.transition = 'none';
                scroller.style.transform = `translateY(${resisted}px)`;
            }
            const ind = document.getElementById('ptr-indicator');
            if (!ind) return;
            const progress = Math.min(1, resisted / PTR_THRESHOLD);
            ind.style.transition = 'none';
            ind.style.opacity = String(Math.min(1, progress * 1.25));
            ind.style.transform = `translateY(${Math.max(0, resisted * 0.35)}px)`;
            const spin = ind.querySelector('.ptr-spinner');
            if (spin && !ind.classList.contains('refreshing')) {
                spin.style.transform = `rotate(${progress * 270}deg)`;
            }
        }

        function resetearPullToRefresh(animar) {
            const scroller = ptrState.scroller || obtenerScrollerTabActivo();
            const ind = document.getElementById('ptr-indicator');
            document.querySelectorAll('#content-slider .tab-content').forEach(el => {
                el.style.transition = animar ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
                if (el !== scroller || !ptrState.refreshing) {
                    el.style.transform = '';
                }
            });
            if (scroller && !ptrState.refreshing) {
                scroller.style.transition = animar ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
                scroller.style.transform = '';
            }
            if (ind && !ptrState.refreshing) {
                ind.classList.remove('refreshing');
                ind.style.transition = animar ? 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
                ind.style.opacity = '0';
                ind.style.transform = 'translateY(-8px)';
                const spin = ind.querySelector('.ptr-spinner');
                if (spin) spin.style.transform = '';
            }
        }

        function cancelarGestoSliderHorizontal() {
            isDragging = false;
            if (!slider) return;
            aplicarPosicionSlider(true);
            prevTranslate = -currentIndex * anchoVistaSlider();
            currentTranslate = prevTranslate;
        }

        async function soltarPullToRefresh() {
            const resisted = ptrDistanciaResistida(ptrState.dy);
            const shouldRefresh = ptrState.pulling && resisted >= PTR_THRESHOLD;
            ptrState.armed = false;
            ptrState.pulling = false;

            if (!shouldRefresh) {
                ptrState.dy = 0;
                resetearPullToRefresh(true);
                return;
            }

            ptrState.refreshing = true;
            const scroller = ptrState.scroller || obtenerScrollerTabActivo();
            const ind = document.getElementById('ptr-indicator');
            if (scroller) {
                scroller.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
                scroller.style.transform = `translateY(${PTR_HOLD}px)`;
            }
            if (ind) {
                ind.classList.add('refreshing');
                const spin = ind.querySelector('.ptr-spinner');
                if (spin) spin.style.transform = '';
                ind.style.transition = 'opacity 0.15s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
                ind.style.opacity = '1';
                ind.style.transform = `translateY(${PTR_HOLD * 0.2}px)`;
            }

            try {
                await ejecutarRefrescoManual();
            } catch (e) {
                console.error('Error al refrescar:', e);
            } finally {
                const scroller = ptrState.scroller || obtenerScrollerTabActivo();
                ptrState.refreshing = false;
                ptrState.dy = 0;
                resetearPullToRefresh(true);
                ptrState.scroller = null;
                if (scroller && !respetaMenosMovimiento()) {
                    scroller.classList.remove('ptr-settle');
                    void scroller.offsetWidth;
                    scroller.classList.add('ptr-settle');
                    setTimeout(() => scroller.classList.remove('ptr-settle'), 360);
                }
            }
        }

        function ptrScrollerEnCima(scroller) {
            return !!(scroller && scroller.scrollTop <= 2);
        }

        function ptrCoordsEvento(e) {
            if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            return { x: e.clientX, y: e.clientY };
        }

        function ptrPuedeIniciar(e) {
            if (ptrEstaBloqueado()) return false;
            if (e.touches && e.touches.length !== 1) return false;
            if (e.pointerType === 'mouse' && typeof e.buttons === 'number' && !(e.buttons & 1)) return false;
            return ptrScrollerEnCima(obtenerScrollerTabActivo());
        }

        function ptrOnStart(e) {
            if (!ptrPuedeIniciar(e)) return;
            const p = ptrCoordsEvento(e);
            ptrState.startX = p.x;
            ptrState.startY = p.y;
            ptrState.dy = 0;
            ptrState.pulling = false;
            ptrState.armed = true;
            ptrState.scroller = obtenerScrollerTabActivo();
        }

        function ptrOnMove(e) {
            if (!ptrState.armed || ptrState.refreshing) return;
            if (e.touches && e.touches.length !== 1) return;
            const p = ptrCoordsEvento(e);
            const dy = p.y - ptrState.startY;
            const dx = Math.abs(p.x - ptrState.startX);

            if (!ptrState.pulling) {
                if (dy < 10) return;
                if (dx > dy) {
                    ptrState.armed = false;
                    return;
                }
                const scroller = ptrState.scroller || obtenerScrollerTabActivo();
                if (!ptrScrollerEnCima(scroller)) {
                    ptrState.armed = false;
                    return;
                }
                ptrState.pulling = true;
                cancelarGestoSliderHorizontal();
                if (e.pointerId != null && e.currentTarget && e.currentTarget.setPointerCapture) {
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
                }
            }

            if (ptrState.pulling && dy > 0) {
                if (e.cancelable) e.preventDefault();
                ptrState.dy = dy;
                aplicarPullToRefresh(dy);
            }
        }

        function ptrOnEnd() {
            if (ptrState.refreshing) return;
            if (!ptrState.armed && !ptrState.pulling) return;
            soltarPullToRefresh();
        }

        function inicializarPullToRefresh() {
            const app = document.getElementById('app-container');
            const viewport = document.getElementById('content-viewport');
            const targets = [app, viewport].concat(Array.from(document.querySelectorAll('#content-slider .tab-content')));
            const seen = new Set();
            targets.forEach(el => {
                if (!el || seen.has(el)) return;
                seen.add(el);
                el.addEventListener('touchstart', ptrOnStart, { passive: true });
                el.addEventListener('touchmove', ptrOnMove, { passive: false });
                el.addEventListener('touchend', ptrOnEnd);
                el.addEventListener('touchcancel', ptrOnEnd);
                el.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'touch') return;
                    ptrOnStart(e);
                });
                el.addEventListener('pointermove', (e) => {
                    if (e.pointerType === 'touch') return;
                    ptrOnMove(e);
                }, { passive: false });
                el.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'touch') return;
                    ptrOnEnd();
                });
                el.addEventListener('pointercancel', (e) => {
                    if (e.pointerType === 'touch') return;
                    ptrOnEnd();
                });
            });
        }

        function sincronizarARIANavPrincipal() {
            // La navegación principal es un tablist (ARIA): cada tab activo lleva
            // aria-selected=true, tabindex=0 (patrón de roving tabindex) y el
            // resto aria-selected=false, tabindex=-1. Así los lectores de
            // pantalla y el teclado navegan las secciones como pestañas reales.
            document.querySelectorAll('.horizontal-tabs .tab-item').forEach(t => {
                const i = Number(t.getAttribute('data-tab-index'));
                const activo = i === currentIndex;
                t.classList.toggle('active', activo);
                t.setAttribute('aria-selected', activo ? 'true' : 'false');
                t.setAttribute('tabindex', activo ? '0' : '-1');
            });
        }

        function cambiarTab(index) {
            currentIndex = index;
            aplicarPosicionSlider(true);
            sincronizarARIANavPrincipal();
            requestAnimationFrame(actualizarTabInk);
            if (index !== 2) { cerrarModalInsignia3D(); }

            if (!ptrState.refreshing) {
                document.querySelectorAll('#content-slider .tab-content').forEach(el => {
                    el.style.transform = '';
                });
            }

            if (index === 0) {
                document.body.classList.remove('tab-social');
                renderCalendarStrip();
                renderizarMiRutina();
            } else if (index === 1) {
                document.body.classList.remove('tab-social');
                if (typeof sincronizarVistaDeseosPorDefecto === 'function') sincronizarVistaDeseosPorDefecto();
                else renderizarListaDeseos();
            } else if (index === 2) {
                document.body.classList.add('tab-social');
                actualizarEstadisticasPerfil();
                renderizarPerfilPublicacionesGrid();
                // Al volver a Social, el feed de ACTIVIDAD se refresca: no puede
                // quedar una publicación de un sello ya deshecho o eliminado.
                if (socialSeccionActiva === 'actividad') {
                    const gridAct = document.getElementById('social-activity-grid');
                    if (gridAct) gridAct.innerHTML = '';
                }
                sincronizarVisibilidadColeccionSocial();
            } else if (index === 3) {
                document.body.classList.remove('tab-social');
                if (typeof sincronizarVistaHistorialPorDefecto === 'function') sincronizarVistaHistorialPorDefecto();
                else renderizarTabHistorial();
            }
        }

        function inicializarSliderGestos() {
            if (!slider) return;
            slider.addEventListener('touchstart', (e) => {
                if (ptrState.pulling || ptrState.refreshing) {
                    isDragging = false;
                    return;
                }
                if (e.target.closest('#badge-detail-tilt')) {
                    isDragging = false;
                    return;
                }
                if ((e.target.closest('button') && !e.target.closest('.badge-card, .badge-theme-next, .badge-start-cta')) || 
                    e.target.closest('a') ||
                    e.target.closest('input') || 
                    e.target.closest('textarea') || 
                    e.target.closest('select') || 
                    e.target.closest('.tab-item') ||
                    e.target.closest('.filter-pill') ||
                    e.target.closest('.cal-day') ||
                    e.target.closest('.calendar-strip') ||
                    e.target.closest('.calendar-strip-wrap') ||
                    e.target.closest('.calendar-strip-viewport') ||
                    e.target.closest('.calendar-hoy-btn') ||
                    e.target.closest('.history-thumb-card') ||
                    e.target.closest('.history-images-grid') ||
                    e.target.closest('#profile-posts-grid-container') ||
                    e.target.closest('#explore-posts-grid') ||
                    e.target.closest('.ig-inbox-row') ||
                    e.target.closest('.habit-card-inspired') ||
                    e.target.closest('.history-habit-accordion') ||
                    e.target.closest('.history-habit-header') ||
                    e.target.closest('.calendar-month-container') ||
                    e.target.closest('.profile-subtab') ||
                    e.target.closest('.ig-stat-box') ||
                    e.target.closest('.ig-btn-action') ||
                    e.target.closest('.ig-profile-header') ||
                    e.target.closest('.catalog-item') ||
                    e.target.closest('.block-rect-card') ||
                    e.target.closest('.dropdown-menu') ||
                    e.target.closest('.habit-context-menu') ||
                    e.target.closest('.custom-dropdown') ||
                    e.target.closest('.modal-overlay.active') ||
                    e.target.closest('.task-checkbox') ||
                    e.target.closest('.habit-options-btn') ||
                    e.target.closest('.habit-photo-btn')) {
                    isDragging = false;
                    return;
                }
                isDragging = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                currentTranslate = prevTranslate;
                slider.style.transition = 'none';
            }, { passive: true });

            slider.addEventListener('touchmove', (e) => {
                if (ptrState.pulling || ptrState.refreshing) {
                    isDragging = false;
                    return;
                }
                if (!isDragging) return;
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                if (diffY > diffX) {
                    isDragging = false;
                    aplicarPosicionSlider(true);
                    return;
                }

                const diff = currentX - startX;
                currentTranslate = prevTranslate + diff;
                slider.style.transform = `translateX(${currentTranslate}px)`;
            }, { passive: true });

            slider.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
                
                const movedBy = currentTranslate - prevTranslate;

                if (Math.abs(movedBy) > 50) {
                    if (movedBy < 0 && currentIndex < tabs.length - 1) {
                        currentIndex++;
                    } else if (movedBy > 0 && currentIndex > 0) {
                        currentIndex--;
                    }
                }

                cambiarTab(currentIndex);
            }, { passive: true });
        }

        function cleanHabitName(name) {
            if (!name) return '';
            return String(name)
                .replace(/\(24\/7\)/gi, '')
                .replace(/\((mañana|tarde|noche|todos)\)/gi, '')
                .replace(/\p{Extended_Pictographic}/gu, '')
                .replace(/[\uFE0F\u200D]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        async function precargarDatosSocialesGlobalesOptimizado() {
            try {
                const { data: profiles } = await supabaseClient.from('profiles').select('id, username, bio, account_privacy');
                if (!profiles) return;

                if (!window.cachePerfilesSocial) window.cachePerfilesSocial = {};

                const { data: allFollowsData } = await supabaseClient.from('follows').select('follower_id, following_id');
                const allFollows = allFollowsData || [];

                const idsVisibles = profiles
                    .filter(p => {
                        if (currentUser && p.id === currentUser.id) return false;
                        const isFollowing = currentUser
                            ? allFollows.some(f => f.follower_id === currentUser.id && f.following_id === p.id)
                            : false;
                        return puedeVerHistorialCuenta(p.account_privacy, isFollowing);
                    })
                    .map(p => p.id);

                const { data: allLogsData } = idsVisibles.length
                    ? await supabaseClient.from('habit_logs').select('id, user_id, habit_name, text_comment, image_url, privacy, created_at').in('user_id', idsVisibles)
                    : { data: [] };
                const allLogs = allLogsData || [];
                const logIds = allLogs.map(l => l.id).filter(Boolean);

                const [allLikesRes, allCommentsRes] = await Promise.all([
                    logIds.length
                        ? supabaseClient.from('likes').select('id, log_id, user_id').in('log_id', logIds)
                        : Promise.resolve({ data: [] }),
                    logIds.length
                        ? supabaseClient.from('comments').select('id, user_id, log_id, text_comment, profiles(username)').in('log_id', logIds)
                        : Promise.resolve({ data: [] })
                ]);

                const allLikes = allLikesRes.data || [];
                const allComments = allCommentsRes.data || [];

                profiles.forEach(p => {
                    if (currentUser && p.id === currentUser.id) return;

                    const pLogs = allLogs.filter(l => l.user_id === p.id);
                    const pFollowers = allFollows.filter(f => f.following_id === p.id);
                    const pFollowing = allFollows.filter(f => f.follower_id === p.id);
                    const isFollowing = currentUser ? allFollows.some(f => f.follower_id === currentUser.id && f.following_id === p.id) : false;

                    let historialMap = {};

                    pLogs.forEach(l => {
                        const dObj = new Date(l.created_at || Date.now());
                        const logLikes = allLikes.filter(lk => lk.log_id === l.id);
                        const logComments = allComments.filter(cm => cm.log_id === l.id);
                        const cleanHName = cleanHabitName(l.habit_name);

                        const formattedLog = {
                            id: l.id,
                            user_id: l.user_id,
                            nombre: cleanHName,
                            fecha: dObj.toLocaleDateString(),
                            dateObj: dObj,
                            timestamp: dObj.getTime(),
                            texto: l.text_comment,
                            score: null,
                            imagenes: (l.image_url && l.image_url.trim() !== '') ? [l.image_url] : [],
                            image_url: l.image_url,
                            privacidad: l.privacy || 'seguidores',
                            likes: logLikes.length,
                            likedByMe: currentUser ? logLikes.some(lk => lk.user_id === currentUser.id) : false,
                            comentarios: logComments.map(c => ({
                                id: c.id,
                                user_id: c.user_id,
                                autor: c.profiles ? c.profiles.username : 'Usuario',
                                texto: c.text_comment
                            }))
                        };

                        if (!historialMap[cleanHName]) historialMap[cleanHName] = [];
                        historialMap[cleanHName].push(formattedLog);
                    });

                    window.cachePerfilesSocial[p.id] = {
                        name: p.username || 'Anonymous',
                        subtitle: p.bio || '',
                        avatar: null,
                        accountPrivacy: normalizarPrivacidadCuenta(p.account_privacy),
                        isFollowing: isFollowing,
                        followersCount: pFollowers.length,
                        followingCount: pFollowing.length,
                        historialAgrupado: historialMap
                    };
                });

                const idsConAvatar = Array.from(new Set(allLogs.map(l => l.user_id).filter(Boolean)));
                if (idsConAvatar.length) {
                    const { data: avatars } = await supabaseClient
                        .from('profiles')
                        .select('id, avatar_url')
                        .in('id', idsConAvatar);
                    (avatars || []).forEach(a => {
                        if (window.cachePerfilesSocial[a.id]) {
                            window.cachePerfilesSocial[a.id].avatar = a.avatar_url || null;
                        }
                    });
                }
            } catch(e) {
                console.error("Error en precarga social optimizada:", e);
            }
        }

        const AWAKE_STATE_KEY = 'proto2monolith_app_state';

        function claveEstadoLocal(uid) {
            return AWAKE_STATE_KEY + ':' + (uid || 'guest');
        }

        function migrarEstadoLocalLegacy() {
            try {
                const raw = localStorage.getItem(AWAKE_STATE_KEY);
                if (!raw) return;
                const estado = JSON.parse(raw);
                const uid = estado && estado.user_id ? estado.user_id : 'guest';
                const dest = claveEstadoLocal(uid);
                if (!localStorage.getItem(dest)) localStorage.setItem(dest, raw);
                localStorage.removeItem(AWAKE_STATE_KEY);
            } catch (e) {}
        }

        function guardarEstadoLocal() {
            try {
                const uid = currentUser ? currentUser.id : 'guest';
                const estado = {
                    user_id: uid,
                    nickname: document.getElementById('display-nickname').textContent,
                    bio: document.getElementById('profile-view-subtitle').textContent,
                    avatar: (function () {
                        if (!window.userHasAvatar) return null;
                        const src = document.getElementById('avatar-img') && document.getElementById('avatar-img').src;
                        if (!src || src.indexOf('data:') === 0) return null;
                        return src;
                    })(),
                    misHabitos,
                    misDeseos: (misDeseos || []).map(d => ({
                        ...d,
                        imagen: (d && d.imagen && String(d.imagen).indexOf('data:') === 0) ? null : (d && d.imagen)
                    })),
                    historialAgrupado: serializarHistorial(historialAgrupado),
                    catalogoPersonal,
                    accountPrivacy,
                    currentThemeHue,
                    activeBackground
                };
                localStorage.setItem(claveEstadoLocal(uid), JSON.stringify(estado));
            } catch(e) {
                console.error("Error guardando en localStorage:", e);
            }
        }

        function aplicarPreferenciasVisualesLocal() {
            cargarPrefsRitualLocal();
            migrarEstadoLocalLegacy();
            try {
                const uid = currentUser ? currentUser.id : 'guest';
                const guardado = localStorage.getItem(claveEstadoLocal(uid));
                if (guardado) {
                    const estado = JSON.parse(guardado);
                    if (estado.currentThemeHue !== undefined) {
                        currentThemeHue = estado.currentThemeHue;
                        aplicarTemaGlobalHabitos(currentThemeHue);
                    }
                    if (estado.activeBackground !== undefined) {
                        activeBackground = normalizarFondo(estado.activeBackground);
                    }
                }
            } catch (e) {}
            if (localStorage.getItem('proto2monolith_bg_choice') != null) {
                activeBackground = normalizarFondo(localStorage.getItem('proto2monolith_bg_choice'));
            } else if (!activeBackground) {
                activeBackground = 2;
            }
        }

        function cargarEstadoLocal(uid) {
            if (!uid) return;
            migrarEstadoLocalLegacy();
            try {
                const guardado = localStorage.getItem(claveEstadoLocal(uid));
                if (!guardado) return;
                const estado = JSON.parse(guardado);
                if (estado.user_id && estado.user_id !== uid && estado.user_id !== 'guest') return;

                if (estado.nickname) {
                    document.getElementById('display-nickname').textContent = estado.nickname;
                    document.getElementById('profile-bio-name').textContent = estado.nickname;
                }
                if (estado.bio !== undefined) {
                    document.getElementById('profile-view-subtitle').textContent = estado.bio;
                }
                if (estado.avatar && String(estado.avatar).indexOf('data:') !== 0) {
                    aplicarImagenAvatar(estado.avatar);
                }
                if (estado.accountPrivacy) {
                    accountPrivacy = estado.accountPrivacy;
                }
                if (estado.currentThemeHue !== undefined) {
                    currentThemeHue = estado.currentThemeHue;
                    aplicarTemaGlobalHabitos(currentThemeHue);
                }
                if (estado.activeBackground !== undefined) {
                    activeBackground = normalizarFondo(estado.activeBackground);
                }
                if (estado.misHabitos) {
                    misHabitos = estado.misHabitos.map(h => {
                        const limpio = aplicarModoContinuoHabito({
                            ...h,
                            nombre: cleanHabitName(h.nombre || ''),
                            glyph: sanitizarGlifoPersistido(h)
                        });
                        delete limpio.frase;
                        return limpio;
                    });
                }
                if (estado.misDeseos) {
                    misDeseos = deduplicarDeseos(estado.misDeseos.map(d => ({ ...d, nombre: cleanHabitName(d.nombre || '') })));
                }
                if (estado.historialAgrupado) {
                    historialAgrupado = deserializarHistorial(estado.historialAgrupado);
                }
                if (estado.catalogoPersonal) {
                    const legacyUna = Array.isArray(estado.catalogoPersonal.deseos) ? estado.catalogoPersonal.deseos : [];
                    const unaVez = Array.isArray(estado.catalogoPersonal.unaVez) ? estado.catalogoPersonal.unaVez : [];
                    const merged = [];
                    const seen = {};
                    const esDeseoEjemplo = (nombre) => {
                        const k = cleanHabitName(nombre || '').toLocaleLowerCase('es');
                        if (!k) return true;
                        return (typeof catalogoHabitos !== 'undefined' && (catalogoHabitos.deseosUnicos || []).some(h =>
                            cleanHabitName(h.nombre).toLocaleLowerCase('es') === k
                        ));
                    };
                    legacyUna.concat(unaVez).forEach(x => {
                        const n = cleanHabitName((x && x.nombre) || '');
                        const k = n.toLocaleLowerCase('es');
                        if (!n || seen[k] || esDeseoEjemplo(n)) return;
                        seen[k] = true;
                        const norm = typeof normalizarEntradaCatalogoPersonal === 'function'
                            ? normalizarEntradaCatalogoPersonal(x)
                            : { nombre: n, glyph: '', bgColor: '', tipo: '' };
                        if (norm) merged.push(norm);
                    });
                    catalogoPersonal = {
                        unaVez: merged,
                        rituales: (Array.isArray(estado.catalogoPersonal.rituales) ? estado.catalogoPersonal.rituales : [])
                            .map(x => typeof normalizarEntradaCatalogoPersonal === 'function' ? normalizarEntradaCatalogoPersonal(x) : x)
                            .filter(Boolean),
                        abstinencias: (Array.isArray(estado.catalogoPersonal.abstinencias) ? estado.catalogoPersonal.abstinencias : [])
                            .map(x => typeof normalizarEntradaCatalogoPersonal === 'function' ? normalizarEntradaCatalogoPersonal(x) : x)
                            .filter(Boolean)
                    };
                    if (typeof limpiarCatalogoPersonalIntegrado === 'function') limpiarCatalogoPersonalIntegrado();
                }
            } catch(e) {
                console.error("Error cargando de localStorage:", e);
            }
        }

        function esDataUrlMedia(s) {
            return typeof s === 'string' && s.indexOf('data:') === 0;
        }

        function serializarHistorial(hist) {
            let serializado = {};
            Object.keys(hist).forEach(key => {
                const cleanKey = cleanHabitName(key);
                const mapped = hist[key].map(item => {
                    // Los registros locales de invitado conservan su foto (data URL);
                    // los remotos (con user_id) nunca tienen data URLs.
                    const local = !(item && item.user_id);
                    const image_url = (esDataUrlMedia(item.image_url) && !local) ? '' : (item.image_url || '');
                    const imagenes = (item.imagenes || []).filter(u => u && (!esDataUrlMedia(u) || local));
                    return {
                        ...item,
                        nombre: cleanHabitName(item.nombre),
                        image_url,
                        imagenes,
                        dateObj: item.dateObj ? item.dateObj.getTime() : Date.now()
                    };
                });
                serializado[cleanKey] = (serializado[cleanKey] || []).concat(mapped);
            });
            return serializado;
        }

        function deserializarHistorial(serial) {
            let deserial = {};
            window.registrosGlobalMap = {};
            Object.keys(serial).forEach(key => {
                const cleanKey = cleanHabitName(key);
                const mapped = serial[key].map(item => {
                    const dObj = new Date(item.dateObj || item.timestamp || Date.now());
                    const reg = {
                        ...item,
                        nombre: cleanHabitName(item.nombre || cleanKey),
                        dateObj: dObj
                    };
                    if(reg.id) window.registrosGlobalMap[reg.id] = reg;
                    return reg;
                });
                deserial[cleanKey] = (deserial[cleanKey] || []).concat(mapped);
            });
            return deserial;
        }

        function cambiarSubTabPerfil(tipo, el) {
            document.querySelectorAll('.profile-subtab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            document.querySelectorAll('.profile-subtab-content').forEach(c => c.classList.remove('active'));
            if(el) {
                el.classList.add('active');
                el.setAttribute('aria-selected', 'true');
                el.setAttribute('tabindex', '0');
            }
            const target = document.getElementById(`profile-subtab-${tipo}`);
            if(target) target.classList.add('active');
            if (tipo === 'insignias') {
                badgeVistaActiva = 'showcase';
                renderizarInsignias();
            }
        }

        function sincronizarVisibilidadColeccionSocial() {
            const btnCol = document.getElementById('social-section-btn-coleccion');
            const switcher = document.getElementById('social-section-switch');
            const ajeno = !!viewingUserId;
            const secAct = document.getElementById('social-section-actividad');
            const btnAct = document.getElementById('social-section-btn-actividad');
            if (btnCol) btnCol.classList.toggle('is-hidden-ajeno', ajeno);
            if (switcher) switcher.classList.toggle('is-ajeno', ajeno);
            if (ajeno && socialSeccionActiva === 'coleccion') {
                socialSeccionActiva = 'perfil';
            }
            badgeVistaActiva = socialSeccionActiva === 'coleccion' ? 'coleccion' : 'showcase';
            const secPerfil = document.getElementById('social-section-perfil');
            const secCol = document.getElementById('social-section-coleccion');
            const btnPerfil = document.getElementById('social-section-btn-perfil');
            if (secPerfil) secPerfil.classList.toggle('is-active', socialSeccionActiva === 'perfil');
            if (secCol) {
                const showCol = !ajeno && socialSeccionActiva === 'coleccion';
                secCol.classList.toggle('is-active', showCol);
                if (showCol) secCol.removeAttribute('hidden');
                else secCol.setAttribute('hidden', '');
            }
            if (btnPerfil) {
                btnPerfil.classList.toggle('active', socialSeccionActiva === 'perfil');
                btnPerfil.setAttribute('aria-selected', socialSeccionActiva === 'perfil' ? 'true' : 'false');
            }
            if (btnCol) {
                btnCol.classList.toggle('active', socialSeccionActiva === 'coleccion' && !ajeno);
                btnCol.setAttribute('aria-selected', socialSeccionActiva === 'coleccion' && !ajeno ? 'true' : 'false');
            }
            if (secAct) secAct.classList.toggle('is-active', socialSeccionActiva === 'actividad');
            if (btnAct) {
                btnAct.classList.toggle('active', socialSeccionActiva === 'actividad');
                btnAct.setAttribute('aria-selected', socialSeccionActiva === 'actividad' ? 'true' : 'false');
            }
            if (socialSeccionActiva === 'actividad') {
                const grid = document.getElementById('social-activity-grid');
                if (grid && !grid.childElementCount && document.body.classList.contains('tab-social')) {
                    precargarDatosSocialesGlobalesOptimizado().then(() => renderizarFeedActividad(grid));
                }
            }
        }

        function cambiarSeccionSocial(seccion, el) {
            if (seccion !== 'perfil' && seccion !== 'coleccion' && seccion !== 'actividad') return;
            if (viewingUserId && seccion === 'coleccion') return;
            socialSeccionActiva = seccion;
            sincronizarVisibilidadColeccionSocial();
            if (seccion === 'coleccion') {
                renderizarInsignias();
            } else if (seccion === 'actividad') {
                const grid = document.getElementById('social-activity-grid');
                if (grid) {
                    precargarDatosSocialesGlobalesOptimizado().then(() => renderizarFeedActividad(grid));
                }
            } else {
                const insigniasPane = document.getElementById('profile-subtab-insignias');
                if (insigniasPane && insigniasPane.classList.contains('active')) {
                    renderizarInsignias();
                }
            }
            if (el && el.classList) {
                document.querySelectorAll('.social-section-tab').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
            }
        }

        function irAColeccionInsignias() {
            if (viewingUserId) return;
            cambiarTab(2);
            setTimeout(() => {
                cambiarSeccionSocial('coleccion', document.getElementById('social-section-btn-coleccion'));
            }, 40);
        }

        function abrirModalPublicacionesTab() {
            const pubsTabBtn = document.querySelector('.profile-subtab');
            cambiarSubTabPerfil('pubs', pubsTabBtn);
            const grid = document.getElementById('profile-posts-grid-container');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }


        function capacitorPlugin(name) {
            try {
                const cap = window.Capacitor;
                if (!cap) return null;
                if (cap.Plugins && cap.Plugins[name]) return cap.Plugins[name];
                if (typeof cap.getPlugin === 'function') {
                    const p = cap.getPlugin(name);
                    if (p) return p;
                }
            } catch (e) {}
            return null;
        }

        function esAppNativa() {
            try {
                return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
            } catch (e) {
                return false;
            }
        }

        function esPlataformaIOS() {
            try {
                if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'ios') return true;
            } catch (e) {}
            const ua = navigator.userAgent || '';
            if (/iPad|iPhone|iPod/.test(ua)) return true;
            return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        }

        function plataformaNativaId() {
            try {
                if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function') {
                    const p = window.Capacitor.getPlatform();
                    if (p === 'ios' || p === 'android') return p;
                }
            } catch (e) {}
            return esPlataformaIOS() ? 'ios' : 'android';
        }

        async function inicializarCapaNativa() {
            if (esPlataformaIOS()) {
                document.documentElement.classList.add('plataforma-ios');
                if (!esAppNativa()) document.documentElement.classList.add('ios-web');
                if (window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
                    document.documentElement.classList.add('ios-standalone');
                }
            }
            const StatusBar = capacitorPlugin('StatusBar');
            try {
                if (StatusBar) {
                    if (StatusBar.setOverlaysWebView) await StatusBar.setOverlaysWebView({ overlay: true });
                    if (StatusBar.setStyle) await StatusBar.setStyle({ style: 'LIGHT' });
                    if (StatusBar.getInfo) {
                        const info = await StatusBar.getInfo();
                        const alto = info && Number(info.height);
                        if (alto > 0) {
                            const actual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
                            if (actual < alto) {
                                document.documentElement.style.setProperty('--safe-area-inset-top', alto + 'px');
                            }
                        }
                    }
                }
            } catch (e) {}
            if (!esPlataformaIOS()) return;
            const Keyboard = capacitorPlugin('Keyboard');
            try {
                if (Keyboard && Keyboard.setResizeMode) await Keyboard.setResizeMode({ mode: 'none' });
                if (Keyboard && Keyboard.setAccessoryBarVisible) await Keyboard.setAccessoryBarVisible({ isVisible: false });
            } catch (e) {}
            inicializarTecladoVisual();
            document.addEventListener('touchstart', () => obtenerAudioCosmico(), { once: true, passive: true });
        }

        function inicializarTecladoVisual() {
            if (!esPlataformaIOS() || window._awakeKbBound) return;
            window._awakeKbBound = true;
            const enSafari = !esAppNativa();
            let kbNativo = 0;
            const aplicarAlto = () => {
                const vv = window.visualViewport;
                const h = vv && vv.height ? vv.height : window.innerHeight;
                document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
            };
            const aplicar = () => {
                aplicarAlto();
                if (enSafari) {
                    document.documentElement.style.setProperty('--kb-inset', '0px');
                    return;
                }
                if (kbNativo > 0) {
                    document.documentElement.style.setProperty('--kb-inset', kbNativo + 'px');
                    return;
                }
                const vv = window.visualViewport;
                if (!vv) {
                    document.documentElement.style.setProperty('--kb-inset', '0px');
                    return;
                }
                const overlap = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
                document.documentElement.style.setProperty('--kb-inset', overlap + 'px');
            };
            const Keyboard = capacitorPlugin('Keyboard');
            if (Keyboard && Keyboard.addListener) {
                Keyboard.addListener('keyboardWillShow', (info) => {
                    kbNativo = (info && info.keyboardHeight) || 0;
                    aplicar();
                }).catch(() => {});
                Keyboard.addListener('keyboardWillHide', () => {
                    kbNativo = 0;
                    aplicar();
                }).catch(() => {});
            }
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', aplicar);
                window.visualViewport.addEventListener('scroll', aplicar);
            }
            window.addEventListener('resize', aplicar);
            aplicar();
        }

        function overlayActiva(id) {
            const el = document.getElementById(id);
            return !!(el && el.classList.contains('active'));
        }

        function hayRetrocesoIOS() {
            if (!prefsIosAdapt) return false;
            if (document.querySelector('.modal-overlay.active')) return true;
            if (viewingUserId) return true;
            return false;
        }

        function actualizarBotonAtrasIOS() {
            const btn = document.getElementById('ios-back-btn');
            if (!btn) return;
            btn.classList.toggle('is-visible', hayRetrocesoIOS());
        }

        function zIndexOverlayConocido(el) {
            if (!el || !el.id) return 30000;
            const mapa = {
                'settings-modal': 30000,
                'add-habit-modal': 30000,
                'add-wish-modal': 30000,
                'explore-modal': 30000,
                'habit-ficha-modal': 30000,
                'social-modal': 30000,
                'theme-modal': 20010,
                'backgrounds-modal': 20010,
                'edit-profile-modal': 20010,
                'configure-habit-modal': 30100,
                'configure-wish-modal': 30100,
                'edit-habit-modal': 30100,
                'complete-modal': 30200,
                'complete-wish-modal': 30200,
                'awake-pick-overlay': 31000,
                'detail-modal': 32000,
                'lightbox': 33000,
                'crop-modal': 20020,
                'sello-timer-overlay': 30500,
                'dia-sellado-overlay': 30500,
                'permisos-ritual-modal': 30500,
                'direct-chat-modal': 30850
            };
            if (mapa[el.id] != null) return mapa[el.id];
            const inline = parseInt(el.style.zIndex, 10);
            return isNaN(inline) ? 30000 : inline;
        }

        function overlayFullscreenActivosOrdenados() {
            const capas = Array.from(document.querySelectorAll('.modal-overlay.full-screen.active'));
            const auth = document.getElementById('auth-modal');
            if (auth && auth.classList.contains('active') && capas.every(x => x.id !== 'auth-modal')) capas.push(auth);
            return capas
                .map(el => ({ el, z: zIndexOverlayConocido(el) }))
                .sort((a, b) => a.z - b.z || 0)
                .map(x => x.el);
        }

        let capasFondoSyncLock = false;
        let capasFondoRaf = 0;
        let capasFondoPendiente = false;
        function sincronizarCapaFondoCompleta() {
            if (capasFondoSyncLock) {
                capasFondoPendiente = true;
                return;
            }
            capasFondoSyncLock = true;
            capasFondoPendiente = false;
            try {
                const abiertos = overlayFullscreenActivosOrdenados();
                const abierta = abiertos.length > 0;
                const top = abierta ? abiertos[abiertos.length - 1] : null;
                document.body.classList.toggle('pantalla-singularidad', abierta);
                document.querySelectorAll('.modal-overlay.full-screen').forEach(el => {
                    const debeUnderlay = !!(top && el.classList.contains('active') && el !== top);
                    if (el.classList.contains('is-underlay') === debeUnderlay) return;
                    el.classList.toggle('is-underlay', debeUnderlay);
                });
                if (abierta && !fondoForzadoOverlay) {
                    fondoForzadoOverlay = true;
                    if (activeBackground !== 2) initActiveBackgroundEngine();
                } else if (!abierta && fondoForzadoOverlay) {
                    fondoForzadoOverlay = false;
                    if (activeBackground !== 2) initActiveBackgroundEngine();
                }
                actualizarBotonAtrasIOS();
            } finally {
                // Liberar en el siguiente tick para ignorar mutaciones provocadas por este sync.
                setTimeout(() => {
                    capasFondoSyncLock = false;
                    if (capasFondoPendiente) programarSyncCapaFondo();
                }, 0);
            }
        }

        function programarSyncCapaFondo() {
            if (capasFondoSyncLock) {
                capasFondoPendiente = true;
                return;
            }
            if (capasFondoRaf) return;
            capasFondoRaf = requestAnimationFrame(() => {
                capasFondoRaf = 0;
                sincronizarCapaFondoCompleta();
            });
        }

        function iniciarObservadorCapasVisuales() {
            if (window._awakeCapasObs) return;
            window._awakeCapasObs = true;
            const obs = new MutationObserver(() => programarSyncCapaFondo());
            document.querySelectorAll('.modal-overlay').forEach(el => {
                obs.observe(el, { attributes: true, attributeFilter: ['class'] });
            });
            sincronizarCapaFondoCompleta();
        }

        function apilarRetornoNavegacion() {
            let capa = null;
            if (overlayActiva('explore-modal')) capa = { kind: 'overlay', id: 'explore-modal' };
            else if (overlayActiva('social-modal')) {
                capa = {
                    kind: 'overlay',
                    id: 'social-modal',
                    tab: currentActiveSocialTab,
                    profileId: viewingUserId || (currentUser && currentUser.id) || null
                };
            } else if (overlayActiva('detail-modal')) capa = { kind: 'overlay', id: 'detail-modal' };
            else if (viewingUserId) capa = { kind: 'profile', userId: viewingUserId };
            if (!capa) return;
            navReturnStack.push(capa);
            if (navReturnStack.length > 16) navReturnStack.shift();
        }

        async function restaurarCapaRetorno(prev) {
            if (!prev) return;
            if (prev.kind === 'profile' && prev.userId) {
                await visitarPerfilSupabase(prev.userId, { skipNavSnapshot: true });
                return;
            }
            if (prev.kind !== 'overlay') return;
            if (prev.profileId && currentUser && prev.profileId !== currentUser.id) {
                await visitarPerfilSupabase(prev.profileId, { skipNavSnapshot: true });
            } else if (viewingUserId) {
                volverAMiPerfil();
            }
            const el = document.getElementById(prev.id);
            if (el) el.classList.add('active');
            if (prev.id === 'social-modal' && prev.tab) cambiarSocialTab(prev.tab);
        }

        function cerrarMenusAbiertos() {
            let cerro = false;
            const hijoAjustesAbierto = overlayActiva('theme-modal') || overlayActiva('backgrounds-modal') || overlayActiva('edit-profile-modal') || overlayActiva('crop-modal') || overlayActiva('awake-pick-overlay');
            const hamburger = document.getElementById('settings-modal');
            if (hamburger && hamburger.classList.contains('active') && !hijoAjustesAbierto) {
                setMenuHamburguesaAbierto(false);
                cerro = true;
            }
            document.querySelectorAll('.habit-context-menu.active').forEach(m => {
                m.classList.remove('active');
                cerro = true;
            });
            document.querySelectorAll('.custom-dropdown-list.active').forEach(l => {
                l.classList.remove('active');
                cerro = true;
            });
            return cerro;
        }

        function cerrarTecladoVirtual() {
            const ae = document.activeElement;
            if (!ae) return false;
            const tag = ae.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable) {
                ae.blur();
                if (esPlataformaIOS()) {
                    const Keyboard = capacitorPlugin('Keyboard');
                    if (Keyboard && Keyboard.hide) Keyboard.hide().catch(() => {});
                }
                return true;
            }
            return false;
        }

        function cerrarCapaModal(modal) {
            if (!modal) return false;
            const id = modal.id;
            if (id === 'awake-pick-overlay') {
                cerrarAwakePick();
                return true;
            }
            if (id === 'add-wish-modal') {
                cerrarModalCrearDeseo();
                return true;
            }
            if (id === 'configure-habit-modal') {
                document.getElementById('configure-habit-modal').classList.remove('active');
                return true;
            }
            if (id === 'configure-wish-modal') {
                cerrarConfigurarDeseo();
                return true;
            }
            if (id === 'onboarding-modal') {
                saltarOnboarding();
                return true;
            }
            if (id === 'direct-chat-modal') {
                cerrarChatDirecto();
                return true;
            }
            if (id === 'add-habit-modal') {
                cerrarOVolverModalHabito();
                return true;
            }
            if (id === 'crop-modal') {
                cerrarModalRecorte();
                return true;
            }
            if (id === 'confirm-modal') {
                cerrarModalConfirmacion();
                return true;
            }
            if (id === 'complete-modal') {
                cerrarModalCompletar();
                return true;
            }
            if (id === 'complete-wish-modal') {
                cerrarModalCompletarDeseo();
                return true;
            }
            if (id === 'detail-modal') {
                cerrarFeedPublicaciones();
                return true;
            }
            if (id === 'explore-modal') {
                const search = document.getElementById('explore-search-input');
                const results = document.getElementById('explore-search-results');
                const activity = document.getElementById('explore-activity-block');
                if (search && search.value.trim()) {
                    search.value = '';
                    if (results) {
                        results.style.display = 'none';
                        results.innerHTML = '';
                    }
                    if (activity) activity.style.display = '';
                    return true;
                }
            }
            if (id === 'habit-ficha-modal') {
                cerrarFichaHabito();
                return true;
            }
            if (id === 'sello-timer-overlay') {
                cerrarSelloTimer();
                return true;
            }
            if (id === 'dia-sellado-overlay') {
                cerrarHojaDiaSellado();
                return true;
            }
            if (id === 'permisos-ritual-modal') {
                cerrarGuiaPermisosRitual();
                return true;
            }
            if (id === 'badge-detail-modal') {
                cerrarModalInsignia3D();
                return true;
            }
            if (id === 'theme-modal' || id === 'backgrounds-modal' || id === 'edit-profile-modal') {
                modal.classList.remove('active');
                volverAjustesSiPendiente();
                return true;
            }
            modal.classList.remove('active');
            return true;
        }

        function cerrarFeedPublicaciones() {
            const modal = document.getElementById('detail-modal');
            if (modal) modal.classList.remove('active');
            const container = document.getElementById('ig-feed-scroll-container');
            if (container) container.innerHTML = '';
        }

        async function salirDePerfilVisitado() {
            const prev = navReturnStack.pop();
            if (prev) {
                await restaurarCapaRetorno(prev);
                return;
            }
            volverAMiPerfil();
        }

        async function minimizarOSalirApp() {
            if (esPlataformaIOS()) return;
            const App = capacitorPlugin('App');
            if (!App) return;
            try {
                if (App.minimizeApp) await App.minimizeApp();
                else if (App.exitApp) await App.exitApp();
            } catch (e) {
                try { if (App.exitApp) await App.exitApp(); } catch (e2) {}
            }
        }

        async function manejarAtrasApp() {
            if (chatRecording || chatMicStarting || chatRecordLocked) {
                detenerGrabacionAudioChat(true);
                return true;
            }
            if (ocultarAvisoRacha()) return true;
            if (cerrarMenusAbiertos()) return true;
            if (cerrarTecladoVirtual()) return true;

            const TOP_DIALOGS = ['awake-pick-overlay', 'lightbox', 'confirm-modal', 'crop-modal', 'direct-chat-modal', 'detail-modal', 'dia-sellado-overlay', 'sello-timer-overlay', 'permisos-ritual-modal', 'complete-modal', 'complete-wish-modal', 'add-wish-modal', 'configure-wish-modal', 'configure-habit-modal', 'add-habit-modal', 'auth-modal', 'theme-modal', 'backgrounds-modal', 'edit-profile-modal', 'edit-habit-modal', 'habit-ficha-modal', 'settings-modal'];
            let superior = null;
            for (let i = 0; i < TOP_DIALOGS.length; i++) {
                const el = document.getElementById(TOP_DIALOGS[i]);
                if (el && el.classList.contains('active')) {
                    superior = el;
                    break;
                }
            }
            if (!superior) {
                const abiertos = document.querySelectorAll('.modal-overlay.active');
                if (abiertos.length) superior = abiertos[abiertos.length - 1];
            }
            if (superior) return cerrarCapaModal(superior);

            if (viewingUserId) {
                await salirDePerfilVisitado();
                return true;
            }

            if (typeof currentIndex === 'number' && currentIndex !== 0) {
                cambiarTab(0);
                return true;
            }

            await minimizarOSalirApp();
            return esAppNativa();
        }

        function iniciarNavegacionAtras() {
            const bindNative = () => {
                if (window._awakeBackBound) return;
                const App = capacitorPlugin('App');
                if (!App || !App.addListener) return;
                window._awakeBackBound = true;
                App.addListener('backButton', () => {
                    manejarAtrasApp();
                });
            };
            bindNative();
            if (!window._awakeBackBound) {
                setTimeout(bindNative, 300);
                setTimeout(bindNative, 1200);
            }
            window.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (e.defaultPrevented) return;
                manejarAtrasApp();
            });
            // Navegación por teclado de las pestañas (patrón tablist ARIA):
            // flechas ←/→ mueven el foco y activan la pestaña; Home/End saltan.
            window.addEventListener('keydown', (e) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                const tab = e.target && e.target.closest ? e.target.closest('.horizontal-tabs .tab-item, .profile-subtab') : null;
                if (!tab) return;
                const contenedor = tab.closest('.horizontal-tabs') || tab.closest('.profile-subtabs-row');
                if (!contenedor) return;
                const items = [...contenedor.querySelectorAll('[role="tab"]')];
                if (!items.length) return;
                const actual = items.indexOf(tab);
                let sig = actual;
                if (e.key === 'ArrowRight') sig = (actual + 1) % items.length;
                else if (e.key === 'ArrowLeft') sig = (actual - 1 + items.length) % items.length;
                else if (e.key === 'Home') sig = 0;
                else if (e.key === 'End') sig = items.length - 1;
                e.preventDefault();
                items[sig].click();
                items[sig].focus();
            });
            iniciarGestoAtrasBorde();
        }

        function iniciarGestoAtrasBorde() {
            if (window._awakeEdgeBackBound) return;
            window._awakeEdgeBackBound = true;
            let startX = 0;
            let startY = 0;
            let tracking = false;
            window.addEventListener('touchstart', (e) => {
                const t = e.touches && e.touches[0];
                if (!t) return;
                const margen = esPlataformaIOS() ? 36 : 24;
                if (t.clientX > margen) return;
                if (!document.querySelector('.modal-overlay.active') && !viewingUserId) return;
                tracking = true;
                startX = t.clientX;
                startY = t.clientY;
            }, { passive: true });
            window.addEventListener('touchend', (e) => {
                if (!tracking) return;
                tracking = false;
                const t = e.changedTouches && e.changedTouches[0];
                if (!t) return;
                const dx = t.clientX - startX;
                const dy = Math.abs(t.clientY - startY);
                if (dx > 72 && dy < 64) manejarAtrasApp();
            }, { passive: true });
        }

        function idNotificacionLocal(tag) {
            const s = String(tag || Date.now());
            let h = 0;
            for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
            return Math.abs(h % 2147483646) + 1;
        }

        function extraDesdeEventoNotificacion(ev) {
            const n = (ev && (ev.notification || ev)) || {};
            const extra = n.extra || n.data || (ev && ev.notification && ev.notification.data) || {};
            return extra || {};
        }

        function abrirChatDesdeNotificacion(data) {
            const senderId = data && (data.senderId || data.sender_id);
            if (!senderId) return;
            const payload = {
                senderId: String(senderId),
                senderName: data.senderName || data.sender_name || 'Usuario',
                senderAvatar: data.senderAvatar || data.sender_avatar || null
            };
            if (!currentUser) {
                pendingChatOpenFromNotif = payload;
                abrirModalAuth();
                return;
            }
            abrirChatConUsuario(payload.senderId, payload.senderName, payload.senderAvatar);
        }

        function consumirChatDesdeUrlWeb() {
            try {
                const params = new URLSearchParams(window.location.search);
                const chatId = params.get('chat');
                if (!chatId) return;
                abrirChatDesdeNotificacion({ type: 'message', senderId: chatId });
                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('chat');
                    const q = url.searchParams.toString();
                    window.history.replaceState({}, '', url.pathname + (q ? '?' + q : '') + url.hash);
                }
            } catch (e) {}
        }

        function consumirChatPendienteDeNotificacion() {
            if (!pendingChatOpenFromNotif || !currentUser) return;
            const payload = pendingChatOpenFromNotif;
            pendingChatOpenFromNotif = null;
            setTimeout(() => abrirChatDesdeNotificacion(payload), 250);
        }

        async function asegurarCanalNotificaciones() {
            const channel = {
                id: 'awake-messages',
                name: 'Mensajes',
                description: 'Mensajes directos y recordatorios',
                importance: 5,
                visibility: 1,
                vibration: true,
                sound: 'default'
            };
            const local = capacitorPlugin('LocalNotifications');
            const push = capacitorPlugin('PushNotifications');
            try { if (local && local.createChannel) await local.createChannel(channel); } catch (e) {}
            try { if (push && push.createChannel) await push.createChannel(channel); } catch (e) {}
        }

        async function enlazarListenersNotificacionesNativas() {
            if (nativeNotifListenersBound) return;
            const local = capacitorPlugin('LocalNotifications');
            const push = capacitorPlugin('PushNotifications');
            if (!local && !push) return;
            nativeNotifListenersBound = true;

            if (local && local.addListener) {
                local.addListener('localNotificationActionPerformed', (ev) => {
                    abrirChatDesdeNotificacion(extraDesdeEventoNotificacion(ev));
                });
            }
            if (push && push.addListener) {
                push.addListener('registration', (token) => {
                    pendingFcmToken = token && token.value;
                    nativePushReady = !!pendingFcmToken;
                    registrarTokenPushEnServidor();
                });
                push.addListener('registrationError', (err) => {
                    console.error('Error al registrar push:', err);
                });
                push.addListener('pushNotificationActionPerformed', (ev) => {
                    abrirChatDesdeNotificacion(extraDesdeEventoNotificacion(ev));
                });
            }
        }

        async function registrarTokenPushEnServidor() {
            if (!currentUser || !pendingFcmToken) return;
            const { error } = await supabaseClient.from('device_tokens').upsert({
                token: pendingFcmToken,
                user_id: currentUser.id,
                platform: plataformaNativaId(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'token' });
            if (error) console.warn('No se pudo guardar el token de notificaciones:', error.message);
        }

        async function borrarTokenPushEnServidor() {
            if (!pendingFcmToken) return;
            try {
                await supabaseClient.from('device_tokens').delete().eq('token', pendingFcmToken);
            } catch (e) {}
        }

        async function notificarPushAlDestinatario({ receiverId, senderId, senderName, preview, messageId }) {
            if (!receiverId || !currentUser) return;
            try {
                await supabaseClient.functions.invoke('notify-message', {
                    body: {
                        receiver_id: receiverId,
                        sender_id: senderId,
                        sender_name: recortarTexto(senderName || 'Usuario', AWAKE_LIMITE_NICK),
                        body: recortarTexto(preview || 'Nuevo mensaje', 140),
                        message_id: messageId || null
                    }
                });
            } catch (e) {
                console.warn('No se pudo enviar el aviso push:', e);
            }
        }

        async function solicitarPermisoNotificaciones() {
            await enlazarListenersNotificacionesNativas();
            if (esAppNativa()) {
                const local = capacitorPlugin('LocalNotifications');
                const push = capacitorPlugin('PushNotifications');
                try {
                    if (local && local.requestPermissions) await local.requestPermissions();
                    if (push && push.requestPermissions && push.register) {
                        const perm = await push.requestPermissions();
                        if (perm && perm.receive === 'granted') {
                            await asegurarCanalNotificaciones();
                            try {
                                await push.register();
                            } catch (regErr) {
                                console.warn('Push nativo no inicializado:', regErr);
                            }
                        }
                    } else {
                        await asegurarCanalNotificaciones();
                    }
                } catch (e) {
                    console.error('No se pudo solicitar permiso de notificaciones nativas:', e);
                }
            }
            await solicitarPermisoNotificacionesWeb();
        }

        function notificacionesWebDisponibles() {
            return !esAppNativa() && typeof Notification !== 'undefined';
        }

        async function solicitarPermisoNotificacionesWeb() {
            if (!notificacionesWebDisponibles()) return null;
            if (Notification.permission !== 'default') return Notification.permission;
            try {
                return await Notification.requestPermission();
            } catch (e) {
                return Notification.permission;
            }
        }

        function inicializarPermisoNotificacionesWeb() {
            if (!notificacionesWebDisponibles()) return;
            if (Notification.permission !== 'default') return;
            const pedir = () => {
                solicitarPermisoNotificacionesWeb();
            };
            window.addEventListener('pointerdown', pedir, { once: true, passive: true });
            window.addEventListener('keydown', pedir, { once: true });
        }

        function iconoNotificacionWeb() {
            try {
                return new URL('icon.png', window.location.href).href;
            } catch (e) {
                return 'icon.png';
            }
        }

        async function lanzarNotificacionWeb(title, body, options) {
            if (!notificacionesWebDisponibles()) return;
            if (Notification.permission === 'default') await solicitarPermisoNotificacionesWeb();
            if (Notification.permission !== 'granted') return;
            const payload = {
                body: body || '',
                tag: options.tag || `awake-${Date.now()}`,
                icon: iconoNotificacionWeb(),
                badge: iconoNotificacionWeb(),
                data: options.data || {},
                renotify: true
            };
            try {
                if (navigator.serviceWorker) {
                    const reg = await navigator.serviceWorker.ready;
                    if (reg && reg.showNotification) {
                        await reg.showNotification(title || 'AWAKE', payload);
                        return;
                    }
                }
            } catch (e) {}
            try {
                const n = new Notification(title || 'AWAKE', payload);
                n.onclick = function() {
                    window.focus();
                    const data = this.data || {};
                    if (data.type === 'message' && data.senderId) abrirChatDesdeNotificacion(data);
                    this.close();
                };
            } catch (e) {
                console.error('Error al lanzar notificación web:', e);
            }
        }

        async function lanzarNotificacionSistema(title, body, options = {}) {
            const data = options.data || {};
            const tag = options.tag || `awake-${Date.now()}`;
            const appVisible = document.visibilityState === 'visible';
            if (!appVisible && nativePushReady && data.type === 'message') return;

            if (esAppNativa()) {
                const local = capacitorPlugin('LocalNotifications');
                if (local && local.schedule) {
                    try {
                        await local.schedule({
                            notifications: [{
                                id: idNotificacionLocal(tag),
                                title: title || 'AWAKE',
                                body: body || '',
                                channelId: 'awake-messages',
                                extra: data,
                                autoCancel: true
                            }]
                        });
                        return;
                    } catch (e) {
                        console.error('Error al lanzar notificación nativa:', e);
                    }
                }
            }

            await lanzarNotificacionWeb(title, body, { tag, data });
        }

        function mostrarNotificacionMensaje(newMsg) {
            const cached = (window.cachePerfilesSocial && window.cachePerfilesSocial[newMsg.sender_id]) || {};
            const senderName = cached.name || 'Nuevo mensaje';
            lanzarNotificacionSistema(`AWAKE · ${senderName}`, previewTextoChat(newMsg.text), {
                tag: `msg-${newMsg.id || Date.now()}`,
                data: {
                    type: 'message',
                    senderId: newMsg.sender_id,
                    senderName: senderName,
                    senderAvatar: cached.avatar || null
                }
            });
        }

        function minutosDesdeMedianoche(hhmm) {
            const [h, m] = hhmm.split(':').map(Number);
            return h * 60 + m;
        }

        function horasRecordatorioHabito(h) {
            const start = normalizarHoraHHMM(h.startTime || '08:00');
            if (!start) return [];
            const times = [start];
            const intervalH = parseInt(h.reminderInterval, 10);
            if (intervalH > 0) {
                let mins = minutosDesdeMedianoche(start) + intervalH * 60;
                while (mins < 24 * 60) {
                    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
                    const mm = String(mins % 60).padStart(2, '0');
                    times.push(`${hh}:${mm}`);
                    mins += intervalH * 60;
                }
            }
            return times;
        }

        function proximoInstanteRecordatorio(h, desde) {
            if (!h || !h.reminderActive || h.enDescanso || habitEsArchivado(h)) return null;
            const times = horasRecordatorioHabito(h);
            if (!times.length) return null;
            const dias = (h.dias && h.dias.length) ? h.dias : [0, 1, 2, 3, 4, 5, 6];
            const now = desde || new Date();
            for (let i = 0; i < 8; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
                if (!dias.includes(d.getDay())) continue;
                for (let t = 0; t < times.length; t++) {
                    const [hh, mm] = times[t].split(':').map(Number);
                    const inst = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
                    if (inst > now) return inst;
                }
            }
            return null;
        }

        function formatearCuentaAtras(ms) {
            const total = Math.max(0, Math.floor(ms / 1000));
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = total % 60;
            return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`;
        }

        function htmlCuentaAtrasHabito(habitIndex, hastaMs, size) {
            const s = size || 18;
            const hasta = hastaMs instanceof Date ? hastaMs.getTime() : Number(hastaMs);
            if (!hasta) return '';
            return `<div class="habit-countdown" data-habit-index="${habitIndex}" data-hasta="${hasta}"><svg class="habit-hourglass" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M17 22v-4.17A5 5 0 0 0 14.83 14L12 12l-2.83 2A5 5 0 0 0 7 17.83V22"/><path d="M7 2v4.17A5 5 0 0 0 9.17 10L12 12l2.83-2A5 5 0 0 0 17 6.17V2"/></svg><span class="habit-countdown-t">${formatearCuentaAtras(hasta - Date.now())}</span></div>`;
        }

        function actualizarCuentasAtrasHabitos() {
            const nodes = document.querySelectorAll('.habit-countdown[data-hasta]');
            if (!nodes.length) return;
            const now = Date.now();
            nodes.forEach(el => {
                const hasta = Number(el.dataset.hasta);
                if (!hasta) return;
                const t = el.querySelector('.habit-countdown-t');
                let left = hasta - now;
                if (left <= 0) {
                    const idx = Number(el.dataset.habitIndex);
                    const next = proximoInstanteRecordatorio(misHabitos[idx]);
                    if (!next) {
                        el.remove();
                        return;
                    }
                    el.dataset.hasta = String(next.getTime());
                    left = next.getTime() - Date.now();
                }
                if (t) t.textContent = formatearCuentaAtras(left);
            });
        }

        function verificarRecordatoriosHabitos() {
            const now = new Date();
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const dateKey = now.toLocaleDateString();
            const todayDay = now.getDay();

            (misHabitos || []).forEach(h => {
                if (!h || !h.reminderActive || h.enDescanso || habitEsArchivado(h)) return;
                if (h.dias && h.dias.length && !h.dias.includes(todayDay)) return;
                if (habitEsUnaVez(h) && !habitProgramadoEnFecha(h, now)) return;
                const times = horasRecordatorioHabito(h);
                if (!times.includes(hhmm)) return;
                const key = `${h.id || h.nombre}|${dateKey}|${hhmm}`;
                if (habitReminderFiredKeys.has(key)) return;
                habitReminderFiredKeys.add(key);
                lanzarNotificacionSistema('AWAKE · Recordatorio', `Es hora de: ${h.nombre}`, {
                    tag: key
                });
            });

            // Racha en riesgo (web/PWA): ventana de 60 min tras la hora fijada, solo si quedan sellos hoy
            if (!esAppNativa() && ritualPrefs.riesgoActivo) {
                const horaRiesgo = normalizarHoraHHMM(ritualPrefs.horaRiesgo, '18:00');
                const minNow = minutosDesdeMedianoche(hhmm);
                const minRisk = minutosDesdeMedianoche(horaRiesgo);
                if (minNow >= minRisk && minNow < minRisk + 60) {
                    const pendientesRiesgo = agendaItemsFecha(now, 'TODOS').filter(i => !i.done);
                    const keyRiesgo = `risk|${dateKey}`;
                    if (pendientesRiesgo.length && !habitReminderFiredKeys.has(keyRiesgo)) {
                        habitReminderFiredKeys.add(keyRiesgo);
                        const nombresRiesgo = Array.from(new Set(pendientesRiesgo.map(i => cleanHabitName(i.h.nombre || '')))).slice(0, 2).join(', ');
                        lanzarNotificacionSistema('AWAKE · Racha en riesgo',
                            mensajeRachaEnRiesgo(pendientesRiesgo.length, nombresRiesgo),
                            { tag: keyRiesgo });
                    }
                }
            }

            // Resumen semanal (web/PWA): domingo, ventana de 60 min tras la hora fijada
            if (!esAppNativa() && ritualPrefs.resumenActivo && todayDay === 0) {
                const horaResumen = normalizarHoraHHMM(ritualPrefs.horaResumen, '20:00');
                const minNow2 = minutosDesdeMedianoche(hhmm);
                const minSum = minutosDesdeMedianoche(horaResumen);
                if (minNow2 >= minSum && minNow2 < minSum + 60) {
                    const keyResumen = `summary|${inicioSemanaPreferida(now).toDateString()}`;
                    if (!habitReminderFiredKeys.has(keyResumen)) {
                        habitReminderFiredKeys.add(keyResumen);
                        const resumenSemana = resumenSemanaRitual();
                        lanzarNotificacionSistema('AWAKE · Resumen semanal',
                            mensajeResumenSemanal(resumenSemana.ok, resumenSemana.prog, resumenSemana.racha),
                            { tag: keyResumen });
                    }
                }
            }
        }

        function cancelarAvisoRiesgoHoySiProcede() {
            const local = capacitorPlugin('LocalNotifications');
            if (!local || !local.cancel) return;
            try {
                if (!diaAgendaCompleta(new Date())) return;
                local.cancel({ notifications: [{ id: idNotificacionLocal('streak-risk|' + new Date().toDateString()) }] });
            } catch (e) {}
        }

        function iniciarSistemaNotificaciones() {
            arrancarPermisoNotificacionesSiToca();
            verificarRecordatoriosHabitos();
            programarAlarmasNativasHabitos();
            arrancarIntervalosHabitos();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') verificarRecordatoriosHabitos();
            });
        }

        function proximasAlarmasHabito(hhmm, diasSemana, diasAdelante) {
            const norm = normalizarHoraHHMM(hhmm);
            if (!norm) return [];
            const [h, m] = norm.split(':').map(Number);
            const out = [];
            const now = new Date();
            for (let i = 0; i < diasAdelante; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
                if (d <= now) continue;
                if (diasSemana && diasSemana.length && !diasSemana.includes(d.getDay())) continue;
                out.push(d);
            }
            return out;
        }

        async function cancelarAlarmasNativasHabitos() {
            const local = capacitorPlugin('LocalNotifications');
            if (!local || !local.cancel) {
                nativeAlarmIds = [];
                return;
            }
            try {
                if (local.getPending) {
                    const pending = await local.getPending();
                    const toCancel = (pending.notifications || [])
                        .filter(n => n.extra && (n.extra.kind === 'habit-reminder' || n.extra.kind === 'night-summary' || n.extra.kind === 'streak-risk' || n.extra.kind === 'weekly-summary'))
                        .map(n => ({ id: n.id }));
                    if (toCancel.length) await local.cancel({ notifications: toCancel });
                }
            } catch (e) {}
            nativeAlarmIds = [];
        }

        async function programarAlarmasNativasHabitos() {
            const local = capacitorPlugin('LocalNotifications');
            if (!local || !local.schedule) return;
            try { await asegurarCanalNotificaciones(); } catch (e) {}
            await cancelarAlarmasNativasHabitos();

            const notifications = [];
            (misHabitos || []).forEach(h => {
                if (!h || !h.reminderActive || h.enDescanso || habitEsArchivado(h)) return;
                const times = horasRecordatorioHabito(h);
                times.forEach(hhmm => {
                    proximasAlarmasHabito(hhmm, h.dias, 10).forEach(at => {
                        if (notifications.length >= 56) return;
                        const tag = `habit|${h.id || h.nombre}|${at.toISOString()}`;
                        notifications.push({
                            id: idNotificacionLocal(tag),
                            title: 'AWAKE · Recordatorio',
                            body: `Es hora de: ${cleanHabitName(h.nombre)}`,
                            channelId: 'awake-messages',
                            schedule: { at, allowWhileIdle: true },
                            extra: { kind: 'habit-reminder', habitName: h.nombre },
                            autoCancel: true
                        });
                    });
                });
            });

            const digestos = [
                { on: ritualPrefs.digestManana, hora: ritualPrefs.horaManana || '08:00', kind: 'digest-manana', title: 'AWAKE · Mañana', body: 'Toca sellar lo que queda de la mañana.', filtro: 'MAÑANA' },
                { on: ritualPrefs.digestTarde, hora: ritualPrefs.horaTarde || '15:00', kind: 'digest-tarde', title: 'AWAKE · Tarde', body: 'Revisa el ritual de la tarde.', filtro: 'TARDE' },
                { on: ritualPrefs.digestNoche, hora: ritualPrefs.horaNoche || '21:30', kind: 'digest-noche', title: 'AWAKE · Noche', body: 'Cierra el día: sella lo que quede.', filtro: 'NOCHE' }
            ];
            digestos.forEach(dg => {
                if (!dg.on) return;
                proximasAlarmasHabito(dg.hora, [0, 1, 2, 3, 4, 5, 6], 8).forEach(at => {
                    if (notifications.length >= 64) return;
                    const items = agendaItemsFecha(at, dg.filtro);
                    const pending = items.filter(i => !i.done).length;
                    const body = pending > 0
                        ? `Tienes ${pending} sello${pending === 1 ? '' : 's'} por ${dg.filtro === 'MAÑANA' ? 'la mañana' : (dg.filtro === 'TARDE' ? 'la tarde' : 'la noche')}.`
                        : dg.body;
                    notifications.push({
                        id: idNotificacionLocal(`${dg.kind}|${at.toDateString()}`),
                        title: dg.title,
                        body,
                        channelId: 'awake-messages',
                        schedule: { at, allowWhileIdle: true },
                        extra: { kind: dg.kind },
                        autoCancel: true
                    });
                });
            });

            // Racha en riesgo: aviso diario si quedan sellos del día sin cerrar
            if (ritualPrefs.riesgoActivo) {
                const horaRiesgo = ritualPrefs.horaRiesgo || '18:00';
                proximasAlarmasHabito(horaRiesgo, [0, 1, 2, 3, 4, 5, 6], 8).forEach(at => {
                    if (notifications.length >= 72) return;
                    const itemsRiesgo = agendaItemsFecha(at, 'TODOS').filter(i => !i.done);
                    if (!itemsRiesgo.length) return;
                    const nombresRiesgo = Array.from(new Set(itemsRiesgo.map(i => cleanHabitName(i.h.nombre || '')))).slice(0, 2).join(', ');
                    const bodyRiesgo = mensajeRachaEnRiesgo(itemsRiesgo.length, nombresRiesgo);
                    notifications.push({
                        id: idNotificacionLocal(`streak-risk|${at.toDateString()}`),
                        title: 'AWAKE · Racha en riesgo',
                        body: bodyRiesgo,
                        channelId: 'awake-messages',
                        schedule: { at, allowWhileIdle: true },
                        extra: { kind: 'streak-risk' },
                        autoCancel: true
                    });
                });
            }

            // Resumen semanal: domingo, con lo sellado de la semana
            if (ritualPrefs.resumenActivo) {
                const horaResumen = ritualPrefs.horaResumen || '20:00';
                proximasAlarmasHabito(horaResumen, [0], 8).forEach(at => {
                    if (notifications.length >= 72) return;
                    const resumen = resumenSemanaRitual();
                    const bodyResumen = mensajeResumenSemanal(resumen.ok, resumen.prog, resumen.racha);
                    notifications.push({
                        id: idNotificacionLocal(`weekly-summary|${at.toDateString()}`),
                        title: 'AWAKE · Resumen semanal',
                        body: bodyResumen,
                        channelId: 'awake-messages',
                        schedule: { at, allowWhileIdle: true },
                        extra: { kind: 'weekly-summary' },
                        autoCancel: true
                    });
                });
            }

            nativeAlarmIds = notifications.map(n => n.id);
            if (!notifications.length) return;
            try {
                await local.schedule({ notifications });
            } catch (e) {
                console.warn('No se pudieron programar alarmas nativas:', e);
            }
        }

        async function abrirModalExplorar() {
            const searchInput = document.getElementById('explore-search-input');
            const resultsDiv = document.getElementById('explore-search-results');
            const activity = document.getElementById('explore-activity-block');
            if (searchInput) searchInput.value = '';
            if (resultsDiv) {
                resultsDiv.style.display = 'none';
                resultsDiv.innerHTML = '';
            }
            if (activity) activity.style.display = '';
            await precargarDatosSocialesGlobalesOptimizado();
            renderizarGridExplorar();
            document.getElementById('explore-modal').classList.add('active');
        }

        function renderizarGridExplorar() {
            renderizarFeedActividad(document.getElementById('explore-posts-grid'));
        }

        function renderizarFeedActividad(container) {
            if (!container) return;
            container.innerHTML = '';

            let todasLasPubs = [];

            Object.values(historialAgrupado).forEach(ejecuciones => {
                ejecuciones.forEach(ej => {
                    const cleanHName = cleanHabitName(ej.nombre);
                    const imgVal = srcImagenHabito((ej.imagenes && ej.imagenes[0]) || ej.image_url);
                    // Un registro sin cuenta (invitado, user_id null) se queda SOLO en
                    // Historial → Registros: jamás entra en el feed social (ACTIVIDAD),
                    // aunque tenga foto (ver B-48/B-50).
                    if (imgVal && esSelloVisibleEnRed(ej) && !!ej.user_id) {
                        todasLasPubs.push({
                            id: ej.id,
                            user_id: ej.user_id || (currentUser ? currentUser.id : null),
                            nombre: cleanHName,
                            fecha: ej.fecha,
                            dateObj: ej.dateObj ? new Date(ej.dateObj) : new Date(0),
                            texto: ej.texto,
                            score: ej.score,
                            imgUrl: imgVal,
                            privacidad: ej.privacidad,
                            likes: ej.likes || 0,
                            likedByMe: ej.likedByMe || false,
                            comentarios: ej.comentarios || [],
                            owner: document.getElementById('display-nickname').textContent,
                            avatar: window.userHasAvatar ? document.getElementById('avatar-img').src : null
                        });
                    }
                });
            });

            if (window.cachePerfilesSocial) {
                Object.values(window.cachePerfilesSocial).forEach(uObj => {
                    if (puedeVerHistorialCuenta(uObj.accountPrivacy, uObj.isFollowing)) {
                        Object.values(uObj.historialAgrupado).forEach(ejecuciones => {
                            ejecuciones.forEach(ej => {
                                const cleanHName = cleanHabitName(ej.nombre);
                                const imgVal = srcImagenHabito((ej.imagenes && ej.imagenes[0]) || ej.image_url);
                                if (esSelloVisibleEnRed(ej) && imgVal) {
                                    todasLasPubs.push({
                                        id: ej.id,
                                        user_id: ej.user_id,
                                        nombre: cleanHName,
                                        fecha: ej.fecha,
                                        dateObj: ej.dateObj ? new Date(ej.dateObj) : new Date(0),
                                        texto: ej.texto,
                                        score: ej.score,
                                        imgUrl: imgVal,
                                        privacidad: ej.privacidad,
                                        likes: ej.likes || 0,
                                        likedByMe: ej.likedByMe || false,
                                        comentarios: ej.comentarios || [],
                                        owner: uObj.name,
                                        avatar: uObj.avatar
                                    });
                                }
                            });
                        });
                    }
                });
            }

            todasLasPubs.sort((a, b) => b.dateObj - a.dateObj);
            const unicas = deduplicarPostsFeed(todasLasPubs);
            registrarPubsEnMapa(unicas);

            if (unicas.length === 0) {
                container.innerHTML = htmlEstadoVacio({
                    title: 'Sin actividad',
                    text: 'Cuando alguien selle el día con foto, aparecerá aquí.',
                    icon: ICONO_VACIO_FOTO
                });
                return;
            }

            unicas.forEach(pub => {
                const hora = horaCortaDeFecha(pub.dateObj);
                const esMia = !pub.user_id || (currentUser && pub.user_id === currentUser.id);
                const racha = esMia && pub.nombre ? calcularRachaHastaFecha(pub.nombre, pub.dateObj || new Date()) : 0;
                const esHoy = claveDiaLocal(pub.dateObj) === claveDiaLocal(new Date());
                const rachaTxt = racha > 0 ? ` · ${racha}` : '';
                const thumb = document.createElement('div');
                thumb.className = 'history-thumb-card';
                thumb.innerHTML = `
                    <img src="${htmlImgSrc(pub.imgUrl)}" alt="Explorar">
                    <div class="thumb-info-overlay">
                        <span style="display:flex; align-items:center; gap:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">${htmlGlifoHabito(pub.nombre, 14)}<span>${escapeHtmlChat(tituloSelloPublicacion(pub))}${rachaTxt}</span></span>
                        <span class="thumb-ritual-time">${esHoy ? 'Hoy · ' : ''}${hora} · ${escapeHtmlChat(pub.owner || '')}</span>
                    </div>
                `;
                thumb.onclick = () => abrirFeedPublicacionesVertical(unicas, pub.id);
                container.appendChild(thumb);
            });
        }

        async function buscarUsuariosExplorar(query) {
            const resultsContainer = document.getElementById('explore-search-results');
            const activity = document.getElementById('explore-activity-block');
            if (!resultsContainer) return;
            const q = String(query || '').trim();
            if (exploreSearchTimer) {
                clearTimeout(exploreSearchTimer);
                exploreSearchTimer = null;
            }
            if (!q) {
                exploreSearchGen++;
                resultsContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
                if (activity) activity.style.display = '';
                return;
            }
            exploreSearchTimer = setTimeout(() => buscarUsuariosExplorarAhora(q), 280);
        }

        async function buscarUsuariosExplorarAhora(query) {
            const resultsContainer = document.getElementById('explore-search-results');
            const activity = document.getElementById('explore-activity-block');
            if (!resultsContainer) return;
            const q = recortarTexto(String(query || '').trim().replace(/[%_]/g, ''), 40);
            if (q.length < 2) {
                if (activity) activity.style.display = 'none';
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.78rem;">Escribe al menos 2 letras.</div>`;
                return;
            }

            const gen = ++exploreSearchGen;
            const { data: profiles, error } = await supabaseClient
                .from('profiles')
                .select('id, username, bio, avatar_url, account_privacy')
                .ilike('username', `%${q}%`)
                .limit(20);

            if (gen !== exploreSearchGen) return;

            if (activity) activity.style.display = 'none';

            if (error || !profiles || !profiles.length) {
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.78rem;">No se encontraron usuarios.</div>`;
                return;
            }

            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = '';
            
            profiles.forEach(p => {
                const isSelf = currentUser && p.id === currentUser.id;
                const isFollowing = misSeguidos.includes(p.id);

                const div = document.createElement('div');
                div.className = 'habit-card-inspired';
                div.innerHTML = `
                    <div class="habit-card-left" style="cursor: pointer;" onclick="visitarPerfilSupabase('${jsStrHtml(p.id)}')">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--platinum-sheen); border: 1px solid var(--border-metal); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                            ${p.avatar_url ? `<img src="${htmlImgSrc(p.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
                        </div>
                        <div class="habit-details">
                            <h4 style="font-size: 0.88rem; font-weight: 800;">${escapeHtmlChat(p.username || 'Anonymous')}</h4>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtmlChat(p.bio || 'Sin biografía')}</span>
                        </div>
                    </div>
                    ${isSelf ? '' : `<button type="button" class="ig-btn-action ${isFollowing ? 'ig-btn-solid' : ''}" style="flex: 0 0 auto; width: 105px; padding: 7px 10px; font-size: 0.75rem; ${isFollowing ? 'background: #059669 !important; border-color: #059669; color: #fff;' : ''}" onclick="toggleFollowFromList('${jsStrHtml(p.id)}', event)">${isFollowing ? 'Siguiendo' : 'Seguir'}</button>`}
                `;
                resultsContainer.appendChild(div);
            });
        }

        function poblarCustomDropdowns() {
            const dropdowns = [
                { listId: 'list-config-start', prefix: 'config-start', isInterval: false },
                { listId: 'list-config-interval', prefix: 'config-interval', isInterval: true },
                { listId: 'list-edit-start', prefix: 'edit-start', isInterval: false },
                { listId: 'list-edit-interval', prefix: 'edit-interval', isInterval: true }
            ];

            dropdowns.forEach(d => {
                const listEl = document.getElementById(d.listId);
                if (!listEl) return;
                listEl.innerHTML = '';
                const start = d.isInterval ? 1 : 0;
                const loopMax = d.isInterval ? 24 : 23;

                for (let i = start; i <= loopMax; i++) {
                    const horaStr = i < 10 ? `0${i}:00` : `${i}:00`;
                    const val = d.isInterval ? `${i}h` : horaStr;
                    const text = d.isInterval ? `Cada ${i} hora(s)` : `Hora: ${horaStr}`;
                    
                    const item = document.createElement('div');
                    item.className = 'custom-dropdown-item';
                    item.textContent = text;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        seleccionarOpcionDropdown(d.prefix, val, text);
                    };
                    listEl.appendChild(item);
                }
            });
        }

        function toggleCustomDropdown(dropdownId, event) {
            event.stopPropagation();
            document.querySelectorAll('.custom-dropdown-list').forEach(l => {
                if (l.id !== dropdownId.replace('dropdown-', 'list-')) {
                    l.classList.remove('active');
                }
            });
            const list = document.getElementById(dropdownId.replace('dropdown-', 'list-'));
            if (list) list.classList.toggle('active');
        }

        function seleccionarOpcionDropdown(prefix, value, displayText) {
            const labelEl = document.getElementById(`label-${prefix}`);
            const listEl = document.getElementById(`list-${prefix}`);
            if (labelEl) labelEl.textContent = displayText;
            if (listEl) listEl.classList.remove('active');

            if (prefix === 'config-start') configStartValue = value;
            if (prefix === 'config-interval') configIntervalValue = value;
            if (prefix === 'edit-start') editStartValue = value;
            if (prefix === 'edit-interval') editIntervalValue = value;
        }

        function alternarModoPersonalizado(prefix) {
            const dropdown = document.getElementById(`dropdown-${prefix}`);
            const customInput = document.getElementById(`${prefix}-custom`);
            const isCustom = customModes[prefix];

            if (!isCustom) {
                if (dropdown) dropdown.style.display = 'none';
                if (customInput) customInput.classList.remove('hidden');
                if (customInput) customInput.focus();
                customModes[prefix] = true;
            } else {
                if (dropdown) dropdown.style.display = 'block';
                if (customInput) customInput.classList.add('hidden');
                if (customInput) customInput.value = '';
                customModes[prefix] = false;
            }
        }

        window.addEventListener('click', () => {
            document.querySelectorAll('.custom-dropdown-list').forEach(l => l.classList.remove('active'));
        });

        const AWAKE_PICK_SCORES = [
            { value: '10/10', label: '10 - Excepcional' },
            { value: '9/10', label: '9 - Sobresaliente' },
            { value: '8/10', label: '8 - Muy bueno' },
            { value: '7/10', label: '7 - Bueno' },
            { value: '6/10', label: '6 - Satisfactorio' },
            { value: '5/10', label: '5 - Neutral' },
            { value: '4/10', label: '4 - Regular' },
            { value: '3/10', label: '3 - Bajo' },
            { value: '2/10', label: '2 - Deficiente' },
            { value: '1/10', label: '1 - Muy difícil' }
        ];
        let awakePick = { kind: null, target: null, mes: null };

        function etiquetaFechaCorta(iso) {
            const d = parseIsoFechaLocal(iso);
            if (!d) return 'Sin fecha';
            return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
        }

        function etiquetaPuntuacionAwake(val) {
            const hit = AWAKE_PICK_SCORES.find(s => s.value === val);
            return hit ? hit.label : (val || '10 - Excepcional');
        }

        function fechasDesdeValor(valor) {
            return Array.from(new Set(String(valor || '').split(',').map(s => s.trim()).filter(Boolean))).sort();
        }

        function resumenFechasUnicas(isos) {
            if (!isos || !isos.length) return 'Elige los días';
            if (isos.length === 1) return etiquetaFechaCorta(isos[0]);
            const lista = isos.map(iso => {
                const d = parseIsoFechaLocal(iso);
                return d ? d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) : iso;
            }).join(', ');
            return `${isos.length} días · ${lista}`;
        }

        function pintarChipsFechasUnicas(hiddenId, chipsId) {
            const chips = document.getElementById(chipsId);
            if (!chips) return;
            const el = document.getElementById(hiddenId);
            const isos = fechasDesdeValor(el && el.value);
            if (!isos.length) {
                chips.innerHTML = '';
                return;
            }
            chips.innerHTML = isos.map(iso => {
                const d = parseIsoFechaLocal(iso);
                const txt = d ? d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) : iso;
                return `<button type="button" class="once-date-chip" title="Quitar ${escapeHtmlChat(txt)}" onclick="quitarFechaUnica('${hiddenId}', '${iso}')"><span>${escapeHtmlChat(txt)}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
            }).join('');
        }

        function quitarFechaUnica(hiddenId, iso) {
            const el = document.getElementById(hiddenId);
            if (!el) return;
            const isos = fechasDesdeValor(el.value).filter(i => i !== iso);
            el.value = isos.join(',');
            pintarEtiquetaFechaDeseo();
        }

        function pintarEtiquetaFechaDeseo() {
            const pares = [
                ['wish-due-date', 'wish-due-date-label'],
                ['config-once-date', 'config-once-date-label'],
                ['edit-once-date', 'edit-once-date-label']
            ];
            pares.forEach(([id, labId]) => {
                const el = document.getElementById(id);
                const lab = document.getElementById(labId);
                if (!lab) return;
                lab.textContent = String(id).indexOf('once') !== -1
                    ? resumenFechasUnicas(fechasDesdeValor(el && el.value))
                    : etiquetaFechaCorta(el && el.value);
            });
            pintarChipsFechasUnicas('config-once-date', 'config-once-date-chips');
            pintarChipsFechasUnicas('edit-once-date', 'edit-once-date-chips');
        }

        function pintarEtiquetaHoraUnica(hiddenId) {
            const el = document.getElementById(hiddenId);
            const hora = (el && el.value) ? el.value : '';
            const txt = hora || (hiddenId.indexOf('reminder') !== -1 ? 'Hora del aviso' : 'Hora');
            const lab = document.getElementById(hiddenId + '-label');
            if (lab) lab.textContent = txt;
            const labAlt = document.getElementById(hiddenId + '-label-alt');
            if (labAlt) labAlt.textContent = txt;
        }

        function confirmarAwakePickHoraLibre() {
            const inp = document.getElementById('awake-clock-input');
            const norm = normalizarHoraHHMM(inp && inp.value, null);
            if (!norm) {
                mostrarToastLujo('Escribe una hora válida (HH:MM).', { tipo: 'error' });
                if (inp) inp.focus();
                return;
            }
            elegirAwakePick(norm);
        }

        function abrirAwakePickHoraLibre(hiddenId) {
            const el = document.getElementById(hiddenId);
            awakePick = { kind: 'clock', target: hiddenId, mes: null, draft: (el && el.value) || '' };
            abrirCapaAwakePick('Hora');
        }

        function pintarEtiquetaPuntuacion(hiddenId) {
            const el = document.getElementById(hiddenId);
            const lab = document.getElementById(hiddenId + '-label');
            if (lab) lab.textContent = etiquetaPuntuacionAwake(el && el.value);
        }

        function horaDigestActual(bloque) {
            const map = { manana: 'horaManana', tarde: 'horaTarde', noche: 'horaNoche', riesgo: 'horaRiesgo', resumen: 'horaResumen' };
            const fallback = { manana: '08:00', tarde: '15:00', noche: '21:30', riesgo: '18:00', resumen: '20:00' };
            const raw = ritualPrefs[map[bloque]] || fallback[bloque];
            const m = String(raw).match(/^(\d{1,2}):(\d{2})/);
            if (!m) return fallback[bloque];
            return `${String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0')}:${m[2]}`;
        }

        function listaHorasDigest(extra) {
            const seen = {};
            const out = [];
            const add = (h) => {
                if (!h || seen[h]) return;
                seen[h] = true;
                out.push(h);
            };
            add(extra);
            for (let h = 0; h < 24; h++) {
                for (let min = 0; min < 60; min += 30) {
                    add(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
                }
            }
            return out;
        }

        function cerrarAwakePick() {
            const ov = document.getElementById('awake-pick-overlay');
            if (ov) ov.classList.remove('active');
            awakePick = { kind: null, target: null, mes: null };
        }

        function abrirCapaAwakePick(titulo) {
            const ov = document.getElementById('awake-pick-overlay');
            const title = document.getElementById('awake-pick-title');
            if (title) title.textContent = titulo;
            if (ov) ov.classList.add('active');
            pintarCuerpoAwakePick();
        }

        function abrirAwakePickHora(bloque) {
            awakePick = { kind: 'time', target: bloque, mes: null };
            const titulos = { manana: 'Hora del aviso · mañana', tarde: 'Hora del aviso · tarde', noche: 'Hora del aviso · noche', riesgo: 'Hora del aviso · racha en riesgo', resumen: 'Hora del resumen semanal' };
            abrirCapaAwakePick(titulos[bloque] || 'Hora');
        }

        function abrirAwakePickFecha(hiddenId) {
            const esMulti = String(hiddenId || '').indexOf('once') !== -1;
            const el = document.getElementById(hiddenId);
            const primera = esMulti ? fechasDesdeValor(el && el.value)[0] : (el && el.value);
            const actual = parseIsoFechaLocal(primera) || new Date();
            awakePick = { kind: esMulti ? 'dates' : 'date', target: hiddenId, mes: new Date(actual.getFullYear(), actual.getMonth(), 1) };
            abrirCapaAwakePick(esMulti ? 'Días' : 'Fecha objetivo');
        }

        function toggleAwakePickFecha(iso) {
            const el = document.getElementById(awakePick.target);
            if (!el) return;
            const isos = fechasDesdeValor(el.value);
            const i = isos.indexOf(iso);
            if (i > -1) isos.splice(i, 1);
            else isos.push(iso);
            el.value = Array.from(new Set(isos)).sort().join(',');
            pintarEtiquetaFechaDeseo();
            pintarCuerpoAwakePick();
        }

        function abrirAwakePickPuntuacion(hiddenId) {
            awakePick = { kind: 'score', target: hiddenId, mes: null };
            abrirCapaAwakePick('Puntuación');
        }

        function navegarMesAwakePick(delta) {
            if (!awakePick.mes) return;
            awakePick.mes = new Date(awakePick.mes.getFullYear(), awakePick.mes.getMonth() + delta, 1);
            pintarCuerpoAwakePick();
        }

        function elegirAwakePick(valor) {
            if (awakePick.kind === 'dates') {
                const el = document.getElementById(awakePick.target);
                if (el && valor === '') el.value = '';
                pintarEtiquetaFechaDeseo();
                pintarCuerpoAwakePick();
                return;
            }
            if (awakePick.kind === 'time') {
                cambiarHoraDigest(awakePick.target, valor);
            } else if (awakePick.kind === 'date') {
                const el = document.getElementById(awakePick.target);
                if (el) el.value = valor || '';
                pintarEtiquetaFechaDeseo();
            } else if (awakePick.kind === 'clock') {
                const el = document.getElementById(awakePick.target);
                if (el) el.value = valor || '';
                pintarEtiquetaHoraUnica(awakePick.target);
            } else if (awakePick.kind === 'score') {
                const el = document.getElementById(awakePick.target);
                if (el) el.value = valor;
                pintarEtiquetaPuntuacion(awakePick.target);
            } else if (awakePick.kind === 'weekn') {
                const n = parseInt(valor, 10) || 0;
                if (awakePick.target === 'edit') elegirVecesPorSemanaEdit(n);
                else elegirVecesPorSemana(n);
            }
            cerrarAwakePick();
        }

        function accionesAwakePick(extraHtml) {
            const actions = document.getElementById('awake-pick-actions');
            if (!actions) return;
            actions.innerHTML = `<button type="button" class="btn-cancel" onclick="cerrarAwakePick()">Cancelar</button>${extraHtml || ''}`;
        }

        function htmlListaPickAwake(valores, actual, textoDe) {
            let html = '<div class="awake-pick-list">';
            for (let i = 0; i < valores.length; i++) {
                const v = valores[i];
                const on = v === actual ? ' active' : '';
                const txt = textoDe ? textoDe(v) : v;
                html += '<button type="button" class="awake-pick-item' + on + '" onclick="elegirAwakePick(\'' + v + '\')">' + txt + '</button>';
            }
            return html + '</div>';
        }

        function scrollPickActivoAwake(body) {
            requestAnimationFrame(() => {
                const activo = body.querySelector('.awake-pick-item.active');
                if (activo) activo.scrollIntoView({ block: 'center' });
            });
        }

        function pintarCuerpoAwakePick() {
            const body = document.getElementById('awake-pick-body');
            if (!body) return;
            if (awakePick.kind === 'time') {
                const horaDigest = horaDigestActual(awakePick.target);
                body.innerHTML = htmlListaPickAwake(listaHorasDigest(horaDigest), horaDigest, function (h) { return 'Hora: ' + h; });
                accionesAwakePick('');
                scrollPickActivoAwake(body);
                return;
            }
            if (awakePick.kind === 'clock') {
                const campoReloj = document.getElementById(awakePick.target);
                const horaReloj = formatearEntradaHoraLibre(awakePick.draft || (campoReloj && campoReloj.value) || '');
                body.innerHTML = '<div class="awake-clock-input-wrap">' +
                    '<label class="awake-clock-label" for="awake-clock-input">Hora exacta</label>' +
                    '<input type="text" id="awake-clock-input" class="search-input awake-clock-input" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="Ej: 0915 → 09:15" value="' + escapeHtmlChat(horaReloj) + '" autocomplete="off" oninput="alEscribirHoraLibre(this)">' +
                    '</div>';
                accionesAwakePick('<button type="button" class="btn-continue" onclick="confirmarAwakePickHoraLibre()">Guardar</button>');
                requestAnimationFrame(function () {
                    const inp = document.getElementById('awake-clock-input');
                    if (inp) {
                        inp.focus();
                        try { inp.select(); } catch (e) {}
                    }
                });
                return;
            }
            if (awakePick.kind === 'weekn') {
                const vecesSem = awakePick.target === 'edit' ? editVecesPorSemana : configVecesPorSemana;
                body.innerHTML = htmlListaPickAwake([1, 2, 3, 4, 5, 6, 7], vecesSem, function (n) {
                    return n + (n === 1 ? ' vez' : ' veces') + ' / semana';
                });
                accionesAwakePick('');
                return;
            }
            if (awakePick.kind === 'score') {
                const campoNota = document.getElementById(awakePick.target);
                const notaPick = (campoNota && campoNota.value) || '10/10';
                body.innerHTML = htmlListaPickAwake(AWAKE_PICK_SCORES.map(function (s) { return s.value; }), notaPick, etiquetaPuntuacionAwake);
                accionesAwakePick('');
                return;
            }
            if (awakePick.kind === 'dates') {
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const mes = awakePick.mes || new Date();
                const year = mes.getFullYear();
                const month = mes.getMonth();
                const first = new Date(year, month, 1);
                const last = new Date(year, month + 1, 0);
                const hidden = document.getElementById(awakePick.target);
                const pickedSet = new Set(fechasDesdeValor(hidden && hidden.value));
                const hoyIso = isoFechaLocal(new Date());
                let cells = '';
                const pad = offsetPrimeraCeldaMes(first);
                for (let i = 0; i < pad; i++) cells += '<div class="calendar-day-cell" style="opacity:0.2"></div>';
                for (let day = 1; day <= last.getDate(); day++) {
                    const iso = isoFechaLocal(new Date(year, month, day));
                    let cls = 'calendar-day-cell';
                    if (iso === hoyIso) cls += ' is-today';
                    if (pickedSet.has(iso)) cls += ' is-picked';
                    cells += `<div class="${cls}" onclick="toggleAwakePickFecha('${iso}')"><span>${day}</span></div>`;
                }
                body.innerHTML = `
                    <div class="awake-icon-stage">
                    <div class="calendar-month-container awake-pick-cal" onclick="event.stopPropagation()">
                        <div class="calendar-month-header">
                            <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesAwakePick(-1)">‹</button>
                            <span>${monthNames[month]} ${year}</span>
                            <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesAwakePick(1)">›</button>
                        </div>
                        <div class="calendar-weekdays-row">${etiquetasSemanaCortas().map(w => `<span>${w}</span>`).join('')}</div>
                        <div class="calendar-days-grid">${cells}</div>
                    </div>
                    </div>`;
                accionesAwakePick('<button type="button" class="btn-cancel" onclick="elegirAwakePick(\'\')">Borrar todo</button><button type="button" class="btn-continue" onclick="cerrarAwakePick()">Hecho</button>');
                return;
            }
            if (awakePick.kind === 'date') {
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const mes = awakePick.mes || new Date();
                const year = mes.getFullYear();
                const month = mes.getMonth();
                const first = new Date(year, month, 1);
                const last = new Date(year, month + 1, 0);
                const hidden = document.getElementById(awakePick.target);
                const picked = (hidden && hidden.value) || '';
                const hoyIso = isoFechaLocal(new Date());
                let cells = '';
                const pad = offsetPrimeraCeldaMes(first);
                for (let i = 0; i < pad; i++) cells += '<div class="calendar-day-cell" style="opacity:0.2"></div>';
                for (let day = 1; day <= last.getDate(); day++) {
                    const iso = isoFechaLocal(new Date(year, month, day));
                    let cls = 'calendar-day-cell';
                    if (iso === hoyIso) cls += ' is-today';
                    if (iso === picked) cls += ' is-picked';
                    cells += `<div class="${cls}" onclick="elegirAwakePick('${iso}')"><span>${day}</span></div>`;
                }
                body.innerHTML = `
                    <div class="awake-icon-stage">
                    <div class="calendar-month-container awake-pick-cal" onclick="event.stopPropagation()">
                        <div class="calendar-month-header">
                            <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesAwakePick(-1)">‹</button>
                            <span>${monthNames[month]} ${year}</span>
                            <button type="button" class="calendar-month-nav-btn" onclick="event.preventDefault(); event.stopPropagation(); navegarMesAwakePick(1)">›</button>
                        </div>
                        <div class="calendar-weekdays-row">${etiquetasSemanaCortas().map(w => `<span>${w}</span>`).join('')}</div>
                        <div class="calendar-days-grid">${cells}</div>
                    </div>
                    </div>`;
                accionesAwakePick('<button type="button" class="btn-cancel" onclick="elegirAwakePick(\'\')">Sin fecha</button>');
                return;
            }
            if (awakePick.kind === 'icon') {
                const q = (document.getElementById('awake-icon-search') || {}).value || '';
                body.innerHTML = `<input type="search" class="search-input awake-icon-search" id="awake-icon-search" placeholder="Buscar icono..." value="${escapeHtmlChat(q)}" oninput="filtrarAwakePickIcono()"><div class="awake-icon-stage">${htmlIconosAwakePick(q)}</div>`;
                accionesAwakePick('<button type="button" class="btn-continue" onclick="confirmarAwakePickLook()">Guardar</button>');
                return;
            }
            if (awakePick.kind === 'color') {
                const draft = String(awakePick.draft || '').toLowerCase();
                const colorActivo = ACENTOS_GLIFO.find(a => String(a.hex || '').toLowerCase() === draft) || ACENTOS_GLIFO[0];
                body.innerHTML = `<div class="awake-color-stage">
                    <div class="awake-color-name">${escapeHtmlChat(colorActivo.label)}</div>
                    <div class="awake-color-grid">${ACENTOS_GLIFO.map(a => {
                    const hex = String(a.hex || '').toLowerCase();
                    const on = hex === draft ? ' active' : '';
                    const auto = a.hex ? '' : ' is-auto';
                    const bg = a.hex ? `background:${a.hex};` : '';
                    return `<button type="button" class="awake-color-cell${on}" title="${a.label}" aria-label="${a.label}" onclick="elegirDraftColor('${a.hex}')"><span class="awake-color-orb${auto}" style="${bg}"></span><span class="awake-color-label">${escapeHtmlChat(a.label)}</span></button>`;
                }).join('')}</div></div>`;
                accionesAwakePick('<button type="button" class="btn-continue" onclick="confirmarAwakePickLook()">Guardar</button>');
            }
        }

        function htmlIconosAwakePick(filtro) {
            const q = String(filtro || '').toLowerCase().trim();
            const draft = awakePick.draft || 'sparkle';
            return ICON_PICKER_GROUPS.map(g => {
                const keys = (g.keys || []).filter(k => PH_ICON_PATHS[k] && (!q || k.replace(/-/g, ' ').includes(q) || g.titulo.toLowerCase().includes(q)));
                if (!keys.length) return '';
                return `<div class="awake-icon-group-title">${g.titulo}</div><div class="awake-icon-grid">${keys.map(k =>
                    `<button type="button" class="awake-icon-cell${k === draft ? ' active' : ''}" data-icon="${k}" onclick="elegirDraftIcono('${k}')">${svgPhosphorPorClave(k, 22)}</button>`
                ).join('')}</div>`;
            }).join('');
        }

        function filtrarAwakePickIcono() {
            if (awakePick.kind !== 'icon') return;
            pintarCuerpoAwakePick();
            const inp = document.getElementById('awake-icon-search');
            if (inp) {
                inp.focus();
                const v = inp.value;
                try { inp.setSelectionRange(v.length, v.length); } catch (e) {}
            }
        }

        function elegirDraftIcono(clave) {
            awakePick.draft = clave;
            document.querySelectorAll('#awake-pick-body .awake-icon-cell').forEach(function (btn) {
                btn.classList.toggle('active', btn.getAttribute('data-icon') === clave);
            });
            // Aplicar al instante: así el icono queda elegido aunque se cierre el picker.
            if (awakePick.target) elegirGlyphHabito(clave || 'sparkle', awakePick.target);
        }

        function elegirDraftColor(hex) {
            awakePick.draft = hex || '';
            if (awakePick.target) elegirAcentoHabito(hex || '', awakePick.target);
            pintarCuerpoAwakePick();
        }

        function abrirAwakePickIcono(modo) {
            const actual = (modo === 'edit' ? editGlyph : configGlyph) || 'sparkle';
            awakePick = { kind: 'icon', target: modo, mes: null, draft: actual };
            abrirCapaAwakePick('Icono');
        }

        function abrirAwakePickColor(modo) {
            const actual = modo === 'edit' ? editAccent : configAccent;
            awakePick = { kind: 'color', target: modo, mes: null, draft: actual || '' };
            abrirCapaAwakePick('Color');
        }

        function confirmarAwakePickLook() {
            const modo = awakePick.target;
            if (awakePick.kind === 'icon') elegirGlyphHabito(awakePick.draft || 'sparkle', modo);
            else if (awakePick.kind === 'color') elegirAcentoHabito(awakePick.draft || '', modo);
            cerrarAwakePick();
        }

        function cambiarAuthTab(modo) {
            authMode = modo;
            const btnLogin = document.getElementById('auth-tab-login-btn');
            const btnReg = document.getElementById('auth-tab-register-btn');
            const submitBtn = document.getElementById('auth-submit-btn');
            const title = document.getElementById('auth-modal-title');
            const copy = document.getElementById('auth-modal-copy');
            const passGroup = document.getElementById('auth-password-group');
            const forgot = document.getElementById('auth-forgot-link');
            const tabs = document.getElementById('auth-tabs-row');
            mostrarErrorAuth('');

            if (passGroup) passGroup.classList.toggle('hidden', modo === 'recover');
            if (forgot) forgot.classList.toggle('hidden', modo === 'recover');
            if (tabs) tabs.style.display = modo === 'recover' ? 'none' : 'flex';

            if (modo === 'login') {
                if (btnLogin) {
                    btnLogin.classList.add('active');
                    btnLogin.setAttribute('aria-selected', 'true');
                    btnLogin.setAttribute('tabindex', '0');
                }
                if (btnReg) {
                    btnReg.classList.remove('active');
                    btnReg.setAttribute('aria-selected', 'false');
                    btnReg.setAttribute('tabindex', '-1');
                }
                if (submitBtn) submitBtn.textContent = 'Entrar';
                if (title) title.textContent = 'Tu ritual, también en red';
                if (copy) copy.textContent = 'Inicia sesión para guardar el progreso en la nube, seguir a otros y escribir. Puedes seguir usando AWAKE sin cuenta.';
            } else if (modo === 'register') {
                if (btnLogin) {
                    btnLogin.classList.remove('active');
                    btnLogin.setAttribute('aria-selected', 'false');
                    btnLogin.setAttribute('tabindex', '-1');
                }
                if (btnReg) {
                    btnReg.classList.add('active');
                    btnReg.setAttribute('aria-selected', 'true');
                    btnReg.setAttribute('tabindex', '0');
                }
                if (submitBtn) submitBtn.textContent = 'Crear cuenta';
                if (title) title.textContent = 'Crear cuenta AWAKE';
                if (copy) copy.textContent = 'Una cuenta guarda hábitos, deseos y mensajes entre dispositivos.';
            } else {
                if (btnLogin) btnLogin.classList.remove('active');
                if (btnReg) btnReg.classList.remove('active');
                if (submitBtn) submitBtn.textContent = 'Enviar enlace';
                if (title) title.textContent = 'Recuperar acceso';
                if (copy) copy.textContent = 'Te enviaremos un enlace al correo para elegir una contraseña nueva.';
            }
        }

        async function ejecutarAccionAuth() {
            const email = document.getElementById('user-auth-email').value.trim();
            const password = document.getElementById('user-auth-password').value;
            const errDiv = document.getElementById('auth-main-error');
            if(errDiv) mostrarErrorAuth('');

            if (authMode === 'recover') {
                if (!email) {
                    mostrarErrorAuth('Introduce tu correo.');
                    return;
                }
                try {
                    await supabaseClient.auth.resetPasswordForEmail(email);
                    mostrarErrorAuth('');
                    mostrarToastLujo('Si ese correo está en AWAKE, te llegará un enlace', { tipo: 'info' });
                    document.getElementById('auth-modal').classList.remove('active');
                    cambiarAuthTab('login');
                } catch (err) {
                    mostrarErrorAuth('');
                    mostrarToastLujo('Si ese correo está en AWAKE, te llegará un enlace', { tipo: 'info' });
                }
                return;
            }

            if(!email || !password) {
                mostrarErrorAuth("Introduce correo y contraseña.");
                return;
            }

            try {
                if (authMode === 'login') {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) {
                        mostrarErrorAuth(textoErrorAuth(error, 'login'));
                        return;
                    }
                    if (data.user) {
                        currentUser = data.user;
                        if (data.session) respaldarSesionAuthEnNavegador(data.session);
                        solicitarAlmacenamientoPersistente();
                        document.getElementById('auth-modal').classList.remove('active');
                        await cargarDatosUsuarioSupabase();
                        arrancarPermisoNotificacionesSiToca();
                        refrescarBadgeMensajes();
                    }
                } else {
                    const { data, error } = await supabaseClient.auth.signUp({ email, password });
                    if (error) {
                        mostrarErrorAuth(textoErrorAuth(error, 'register'));
                        return;
                    }
                    if (data.user) {
                        currentUser = data.user;
                        if (data.session) respaldarSesionAuthEnNavegador(data.session);
                        solicitarAlmacenamientoPersistente();
                        const defaultNick = recortarTexto(email.split('@')[0], AWAKE_LIMITE_NICK);
                        await supabaseClient.from('profiles').upsert([{ id: currentUser.id, username: defaultNick, bio: "" }]);
                        document.getElementById('auth-modal').classList.remove('active');
                        await cargarDatosUsuarioSupabase();
                        arrancarPermisoNotificacionesSiToca();
                    }
                }
            } catch (err) {
                console.error("Excepción en autenticación:", err);
                mostrarErrorAuth(textoErrorAuth(err, authMode));
            }
        }

        function resetEstadoPrivadoSesion() {
            currentUser = null;
            misHabitos = [];
            misDeseos = [];
            historialAgrupado = {};
            misSeguidores = [];
            misSeguidos = [];
            accountPrivacy = 'publico';
            viewingUserId = null;
            currentSocialTargetUserId = null;
            navReturnStack = [];
            fichaHabitoIndex = null;
            historyExpanded = {};
            window.cachePerfilesSocial = {};
            window.registrosGlobalMap = {};
            window.userHasAvatar = false;
            window.tempAvatarBase64 = null;

            try { detenerGrabacionAudioChat(true); } catch (e) {}
            pendingChatReply = null;
            activeDirectChatUser = null;
            chatLastMessageAt = null;
            peerLastReadAt = null;
            renderedChatMessageIds = new Set();
            pendingOptimisticChatTexts = [];
            chatLoadGeneration += 1;
            inboxLoadGeneration += 1;
            try { detenerPollingChat(); } catch (e) {}
            try { dejarBroadcastChat(); } catch (e) {}
            lecturasChatHidratadasPara = null;
            pintarBadgeMensajes(0);
            detenerSincronizacionDiario();

            ['direct-chat-modal', 'explore-modal', 'social-modal', 'detail-modal', 'edit-profile-modal'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });
            const chatBody = document.getElementById('direct-chat-body-container');
            if (chatBody) chatBody.innerHTML = '';

            const nick = document.getElementById('display-nickname');
            const bioName = document.getElementById('profile-bio-name');
            const bio = document.getElementById('profile-view-subtitle');
            if (nick) nick.textContent = 'Anonymous';
            if (bioName) bioName.textContent = 'Anonymous';
            if (bio) bio.textContent = '';
            const logoutBtn = document.getElementById('menu-logout-btn');
            if (logoutBtn) logoutBtn.style.display = 'none';
            const logoutWrap = document.getElementById('settings-logout-wrap');
            if (logoutWrap) logoutWrap.style.display = 'none';
            const loginBtn = document.getElementById('menu-login-btn');
            if (loginBtn) loginBtn.style.display = 'flex';
            try { setMenuHamburguesaAbierto(false); } catch (e) {}
            const img1 = document.getElementById('avatar-img');
            const ph1 = document.getElementById('avatar-placeholder');
            const img2 = document.getElementById('profile-view-img');
            const ph2 = document.getElementById('profile-view-placeholder');
            if (img1) { img1.src = ''; img1.style.display = 'none'; }
            if (ph1) ph1.style.display = 'flex';
            if (img2) { img2.src = ''; img2.style.display = 'none'; }
            if (ph2) ph2.style.display = 'flex';

            if (habitReminderIntervalId) {
                clearInterval(habitReminderIntervalId);
                habitReminderIntervalId = null;
            }
            if (habitCountdownId) {
                clearInterval(habitCountdownId);
                habitCountdownId = null;
            }
        }

        async function cerrarSesionSupabase() {
            try { await borrarTokenPushEnServidor(); } catch (e) {}
            try { await cancelarAlarmasNativasHabitos(); } catch (e) {}
            await supabaseClient.auth.signOut();
            borrarRespaldoSesionAuth();
            resetEstadoPrivadoSesion();
            cargarEstadoLocal('guest');
            arrancarIntervalosHabitos();
            renderizarMiRutina();
            renderizarListaDeseos();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
        }

        async function cambiarCuentaAjustes() {
            await cerrarSesionSupabase();
            abrirModalAuth();
        }

        function firmaEstadoDiario() {
            const hab = (misHabitos || []).map(h => [h.id || '', h.nombre || '', h.streak || 0, (h.momentos || []).join(','), h.enDescanso ? 1 : 0].join('|')).sort().join(';');
            const logs = Object.keys(historialAgrupado || {}).sort().map(k => {
                return (historialAgrupado[k] || []).map(l => [l.id || '', l.image_url || '', l.texto || ''].join('|')).join(',');
            }).join('#');
            const des = (misDeseos || []).map(d => [d.id || '', d.nombre || '', d.completado ? 1 : 0, d.imagen || '', d.comentario || ''].join('|')).sort().join(';');
            return hab + '::' + logs + '::' + des + '::' + String(currentThemeHue) + '::' + String(activeBackground);
        }

        function esIdSelloLocal(id) {
            const s = String(id || '');
            return !s || s.indexOf('reg_') === 0 || s.indexOf('wish_reg_') === 0;
        }

        async function subirHabitosLocalesPendientes() {
            if (!currentUser || !misHabitos || !misHabitos.length) return;
            for (let i = 0; i < misHabitos.length; i++) {
                const h = misHabitos[i];
                if (!h || h.id) continue;
                try {
                    const { data, error } = await supabaseClient.from('habits').insert([{
                        user_id: currentUser.id,
                        ...payloadHabitoNube(h)
                    }]).select('id').single();
                    if (!error && data) h.id = data.id;
                    else if (error && errorEsRecursoAusente(error) && cloudHabitsExtraCols) {
                        suavizarColumnasHabitoAusentes();
                        const retry = await supabaseClient.from('habits').insert([{
                            user_id: currentUser.id,
                            ...payloadHabitoNube(h)
                        }]).select('id').single();
                        if (!retry.error && retry.data) h.id = retry.data.id;
                    }
                } catch (e) {}
            }
        }

        async function subirSellosLocalesPendientes() {
            if (!currentUser) return;
            const nombres = Object.keys(historialAgrupado || {});
            for (let i = 0; i < nombres.length; i++) {
                const regs = historialAgrupado[nombres[i]] || [];
                for (let j = 0; j < regs.length; j++) {
                    const reg = regs[j];
                    if (!reg || !esIdSelloLocal(reg.id)) continue;
                    try {
                        let imageUrl = (reg.imagenes && reg.imagenes[0]) || reg.image_url || null;
                        if (imageUrl && esDataUrlMedia(imageUrl)) {
                            imageUrl = await subirMediaAwake(imageUrl, 'logs', 'jpg');
                            if (!imageUrl || esDataUrlMedia(imageUrl)) imageUrl = null;
                            else {
                                reg.image_url = imageUrl;
                                reg.imagenes = [imageUrl];
                            }
                        }
                        const created = reg.dateObj
                            ? new Date(reg.dateObj)
                            : new Date(reg.timestamp || Date.now());
                        const { data, error } = await supabaseClient.from('habit_logs').insert([{
                            user_id: currentUser.id,
                            habit_name: cleanHabitName(reg.nombre || nombres[i]),
                            text_comment: reg.texto || '',
                            image_url: imageUrl || null,
                            privacy: reg.privacidad || 'seguidores',
                            created_at: isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString()
                        }]).select('id').single();
                        if (!error && data) {
                            if (reg.id && window.registrosGlobalMap) delete window.registrosGlobalMap[reg.id];
                            reg.id = data.id;
                            marcarSelloReciente(reg.id);
                            if (window.registrosGlobalMap) window.registrosGlobalMap[reg.id] = reg;
                        }
                    } catch (e) {}
                }
            }
        }

        function errorEsRecursoAusente(err) {
            const c = String((err && err.code) || '');
            const m = String((err && err.message) || '');
            return c === 'PGRST205' || c === '42703' || m.indexOf('schema cache') !== -1 || m.indexOf('does not exist') !== -1;
        }

        function esIdDeseoLocal(id) {
            const s = String(id || '');
            return !s || s.indexOf('wish_') === 0;
        }

        function deduplicarDeseos(lista) {
            const ordered = (lista || []).filter(Boolean).slice().sort((a, b) => {
                const al = esIdDeseoLocal(a.id) ? 1 : 0;
                const bl = esIdDeseoLocal(b.id) ? 1 : 0;
                return al - bl;
            });
            const out = [];
            const seenId = {};
            const seenPendiente = {};
            ordered.forEach(d => {
                const id = String(d.id || '');
                if (id && seenId[id]) return;
                if (id) seenId[id] = true;
                if (!d.completado) {
                    const n = cleanHabitName(d.nombre);
                    if (seenPendiente[n]) return;
                    seenPendiente[n] = true;
                }
                out.push(d);
            });
            return out;
        }

        function deseoDesdeFila(row) {
            return {
                id: row.id,
                nombre: cleanHabitName(row.title),
                fecha: row.created_at ? new Date(row.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                completado: !!row.completed,
                comentario: row.comment || '',
                imagen: row.image_url || null,
                puntuacion: row.score || null,
                fechaCompletado: row.completed_at ? new Date(row.completed_at).toLocaleDateString() : null,
                fechaObjetivo: row.due_date || null
            };
        }

        function filaDeseoDesdeLocal(d) {
            let completedAt = null;
            if (d && d.completado) {
                const t = d.fechaCompletado ? Date.parse(d.fechaCompletado) : Date.now();
                completedAt = isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
            }
            let imageUrl = d && d.imagen ? d.imagen : null;
            if (imageUrl && String(imageUrl).indexOf('data:') === 0) imageUrl = null;
            const fila = {
                user_id: currentUser.id,
                title: cleanHabitName(d.nombre),
                completed: !!(d && d.completado),
                comment: (d && d.comentario) || '',
                image_url: imageUrl,
                score: (d && d.puntuacion) || null,
                completed_at: completedAt
            };
            if (cloudWishesDueDate) fila.due_date = (d && d.fechaObjetivo) || null;
            return fila;
        }

        async function persistirDeseoNube(d) {
            if (!currentUser || !d) return;
            const fila = filaDeseoDesdeLocal(d);
            try {
                if (esIdDeseoLocal(d.id)) {
                    const { data, error } = await supabaseClient.from('wishes').insert([fila]).select('id').single();
                    if (!error && data) d.id = data.id;
                    else if (error && errorEsRecursoAusente(error) && cloudWishesDueDate) {
                        cloudWishesDueDate = false;
                        delete fila.due_date;
                        const retry = await supabaseClient.from('wishes').insert([fila]).select('id').single();
                        if (!retry.error && retry.data) d.id = retry.data.id;
                    } else if (error && !errorEsRecursoAusente(error)) {
                        mostrarToastLujo('No se pudo guardar el deseo en la nube. Revisa la conexión.', { tipo: 'error' });
                    }
                    return;
                }
                const { error } = await supabaseClient.from('wishes').update({
                    title: fila.title,
                    completed: fila.completed,
                    comment: fila.comment,
                    image_url: fila.image_url,
                    score: fila.score,
                    completed_at: fila.completed_at,
                    ...(cloudWishesDueDate ? { due_date: fila.due_date || null } : {})
                }).eq('id', d.id);
                if (error && errorEsRecursoAusente(error) && cloudWishesDueDate) {
                    cloudWishesDueDate = false;
                    await supabaseClient.from('wishes').update({
                        title: fila.title,
                        completed: fila.completed,
                        comment: fila.comment,
                        image_url: fila.image_url,
                        score: fila.score,
                        completed_at: fila.completed_at
                    }).eq('id', d.id);
                } else if (error && !errorEsRecursoAusente(error)) {
                    mostrarToastLujo('No se pudo guardar el deseo en la nube. Revisa la conexión.', { tipo: 'error' });
                }
            } catch (e) {}
        }

        async function subirDeseosLocalesPendientes() {
            if (!currentUser || !misDeseos || !misDeseos.length) return;
            for (let i = 0; i < misDeseos.length; i++) {
                const d = misDeseos[i];
                if (!d || !esIdDeseoLocal(d.id)) continue;
                await persistirDeseoNube(d);
            }
        }

        function payloadRitualPrefsNube() {
            return {
                digestManana: !!ritualPrefs.digestManana,
                digestTarde: !!ritualPrefs.digestTarde,
                digestNoche: !!ritualPrefs.digestNoche,
                horaManana: ritualPrefs.horaManana || '08:00',
                horaTarde: ritualPrefs.horaTarde || '15:00',
                horaNoche: ritualPrefs.horaNoche || '21:30',
                riesgoActivo: !!ritualPrefs.riesgoActivo,
                horaRiesgo: ritualPrefs.horaRiesgo || '18:00',
                resumenActivo: !!ritualPrefs.resumenActivo,
                horaResumen: ritualPrefs.horaResumen || '20:00',
                badgesUnlocked: leerInsigniasEncendidas()
            };
        }

        async function persistirPrefsVisualesNube() {
            if (!currentUser) return;
            prefsVisualesLocalAt = Date.now();
            try {
                const fila = {
                    theme_hue: currentThemeHue,
                    bg_choice: normalizarFondo(activeBackground)
                };
                if (cloudPrefsRitual) {
                    fila.week_start = weekStartDay;
                    fila.ritual_prefs = payloadRitualPrefsNube();
                }
                if (cloudBadgesUnlocked) {
                    fila.badges_unlocked = leerInsigniasEncendidas();
                }
                const { error } = await supabaseClient.from('profiles').update(fila).eq('id', currentUser.id);
                if (error && errorEsRecursoAusente(error)) {
                    if (cloudBadgesUnlocked && String(error.message || '').indexOf('badges_unlocked') !== -1) {
                        cloudBadgesUnlocked = false;
                    }
                    if (cloudPrefsRitual) cloudPrefsRitual = false;
                    await supabaseClient.from('profiles').update({
                        theme_hue: currentThemeHue,
                        bg_choice: normalizarFondo(activeBackground)
                    }).eq('id', currentUser.id);
                } else if (error && !errorEsRecursoAusente(error)) console.warn(error.message);
            } catch (e) {}
        }

        function aplicarPrefsRitualRemotas(prefs) {
            if (!prefs) return;
            const rp = prefs.ritual_prefs;
            if (rp && typeof rp === 'object') {
                if (rp.digestManana != null) ritualPrefs.digestManana = !!rp.digestManana;
                if (rp.digestTarde != null) ritualPrefs.digestTarde = !!rp.digestTarde;
                if (rp.digestNoche != null) ritualPrefs.digestNoche = !!rp.digestNoche;
                if (rp.horaManana) ritualPrefs.horaManana = normalizarHoraHHMM(rp.horaManana, ritualPrefs.horaManana);
                if (rp.horaTarde) ritualPrefs.horaTarde = normalizarHoraHHMM(rp.horaTarde, ritualPrefs.horaTarde);
                if (rp.horaNoche) ritualPrefs.horaNoche = normalizarHoraHHMM(rp.horaNoche, ritualPrefs.horaNoche);
                if (rp.riesgoActivo != null) ritualPrefs.riesgoActivo = !!rp.riesgoActivo;
                if (rp.horaRiesgo) ritualPrefs.horaRiesgo = normalizarHoraHHMM(rp.horaRiesgo, ritualPrefs.horaRiesgo);
                if (rp.resumenActivo != null) ritualPrefs.resumenActivo = !!rp.resumenActivo;
                if (rp.horaResumen) ritualPrefs.horaResumen = normalizarHoraHHMM(rp.horaResumen, ritualPrefs.horaResumen);
                if (rp.badgesUnlocked) fusionarInsigniasEncendidas(rp.badgesUnlocked);
            }
            if (prefs.badges_unlocked) fusionarInsigniasEncendidas(prefs.badges_unlocked);
            guardarPrefsRitualLocal();
            sincronizarPanelAjustes();
        }

        function aplicarPrefsVisualesRemotas(prefs) {
            if (!prefs) return;
            if (Date.now() - prefsVisualesLocalAt < 5000) return;
            if (Object.prototype.hasOwnProperty.call(prefs, 'theme_hue')) {
                const hue = prefs.theme_hue == null ? null : prefs.theme_hue;
                if (hue !== currentThemeHue) {
                    currentThemeHue = hue;
                    aplicarTemaGlobalHabitos(currentThemeHue);
                }
            }
            if (prefs.bg_choice != null) {
                const fondo = normalizarFondo(prefs.bg_choice);
                if (fondo !== activeBackground) {
                    activeBackground = fondo;
                    try { localStorage.setItem('proto2monolith_bg_choice', String(fondo)); } catch (e) {}
                    initActiveBackgroundEngine();
                }
            }
        }

        async function cargarDatosUsuarioSupabase(opts) {
            if(!currentUser) return;
            opts = opts || {};
            if (diarioSyncInFlight) {
                recargaDiarioPendiente = true;
                return;
            }
            diarioSyncInFlight = true;
            try {
            if (opts.refrescarSesion) {
                try { await supabaseClient.auth.refreshSession(); } catch (e) {}
            }
            if (opts.hidratarLocal !== false) cargarEstadoLocal(currentUser.id);
            await subirHabitosLocalesPendientes();
            await subirSellosLocalesPendientes();
            await subirDeseosLocalesPendientes();
            const { data: profile } = await supabaseClient.from('profiles').select('id, username, bio, avatar_url, account_privacy').eq('id', currentUser.id).single();
            if (profile) {
                if (profile.username) {
                    document.getElementById('display-nickname').textContent = profile.username;
                    document.getElementById('profile-bio-name').textContent = profile.username;
                }
                if (profile.bio !== undefined && profile.bio !== null) {
                    document.getElementById('profile-view-subtitle').textContent = profile.bio;
                }
                if (profile.avatar_url) {
                    aplicarImagenAvatar(profile.avatar_url);
                    migrarAvatarLocalSiHaceFalta(profile.avatar_url);
                }
                if (profile.account_privacy != null && profile.account_privacy !== '') {
                    accountPrivacy = normalizarPrivacidadCuenta(profile.account_privacy);
                }
            }
            try {
                const { data: prefs, error: prefsErr } = await supabaseClient.from('profiles').select('theme_hue, bg_choice, week_start, ritual_prefs, badges_unlocked').eq('id', currentUser.id).maybeSingle();
                if (prefsErr && errorEsRecursoAusente(prefsErr)) {
                    cloudPrefsRitual = false;
                    cloudBadgesUnlocked = false;
                    const { data: prefs2, error: prefsErr2 } = await supabaseClient.from('profiles').select('theme_hue, bg_choice').eq('id', currentUser.id).maybeSingle();
                    if (!prefsErr2 && prefs2) aplicarPrefsVisualesRemotas(prefs2);
                } else if (!prefsErr && prefs) {
                    if (!Object.prototype.hasOwnProperty.call(prefs, 'badges_unlocked')) cloudBadgesUnlocked = false;
                    aplicarPrefsVisualesRemotas(prefs);
                    aplicarPrefsRitualRemotas(prefs);
                    try { persistirInsigniasNube(); } catch (e) {}
                }
            } catch (e) {}
            document.getElementById('menu-logout-btn').style.display = 'flex';
            const logoutWrap = document.getElementById('settings-logout-wrap');
            if (logoutWrap) logoutWrap.style.display = '';
            const loginBtn2 = document.getElementById('menu-login-btn');
            if (loginBtn2) loginBtn2.style.display = 'none';

            const { data: misSegs } = await supabaseClient.from('follows').select('follower_id').eq('following_id', currentUser.id);
            const { data: misSgs } = await supabaseClient.from('follows').select('following_id').eq('follower_id', currentUser.id);
            misSeguidores = misSegs ? misSegs.map(x => x.follower_id) : [];
            misSeguidos = misSgs ? misSgs.map(x => x.following_id) : [];

            const pendientesLocales = (misHabitos || []).filter(h => h && !h.id);
            const selExtra = 'id, title, habit_type, moments, days, reminder_active, start_time, reminder_interval, en_descanso, bg_color, streak, archived, times_per_week, glyph, created_at';
            const selBase = 'id, title, habit_type, moments, days, reminder_active, start_time, reminder_interval, en_descanso, bg_color, streak, created_at';
            let habitsRows = null;
            let habitsErr2 = null;
            const { data: habitsFull, error: habitsFullErr } = await supabaseClient.from('habits').select(selExtra).eq('user_id', currentUser.id);
            if (!habitsFullErr && Array.isArray(habitsFull)) {
                habitsRows = habitsFull;
            } else if (habitsFullErr && errorEsRecursoAusente(habitsFullErr)) {
                cloudHabitsExtraCols = false;
                const baseRes = await supabaseClient.from('habits').select(selBase).eq('user_id', currentUser.id);
                habitsRows = baseRes.data;
                habitsErr2 = baseRes.error;
            } else {
                habitsErr2 = habitsFullErr;
            }
            if (!habitsErr2 && Array.isArray(habitsRows)) {
                const glyphLocalPorNombre = {};
                (misHabitos || []).forEach(h => {
                    if (!h) return;
                    const g = sanitizarGlifoPersistido(h);
                    if (!g) return;
                    glyphLocalPorNombre[cleanHabitName(h.nombre)] = g;
                });
                misHabitos = habitsRows.map(h => {
                    const mapped = mapearHabitoDesdeFila(h);
                    if (!mapped.glyph) {
                        const localG = glyphLocalPorNombre[cleanHabitName(mapped.nombre)];
                        if (localG) mapped.glyph = localG;
                    }
                    return mapped;
                });
                pendientesLocales.forEach(p => {
                    const nombre = cleanHabitName(p.nombre);
                    if (!misHabitos.some(h => cleanHabitName(h.nombre) === nombre)) misHabitos.push(p);
                });
                if (opts.hidratarLocal !== false) {
                    const migrar247 = misHabitos.filter((h, i) => {
                        const orig = habitsRows[i];
                        if (!h.id || !h.permite247 || !orig) return false;
                        const moments = orig.moments || [];
                        return moments.indexOf('24/7') === -1;
                    });
                    if (migrar247.length) {
                        await Promise.all(migrar247.map(h => supabaseClient.from('habits').update({
                            moments: ['24/7'],
                            days: [1, 2, 3, 4, 5, 6, 0]
                        }).eq('id', h.id)));
                    }
                }
            }

            const { data: logs, error: logsErr } = await supabaseClient.from('habit_logs').select('id, user_id, habit_name, text_comment, image_url, privacy, created_at').eq('user_id', currentUser.id);
            if (!logsErr && Array.isArray(logs)) {
                const fetchedIdSet = new Set(logs.map(l => String(l.id)));
                // No vaciar historialAgrupado hasta el swap atómico: si se limpia antes del
                // await de likes/comments, un desellado concurrente no encuentra el log
                // (sin tombstone) y el sync reintroduce el registro + el contador semanal.
                const logIds = logs.map(l => l.id).filter(id => id && !selloIdEstaEliminado(id));
                let allLikes = [];
                let allComments = [];
                if (logIds.length > 0) {
                    try {
                    const [likesRes, commentsRes] = await Promise.all([
                        supabaseClient.from('likes').select('id, log_id, user_id').in('log_id', logIds),
                        supabaseClient.from('comments').select('id, user_id, log_id, text_comment, profiles(username)').in('log_id', logIds).order('created_at', { ascending: true })
                    ]);
                    allLikes = likesRes.data || [];
                    allComments = commentsRes.data || [];
                    } catch (e) {}
                }
                const sellosPendientes = [];
                Object.keys(historialAgrupado || {}).forEach(k => {
                    (historialAgrupado[k] || []).forEach(r => {
                        if (!r || !r.id) return;
                        const sid = String(r.id);
                        if (selloIdEstaEliminado(sid)) return;
                        // Solo conservar sellos locales o recién escritos; no rehidratar borrados ausentes en servidor.
                        if (esIdSelloLocal(sid) || sellosIdsRecientes.has(sid)) sellosPendientes.push(r);
                    });
                });
                const nuevoHistorial = {};
                for (const l of logs) {
                    if (selloIdEstaEliminado(l.id)) continue;
                    const habitName = cleanHabitName(l.habit_name);
                    if (!nuevoHistorial[habitName]) nuevoHistorial[habitName] = [];
                    const dObj = new Date(l.created_at || Date.now());
                    const hx = habitoPorNombre(habitName);
                    const logLikes = allLikes.filter(lk => lk.log_id === l.id);
                    const commentsData = allComments.filter(cm => cm.log_id === l.id);
                    const comsFormatted = commentsData.map(c => ({ id: c.id, user_id: c.user_id, autor: c.profiles ? c.profiles.username : 'Usuario', texto: c.text_comment }));

                    const reg = {
                        id: l.id,
                        user_id: l.user_id,
                        nombre: habitName,
                        habitId: (hx && hx.id) || null,
                        dia: claveDiaLocal(dObj),
                        fecha: dObj.toLocaleDateString(),
                        dateObj: dObj,
                        timestamp: dObj.getTime(),
                        texto: l.text_comment,
                        score: null,
                        imagenes: (l.image_url && l.image_url.trim() !== '') ? [l.image_url] : [],
                        image_url: l.image_url,
                        privacidad: l.privacy || 'seguidores',
                        likes: logLikes.length,
                        likedByMe: currentUser ? logLikes.some(lk => lk.user_id === currentUser.id) : false,
                        comentarios: comsFormatted
                    };
                    nuevoHistorial[habitName].push(reg);
                }
                sellosPendientes.forEach(reg => {
                    if (!reg || !reg.id || selloIdEstaEliminado(reg.id)) return;
                    const habitName = cleanHabitName(reg.nombre || '');
                    if (!habitName) return;
                    if (!nuevoHistorial[habitName]) nuevoHistorial[habitName] = [];
                    if (nuevoHistorial[habitName].some(x => String(x.id) === String(reg.id))) return;
                    nuevoHistorial[habitName].unshift(reg);
                });
                Object.keys(nuevoHistorial).forEach(k => {
                    nuevoHistorial[k].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                });
                historialAgrupado = nuevoHistorial;
                window.registrosGlobalMap = window.registrosGlobalMap || {};
                Object.keys(window.registrosGlobalMap).forEach(id => {
                    if (selloIdEstaEliminado(id)) delete window.registrosGlobalMap[id];
                });
                Object.keys(nuevoHistorial).forEach(k => {
                    (nuevoHistorial[k] || []).forEach(reg => {
                        if (reg && reg.id) window.registrosGlobalMap[reg.id] = reg;
                    });
                });
                reconciliarIdsSellosTrasSync(fetchedIdSet);
            }

            const pendientesDeseos = (misDeseos || []).filter(d => d && esIdDeseoLocal(d.id));
            let wishes = null;
            let wishesErr = null;
            {
                const w1 = await supabaseClient.from('wishes').select('id, title, completed, comment, image_url, score, created_at, completed_at, due_date').eq('user_id', currentUser.id);
                wishes = w1.data;
                wishesErr = w1.error;
                if (wishesErr && errorEsRecursoAusente(wishesErr)) {
                    cloudWishesDueDate = false;
                    const w2 = await supabaseClient.from('wishes').select('id, title, completed, comment, image_url, score, created_at, completed_at').eq('user_id', currentUser.id);
                    wishes = w2.data;
                    wishesErr = w2.error;
                }
            }
            if (!wishesErr && Array.isArray(wishes)) {
                misDeseos = deduplicarDeseos(wishes.map(deseoDesdeFila));
                pendientesDeseos.forEach(p => {
                    const nombre = cleanHabitName(p.nombre);
                    if (!misDeseos.some(d => cleanHabitName(d.nombre) === nombre)) misDeseos.push(p);
                });
                misDeseos = deduplicarDeseos(misDeseos);
            }

            const firma = firmaEstadoDiario();
            const cambio = firma !== ultimaFirmaDiario;
            ultimaFirmaDiario = firma;
            guardarEstadoLocal();
            if (cambio || opts.hidratarLocal !== false) {
            recordarSelloSiYaExiste();
            renderizarMiRutina();
            renderizarListaDeseos();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            actualizarEstadisticasPerfil();
            } else if (currentIndex === 3) {
                renderizarTabHistorial();
            }
            if (opts.hidratarLocal !== false) {
                registrarTokenPushEnServidor();
                consumirChatPendienteDeNotificacion();
                arrancarPermisoNotificacionesSiToca();
                migrarSellosLocalesSiHaceFalta();
                programarAlarmasNativasHabitos();
            }
            marcarSyncDiario();
            } finally {
                diarioSyncInFlight = false;
                if (recargaDiarioPendiente) {
                    recargaDiarioPendiente = false;
                    solicitarRecargaDiario();
                }
            }
        }


        function sincronizarFiltroVisualActivo() {
            const pills = document.querySelectorAll('.time-filters .filter-pill');
            pills.forEach(p => {
                if (p.textContent.includes(activeFilter) || (activeFilter === 'TODOS' && p.textContent.includes('TODOS'))) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
        }

        function renderCalendarStrip(opts) {
            const track = document.getElementById('calendar-strip-track');
            const viewport = document.getElementById('calendar-strip-viewport');
            if (!track) return;
            const sel = inicioDiaLocal(selectedDate);
            if (opts && opts.resetOffset) calStripOffset = 0;
            if (!calendarStripWeekStart) calendarStripWeekStart = inicioSemanaPreferida(sel);
            const vwNow = (viewport && viewport.clientWidth) || 0;
            if (calStripVwGuardado && vwNow && Math.abs(calStripVwGuardado - vwNow) > 1) {
                calStripOffset *= vwNow / calStripVwGuardado;
            }
            if (vwNow) calStripVwGuardado = vwNow;
            compactarOffsetCarrusel();
            const monday = inicioSemanaPreferida(calendarStripWeekStart);
            calendarStripWeekStart = monday;
            track.innerHTML = '';
            track.appendChild(crearTiraSemanaCalendario(sumarDiasLocal(monday, -7)));
            const actual = crearTiraSemanaCalendario(monday);
            actual.id = 'calendar-strip';
            track.appendChild(actual);
            track.appendChild(crearTiraSemanaCalendario(sumarDiasLocal(monday, 7)));
            const vw = (viewport && viewport.clientWidth) || track.parentElement.clientWidth || 0;
            calStripVwGuardado = vw;
            ponerCarruselCalendario(-vw + calStripOffset, false);
            requestAnimationFrame(() => pintarBotonVolverHoy());
            aplicarTemaGlobalHabitos(currentThemeHue);
        }

        function compactarOffsetCarrusel() {
            const vw = anchoCarruselCalendario();
            if (!vw || !calendarStripWeekStart) return;
            const limite = vw * 0.82;
            while (calStripOffset > limite) {
                calendarStripWeekStart = sumarDiasLocal(inicioSemanaPreferida(calendarStripWeekStart), -7);
                calStripOffset -= vw;
            }
            while (calStripOffset < -limite) {
                calendarStripWeekStart = sumarDiasLocal(inicioSemanaPreferida(calendarStripWeekStart), 7);
                calStripOffset += vw;
            }
        }

        function semanaVisibleCalendario() {
            const vw = anchoCarruselCalendario() || 1;
            const shift = Math.round(-calStripOffset / vw);
            return sumarDiasLocal(inicioSemanaPreferida(calendarStripWeekStart || selectedDate || new Date()), shift * 7);
        }

        function pintarBotonVolverHoy() {
            const hoyBtn = document.getElementById('calendar-hoy-btn');
            const viewport = document.getElementById('calendar-strip-viewport');
            if (!hoyBtn || !viewport) return;
            const vp = viewport.getBoundingClientRect();
            const cells = viewport.querySelectorAll('.cal-day.is-today');
            let visible = false;
            let todayRight = null;
            cells.forEach((cell) => {
                const r = cell.getBoundingClientRect();
                if (r.width <= 0 && r.height <= 0) return;
                todayRight = r.right;
                const overlap = Math.min(r.right, vp.right) - Math.max(r.left, vp.left);
                if (overlap > 1) visible = true;
            });
            hoyBtn.classList.toggle('hidden', visible);
            if (visible) return;
            let isAhead;
            if (todayRight != null) {
                isAhead = todayRight <= vp.left + 1;
            } else {
                const todayWeek = inicioSemanaPreferida(new Date());
                isAhead = semanaVisibleCalendario().getTime() > todayWeek.getTime();
            }
            hoyBtn.classList.toggle('is-ahead', isAhead);
            hoyBtn.classList.toggle('is-behind', !isAhead);
        }

        function crearTiraSemanaCalendario(weekStart) {
            const strip = document.createElement('div');
            strip.className = 'calendar-strip';
            const hoy = inicioDiaLocal(new Date());
            const sel = inicioDiaLocal(selectedDate);
            const monday = inicioSemanaPreferida(weekStart);
            const daysShort = etiquetasSemanaStrip();
            for (let i = 0; i < 7; i++) {
                const d = sumarDiasLocal(monday, i);
                const isSelected = claveDiaLocal(d) === claveDiaLocal(sel);
                const isRealToday = claveDiaLocal(d) === claveDiaLocal(hoy);
                const isFuture = esFechaFutura(d);
                const dayLabel = isRealToday ? 'HOY' : daysShort[i];
                const dayDiv = document.createElement('div');
                dayDiv.className = `cal-day${isSelected ? ' active' : ''}${isRealToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`;
                dayDiv.innerHTML = `<span>${dayLabel}</span><span class="num">${d.getDate()}</span>`;
                dayDiv._fecha = d;
                dayDiv.onclick = (e) => {
                    e.stopPropagation();
                    seleccionarDiaCalendario(dayDiv);
                };
                strip.appendChild(dayDiv);
            }
            return strip;
        }

        function anchoCarruselCalendario() {
            const viewport = document.getElementById('calendar-strip-viewport');
            return (viewport && viewport.clientWidth) || 0;
        }

        function ponerCarruselCalendario(px, animar) {
            const track = document.getElementById('calendar-strip-track');
            if (!track) return;
            track.style.transition = animar ? 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
            track.style.transform = 'translateX(' + px + 'px)';
        }

        function animarCarruselCalendario(dir, weekDestino) {
            const track = document.getElementById('calendar-strip-track');
            const vw = anchoCarruselCalendario();
            if (!track || !vw || calStripAnimando) {
                calendarStripWeekStart = weekDestino;
                calStripOffset = 0;
                renderCalendarStrip();
                renderizarMiRutina();
                return;
            }
            calStripAnimando = true;
            const strips = track.querySelectorAll('.calendar-strip');
            if (dir < 0 && strips[0]) track.replaceChild(crearTiraSemanaCalendario(weekDestino), strips[0]);
            else if (dir > 0 && strips[2]) track.replaceChild(crearTiraSemanaCalendario(weekDestino), strips[2]);
            const destinoPx = dir > 0 ? -2 * vw : 0;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    ponerCarruselCalendario(destinoPx, true);
                });
            });
            let listo = false;
            const fin = (ev) => {
                if (listo) return;
                if (ev && ev.target && ev.target !== track) return;
                listo = true;
                track.removeEventListener('transitionend', fin);
                calendarStripWeekStart = inicioSemanaPreferida(weekDestino);
                calStripOffset = 0;
                calStripAnimando = false;
                renderCalendarStrip();
                renderizarMiRutina();
            };
            track.addEventListener('transitionend', fin);
            setTimeout(fin, 450);
        }

        function volverAlDiaActual() {
            const today = new Date();
            const todayWeek = inicioSemanaPreferida(today);
            const cur = calendarStripWeekStart || inicioSemanaPreferida(selectedDate || today);
            selectedDate = today;
            const misma = claveDiaLocal(todayWeek) === claveDiaLocal(cur);
            if (misma && Math.abs(calStripOffset) < 8) {
                calStripOffset = 0;
                renderCalendarStrip();
                renderizarMiRutina();
                return;
            }
            if (misma) {
                const vw = anchoCarruselCalendario();
                calStripAnimando = true;
                ponerCarruselCalendario(-vw, true);
                setTimeout(() => {
                    calStripOffset = 0;
                    calStripAnimando = false;
                    renderCalendarStrip();
                    renderizarMiRutina();
                }, 340);
                return;
            }
            const dir = todayWeek.getTime() < cur.getTime() ? -1 : 1;
            animarCarruselCalendario(dir, todayWeek);
        }

        let calStripDidSwipe = false;
        let calStripAnimando = false;
        let calStripDidTap = false;

        // B-33 · selección de día fiable. El pointer capture del carrusel
        // retargetea el click al viewport (el día nunca lo recibe), así que
        // la selección se resuelve aquí con la fecha guardada en la celda.
        function seleccionarDiaCalendario(dayDiv) {
            if (calStripDidSwipe || calStripAnimando || calStripDidTap) return;
            const d = dayDiv && dayDiv._fecha;
            if (!d) return;
            selectedDate = new Date(d);
            calStripDidTap = true;
            setTimeout(function () { calStripDidTap = false; }, 350);
            renderCalendarStrip();
            renderizarMiRutina();
        }

        function inicializarGestoCalendarioStrip() {
            const viewport = document.getElementById('calendar-strip-viewport');
            if (!viewport || viewport._awakeCalSwipe) return;
            viewport._awakeCalSwipe = true;
            let startX = 0;
            let startY = 0;
            let startOffset = 0;
            let tracking = false;
            let locked = null;
            let pointerId = null;
            const soltar = (e) => {
                if (!tracking) return;
                if (pointerId != null && e.pointerId != null && e.pointerId !== pointerId) return;
                tracking = false;
                viewport.classList.remove('is-dragging');
                const dx = (e && e.clientX != null ? e.clientX : startX) - startX;
                const dy = (e && e.clientY != null ? e.clientY : startY) - startY;
                const eje = locked;
                locked = null;
                pointerId = null;
                if (eje !== 'x') {
                    calStripOffset = startOffset;
                    const vw = anchoCarruselCalendario();
                    ponerCarruselCalendario(-vw + calStripOffset, false);
                    // Toque/clic limpio: el pointer capture retargetea el click al
                    // viewport, así que la selección se resuelve aquí mismo.
                    if (Math.abs(dx) <= 10 && Math.abs(dy) <= 10) {
                        const x = e && e.clientX != null ? e.clientX : startX;
                        const y = e && e.clientY != null ? e.clientY : startY;
                        const stack = document.elementsFromPoint(x, y) || [];
                        const day = stack.find((el) => el.classList && el.classList.contains('cal-day'));
                        if (day) seleccionarDiaCalendario(day);
                    }
                    return;
                }
                if (Math.abs(dx) > 10) {
                    calStripDidSwipe = true;
                    setTimeout(function () { calStripDidSwipe = false; }, 280);
                }
                compactarOffsetCarrusel();
                renderCalendarStrip();
            };
            viewport.addEventListener('pointerdown', (e) => {
                if (calStripAnimando) return;
                if (e.button != null && e.button !== 0) return;
                tracking = true;
                locked = null;
                pointerId = e.pointerId;
                startX = e.clientX;
                startY = e.clientY;
                startOffset = calStripOffset;
                try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
            });
            viewport.addEventListener('pointermove', (e) => {
                if (!tracking || calStripAnimando) return;
                if (pointerId != null && e.pointerId !== pointerId) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (!locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                    locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
                    if (locked === 'x') viewport.classList.add('is-dragging');
                }
                if (locked === 'x') {
                    if (e.pointerType !== 'mouse' && e.cancelable) e.preventDefault();
                    calStripOffset = startOffset + dx;
                    const weekAntes = calendarStripWeekStart ? claveDiaLocal(calendarStripWeekStart) : '';
                    compactarOffsetCarrusel();
                    if (calendarStripWeekStart && claveDiaLocal(calendarStripWeekStart) !== weekAntes) {
                        renderCalendarStrip();
                        startOffset = calStripOffset - dx;
                    } else {
                        const vw = anchoCarruselCalendario();
                        ponerCarruselCalendario(-vw + calStripOffset, false);
                    }
                    pintarBotonVolverHoy();
                }
            }, { passive: false });
            viewport.addEventListener('pointerup', soltar);
            viewport.addEventListener('pointercancel', (e) => {
                if (pointerId != null && e.pointerId != null && e.pointerId !== pointerId) return;
                tracking = false;
                locked = null;
                pointerId = null;
                viewport.classList.remove('is-dragging');
                calStripOffset = startOffset;
                const vw = anchoCarruselCalendario();
                ponerCarruselCalendario(-vw + calStripOffset, false);
                pintarBotonVolverHoy();
            });
        }

        function setCompletionPrivacy(priv, el) {
            currentCompletionPrivacy = priv;
            const container = document.getElementById('completion-privacy-selector');
            if(container) {
                container.querySelectorAll('.config-pill').forEach(p => p.classList.remove('active'));
            }
            if(el) el.classList.add('active');
        }

        function setAccountPrivacy(priv, el) {
            accountPrivacy = priv;
            const container = document.getElementById('modal-account-privacy-selector');
            if(container) {
                container.querySelectorAll('.config-pill').forEach(p => p.classList.remove('active'));
            }
            if(el) el.classList.add('active');
        }


        function guardarPrefsFeedback() {
            try { localStorage.setItem(FEEDBACK_PREFS_KEY, JSON.stringify(prefsFeedback)); } catch (e) {}
        }

        function actualizarMuestraTemaAjustes() {
            const dot = document.getElementById('settings-theme-swatch');
            if (!dot) return;
            dot.style.background = currentThemeHue == null ? '#c8cdd6' : `hsl(${currentThemeHue}, 72%, 58%)`;
        }

        function marcarSyncDiario() {
            lastDiarioSyncAt = Date.now();
            try { localStorage.setItem(AWAKE_LAST_SYNC_KEY, String(lastDiarioSyncAt)); } catch (e) {}
        }

        function sincronizarPanelAjustes() {
            const rng = document.getElementById('range-sonido');
            const pct = document.getElementById('sonido-pct-label');
            const v = document.getElementById('switch-vibracion');
            const ios = document.getElementById('switch-ios-adapt');
            if (rng) rng.value = String(prefsFeedback.sonido ? (prefsFeedback.volumen || 0) : 0);
            if (pct) pct.textContent = (prefsFeedback.sonido && prefsFeedback.volumen > 0) ? (prefsFeedback.volumen + '%') : '0%';
            pintarRellenoVolumen();
            if (v) v.setAttribute('aria-checked', prefsFeedback.vibracion ? 'true' : 'false');
            if (ios) ios.setAttribute('aria-checked', prefsIosAdapt ? 'true' : 'false');
            const dm = document.getElementById('switch-digest-manana');
            const dt = document.getElementById('switch-digest-tarde');
            const dn = document.getElementById('switch-digest-noche');
            const dr = document.getElementById('switch-digest-riesgo');
            const ds = document.getElementById('switch-digest-resumen');
            if (dm) dm.setAttribute('aria-checked', ritualPrefs.digestManana ? 'true' : 'false');
            if (dt) dt.setAttribute('aria-checked', ritualPrefs.digestTarde ? 'true' : 'false');
            if (dn) dn.setAttribute('aria-checked', ritualPrefs.digestNoche ? 'true' : 'false');
            if (dr) dr.setAttribute('aria-checked', ritualPrefs.riesgoActivo ? 'true' : 'false');
            if (ds) ds.setAttribute('aria-checked', ritualPrefs.resumenActivo ? 'true' : 'false');
            const hm = document.getElementById('digest-hora-manana');
            const ht = document.getElementById('digest-hora-tarde');
            const hn = document.getElementById('digest-hora-noche');
            const hr = document.getElementById('digest-hora-riesgo');
            const hs = document.getElementById('digest-hora-resumen');
            if (hm) hm.textContent = ritualPrefs.horaManana || '08:00';
            if (ht) ht.textContent = ritualPrefs.horaTarde || '15:00';
            if (hn) hn.textContent = ritualPrefs.horaNoche || '21:30';
            if (hr) hr.textContent = ritualPrefs.horaRiesgo || '18:00';
            if (hs) hs.textContent = ritualPrefs.horaResumen || '20:00';
            actualizarMuestraTemaAjustes();
        }

        function aplicarAdaptacionIOS() {
            document.documentElement.classList.toggle('adaptacion-ios', !!prefsIosAdapt);
            const sw = document.getElementById('switch-ios-adapt');
            if (sw) sw.setAttribute('aria-checked', prefsIosAdapt ? 'true' : 'false');
            actualizarBotonAtrasIOS();
        }

        function alternarAdaptacionIOS() {
            prefsIosAdapt = !prefsIosAdapt;
            try { localStorage.setItem(IOS_ADAPT_KEY, prefsIosAdapt ? '1' : '0'); } catch (e) {}
            aplicarAdaptacionIOS();
            if (prefsIosAdapt) pulsoHaptico(16);
        }

        function alternarPrefFeedback(clave) {
            if (clave !== 'sonido' && clave !== 'vibracion') return;
            prefsFeedback[clave] = !prefsFeedback[clave];
            if (clave === 'sonido') {
                // El switch clásico ya no existe: se mantiene la función para
                // compatibilidad, sincronizando con el nivel de volumen (0 = off).
                prefsFeedback.volumen = prefsFeedback.sonido ? Math.max(prefsFeedback.volumen || 1, 1) : 0;
            }
            guardarPrefsFeedback();
            sincronizarPanelAjustes();
            if (clave === 'sonido' && prefsFeedback.sonido) reproducirSonido('ajustes_activar');
            if (clave === 'vibracion' && prefsFeedback.vibracion) pulsoHaptico(16);
        }

        // Intensidad de sonido 0-100 %: 0 = apagado (como el antiguo switch off),
        // 100 % = sonido al máximo (como el antiguo switch on).
        function cambiarVolumenSonido(v) {
            const nivel = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
            prefsFeedback.volumen = nivel;
            prefsFeedback.sonido = nivel > 0;
            guardarPrefsFeedback();
            sincronizarPanelAjustes();
        }

        function pintarRellenoVolumen() {
            const rng = document.getElementById('range-sonido');
            if (!rng) return;
            const pct = prefsFeedback.sonido ? (prefsFeedback.volumen || 0) : 0;
            rng.style.setProperty('--vol-pct', pct + '%');
        }

        function confirmarVolumenSonido() {
            // Al soltar el slider, reproducir el click a modo de muestra para que
            // el usuario escuche la intensidad elegida (solo si hay sonido).
            if (prefsFeedback.sonido && prefsFeedback.volumen > 0) {
                try { reproducirSonido('ajustes_activar'); } catch (e) {}
            }
        }

        let ajustesPendienteRetorno = false;
        let perfilPendienteRetorno = false;

        // B-53 (ajuste): al abrir el menú siempre se muestra el índice. La
        // última sección visitada NO se recuerda entre aperturas.

        function abrirSeccionAjustes(seccion) {
            const view = document.getElementById('settings-view-' + seccion);
            if (!view) return;
            const idx = document.getElementById('settings-index');
            if (idx) idx.classList.remove('active');
            document.querySelectorAll('#settings-modal .settings-view').forEach(v => v.classList.remove('active'));
            view.classList.add('active');
            const titulo = document.getElementById('settings-header-title');
            const btnAtras = document.getElementById('settings-back-btn');
            if (titulo) titulo.textContent = view.getAttribute('data-titulo') || 'Ajustes';
            if (btnAtras) btnAtras.style.display = '';
            sincronizarPanelAjustes();
        }

        function volverIndiceAjustes() {
            document.querySelectorAll('#settings-modal .settings-view').forEach(v => v.classList.remove('active'));
            const idx = document.getElementById('settings-index');
            if (idx) idx.classList.add('active');
            const titulo = document.getElementById('settings-header-title');
            const btnAtras = document.getElementById('settings-back-btn');
            if (titulo) titulo.textContent = 'Ajustes';
            if (btnAtras) btnAtras.style.display = 'none';
        }

        function setMenuHamburguesaAbierto(abierto) {
            const settings = document.getElementById('settings-modal');
            const btn = document.getElementById('btn-hamburger');
            if (settings) {
                settings.classList.toggle('active', !!abierto);
                if (abierto) {
                    volverIndiceAjustes();
                    sincronizarPanelAjustes();
                } else {
                    cerrarAwakePick();
                }
            }
            if (btn) {
                btn.classList.toggle('is-open', !!abierto);
                btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
            }
        }

        function ocultarAjustesAlAbrirCapa() {
            const settings = document.getElementById('settings-modal');
            if (settings && settings.classList.contains('active')) {
                ajustesPendienteRetorno = true;
                setMenuHamburguesaAbierto(false);
            }
        }

        function volverAjustesSiPendiente() {
            if (!ajustesPendienteRetorno) return;
            ajustesPendienteRetorno = false;
            setMenuHamburguesaAbierto(true);
        }

        function ocultarPerfilAlAbrirRecorte() {
            const perfil = document.getElementById('edit-profile-modal');
            if (perfil && perfil.classList.contains('active')) {
                perfilPendienteRetorno = true;
                perfil.classList.remove('active');
            }
        }

        function volverPerfilSiPendiente() {
            if (!perfilPendienteRetorno) return;
            perfilPendienteRetorno = false;
            const perfil = document.getElementById('edit-profile-modal');
            if (perfil) perfil.classList.add('active');
        }

        function cerrarModalHijoAjustes(id) {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
            volverAjustesSiPendiente();
        }

        function toggleHamburgerMenu(event) {
            event.stopPropagation();
            const settings = document.getElementById('settings-modal');
            setMenuHamburguesaAbierto(!(settings && settings.classList.contains('active')));
        }

        function pintarEtiquetaAdjunto(input) {
            const zone = input && input.closest ? input.closest('.attach-image-label') : null;
            if (!zone) return;
            const titulo = zone.querySelector('.attach-image-title');
            const hint = zone.querySelector('.attach-image-hint');
            const hay = !!(input.files && input.files[0]);
            const esDeseo = input.id === 'wish-completion-image';
            if (titulo) titulo.textContent = hay ? input.files[0].name : (esDeseo ? 'Adjuntar imagen al deseo' : 'Adjuntar imagen a la tarea');
            if (hint) hint.textContent = hay ? 'Foto lista · toca para cambiarla' : 'Toca para elegir o tomar una foto';
            zone.classList.toggle('has-file', hay);
        }

        document.addEventListener('change', function onCambioAdjunto(e) {
            const t = e.target;
            if (t && t.id && (t.id === 'completion-image' || t.id === 'wish-completion-image')) {
                pintarEtiquetaAdjunto(t);
            }
        });

        function cerrarMenusContextuales(event) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            if (!event.target.closest('.streak-ring')) ocultarAvisoRacha();
        }

        function abrirModalAuth() {
            setMenuHamburguesaAbierto(false);
            document.getElementById('user-auth-email').value = '';
            document.getElementById('user-auth-password').value = '';
            mostrarErrorAuth('');
            cambiarAuthTab('login');
            document.getElementById('auth-modal').classList.add('active');
        }

        function abrirModalTema() {
            ocultarAjustesAlAbrirCapa();
            document.getElementById('theme-modal').classList.add('active');
            setTimeout(() => {
                dibujarRuedaColor();
                inicializarRuedaColorInteractiva();
                sincronizarPreviewTema();
            }, 50);
        }

        function dibujarRuedaColor() {
            const canvasColor = document.getElementById('color-wheel-canvas');
            if (!canvasColor) return;
            const cssSize = 280;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const size = Math.round(cssSize * dpr);
            if (canvasColor.width !== size) {
                canvasColor.width = size;
                canvasColor.height = size;
            }
            const ctxC = canvasColor.getContext('2d');
            const radius = size / 2;
            const inner = radius * 0.62;
            const outer = radius * 0.98;
            const edge = Math.max(1.2, 1.4 * dpr);
            const imgData = ctxC.createImageData(size, size);
            const data = imgData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dx = x - radius;
                    const dy = y - radius;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const index = (y * size + x) * 4;
                    if (dist > outer || dist < inner) {
                        data[index + 3] = 0;
                        continue;
                    }
                    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    if (angle < 0) angle += 360;
                    const rgb = hslToRgb(angle, 88, 54);
                    let alpha = 255;
                    if (dist > outer - edge) alpha = Math.round(255 * Math.max(0, (outer - dist) / edge));
                    if (dist < inner + edge) alpha = Math.min(alpha, Math.round(255 * Math.max(0, (dist - inner) / edge)));
                    data[index] = rgb[0];
                    data[index + 1] = rgb[1];
                    data[index + 2] = rgb[2];
                    data[index + 3] = alpha;
                }
            }
            ctxC.putImageData(imgData, 0, 0);
        }

        function hslToRgb(h, s, l) {
            s /= 100;
            l /= 100;
            let c = (1 - Math.abs(2 * l - 1)) * s,
                x = c * (1 - Math.abs((h / 60) % 2 - 1)),
                m = l - c/2,
                r = 0, g = 0, b = 0;

            if (0 <= h && h < 60) { r = c; g = x; b = 0; }
            else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
            else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
            else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
            else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
            else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
            
            return [
                Math.round((r + m) * 255),
                Math.round((g + m) * 255),
                Math.round((b + m) * 255)
            ];
        }

        function sincronizarPreviewTema() {
            const hexText = document.getElementById('color-hex-text');
            const swatch = document.getElementById('theme-wheel-core-swatch');
            const thumb = document.getElementById('theme-wheel-thumb');
            const hue = currentThemeHue;
            if (hue == null) {
                if (hexText) hexText.textContent = 'Tema por defecto';
                if (swatch) swatch.style.background = 'rgba(255,255,255,0.12)';
                if (thumb) thumb.style.opacity = '0';
                return;
            }
            if (hexText) hexText.textContent = `Tono ${hue}°`;
            if (swatch) swatch.style.background = `hsl(${hue}, 78%, 52%)`;
            if (thumb) {
                const rad = hue * Math.PI / 180;
                const rPct = 40;
                thumb.style.opacity = '1';
                thumb.style.left = `${50 + Math.cos(rad) * rPct}%`;
                thumb.style.top = `${50 + Math.sin(rad) * rPct}%`;
                thumb.style.background = `hsl(${hue}, 88%, 54%)`;
            }
        }

        function inicializarRuedaColorInteractiva() {
            const wrap = document.getElementById('color-wheel-container');
            if (!wrap) return;

            const pickFromPoint = (clientX, clientY) => {
                const rect = wrap.getBoundingClientRect();
                const x = clientX - rect.left - rect.width / 2;
                const y = clientY - rect.top - rect.height / 2;
                let angle = Math.atan2(y, x) * (180 / Math.PI);
                if (angle < 0) angle += 360;
                currentThemeHue = Math.round(angle);
                sincronizarPreviewTema();
                aplicarTemaGlobalHabitos(currentThemeHue);
            };

            if (wrap.dataset.wheelReady === '1') return;
            wrap.dataset.wheelReady = '1';

            wrap.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                wrap.setPointerCapture(e.pointerId);
                pickFromPoint(e.clientX, e.clientY);
            });
            wrap.addEventListener('pointermove', (e) => {
                if (!wrap.hasPointerCapture(e.pointerId)) return;
                e.preventDefault();
                pickFromPoint(e.clientX, e.clientY);
            });
        }

        function sincronizarThemeColorMeta(hue) {
            try {
                const hex = hue == null
                    ? '#1a6b63'
                    : 'hsl(' + hue + ', 50%, 34%)';
                let meta = document.querySelector('meta[name="theme-color"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    document.head.appendChild(meta);
                }
                meta.content = hex;
            } catch (e) {}
        }

        function aplicarTemaGlobalHabitos(hue) {
            let styleEl = document.getElementById('dynamic-habit-theme');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-habit-theme';
                document.head.appendChild(styleEl);
            }
            
            sincronizarThemeColorMeta(hue);
            if (hue === null) {
                styleEl.textContent = '';
                actualizarMuestraTemaAjustes();
                return;
            }

            styleEl.textContent = `
                :root {
                    --border-metal: hsl(${hue}, 50%, 38%) !important;
                    --border-highlight: hsl(${hue}, 80%, 65%) !important;
                    --accent-hue: ${hue} !important;
                }
                .search-input, .custom-dropdown-trigger, .ig-btn-action,
                .catalog-item:not(.catalog-crear-mio), .nat-card,
                .modal-card, .modal-card-full:not(.habit-ficha-shell):not(.dia-sellado-shell):not(.sello-timer-shell):not(.permisos-ritual-shell):not(.sheet-lean):not(.awake-pick-shell):not(.settings-shell),
                .ig-inbox-row, .bg-option-card, .config-pill, .chat-bubble.them,
                .ig-composer-pill, .ig-rec-bar, .chat-reply-banner,
                .dropdown-menu, .habit-context-menu {
                    border-color: hsl(${hue}, 55%, 42%) !important;
                    border-top-color: hsl(${hue}, 55%, 42%) !important;
                    border-bottom-color: hsl(${hue}, 55%, 42%) !important;
                    box-shadow: 0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.12) !important;
                }
                #settings-modal .settings-group {
                    border-left: none !important;
                    border-right: none !important;
                    border-top-color: hsl(${hue}, 40%, 32%) !important;
                    border-bottom-color: hsl(${hue}, 40%, 32%) !important;
                    box-shadow: none !important;
                }
                .block-rect-card {
                    border-color: hsl(${hue}, 55%, 42%) !important;
                    box-shadow: 0 10px 24px rgba(0,0,0,0.28), inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.2) !important;
                }
                .block-rect-card:hover {
                    border-color: hsl(${hue}, 80%, 65%) !important;
                }
                .block-rect-art {
                    border-color: hsl(${hue}, 50%, 36%) !important;
                    background: hsla(${hue}, 40%, 16%, 0.55) !important;
                }
                .catalog-item.catalog-crear-mio {
                    background: linear-gradient(135deg, #05070c 0%, hsl(${hue}, 42%, 11%) 46%, hsl(${hue}, 55%, 22%) 100%) !important;
                    border-color: hsl(${hue}, 80%, 65%) !important;
                    box-shadow: 0 8px 22px rgba(0,0,0,0.42), inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.18) !important;
                }
                .catalog-item.catalog-crear-mio:hover {
                    background: linear-gradient(135deg, #080b12 0%, hsl(${hue}, 48%, 14%) 46%, hsl(${hue}, 58%, 26%) 100%) !important;
                }
                .catalog-item.catalog-crear-mio .catalog-crear-plus {
                    background: hsla(${hue}, 50%, 16%, 0.9) !important;
                    border-color: hsl(${hue}, 80%, 65%) !important;
                    color: hsl(${hue}, 82%, 78%) !important;
                }
                .bg-option-card.active-bg {
                    border-color: hsl(${hue}, 80%, 65%) !important;
                    box-shadow: 0 0 0 1px hsla(${hue}, 80%, 65%, 0.55), 0 0 28px hsla(${hue}, 100%, 50%, 0.28), 0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.12) !important;
                }
                .horizontal-tabs {
                    border-top-color: hsl(${hue}, 55%, 42%) !important;
                    border-bottom-color: hsl(${hue}, 55%, 42%) !important;
                    border-left: none !important;
                    border-right: none !important;
                    box-shadow: none !important;
                }
                .tab-item.active, .profile-subtab.active, .ficha-range-btn.active {
                    border-bottom-color: hsl(${hue}, 80%, 65%) !important;
                }
                .tab-ink {
                    background: hsl(${hue}, 80%, 65%);
                }
                .filter-pill.active, .social-section-tab.filter-pill.active, .cal-day.active, .config-pill.active, .day-btn.active, .history-view-btn.active {
                    background: linear-gradient(135deg, hsl(${hue}, 55%, 28%) 0%, hsl(${hue}, 70%, 14%) 100%) !important;
                    border: 1px solid hsl(${hue}, 80%, 65%) !important;
                    box-shadow: 0 0 6px hsla(${hue}, 100%, 55%, 0.22) !important;
                }
                .calendar-hoy-btn {
                    background: linear-gradient(135deg, hsla(${hue}, 42%, 16%, 0.97) 0%, hsla(${hue}, 52%, 7%, 0.99) 100%) !important;
                    border-color: hsl(${hue}, 80%, 65%) !important;
                    box-shadow: 0 8px 22px rgba(0,0,0,0.62), 0 0 12px hsla(${hue}, 100%, 55%, 0.28), inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.1) !important;
                }
                .ficha-bar-fill {
                    background: hsl(${hue}, 72%, 52%) !important;
                }
                .settings-switch[aria-checked="true"] {
                    background: linear-gradient(135deg, hsl(${hue}, 55%, 28%) 0%, hsl(${hue}, 70%, 14%) 100%) !important;
                    border-color: hsl(${hue}, 80%, 65%) !important;
                }
                .empty-state-orb {
                    border-color: hsl(${hue}, 80%, 60%) !important;
                    box-shadow: inset 0 1px 0 hsla(${hue}, 90%, 70%, 0.14), 0 0 8px hsla(${hue}, 100%, 50%, 0.1) !important;
                }
                .add-item-btn.is-first {
                    border-color: hsl(${hue}, 80%, 60%) !important;
                    --glow-accent: ${hue}, 95%, 62%;
                }
                .ig-chat-camera-btn, .ig-voice-play, .ptr-spinner-wrap {
                    border-color: hsl(${hue}, 80%, 60%) !important;
                    box-shadow: 0 6px 16px hsla(${hue}, 100%, 50%, 0.14) !important;
                }
                .chat-bubble.me {
                    background: linear-gradient(135deg, hsl(${hue}, 55%, 28%) 0%, hsl(${hue}, 70%, 14%) 100%) !important;
                    border-color: hsl(${hue}, 85%, 62%) !important;
                    box-shadow: 0 0 14px hsla(${hue}, 100%, 50%, 0.2) !important;
                }
                .chat-bubble.them, .ig-composer-pill, .ig-rec-bar, .chat-reply-banner, .ig-inbox-avatar, .ig-chat-header-avatar, .chat-bubble-img {
                    border-color: hsl(${hue}, 55%, 42%) !important;
                }
                .ig-inbox-row {
                    border-color: hsl(${hue}, 50%, 32%) !important;
                    border-top-color: hsl(${hue}, 50%, 32%) !important;
                    border-bottom-color: hsl(${hue}, 50%, 32%) !important;
                }
                .ig-chat-send, .chat-quote-name {
                    color: hsl(${hue}, 80%, 70%) !important;
                }
                .chat-reply-banner, .chat-quote {
                    border-left-color: hsl(${hue}, 80%, 65%) !important;
                }
                .ig-voice-progress {
                    background: hsl(${hue}, 80%, 65%) !important;
                }
                .chat-bubble-flash {
                    outline-color: hsl(${hue}, 80%, 65%) !important;
                }
                .ig-chat-camera-btn {
                    background: linear-gradient(135deg, hsl(${hue}, 55%, 28%) 0%, hsl(${hue}, 70%, 14%) 100%) !important;
                }
                .habit-hourglass, .habit-hourglass * {
                    color: #9ca3af !important;
                    stroke: #9ca3af !important;
                    fill: none !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                    background: none !important;
                    filter: none !important;
                }

            `;
            actualizarMuestraTemaAjustes();
        }

        function seleccionarTemaPorDefecto() {
            currentThemeHue = null;
            sincronizarPreviewTema();
            aplicarTemaGlobalHabitos(null);
            guardarEstadoLocal();
            persistirPrefsVisualesNube();
            avisarDiarioRemoto();
        }

        function guardarTemaPersonalizado() {
            cerrarModalHijoAjustes('theme-modal');
            aplicarTemaGlobalHabitos(currentThemeHue);
            guardarEstadoLocal();
            persistirPrefsVisualesNube();
            avisarDiarioRemoto();
        }

        function manejarClickAvatarPrincipal() {
            if (window.userHasAvatar && document.getElementById('avatar-img').src && document.getElementById('avatar-img').src.trim() !== '') {
                verImagenDeseo(document.getElementById('avatar-img').src);
            } else {
                document.getElementById('modal-avatar-file').click();
            }
        }

        function manejarClickAvatarPerfilTab() {
            const imgEl = document.getElementById('profile-view-img');
            if (imgEl && imgEl.src && imgEl.src.trim() !== '' && !imgEl.src.endsWith(window.location.href)) {
                verImagenDeseo(imgEl.src);
            } else if (!viewingUserId) {
                document.getElementById('modal-avatar-file').click();
            }
        }

        async function eliminarFotoPerfil() {
            if (typeof reproducirSonidoEliminar === 'function') {
                try { reproducirSonidoEliminar(); } catch (e) {}
            }
            const anterior = window.userHasAvatar && document.getElementById('avatar-img')
                ? document.getElementById('avatar-img').src
                : null;
            window.userHasAvatar = false;
            window.tempAvatarBase64 = null;
            const img1 = document.getElementById('avatar-img');
            const ph1 = document.getElementById('avatar-placeholder');
            const img2 = document.getElementById('profile-view-img');
            const ph2 = document.getElementById('profile-view-placeholder');
            const modalImg = document.getElementById('modal-avatar-preview-img');
            const modalPh = document.getElementById('modal-avatar-preview-placeholder');

            if(img1) { img1.src = ''; img1.style.display = 'none'; }
            if(ph1) ph1.style.display = 'flex';
            if(img2) { img2.src = ''; img2.style.display = 'none'; }
            if(ph2) ph2.style.display = 'flex';
            if(modalImg) { modalImg.src = ''; modalImg.style.display = 'none'; }
            if(modalPh) modalPh.style.display = 'flex';

            if (currentUser) {
                await borrarMediaAwakeSiPropia(anterior);
                await supabaseClient.from('profiles').update({ avatar_url: null }).eq('id', currentUser.id);
            }
            guardarEstadoLocal();
        }

        function actualizarContadorBio() {
            const input = document.getElementById('modal-bio-input');
            const count = document.getElementById('bio-char-count');
            if (!input || !count) return;
            const n = (input.value || '').length;
            count.textContent = n + '/150';
            count.classList.toggle('visible', n > 0);
        }

        function abrirModalEditarPerfil() {
            if (viewingUserId) return;

            const actualNick = document.getElementById('display-nickname').textContent;
            const inputNick = document.getElementById('modal-nickname-input');
            if(inputNick) inputNick.value = (actualNick === "Anonymous") ? "" : actualNick;

            const actualBio = document.getElementById('profile-view-subtitle').textContent;
            const inputBio = document.getElementById('modal-bio-input');
            if(inputBio) inputBio.value = actualBio || "";
            actualizarContadorBio();

            const accSelector = document.getElementById('modal-account-privacy-selector');
            if(accSelector) {
                accSelector.querySelectorAll('.config-pill').forEach(p => {
                    const text = p.textContent.toLowerCase();
                    if ((accountPrivacy === 'publico' && text.includes('público')) || (accountPrivacy === 'privado' && text.includes('privado'))) {
                        p.classList.add('active');
                    } else {
                        p.classList.remove('active');
                    }
                });
            }

            const mainImg = document.getElementById('avatar-img');
            const modalImg = document.getElementById('modal-avatar-preview-img');
            const modalPh = document.getElementById('modal-avatar-preview-placeholder');

            window.tempAvatarBase64 = null;
            if (window.userHasAvatar && mainImg && mainImg.src) {
                modalImg.src = mainImg.src;
                modalImg.style.display = 'block';
                modalPh.style.display = 'none';
            } else {
                modalImg.src = '';
                modalImg.style.display = 'none';
                modalPh.style.display = 'flex';
            }

            // Sin sesión: solo se pueden editar nickname e icono. Biografía y privacidad
            // quedan bloqueadas con candado hasta iniciar sesión.
            const S_LOCKED = !currentUser;
            const nickInput = document.getElementById('modal-nickname-input');
            const bioInput = document.getElementById('modal-bio-input');
            const avatarFile = document.getElementById('modal-avatar-file');
            const nickField = nickInput ? nickInput.closest('.form-group') : null;
            const bioField = bioInput ? bioInput.closest('.form-group') : null;
            const privacySel = document.getElementById('modal-account-privacy-selector');
            const privacyField = privacySel ? privacySel.closest('.form-group') : null;
            [nickField, bioField, privacyField].forEach(function (grp) {
                if (grp) {
                    grp.classList.remove('form-locked');
                    var badge = grp.querySelector('.form-locked-badge');
                    if (badge) grp.removeChild(badge);
                    grp.onclick = null;
                }
            });
            if (nickInput) nickInput.disabled = false;
            if (bioInput) bioInput.disabled = false;
            if (avatarFile) avatarFile.disabled = false;
            if (S_LOCKED) {
                // Sin sesión: solo el icono de perfil queda editable.
                // Nickname, biografía y privacidad quedan bloqueados con candado
                // y, al pulsar sobre ellos, se redirige a iniciar sesión.
                [nickField, bioField, privacyField].forEach(function (grp) {
                    if (!grp) return;
                    grp.classList.add('form-locked');
                    var badge = grp.querySelector('.form-locked-badge');
                    grp.onclick = function () {
                        cerrarModalHijoAjustes('edit-profile-modal');
                        abrirModalAuth();
                    };
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'form-locked-badge';
                        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/></svg> Iniciar sesión';
                        grp.appendChild(badge);
                    }
                });
                if (nickInput) nickInput.disabled = true;
                if (bioInput) bioInput.disabled = true;
            } else {
                if (nickInput) nickInput.disabled = false;
                if (bioInput) bioInput.disabled = false;
            }

            ocultarAjustesAlAbrirCapa();
            document.getElementById('edit-profile-modal').classList.add('active');
        }

        async function guardarPerfilModal() {
            const inputNick = document.getElementById('modal-nickname-input');
            const inputBio = document.getElementById('modal-bio-input');

            let finalNick = "Anonymous";
            let finalBio = "";

            if (inputNick && inputNick.value.trim() !== "") {
                finalNick = recortarTexto(inputNick.value.trim(), AWAKE_LIMITE_NICK);
                document.getElementById('display-nickname').textContent = finalNick;
                document.getElementById('profile-bio-name').textContent = finalNick;
            }

            if (inputBio) {
                finalBio = recortarTexto(inputBio.value.trim(), AWAKE_LIMITE_BIO);
                document.getElementById('profile-view-subtitle').textContent = finalBio;
            }

            if (window.tempAvatarBase64) {
                aplicarImagenAvatar(window.tempAvatarBase64);
                window.tempAvatarBase64 = null;
            }

            let currentAvatarSrc = window.userHasAvatar && document.getElementById('avatar-img').src ? document.getElementById('avatar-img').src : null;
            let omitAvatar = false;
            if (currentAvatarSrc && currentAvatarSrc.indexOf('data:') === 0) {
                const subida = await subirMediaAwake(currentAvatarSrc, 'avatars', 'png');
                if (subida && !esDataUrlMedia(subida)) {
                    currentAvatarSrc = subida;
                    aplicarImagenAvatar(subida);
                } else {
                    mostrarToastLujo('No se pudo guardar la foto de perfil.', { tipo: 'error' });
                    omitAvatar = true;
                }
            }

            if (currentUser) {
                const fila = {
                    id: currentUser.id,
                    username: finalNick,
                    bio: finalBio,
                    avatar_url: currentAvatarSrc,
                    account_privacy: normalizarPrivacidadCuenta(accountPrivacy)
                };
                if (omitAvatar) delete fila.avatar_url;
                let { error } = await supabaseClient.from('profiles').upsert([fila]);
                if (error && String(error.message || '').indexOf('account_privacy') !== -1) {
                    delete fila.account_privacy;
                    ({ error } = await supabaseClient.from('profiles').upsert([fila]));
                }
                if (error) {
                    console.error("Error al guardar el perfil en Supabase:", error.message);
                }
            }

            guardarEstadoLocal();
            cerrarModalHijoAjustes('edit-profile-modal');
        }

        function iniciarRecorteDesdeModal(event) {
            const archivo = event.target.files[0];
            if (archivo) {
                comprimirImagenSegura(archivo, (base64) => { if (base64) abrirModalRecorte(base64); });
            }
            event.target.value = '';
        }

        function abrirModalRecorte(dataUrl) {
            cropImageObj = new Image();
            cropImageObj.onload = function() {
                cropScale = Math.max(260 / cropImageObj.width, 260 / cropImageObj.height);
                cropScaleMin = cropScale * 0.5;
                cropScaleMax = cropScale * 4;
                cropOffsetX = (260 - cropImageObj.width * cropScale) / 2;
                cropOffsetY = (260 - cropImageObj.height * cropScale) / 2;
                cropPinch = null;
                isDraggingCrop = false;
                ocultarPerfilAlAbrirRecorte();
                document.getElementById('crop-modal').classList.add('active');
                dibujarCanvasRecorte();
            };
            cropImageObj.src = dataUrl;
        }

        function cerrarModalRecorte() {
            cropPinch = null;
            isDraggingCrop = false;
            document.getElementById('crop-modal').classList.remove('active');
            volverPerfilSiPendiente();
        }

        function clampCropScale(s) {
            return Math.min(cropScaleMax, Math.max(cropScaleMin, s));
        }

        function aplicarZoomRecorteEnPunto(newScale, cx, cy) {
            newScale = clampCropScale(newScale);
            if (!isFinite(newScale) || newScale === cropScale) return;
            cropOffsetX = cx - ((cx - cropOffsetX) / cropScale) * newScale;
            cropOffsetY = cy - ((cy - cropOffsetY) / cropScale) * newScale;
            cropScale = newScale;
            dibujarCanvasRecorte();
        }

        function dibujarCanvasRecorte() {
            const c = document.getElementById('crop-canvas');
            if(!c) return;
            const ctxC = c.getContext('2d');
            c.width = 260;
            c.height = 260;
            ctxC.clearRect(0, 0, 260, 260);
            if (cropImageObj) {
                ctxC.drawImage(cropImageObj, cropOffsetX, cropOffsetY, cropImageObj.width * cropScale, cropImageObj.height * cropScale);
            }
        }

        function inicializarEventosRecortador() {
            const c = document.getElementById('crop-canvas');
            if(!c) return;

            const startDrag = (x, y) => { isDraggingCrop = true; startDragX = x - cropOffsetX; startDragY = y - cropOffsetY; };
            const moveDrag = (x, y) => {
                if (!isDraggingCrop || cropPinch) return;
                cropOffsetX = x - startDragX;
                cropOffsetY = y - startDragY;
                dibujarCanvasRecorte();
            };
            const endDrag = () => { isDraggingCrop = false; };

            const puntoEnCanvas = (clientX, clientY) => {
                const rect = c.getBoundingClientRect();
                const sx = rect.width ? 260 / rect.width : 1;
                const sy = rect.height ? 260 / rect.height : 1;
                return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
            };

            const iniciarPinch = (touches) => {
                isDraggingCrop = false;
                const t0 = touches[0];
                const t1 = touches[1];
                const mid = puntoEnCanvas((t0.clientX + t1.clientX) / 2, (t0.clientY + t1.clientY) / 2);
                cropPinch = {
                    dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1,
                    scale: cropScale,
                    ox: cropOffsetX,
                    oy: cropOffsetY,
                    cx: mid.x,
                    cy: mid.y
                };
            };

            const moverPinch = (touches) => {
                if (!cropPinch) return;
                const t0 = touches[0];
                const t1 = touches[1];
                const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
                const newScale = clampCropScale(cropPinch.scale * (dist / cropPinch.dist));
                cropOffsetX = cropPinch.cx - ((cropPinch.cx - cropPinch.ox) / cropPinch.scale) * newScale;
                cropOffsetY = cropPinch.cy - ((cropPinch.cy - cropPinch.oy) / cropPinch.scale) * newScale;
                cropScale = newScale;
                dibujarCanvasRecorte();
            };

            c.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
            window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
            window.addEventListener('mouseup', endDrag);

            c.addEventListener('touchstart', e => {
                if (e.touches.length >= 2) {
                    if (e.cancelable) e.preventDefault();
                    iniciarPinch(e.touches);
                    return;
                }
                cropPinch = null;
                startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: false });

            c.addEventListener('touchmove', e => {
                if (e.touches.length >= 2) {
                    if (e.cancelable) e.preventDefault();
                    if (!cropPinch) iniciarPinch(e.touches);
                    moverPinch(e.touches);
                    return;
                }
                if (cropPinch) {
                    cropPinch = null;
                    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
                    return;
                }
                if (isDraggingCrop && e.touches.length === 1) {
                    if (e.cancelable) e.preventDefault();
                    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: false });

            c.addEventListener('touchend', e => {
                if (e.touches.length < 2) cropPinch = null;
                if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
                else endDrag();
            });
            c.addEventListener('touchcancel', () => { cropPinch = null; endDrag(); });

            c.addEventListener('wheel', e => {
                e.preventDefault();
                const p = puntoEnCanvas(e.clientX, e.clientY);
                const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
                aplicarZoomRecorteEnPunto(cropScale * factor, p.x, p.y);
            }, { passive: false });
        }

        async function aplicarRecorteAvatar() {
            const anterior = document.getElementById('avatar-img') && document.getElementById('avatar-img').src;
            const canvasTemp = document.createElement('canvas');
            canvasTemp.width = 260;
            canvasTemp.height = 260;
            const ctxT = canvasTemp.getContext('2d');
            ctxT.beginPath();
            ctxT.arc(130, 130, 130, 0, Math.PI * 2);
            ctxT.clip();
            ctxT.drawImage(cropImageObj, cropOffsetX, cropOffsetY, cropImageObj.width * cropScale, cropImageObj.height * cropScale);
            const croppedBase64 = canvasTemp.toDataURL('image/png', 0.9);

            window.tempAvatarBase64 = croppedBase64;
            const modalImg = document.getElementById('modal-avatar-preview-img');
            const modalPh = document.getElementById('modal-avatar-preview-placeholder');
            if(modalImg) { modalImg.src = croppedBase64; modalImg.style.display = 'block'; }
            if(modalPh) modalPh.style.display = 'none';

            aplicarImagenAvatar(croppedBase64);
            guardarEstadoLocal();
            if (currentUser) {
                const url = await subirMediaAwake(croppedBase64, 'avatars', 'png');
                if (url && !esDataUrlMedia(url)) {
                    aplicarImagenAvatar(url);
                    window.tempAvatarBase64 = null;
                    await supabaseClient.from('profiles').update({ avatar_url: url }).eq('id', currentUser.id);
                    if (anterior && anterior !== url) {
                        await borrarMediaAwakeSiPropia(anterior);
                    }
                } else {
                    mostrarToastLujo('No se pudo guardar la foto de perfil.', { tipo: 'error' });
                    window.tempAvatarBase64 = croppedBase64;
                }
                guardarEstadoLocal();
            }

            cerrarModalRecorte();
        }

        function aplicarImagenAvatar(base64) {
            const img1 = document.getElementById('avatar-img');
            const ph1 = document.getElementById('avatar-placeholder');
            const img2 = document.getElementById('profile-view-img');
            const ph2 = document.getElementById('profile-view-placeholder');
            const fade = (img) => {
                if (!img) return;
                img.style.display = 'block';
                if (respetaMenosMovimiento() || img.src === base64) {
                    img.src = base64;
                    img.style.opacity = '1';
                    return;
                }
                img.style.opacity = '0';
                requestAnimationFrame(() => {
                    img.src = base64;
                    requestAnimationFrame(() => { img.style.opacity = '1'; });
                });
            };

            fade(img1);
            if (ph1) ph1.style.display = 'none';
            fade(img2);
            if (ph2) ph2.style.display = 'none';
            window.userHasAvatar = true;
        }


        async function actualizarEstadisticasPerfil() {
            if (viewingUserId) {
                const uObj = window.cachePerfilesSocial && window.cachePerfilesSocial[viewingUserId];
                if (uObj) {
                    let totalPubs = 0;
                    Object.values(uObj.historialAgrupado).forEach(ejecuciones => {
                        ejecuciones.forEach(ej => {
                            const imgVal = srcImagenHabito((ej.imagenes && ej.imagenes[0]) || ej.image_url);
                            if (esSelloVisibleEnRed(ej) && imgVal) totalPubs++;
                        });
                    });
                    animarContador(document.getElementById('stat-publications'), totalPubs);
                    animarContador(document.getElementById('stat-followers'), uObj.followersCount || 0);
                    animarContador(document.getElementById('stat-following'), uObj.followingCount || 0);
                    try { renderizarInsignias(); } catch (e) {}
                }
                return;
            }

            let totalPubs = 0;
            Object.values(historialAgrupado).forEach(ejecuciones => {
                ejecuciones.forEach(ej => {
                    const imgVal = srcImagenHabito((ej.imagenes && ej.imagenes[0]) || ej.image_url);
                    if (imgVal) totalPubs++;
                });
            });

            animarContador(document.getElementById('stat-publications'), totalPubs);
            animarContador(document.getElementById('stat-followers'), misSeguidores.length);
            animarContador(document.getElementById('stat-following'), misSeguidos.length);
            renderizarInsignias();
        }

        async function abrirModalSocialRed(tipo) {
            currentSocialTargetUserId = viewingUserId || (currentUser ? currentUser.id : null);
            if (!currentSocialTargetUserId) return;

            const [{ count: segCount }, { count: sguCount }] = await Promise.all([
                supabaseClient.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', currentSocialTargetUserId),
                supabaseClient.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', currentSocialTargetUserId)
            ]);

            document.getElementById('count-seguidores').textContent = segCount || 0;
            document.getElementById('count-seguidos').textContent = sguCount || 0;

            document.getElementById('social-modal').classList.add('active');
            await cambiarSocialTab(tipo);
        }

        async function cambiarSocialTab(tipo) {
            currentActiveSocialTab = tipo;
            const btnSeg = document.getElementById('tab-seguidores-btn');
            const btnSegu = document.getElementById('tab-seguidos-btn');
            if(btnSeg) {
                btnSeg.classList.toggle('active', tipo === 'seguidores');
                btnSeg.setAttribute('aria-selected', tipo === 'seguidores' ? 'true' : 'false');
                btnSeg.setAttribute('tabindex', tipo === 'seguidores' ? '0' : '-1');
            }
            if(btnSegu) {
                btnSegu.classList.toggle('active', tipo === 'seguidos');
                btnSegu.setAttribute('aria-selected', tipo === 'seguidos' ? 'true' : 'false');
                btnSegu.setAttribute('tabindex', tipo === 'seguidos' ? '0' : '-1');
            }
            
            const list = document.getElementById('social-modal-list');
            if(!list) return;
            list.innerHTML = '';

            const targetUid = currentSocialTargetUserId || viewingUserId || (currentUser ? currentUser.id : null);
            if (!targetUid) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem;">Inicia sesión para ver esta lista.</div>`;
                return;
            }

            let idsArr = [];
            if (tipo === 'seguidores') {
                const { data, error } = await supabaseClient.from('follows').select('follower_id').eq('following_id', targetUid);
                if (!error && data) idsArr = data.map(x => x.follower_id);
                document.getElementById('count-seguidores').textContent = idsArr.length;
            } else {
                const { data, error } = await supabaseClient.from('follows').select('following_id').eq('follower_id', targetUid);
                if (!error && data) idsArr = data.map(x => x.following_id);
                document.getElementById('count-seguidos').textContent = idsArr.length;
            }

            if (idsArr.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem;">No hay usuarios en esta lista.</div>`;
                return;
            }

            const { data: profilesData, error: profError } = await supabaseClient.from('profiles').select('id, username, bio, avatar_url').in('id', idsArr);
            if (profError || !profilesData || profilesData.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem;">No hay usuarios en esta lista.</div>`;
                return;
            }

            profilesData.forEach(p => {
                const isSelf = currentUser && p.id === currentUser.id;
                const isFollowing = misSeguidos.includes(p.id);

                const div = document.createElement('div');
                div.className = 'habit-card-inspired';
                div.innerHTML = `
                    <div class="habit-card-left" style="cursor: pointer;" onclick="visitarPerfilSupabase('${jsStrHtml(p.id)}')">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--platinum-sheen); border: 1px solid var(--border-metal); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                            ${p.avatar_url ? `<img src="${htmlImgSrc(p.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
                        </div>
                        <div class="habit-details">
                            <h4 style="font-size: 0.88rem; font-weight: 800;">${escapeHtmlChat(p.username || 'Anonymous')}</h4>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtmlChat(p.bio || 'Sin biografía')}</span>
                        </div>
                    </div>
                    ${isSelf ? '' : `<button type="button" class="ig-btn-action ${isFollowing ? 'ig-btn-solid' : ''}" style="flex: 0 0 auto; width: 105px; padding: 7px 10px; font-size: 0.75rem; ${isFollowing ? 'background: #059669 !important; border-color: #059669; color: #fff;' : ''}" onclick="toggleFollowFromList('${jsStrHtml(p.id)}', event)">${isFollowing ? 'Siguiendo' : 'Seguir'}</button>`}
                `;
                list.appendChild(div);
            });
        }

        async function toggleFollowFromList(userId, event) {
            event.stopPropagation();
            if (!currentUser) return;
            const isCurrentlyFollowing = misSeguidos.includes(userId);
            
            if (isCurrentlyFollowing) {
                misSeguidos = misSeguidos.filter(id => id !== userId);
                await supabaseClient.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
            } else {
                if (!misSeguidos.includes(userId)) misSeguidos.push(userId);
                await supabaseClient.from('follows').insert([{ follower_id: currentUser.id, following_id: userId }]);
            }
            
            cambiarSocialTab(currentActiveSocialTab);
            const searchInput = document.getElementById('explore-search-input');
            if (searchInput && searchInput.value.trim() !== '') {
                buscarUsuariosExplorar(searchInput.value);
            }
            actualizarEstadisticasPerfil();
        }

        async function visitarPerfilSupabase(userId, opts) {
            const skipNav = opts && opts.skipNavSnapshot;
            const soyYo = currentUser && userId === currentUser.id;
            if (!skipNav && !soyYo) apilarRetornoNavegacion();

            document.getElementById('explore-modal').classList.remove('active');
            document.getElementById('social-modal').classList.remove('active');
            document.getElementById('detail-modal').classList.remove('active');
            const lb = document.getElementById('lightbox');
            if (lb) lb.classList.remove('active');

            if (soyYo) {
                volverAMiPerfil();
                return;
            }

            viewingUserId = userId;
            const btnVolver = document.getElementById('btn-volver-mi-perfil');
            if (btnVolver) btnVolver.classList.remove('hidden');

            const [profileRes, segsRes, sgsRes, followCheckRes] = await Promise.all([
                supabaseClient.from('profiles').select('id, username, bio, avatar_url, account_privacy, badges_unlocked, ritual_prefs').eq('id', userId).single(),
                supabaseClient.from('follows').select('follower_id').eq('following_id', userId),
                supabaseClient.from('follows').select('following_id').eq('follower_id', userId),
                currentUser ? supabaseClient.from('follows').select('follower_id, following_id').eq('follower_id', currentUser.id).eq('following_id', userId).single() : Promise.resolve({ data: null })
            ]);

            let profile = profileRes.data;
            if (profileRes.error && errorEsRecursoAusente(profileRes.error)) {
                cloudBadgesUnlocked = false;
                const fallback = await supabaseClient.from('profiles').select('id, username, bio, avatar_url, account_privacy, ritual_prefs').eq('id', userId).single();
                profile = fallback.data;
            } else if (profileRes.error) {
                const fallback = await supabaseClient.from('profiles').select('id, username, bio, avatar_url, account_privacy').eq('id', userId).single();
                profile = fallback.data;
            }
            const uName = profile ? (profile.username || 'Anonymous') : 'Usuario';
            const uBio = profile ? (profile.bio || '') : '';
            const uAvatar = profile ? profile.avatar_url : null;

            document.getElementById('profile-bio-name').textContent = uName;
            document.getElementById('profile-view-subtitle').textContent = uBio;

            if (uAvatar) {
                const img2 = document.getElementById('profile-view-img');
                const ph2 = document.getElementById('profile-view-placeholder');
                if(img2) { img2.src = uAvatar; img2.style.display = 'block'; }
                if(ph2) ph2.style.display = 'none';
            } else {
                const img2 = document.getElementById('profile-view-img');
                const ph2 = document.getElementById('profile-view-placeholder');
                if(img2) { img2.src = ''; img2.style.display = 'none'; }
                if(ph2) ph2.style.display = 'flex';
            }

            const isFollowing = !!followCheckRes.data;
            const segs = segsRes.data || [];
            const sgs = sgsRes.data || [];
            const accPriv = normalizarPrivacidadCuenta(profile ? profile.account_privacy : 'publico');
            
            document.getElementById('stat-followers').textContent = segs.length;
            document.getElementById('stat-following').textContent = sgs.length;

            let logs = [];
            if (puedeVerHistorialCuenta(accPriv, isFollowing)) {
                const logsRes = await supabaseClient.from('habit_logs').select('id, user_id, habit_name, text_comment, image_url, privacy, created_at').eq('user_id', userId);
                logs = logsRes.data || [];
            }
            let formattedLogs = [];

            if (logs.length > 0) {
                const logIds = logs.map(l => l.id);

                const [likesRes, commentsRes] = await Promise.all([
                    supabaseClient.from('likes').select('id, log_id, user_id').in('log_id', logIds),
                    supabaseClient.from('comments').select('id, user_id, log_id, text_comment, profiles(username)').in('log_id', logIds).order('created_at', { ascending: true })
                ]);

                const allLikes = likesRes.data || [];
                const allComments = commentsRes.data || [];

                for (const l of logs) {
                    const dObj = new Date(l.created_at || Date.now());
                    const cleanHName = cleanHabitName(l.habit_name);
                    
                    const logLikes = allLikes.filter(lk => lk.log_id === l.id);
                    const likesCount = logLikes.length;
                    const likedByMe = currentUser ? logLikes.some(lk => lk.user_id === currentUser.id) : false;

                    const logComments = allComments.filter(cm => cm.log_id === l.id);
                    const comsFormatted = logComments.map(c => ({ 
                        id: c.id,
                        user_id: c.user_id,
                        autor: c.profiles ? c.profiles.username : 'Usuario', 
                        texto: c.text_comment 
                    }));

                    const reg = {
                        id: l.id,
                        user_id: l.user_id,
                        nombre: cleanHName,
                        fecha: dObj.toLocaleDateString(),
                        dateObj: dObj,
                        timestamp: dObj.getTime(),
                        texto: l.text_comment,
                        score: null,
                        imagenes: (l.image_url && l.image_url.trim() !== '') ? [l.image_url] : [],
                        image_url: l.image_url,
                        privacidad: l.privacy || 'seguidores',
                        likes: likesCount,
                        likedByMe: likedByMe,
                        comentarios: comsFormatted
                    };
                    window.registrosGlobalMap[l.id] = reg;
                    formattedLogs.push(reg);
                }
            }

            if (!window.cachePerfilesSocial) window.cachePerfilesSocial = {};
            let profileHistorialMap = {};
            formattedLogs.forEach(reg => {
                if (!profileHistorialMap[reg.nombre]) {
                    profileHistorialMap[reg.nombre] = [];
                }
                profileHistorialMap[reg.nombre].push(reg);
            });

            let badgesMap = {};
            if (profile && profile.badges_unlocked) {
                badgesMap = normalizarMapaInsignias(profile.badges_unlocked);
            } else if (profile && profile.ritual_prefs && profile.ritual_prefs.badgesUnlocked) {
                badgesMap = normalizarMapaInsignias(profile.ritual_prefs.badgesUnlocked);
            }

            window.cachePerfilesSocial[userId] = {
                name: uName,
                subtitle: uBio,
                avatar: uAvatar,
                accountPrivacy: accPriv,
                isFollowing: isFollowing,
                followersCount: segs.length,
                followingCount: sgs.length,
                historialAgrupado: profileHistorialMap,
                badgesUnlocked: badgesMap
            };

            const actionContainer = document.getElementById('profile-action-buttons-container');
            const followBtnStyle = isFollowing ? 'background: #059669 !important; border-color: #059669; color: #fff;' : '';
            const followBtnText = isFollowing ? 'Siguiendo' : 'Seguir';

            actionContainer.innerHTML = `
                <button type="button" class="ig-btn-action ig-btn-solid ig-btn-follow-aligned" onclick="toggleFollowExternalUser()" style="${followBtnStyle}">${followBtnText}</button>
                <button type="button" class="ig-btn-action ig-btn-solid ig-btn-msg-full" onclick="abrirChatDesdePerfilVisitado()" title="Enviar mensaje">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    <span>Enviar mensaje</span>
                </button>
            `;

            cambiarTab(2);
            badgeDetalleId = null;
            socialSeccionActiva = 'perfil';
            badgeVistaActiva = 'showcase';
            sincronizarVisibilidadColeccionSocial();
            // Al visitar a alguien, mostrar publicaciones; Insignias al tocar la subpestaña.
            const pubsTab = document.querySelector('.profile-subtab');
            if (pubsTab) cambiarSubTabPerfil('pubs', pubsTab);
            else renderizarPerfilPublicacionesGrid();
            try { renderizarInsignias(); } catch (e) {}
            actualizarBotonAtrasIOS();
        }

        async function visitarPerfilPorNombreDeUsuario(username) {
            username = leerNombrePerfilArg(username);
            if (!username) return;

            const myNick = (document.getElementById('display-nickname') || {}).textContent || '';
            const viewingNick = viewingUserId
                ? ((window.cachePerfilesSocial[viewingUserId] && window.cachePerfilesSocial[viewingUserId].name) || '')
                : myNick;
            const nickNorm = normalizarNickSocial(username);
            const viendoEstePerfil = nickNorm && nickNorm === normalizarNickSocial(viewingNick);
            const esMiNick = nickNorm && nickNorm === normalizarNickSocial(myNick);

            if (viendoEstePerfil && overlayActiva('detail-modal')) {
                cerrarFeedPublicaciones();
                return;
            }
            if (esMiNick && currentUser) {
                visitarPerfilSupabase(currentUser.id);
                return;
            }

            let data = null;
            const exacto = await supabaseClient.from('profiles').select('id, username').eq('username', username).maybeSingle();
            if (!exacto.error && exacto.data) data = exacto.data;
            if (!data) {
                const approx = await supabaseClient.from('profiles').select('id, username').ilike('username', username).limit(8);
                const rows = approx.data || [];
                data = rows.find(p => normalizarNickSocial(p.username) === nickNorm) || rows[0] || null;
            }
            if (data) visitarPerfilSupabase(data.id);
        }

        function volverAMiPerfil() {
            viewingUserId = null;
            const btnVolver = document.getElementById('btn-volver-mi-perfil');
            if (btnVolver) btnVolver.classList.add('hidden');
            const currentNick = document.getElementById('display-nickname').textContent;
            const currentBio = document.getElementById('profile-view-subtitle').textContent;
            document.getElementById('profile-bio-name').textContent = currentNick;
            document.getElementById('profile-view-subtitle').textContent = currentBio;

            const mainImg = document.getElementById('avatar-img');
            const viewImg = document.getElementById('profile-view-img');
            const viewPh = document.getElementById('profile-view-placeholder');
            if (window.userHasAvatar && mainImg && mainImg.src) {
                viewImg.src = mainImg.src;
                viewImg.style.display = 'block';
                viewPh.style.display = 'none';
            } else {
                viewImg.src = '';
                viewImg.style.display = 'none';
                viewPh.style.display = 'flex';
            }

            document.getElementById('profile-action-buttons-container').innerHTML = `
                <button type="button" class="ig-btn-action ig-btn-solid" onclick="abrirModalEditarPerfil()">Editar perfil</button>
                <button type="button" class="ig-btn-action ig-btn-solid" onclick="abrirModalExplorar()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    Explorar
                </button>
            `;

            actualizarEstadisticasPerfil();
            badgeDetalleId = null;
            socialSeccionActiva = 'perfil';
            badgeVistaActiva = 'showcase';
            sincronizarVisibilidadColeccionSocial();
            cambiarTab(2);
            renderizarPerfilPublicacionesGrid();
            renderizarInsignias();
            actualizarBotonAtrasIOS();
        }

        async function toggleFollowExternalUser() {
            if (!viewingUserId || !currentUser) return;
            const uObj = window.cachePerfilesSocial && window.cachePerfilesSocial[viewingUserId];
            if(!uObj) return;

            uObj.isFollowing = !uObj.isFollowing;
            const actionContainer = document.getElementById('profile-action-buttons-container');
            
            const followBtnStyle = uObj.isFollowing ? 'background: #059669 !important; border-color: #059669; color: #fff;' : '';
            const followBtnText = uObj.isFollowing ? 'Siguiendo' : 'Seguir';

            actionContainer.innerHTML = `
                <button type="button" class="ig-btn-action ig-btn-solid ig-btn-follow-aligned" onclick="toggleFollowExternalUser()" style="${followBtnStyle}">${followBtnText}</button>
                <button type="button" class="ig-btn-action ig-btn-solid ig-btn-msg-full" onclick="abrirChatDesdePerfilVisitado()" title="Enviar mensaje">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    <span>Enviar mensaje</span>
                </button>
            `;

            if (uObj.isFollowing) {
                if (!misSeguidos.includes(viewingUserId)) misSeguidos.push(viewingUserId);
                uObj.followersCount = (uObj.followersCount || 0) + 1;
                await supabaseClient.from('follows').insert([{
                    follower_id: currentUser.id,
                    following_id: viewingUserId
                }]);
            } else {
                misSeguidos = misSeguidos.filter(id => id !== viewingUserId);
                uObj.followersCount = Math.max(0, (uObj.followersCount || 0) - 1);
                await supabaseClient.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', viewingUserId);
            }
            if (normalizarPrivacidadCuenta(uObj.accountPrivacy) === 'privado') {
                await visitarPerfilSupabase(viewingUserId, { skipNavSnapshot: true });
                return;
            }
            actualizarEstadisticasPerfil();
        }

        function renderizarPerfilPublicacionesGrid() {
            const container = document.getElementById('profile-posts-grid-container');
            if(!container) return;
            container.innerHTML = '';

            let dataHistorial = historialAgrupado;
            let currentNickname = viewingUserId ? (window.cachePerfilesSocial[viewingUserId] ? window.cachePerfilesSocial[viewingUserId].name : 'Usuario') : document.getElementById('display-nickname').textContent;
            
            if (viewingUserId) {
                const uObj = window.cachePerfilesSocial[viewingUserId];
                if(uObj) {
                    if (!puedeVerHistorialCuenta(uObj.accountPrivacy, uObj.isFollowing)) {
                        container.innerHTML = htmlEstadoVacio({
                            title: 'Perfil privado',
                            text: 'Sigue a este usuario para ver sus publicaciones.',
                            icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
                        });
                        actualizarEstadisticasPerfil();
                        return;
                    }
                    dataHistorial = uObj.historialAgrupado;
                }
            }

            let todasLasPublicaciones = [];
            Object.values(dataHistorial).forEach(ejecuciones => {
                ejecuciones.forEach(ej => {
                    const cleanHName = cleanHabitName(ej.nombre);
                    // En el perfil propio solo son publicaciones los registros con cuenta
                    // (los adjuntos locales de invitado no se publican).
                    const esVisible = viewingUserId ? esSelloVisibleEnRed(ej) : (esSelloVisibleEnRed(ej) && !!ej.user_id);
                    const imgVal = srcImagenHabito((ej.imagenes && ej.imagenes[0]) || ej.image_url);
                    if (esVisible && imgVal) {
                        todasLasPublicaciones.push({
                            id: ej.id,
                            user_id: ej.user_id || (currentUser ? currentUser.id : null),
                            nombre: cleanHName,
                            fecha: ej.fecha,
                            dateObj: ej.dateObj ? new Date(ej.dateObj) : new Date(0),
                            texto: ej.texto,
                            score: ej.score,
                            imgUrl: imgVal,
                            privacidad: ej.privacidad,
                            likes: ej.likes || 0,
                            likedByMe: ej.likedByMe || false,
                            comentarios: ej.comentarios || [],
                            owner: currentNickname,
                            avatar: viewingUserId ? (window.cachePerfilesSocial[viewingUserId] ? window.cachePerfilesSocial[viewingUserId].avatar : null) : (window.userHasAvatar ? document.getElementById('avatar-img').src : null)
                        });
                    }
                });
            });

            todasLasPublicaciones.sort((a, b) => b.dateObj - a.dateObj);
            actualizarEstadisticasPerfil();

            if (todasLasPublicaciones.length === 0) {
                container.innerHTML = htmlEstadoVacio({
                    title: 'Galería vacía',
                    text: viewingUserId
                        ? 'Este perfil no tiene publicaciones con foto.'
                        : 'Completa un hábito y adjunta una imagen para publicar.',
                    icon: ICONO_VACIO_FOTO
                });
                return;
            }

            const gridDiv = document.createElement('div');
            gridDiv.className = 'history-images-grid';

            todasLasPublicaciones.forEach(pub => {
                const thumb = document.createElement('div');
                thumb.className = 'history-thumb-card';
                const isPriv = pub.privacidad === 'privado';
                
                const snippetTexto = textoRitualLimpio(pub.texto);

                thumb.innerHTML = `
                    <img src="${htmlImgSrc(pub.imgUrl)}" alt="Publicación">
                    <div class="thumb-info-overlay">
                        <span style="display:flex; align-items:center; gap:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">${htmlGlifoHabito(pub.nombre, 14)}<span>${escapeHtmlChat(tituloSelloPublicacion(pub))}</span></span>
                        <span style="color: var(--text-muted);">${escapeHtmlChat(pub.fecha)}</span>
                        ${snippetTexto ? `<span style="color: #d1d5db; font-size: 0.52rem; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${escapeHtmlChat(snippetTexto)}"</span>` : ''}
                    </div>
                    ${isPriv ? `<div class="thumb-badge-top-left">🔒 Priv</div>` : ''}
                `;
                thumb.onclick = () => abrirFeedPublicacionesVertical(todasLasPublicaciones, pub.id);
                gridDiv.appendChild(thumb);
            });

            container.appendChild(gridDiv);
        }


        function alternarDigestRitual(bloque) {
            const map = { manana: 'digestManana', tarde: 'digestTarde', noche: 'digestNoche', riesgo: 'riesgoActivo', resumen: 'resumenActivo' };
            const k = map[bloque];
            if (!k) return;
            const encendiendo = !ritualPrefs[k];
            ritualPrefs[k] = encendiendo;
            guardarPrefsRitualLocal();
            persistirPrefsVisualesNube();
            sincronizarPanelAjustes();
            programarAlarmasNativasHabitos();
            if (encendiendo) quizasMostrarGuiaPermisosRitual();
        }

        function cambiarHoraDigest(bloque, valor) {
            const map = { manana: 'horaManana', tarde: 'horaTarde', noche: 'horaNoche', riesgo: 'horaRiesgo', resumen: 'horaResumen' };
            const fallback = { manana: '08:00', tarde: '15:00', noche: '21:30', riesgo: '18:00', resumen: '20:00' };
            const k = map[bloque];
            if (!k) return;
            ritualPrefs[k] = normalizarHoraHHMM(valor, fallback[bloque]);
            guardarPrefsRitualLocal();
            persistirPrefsVisualesNube();
            sincronizarPanelAjustes();
            programarAlarmasNativasHabitos();
        }

        function esAndroidNativo() {
            try {
                return !!(esAppNativa() && window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'android');
            } catch (e) {
                return false;
            }
        }

        function guiaPermisosYaVista() {
            try { return localStorage.getItem(AWAKE_PERM_GUIDE_KEY) === '1'; } catch (e) { return false; }
        }

        function marcarGuiaPermisosVista() {
            try { localStorage.setItem(AWAKE_PERM_GUIDE_KEY, '1'); } catch (e) {}
        }

        function quizasMostrarGuiaPermisosRitual() {
            if (!esAndroidNativo()) return;
            if (guiaPermisosYaVista()) return;
            abrirGuiaPermisosRitual();
        }

        function abrirGuiaPermisosRitual() {
            const m = document.getElementById('permisos-ritual-modal');
            if (m) m.classList.add('active');
        }

        function cerrarGuiaPermisosRitual() {
            marcarGuiaPermisosVista();
            const m = document.getElementById('permisos-ritual-modal');
            if (m) m.classList.remove('active');
        }

        async function pedirPermisoNotificacionesRitual() {
            try {
                await solicitarPermisoNotificaciones();
            } catch (e) {}
            mostrarToastLujo('Permiso de notificaciones pedido', { tipo: 'info' });
        }

        async function abrirAjustesBateriaRitual() {
            const App = capacitorPlugin('App');
            try {
                if (App && App.openUrl) await App.openUrl({ url: 'app-settings:' });
            } catch (e) {}
            mostrarToastLujo('Ajustes → Aplicaciones → AWAKE → Batería → sin restricciones', { tipo: 'info' });
        }

        function abrirSelloTimer(index, momento) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            selloTimerPayload = { index, momento };
            const overlay = document.getElementById('sello-timer-overlay');
            const picks = document.getElementById('sello-timer-picks');
            const run = document.getElementById('sello-timer-running');
            const pickActions = document.getElementById('sello-timer-pick-actions');
            const lead = document.getElementById('sello-timer-lead');
            if (picks) picks.classList.remove('hidden');
            if (run) run.classList.add('hidden');
            if (pickActions) pickActions.classList.remove('hidden');
            if (lead) lead.classList.remove('hidden');
            if (overlay) overlay.classList.add('active');
        }

        function cerrarSelloTimer() {
            if (selloTimerHandle) {
                clearInterval(selloTimerHandle);
                selloTimerHandle = null;
            }
            selloTimerLeft = 0;
            selloTimerPaused = false;
            const pauseBtn = document.getElementById('sello-timer-pause-btn');
            if (pauseBtn) pauseBtn.textContent = 'Pausa';
            const overlay = document.getElementById('sello-timer-overlay');
            if (overlay) overlay.classList.remove('active');
        }

        function arrancarTickSelloTimer() {
            if (selloTimerHandle) clearInterval(selloTimerHandle);
            selloTimerHandle = setInterval(() => {
                if (selloTimerPaused) return;
                selloTimerLeft -= 1;
                pintarCuentaSelloTimer();
                if (selloTimerLeft <= 0) completarSelloTimerYa();
            }, 1000);
        }

        function iniciarSelloTimer(segundos) {
            selloTimerLeft = segundos;
            selloTimerPaused = false;
            const pauseBtn = document.getElementById('sello-timer-pause-btn');
            if (pauseBtn) pauseBtn.textContent = 'Pausa';
            const picks = document.getElementById('sello-timer-picks');
            const run = document.getElementById('sello-timer-running');
            const pickActions = document.getElementById('sello-timer-pick-actions');
            const lead = document.getElementById('sello-timer-lead');
            if (picks) picks.classList.add('hidden');
            if (run) run.classList.remove('hidden');
            if (pickActions) pickActions.classList.add('hidden');
            if (lead) lead.classList.add('hidden');
            pintarCuentaSelloTimer();
            arrancarTickSelloTimer();
        }

        function alternarPausaSelloTimer() {
            if (!selloTimerLeft) return;
            selloTimerPaused = !selloTimerPaused;
            const pauseBtn = document.getElementById('sello-timer-pause-btn');
            if (pauseBtn) pauseBtn.textContent = selloTimerPaused ? 'Seguir' : 'Pausa';
        }

        function pintarCuentaSelloTimer() {
            const el = document.getElementById('sello-timer-count');
            if (!el) return;
            const m = Math.max(0, Math.floor(selloTimerLeft / 60));
            const s = Math.max(0, selloTimerLeft % 60);
            el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        function completarSelloTimerYa() {
            const payload = selloTimerPayload;
            cerrarSelloTimer();
            if (!payload) return;
            clicCheckboxHabito(payload.index, payload.momento);
        }

        const BADGES_UNLOCK_KEY = 'proto2awake_badges_unlocked';
        const BADGE_SCHEMA = 7;
        const BADGE_THEMES = [
            { id: 'sello', label: 'Sello' },
            { id: 'dia', label: 'Día' },
            { id: 'racha', label: 'Racha' },
            { id: 'memoria', label: 'Memoria' }
        ];
        // level = peldaño visual (metal + ornamento). metric global (nunca por hábito concreto).
        const BADGE_DEFS = [
            { id: 'sello-1', theme: 'sello', level: 1, title: 'Primer sello', text: 'La primera tarea hecha', metric: 'sellos', target: 1 },
            { id: 'sello-2', theme: 'sello', level: 2, title: 'Siete sellos', text: 'La mano ya conoce el gesto', metric: 'sellos', target: 7 },
            { id: 'sello-3', theme: 'sello', level: 3, title: '21 sellos', text: 'Acumulados, no en racha', metric: 'sellos', target: 21 },
            { id: 'sello-4', theme: 'sello', level: 4, title: '50 sellos', text: 'Una práctica asentada', metric: 'sellos', target: 50 },
            { id: 'sello-5', theme: 'sello', level: 5, title: '100 sellos', text: 'Larga constancia', metric: 'sellos', target: 100 },
            { id: 'sello-6', theme: 'sello', level: 6, title: '200 sellos', text: 'Una obra de años', metric: 'sellos', target: 200 },
            { id: 'dia-1', theme: 'dia', level: 1, title: 'Primer día', text: 'Una agenda cerrada', metric: 'dias', target: 1 },
            { id: 'dia-2', theme: 'dia', level: 2, title: '7 días', text: 'Siete agendas cerradas', metric: 'dias', target: 7 },
            { id: 'dia-3', theme: 'dia', level: 3, title: '21 días', text: 'Tres semanas de cierres', metric: 'dias', target: 21 },
            { id: 'dia-4', theme: 'dia', level: 4, title: '30 días', text: 'Un mes de días cerrados', metric: 'dias', target: 30 },
            { id: 'dia-5', theme: 'dia', level: 5, title: '60 días', text: 'Dos meses de ritual', metric: 'dias', target: 60 },
            { id: 'dia-6', theme: 'dia', level: 6, title: '90 días', text: 'Un trimestre sellado', metric: 'dias', target: 90 },
            { id: 'racha-1', theme: 'racha', level: 1, title: '3 seguidos', text: 'Tres días de agenda sellada', metric: 'racha', target: 3 },
            { id: 'racha-2', theme: 'racha', level: 2, title: '7 seguidos', text: 'Una semana sin romper el día', metric: 'racha', target: 7 },
            { id: 'racha-3', theme: 'racha', level: 3, title: '14 seguidos', text: 'Dos semanas enlazadas', metric: 'racha', target: 14 },
            { id: 'racha-4', theme: 'racha', level: 4, title: '21 seguidos', text: 'El anillo del día', metric: 'racha', target: 21 },
            { id: 'racha-5', theme: 'racha', level: 5, title: '30 seguidos', text: 'Un mes sin romper la racha', metric: 'racha', target: 30 },
            { id: 'racha-6', theme: 'racha', level: 6, title: '60 seguidos', text: 'Una racha larga de verdad', metric: 'racha', target: 60 },
            { id: 'memoria-1', theme: 'memoria', level: 1, title: 'Primera foto', text: 'Un sello con imagen', metric: 'fotos', target: 1 },
            { id: 'memoria-2', theme: 'memoria', level: 2, title: '7 fotos', text: 'El diario gana cuerpo', metric: 'fotos', target: 7 },
            { id: 'memoria-3', theme: 'memoria', level: 3, title: '14 fotos', text: 'Dos semanas de memoria visual', metric: 'fotos', target: 14 },
            { id: 'memoria-4', theme: 'memoria', level: 4, title: '21 fotos', text: 'El ritual se ve', metric: 'fotos', target: 21 },
            { id: 'memoria-5', theme: 'memoria', level: 5, title: '30 fotos', text: 'Un mes de imágenes', metric: 'fotos', target: 30 },
            { id: 'memoria-6', theme: 'memoria', level: 6, title: '60 fotos', text: 'Archivo visual asentado', metric: 'fotos', target: 60 }
        ];
        let badgeDetalleId = null;
        let badgeJustUnlockedIds = {};

        function claveInsigniasUsuario() {
            const uid = currentUser && currentUser.id ? currentUser.id : 'guest';
            return BADGES_UNLOCK_KEY + ':' + uid;
        }

        function leerInsigniasEncendidas() {
            try {
                const raw = localStorage.getItem(claveInsigniasUsuario());
                if (!raw) return { _schema: BADGE_SCHEMA };
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') return { _schema: BADGE_SCHEMA };
                const normalized = normalizarMapaInsignias(parsed);
                if (Number(parsed._schema) !== BADGE_SCHEMA) {
                    guardarInsigniasEncendidas(normalized);
                }
                return normalized;
            } catch (e) {
                return { _schema: BADGE_SCHEMA };
            }
        }

        function guardarInsigniasEncendidas(map) {
            try {
                const safe = map && typeof map === 'object' ? map : {};
                if (!safe._schema) safe._schema = BADGE_SCHEMA;
                localStorage.setItem(claveInsigniasUsuario(), JSON.stringify(safe));
            } catch (e) {}
        }

        function tsInsigniaMasTemprano(a, b) {
            const na = Number(a);
            const nb = Number(b);
            if (isFinite(na) && isFinite(nb)) return Math.min(na, nb);
            if (isFinite(na)) return na;
            if (isFinite(nb)) return nb;
            return Date.now();
        }

        // Catálogo v1 (12) → v2 (26): mismos ids, otro umbral. Remapea una vez vía _schema.
        function migrarMapaInsigniasV2(map) {
            const schema = Number(map && map._schema) || 1;
            if (schema >= 2) return map || {};
            const out = Object.assign({}, map || {});
            const move = (from, to) => {
                if (!out[from]) return;
                out[to] = out[to] ? tsInsigniaMasTemprano(out[to], out[from]) : out[from];
                delete out[from];
            };
            move('sello-3', 'sello-5');
            move('sello-2', 'sello-3');
            move('dia-3', 'dia-4');
            move('racha-3', 'racha-4');
            move('memoria-3', 'memoria-5');
            move('memoria-2', 'memoria-3');
            out._schema = 2;
            return out;
        }

        // v2 → v3: Franja fuera; Memoria solo fotos; Día/Racha ganan peldaño 6.
        function migrarMapaInsigniasV3(map) {
            let out = migrarMapaInsigniasV2(map || {});
            if (Number(out._schema) >= 3) return out;
            out = Object.assign({}, out);
            // Franja aplazada en v3 (vuelve en v4).
            ['franja-1', 'franja-2', 'franja-3', 'franja-4', 'franja-5'].forEach(id => { delete out[id]; });
            // v2: memoria-3/4 = notas, memoria-5 = deseo. Esos ids en v3 son umbrales de foto:
            // no reutilizar desbloqueos de nota/deseo como fotos.
            delete out['memoria-3'];
            delete out['memoria-4'];
            delete out['memoria-5'];
            out._schema = 3;
            return out;
        }

        // v3 → v4: Franja reactivada (6 peldaños). No rehidratar ids borrados en v3.
        function migrarMapaInsigniasV4(map) {
            let out = migrarMapaInsigniasV3(map || {});
            if (Number(out._schema) >= 4) return out;
            out = Object.assign({}, out);
            out._schema = 4;
            return out;
        }

        // v4 → v5: Sello gana peldaño 6 (200); metal 1:1 Aluminio→Platino.
        function migrarMapaInsigniasV5(map) {
            let out = migrarMapaInsigniasV4(map || {});
            if (Number(out._schema) >= 5) return out;
            out = Object.assign({}, out);
            out._schema = 5;
            return out;
        }

        // v5 → v6: showcase[] (insignias a presumir en el perfil).
        function migrarMapaInsigniasV6(map) {
            let out = migrarMapaInsigniasV5(map || {});
            if (Number(out._schema) >= 6 && Array.isArray(out._showcase)) {
                out._showcase = sanitizarShowcaseIds(out._showcase, out);
                return out;
            }
            out = Object.assign({}, out);
            out._schema = 6;
            out._showcase = construirShowcasePorDefecto(out);
            return out;
        }

        // v6 → v7: Franja retirada del catálogo.
        function migrarMapaInsigniasV7(map) {
            let out = migrarMapaInsigniasV6(map || {});
            if (Number(out._schema) >= 7) return out;
            out = Object.assign({}, out);
            ['franja-1', 'franja-2', 'franja-3', 'franja-4', 'franja-5', 'franja-6'].forEach(id => { delete out[id]; });
            if (Array.isArray(out._showcase)) {
                out._showcase = out._showcase.filter(id => String(id || '').indexOf('franja-') !== 0);
            }
            out._showcase = sanitizarShowcaseIds(out._showcase || [], out);
            out._schema = 7;
            return out;
        }

        function idsCatalogoInsignias() {
            return BADGE_DEFS.map(d => d.id);
        }

        function construirShowcasePorDefecto(map) {
            const m = map || {};
            return BADGE_DEFS
                .filter(d => !!m[d.id])
                .slice()
                .sort((a, b) => (Number(m[a.id]) || 0) - (Number(m[b.id]) || 0))
                .map(d => d.id);
        }

        function sanitizarShowcaseIds(list, map) {
            const m = map || {};
            const known = {};
            idsCatalogoInsignias().forEach(id => { known[id] = true; });
            const seen = {};
            const out = [];
            (Array.isArray(list) ? list : []).forEach(id => {
                if (!id || !known[id] || !m[id] || seen[id]) return;
                seen[id] = true;
                out.push(id);
            });
            return out;
        }

        function leerShowcaseIds(map) {
            const m = map || leerInsigniasEncendidas();
            if (Array.isArray(m._showcase)) return sanitizarShowcaseIds(m._showcase, m);
            return construirShowcasePorDefecto(m);
        }

        function estaEnShowcase(id, map) {
            if (!id) return false;
            return leerShowcaseIds(map).indexOf(id) !== -1;
        }

        function agregarInsigniaShowcase(id) {
            if (!id || viewingUserId) return;
            const map = leerInsigniasEncendidas();
            if (!map[id]) return;
            const list = leerShowcaseIds(map);
            if (list.indexOf(id) !== -1) return;
            list.push(id);
            map._showcase = list;
            map._schema = BADGE_SCHEMA;
            guardarInsigniasEncendidas(map);
            try { persistirInsigniasNube(); } catch (e) {}
            renderizarInsignias();
        }

        function quitarInsigniaShowcase(id) {
            if (!id || viewingUserId) return;
            const map = leerInsigniasEncendidas();
            const list = leerShowcaseIds(map).filter(x => x !== id);
            map._showcase = list;
            map._schema = BADGE_SCHEMA;
            guardarInsigniasEncendidas(map);
            if (badgeDetalleId === id && badgeVistaActiva === 'showcase') badgeDetalleId = null;
            try { persistirInsigniasNube(); } catch (e) {}
            renderizarInsignias();
        }

        function normalizarMapaInsignias(raw) {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
            const out = {};
            let showcaseRaw = null;
            Object.keys(raw).forEach(id => {
                if (!id || id.charAt(0) === '_') {
                    if (id === '_schema') {
                        const n = Number(raw[id]);
                        if (isFinite(n)) out._schema = n;
                    } else if (id === '_showcase') {
                        showcaseRaw = raw[id];
                    }
                    return;
                }
                const v = raw[id];
                if (v === true) out[id] = Date.now();
                else if (typeof v === 'number' && isFinite(v)) out[id] = v;
                else if (typeof v === 'string' && v) {
                    const n = Number(v);
                    out[id] = isFinite(n) ? n : Date.now();
                } else if (v && typeof v === 'object') {
                    const n = Number(v.at || v.unlockedAt || v.ts);
                    out[id] = isFinite(n) ? n : Date.now();
                }
            });
            if (Array.isArray(showcaseRaw)) out._showcase = showcaseRaw.slice();
            return migrarMapaInsigniasV7(out);
        }

        function fusionarInsigniasEncendidas(remoto) {
            const local = normalizarMapaInsignias(leerInsigniasEncendidas());
            const rem = normalizarMapaInsignias(remoto);
            let changed = false;
            const prevUnlocked = {};
            Object.keys(local).forEach(id => {
                if (id && id.charAt(0) !== '_') prevUnlocked[id] = true;
            });
            Object.keys(rem).forEach(id => {
                if (id.charAt(0) === '_') {
                    if (id === '_schema' && rem._schema && rem._schema !== local._schema) {
                        local._schema = rem._schema;
                        changed = true;
                    }
                    return;
                }
                if (!local[id]) {
                    local[id] = rem[id];
                    changed = true;
                } else if (rem[id] && rem[id] < local[id]) {
                    local[id] = rem[id];
                    changed = true;
                }
            });
            // Showcase: la curación local manda. Solo auto-añadir ids recién llegados del remoto.
            let show = Array.isArray(local._showcase)
                ? local._showcase.slice()
                : (Array.isArray(rem._showcase) ? rem._showcase.slice() : construirShowcasePorDefecto(local));
            Object.keys(local).forEach(id => {
                if (!id || id.charAt(0) === '_') return;
                if (!prevUnlocked[id] && show.indexOf(id) === -1) show.push(id);
            });
            const nextShow = sanitizarShowcaseIds(show, local);
            const prevShow = JSON.stringify(local._showcase || []);
            if (JSON.stringify(nextShow) !== prevShow) {
                local._showcase = nextShow;
                changed = true;
            }
            if (!local._schema) {
                local._schema = BADGE_SCHEMA;
                changed = true;
            }
            if (changed) guardarInsigniasEncendidas(local);
            return local;
        }

        async function persistirInsigniasNube() {
            if (!currentUser) return;
            const map = leerInsigniasEncendidas();
            if (cloudBadgesUnlocked) {
                try {
                    const { error } = await supabaseClient.from('profiles').update({
                        badges_unlocked: map
                    }).eq('id', currentUser.id);
                    if (!error) {
                        // Mantener ritual_prefs alineado si ya guardábamos ahí el mapa.
                        if (cloudPrefsRitual) {
                            try {
                                await supabaseClient.from('profiles').update({
                                    ritual_prefs: payloadRitualPrefsNube()
                                }).eq('id', currentUser.id);
                            } catch (e2) {}
                        }
                        return;
                    }
                    if (errorEsRecursoAusente(error)) cloudBadgesUnlocked = false;
                    else {
                        console.warn(error.message);
                        return;
                    }
                } catch (e) {
                    return;
                }
            }
            if (!cloudPrefsRitual) return;
            try {
                const { error } = await supabaseClient.from('profiles').update({
                    ritual_prefs: payloadRitualPrefsNube()
                }).eq('id', currentUser.id);
                if (error && errorEsRecursoAusente(error)) cloudPrefsRitual = false;
            } catch (e) {}
        }

        function sellosRealesHistorial() {
            const out = [];
            Object.keys(historialAgrupado || {}).forEach(k => {
                (historialAgrupado[k] || []).forEach(l => {
                    if (!l || logEsOmitido(l) || logEsRecaida(l)) return;
                    if (selloIdEstaEliminado(l.id)) return;
                    out.push(l);
                });
            });
            return out;
        }

        function notaRealDeSello(l) {
            const t = textoRitualLimpio(l && l.texto);
            if (!t) return false;
            const low = t.toLowerCase();
            return low !== 'completado' && low !== 'sin comentarios adicionales.';
        }

        function metricasInsignias() {
            const sellos = sellosRealesHistorial();
            const totalSellos = sellos.length;
            const fotos = sellos.filter(l => logHabitoTieneFoto(l)).length;
            const notas = sellos.filter(notaRealDeSello).length;
            const deseos = (misDeseos || []).filter(d => d && d.completado).length;

            let momManana = 0;
            let momTarde = 0;
            let momNoche = 0;
            const diasTrio = new Set();
            const porDia = {};
            sellos.forEach(l => {
                const mom = (typeof momentoDeLogHabito === 'function')
                    ? momentoDeLogHabito(l)
                    : '';
                const dia = (l && l.dia) ? String(l.dia) : (typeof claveDiaDeLog === 'function' ? claveDiaDeLog(l) : '');
                if (mom === 'MAÑANA') momManana++;
                else if (mom === 'TARDE') momTarde++;
                else if (mom === 'NOCHE') momNoche++;
                if (!dia || !mom || (mom !== 'MAÑANA' && mom !== 'TARDE' && mom !== 'NOCHE')) return;
                if (!porDia[dia]) porDia[dia] = { MAÑANA: 0, TARDE: 0, NOCHE: 0 };
                porDia[dia][mom]++;
            });
            Object.keys(porDia).forEach(dia => {
                const b = porDia[dia];
                if (b.MAÑANA && b.TARDE && b.NOCHE) diasTrio.add(dia);
            });

            const hoy = inicioDiaLocal(new Date());
            let diasSellados = 0;
            let maxRacha = 0;
            let curRacha = 0;
            for (let i = 800; i >= 0; i--) {
                const d = sumarDiasLocal(hoy, -i);
                if (diaAgendaCompleta(d)) {
                    // Las insignias de la sección DÍA solo se entregan cuando el
                    // día ya terminó por completo (24 h transcurridas): el día de
                    // hoy no cuenta hasta mañana. Así un día sellado por la tarde
                    // no desbloquea "Primer día" el mismo día; se entrega a
                    // partir del día siguiente (al abrir la app).
                    if (i > 0) diasSellados++;
                    curRacha++;
                    if (curRacha > maxRacha) maxRacha = curRacha;
                } else {
                    curRacha = 0;
                }
            }
            return {
                sellos: totalSellos,
                dias: diasSellados,
                racha: maxRacha,
                fotos,
                notas,
                deseos,
                mom_manana: momManana,
                mom_tarde: momTarde,
                mom_noche: momNoche,
                trio_dia: diasTrio.size > 0 ? 1 : 0,
                trio_dias: diasTrio.size
            };
        }

        function progresoInsignia(def, m) {
            if (!def || !m) return { value: 0, target: 1, ok: false };
            const key = def.metric || '';
            const target = def.target || 1;
            const value = Number(m[key]) || 0;
            return { value, target, ok: value >= target };
        }

        function resolverItemInsignia(id) {
            if (!id) return null;
            if (viewingUserId) {
                const uObj = window.cachePerfilesSocial && window.cachePerfilesSocial[viewingUserId];
                const mapa = (uObj && uObj.badgesUnlocked) || {};
                const items = itemsInsigniasDesdeMapa(mapa);
                const hit = items.find(i => i.id === id);
                if (hit) return hit;
                const def = BADGE_DEFS.find(d => d.id === id);
                if (!def) return null;
                return { ...def, ok: false, progress: 0, target: def.target, unlockedAt: null };
            }
            const { items } = sincronizarInsigniasConMetricas({ skipCloud: true });
            return items.find(i => i.id === id) || null;
        }

        const OJO_ABIERTO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12 18.5 18.5 12 18.5 2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
        const OJO_CERRADO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12 18.5 18.5 12 18.5 2 12 2 12Z"/><path d="M4 4l16 16"/></svg>';

        function htmlAccionesModalInsignia(item, opts) {
            opts = opts || {};
            const ajeno = !!opts.ajeno;
            if (!item || ajeno || !item.ok) {
                return '';
            }
            // El estado REAL (en el perfil o no) decide el aspecto del botón,
            // tanto si el visor se abrió desde "colección" como desde "perfil":
            // al alternar, el re-render refleja el nuevo estado (verde ↔ rojo).
            const enShow = estaEnShowcase(item.id);
            if (enShow) {
                return `<button type="button" class="badge-showcase-btn is-showing" onclick="event.stopPropagation(); alternarShowcaseInsignia3D('${item.id}')">${OJO_ABIERTO_SVG}<span>No mostrar en perfil</span></button>`;
            }
            return `<button type="button" class="badge-showcase-btn is-hidden" onclick="event.stopPropagation(); alternarShowcaseInsignia3D('${item.id}')">${OJO_CERRADO_SVG}<span>Mostrar en perfil</span></button>`;
        }

        function alternarShowcaseInsignia3D(id) {
            if (!id || viewingUserId) return;
            const map = leerInsigniasEncendidas();
            if (!map[id]) return;
            const enShow = estaEnShowcase(id);
            if (enShow) {
                quitarInsigniaShowcase(id);
            } else {
                agregarInsigniaShowcase(id);
            }
            // Re-render la acción en sitio sin cerrar el visor 3D
            const item = resolverItemInsignia(id);
            const actions = document.getElementById('badge-detail-actions');
            if (actions && item) {
                actions.innerHTML = htmlAccionesModalInsignia(item, { ajeno: !!viewingUserId, modo: badgeVistaActiva });
                // Al ocultar/mostrar una insignia cambia la vitrina del perfil:
                // refrescar la navegación del visor en el acto, anclada en la
                // insignia que está en pantalla (no en la que se acaba de alternar).
                const visto = (badgeDetalleId && badgeDetalleId !== id) ? (resolverItemInsignia(badgeDetalleId) || item) : item;
                badgeNavIds = construirNavegacionVisorInsignia(visto);
                badgeNavIdx = badgeNavIds.indexOf(visto.id);
                if (badgeNavIdx === -1 && badgeNavIds.length) badgeNavIdx = 0;
                pintarNavegacionVisor();
            }
        }

        let moneda3DModal = null;
        let badgeNavIds = [];
        let badgeNavIdx = -1;
        let badgeSwipeState = null;
        let badgeGestosConectados = false;

        function conectarGestosInsignias() {
            if (badgeGestosConectados) return;
            const modal = document.getElementById('badge-detail-modal');
            if (!modal) return;

            let touchZone = null;
            function onTouchStart(e) {
                if (!modal.classList.contains('active')) return;
                const t = e.changedTouches && e.changedTouches[0];
                if (!t) return;
                // Si el dedo cae sobre la moneda, NO se activa el deslizar entre insignias
                // (esa zona solo sirve para manipular/rotar la moneda).
                touchZone = (e.target && e.target.closest && e.target.closest('#badge-detail-canvas')) ? 'coin' : 'nav';
                badgeSwipeState = touchZone === 'nav' ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
            }
            function onTouchEnd(e) {
                if (!modal.classList.contains('active')) return;
                const start = badgeSwipeState;
                badgeSwipeState = null;
                touchZone = null;
                if (!start) return;
                const t = e.changedTouches && e.changedTouches[0];
                if (!t) return;
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                const dt = Date.now() - start.t;
                const adx = Math.abs(dx);
                // Flick rápido y marcadamente horizontal -> navegar entre insignias.
                if (adx > 64 && adx > Math.abs(dy) * 1.5 && dt < 500) {
                    e.preventDefault && e.preventDefault();
                    navegarInsignia(dx < 0 ? 1 : -1);
                }
            }
            modal.addEventListener('touchstart', onTouchStart, { passive: true });
            modal.addEventListener('touchend', onTouchEnd, { passive: false });
            modal._badgeSwipeStart = onTouchStart;
            modal._badgeSwipeEnd = onTouchEnd;
            badgeGestosConectados = true;
        }

        function destruirMoneda3DModal() {
            if (moneda3DModal) {
                try { moneda3DModal.destroy(); } catch (e) {}
                if (moneda3DModal.canvas) moneda3DModal.canvas.__badgeCoin = null;
                const tilt = document.getElementById('badge-detail-tilt');
                if (tilt) tilt._badgeCoin = null;
                moneda3DModal = null;
            }
        }

        let badgeSwitchTimer = null;
        function navegarInsignia(dir) {
            const i = badgeNavIdx + dir;
            if (i < 0 || i >= badgeNavIds.length) return;
            const id = badgeNavIds[i];
            if (!id) return;
            clearTimeout(badgeSwitchTimer);
            const tilt = document.getElementById('badge-detail-tilt');
            const modal = document.getElementById('badge-detail-modal');
            const openBefore = modal ? modal.classList.contains('active') : false;
            // Reproducir salida antes de cambiar, salvo la primera apertura (ya hay entrada).
            if (tilt && openBefore) {
                tilt.classList.add('is-switching');
            }
            badgeSwitchTimer = setTimeout(() => {
                if (tilt) tilt.classList.remove('is-switching');
                abrirModalInsignia3D(id);
            }, 210);
        }

        let promesaCargaVisor3D = null;
        function cargarModuloInsignias3D() {
            if (!promesaCargaVisor3D) {
                promesaCargaVisor3D = import('./js/badges/badge-coin-3d.js').catch((err) => {
                    promesaCargaVisor3D = null; // permite reintentar en la próxima apertura
                    throw err;
                });
            }
            return promesaCargaVisor3D;
        }

        function construirNavegacionVisorInsignia(item) {
            // COLECCIÓN: serie completa del tema, incluidas las cerradas
            // (comportamiento original, totalmente intacto).
            if (badgeVistaActiva !== 'showcase') {
                return BADGE_DEFS.filter(d => d.theme === item.theme).map(d => d.id);
            }
            // SOCIAL (perfil propio o ajeno, apartado Insignias): se navega por
            // TODAS las insignias desbloqueadas y mostradas en ese perfil, en el
            // orden de su vitrina y sin importar el tema (B-34/B-36) — así los
            // botones anterior/siguiente aparecen siempre que el perfil muestre
            // más de una insignia, aunque sean de secciones distintas.
            try {
                const mapa = viewingUserId
                    ? (((window.cachePerfilesSocial && window.cachePerfilesSocial[viewingUserId]) || {}).badgesUnlocked || {})
                    : leerInsigniasEncendidas();
                const vitrina = itemsShowcaseDesdeMapa(mapa).map(i => i.id);
                if (vitrina.indexOf(item.id) === -1) vitrina.unshift(item.id);
                return vitrina;
            } catch (e) {
                return BADGE_DEFS.filter(d => d.theme === item.theme).map(d => d.id);
            }
        }

        function pintarNavegacionVisor() {
            const navPrev = document.getElementById('badge-detail-prev');
            const navNext = document.getElementById('badge-detail-next');
            if (navPrev) navPrev.classList.toggle('is-visible', badgeNavIdx > 0);
            if (navNext) navNext.classList.toggle('is-visible', badgeNavIdx >= 0 && badgeNavIdx < badgeNavIds.length - 1);
            const navCounter = document.getElementById('badge-detail-counter');
            if (navCounter) {
                navCounter.textContent = (badgeNavIdx + 1) + ' / ' + badgeNavIds.length;
                navCounter.classList.toggle('is-visible', badgeNavIds.length > 1);
            }
        }

        // ============================================================
        // B-35 · Visor 3D en iOS: diagnóstico + resiliencia del contexto
        // WebGL (escalera de atributos, DPR adaptativo, pérdida de
        // contexto, timeout del velo, degradación 2D y overlay ?debug3d=1)
        // ============================================================
        let badge3dVeloTimer = null;
        let badge3dBootId = 0;
        let badge3dModo = '3d'; // '3d' | '2d' (fallback) | 'error'
        let badge3dUsa2DFallback = false;
        let badge3dUltimoError = null;
        let badge3dAutoRetry = false;

        function tamanoVisorInsignia() {
            // Techo menor en iOS/iPad: aligera el backing store (dpr × MSAA).
            const ua = navigator.userAgent || '';
            const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 1));
            const maxPx = ios ? 520 : 680;
            return Math.max(240, Math.min(maxPx, window.innerWidth - 48, window.innerHeight - 320));
        }

        let badge3dDiagEnviados = 0;
        let badge3dJsErrors = [];
        let ultimoTapInsignia = null;

        // B-38 · Trampa global: cualquier error JS sin capturar se registra y se
        // auto-reporta. Imprescindible para iOS: si el manejador del toque muere
        // en silencio, aquí queda la huella y llega a badge3d_diags.
        function pushErrorDiag(kind, msg, stack) {
            const item = {
                t: Date.now(),
                kind: String(kind || 'error').slice(0, 60),
                msg: String(msg || '').slice(0, 220),
                stack: String(stack || '').slice(0, 500)
            };
            badge3dJsErrors.push(item);
            if (badge3dJsErrors.length > 10) badge3dJsErrors.shift();
            try {
                if (window.awakeAnalytics) window.awakeAnalytics.track('badge3d_js_error', { kind: item.kind, msg: item.msg });
            } catch (e) {}
            enviarDiagnostico3D({ evento: 'badge3d_js_error', jsError: item });
        }
        if (!window.__awakeBadge3DErrorTrap) {
            window.__awakeBadge3DErrorTrap = true;
            window.addEventListener('error', (ev) => {
                // Solo errores de ejecución JS (los 404 de recursos no traen ev.error).
                if (ev && ev.error) pushErrorDiag('error', (ev.message || 'error'), ev.error.stack || '');
            });
            window.addEventListener('unhandledrejection', (ev) => {
                const r = ev && ev.reason;
                pushErrorDiag('rejection', (r && (r.message || String(r))) || 'promesa', (r && r.stack) || '');
            });
        }
        // Sensor de toque muerto: si se pulsa una insignia y 600 ms después el
        // modal NO se ha abierto (y no estaba abierto ya), se reporta badge3d_tap_noop.
        if (!window.__awakeBadge3DTapSensor) {
            window.__awakeBadge3DTapSensor = true;
            document.addEventListener('click', (ev) => {
                const el = ev.target && ev.target.closest && ev.target.closest('.badge-card, .badge-theme-next, .badge-start-cta');
                if (!el) return;
                const modal = document.getElementById('badge-detail-modal');
                const yaAbierto = !!(modal && modal.classList.contains('active'));
                ultimoTapInsignia = {
                    t: Date.now(),
                    onclick: String(el.getAttribute && (el.getAttribute('onclick') || '')).slice(0, 90)
                };
                setTimeout(() => {
                    const abrio = !!(modal && modal.classList.contains('active'));
                    if (yaAbierto) return;
                    if (!abrio) {
                        trackVisor3D('badge3d_tap_noop', { onclick: ultimoTapInsignia ? ultimoTapInsignia.onclick : '' });
                    }
                }, 600);
            }, true);
        }

        // B-37 · Informe automático de diagnóstico 3D a Supabase (tabla
        // badge3d_diags, solo INSERT para anon). Se envía SIEMPRE cuando el
        // visor falla (cualquier dispositivo, sin PII) y en cada arranque si
        // se usa ?debug3d=1 → así el iPhone de un usuario que reporta un
        // fallo nos lo cuenta por sí solo, sin capturas manuales.
        function enviarDiagnostico3D(info) {
            if (badge3dDiagEnviados >= 8) return;
            try {
                if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
                const ua = String(navigator.userAgent).slice(0, 300);
                const rastro = [];
                try {
                    const raw = localStorage.getItem((window.awakeAnalytics && window.awakeAnalytics.LOCAL_KEY) || 'proto2awake_analytics_log');
                    if (raw) {
                        JSON.parse(raw).filter(x => x && x.n && /^badge3d_/.test(x.n)).slice(-10).forEach(x => {
                            rastro.push(x.n + (x.p && x.p.reason ? ':' + String(x.p.reason).slice(0, 60) : ''));
                        });
                    }
                } catch (e) {}
                const payload = Object.assign({
                    t: Date.now(),
                    ua: ua,
                    dpr: (typeof devicePixelRatio === 'number') ? devicePixelRatio : null,
                    screen: (window.screen && window.screen.width) ? String(window.screen.width) + 'x' + String(window.screen.height) : '',
                    webgl: (typeof WebGL2RenderingContext !== 'undefined') ? 'si' : 'no',
                    hardwareConcurrency: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null,
                    deviceMemory: (typeof navigator !== 'undefined' && navigator.deviceMemory) ? navigator.deviceMemory : null,
                    modo: badge3dModo,
                    ultimoError: badge3dUltimoError || null,
                    rastro: rastro,
                    caps: (window.BadgeCoin3D && window.BadgeCoin3D.diag && window.BadgeCoin3D.diag()) || null,
                    engine: (moneda3DModal && moneda3DModal.diag && moneda3DModal.diag.detalle) || null
                }, info || {});
                badge3dDiagEnviados++;
                supabaseClient.from('badge3d_diags').insert([{ user_agent: ua, payload: payload }]).then((r) => {
                    try {
                        console.log('[badge3d_diag]', r && r.error ? 'ERROR: ' + (r.error.message || String(r.error)) : 'OK');
                    } catch (e) {}
                }).catch(() => {});
            } catch (e) { /* el diagnóstico nunca debe romper el flujo */ }
        }

        function trackVisor3D(name, props) {
            try {
                if (window.awakeAnalytics) window.awakeAnalytics.track(name, props || {});
                // Fallo → informe automático; éxito → solo con ?debug3d=1 (traza completa).
                const esFallo = /badge3d_(fail|timeout|module_error|fallback_2d|context_lost_ui|tap_noop)/.test(name);
                if (esFallo || activoDebug3D()) {
                    enviarDiagnostico3D({ evento: name, props: props || {} });
                }
            } catch (e) {}
            try { pintarOverlayDebug3DSiActivo(); } catch (e2) {}
        }

        function limpiarVeloInsignia() {
            if (badge3dVeloTimer) { clearTimeout(badge3dVeloTimer); badge3dVeloTimer = null; }
            const velo = document.getElementById('badge-detail-velo');
            if (velo) velo.classList.remove('is-loading');
        }

        function mostrarEstadoVisorInsignia(mensaje, accionLabel, accionFn) {
            const modal = document.getElementById('badge-detail-modal');
            if (!modal) return;
            let chip = modal.querySelector('.badge3d-status');
            if (!chip) {
                chip = document.createElement('div');
                chip.className = 'badge3d-status';
                modal.appendChild(chip);
            }
            chip.innerHTML = '<span class="badge3d-status-txt"></span><button type="button" class="badge3d-status-btn"></button>';
            const txt = chip.querySelector('.badge3d-status-txt');
            if (txt) txt.textContent = mensaje;
            const btn = chip.querySelector('.badge3d-status-btn');
            if (btn) {
                if (accionLabel && typeof accionFn === 'function') {
                    btn.textContent = accionLabel;
                    btn.style.display = '';
                    btn.onclick = (e) => { e.stopPropagation(); accionFn(); };
                } else {
                    btn.style.display = 'none';
                }
            }
            chip.classList.add('is-on');
        }

        function ocultarEstadoVisorInsignia() {
            const modal = document.getElementById('badge-detail-modal');
            if (!modal) return;
            const chip = modal.querySelector('.badge3d-status');
            if (chip) chip.classList.remove('is-on');
        }

        function limpiarFallback2DInsignia() {
            const tilt = document.getElementById('badge-detail-tilt');
            if (!tilt) return;
            const fb = tilt.querySelector('.badge3d-fallback');
            if (fb) fb.remove();
            const canvas = document.getElementById('badge-detail-canvas');
            if (canvas) {
                canvas.style.visibility = '';
                canvas.style.display = '';
            }
            if (badge3dModo === '2d') badge3dModo = '3d';
        }

        function mostrarFallback2DInsignia(item) {
            badge3dModo = '2d';
            limpiarVeloInsignia();
            ocultarEstadoVisorInsignia();
            const tilt = document.getElementById('badge-detail-tilt');
            const canvas = document.getElementById('badge-detail-canvas');
            if (!tilt || !item) return;
            if (canvas) {
                canvas.style.visibility = 'hidden';
                canvas.style.display = 'none';
            }
            let fb = tilt.querySelector('.badge3d-fallback');
            if (!fb) {
                fb = document.createElement('div');
                fb.className = 'badge3d-fallback';
                tilt.appendChild(fb);
            }
            const sello = generarSelloInsigniaFrente(item.theme, item.level, true, { uid: 'fb-' + item.id + '-' + Date.now() });
            fb.innerHTML = '<div class="badge3d-fallback-seal">' + sello + '</div>'
                + '<div class="badge3d-fallback-note">Visor 3D no disponible en este dispositivo</div>';
        }

        async function arrancarMoneda3D(item, vOpts) {
            const boot = ++badge3dBootId;
            const modal = document.getElementById('badge-detail-modal');
            const canvas = document.getElementById('badge-detail-canvas');
            const tilt = document.getElementById('badge-detail-tilt');
            const velo = document.getElementById('badge-detail-velo');
            if (!modal || !canvas || !tilt) return;

            if (badge3dUsa2DFallback) {
                mostrarFallback2DInsignia(item);
                return;
            }
            limpiarFallback2DInsignia();
            badge3dModo = '3d';
            ocultarEstadoVisorInsignia();
            if (velo) velo.classList.add('is-loading');

            // Timeout del velo: si en 10 s no hay onReady/onFail, avisar.
            if (badge3dVeloTimer) clearTimeout(badge3dVeloTimer);
            badge3dVeloTimer = setTimeout(() => {
                if (boot !== badge3dBootId) return;
                if (moneda3DModal && moneda3DModal.isReady && moneda3DModal.isReady()) return;
                limpiarVeloInsignia();
                trackVisor3D('badge3d_timeout', {});
                mostrarEstadoVisorInsignia('El visor 3D está tardando más de lo normal', 'Reintentar', () => reintentarMoneda3D(item));
            }, 10000);

            try {
                trackVisor3D('badge3d_open', { id: item.id });
                await cargarModuloInsignias3D();
                if (boot !== badge3dBootId) return;
                trackVisor3D('badge3d_module_ok', {});
            } catch (e) {
                console.error('No se pudo cargar el visor 3D de insignias:', e);
                if (boot !== badge3dBootId) return;
                limpiarVeloInsignia();
                trackVisor3D('badge3d_module_error', { error: (e && e.message) || String(e) });
                mostrarEstadoVisorInsignia('No se pudo cargar el visor 3D', 'Reintentar', () => reintentarMoneda3D(item));
                return;
            }
            if (boot !== badge3dBootId) return;
            if (typeof window.BadgeCoin3D !== 'function') {
                limpiarVeloInsignia();
                trackVisor3D('badge3d_fail', { reason: 'badgecoin-no-cargado' });
                mostrarEstadoVisorInsignia('Visor 3D no disponible', 'Cerrar', () => cerrarModalInsignia3D());
                return;
            }

            // Sonda cacheada: sin WebGL2 -> degradación 2D directa (iOS < 15).
            let probeOk = false;
            try { probeOk = !!(window.BadgeCoin3D.probe && window.BadgeCoin3D.probe()); } catch (e) {}
            if (!probeOk) {
                badge3dUsa2DFallback = true;
                trackVisor3D('badge3d_fallback_2d', { reason: (window.BadgeCoin3D.diag && window.BadgeCoin3D.diag().reason) || 'probe-false' });
                mostrarFallback2DInsignia(item);
                return;
            }

            const t0 = performance.now();
            try {
                moneda3DModal = new window.BadgeCoin3D(canvas, {
                    size: vOpts.size,
                    metalId: vOpts.metal,
                    themeId: vOpts.themeIdx >= 0 ? vOpts.themeIdx : 0,
                    level: item.level,
                    encendida: true,
                    unlockedAt: item.unlockedAt || null,
                    onReady: function () {
                        if (boot !== badge3dBootId) return;
                        limpiarVeloInsignia();
                        ocultarEstadoVisorInsignia();
                        const t2 = document.getElementById('badge-detail-tilt');
                        if (t2) {
                            t2.classList.remove('is-switching');
                            t2.classList.add('is-entering');
                            setTimeout(function () { t2.classList.remove('is-entering'); }, 460);
                        }
                    },
                    onFail: function (info) {
                        if (boot !== badge3dBootId) return;
                        limpiarVeloInsignia();
                        const fatal = !!(info && info.fatal);
                        const reason = (info && info.reason) || 'desconocido';
                        badge3dUltimoError = reason;
                        if (fatal) {
                            badge3dUsa2DFallback = true;
                            trackVisor3D('badge3d_fail', { reason: reason + ' (fatal)' });
                            mostrarFallback2DInsignia(item);
                        } else {
                            trackVisor3D('badge3d_fail', { reason: reason + ' (boot)' });
                            mostrarEstadoVisorInsignia('Hubo un problema al encender el visor 3D', 'Reintentar', () => reintentarMoneda3D(item));
                        }
                    },
                    onContextLost: function () {
                        if (boot !== badge3dBootId) return;
                        limpiarVeloInsignia();
                        trackVisor3D('badge3d_context_lost_ui', {});
                        mostrarEstadoVisorInsignia('El render 3D se detuvo temporalmente', 'Toca para reintentar', () => reintentarMoneda3D(item));
                    },
                    onContextRestored: function () {
                        if (boot !== badge3dBootId) return;
                        ocultarEstadoVisorInsignia();
                    }
                });
                canvas.__badgeCoin = moneda3DModal;
                tilt._badgeCoin = moneda3DModal;
                const diag = (window.BadgeCoin3D.diag && window.BadgeCoin3D.diag()) || {};
                const engDiag = (moneda3DModal.diag && moneda3DModal.diag.detalle) || {};
                trackVisor3D('badge3d_engine', Object.assign({}, diag, engDiag, { buildMs: Math.round(performance.now() - t0) }));
            } catch (e) {
                console.error('Visor 3D de insignias:', e);
                if (boot !== badge3dBootId) return;
                limpiarVeloInsignia();
                badge3dUsa2DFallback = true;
                badge3dUltimoError = (e && e.message) || String(e);
                trackVisor3D('badge3d_fail', { reason: badge3dUltimoError });
                mostrarFallback2DInsignia(item);
            }
        }

        function reintentarMoneda3D(item) {
            if (!item) return;
            try { destruirMoneda3DModal(); } catch (e) {}
            if (badge3dUsa2DFallback) {
                mostrarFallback2DInsignia(item);
                return;
            }
            ocultarEstadoVisorInsignia();
            arrancarMoneda3D(item, {
                size: tamanoVisorInsignia(),
                metal: metalVisualLevel(item.theme, item.level),
                themeIdx: BADGE_THEMES.findIndex(t => t.id === item.theme)
            });
        }

        function onVisibilidadVisor3D() {
            if (document.visibilityState !== 'visible') return;
            const modal = document.getElementById('badge-detail-modal');
            if (!modal || !modal.classList.contains('active')) return;
            if (!moneda3DModal || !badgeDetalleId || badge3dModo !== '3d') return;
            // Tras volver a la app, si iOS revocó el contexto, reconstruir una vez.
            const eng = moneda3DModal._engine;
            if (eng && eng._contextLost && !badge3dAutoRetry) {
                badge3dAutoRetry = true;
                setTimeout(() => { badge3dAutoRetry = false; }, 6000);
                reintentarMoneda3D(resolverItemInsignia(badgeDetalleId));
            }
        }

        // ---- Overlay de diagnóstico (?debug3d=1) ----
        let overlayDebug3D = null;
        let overlayDebug3DTimer = null;

        function activoDebug3D() {
            try { return /[?&]debug3d=1/.test(location.search); } catch (e) { return false; }
        }

        function iniciarOverlayDebug3D() {
            if (!activoDebug3D() || overlayDebug3D) return;
            const div = document.createElement('div');
            div.id = 'debug3d-panel';
            div.innerHTML = '<div class="debug3d-head"><strong>3D debug</strong><button type="button" id="debug3d-close" aria-label="Cerrar debug">✕</button></div>'
                + '<pre id="debug3d-body"></pre>'
                + '<div class="debug3d-actions"><button type="button" id="debug3d-copy">Copiar</button><button type="button" id="debug3d-refresh">Actualizar</button></div>';
            document.body.appendChild(div);
            overlayDebug3D = div;
            const closeBtn = document.getElementById('debug3d-close');
            if (closeBtn) closeBtn.onclick = () => { if (div.remove) div.remove(); overlayDebug3D = null; };
            const refreshBtn = document.getElementById('debug3d-refresh');
            if (refreshBtn) refreshBtn.onclick = pintarOverlayDebug3D;
            const copyBtn = document.getElementById('debug3d-copy');
            if (copyBtn) copyBtn.onclick = () => {
                const body = document.getElementById('debug3d-body');
                const txt = body ? body.textContent : '';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txt).then(() => {
                        copyBtn.textContent = '¡Copiado!'; setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 1500);
                    }).catch(() => {});
                }
            };
            pintarOverlayDebug3D();
            if (!overlayDebug3DTimer) overlayDebug3DTimer = setInterval(pintarOverlayDebug3D, 3000);
        }

        function pintarOverlayDebug3D() {
            if (!overlayDebug3D) return;
            const body = document.getElementById('debug3d-body');
            if (!body) return;
            const lineas = [];
            try {
                const key = (window.awakeAnalytics && window.awakeAnalytics.LOCAL_KEY) || 'proto2awake_analytics_log';
                const raw = localStorage.getItem(key);
                if (raw) {
                    const arr = JSON.parse(raw);
                    arr.filter(x => x && x.n && /^badge3d_|^badge_/.test(x.n)).slice(-20).forEach(x => {
                        lineas.push(new Date(x.t).toISOString().slice(11, 19) + ' ' + x.n + ' ' + JSON.stringify(x.p || {}));
                    });
                }
            } catch (e) {}
            try {
                const diag = (window.BadgeCoin3D && window.BadgeCoin3D.diag && window.BadgeCoin3D.diag()) || {};
                lineas.push('-- caps: ' + JSON.stringify(diag));
            } catch (e) {}
            if (moneda3DModal && moneda3DModal.diag) {
                lineas.push('-- engine: ' + JSON.stringify(moneda3DModal.diag.detalle || moneda3DModal.diag));
            }
            lineas.push('-- modo: ' + badge3dModo + ' · ultimoError: ' + (badge3dUltimoError || '-'));
            if (ultimoTapInsignia) lineas.push('-- ultimo tap: ' + JSON.stringify(ultimoTapInsignia));
            badge3dJsErrors.slice(-4).forEach(e => {
                lineas.push('-- JS ' + e.kind + ': ' + e.msg + (e.stack ? ' @' + e.stack.slice(0, 120) : ''));
            });
            lineas.push('-- UA: ' + String(navigator.userAgent).slice(0, 140));
            body.textContent = lineas.join('\n');
        }

        function pintarOverlayDebug3DSiActivo() {
            if (overlayDebug3D) pintarOverlayDebug3D();
        }

        if (!window.__awakeBadge3DB35Init) {
            window.__awakeBadge3DB35Init = true;
            document.addEventListener('visibilitychange', onVisibilidadVisor3D);
            if (activoDebug3D()) iniciarOverlayDebug3D();
        }

        function abrirModalInsignia3D(id) {
            if (!id) return;
            try { if (window.awakeAnalytics) window.awakeAnalytics.track('badge_opened_3d', { id: id }); } catch (e) {}
            const item = resolverItemInsignia(id);
            if (!item) return;
            const modal = document.getElementById('badge-detail-modal');
            const meta = document.getElementById('badge-detail-meta');
            const actions = document.getElementById('badge-detail-actions');
            const tilt = document.getElementById('badge-detail-tilt');
            const canvas = document.getElementById('badge-detail-canvas');
            if (!modal || !canvas || !tilt) return;
            try { conectarGestosInsignias(); } catch (e) { console.error('conectarGestosInsignias:', e); }

            const ajeno = !!viewingUserId;
            const themeIdx = BADGE_THEMES.findIndex(t => t.id === item.theme);
            const metal = metalVisualLevel(item.theme, item.level);
            badgeDetalleId = id;
            badgeNavIds = construirNavegacionVisorInsignia(item);
            badgeNavIdx = badgeNavIds.indexOf(id);
            if (badgeNavIdx === -1 && badgeNavIds.length) badgeNavIdx = 0;
            pintarNavegacionVisor();
            try {
                if (meta) {
                    meta.innerHTML = htmlInsignia2D(item);
                }
                if (actions) {
                    actions.innerHTML = htmlAccionesModalInsignia(item, { ajeno, modo: badgeVistaActiva });
                }
                tilt.setAttribute('data-metal', String(metal));
                const texBack = tilt.querySelector('.badge-coin-tex-back');
                if (texBack) {
                    const host = texBack.querySelector('.badge-seal-reverse-host');
                    if (host) {
                        host.innerHTML = generarSelloInsigniaReverso(item.theme, item.level, { uid: 'rev-' + item.id });
                    }
                }
            } catch (e) {
                console.error('Preparación del visor de insignia:', e);
            }

            modal.classList.add('active');
            if (typeof programarSyncCapaFondo === 'function') programarSyncCapaFondo();

            destruirMoneda3DModal();
            arrancarMoneda3D(item, {
                size: tamanoVisorInsignia(),
                metal,
                themeIdx
            });
        }

        function cerrarModalInsignia3D() {
            destruirMoneda3DModal();
            const modal = document.getElementById('badge-detail-modal');
            if (modal) modal.classList.remove('active');
            const navPrev = document.getElementById('badge-detail-prev');
            const navNext = document.getElementById('badge-detail-next');
            if (navPrev) navPrev.classList.remove('is-visible');
            if (navNext) navNext.classList.remove('is-visible');
            const navCounter = document.getElementById('badge-detail-counter');
            if (navCounter) navCounter.classList.remove('is-visible');
            badge3dBootId++;
            limpiarVeloInsignia();
            ocultarEstadoVisorInsignia();
            badgeDetalleId = null;
            if (typeof programarSyncCapaFondo === 'function') programarSyncCapaFondo();
            document.querySelectorAll('.badge-card.is-open').forEach(el => el.classList.remove('is-open'));
        }

        function toggleDetalleInsignia(id) {
            const modal = document.getElementById('badge-detail-modal');
            if (modal && modal.classList.contains('active') && badgeDetalleId === id) {
                cerrarModalInsignia3D();
                return;
            }
            badgeDetalleId = id;
            try {
                try { renderizarInsignias(); } catch (e) {
                    console.error('renderizarInsignias (abrir insignia):', e);
                    pushErrorDiag('renderizarInsignias', e && e.message, e && e.stack);
                }
                try { abrirModalInsignia3D(id); } catch (e) {
                    console.error('abrirModalInsignia3D:', e);
                    pushErrorDiag('abrirModalInsignia3D', e && e.message, e && e.stack);
                    mostrarEstadoVisorInsignia('No se pudo abrir la insignia', 'Cerrar', () => cerrarModalInsignia3D());
                }
            } catch (e2) {
                pushErrorDiag('toggleDetalleInsignia', e2 && e2.message, e2 && e2.stack);
            }
        }

        function metalVisualLevel(theme, level) {
            return Math.max(1, Math.min(6, level || 1));
        }

        function etiquetaMetalInsignia(theme, level) {
            const metal = metalVisualLevel(theme, level);
            return ({ 1: 'Hierro', 2: 'Bronce', 3: 'Cobre', 4: 'Plata', 5: 'Oro', 6: 'Platino' })[metal] || 'Hierro';
        }

        function htmlSelloInsignia(theme, level, encendida, opts) {
            return generarSelloInsigniaFrente(theme, level, encendida, opts);
        }

        function sincronizarInsigniasConMetricas(opts) {
            opts = opts || {};
            const m = metricasInsignias();
            const saved = leerInsigniasEncendidas();
            const nuevas = [];
            const revocadas = [];
            let changed = false;

            BADGE_DEFS.forEach(def => {
                const prog = progresoInsignia(def, m);
                const ya = !!saved[def.id];
                // Desbloqueos permanentes: una insignia conseguida no se revoca
                // aunque la métrica baje del umbral (p. ej. deshacer un sello).
                // Así la notificación de logro se muestra UNA sola vez por
                // insignia y el progreso acumulado no se pierde al corregir un
                // error. (Comportamiento de logros en apps profesionales.)
                if (prog.ok && !ya) {
                    saved[def.id] = Date.now();
                    nuevas.push(def);
try { if (window.awakeAnalytics) window.awakeAnalytics.track('badge_unlocked', { id: def.id }); } catch (e) {}
                    changed = true;
                }
            });

            if (nuevas.length) {
                const show = leerShowcaseIds(saved);
                nuevas.forEach(d => {
                    if (show.indexOf(d.id) === -1) show.push(d.id);
                });
                saved._showcase = show;
                changed = true;
            }

            if (changed) {
                saved._schema = BADGE_SCHEMA;
                saved._showcase = sanitizarShowcaseIds(saved._showcase || [], saved);
                guardarInsigniasEncendidas(saved);
                if (!opts.skipCloud) {
                    try { persistirInsigniasNube(); } catch (e) {}
                }
            }

            const items = BADGE_DEFS.map(def => {
                const prog = progresoInsignia(def, m);
                // B-55: la insignia "encendida" se decide por el desbloqueo
                // GUARDADO, no por la métrica en vivo. Así la colección, la
                // vitrina del perfil y el visor 3D siempre coinciden (p. ej.
                // una foto de invitado en modo local no descuadra el estado).
                const unlockedAt = saved[def.id] || null;
                return {
                    ...def,
                    ok: !!unlockedAt,
                    progress: prog.value,
                    target: prog.target,
                    unlockedAt
                };
            });

            return { items, nuevas, revocadas, changed };
        }

        function revocarInsigniasSinMetrica(opts) {
            // B-56: al ELIMINAR de verdad la tarea/registro causante, la
            // insignia se retira si su umbral ya no se cumple. No dispara
            // banner (revocación silenciosa). Deshacer un sello NO pasa por
            // aquí: ese desbloqueo se mantiene (B-41/B-46).
            opts = opts || {};
            const m = metricasInsignias();
            const saved = leerInsigniasEncendidas();
            const revocadas = [];
            let changed = false;
            BADGE_DEFS.forEach(def => {
                if (saved[def.id] == null) return;
                const prog = progresoInsignia(def, m);
                if (!prog.ok) {
                    delete saved[def.id];
                    revocadas.push(def.id);
                    changed = true;
                }
            });
            if (revocadas.length && Array.isArray(saved._showcase)) {
                saved._showcase = saved._showcase.filter(id => revocadas.indexOf(id) === -1);
            }
            if (changed) {
                // Si se revoca una insignia (p. ej. deshacer el sello antes de que
                // llegue su aviso), se retira también el banner/toast pendiente.
                badgeToastPendiente = null;
                insigniasPendientesSello = [];
                saved._schema = BADGE_SCHEMA;
                saved._showcase = sanitizarShowcaseIds(saved._showcase || [], saved);
                guardarInsigniasEncendidas(saved);
                if (!opts.skipCloud) {
                    try { persistirInsigniasNube(); } catch (e) {}
                }
            }
            return { revocadas, changed };
        }

        function catalogoInsignias() {
            const { items, nuevas } = sincronizarInsigniasConMetricas();
            if (nuevas.length) {
                nuevas.forEach(d => { badgeJustUnlockedIds[d.id] = Date.now(); });
                if (lastSealSnapshot) {
                    nuevas.forEach(d => {
                        if (insigniasPendientesSello.indexOf(d.id) === -1) {
                            insigniasPendientesSello.push(d.id);
                        }
                    });
                }
                const primera = nuevas[0];
                badgeDetalleId = primera.id;
                const metal = etiquetaMetalInsignia(primera.theme, primera.level);
                const msg = nuevas.length === 1
                    ? `${primera.title} · ${metal}`
                    : `${nuevas.length} insignias · ${primera.title}`;
                try {
                    pulsoHaptico(22);
                    setTimeout(() => { try { pulsoHaptico(12); } catch (e2) {} }, 140);
                } catch (e) {}
                // Notificación de logro no intrusiva: banner superior con opción
                // "Ver". NO navega solo — el usuario decide si abrir la insignia.
                encolarToastInsignia({ msg, id: primera.id, theme: primera.theme, level: primera.level });
            }
            return items;
        }

        function itemsInsigniasDesdeMapa(mapa, opts) {
            opts = opts || {};
            const soloEncendidas = !!opts.soloEncendidas;
            const saved = normalizarMapaInsignias(mapa);
            return BADGE_DEFS.map(def => {
                const unlockedAt = saved[def.id] || null;
                const encendida = !!unlockedAt;
                return {
                    ...def,
                    ok: encendida,
                    progress: encendida ? def.target : 0,
                    target: def.target,
                    unlockedAt
                };
            }).filter(i => !soloEncendidas || i.ok);
        }

        function htmlInsignia2D(item) {
            if (!item) return '';
            const metal = etiquetaMetalInsignia(item.theme, item.level);
            const metalChip = `<span class="badge-metal-chip metal-${metalVisualLevel(item.theme, item.level)}">${escapeHtmlChat(metal)}</span>`;
            const seccion = (BADGE_THEMES.find(t => t.id === item.theme) || {}).label || '';
            const seccionTag = seccion ? `<div class="badge-detail-section">${escapeHtmlChat(seccion)}</div>` : '';
            // En el visor el devamos verse encendida (pleno esplendor), incluso si está bloqueada.
            const sello = htmlSelloInsignia(item.theme, item.level, true, { uid: 'meta2d-' + item.id });
            const estadoIcon = item.ok
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 7.6-1.6"/><circle cx="12" cy="15.5" r="1.8"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.8"/></svg>';
            const estadoIconWrap = `<span class="badge-seal2d-state${item.ok ? ' is-unlocked' : ' is-locked'}">${estadoIcon}</span>`;
            return '<div class="badge-detail-seal2d">' + seccionTag
                + `<div class="badge-seal-wrap">${sello}</div>`
                + `<div class="badge-seal2d-row"><span class="badge-card-title">${escapeHtmlChat(item.title)}</span>${metalChip}${estadoIconWrap}</div>`
                + '</div>';
        }

        function textoDetalleInsignia(item, opts) {
            opts = opts || {};
            if (!item) return '';
            const metal = etiquetaMetalInsignia(item.theme, item.level);
            const metalChip = `<span class="badge-metal-chip metal-${metalVisualLevel(item.theme, item.level)}">${escapeHtmlChat(metal)}</span>`;
            const seccion = (BADGE_THEMES.find(t => t.id === item.theme) || {}).label || '';
            const seccionTag = seccion ? `<div class="badge-detail-section">${escapeHtmlChat(seccion)}</div>` : '';
            if (item.ok && item.unlockedAt) {
                const d = new Date(item.unlockedAt);
                const fecha = isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                return fecha
                    ? `${seccionTag}${metalChip}<br>Conseguida el ${escapeHtmlChat(fecha)}`
                    : `${seccionTag}${metalChip}<br>Conseguida`;
            }
            if (opts.ajeno) {
                return `${seccionTag}${metalChip}<br>Conseguida`;
            }
            const target = item.target || 1;
            if (target <= 1) {
                return `${seccionTag}${metalChip}<br>Por encender`;
            }
            const cur = Math.min(item.progress || 0, target);
            return `${seccionTag}${metalChip}<br>${cur} / ${target} conseguidas`;
        }

        function htmlMeterDetalleInsignia(item, opts) {
            opts = opts || {};
            if (!item || opts.ajeno || item.ok) return '';
            const target = Math.max(1, item.target || 1);
            const cur = Math.min(Math.max(0, item.progress || 0), target);
            const pct = Math.round((cur / target) * 100);
            const label = target <= 1
                ? (cur >= 1 ? 'Lista' : 'Por encender')
                : `${cur} de ${target}`;
            return `<div class="badge-detail-meter" aria-hidden="true">
                <div class="badge-detail-meter-track"><div class="badge-detail-meter-fill" style="width:${pct}%"></div></div>
                <div class="badge-detail-meter-label">${escapeHtmlChat(label)}</div>
            </div>`;
        }

        function htmlArcoProgresoInsignia(item) {
            if (!item || item.ok) return '';
            const target = Math.max(1, item.target || 1);
            const cur = Math.min(Math.max(0, item.progress || 0), target);
            const pct = target <= 1 ? (cur >= 1 ? 1 : 0) : (cur / target);
            if (pct <= 0) return '';
            const r = 27.2;
            const circ = 2 * Math.PI * r;
            const dash = Math.max(0.8, pct * circ);
            return `<svg class="badge-prog-ring" viewBox="0 0 64 64" aria-hidden="true">
                <circle class="badge-prog-track" cx="32" cy="32" r="${r}"/>
                <circle class="badge-prog-fill" cx="32" cy="32" r="${r}"
                    stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}"
                    transform="rotate(-90 32 32)"/>
            </svg>`;
        }

        function proximaInsigniaTema(group) {
            if (!group || !group.length) return null;
            return group
                .filter(i => i && !i.ok)
                .slice()
                .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0))[0] || null;
        }

        function textoProximaInsigniaTema(group) {
            const next = proximaInsigniaTema(group);
            if (!next) {
                return (group || []).some(i => i && i.ok) ? 'Tema completo' : '';
            }
            const target = next.target || 1;
            const cur = Math.min(next.progress || 0, target);
            if (target <= 1) return `Próxima · ${next.title}`;
            return `Próxima · ${next.title} (${cur}/${target})`;
        }

        function actualizarContadorSubtabInsignias(items) {
            const el = document.getElementById('profile-insignias-count');
            let showcaseCount;
            if (viewingUserId) {
                showcaseCount = Array.isArray(items) ? items.filter(i => i && i.ok).length : 0;
            } else {
                showcaseCount = leerShowcaseIds().length;
            }
            if (el) {
                if (!showcaseCount) {
                    el.textContent = '';
                    el.classList.add('hidden');
                } else {
                    el.textContent = String(showcaseCount);
                    el.classList.remove('hidden');
                }
            }
        }

        function pintarGridInsignias(root, items, opts) {
            opts = opts || {};
            const ajeno = !!opts.ajeno;
            const modo = opts.modo || 'coleccion';
            badgeVistaActiva = modo;
            const byId = {};
            items.forEach(i => { byId[i.id] = i; });
            const unlocked = items.filter(i => i.ok).length;
            const total = ajeno ? unlocked : BADGE_DEFS.length;

            let html = `<div class="history-week-summary" style="margin-bottom:12px;">${
                ajeno
                    ? (unlocked ? `${unlocked} encendida${unlocked === 1 ? '' : 's'}` : 'Sin insignias aún')
                    : `${unlocked} de ${total} encendidas`
            }</div>`;

            if (ajeno && !unlocked) {
                root.innerHTML = html + htmlEstadoVacio({
                    title: 'Sin insignias',
                    text: 'Cuando selle su ritual, aparecerán aquí.',
                    icon: ICONO_VACIO_HISTORIAL
                });
                actualizarContadorSubtabInsignias(items);
                return;
            }

            if (!ajeno && !unlocked) {
                html += `<div class="badge-start-card">
                    <div class="badge-start-copy">
                        <div class="badge-start-title">Ninguna encendida aún</div>
                        <div class="badge-start-text">Sella tu primera tarea del ritual. Abajo puedes ver cómo serán las medallas.</div>
                    </div>
                    <button type="button" class="badge-start-cta" onclick="irARitualDesdeInsignias()">Ir al ritual</button>
                </div>`;
            }

            const THEME_ICON_POR_TEMA = { sello: 'check', dia: 'sun-horizon', racha: 'flame', memoria: 'camera' };
            html += '<div class="badge-themes">';
            BADGE_THEMES.forEach(theme => {
                const group = items
                    .filter(i => i.theme === theme.id)
                    .slice()
                    .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
                if (!group.length) return;
                const onTheme = group.filter(i => i.ok).length;
                const themeCount = ajeno
                    ? `${onTheme}`
                    : `${onTheme}/${group.length}`;
                const next = ajeno ? null : proximaInsigniaTema(group);
                const nextHint = ajeno ? '' : textoProximaInsigniaTema(group);
                html += `<div class="badge-theme-block" data-theme="${escapeHtmlChat(theme.id)}">
                    <div class="badge-theme-label">
                        <span class="badge-theme-icon" aria-hidden="true">${svgPhosphorPorClave(THEME_ICON_POR_TEMA[theme.id] || 'medal', 18, 'currentColor')}</span>
                        <span class="badge-theme-name">${escapeHtmlChat(theme.label)}</span>
                        <span class="badge-theme-count">${escapeHtmlChat(themeCount)}</span>
                    </div>`;
                if (nextHint && next) {
                    html += `<button type="button" class="badge-theme-next is-action" onclick="toggleDetalleInsignia('${next.id}')">${escapeHtmlChat(nextHint)}</button>`;
                } else if (nextHint) {
                    html += `<div class="badge-theme-next">${escapeHtmlChat(nextHint)}</div>`;
                }
                html += `<div class="badge-grid">`;
                group.forEach(item => {
                    const target = item.target || 1;
                    const progTxt = item.ok
                        ? 'Encendida'
                        : (target <= 1
                            ? 'Por encender'
                            : `${Math.min(item.progress || 0, target)}/${target}`);
                    const isOpen = badgeDetalleId === item.id;
                    const just = !!badgeJustUnlockedIds[item.id];
                    const enPerfilIcon = (!ajeno && item.ok && estaEnShowcase(item.id))
                        ? '<span class="badge-in-profile" title="Mostrada en tu perfil" aria-label="Mostrada en tu perfil">' + OJO_ABIERTO_SVG + '</span> '
                        : '';
                    html += `<button type="button" class="badge-card${item.ok ? ' is-on' : ' is-locked'}${isOpen ? ' is-open' : ''}${just ? ' is-just-unlocked' : ''}" onclick="toggleDetalleInsignia('${item.id}')">
                        <div class="badge-seal-wrap">
                            ${htmlArcoProgresoInsignia(item)}
                            ${htmlSelloInsignia(item.theme, item.level, item.ok, { uid: item.id, justUnlocked: just })}
                        </div>
                        <div class="badge-card-title">${enPerfilIcon}${escapeHtmlChat(item.title)}</div>
                        ${ajeno ? '' : `<div class="badge-card-progress">${escapeHtmlChat(progTxt)}</div>`}
                    </button>`;
                });
                html += `</div>`;
                html += `</div>`;
            });
            html += '</div>';
            root.innerHTML = html;
            actualizarContadorSubtabInsignias(items);
            if (!ajeno && Object.keys(badgeJustUnlockedIds).length) {
                setTimeout(() => { badgeJustUnlockedIds = {}; }, 2100);
            }
        }

        function pintarShowcaseInsignias(root, items, opts) {
            opts = opts || {};
            const ajeno = !!opts.ajeno;
            badgeVistaActiva = 'showcase';
            const byId = {};
            items.forEach(i => { byId[i.id] = i; });
            const n = items.length;
            let html = `<div class="history-week-summary" style="margin-bottom:12px;">${
                ajeno
                    ? (n ? `${n} en perfil` : 'Sin insignias en perfil')
                    : (n ? `${n} en tu perfil` : 'Nada en tu perfil aún')
            }</div>`;

            if (!n) {
                if (ajeno) {
                    root.innerHTML = html + htmlEstadoVacio({
                        title: 'Sin insignias',
                        text: 'Todavía no presume ninguna medalla.',
                        icon: ICONO_VACIO_HISTORIAL
                    });
                } else {
                    const map = leerInsigniasEncendidas();
                    const unlocked = BADGE_DEFS.filter(d => map[d.id]).length;
                    html += `<div class="badge-start-card">
                        <div class="badge-start-copy">
                            <div class="badge-start-title">${unlocked ? 'Perfil sin medallas' : 'Ninguna encendida aún'}</div>
                            <div class="badge-start-text">${unlocked
                                ? 'Elige en Colección cuáles quieres presumir aquí.'
                                : 'Sella tu ritual para encender la primera. Luego podrás elegir cuáles mostrar.'}</div>
                        </div>
                        <button type="button" class="badge-start-cta" onclick="${unlocked ? 'irAColeccionInsignias()' : 'irARitualDesdeInsignias()'}">${unlocked ? 'Ir a Colección' : 'Ir al ritual'}</button>
                    </div>`;
                    root.innerHTML = html;
                }
                actualizarContadorSubtabInsignias(items);
                return;
            }

            html += `<div class="badge-grid badge-grid-showcase">`;
            items.forEach(item => {
                const isOpen = badgeDetalleId === item.id;
                const just = !!badgeJustUnlockedIds[item.id];
                html += `<button type="button" class="badge-card is-on${isOpen ? ' is-open' : ''}${just ? ' is-just-unlocked' : ''}" onclick="toggleDetalleInsignia('${item.id}')">
                    <div class="badge-seal-wrap">
                        ${htmlSelloInsignia(item.theme, item.level, true, { uid: 'show-' + item.id, justUnlocked: just })}
                    </div>
                    <div class="badge-card-title">${escapeHtmlChat(item.title)}</div>
                    ${ajeno ? '' : `<div class="badge-card-progress">En perfil</div>`}
                </button>`;
            });
            html += `</div>`;
            root.innerHTML = html;
            actualizarContadorSubtabInsignias(items);
            if (!ajeno && Object.keys(badgeJustUnlockedIds).length) {
                setTimeout(() => { badgeJustUnlockedIds = {}; }, 2100);
            }
        }

        function abrirPestanaInsigniasPerfil() {
            sincronizarVisibilidadColeccionSocial();
            cambiarSeccionSocial('perfil', document.getElementById('social-section-btn-perfil'));
            const insigniasTab = document.getElementById('profile-subtab-btn-insignias')
                || document.querySelectorAll('.profile-subtab')[1]
                || null;
            cambiarSubTabPerfil('insignias', insigniasTab);
            const root = document.getElementById('awake-badges-showcase-root');
            if (root) root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function abrirDetalleInsigniaPerfil(id) {
            if (!id) return;
            abrirPestanaInsigniasPerfil();
            setTimeout(() => {
                badgeDetalleId = id;
                renderizarInsignias();
                abrirModalInsignia3D(id);
            }, 120);
        }

        function irARitualDesdeInsignias() {
            cambiarTab(0);
        }

        function itemsShowcaseDesdeMapa(mapa) {
            const saved = normalizarMapaInsignias(mapa);
            const order = leerShowcaseIds(saved);
            const byId = {};
            itemsInsigniasDesdeMapa(saved, { soloEncendidas: true }).forEach(i => { byId[i.id] = i; });
            return order.map(id => byId[id]).filter(Boolean);
        }

        function renderizarInsignias() {
            sincronizarVisibilidadColeccionSocial();
            // Siempre evaluar desbloqueos propios (también si miras un perfil ajeno).
            const ownItems = catalogoInsignias();

            if (viewingUserId) {
                const uObj = window.cachePerfilesSocial && window.cachePerfilesSocial[viewingUserId];
                const mapa = (uObj && uObj.badgesUnlocked) || {};
                const items = itemsShowcaseDesdeMapa(mapa);
                const rootShow = document.getElementById('awake-badges-showcase-root');
                if (rootShow) pintarShowcaseInsignias(rootShow, items, { ajeno: true });
                else actualizarContadorSubtabInsignias(items);
                return;
            }

            if (socialSeccionActiva === 'coleccion') {
                const root = document.getElementById('awake-badges-root');
                if (root) pintarGridInsignias(root, ownItems, { ajeno: false, modo: 'coleccion' });
                actualizarContadorSubtabInsignias(itemsShowcaseDesdeMapa(leerInsigniasEncendidas()));
                return;
            }

            const showItems = itemsShowcaseDesdeMapa(leerInsigniasEncendidas());
            const rootShow = document.getElementById('awake-badges-showcase-root');
            if (rootShow) pintarShowcaseInsignias(rootShow, showItems, { ajeno: false });
            else actualizarContadorSubtabInsignias(showItems);
        }

        function cambiarVistaHistorial(vista, el) {
            historyVista = vista;
            document.querySelectorAll('.history-view-btn').forEach(b => b.classList.remove('active'));
            if (el) el.classList.add('active');
            aplicarTemaGlobalHabitos(currentThemeHue);
            renderizarTabHistorial();
        }

        function sincronizarVistaHistorialPorDefecto() {
            historyVista = 'ritual';
            document.querySelectorAll('#history-view-switch .history-view-btn').forEach(b => {
                const on = b.id === 'hist-view-ritual'
                    || String(b.getAttribute('onclick') || '').indexOf("'ritual'") !== -1;
                b.classList.toggle('active', on);
            });
            aplicarTemaGlobalHabitos(currentThemeHue);
            renderizarTabHistorial();
        }

        function actualizarCabeceraHistorial() {
            const el = document.getElementById('history-week-summary');
            if (!el) return;
            const s = resumenSemanaRitual();
            el.textContent = s.racha ? `${s.ok}/${s.prog || 0} · ${s.racha}` : `${s.ok}/${s.prog || 0}`;
        }

        function logCuentaEnHistorialRitual(l) {
            // Historial ritual: sellos reales + recaídas. Omitidos (y tombstones) fuera.
            if (!l || selloIdEstaEliminado(l.id)) return false;
            if (logEsOmitido(l)) return false;
            return true;
        }

        function logsHistorialRitualDeHabito(habitName) {
            const cleanHName = cleanHabitName(habitName);
            return logsHistorialOrdenados((historialAgrupado[cleanHName] || []).filter(logCuentaEnHistorialRitual));
        }

        function logsHistorialOrdenados(logs) {
            return (logs || []).slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }

        function nombresHabitosHistorialRitual() {
            const set = new Set();
            // Todo lo activo: hábitos, abstinencias y tareas (con o sin sello).
            (misHabitos || []).forEach(h => {
                if (!h || habitEsArchivado(h)) return;
                set.add(cleanHabitName(h.nombre));
            });
            // Deseos activos (pendientes) y cumplidos (siguen en el historial).
            (misDeseos || []).forEach(d => {
                if (!d) return;
                set.add(cleanHabitName(d.nombre));
            });
            return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
        }

        function appendAcordeonHistorialHabito(container, habitName, opts) {
            opts = opts || {};
            const cleanHName = cleanHabitName(habitName);
            const logs = opts.archivedIndex != null
                ? logsHistorialOrdenados((historialAgrupado[cleanHName] || []).filter(l => l && !selloIdEstaEliminado(l.id)))
                : logsHistorialRitualDeHabito(cleanHName);
            const deseo = (misDeseos || []).find(d => cleanHabitName(d.nombre) === cleanHName);
            const isDeseoCumplido = !!(deseo && deseo.completado);
            const isDeseoPendiente = !!(deseo && !deseo.completado);
            const archivedIndex = opts.archivedIndex;
            const hRef = typeof habitoPorNombre === 'function' ? habitoPorNombre(cleanHName) : null;
            const idxHab = hRef && misHabitos ? misHabitos.indexOf(hRef) : -1;
            const natLabel = hRef
                ? (typeof etiquetaNaturalezaHabito === 'function' ? etiquetaNaturalezaHabito(hRef) : '')
                : (deseo ? 'Deseo' : '');

            const accordionDiv = document.createElement('div');
            accordionDiv.className = 'history-habit-accordion';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'history-habit-header';

            if (isDeseoCumplido && idxHab < 0) {
                headerDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; text-align: left;">
                        ${htmlGlifoHabito(cleanHName, 20)}
                        <span>${escapeHtmlChat(cleanHName)}</span>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #34d399;">Cumplido</span>
                `;
                accordionDiv.appendChild(headerDiv);
            } else if (isDeseoPendiente && idxHab < 0) {
                headerDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; text-align: left; min-width: 0;">
                        ${htmlGlifoHabito(cleanHName, 20)}
                        <span>${escapeHtmlChat(cleanHName)}</span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">Deseo</span>
                    </div>
                    <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">Pendiente</span>
                `;
                accordionDiv.appendChild(headerDiv);
            } else {
                const isExpanded = !!historyExpanded[cleanHName];
                const chevron = `<span style="font-size: 0.8rem; transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.2s;">▶</span>`;
                let acciones;
                if (archivedIndex != null && !opts.conMenu) {
                    acciones = `<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                        ${chevron}
                        <button type="button" class="ig-btn-action" style="padding:6px 10px; font-size:0.68rem;" onclick="event.stopPropagation(); reactivarHabito(${archivedIndex})">Reactivar</button>
                        <button type="button" class="ig-btn-action" style="padding:6px 10px; font-size:0.68rem; color:#f87171; border-color:rgba(239,68,68,0.4);" onclick="event.stopPropagation(); solicitarEliminarHabito(${archivedIndex})">Eliminar</button>
                       </div>`;
                } else {
                    const menuId = 'hist-menu-' + cleanHName;
                    const trashIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
                    const reviveIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`;
                    const archiveIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3.5 8h17l-1-4H4.5l-1 4z"/><path d="M5 8v11a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8"/><path d="M10 12h4"/></svg>`;
                    let itemsHtml = '';
                    if (archivedIndex != null) {
                        itemsHtml += `<button type="button" class="ctx-item" onclick="event.stopPropagation(); reactivarHabito(${archivedIndex})">${reviveIcon} Reactivar</button>`;
                    } else if (idxHab > -1) {
                        itemsHtml += `<button type="button" class="ctx-item" onclick="event.stopPropagation(); archivarHabito(${idxHab})">${archiveIcon} Archivar</button>`;
                    }
                    itemsHtml += `<button type="button" class="ctx-item" style="color:#f87171;" onclick="event.stopPropagation(); solicitarEliminarHabito(${archivedIndex != null ? archivedIndex : idxHab})">${trashIcon} Eliminar</button>`;
                    acciones = `<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                        ${chevron}
                        <button type="button" class="habit-options-btn" onclick="toggleContextMenu(event, '${menuId}')" aria-label="Opciones">⋯</button>
                       </div>
                       <div id="${menuId}" class="habit-context-menu">${itemsHtml}</div>`;
                }

                const metaBits = [];
                if (natLabel) metaBits.push(natLabel);
                metaBits.push(`${logs.length} ${logs.length === 1 ? 'registro' : 'registros'}`);
                if (hRef && hRef.enDescanso) metaBits.push('Descansando');

                headerDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; text-align: left; min-width: 0;">
                        ${htmlGlifoHabito(cleanHName, 20, (hRef || {}).glyph, colorAcentoHabito(hRef))}
                        <span>${escapeHtmlChat(cleanHName)}</span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">(${escapeHtmlChat(metaBits.join(' · '))})</span>
                    </div>
                    ${acciones}
                `;

                headerDiv.onclick = () => {
                    historyExpanded[cleanHName] = !historyExpanded[cleanHName];
                    renderizarTabHistorial();
                };
                accordionDiv.appendChild(headerDiv);

                const bodyDiv = document.createElement('div');
                bodyDiv.className = `history-habit-body ${isExpanded ? 'active' : ''}`;

                if (logs.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.cssText = 'text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem; font-weight: 600;';
                    emptyMsg.textContent = hRef
                        ? 'Activo · aún sin sellos registrados.'
                        : 'No hay ejecuciones registradas.';
                    bodyDiv.appendChild(emptyMsg);
                } else {
                    const gridDiv = document.createElement('div');
                    gridDiv.className = 'history-images-grid';

                    const feedPostsHabito = [];
                    logs.forEach(pub => {
                        const imgUrl = pub.imagenes && pub.imagenes.length > 0 ? pub.imagenes[0] : (pub.image_url || null);
                        const thumb = document.createElement('div');
                        thumb.className = 'history-thumb-card' + (logEsRecaida(pub) ? ' is-recaida' : '');
                        const isPriv = pub.privacidad === 'privado';
                        const esRecaida = logEsRecaida(pub);

                        const snippetTexto = textoRitualLimpio(pub.texto);
                        const tituloSello = tituloSelloPublicacion(pub);
                        const badgeRecaida = esRecaida ? `<div class="thumb-badge-top-right" style="background:rgba(248,113,113,0.92);color:#111;font-weight:800;">Recaída</div>` : '';

                        const pubObjFormatted = {
                            id: pub.id,
                            user_id: pub.user_id || (currentUser ? currentUser.id : null),
                            nombre: cleanHName,
                            fecha: pub.fecha,
                            dateObj: pub.dateObj ? new Date(pub.dateObj) : new Date(0),
                            texto: pub.texto,
                            score: pub.score,
                            imgUrl: imgUrl,
                            privacidad: pub.privacidad || 'seguidores',
                            likes: pub.likes || 0,
                            likedByMe: pub.likedByMe || false,
                            comentarios: pub.comentarios || [],
                            owner: document.getElementById('display-nickname').textContent,
                            avatar: window.userHasAvatar ? document.getElementById('avatar-img').src : null
                        };
                        feedPostsHabito.push(pubObjFormatted);

                        if (imgUrl && imgUrl.trim() !== '') {
                            thumb.innerHTML = `
                                <img src="${htmlImgSrc(imgUrl)}" alt="Registro">
                                <div class="thumb-info-overlay">
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">${escapeHtmlChat(tituloSello)}</span>
                                    <span style="color: var(--text-muted);">${escapeHtmlChat(pub.fecha)}</span>
                                    ${snippetTexto ? `<span style="color: #d1d5db; font-size: 0.52rem; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${escapeHtmlChat(snippetTexto)}"</span>` : ''}
                                </div>
                                ${isPriv ? `<div class="thumb-badge-top-left">🔒 Priv</div>` : ''}
                                ${badgeRecaida}
                            `;
                        } else {
                            thumb.innerHTML = `
                                <div class="thumb-no-img"${esRecaida ? ' style="background:linear-gradient(160deg,rgba(127,29,29,0.55),rgba(15,18,28,0.9));"' : ''}>
                                    <div>
                                        <strong style="font-size: 0.65rem; color: ${esRecaida ? '#fca5a5' : '#fff'};">${escapeHtmlChat(tituloSello)}</strong><br>
                                        <span style="font-size:0.52rem; opacity:0.8;">${escapeHtmlChat(pub.fecha)}</span>
                                        ${snippetTexto ? `<br><span style="font-style: italic; font-size:0.5rem; color:#9ca3af;">"${escapeHtmlChat(snippetTexto)}"</span>` : ''}
                                    </div>
                                </div>
                                ${isPriv ? `<div class="thumb-badge-top-left">🔒 Priv</div>` : ''}
                                ${badgeRecaida}
                            `;
                        }
                        thumb.onclick = () => abrirFeedPublicacionesVertical(feedPostsHabito, pub.id);
                        gridDiv.appendChild(thumb);
                    });
                    bodyDiv.appendChild(gridDiv);
                }
                accordionDiv.appendChild(bodyDiv);
            }

            container.appendChild(accordionDiv);
        }

        function renderizarHistorialArchivados() {
            const container = document.getElementById('history-tab-grid-container');
            const arch = (misHabitos || []).map((h, i) => ({ h, i })).filter(x => habitEsArchivado(x.h));
            if (!arch.length) {
                container.innerHTML = htmlEstadoVacio({ title: 'Sin archivados', icon: ICONO_VACIO_HABITO });
                return;
            }
            container.innerHTML = '';
            arch.forEach(({ h, i }) => appendAcordeonHistorialHabito(container, h.nombre, { archivedIndex: i }));
        }

        function renderizarTabHistorial() {
            actualizarCabeceraHistorial();
            const container = document.getElementById('history-tab-grid-container');
            if(!container) return;
            if (historyVista === 'archivados') { renderizarHistorialArchivados(); return; }
            container.innerHTML = '';

            const activos = nombresHabitosHistorialRitual();
            const antiguos = (misHabitos || []).map((h, i) => ({ h, i })).filter(x => habitEsArchivado(x.h));

            if (!activos.length && !antiguos.length) {
                container.innerHTML = htmlEstadoVacio({
                    title: 'Sin registros',
                    text: 'Cuando añadas hábitos, tareas o deseos, aparecerán aquí.',
                    icon: ICONO_VACIO_HISTORIAL
                });
                return;
            }

            if (activos.length) {
                const tAct = document.createElement('div');
                tAct.className = 'history-group-title';
                tAct.textContent = 'Activos';
                container.appendChild(tAct);
                activos.forEach(habitName => appendAcordeonHistorialHabito(container, habitName, { conMenu: true }));
            }

            if (antiguos.length) {
                const tAnt = document.createElement('div');
                tAnt.className = 'history-group-title';
                tAnt.textContent = 'Antiguos';
                container.appendChild(tAnt);
                antiguos.forEach(({ h, i }) => appendAcordeonHistorialHabito(container, h.nombre, { archivedIndex: i, conMenu: true }));
            }
        }

        function registrarPubsEnMapa(postsArray) {
            (postsArray || []).forEach(pub => {
                if (!pub || !pub.id) return;
                const prev = window.registrosGlobalMap[pub.id] || {};
                window.registrosGlobalMap[pub.id] = Object.assign({}, prev, pub, {
                    imagenes: pub.imgUrl ? [pub.imgUrl] : (pub.imagenes || prev.imagenes || []),
                    image_url: pub.imgUrl || pub.image_url || prev.image_url
                });
            });
        }

        function deduplicarPostsFeed(postsArray) {
            const seen = new Set();
            return (postsArray || []).filter(p => {
                if (!p) return false;
                const key = p.id || `${p.user_id || ''}-${p.fecha}-${p.imgUrl || ''}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        function abrirFeedPublicacionesVertical(postsArray, activePostId) {
            const container = document.getElementById('ig-feed-scroll-container');
            if (!container) return;
            container.innerHTML = '';

            const posts = deduplicarPostsFeed(postsArray).slice().sort((a, b) => {
                const da = a && a.dateObj ? new Date(a.dateObj).getTime() : 0;
                const db = b && b.dateObj ? new Date(b.dateObj).getTime() : 0;
                return db - da;
            });
            if (!posts.length) return;
            registrarPubsEnMapa(posts);

            posts.forEach(pub => {
                const postCard = document.createElement('div');
                postCard.className = 'ig-feed-post-card';
                postCard.id = `ig-post-${pub.id}`;

                let avatarHtml = pub.avatar
                    ? `<img src="${htmlImgSrc(pub.avatar)}" style="width:100%; height:100%; object-fit:cover;">`
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                let heartColor = pub.likedByMe ? '#ef4444' : 'var(--text-main)';
                let heartFill = pub.likedByMe ? '#ef4444' : 'none';

                let imageHtml = '';
                if (pub.imgUrl && pub.imgUrl.trim() !== '') {
                    imageHtml = `
                        <div class="ig-post-media" id="media-container-${pub.id}">
                            <img src="${htmlImgSrc(pub.imgUrl)}" alt="Publicación">
                        </div>
                    `;
                }

                let commentsHtml = '';
                const currentMyUid = currentUser ? currentUser.id : null;
                const isMyPost = esPublicacionMia(pub);
                const pubIdJs = jsStrHtml(pub.id);
                // Registro local de invitado (sin cuenta): solo historial,
                // sin publicación ni likes/comentarios (oculto vía CSS).
                const esLocalRegistro = !(pub.user_id);
                postCard.classList.toggle('ig-post-local', esLocalRegistro);

                let optionsMenuHtml = '';
                if (isMyPost) {
                    optionsMenuHtml = `
                        <div style="position: relative;">
                            <button type="button" class="habit-options-btn" onclick="togglePostContextMenu(event, '${pubIdJs}')">⋯</button>
                            <div id="post-ctx-${escapeHtmlChat(pub.id)}" class="habit-context-menu">
                                <button type="button" class="ctx-item" onclick="solicitarEliminarRegistroHistorial('${pubIdJs}')" style="color: #f87171;">🗑️ Eliminar tarea / registro</button>
                            </div>
                        </div>
                    `;
                }

                if (pub.comentarios && pub.comentarios.length > 0) {
                    pub.comentarios.forEach(c => {
                        const canDeleteComment = isMyPost || (c.user_id && currentMyUid && c.user_id === currentMyUid);
                        commentsHtml += htmlFilaComentarioFeed(pub.id, c, canDeleteComment);
                    });
                } else {
                    commentsHtml = `<div class="ig-comment-row" style="color: var(--text-muted); font-size: 0.72rem;">No hay comentarios todavía.</div>`;
                }

                const esMiaPub = isMyPost;
                const rachaPub = esMiaPub && pub.nombre ? calcularRachaHastaFecha(pub.nombre, pub.dateObj || new Date()) : 0;
                const rachaMeta = rachaPub > 0 ? ` · ${rachaPub} de racha` : '';
                const captionRitual = textoRitualPublicacion(pub.texto || '');

                const ownerJs = jsStrHtml(pub.owner || '');
                const ownerHtml = escapeHtmlChat(pub.owner || '_anonymous');
                postCard.innerHTML = `
                    <div class="ig-post-header">
                        <div class="ig-post-user-info" style="cursor: pointer;" onclick="visitarPerfilPorNombreDeUsuario('${ownerJs}')">
                            <div class="ig-post-avatar">${avatarHtml}</div>
                            <span class="ig-post-username">${ownerHtml}</span>
                        </div>
                        ${optionsMenuHtml}
                    </div>
                    ${imageHtml}
                    <div class="ig-post-actions-row">
                        <div class="ig-action-icons-left">
                            <div class="ig-action-item" onclick="event.stopPropagation(); toggleLikeEnFeed('${pubIdJs}')">
                                <svg class="ig-like-icon" width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span class="ig-action-count" id="likes-count-${escapeHtmlChat(pub.id)}">${pub.likes || 0}</span>
                            </div>
                            <div class="ig-action-item" onclick="event.stopPropagation(); toggleDesgloseComentarios('${pubIdJs}')">
                                <svg class="ig-comment-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                                <span class="ig-action-count" id="comments-count-${escapeHtmlChat(pub.id)}">${pub.comentarios ? pub.comentarios.length : 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="ig-post-caption-box">
                        <strong style="cursor: pointer;" onclick="visitarPerfilPorNombreDeUsuario('${ownerJs}')">${ownerHtml}</strong>
                        <span class="ig-post-ritual-meta" style="display:inline-flex; align-items:center; gap:6px;">${htmlGlifoHabito(pub.nombre || 'Ritual', 14)} ${escapeHtmlChat(tituloSelloPublicacion(pub) || 'Ritual')}${rachaMeta} · ${horaCortaDeFecha(pub.dateObj)}</span>
                        <span style="font-weight: normal;">${escapeHtmlChat(captionRitual)}</span>
                        ${pub.score ? `<br><span style="color: #fbbf24; font-weight: 700; font-size: 0.75rem;">⭐ Puntuación: ${escapeHtmlChat(String(pub.score))}</span>` : ''}
                    </div>
                    <div class="ig-post-comments-container" id="comments-container-${escapeHtmlChat(pub.id)}">
                        ${commentsHtml}
                    </div>
                    <div class="ig-comment-input-row" id="comment-input-row-${escapeHtmlChat(pub.id)}">
                        <input type="text" id="comment-input-${escapeHtmlChat(pub.id)}" class="ig-comment-input" placeholder="Agrega un comentario..." maxlength="280">
                        <button type="button" class="ig-comment-submit-btn" onclick="enviarComentarioEnFeed('${pubIdJs}')">Publicar</button>
                    </div>
                `;

                container.appendChild(postCard);

                const commentInput = postCard.querySelector('.ig-comment-input');
                if (commentInput) {
                    commentInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            enviarComentarioEnFeed(pub.id);
                        }
                    });
                }

                const mediaContainer = document.getElementById(`media-container-${pub.id}`);
                if (mediaContainer && !esLocalRegistro) {
                    let lastTap = 0;
                    mediaContainer.addEventListener('click', () => {
                        const currentTime = new Date().getTime();
                        const tapLength = currentTime - lastTap;
                        if (tapLength < 300 && tapLength > 0) {
                            toggleLikeEnFeed(pub.id);
                        }
                        lastTap = currentTime;
                    });
                }
            });

            document.getElementById('detail-modal').classList.add('active');
            container.scrollTop = 0;

            if (activePostId) {
                const irAlPost = () => {
                    const targetCard = document.getElementById(`ig-post-${activePostId}`);
                    if (!targetCard) return;
                    container.scrollTop = targetCard.offsetTop;
                };
                requestAnimationFrame(() => requestAnimationFrame(irAlPost));
            }
        }

        function togglePostContextMenu(event, pubId) {
            event.stopPropagation();
            document.querySelectorAll('.habit-context-menu').forEach(m => {
                if (m.id !== `post-ctx-${pubId}`) m.classList.remove('active');
            });
            const menu = document.getElementById(`post-ctx-${pubId}`);
            if(menu) menu.classList.toggle('active');
        }

        function solicitarEliminarRegistroHistorial(pubId) {
            document.querySelectorAll('.habit-context-menu').forEach(m => m.classList.remove('active'));
            document.getElementById('confirm-modal-title').textContent = "⚠️ Confirmar eliminación";
            document.getElementById('confirm-modal-text').textContent = "¿Estás seguro de eliminar este registro/tarea del historial?";
            confirmModalAction = async () => {
                await ejecutarEliminarRegistroHistorial(pubId);
            };
            document.getElementById('confirm-modal').classList.add('active');
        }

        async function ejecutarEliminarRegistroHistorial(pubId) {
            if (typeof reproducirSonidoEliminar === 'function') {
                try { reproducirSonidoEliminar(); } catch (e) {}
            }
            let foundLog = null;

            for (const hName of Object.keys(historialAgrupado)) {
                const idx = historialAgrupado[hName].findIndex(l => l && String(l.id) === String(pubId));
                if (idx > -1) {
                    foundLog = historialAgrupado[hName][idx];
                    break;
                }
            }

            if (foundLog) {
                quitarLogDeHistorial(foundLog);
                await borrarRegistroHabitLogYMedia(foundLog);
                delete window.registrosGlobalMap[pubId];
            } else {
                marcarSelloEliminado(pubId);
            }

            document.getElementById('detail-modal').classList.remove('active');
            const feedBox = document.getElementById('ig-feed-scroll-container');
            if (feedBox) feedBox.innerHTML = '';
            guardarEstadoLocal();
            try { avisarDiarioRemoto(); } catch (e) {}
            revocarInsigniasSinMetrica();
            renderizarMiRutina();
            renderizarPerfilPublicacionesGrid();
            renderizarTabHistorial();
            actualizarEstadisticasPerfil();
            try { renderizarInsignias(); } catch (e) {}
        }

        function toggleDesgloseComentarios(pubId) {
            const commentsContainer = document.getElementById(`comments-container-${pubId}`);
            if (commentsContainer) {
                commentsContainer.classList.toggle('active');
                if (commentsContainer.classList.contains('active')) {
                    const input = document.getElementById(`comment-input-${pubId}`);
                    if (input) input.focus();
                }
            }
        }

        async function toggleLikeEnFeed(pubId) {
            if (!currentUser) {
                abrirModalAuth();
                return;
            }
            const reg = window.registrosGlobalMap[pubId];
            if (!reg) return;

            if (typeof reg.id === 'string' && reg.id.startsWith('reg_')) {
                console.warn("No se puede dar me gusta a una publicación aún no sincronizada con Supabase.");
                return;
            }

            const estadoPrevioLike = reg.likedByMe;
            const conteoPrevioLikes = reg.likes;

            reg.likedByMe = !reg.likedByMe;
            reg.likes = reg.likedByMe ? (reg.likes || 0) + 1 : Math.max(0, (reg.likes || 0) - 1);

            const countEl = document.getElementById(`likes-count-${pubId}`);
            if (countEl) countEl.textContent = reg.likes;

            const postCard = document.getElementById(`ig-post-${pubId}`);
            if (postCard) {
                const likeSvg = postCard.querySelector('.ig-like-icon');
                if (likeSvg) {
                    likeSvg.setAttribute('fill', reg.likedByMe ? '#ef4444' : 'none');
                    likeSvg.setAttribute('stroke', reg.likedByMe ? '#ef4444' : 'var(--text-main)');
                }
            }

            guardarEstadoLocal();

            if (currentUser) {
                let resError = null;
                if (reg.likedByMe) {
                    const { error } = await supabaseClient.from('likes').insert([{ user_id: currentUser.id, log_id: reg.id }]);
                    resError = error;
                } else {
                    const { error } = await supabaseClient.from('likes').delete().eq('user_id', currentUser.id).eq('log_id', reg.id);
                    resError = error;
                }

                if (resError) {
                    console.error("Error al actualizar me gusta en Supabase:", resError.message);
                    reg.likedByMe = estadoPrevioLike;
                    reg.likes = conteoPrevioLikes;
                    if (countEl) countEl.textContent = reg.likes;
                    guardarEstadoLocal();
                }
            }
        }

        async function enviarComentarioEnFeed(pubId) {
            if (!currentUser) {
                abrirModalAuth();
                return;
            }
            const input = document.getElementById(`comment-input-${pubId}`);
            if (!input) return;
            const text = recortarTexto(input.value.trim(), AWAKE_LIMITE_COMENTARIO);
            if (!text) return;
            if (demasiadoPronto('comment:' + pubId, 700)) return;

            const reg = window.registrosGlobalMap[pubId];
            if (!reg) return;

            if (typeof reg.id === 'string' && reg.id.startsWith('reg_')) {
                // B-05: feedback claro en vez de salida silenciosa; el texto tecleado se conserva en el input.
                console.warn("No se puede comentar en una publicación aún no sincronizada con Supabase.");
                mostrarToastLujo('Publicación aún no sincronizada. Inténtalo en unos segundos.', { tipo: 'error' });
                return;
            }

            const myNick = document.getElementById('display-nickname').textContent;
            if (!reg.comentarios) reg.comentarios = [];

            let insertedCommentId = 'temp_' + Date.now();
            const nuevoComentario = { 
                id: insertedCommentId, 
                user_id: currentUser ? currentUser.id : null, 
                autor: myNick, 
                texto: text 
            };
            reg.comentarios.push(nuevoComentario);
            input.value = '';

            actualizarContenedorComentariosDOM(pubId, reg);
            guardarEstadoLocal();

            if (currentUser) {
                const { data, error } = await supabaseClient.from('comments').insert([{
                    user_id: currentUser.id,
                    log_id: reg.id,
                    text_comment: text
                }]).select('id').single();

                if (error) {
                    console.error("Error al guardar comentario en Supabase:", error.message);
                    reg.comentarios = reg.comentarios.filter(c => c.id !== insertedCommentId);
                    actualizarContenedorComentariosDOM(pubId, reg);
                    guardarEstadoLocal();
                } else if (data) {
                    const lastC = reg.comentarios.find(x => x.id === insertedCommentId);
                    if (lastC) lastC.id = data.id;
                    guardarEstadoLocal();
                }
            }
        }

        function actualizarContenedorComentariosDOM(pubId, reg) {
            const commentsContainer = document.getElementById(`comments-container-${pubId}`);
            const commentsCountSpan = document.getElementById(`comments-count-${pubId}`);
            if (commentsCountSpan) {
                commentsCountSpan.textContent = reg.comentarios ? reg.comentarios.length : 0;
            }
            if (!commentsContainer) return;
            commentsContainer.classList.add('active');
            commentsContainer.innerHTML = '';
            const currentMyUid = currentUser ? currentUser.id : null;
            const isMyPost = esPublicacionMia(reg);

            if (!reg.comentarios || reg.comentarios.length === 0) {
                commentsContainer.innerHTML = `<div class="ig-comment-row" style="color: var(--text-muted); font-size: 0.72rem;">No hay comentarios todavía.</div>`;
                return;
            }

            reg.comentarios.forEach(c => {
                const canDelete = isMyPost || (c.user_id && currentMyUid && c.user_id === currentMyUid);
                commentsContainer.innerHTML += htmlFilaComentarioFeed(pubId, c, canDelete);
            });
            commentsContainer.scrollTop = commentsContainer.scrollHeight;
        }

        function solicitarEliminarComentario(pubId, commentId) {
            document.getElementById('confirm-modal-title').textContent = "⚠️ Confirmar eliminación";
            document.getElementById('confirm-modal-text').textContent = "¿Estás seguro de querer eliminar este comentario?";
            confirmModalAction = async () => {
                await ejecutarEliminarComentario(pubId, commentId);
            };
            document.getElementById('confirm-modal').classList.add('active');
        }

        async function ejecutarEliminarComentario(pubId, commentId) {
            const reg = window.registrosGlobalMap[pubId];
            if (!reg || !reg.comentarios) return;

            if (typeof reproducirSonidoEliminar === 'function') {
                try { reproducirSonidoEliminar(); } catch (e) {}
            }

            const comentariosRespaldo = [...reg.comentarios];
            reg.comentarios = reg.comentarios.filter(c => c.id !== commentId);

            actualizarContenedorComentariosDOM(pubId, reg);
            guardarEstadoLocal();

            if (currentUser && commentId && !commentId.startsWith('temp_')) {
                const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
                if (error) {
                    console.error("Error al eliminar comentario en Supabase:", error.message);
                    reg.comentarios = comentariosRespaldo;
                    actualizarContenedorComentariosDOM(pubId, reg);
                    guardarEstadoLocal();
                }
            }
            renderizarTabHistorial();
            renderizarPerfilPublicacionesGrid();
        }

/* ================= MARCO COSMICO v4 · minimalista (proto2) ================= */
(function () {
    const CLAVE = 'proto2_marco_variante';
    const VARIANTES = ['linea', 'norte'];

    function aplicarVariante(id) {
        const el = document.getElementById('marco-cosmico');
        if (!el) return;
        if (!id || VARIANTES.indexOf(id) === -1) id = null;
        if (id) { el.setAttribute('data-variante', id); } else { el.removeAttribute('data-variante'); }
        document.querySelectorAll('#marco-dev-panel .marco-dev-opcion').forEach(function (b) {
            b.classList.toggle('activo', b.getAttribute('data-variante') === id);
        });
        try { if (id) localStorage.setItem(CLAVE, id); else localStorage.removeItem(CLAVE); } catch (e) {}
    }

    window.seleccionarMarcoProto = function (id) {
        const el = document.getElementById('marco-cosmico');
        const actual = el ? el.getAttribute('data-variante') : null;
        aplicarVariante(actual === id ? null : id);
        if (window.reproducirSonidoClick) { try { window.reproducirSonidoClick(); } catch (e) {} }
    };

    window.alternarPanelMarcos = function (ev) {
        if (ev) { try { ev.stopPropagation(); } catch (e) {} }
        const panel = document.getElementById('marco-dev-panel');
        if (!panel) return;
        panel.classList.toggle('abierto');
        if (panel.classList.contains('abierto') && window.reproducirSonidoClick) {
            try { window.reproducirSonidoClick(); } catch (e) {}
        }
    };

    document.addEventListener('click', function (e) {
        const panel = document.getElementById('marco-dev-panel');
        if (!panel || !panel.classList.contains('abierto')) return;
        if (e.target.closest('#marco-dev-panel') || e.target.closest('#marco-dev-btn')) return;
        panel.classList.remove('abierto');
    });

    function ajustarBase() {
        const nav = document.querySelector('.horizontal-tabs');
        if (!nav) return;
        const h = Math.round(nav.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--marco-bottom', h + 'px');
    }

    function iniciar() {
        try { localStorage.removeItem('proto2_marco_activo'); localStorage.removeItem('proto2_marco_brillo'); } catch (e) {}
        let guardado = null;
        try { guardado = localStorage.getItem(CLAVE); } catch (e) {}
        aplicarVariante(guardado);
        ajustarBase();
        window.addEventListener('resize', ajustarBase);
        window.addEventListener('orientationchange', ajustarBase);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
