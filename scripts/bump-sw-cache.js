// Aggiorna CACHE_NAME in public/service-worker.js vor jedem Build/Deploy,
// damit die Datei sich immer ändert und der Browser das Service-Worker-Update
// zuverlässig erkennt (sonst bleibt die alte Cache-Version für immer aktiv).
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'service-worker.js');
let content = fs.readFileSync(file, 'utf8');
const newVersion = `braba-prueftool-${Date.now()}`;
content = content.replace(/const CACHE_NAME = '.*';/, `const CACHE_NAME = '${newVersion}';`);
fs.writeFileSync(file, content);
console.log('Service worker cache version:', newVersion);
