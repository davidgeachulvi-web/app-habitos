// Copiado verbatim de app.js (misma implementación que producción; d escrito como [0-9] por portabilidad).
function claveDiaLocal(dateLike) {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function parseIsoFechaLocal(iso) {
    const m = String(iso || '').match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
    if (!m) return null;
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    return isNaN(d.getTime()) ? null : d;
}
function habitEsArchivado(h) { return false; }
function fechaNacimientoHabito(h) {
    if (h && h.createdAt) {
        const d = inicioDiaLocal(new Date(h.createdAt));
        if (!isNaN(d.getTime())) return d;
    }
    return inicioDiaLocal(new Date());
}
