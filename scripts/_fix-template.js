const fs = require('fs');
const p = 'scripts/trazar-icono-moneda.js';
let s = fs.readFileSync(p, 'utf8');
const startMarker = "    const js = ";
const endMarker = "    fs.mkdirSync(path.dirname(OUT)";
const si = s.indexOf(startMarker);
const ei = s.indexOf(endMarker);
if (si < 0 || ei < 0) { console.error('marcadores no encontrados', si, ei); process.exit(1); }

const nl = '\n';
const q = "'";
const block = [
  "    const js = " + q + "/* AWAKE - trazado offline del icono (generado, no editar a mano)." + nl + q + " +",
  "        " + q + " * Umbral ' + THRESHOLD + ' - epsilon ' + EPSILON + ' - canvas ' + CANVAS + ' - outers ' + outersN + ' - holes ' + holesN + ' - puntos ' + totalPts + ' */" + nl + q + " +",
  "        " + q + "export const ICONO_TRAZADO = {" + nl + q + " +",
  "        " + q + "    viewBox: ' + CANVAS + '," + nl + q + " +",
  "        " + q + "    d: ' + JSON.stringify(dAll) + '," + nl + q + " +",
  "        " + q + "    loops: ' + loopsJson + nl + q + " +",
  "        " + q + "};" + nl + q + ";",
  ""
].join("\n");

s = s.slice(0, si) + block + s.slice(ei);
fs.writeFileSync(p, s);
console.log('bloque js reescrito');
