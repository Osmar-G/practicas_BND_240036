// Export sanitized INSERT rows as static, paged JSON files for GitHub Pages.
// Values in likely secret/payment fields are masked before they enter public JSON.
const fs = require('fs');
const path = require('path');
const { BACKUP_FILE, DATA_DIR, RECORDS_DIR } = require('./config');
const input = process.argv[2] || BACKUP_FILE;
const outDir = process.argv[3] || RECORDS_DIR;
const pageSize = 100;
const sql = fs.readFileSync(input, 'utf8');
const schema = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tables.json'), 'utf8'));
const byTable = new Map(schema.map(t => [t.name, t]));
const counts = new Map(schema.map(t => [t.name, 0]));
const sensitive = /password|passwd|secret|token|hash|salt|cvv|cvc|card.?number|credit.?card|api.?key|authorization|email|phone|mobile|address|first.?name|last.?name|full.?name|username|user.?name|ip.?address|given.?names|family.?names|recipient.?name|(^|_)nick$|db.?user|tracking|provider.?reference|payment.?reference|event.?reference|last.?four|latitude|longitude|delivery.?instructions|birth.?date|gender|country.?code|(^|_)user.?id$|person.?id|record.?id|(^|_)value$|(^|_)notes?$|remarks|table_description/i;

function endStatement(s, start) {
  let q = '', esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (q) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) { if (s[i + 1] === q) i++; else q = ''; } continue; }
    if (c === "'" || c === '"') q = c;
    else if (c === ';') return i;
  }
  return s.length;
}
function splitTop(s) {
  const out = []; let start = 0, depth = 0, q = '', esc = false;
  for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) { if (s[i + 1] === q) i++; else q = ''; } continue; }
    if (c === "'" || c === '"') q = c; else if (c === '(') depth++; else if (c === ')') depth--; else if (c === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  } out.push(s.slice(start).trim()); return out;
}
function decode(token) {
  const v = token.trim(); if (/^NULL$/i.test(v)) return null;
  if (v[0] === "'" && v.at(-1) === "'") return v.slice(1, -1).replace(/''/g, "'").replace(/\\([0btnrZ\\'"\x1a])/g, (_, c) => ({'0':'\0',b:'\b',t:'\t',n:'\n',r:'\r',Z:'\x1a','\\':'\\',"'":"'",'"':'"','\x1a':'\x1a'}[c]));
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(v)) return v;
  return v;
}
function tuples(values) {
  const rows = []; let i = 0;
  while (i < values.length) { while (i < values.length && /[\s,]/.test(values[i])) i++; if (values[i] !== '(') { i++; continue; }
    const start = ++i; let q = '', esc = false, depth = 1;
    while (i < values.length && depth) { const c = values[i]; if (q) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) { if (values[i + 1] === q) i++; else q = ''; } i++; continue; }
      if (c === "'" || c === '"') q = c; else if (c === '(') depth++; else if (c === ')') depth--; i++;
    }
    rows.push(splitTop(values.slice(start, i - 1)));
  } return rows;
}
function writePages(name, columns, rows) {
  const dir = path.join(outDir, encodeURIComponent(name)); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  for (let i = 0; i < rows.length; i += pageSize) fs.writeFileSync(path.join(dir, `page-${Math.floor(i / pageSize) + 1}.json`), JSON.stringify({table:name,columns,records:rows.slice(i,i+pageSize),pageSize,total:rows.length})+'\n');
}
const data = new Map(schema.map(t => [t.name, []]));
// Dump statements begin on their own line. Anchoring avoids text such as "INSERT INTO" inside values.
const insertRe = /^INSERT\s+INTO\s+`([^`]+)`\s*(?:\(([^)]*)\))?\s+VALUES\s*/gim;
for (const m of sql.matchAll(insertRe)) {
  const table = byTable.get(m[1]); if (!table) continue;
  const start = m.index + m[0].length, end = endStatement(sql, start), stmtRows = tuples(sql.slice(start, end));
  const columns = m[2] ? [...m[2].matchAll(/`([^`]+)`/g)].map(x => x[1]) : table.columns.map(c => c.name);
  for (const vals of stmtRows) {
    const row = {}; columns.forEach((c, i) => row[c] = sensitive.test(c) ? '[REDACTED]' : decode(vals[i] ?? 'NULL'));
    data.get(m[1]).push(row);
  }
}
for (const t of schema) { const rows = data.get(t.name), columns = t.columns.map(c => c.name); counts.set(t.name, rows.length); writePages(t.name, columns, rows); }
const result = schema.map(t => ({name:t.name,insertRows:counts.get(t.name)}));
fs.writeFileSync(path.join(DATA_DIR, 'backup-summary.json'), JSON.stringify({source:path.basename(input),generatedAt:new Date().toISOString(),backupModifiedAt:fs.statSync(input).mtime.toISOString(),tableCount:result.length,totalInsertRows:result.reduce((a,t)=>a+t.insertRows,0),tablesWithInsertRows:result.filter(t=>t.insertRows>0).length,tablesWithoutInsertRows:result.filter(t=>!t.insertRows).map(t=>t.name),tables:result},null,2)+'\n');
console.log(`Filas procesadas: ${result.reduce((a,t)=>a+t.insertRows,0)} en ${result.filter(t=>t.insertRows).length} tablas; páginas JSON de ${pageSize} filas como máximo; campos sensibles redactados.`);
