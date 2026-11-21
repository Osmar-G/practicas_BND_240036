// Regenera todo el sitio estático desde el respaldo configurado en config.js.
// Uso: node scripts/refresh_all.js [ruta/al/Respaldo.sql]
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, BACKUP_FILE, DATA_DIR, RECORDS_DIR } = require('./config');

const backup = process.argv[2] || BACKUP_FILE;
const sourceLabel = path.basename(backup);
const steps = [
  ['analyze_sql.js', [backup, DATA_DIR], 'Estructura, relaciones y componentes SQL'],
  ['analyze_backup_inserts.js', [backup, path.join(DATA_DIR, 'backup-summary.json')], 'Resumen de filas INSERT'],
  ['generate_static_records.js', [backup, RECORDS_DIR], 'Páginas JSON de registros'],
];

console.log(`Fuente: ${sourceLabel}`);
for (const [script, args, label] of steps) {
  console.log(`\n→ ${label}`);
  execFileSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}
console.log('\nListo. El sitio ya apunta a los metadatos generados desde el respaldo configurado.');
