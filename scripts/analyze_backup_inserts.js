// Count records included in mysqldump INSERT statements without copying row values.
const fs = require('fs');
const path = require('path');
const { BACKUP_FILE, DATA_DIR } = require('./config');

const input = process.argv[2] || BACKUP_FILE;
const output = process.argv[3] || path.join(DATA_DIR, 'backup-summary.json');
const sql = fs.readFileSync(input, 'utf8');
const tableNames = [...sql.matchAll(/CREATE\s+TABLE\s+`([^`]+)`\s*\(/gi)].map(m => m[1]);
const sections = [...sql.matchAll(/^-- Dumping data for table `([^`]+)`\s*$/gim)];

function countTuples(text, start) {
  let depth = 0, quote = '', escaped = false, tuples = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) {
        if (text[i + 1] === quote) i++;
        else quote = '';
      }
      continue;
    }
    if (c === "'") { quote = c; continue; }
    if (c === '(') { if (depth === 0) tuples++; depth++; continue; }
    if (c === ')') { depth--; continue; }
    if (c === ';' && depth === 0) break;
  }
  return tuples;
}

const tables = tableNames.map(name => ({ name, insertRows: 0, hasInsert: false }));
const byName = new Map(tables.map(t => [t.name, t]));
for (let i = 0; i < sections.length; i++) {
  const name = sections[i][1];
  const end = i + 1 < sections.length ? sections[i + 1].index : sql.length;
  const segment = sql.slice(sections[i].index, end);
  const target = byName.get(name);
  if (!target) continue;
  const statementRe = new RegExp('^INSERT\\s+INTO\\s+`' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '`(?:\\s*\\([^;]*?\\))?\\s+VALUES\\s*', 'gim');
  for (const insert of segment.matchAll(statementRe)) {
    target.hasInsert = true;
    target.insertRows += countTuples(segment, insert.index + insert[0].length);
  }
}

const result = {
  source: path.basename(input),
  generatedAt: new Date().toISOString(),
  backupModifiedAt: fs.statSync(input).mtime.toISOString(),
  tableCount: tables.length,
  totalInsertRows: tables.reduce((sum, table) => sum + table.insertRows, 0),
  tablesWithInsertRows: tables.filter(table => table.insertRows > 0).length,
  tablesWithoutInsertRows: tables.filter(table => table.insertRows === 0).map(table => table.name),
  tables,
};
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
const statsPath = path.join(path.dirname(output), 'estadisticas.json');
if (fs.existsSync(statsPath)) {
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  stats.totalRows = result.totalInsertRows;
  stats.tablesWithRows = result.tablesWithInsertRows;
  stats.emptyTables = result.tablesWithoutInsertRows.length;
  stats.rowsByTable = result.tables;
  stats.generatedAt = result.generatedAt;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n');
}
console.log(`${result.source}: ${result.tableCount} tablas, ${result.totalInsertRows} filas INSERT, ${result.tablesWithoutInsertRows.length} tablas sin filas INSERT.`);
