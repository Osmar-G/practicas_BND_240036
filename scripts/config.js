// Configuración central de las herramientas de generación del sitio estático.
// Cambia BACKUP_RELATIVE cuando se analice un respaldo distinto y ejecuta:
//   node scripts/refresh_all.js
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_RELATIVE = 'Practica4/backups/Respaldo16.sql';
const BACKUP_FILE = path.join(ROOT, BACKUP_RELATIVE);
const DATA_DIR = path.join(ROOT, 'data');
const RECORDS_DIR = path.join(DATA_DIR, 'records');
const SOURCE_LABEL = path.basename(BACKUP_FILE);

module.exports = {
  ROOT,
  BACKUP_RELATIVE,
  BACKUP_FILE,
  DATA_DIR,
  RECORDS_DIR,
  SOURCE_LABEL,
};
