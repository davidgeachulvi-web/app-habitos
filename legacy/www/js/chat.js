/* AWAKE — mensajes y chat. Script global; se carga antes de app.js. */

        function asegurarChatModalVisible() {
            const modal = document.getElementById('direct-chat-modal');
            if (!modal) return null;
            // Capas que, si quedan .active, tapan el chat (z-index mayor o pantalla negra).
            ['lightbox', 'detail-modal', 'awake-pick-overlay', 'crop-modal', 'confirm-modal'].forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.classList.contains('active')) el.classList.remove('active');
            });
            modal.classList.add('active');
            modal.classList.remove('is-underlay');
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.style.pointerEvents = 'auto';
            if (typeof sincronizarCapaFondoCompleta === 'function') {
                try { sincronizarCapaFondoCompleta(); } catch (e) {}
            } else if (typeof programarSyncCapaFondo === 'function') {
                programarSyncCapaFondo();
            }
            return modal;
        }

        async function abrirChatDesdePerfilVisitado() {
            if (!currentUser) {
                abrirModalAuth();
                return;
            }
            const uid = viewingUserId;
            if (!uid) return;
            const cached = (window.cachePerfilesSocial && window.cachePerfilesSocial[uid]) || {};
            await abrirChatConUsuario(uid, cached.name, cached.avatar);
        }

        async function abrirSalaMensajesDirect() {
            if (!currentUser) {
                abrirModalAuth();
                return;
            }
            chatLoadGeneration += 1;
            detenerPollingChat();
            dejarBroadcastChat();
            activeDirectChatUser = null;
            asegurarChatModalVisible();
            await renderizarBandejaMensajesGeneral();
        }

        function cerrarChatDirecto() {
            detenerGrabacionAudioChat(true);
            pendingChatReply = null;
            const modal = document.getElementById('direct-chat-modal');
            if (activeDirectChatUser) {
                chatLoadGeneration += 1;
                detenerPollingChat();
                dejarBroadcastChat();
                activeDirectChatUser = null;
                chatLastMessageAt = null;
                renderizarBandejaMensajesGeneral();
                if (recargaDiarioPendiente) solicitarRecargaDiario();
            } else if (modal) {
                modal.classList.remove('active');
            }
        }

        async function abrirChatConUsuario(userId, userName, userAvatar) {
            if (!currentUser) {
                abrirModalAuth();
                return;
            }
            if (!userId) return;
            try {
                const cached = (window.cachePerfilesSocial && window.cachePerfilesSocial[userId]) || {};
                const name = userName || cached.name || 'Usuario';
                const avatar = userAvatar || cached.avatar || null;
                inboxLoadGeneration += 1;
                detenerGrabacionAudioChat(true);
                pendingChatReply = null;
                activeDirectChatUser = { id: userId, name: name, avatar: avatar };
                asegurarChatModalVisible();
                suscribirBroadcastChat(userId);
                await cargarLecturaDelPar(userId);
                await renderizarInterfazChatIndividual();
                iniciarPollingChat();
            } catch (e) {
                console.error('Error al abrir chat:', e);
                const container = document.getElementById('direct-chat-body-container');
                if (container) {
                    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;">No se pudo abrir el chat.</div>';
                }
                asegurarChatModalVisible();
            }
        }

        function pintarCabeceraChatBandeja() {
            const title = document.getElementById('direct-chat-header-title');
            if (title) title.innerHTML = '<svg class="ig-chat-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>Mensajes</span>';
        }

        function pintarCabeceraChatIndividual() {
            const title = document.getElementById('direct-chat-header-title');
            if (!title || !activeDirectChatUser) return;
            const avatar = activeDirectChatUser.avatar;
            const avatarHtml = avatar
                ? `<img src="${htmlImgSrc(avatar)}" alt="">`
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
            title.innerHTML = `
                <div class="ig-chat-header-user">
                    <div class="ig-chat-header-avatar">${avatarHtml}</div>
                    <div class="ig-chat-header-name">${escapeHtmlChat(activeDirectChatUser.name || 'Usuario')}</div>
                </div>
            `;
        }

        function escapeHtmlChat(s) {
            return String(s || '').replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        }

        function jsStrHtml(s) {
            return String(s == null ? '' : s)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n')
                .replace(/&/g, '\\u0026')
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/"/g, '\\u0022');
        }

        function urlMediaSegura(url) {
            const u = String(url || '').trim();
            if (!u) return '';
            if (/^(javascript|vbscript|file):/i.test(u)) return '';
            if (/^data:\s*text\/html/i.test(u)) return '';
            if (/^data:/i.test(u) && !/^data:image\//i.test(u) && !/^data:audio\//i.test(u)) return '';
            if (/^https?:\/\//i.test(u) || /^data:(image|audio)\//i.test(u) || /^blob:/i.test(u)) return u;
            return '';
        }

        function srcImagenHabito(url) {
            const u = urlMediaSegura(url);
            if (!u || /^data:audio\//i.test(u)) return '';
            return u;
        }

        function htmlImgSrc(url) {
            return escapeHtmlChat(srcImagenHabito(url));
        }

        function recortarTexto(s, max) {
            const t = String(s == null ? '' : s);
            if (t.length <= max) return t;
            return t.slice(0, max);
        }

        function demasiadoPronto(clave, ms) {
            const now = Date.now();
            if ((awakeWriteStamp[clave] || 0) + ms > now) return true;
            awakeWriteStamp[clave] = now;
            return false;
        }

        function normalizarNickSocial(s) {
            return String(s || '').trim().toLowerCase();
        }

        function leerNombrePerfilArg(raw) {
            const s = String(raw || '').trim();
            if (!s) return '';
            try { return decodeURIComponent(s); } catch (e) { return s; }
        }

        function esPublicacionMia(pub) {
            if (!pub) return false;
            if (currentUser && pub.user_id) return pub.user_id === currentUser.id;
            if (pub.user_id) return false;
            if (typeof pub.id === 'string' && (pub.id.startsWith('reg_') || pub.id.startsWith('wish_reg_'))) return true;
            if (viewingUserId) return false;
            const myNick = (document.getElementById('display-nickname') || {}).textContent || '';
            if (pub.owner) return normalizarNickSocial(pub.owner) === normalizarNickSocial(myNick);
            return !currentUser || !pub.user_id;
        }

        function esSelloVisibleEnRed(ej) {
            if (logEsMarcaRitual(ej)) return false;
            const p = ((ej && (ej.privacidad || ej.privacy)) || 'seguidores').toLowerCase();
            return p !== 'privado' && p !== 'private';
        }

        function htmlFilaComentarioFeed(pubId, c, canDelete) {
            const autor = c && c.autor ? String(c.autor) : '';
            const texto = c && c.texto != null ? String(c.texto) : '';
            const cid = c && c.id != null ? String(c.id) : '';
            const deleteBtnHtml = canDelete
                ? `<button type="button" class="ig-comment-delete-btn" onclick="event.stopPropagation(); solicitarEliminarComentario('${jsStrHtml(pubId)}','${jsStrHtml(cid)}')">✕</button>`
                : '';
            return `
                <div class="ig-comment-row" id="comment-row-${escapeHtmlChat(cid)}">
                    <div><strong onclick="visitarPerfilPorNombreDeUsuario('${jsStrHtml(autor)}')">${escapeHtmlChat(autor)}</strong>${escapeHtmlChat(texto)}</div>
                    ${deleteBtnHtml}
                </div>
            `;
        }

        function parseChatPayload(raw) {
            if (!raw) return { text: '', image: null, audio: null, replyTo: null, replySnippet: '', replyName: '' };
            if (typeof raw === 'string' && raw.startsWith('AWK1:')) {
                try {
                    const j = JSON.parse(raw.slice(5));
                    return {
                        text: j.t || '',
                        image: j.i || null,
                        audio: j.a || null,
                        replyTo: j.r || null,
                        replySnippet: j.rs || '',
                        replyName: j.rn || ''
                    };
                } catch (e) {
                    return { text: raw, image: null, audio: null, replyTo: null, replySnippet: '', replyName: '' };
                }
            }
            return { text: String(raw), image: null, audio: null, replyTo: null, replySnippet: '', replyName: '' };
        }

        function serializeChatPayload(payload) {
            const hasExtra = !!(payload.image || payload.audio || payload.replyTo);
            const texto = recortarTexto(payload.text || '', AWAKE_LIMITE_CHAT);
            if (!hasExtra) return texto;
            const packed = { t: texto };
            if (payload.image) packed.i = payload.image;
            if (payload.audio) packed.a = payload.audio;
            if (payload.replyTo) packed.r = payload.replyTo;
            if (payload.replySnippet) packed.rs = recortarTexto(payload.replySnippet, 80);
            if (payload.replyName) packed.rn = recortarTexto(payload.replyName, AWAKE_LIMITE_NICK);
            return 'AWK1:' + JSON.stringify(packed);
        }

        function previewTextoChat(raw) {
            const p = parseChatPayload(raw);
            if (p.image) return p.text ? `📷 ${p.text}` : '📷 Foto';
            if (p.audio) return p.text ? `🎤 ${p.text}` : '🎤 Audio';
            return p.text || 'Mensaje';
        }

        function previewTextoChatBandeja(raw) {
            if (raw == null) return 'Mensaje';
            const s = String(raw);
            if (s.startsWith('AWK1:') && s.length > 4000) {
                if (s.indexOf('"i":') !== -1) {
                    const tMatch = s.match(/"t":"((?:\\.|[^"\\])*)"/);
                    const t = tMatch ? tMatch[1].slice(0, 60) : '';
                    return t ? `📷 ${t}` : '📷 Foto';
                }
                if (s.indexOf('"a":') !== -1) return '🎤 Audio';
                return 'Mensaje';
            }
            return previewTextoChat(s);
        }

        function snippetDesdePayload(payload) {
            if (!payload) return 'Mensaje';
            if (payload.image) return payload.text ? `📷 ${payload.text}` : '📷 Foto';
            if (payload.audio) return payload.text ? `🎤 ${payload.text}` : '🎤 Audio';
            const t = (payload.text || '').trim();
            return t.length > 80 ? `${t.slice(0, 80)}…` : (t || 'Mensaje');
        }

        function crearBurbujaMensajeChat(rawText, isMe, messageId, createdAt) {
            const payload = parseChatPayload(rawText);
            const row = document.createElement('div');
            row.className = `chat-msg-row ${isMe ? 'me' : 'them'}`;
            const stamp = createdAt || new Date().toISOString();
            row.dataset.createdAt = stamp;
            row.dataset.dayKey = claveDiaLocal(stamp);
            const col = document.createElement('div');
            col.className = 'chat-msg-col';
            const bubble = document.createElement('div');
            const mediaOnly = !!(payload.image && !payload.text && !payload.audio && !payload.replyTo);
            bubble.className = `chat-bubble ${isMe ? 'me' : 'them'}${mediaOnly ? ' chat-bubble--media' : ''}`;
            if (messageId) {
                bubble.dataset.msgId = String(messageId);
                renderedChatMessageIds.add(String(messageId));
            }

            if (payload.replyTo || payload.replySnippet) {
                const quote = document.createElement('button');
                quote.type = 'button';
                quote.className = 'chat-quote';
                const name = payload.replyName || (isMe ? (activeDirectChatUser && activeDirectChatUser.name) : 'Tú');
                quote.innerHTML = `<span class="chat-quote-name">${escapeHtmlChat(name)}</span>${escapeHtmlChat(payload.replySnippet || 'Mensaje')}`;
                quote.onclick = (e) => {
                    e.stopPropagation();
                    if (payload.replyTo) irAMensajeChat(payload.replyTo);
                };
                bubble.appendChild(quote);
            }

            if (payload.image) {
                const img = document.createElement('img');
                img.className = 'chat-bubble-img';
                const imgSrc = urlMediaSegura(payload.image);
                if (imgSrc) {
                    img.src = imgSrc;
                    img.alt = 'Foto';
                    img.onclick = (e) => {
                        e.stopPropagation();
                        verImagenDeseo(imgSrc);
                    };
                    bubble.appendChild(img);
                }
            }

            if (payload.audio) {
                const audioSrc = urlMediaSegura(payload.audio);
                if (audioSrc) bubble.appendChild(crearReproductorVozChat(audioSrc));
            }

            if (payload.text) {
                const txt = document.createElement('div');
                if (payload.image) txt.className = 'chat-bubble-caption';
                txt.textContent = payload.text;
                bubble.appendChild(txt);
            }

            const meta = document.createElement('div');
            meta.className = 'chat-msg-meta';
            const timeEl = document.createElement('span');
            timeEl.textContent = horaCortaDeFecha(stamp);
            meta.appendChild(timeEl);
            if (isMe) {
                const seen = document.createElement('span');
                seen.className = 'chat-msg-seen';
                meta.appendChild(seen);
            }

            col.appendChild(bubble);
            col.appendChild(meta);
            row.appendChild(col);
            if (messageId) enlazarGestosBurbujaChat(row, messageId, payload, isMe);
            return row;
        }

        function crearReproductorVozChat(src) {
            const wrap = document.createElement('div');
            wrap.className = 'ig-voice';
            const audio = new Audio(src);
            audio.setAttribute('playsinline', 'true');
            audio.playsInline = true;
            audio.preload = 'metadata';
            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'ig-voice-play';
            playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            const bar = document.createElement('div');
            bar.className = 'ig-voice-bar';
            const progress = document.createElement('div');
            progress.className = 'ig-voice-progress';
            bar.appendChild(progress);
            const timeEl = document.createElement('span');
            timeEl.className = 'ig-voice-time';
            timeEl.textContent = '0:00';
            const fmt = (s) => {
                const n = Math.max(0, Math.floor(s || 0));
                return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
            };
            audio.addEventListener('loadedmetadata', () => { timeEl.textContent = fmt(audio.duration); });
            audio.addEventListener('timeupdate', () => {
                const d = audio.duration || 1;
                progress.style.width = `${(audio.currentTime / d) * 100}%`;
                timeEl.textContent = fmt(audio.duration - audio.currentTime);
            });
            audio.addEventListener('ended', () => {
                progress.style.width = '0%';
                playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                timeEl.textContent = fmt(audio.duration);
            });
            playBtn.onclick = (e) => {
                e.stopPropagation();
                if (audio.paused) {
                    audio.play();
                    playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
                } else {
                    audio.pause();
                    playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                }
            };
            wrap.appendChild(playBtn);
            wrap.appendChild(bar);
            wrap.appendChild(timeEl);
            wrap.onclick = (e) => e.stopPropagation();
            return wrap;
        }

        function enlazarGestosBurbujaChat(row, messageId, payload, isMe) {
            let startX = 0, startY = 0, dx = 0, tracking = false, longTimer = null, longFired = false;
            const clearLong = () => { if (longTimer) { clearTimeout(longTimer); longTimer = null; } };
            const start = (x, y) => {
                startX = x; startY = y; dx = 0; tracking = true; longFired = false;
                clearLong();
                longTimer = setTimeout(() => {
                    longFired = true;
                    prepararRespuestaChat(messageId, payload, isMe);
                }, 480);
            };
            const move = (x, y, e) => {
                if (!tracking) return;
                const mx = x - startX;
                const my = y - startY;
                if (Math.abs(mx) > 8 || Math.abs(my) > 8) clearLong();
                if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) {
                    tracking = false;
                    row.style.transform = '';
                    return;
                }
                dx = Math.max(0, Math.min(72, mx));
                row.style.transform = `translateX(${dx}px)`;
                if (dx > 8 && e && e.cancelable) e.preventDefault();
            };
            const end = () => {
                clearLong();
                if (!longFired && dx > 48) prepararRespuestaChat(messageId, payload, isMe);
                row.style.transform = '';
                tracking = false;
                dx = 0;
            };
            row.addEventListener('touchstart', (e) => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
            row.addEventListener('touchmove', (e) => move(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false });
            row.addEventListener('touchend', end);
            row.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
            row.addEventListener('mousemove', (e) => { if (tracking) move(e.clientX, e.clientY, e); });
            row.addEventListener('mouseup', end);
            row.addEventListener('mouseleave', end);
        }

        function appendMensajeChatAlDom(rawText, isMe, messageId, createdAt) {
            const list = document.getElementById('direct-chat-messages-list');
            if (!list) return false;
            if (messageId && renderedChatMessageIds.has(String(messageId))) return false;
            const empty = list.querySelector('[data-empty-chat]');
            if (empty) empty.remove();
            asegurarSeparadorDiaChat(list, createdAt || new Date().toISOString());
            const row = crearBurbujaMensajeChat(rawText, isMe, messageId, createdAt);
            if (!respetaMenosMovimiento()) row.classList.add('chat-msg-enter');
            list.appendChild(row);
            list.scrollTop = list.scrollHeight;
            pintarVistosEnChatAbierto();
            return true;
        }

        function irAMensajeChat(msgId) {
            const list = document.getElementById('direct-chat-messages-list');
            if (!list || !msgId) return;
            const el = Array.from(list.querySelectorAll('.chat-bubble')).find(b => b.dataset.msgId === String(msgId));
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('chat-bubble-flash');
            setTimeout(() => el.classList.remove('chat-bubble-flash'), 1200);
        }

        function prepararRespuestaChat(messageId, payload, isMe) {
            if (!messageId) return;
            pendingChatReply = {
                id: String(messageId),
                snippet: snippetDesdePayload(payload),
                fromMe: !!isMe,
                name: isMe ? 'Tú' : ((activeDirectChatUser && activeDirectChatUser.name) || 'Usuario')
            };
            pintarBannerRespuestaChat();
            const inp = document.getElementById('direct-msg-input');
            if (inp) inp.focus();
        }

        function cancelarRespuestaChat() {
            pendingChatReply = null;
            pintarBannerRespuestaChat();
        }

        function pintarBannerRespuestaChat() {
            const banner = document.getElementById('direct-chat-reply-banner');
            if (!banner) return;
            if (!pendingChatReply) {
                banner.classList.add('hidden');
                banner.innerHTML = '';
                return;
            }
            banner.classList.remove('hidden');
            banner.innerHTML = `
                <div style="min-width:0;">
                    <div style="font-weight:700; color:#fff;">${escapeHtmlChat(pendingChatReply.name || 'Usuario')}</div>
                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtmlChat(pendingChatReply.snippet)}</div>
                </div>
                <button type="button" onclick="cancelarRespuestaChat()" style="background:none;border:none;color:#a8a8a8;font-size:1.1rem;cursor:pointer;">✕</button>
            `;
        }

        function conservarFocoComposerChat() {
            const modal = document.getElementById('direct-chat-modal');
            const input = document.getElementById('direct-msg-input');
            if (!modal || !modal.classList.contains('active') || !input) return;
            try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
        }

        function enviarMensajeDirectoDesdeTeclado(event) {
            if (!event || event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            enviarMensajeDirecto();
        }

        function actualizarEstadoComposerChat() {
            const input = document.getElementById('direct-msg-input');
            const actions = document.getElementById('chat-inline-actions');
            const send = document.getElementById('chat-send-btn');
            const mic = document.getElementById('chat-mic-btn');
            const hasText = !!(input && input.value.trim().length > 0);
            const recOn = chatRecording || chatMicStarting;
            if (actions) actions.classList.toggle('hidden', hasText || recOn);
            if (send) send.classList.toggle('hidden', !hasText || recOn);
            if (mic) mic.classList.toggle('hidden', hasText && !recOn);
        }

        function montarComposerChat(container) {
            const wrap = document.createElement('div');
            wrap.id = 'direct-chat-composer';
            wrap.innerHTML = `
                <div id="direct-chat-reply-banner" class="chat-reply-banner hidden"></div>
                <div class="ig-rec-locked hidden" id="ig-rec-locked">
                    <div class="ig-rec-locked-status">
                        <span class="ig-rec-time-live" id="ig-rec-time-locked">0:00</span>
                        <div class="ig-rec-wave" id="ig-rec-wave" aria-hidden="true"></div>
                    </div>
                    <div class="ig-rec-locked-actions">
                        <button type="button" class="ig-rec-circle-btn ig-rec-trash-btn" id="ig-rec-cancel-btn" title="Descartar">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                        <button type="button" class="ig-rec-pause-btn" id="ig-rec-pause-btn" title="Pausar">
                            <svg class="ig-rec-pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                            <svg class="ig-rec-play-icon hidden" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4"/></svg>
                            <span id="ig-rec-pause-label">Pausar</span>
                        </button>
                        <button type="button" class="ig-rec-circle-btn ig-rec-send-fab" id="ig-rec-send-btn" title="Enviar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>
                <div class="chat-composer-row">
                    <button type="button" class="ig-chat-camera-btn" onclick="abrirCamaraChat()" title="Cámara">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                    <div class="chat-composer-stage">
                        <div class="ig-composer-pill" id="ig-composer-pill">
                            <input type="text" id="direct-msg-input" class="ig-chat-input" placeholder="Mensaje..." maxlength="1000" autocomplete="off" enterkeyhint="send" inputmode="text" oninput="actualizarEstadoComposerChat()" onkeydown="enviarMensajeDirectoDesdeTeclado(event)">
                            <div class="chat-inline-actions" id="chat-inline-actions">
                                <button type="button" class="ig-composer-icon" onclick="abrirSelectorFotoChat()" title="Galería">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                </button>
                            </div>
                            <button type="button" class="ig-chat-send hidden" id="chat-send-btn" tabindex="-1" onpointerdown="event.preventDefault()" onclick="enviarMensajeDirecto()">Enviar</button>
                        </div>
                        <div class="ig-rec-bar hidden" id="ig-rec-bar">
                            <span class="ig-rec-dot"></span>
                            <span class="ig-rec-time-live" id="ig-rec-time">0:00</span>
                            <span class="ig-rec-hint" id="direct-chat-rec-label">
                                <span class="ig-rec-chevrons" aria-hidden="true">‹‹‹</span>
                                <span class="ig-rec-hint-text">Desliza para cancelar</span>
                            </span>
                        </div>
                    </div>
                    <button type="button" class="ig-composer-icon ig-mic-btn" id="chat-mic-btn" title="Mantén para grabar · suelta para enviar · desliza arriba para anclar">
                        <span class="ig-mic-halo" aria-hidden="true"></span>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                    <div class="ig-rec-lock-float hidden" id="ig-rec-lock-float" aria-hidden="true">
                        <div class="ig-rec-lock-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                        </div>
                        <div class="ig-rec-lock-track"><div class="ig-rec-lock-fill"></div></div>
                        <div class="ig-rec-lock-chevrons" aria-hidden="true">⌃</div>
                    </div>
                </div>
            `;
            container.appendChild(wrap);
            montarOndaGrabacionChat();
            pintarBannerRespuestaChat();
            actualizarEstadoComposerChat();
            enlazarHoldGrabacionChat();
        }

        function abrirSelectorFotoChat() {
            const input = document.getElementById('direct-chat-photo-input');
            if (input) input.click();
        }

        function abrirCamaraChat() {
            const input = document.getElementById('direct-chat-camera-input');
            if (input) input.click();
        }

        function manejarFotoChatSeleccionada(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = '';
            if (!file) return;
            comprimirImagenSegura(file, async (base64) => {
                if (!base64) return;
                await enviarMensajeDirecto({ image: base64 });
            });
        }

        function limpiarTimerAncladoChat() {
            if (chatCancelLockTimer) {
                clearTimeout(chatCancelLockTimer);
                chatCancelLockTimer = null;
            }
        }

        function resetVisualGestoChat() {
            const row = document.querySelector('#direct-chat-composer .chat-composer-row');
            if (!row) return;
            row.style.removeProperty('--rec-dx');
            row.style.removeProperty('--rec-dy');
            row.style.removeProperty('--rec-cancel');
            row.style.removeProperty('--rec-lock');
        }

        function pintarGestoGrabacionChat(dx, dy) {
            const row = document.querySelector('#direct-chat-composer .chat-composer-row');
            if (!row) return;
            const slideX = Math.min(0, dx);
            const slideY = Math.min(0, dy);
            row.style.setProperty('--rec-dx', `${slideX}px`);
            row.style.setProperty('--rec-dy', `${slideY}px`);
            row.style.setProperty('--rec-cancel', String(Math.min(1, Math.max(0, -slideX / 132))));
            row.style.setProperty('--rec-lock', String(Math.min(1, Math.max(0, -slideY / Math.abs(CHAT_LOCK_SNAP_DY)))));
        }

        function resetEstadoGrabacionChat() {
            limpiarTimerAncladoChat();
            chatHoldActive = false;
            chatMicStarting = false;
            chatRecording = false;
            chatRecordCancel = false;
            chatRecordLocked = false;
            chatLockArmed = false;
            chatLockPending = false;
            chatHoldPointerId = null;
            chatHoldDownAt = 0;
            chatStopping = false;
            chatRecordPaused = false;
            chatPauseStartedAt = 0;
            chatPausedTotalMs = 0;
            chatAnalyser = null;
            chatWaveSource = null;
            if (chatWaveRaf) {
                cancelAnimationFrame(chatWaveRaf);
                chatWaveRaf = null;
            }
            chatMediaRecorder = null;
            if (chatRecordTimerId) {
                clearInterval(chatRecordTimerId);
                chatRecordTimerId = null;
            }
            resetVisualGestoChat();
        }

        function montarOndaGrabacionChat() {
            const wave = document.getElementById('ig-rec-wave');
            if (!wave || wave.childElementCount) return;
            for (let i = 0; i < 36; i++) wave.appendChild(document.createElement('i'));
        }

        function msGrabacionAudioChat() {
            const now = Date.now();
            let paused = chatPausedTotalMs;
            if (chatRecordPaused && chatPauseStartedAt) paused += now - chatPauseStartedAt;
            return Math.max(0, now - (chatRecordStartedAt || now) - paused);
        }

        function conectarAnalizadorChat(stream) {
            try {
                const ctx = obtenerAudioCosmico();
                if (!ctx || !stream) return;
                chatWaveSource = ctx.createMediaStreamSource(stream);
                chatAnalyser = ctx.createAnalyser();
                chatAnalyser.fftSize = 64;
                chatAnalyser.smoothingTimeConstant = 0.55;
                chatWaveSource.connect(chatAnalyser);
            } catch (e) {
                chatAnalyser = null;
            }
        }

        function pintarOndaGrabacionChat() {
            const wave = document.getElementById('ig-rec-wave');
            if (!wave || !chatAnalyser || chatRecordPaused) return;
            const bars = wave.children;
            const data = new Uint8Array(chatAnalyser.fftSize);
            chatAnalyser.getByteTimeDomainData(data);
            for (let i = 0; i < bars.length; i++) {
                const idx = Math.floor(i * data.length / bars.length);
                const v = Math.abs(data[idx] - 128) / 128;
                bars[i].style.height = `${4 + v * 22}px`;
            }
        }

        function loopOndaGrabacionChat() {
            if (!chatRecordLocked || (!chatRecording && !chatMicStarting)) {
                chatWaveRaf = null;
                return;
            }
            pintarOndaGrabacionChat();
            chatWaveRaf = requestAnimationFrame(loopOndaGrabacionChat);
        }

        function pintarEstadoGrabacionChat() {
            const recOn = chatRecording || chatMicStarting;
            const rec = document.getElementById('ig-rec-bar');
            const locked = document.getElementById('ig-rec-locked');
            const pill = document.getElementById('ig-composer-pill');
            const mic = document.getElementById('chat-mic-btn');
            const lock = document.getElementById('ig-rec-lock-float');
            const hintText = document.querySelector('#direct-chat-rec-label .ig-rec-hint-text');
            const row = document.querySelector('#direct-chat-composer .chat-composer-row');
            const cam = document.querySelector('#direct-chat-composer .ig-chat-camera-btn');
            const composer = document.getElementById('direct-chat-composer');
            const pauseBtn = document.getElementById('ig-rec-pause-btn');
            const pauseLabel = document.getElementById('ig-rec-pause-label');
            const pauseIcon = pauseBtn && pauseBtn.querySelector('.ig-rec-pause-icon');
            const playIcon = pauseBtn && pauseBtn.querySelector('.ig-rec-play-icon');
            if (composer) composer.classList.toggle('is-rec-locked', chatRecordLocked);
            if (row) row.classList.toggle('is-holding-audio', recOn && !chatRecordLocked);
            if (cam) cam.classList.toggle('hidden', recOn && !chatRecordLocked);
            if (rec) {
                rec.classList.toggle('hidden', !recOn || chatRecordLocked);
                rec.classList.toggle('is-cancel-armed', chatRecordCancel && !chatRecordLocked);
                rec.classList.toggle('is-lock-armed', chatLockArmed && !chatRecordLocked);
            }
            if (locked) {
                locked.classList.toggle('hidden', !chatRecordLocked);
                locked.classList.toggle('is-paused', chatRecordPaused);
            }
            if (pill) pill.classList.toggle('is-covered', recOn && !chatRecordLocked);
            if (mic) {
                mic.classList.toggle('is-holding', recOn && !chatRecordLocked);
                mic.classList.toggle('is-locked', chatRecordLocked);
            }
            if (lock) {
                lock.classList.toggle('hidden', !recOn || chatRecordLocked);
                lock.classList.toggle('is-armed', chatLockArmed && !chatRecordLocked);
            }
            if (pauseLabel) pauseLabel.textContent = chatRecordPaused ? 'Continuar' : 'Pausar';
            if (pauseIcon) pauseIcon.classList.toggle('hidden', chatRecordPaused);
            if (playIcon) playIcon.classList.toggle('hidden', !chatRecordPaused);
            if (hintText) {
                if (chatRecordCancel) hintText.textContent = 'Suelta para cancelar';
                else if (chatLockArmed) hintText.textContent = 'Suelta para anclar';
                else hintText.textContent = 'Desliza para cancelar';
            }
            if (chatRecordLocked) resetVisualGestoChat();
            actualizarEstadoComposerChat();
        }

        function anclarGrabacionAudioChat() {
            if (chatRecordLocked) return;
            if (!chatRecording && !chatMicStarting) return;
            limpiarTimerAncladoChat();
            chatRecordLocked = true;
            chatLockArmed = false;
            chatLockPending = false;
            chatRecordCancel = false;
            chatHoldActive = false;
            const mic = document.getElementById('chat-mic-btn');
            try {
                if (mic && chatHoldPointerId != null) mic.releasePointerCapture(chatHoldPointerId);
            } catch (e) {}
            pulsoHaptico(16);
            sonidoChatGrabacion('lock');
            pintarEstadoGrabacionChat();
            if (!chatWaveRaf) loopOndaGrabacionChat();
        }

        function programarAncladoPorCancelChat() {
            if (chatRecordLocked || !chatHoldActive) return;
            limpiarTimerAncladoChat();
            chatCancelLockTimer = setTimeout(() => {
                chatCancelLockTimer = null;
                if (chatRecordLocked || !chatHoldActive) return;
                chatLockPending = true;
                anclarGrabacionAudioChat();
            }, 220);
        }

        function aplicarGestoGrabacionChat(clientX, clientY) {
            if (!chatHoldActive || chatRecordLocked) return;
            const dx = clientX - chatHoldStartX;
            const dy = clientY - chatHoldStartY;
            pintarGestoGrabacionChat(dx, dy);
            const up = dy <= CHAT_LOCK_ARM_DY && Math.abs(dy) >= Math.abs(dx);
            const left = dx <= CHAT_CANCEL_DX && Math.abs(dx) > Math.abs(dy);
            chatLockArmed = up;
            chatRecordCancel = left && !up;
            if (up && dy <= CHAT_LOCK_SNAP_DY) {
                chatLockPending = true;
                anclarGrabacionAudioChat();
                return;
            }
            pintarEstadoGrabacionChat();
        }

        function soltarHoldGrabacionChat(e) {
            if (e && chatHoldPointerId != null && e.pointerId !== chatHoldPointerId) return;
            limpiarTimerAncladoChat();
            if (chatRecordLocked) return;
            if (!chatHoldActive && !chatLockPending) return;
            chatHoldActive = false;
            if (chatLockPending) {
                anclarGrabacionAudioChat();
                return;
            }
            if (chatMicStarting && !chatRecording) {
                chatRecordCancel = true;
                return;
            }
            const elapsed = Date.now() - (chatHoldDownAt || chatRecordStartedAt);
            if (chatRecordCancel || elapsed < 280) detenerGrabacionAudioChat(true);
            else detenerGrabacionAudioChat(false);
        }

        function enlazarHoldGrabacionChat() {
            const mic = document.getElementById('chat-mic-btn');
            if (!mic) return;
            mic.addEventListener('pointerdown', (e) => {
                if (e.button != null && e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                if (chatRecordLocked || chatRecording || chatMicStarting || chatStopping) return;
                chatHoldStartX = e.clientX;
                chatHoldStartY = e.clientY;
                chatHoldPointerId = e.pointerId;
                chatHoldDownAt = Date.now();
                chatHoldActive = true;
                chatRecordCancel = false;
                chatLockArmed = false;
                chatLockPending = false;
                try { obtenerAudioCosmico(); } catch (err) {}
                try { if (e.pointerId != null) mic.setPointerCapture(e.pointerId); } catch (err) {}
                iniciarGrabacionAudioChat();
            });
            mic.addEventListener('pointermove', (e) => {
                if (chatHoldPointerId != null && e.pointerId !== chatHoldPointerId) return;
                aplicarGestoGrabacionChat(e.clientX, e.clientY);
            });
            mic.addEventListener('contextmenu', (e) => e.preventDefault());
            const cancelBtn = document.getElementById('ig-rec-cancel-btn');
            const sendBtn = document.getElementById('ig-rec-send-btn');
            const pauseBtn = document.getElementById('ig-rec-pause-btn');
            if (cancelBtn) cancelBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                detenerGrabacionAudioChat(true);
            };
            if (sendBtn) sendBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                detenerGrabacionAudioChat(false);
            };
            if (pauseBtn) pauseBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                alternarPausaGrabacionChat();
            };
            if (chatHoldWindowBound) return;
            chatHoldWindowBound = true;
            window.addEventListener('pointermove', (e) => {
                if (chatHoldPointerId != null && e.pointerId !== chatHoldPointerId) return;
                aplicarGestoGrabacionChat(e.clientX, e.clientY);
            }, { passive: true });
            window.addEventListener('pointerup', soltarHoldGrabacionChat);
            window.addEventListener('pointercancel', (e) => {
                if (chatHoldPointerId != null && e.pointerId !== chatHoldPointerId) return;
                programarAncladoPorCancelChat();
            });
        }

        async function iniciarGrabacionAudioChat() {
            if (chatRecording || chatMicStarting) return;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
                mostrarToastLujo('Este dispositivo no puede grabar audio');
                resetEstadoGrabacionChat();
                pintarEstadoGrabacionChat();
                return;
            }
            chatRecordCancel = false;
            chatMicStarting = true;
            pintarEstadoGrabacionChat();
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: esPlataformaIOS()
                        ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                        : true
                });
                chatMicStarting = false;
                if (chatRecordCancel && !chatLockPending && !chatRecordLocked) {
                    stream.getTracks().forEach(t => t.stop());
                    resetEstadoGrabacionChat();
                    pintarEstadoGrabacionChat();
                    return;
                }
                if (!chatHoldActive && !chatLockPending && !chatRecordLocked) {
                    stream.getTracks().forEach(t => t.stop());
                    resetEstadoGrabacionChat();
                    pintarEstadoGrabacionChat();
                    return;
                }
                chatAudioChunks = [];
                chatPausedTotalMs = 0;
                chatRecordPaused = false;
                chatPauseStartedAt = 0;
                const mime = mimeGrabacionAudioChat();
                try {
                    chatMediaRecorder = mime
                        ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 24000 })
                        : new MediaRecorder(stream);
                } catch (err) {
                    chatMediaRecorder = new MediaRecorder(stream);
                }
                chatMediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chatAudioChunks.push(e.data);
                };
                chatMediaRecorder.onerror = () => {
                    mostrarToastLujo('Se interrumpió la grabación');
                    chatRecordCancel = true;
                    try { chatMediaRecorder.stop(); } catch (err) {
                        stream.getTracks().forEach(t => t.stop());
                        resetEstadoGrabacionChat();
                        pintarEstadoGrabacionChat();
                    }
                };
                chatMediaRecorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());
                    try { if (chatWaveSource) chatWaveSource.disconnect(); } catch (err) {}
                    const cancelled = chatRecordCancel;
                    const chunks = chatAudioChunks.slice();
                    const recMime = (chatMediaRecorder && chatMediaRecorder.mimeType) || mime || 'audio/webm';
                    resetEstadoGrabacionChat();
                    pintarEstadoGrabacionChat();
                    if (cancelled || chunks.length === 0) return;
                    const blob = new Blob(chunks, { type: recMime });
                    if (!blob.size) return;
                    const dataUrl = await blobToDataUrlChat(blob);
                    if (dataUrl) await enviarMensajeDirecto({ audio: dataUrl });
                };
                try {
                    chatMediaRecorder.start(250);
                } catch (err) {
                    chatMediaRecorder.start();
                }
                chatRecording = true;
                chatRecordStartedAt = Date.now();
                conectarAnalizadorChat(stream);
                pulsoHaptico(18);
                sonidoChatGrabacion('start');
                if (chatLockPending) anclarGrabacionAudioChat();
                else pintarEstadoGrabacionChat();
                actualizarTimerGrabacionChat();
                if (chatRecordTimerId) clearInterval(chatRecordTimerId);
                chatRecordTimerId = setInterval(actualizarTimerGrabacionChat, 200);
            } catch (e) {
                console.error('No se pudo iniciar la grabación:', e);
                resetEstadoGrabacionChat();
                pintarEstadoGrabacionChat();
                const denied = e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.name === 'SecurityError');
                mostrarToastLujo(denied
                    ? 'Activa el micrófono en Ajustes → Aplicaciones → AWAKE'
                    : 'No se pudo iniciar la grabación');
            }
        }

        function actualizarTimerGrabacionChat() {
            if (!chatRecording) return;
            const secs = Math.floor(msGrabacionAudioChat() / 1000);
            const label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
            const timeEl = document.getElementById('ig-rec-time');
            const timeLocked = document.getElementById('ig-rec-time-locked');
            if (timeEl) timeEl.textContent = label;
            if (timeLocked) timeLocked.textContent = label;
            const rec = document.getElementById('ig-rec-bar');
            if (rec) rec.style.setProperty('--rec-progress', String(Math.min(1, secs / 60)));
            if (!chatRecordPaused && secs >= 60) detenerGrabacionAudioChat(false);
        }

        function alternarPausaGrabacionChat() {
            if (!chatRecordLocked || !chatMediaRecorder || chatStopping) return;
            if (!chatRecordPaused) {
                if (chatMediaRecorder.state !== 'recording') return;
                chatRecordPaused = true;
                chatPauseStartedAt = Date.now();
                try { chatMediaRecorder.pause(); } catch (e) {
                    chatRecordPaused = false;
                    chatPauseStartedAt = 0;
                    return;
                }
                pulsoHaptico(10);
            } else {
                if (chatMediaRecorder.state !== 'paused') return;
                chatPausedTotalMs += Date.now() - (chatPauseStartedAt || Date.now());
                chatPauseStartedAt = 0;
                chatRecordPaused = false;
                try { chatMediaRecorder.resume(); } catch (e) {}
                pulsoHaptico(10);
            }
            pintarEstadoGrabacionChat();
        }

        function detenerGrabacionAudioChat(cancelar) {
            if (chatStopping) return;
            limpiarTimerAncladoChat();
            chatStopping = true;
            if (chatRecordTimerId) {
                clearInterval(chatRecordTimerId);
                chatRecordTimerId = null;
            }
            if (chatWaveRaf) {
                cancelAnimationFrame(chatWaveRaf);
                chatWaveRaf = null;
            }
            chatRecordCancel = !!cancelar;
            chatHoldActive = false;
            chatMicStarting = false;
            if (cancelar) {
                pulsoHaptico(26);
                sonidoChatGrabacion('discard');
            } else {
                pulsoHaptico(14);
                sonidoChatGrabacion('send');
            }
            if (!chatMediaRecorder || chatMediaRecorder.state === 'inactive') {
                resetEstadoGrabacionChat();
                pintarEstadoGrabacionChat();
                return;
            }
            chatRecording = false;
            try {
                if (chatMediaRecorder.state === 'paused') chatMediaRecorder.resume();
            } catch (e) {}
            try { chatMediaRecorder.stop(); } catch (e) {
                resetEstadoGrabacionChat();
                pintarEstadoGrabacionChat();
            }
        }

        function blobToDataUrlChat(blob) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        }

        function idsChatIguales(a, b) {
            return String(a || '') === String(b || '');
        }

        function chatModalEstaAbierto() {
            const modal = document.getElementById('direct-chat-modal');
            return !!(modal && modal.classList.contains('active'));
        }

        function mensajeEsDeLaConversacionActiva(msg) {
            if (!currentUser || !activeDirectChatUser || !msg) return false;
            const me = String(currentUser.id);
            const other = String(activeDirectChatUser.id);
            const s = String(msg.sender_id || '');
            const r = String(msg.receiver_id || '');
            return (s === me && r === other) || (s === other && r === me);
        }

        async function fetchMensajesConversacion(otherId, opts = {}) {
            if (!currentUser || !otherId) return [];
            const me = currentUser.id;
            const after = opts.after || null;
            const limit = opts.limit || CHAT_HISTORIAL_LIMITE;
            let query = supabaseClient
                .from('messages')
                .select('id, sender_id, receiver_id, created_at, text')
                .or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`);

            if (after) {
                query = query.gt('created_at', after).order('created_at', { ascending: true }).limit(80);
            } else {
                query = query.order('created_at', { ascending: false }).limit(limit);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Error al cargar los mensajes del chat:', error);
                return null;
            }
            const rows = data || [];
            if (!after) rows.reverse();
            return rows;
        }

        function actualizarMarcaTiempoChat(msg) {
            if (msg && msg.created_at && (!chatLastMessageAt || msg.created_at > chatLastMessageAt)) {
                chatLastMessageAt = msg.created_at;
            }
        }

        function integrarMensajeChat(msg) {
            if (!msg || !currentUser) return false;
            actualizarMarcaTiempoChat(msg);
            const isMe = idsChatIguales(msg.sender_id, currentUser.id);
            if (isMe) {
                const pendingIdx = pendingOptimisticChatTexts.indexOf(msg.text);
                if (pendingIdx !== -1) {
                    pendingOptimisticChatTexts.splice(pendingIdx, 1);
                    if (msg.id) renderedChatMessageIds.add(String(msg.id));
                    return false;
                }
            }
            return appendMensajeChatAlDom(msg.text, isMe, msg.id, msg.created_at);
        }

        function vaciarColaMensajesChat() {
            if (!queuedChatInserts.length) return;
            const pending = queuedChatInserts.splice(0, queuedChatInserts.length);
            pending.forEach(msg => {
                if (mensajeEsDeLaConversacionActiva(msg)) integrarMensajeChat(msg);
            });
        }

        function iniciarPollingChat() {
            detenerPollingChat();
            sincronizarMensajesChatActivo();
            chatPollIntervalId = setInterval(sincronizarMensajesChatActivo, 1600);
        }

        function detenerPollingChat() {
            if (chatPollIntervalId) {
                clearInterval(chatPollIntervalId);
                chatPollIntervalId = null;
            }
        }

        async function sincronizarMensajesChatActivo() {
            if (chatSyncInFlight) return;
            if (!currentUser || !activeDirectChatUser || !chatModalEstaAbierto()) return;
            const otherId = activeDirectChatUser.id;
            chatSyncInFlight = true;
            try {
                const msgs = await fetchMensajesConversacion(otherId, chatLastMessageAt
                    ? { after: chatLastMessageAt }
                    : { limit: CHAT_HISTORIAL_LIMITE });
                if (!msgs) return;
                if (!activeDirectChatUser || !idsChatIguales(activeDirectChatUser.id, otherId)) return;
                msgs.forEach(integrarMensajeChat);
            } finally {
                chatSyncInFlight = false;
            }
        }

        function chatAbiertoImpideRefrescoPesado() {
            return !!(chatModalEstaAbierto() && activeDirectChatUser);
        }

        function registroEnMemoriaPorLogId(logId) {
            if (!logId || !window.registrosGlobalMap) return null;
            return window.registrosGlobalMap[logId] || null;
        }

        function aplicarLikeRealtime(row, esAlta) {
            if (!row || !row.log_id) return;
            const reg = registroEnMemoriaPorLogId(row.log_id);
            if (!reg) return;
            const esMio = !!(currentUser && row.user_id === currentUser.id);
            if (esAlta) {
                if (esMio && reg.likedByMe) {
                    pintarLikeEnPost(row.log_id, true, reg.likes);
                    return;
                }
                if (esMio) reg.likedByMe = true;
                reg.likes = (reg.likes || 0) + 1;
            } else {
                if (esMio && !reg.likedByMe) {
                    pintarLikeEnPost(row.log_id, false, reg.likes);
                    return;
                }
                if (esMio) reg.likedByMe = false;
                reg.likes = Math.max(0, (reg.likes || 0) - 1);
            }
            pintarLikeEnPost(row.log_id, !!reg.likedByMe, reg.likes);
        }

        function pintarLikeEnPost(pubId, liked, likes) {
            const countEl = document.getElementById('likes-count-' + pubId);
            if (countEl) countEl.textContent = likes || 0;
            const postCard = document.getElementById('ig-post-' + pubId);
            if (!postCard) return;
            const likeSvg = postCard.querySelector('.ig-like-icon');
            if (!likeSvg) return;
            likeSvg.setAttribute('fill', liked ? '#ef4444' : 'none');
            likeSvg.setAttribute('stroke', liked ? '#ef4444' : 'var(--text-main)');
        }

        function aplicarComentarioRealtime(row, esAlta) {
            if (!row || !row.log_id) return;
            const reg = registroEnMemoriaPorLogId(row.log_id);
            if (!reg) return;
            if (!reg.comentarios) reg.comentarios = [];
            if (esAlta) {
                if (reg.comentarios.some(c => String(c.id) === String(row.id))) return;
                if (currentUser && row.user_id === currentUser.id) {
                    const temp = reg.comentarios.find(c => String(c.id).startsWith('temp_') && String(c.texto || '') === String(row.text_comment || ''));
                    if (temp) {
                        temp.id = row.id;
                        actualizarContenedorComentariosDOM(row.log_id, reg);
                        return;
                    }
                }
                const cached = (window.cachePerfilesSocial && window.cachePerfilesSocial[row.user_id]) || {};
                reg.comentarios.push({
                    id: row.id,
                    user_id: row.user_id,
                    autor: cached.name || 'Usuario',
                    texto: row.text_comment || ''
                });
            } else {
                reg.comentarios = reg.comentarios.filter(c => String(c.id) !== String(row.id));
            }
            actualizarContenedorComentariosDOM(row.log_id, reg);
        }

        function solicitarRecargaDiario(opts) {
            if (!currentUser) return;
            if (chatAbiertoImpideRefrescoPesado() || (typeof selloUndoImpideRefrescoPesado === 'function' && selloUndoImpideRefrescoPesado())) {
                recargaDiarioPendiente = true;
                return;
            }
            if (recargaDiarioTimer) clearTimeout(recargaDiarioTimer);
            recargaDiarioTimer = setTimeout(async () => {
                recargaDiarioTimer = null;
                if (!currentUser) return;
                if (chatAbiertoImpideRefrescoPesado() || (typeof selloUndoImpideRefrescoPesado === 'function' && selloUndoImpideRefrescoPesado())) {
                    recargaDiarioPendiente = true;
                    return;
                }
                await cargarDatosUsuarioSupabase({ hidratarLocal: false, ...(opts || {}) });
            }, 250);
        }

        function diarioPuedeSincronizarEnSegundoPlano() {
            return !!currentUser;
        }

        function arrancarSincronizacionDiario() {
            suscribirBroadcastDiario();
            if (diarioSyncIntervalId) return;
            diarioSyncIntervalId = setInterval(() => {
                if (!diarioPuedeSincronizarEnSegundoPlano()) return;
                solicitarRecargaDiario();
            }, 3000);
            solicitarRecargaDiario();
        }

        function detenerBroadcastDiario() {
            if (diarioBroadcastChannel) {
                supabaseClient.removeChannel(diarioBroadcastChannel);
                diarioBroadcastChannel = null;
            }
        }

        function suscribirBroadcastDiario() {
            detenerBroadcastDiario();
            if (!currentUser) return;
            const ch = supabaseClient.channel('diario-sync-' + currentUser.id, {
                config: { broadcast: { ack: false, self: false } }
            });
            ch.on('broadcast', { event: 'dirty' }, () => {
                solicitarRecargaDiario();
            });
            ch.subscribe();
            diarioBroadcastChannel = ch;
        }

        function avisarDiarioRemoto() {
            if (!currentUser) return;
            const ch = diarioBroadcastChannel;
            if (!ch) {
                suscribirBroadcastDiario();
            }
            const dest = diarioBroadcastChannel;
            if (!dest || typeof dest.send !== 'function') return;
            dest.send({ type: 'broadcast', event: 'dirty', payload: { at: Date.now() } });
        }

        function detenerSincronizacionDiario() {
            detenerBroadcastDiario();
            if (diarioSyncIntervalId) {
                clearInterval(diarioSyncIntervalId);
                diarioSyncIntervalId = null;
            }
            if (recargaDiarioTimer) {
                clearTimeout(recargaDiarioTimer);
                recargaDiarioTimer = null;
            }
            recargaDiarioPendiente = false;
        }

        function iniciarSincronizacionAppNativa() {
            if (window._awakeAppSyncBound) return;
            const App = capacitorPlugin('App');
            if (!App || !App.addListener) {
                window._awakeAppSyncTries = (window._awakeAppSyncTries || 0) + 1;
                if (window._awakeAppSyncTries < 6) setTimeout(iniciarSincronizacionAppNativa, 400);
                return;
            }
            window._awakeAppSyncBound = true;
            App.addListener('appStateChange', ({ isActive }) => {
                if (!isActive) return;
                suscribirCambiosRealtime();
                suscribirRealtimeMensajes();
                solicitarRecargaDiario();
            });
        }

        function suscribirCambiosRealtime() {
            if (realtimeRetryTimer) {
                clearTimeout(realtimeRetryTimer);
                realtimeRetryTimer = null;
            }
            if (dbRealtimeChannel) {
                supabaseClient.removeChannel(dbRealtimeChannel);
                dbRealtimeChannel = null;
            }
            if (!currentUser) return;
            suscribirBroadcastDiario();

            const me = currentUser.id;
            const channel = supabaseClient.channel('public-db-changes-' + me);
            const onDiario = () => solicitarRecargaDiario();
            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, onDiario)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, onDiario)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, onDiario)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, (payload) => {
                    aplicarLikeRealtime(payload && payload.new, true);
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, (payload) => {
                    aplicarLikeRealtime(payload && payload.old, false);
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
                    aplicarComentarioRealtime(payload && payload.new, true);
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
                    aplicarComentarioRealtime(payload && payload.old, false);
                })
                .subscribe((status) => {
                    if (dbRealtimeChannel !== channel) return;
                    if (status === 'SUBSCRIBED') solicitarRecargaDiario();
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        if (realtimeRetryTimer) return;
                        realtimeRetryTimer = setTimeout(() => {
                            realtimeRetryTimer = null;
                            suscribirCambiosRealtime();
                        }, 2500);
                    }
                });
            dbRealtimeChannel = channel;
        }

        function suscribirRealtimeMensajes() {
            if (realtimeChatRetryTimer) {
                clearTimeout(realtimeChatRetryTimer);
                realtimeChatRetryTimer = null;
            }
            if (chatRealtimeChannel) {
                supabaseClient.removeChannel(chatRealtimeChannel);
                chatRealtimeChannel = null;
            }
            if (!currentUser) return;

            const me = currentUser.id;
            const channel = supabaseClient.channel(`messages-inbox-${me}`);
            const onInsert = (payload) => manejarNuevoMensajeRealtime(payload && payload.new);
            channel
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${me}` }, onInsert)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${me}` }, onInsert)
                .subscribe((status) => {
                    if (chatRealtimeChannel !== channel) return;
                    if (status === 'SUBSCRIBED') sincronizarMensajesChatActivo();
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        if (realtimeChatRetryTimer) return;
                        realtimeChatRetryTimer = setTimeout(() => {
                            realtimeChatRetryTimer = null;
                            suscribirRealtimeMensajes();
                        }, 1800);
                    }
                });
            chatRealtimeChannel = channel;
        }

        function idCanalBroadcastChat(userA, userB) {
            return [String(userA || ''), String(userB || '')].sort().join(':');
        }

        function dejarBroadcastChat() {
            if (chatBroadcastChannel) {
                supabaseClient.removeChannel(chatBroadcastChannel);
                chatBroadcastChannel = null;
            }
            chatBroadcastPeerId = null;
        }

        function suscribirBroadcastChat(otherId) {
            if (!currentUser || !otherId) return;
            if (chatBroadcastChannel && idsChatIguales(chatBroadcastPeerId, otherId)) return;
            dejarBroadcastChat();
            const name = `dm:${idCanalBroadcastChat(currentUser.id, otherId)}`;
            const channel = supabaseClient.channel(name, {
                config: { broadcast: { ack: false, self: false } }
            });
            channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
                if (payload) manejarNuevoMensajeRealtime(payload);
            });
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') sincronizarMensajesChatActivo();
            });
            chatBroadcastChannel = channel;
            chatBroadcastPeerId = String(otherId);
        }

        function emitirMensajeChat(msg) {
            if (!chatBroadcastChannel || !msg) return;
            try {
                const result = chatBroadcastChannel.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: msg
                });
                if (result && typeof result.catch === 'function') result.catch(() => {});
            } catch (e) {}
        }

        function manejarNuevoMensajeRealtime(newMsg) {
            if (!currentUser || !newMsg) return;
            const involvesMe = idsChatIguales(newMsg.sender_id, currentUser.id) || idsChatIguales(newMsg.receiver_id, currentUser.id);
            if (!involvesMe) return;

            const isMine = idsChatIguales(newMsg.sender_id, currentUser.id);
            const modalOpen = chatModalEstaAbierto();
            const inThisChat = mensajeEsDeLaConversacionActiva(newMsg);

            if (modalOpen && inThisChat) {
                const list = document.getElementById('direct-chat-messages-list');
                if (!list) {
                    queuedChatInserts.push(newMsg);
                    return;
                }
                integrarMensajeChat(newMsg);
            } else if (modalOpen && !activeDirectChatUser) {
                renderizarBandejaMensajesGeneral();
            }

            if (!isMine && idsChatIguales(newMsg.receiver_id, currentUser.id)) {
                const viewingThisChat = modalOpen && activeDirectChatUser && idsChatIguales(activeDirectChatUser.id, newMsg.sender_id);
                if (!viewingThisChat) {
                    mostrarNotificacionMensaje(newMsg);
                    refrescarBadgeMensajes();
                } else {
                    marcarChatLeido(newMsg.sender_id, newMsg.created_at);
                }
            }
        }

        async function renderizarBandejaMensajesGeneral() {
            const loadGen = ++inboxLoadGeneration;
            pintarCabeceraChatBandeja();
            const container = document.getElementById('direct-chat-body-container');
            if (!container) return;
            container.style.overflowY = 'auto';
            const bandejaYaVisible = !!container.querySelector('.ig-inbox-row, .empty-state');
            if (!bandejaYaVisible) {
                container.innerHTML = htmlSkeletonBandeja();
            }

            if (!currentUser) return;
            await hidratarLecturasChatDesdeServidor();

            const me = currentUser.id;
            const { data: rows, error } = await supabaseClient
                .from('messages')
                .select('id, sender_id, receiver_id, created_at')
                .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
                .order('created_at', { ascending: false })
                .limit(400);

            if (loadGen !== inboxLoadGeneration || activeDirectChatUser) return;
            if (error) {
                console.error("Error al cargar la bandeja de mensajes:", error);
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">Error al cargar chats.</div>';
                return;
            }

            const userIdsToFetch = new Set();
            const chatsMap = {};

            (rows || []).forEach(m => {
                const otherId = m.sender_id === me ? m.receiver_id : m.sender_id;
                if (!otherId) return;
                userIdsToFetch.add(otherId);
                if (!chatsMap[otherId]) {
                    chatsMap[otherId] = {
                        lastId: m.id,
                        lastMessage: 'Conversación',
                        lastTime: m.created_at,
                        lastFromThem: m.sender_id !== me
                    };
                }
            });

            const lastIds = Object.values(chatsMap).map(c => c.lastId).filter(Boolean);
            if (lastIds.length > 0) {
                const { data: lastMsgs } = await supabaseClient
                    .from('messages')
                    .select('id, text')
                    .in('id', lastIds);
                if (loadGen !== inboxLoadGeneration || activeDirectChatUser) return;
                const byId = {};
                (lastMsgs || []).forEach(m => { byId[m.id] = m.text; });
                Object.keys(chatsMap).forEach(uid => {
                    const txt = byId[chatsMap[uid].lastId];
                    if (txt != null) chatsMap[uid].lastMessage = previewTextoChatBandeja(txt);
                });
            }

            const otherIdsArr = Array.from(userIdsToFetch);
            let profilesMap = {};
            if (otherIdsArr.length > 0) {
                const { data: profs } = await supabaseClient
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', otherIdsArr);
                if (loadGen !== inboxLoadGeneration || activeDirectChatUser) return;
                if (profs) {
                    profs.forEach(p => {
                        profilesMap[p.id] = p;
                    });
                }
            }

            if (loadGen !== inboxLoadGeneration || activeDirectChatUser) return;

            container.innerHTML = '';
            const chatKeys = Object.keys(chatsMap);

            if (chatKeys.length === 0) {
                container.innerHTML = htmlEstadoVacio({
                    title: 'Bandeja vacía',
                    text: 'No hay conversaciones todavía.',
                    icon: ICONO_VACIO_CHAT
                });
                return;
            }

            chatKeys.forEach(uid => {
                const chatInfo = chatsMap[uid];
                const prof = profilesMap[uid] || { username: 'Usuario', avatar_url: null };
                const avatarHtml = prof.avatar_url ? `<img src="${htmlImgSrc(prof.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">` : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                const reads = leerMapaLecturasChat();
                const lastRead = reads[uid];
                const unread = !!(chatInfo.lastFromThem && esChatNoLeido(chatInfo.lastTime, lastRead));

                const div = document.createElement('div');
                div.className = `ig-inbox-row${unread ? ' unread' : ''}`;
                div.innerHTML = `
                    <div class="ig-inbox-avatar">${avatarHtml}</div>
                    <div class="ig-inbox-meta">
                        <div class="ig-inbox-name">${escapeHtmlChat(prof.username)}</div>
                        <div class="ig-inbox-preview">${escapeHtmlChat(chatInfo.lastMessage)}</div>
                        <div class="ig-inbox-time">${horaCortaDeFecha(chatInfo.lastTime)}</div>
                    </div>
                    ${unread ? '<span class="ig-inbox-unread-dot"></span>' : ''}
                `;
                div.onclick = () => abrirChatConUsuario(uid, prof.username, prof.avatar_url);
                container.appendChild(div);
            });
            refrescarBadgeMensajes();
        }

        async function renderizarInterfazChatIndividual() {
            if (!activeDirectChatUser || !currentUser) return;
            const loadGen = ++chatLoadGeneration;
            const otherId = activeDirectChatUser.id;
            pintarCabeceraChatIndividual();
            const container = document.getElementById('direct-chat-body-container');
            if (!container) return;
            container.style.overflowY = 'hidden';
            renderedChatMessageIds = new Set();
            pendingOptimisticChatTexts = [];
            queuedChatInserts = [];
            chatLastMessageAt = null;
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; font-size: 0.8rem;">Cargando mensajes...</div>';

            const chatMsgs = await fetchMensajesConversacion(otherId, { limit: CHAT_HISTORIAL_LIMITE });
            if (loadGen !== chatLoadGeneration) return;
            if (!activeDirectChatUser || !idsChatIguales(activeDirectChatUser.id, otherId)) return;

            if (chatMsgs === null) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">Error al cargar mensajes.</div>';
                return;
            }

            container.innerHTML = '';
            const messagesListDiv = document.createElement('div');
            messagesListDiv.id = 'direct-chat-messages-list';

            if (chatMsgs.length === 0) {
                messagesListDiv.innerHTML = htmlEstadoVacio({
                    title: 'Chat vacío',
                    text: `No hay mensajes con ${activeDirectChatUser.name}.`,
                    icon: ICONO_VACIO_CHAT,
                    dataAttr: 'data-empty-chat="1"'
                });
            } else {
                const frag = document.createDocumentFragment();
                let lastDay = '';
                chatMsgs.forEach(msg => {
                    actualizarMarcaTiempoChat(msg);
                    const isMe = idsChatIguales(msg.sender_id, currentUser.id);
                    const dayKey = claveDiaLocal(msg.created_at);
                    if (dayKey && dayKey !== lastDay) {
                        const sep = document.createElement('div');
                        sep.className = 'chat-day-sep';
                        sep.dataset.dayKey = dayKey;
                        sep.textContent = etiquetaDiaChat(msg.created_at);
                        frag.appendChild(sep);
                        lastDay = dayKey;
                    }
                    frag.appendChild(crearBurbujaMensajeChat(msg.text, isMe, msg.id, msg.created_at));
                });
                messagesListDiv.appendChild(frag);
            }

            container.appendChild(messagesListDiv);
            montarComposerChat(container);
            vaciarColaMensajesChat();

            messagesListDiv.scrollTop = messagesListDiv.scrollHeight;
            pintarVistosEnChatAbierto();
            // Marca como leído anclado a la marca temporal del servidor del último mensaje;
            // nunca a la hora del dispositivo, para que mensajes viejos no reaparezcan como
            // no leídos si el reloj local va retrasado respecto al servidor.
            if (chatLastMessageAt) marcarChatLeido(otherId, chatLastMessageAt);
            setTimeout(() => {
                if (loadGen !== chatLoadGeneration) return;
                const puedeHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
                if (!puedeHover) return;
                const inp = document.getElementById('direct-msg-input');
                if (inp) inp.focus();
            }, 50);
        }

        async function enviarMensajeDirecto(extra = {}) {
            if (!activeDirectChatUser || !currentUser) return;
            if (demasiadoPronto('chat', 350)) return;
            const input = document.getElementById('direct-msg-input');
            const text = recortarTexto(((extra && extra.text) != null ? extra.text : (input ? input.value : '')).trim(), AWAKE_LIMITE_CHAT);
            const image = extra.image || null;
            const audio = extra.audio || null;
            if (!text && !image && !audio) return;

            const seguirEscribiendo = !image && !audio;
            if (input) input.value = '';
            actualizarEstadoComposerChat();
            if (seguirEscribiendo) conservarFocoComposerChat();
            const imageUrl = image ? await subirMediaAwake(image, 'chat', 'jpg') : null;
            const audioUrl = audio ? await subirMediaAwake(audio, 'chat', 'webm') : null;
            if (image && (!imageUrl || esDataUrlMedia(imageUrl))) {
                mostrarToastLujo('No se pudo enviar la imagen.');
                return;
            }
            if (audio && (!audioUrl || esDataUrlMedia(audioUrl))) {
                mostrarToastLujo('No se pudo enviar el audio.');
                return;
            }
            const payload = {
                text,
                image: imageUrl,
                audio: audioUrl,
                replyTo: pendingChatReply ? pendingChatReply.id : null,
                replySnippet: pendingChatReply ? pendingChatReply.snippet : '',
                replyName: pendingChatReply ? pendingChatReply.name : ''
            };
            const serialized = serializeChatPayload(payload);
            pendingChatReply = null;
            pintarBannerRespuestaChat();

            pendingOptimisticChatTexts.push(serialized);
            appendMensajeChatAlDom(serialized, true, null, new Date().toISOString());
            if (seguirEscribiendo) {
                conservarFocoComposerChat();
                requestAnimationFrame(conservarFocoComposerChat);
                setTimeout(conservarFocoComposerChat, 40);
            }
            const sendBtn = document.getElementById('chat-send-btn');
            if (sendBtn && !respetaMenosMovimiento()) {
                sendBtn.classList.remove('send-pulse');
                void sendBtn.offsetWidth;
                sendBtn.classList.add('send-pulse');
                setTimeout(() => sendBtn.classList.remove('send-pulse'), 250);
            }

            const { data: inserted, error } = await supabaseClient.from('messages').insert([{
                sender_id: currentUser.id,
                receiver_id: activeDirectChatUser.id,
                text: serialized
            }]).select('id, sender_id, receiver_id, created_at, text').maybeSingle();

            if (error) {
                console.error("Error al enviar mensaje:", error.message);
                const pendingIdx = pendingOptimisticChatTexts.indexOf(serialized);
                if (pendingIdx !== -1) pendingOptimisticChatTexts.splice(pendingIdx, 1);
                await borrarVariasMediaAwake([imageUrl, audioUrl].filter(Boolean));
            } else {
                const row = inserted || {
                    id: null,
                    sender_id: currentUser.id,
                    receiver_id: activeDirectChatUser.id,
                    created_at: new Date().toISOString(),
                    text: serialized
                };
                if (row.id) renderedChatMessageIds.add(String(row.id));
                actualizarMarcaTiempoChat(row);
                emitirMensajeChat(row);
                notificarPushAlDestinatario({
                    receiverId: activeDirectChatUser.id,
                    senderId: currentUser.id,
                    senderName: (document.getElementById('display-nickname') || {}).textContent || 'Usuario',
                    preview: previewTextoChat(serialized),
                    messageId: row.id
                });
            }
        }
