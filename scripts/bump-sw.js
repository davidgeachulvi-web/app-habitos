const fs = require('fs');
const path = require('path');

// Sube la versión del service worker (awake-shell-vN -> vN+1) antes de cada deploy.
const SW_PATH = path.join(__dirname, '..', 'www', 'sw.js');
let src = fs.readFileSync(SW_PATH, 'utf8');
const m = src.match(/awake-shell-v([0-9]+)/);
if (!m) {
    console.error('bump-sw: no se encontró la versión del service worker en www/sw.js');
    process.exit(1);
}
const oldV = parseInt(m[1], 10);
const newV = oldV + 1;
src = src.replace('awake-shell-v' + oldV, 'awake-shell-v' + newV);
fs.writeFileSync(SW_PATH, src);
console.log('bump-sw: awake-shell-v' + oldV + ' → awake-shell-v' + newV);
