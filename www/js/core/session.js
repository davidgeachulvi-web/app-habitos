        const SUPABASE_URL = 'https://jmzbionwibffnzlfeiwx.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptemJpb253aWJmZm56bGZlaXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NzcsImV4cCI6MjEwMjU0Mzk3N30.w2csPwJtyNkGsMIZeZ-G9BxOl9EGmPPgF1Pm9YVXJrE';
        const AWAKE_AUTH_STORAGE_KEY = 'sb-jmzbionwibffnzlfeiwx-auth-token';
        const AWAKE_COOKIE_RT = 'awake_sb_rt';
        const AWAKE_COOKIE_SESS = 'awake_sb_sess';
        const AWAKE_IDB_NAME = 'awake-persist';
        const AWAKE_IDB_STORE = 'kv';
        const awakeAuthMemory = new Map();

        function awakeCookieSecure() {
            return location.protocol === 'https:' ? '; Secure' : '';
        }
        function leerCookieAwake(name) {
            try {
                const cookies = document.cookie ? document.cookie.split(';') : [];
                for (let i = 0; i < cookies.length; i++) {
                    const part = cookies[i].trim();
                    if (part.indexOf(name + '=') === 0) return decodeURIComponent(part.slice(name.length + 1));
                }
            } catch (e) {}
            return null;
        }
        function borrarCookieAwake(name) {
            try {
                document.cookie = name + '=; Path=/; Max-Age=0; SameSite=Lax' + awakeCookieSecure();
            } catch (e) {}
        }
        function extraerSesionAuthGuardada(raw) {
            if (!raw || raw === 'null') return null;
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return parsed && (parsed.currentSession || parsed);
            } catch (e) { return null; }
        }
        function usuarioDesdeAccessToken(token) {
            try {
                const part = String(token || '').split('.')[1];
                if (!part) return null;
                const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
                const pad = b64 + '==='.slice((b64.length + 3) % 4);
                const payload = JSON.parse(atob(pad));
                if (!payload || !payload.sub) return null;
                return {
                    id: payload.sub,
                    aud: payload.aud,
                    role: payload.role,
                    email: payload.email,
                    phone: payload.phone || '',
                    app_metadata: payload.app_metadata || {},
                    user_metadata: payload.user_metadata || {},
                    identities: [],
                    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : '',
                    updated_at: ''
                };
            } catch (e) { return null; }
        }
        function inflarSesionAuth(raw) {
            const sess = extraerSesionAuthGuardada(raw);
            if (!sess || !sess.refresh_token) return null;
            if (!sess.user && sess.access_token) sess.user = usuarioDesdeAccessToken(sess.access_token);
            return JSON.stringify(sess);
        }
        function leerSesionDesdeCookies() {
            const inflated = inflarSesionAuth(leerCookieAwake(AWAKE_COOKIE_SESS));
            const sess = extraerSesionAuthGuardada(inflated);
            if (sess && sess.access_token && sess.refresh_token) return inflated;
            const rt = leerCookieAwake(AWAKE_COOKIE_RT);
            if (!rt) return null;
            return JSON.stringify({ refresh_token: rt, token_type: 'bearer' });
        }
        function migrarYBorrarCookiesAuth() {
            try {
                let raw = null;
                try { raw = localStorage.getItem(AWAKE_AUTH_STORAGE_KEY); } catch (e) {}
                if (!raw) raw = leerSesionDesdeCookies();
                if (raw) {
                    awakeAuthMemory.set(AWAKE_AUTH_STORAGE_KEY, raw);
                    try { localStorage.setItem(AWAKE_AUTH_STORAGE_KEY, raw); } catch (e2) {}
                    idbSetAwake(AWAKE_AUTH_STORAGE_KEY, raw);
                }
            } catch (e) {}
            borrarCookieAwake(AWAKE_COOKIE_RT);
            borrarCookieAwake(AWAKE_COOKIE_SESS);
        }
        function openAwakeIdb() {
            return new Promise((resolve, reject) => {
                if (!window.indexedDB) return reject(new Error('no idb'));
                const req = indexedDB.open(AWAKE_IDB_NAME, 1);
                req.onupgradeneeded = function () {
                    if (!req.result.objectStoreNames.contains(AWAKE_IDB_STORE)) req.result.createObjectStore(AWAKE_IDB_STORE);
                };
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { reject(req.error); };
            });
        }
        function idbGetAwake(key) {
            return openAwakeIdb().then((db) => new Promise((resolve) => {
                const rq = db.transaction(AWAKE_IDB_STORE, 'readonly').objectStore(AWAKE_IDB_STORE).get(key);
                rq.onsuccess = function () { resolve(rq.result || null); };
                rq.onerror = function () { resolve(null); };
            })).catch(() => null);
        }
        function idbSetAwake(key, value) {
            return openAwakeIdb().then((db) => new Promise((resolve) => {
                const tx = db.transaction(AWAKE_IDB_STORE, 'readwrite');
                tx.objectStore(AWAKE_IDB_STORE).put(value, key);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { resolve(); };
            })).catch(() => {});
        }
        function idbRemoveAwake(key) {
            return openAwakeIdb().then((db) => new Promise((resolve) => {
                const tx = db.transaction(AWAKE_IDB_STORE, 'readwrite');
                tx.objectStore(AWAKE_IDB_STORE).delete(key);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { resolve(); };
            })).catch(() => {});
        }
        function borrarRespaldoSesionAuth() {
            awakeAuthMemory.delete(AWAKE_AUTH_STORAGE_KEY);
            borrarCookieAwake(AWAKE_COOKIE_RT);
            borrarCookieAwake(AWAKE_COOKIE_SESS);
            try { localStorage.removeItem(AWAKE_AUTH_STORAGE_KEY); } catch (e) {}
            idbRemoveAwake(AWAKE_AUTH_STORAGE_KEY);
        }
        function respaldarSesionAuthEnNavegador(session) {
            if (!session) return;
            try {
                const raw = JSON.stringify(session);
                awakeAuthMemory.set(AWAKE_AUTH_STORAGE_KEY, raw);
                try { localStorage.setItem(AWAKE_AUTH_STORAGE_KEY, raw); } catch (e) {}
                idbSetAwake(AWAKE_AUTH_STORAGE_KEY, raw);
            } catch (e) {}
        }

        migrarYBorrarCookiesAuth();

        const almacenAuthAwake = {
            getItem: async function (key) {
                try {
                    if (awakeAuthMemory.has(key)) return awakeAuthMemory.get(key);
                    try {
                        const ls = localStorage.getItem(key);
                        if (ls) {
                            awakeAuthMemory.set(key, ls);
                            return ls;
                        }
                    } catch (e) {}
                    const idbVal = await idbGetAwake(key);
                    if (idbVal) {
                        awakeAuthMemory.set(key, idbVal);
                        try { localStorage.setItem(key, idbVal); } catch (e2) {}
                        return idbVal;
                    }
                } catch (e) {}
                return null;
            },
            setItem: async function (key, value) {
                awakeAuthMemory.set(key, value);
                try { localStorage.setItem(key, value); } catch (e) {}
                await idbSetAwake(key, value);
            },
            removeItem: async function (key) {
                awakeAuthMemory.delete(key);
                try { localStorage.removeItem(key); } catch (e) {}
                if (key === AWAKE_AUTH_STORAGE_KEY) {
                    borrarCookieAwake(AWAKE_COOKIE_RT);
                    borrarCookieAwake(AWAKE_COOKIE_SESS);
                }
                await idbRemoveAwake(key);
            }
        };

        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false,
                storage: almacenAuthAwake,
                storageKey: AWAKE_AUTH_STORAGE_KEY
            },
            realtime: {
                params: { eventsPerSecond: 10 }
            }
        });
