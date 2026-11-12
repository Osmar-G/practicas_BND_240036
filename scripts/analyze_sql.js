// Build-time MySQL dump analyzer. Reads DDL only; INSERT statements are never parsed or emitted.
const fs = require('fs');
const path = require('path');
const input = process.argv[2] || 'Practica3/backups/Respaldo14.sql';
const output = process.argv[3] || 'data';
const sql = fs.readFileSync(input, 'utf8');
const db = (sql.match(/CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/i) || [])[1] || 'Desconocida';

function balanced(text, start) {
  let depth = 0, quote = '', esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === quote) quote = ''; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '(') depth++;
    if (c === ')' && --depth === 0) return i;
  }
  return -1;
}
function splitTop(s) {
  const out=[]; let from=0, depth=0, quote='', esc=false;
  for(let i=0;i<s.length;i++){const c=s[i]; if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;} if("'\"`".includes(c)){quote=c;continue;} if(c==='(')depth++; else if(c===')')depth--; else if(c===','&&depth===0){out.push(s.slice(from,i).trim());from=i+1;}}
  out.push(s.slice(from).trim()); return out.filter(Boolean);
}
const tables=[];
const tableRe=/CREATE\s+TABLE\s+`([^`]+)`\s*\(/gi;
for(const m of sql.matchAll(tableRe)){
  const open=m.index+m[0].lastIndexOf('('), close=balanced(sql,open); if(close<0)continue;
  const name=m[1], body=sql.slice(open+1,close), tail=sql.slice(close+1,sql.indexOf(';',close));
  const t={name,columns:[],primaryKey:[],primaryKeyDefinition:null,uniqueKeys:[],indexes:[],foreignKeys:[],checks:[],engine:(tail.match(/ENGINE\s*=\s*(\w+)/i)||[])[1]||null};
  for(const part of splitTop(body)){
    let x;
    if((x=part.match(/^PRIMARY\s+KEY\s*(?:`[^`]+`\s*)?\(([^)]+)\)/i))){t.primaryKey=x[1].match(/`([^`]+)`/g).map(v=>v.slice(1,-1));t.primaryKeyDefinition=part;continue;}
    if((x=part.match(/^(?:CONSTRAINT\s+`([^`]+)`\s+)?UNIQUE\s+(?:KEY|INDEX)\s*`?([^`\s(]+)?`?\s*\(([^)]+)\)/i))){t.uniqueKeys.push({name:x[2]||x[1]||'unique',columns:(x[3].match(/`([^`]+)`/g)||[]).map(v=>v.slice(1,-1)),definition:part});continue;}
    if((x=part.match(/^(?:CONSTRAINT\s+`([^`]+)`\s+)?(?:KEY|INDEX)\s*`?([^`\s(]+)?`?\s*\(([^)]+)\)/i))){t.indexes.push({name:x[2]||x[1]||'index',columns:(x[3].match(/`([^`]+)`/g)||[]).map(v=>v.slice(1,-1)),unique:false,definition:part});continue;}
    if((x=part.match(/^CONSTRAINT\s+`([^`]+)`\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+`([^`]+)`\s*\(([^)]+)\)([\s\S]*)/i))){t.foreignKeys.push({name:x[1],columns:cols(x[2]),referencesTable:x[3],referencesColumns:cols(x[4]),definition:part,onDelete:(x[5].match(/ON\s+DELETE\s+(\w+(?:\s+\w+)?)/i)||[])[1]||null,onUpdate:(x[5].match(/ON\s+UPDATE\s+(\w+(?:\s+\w+)?)/i)||[])[1]||null});continue;}
    if((x=part.match(/^CONSTRAINT\s+`([^`]+)`\s+CHECK\s*\((.*)\)/i))){t.checks.push({name:x[1],expression:x[2],definition:part});continue;}
    const col=part.match(/^`([^`]+)`\s+([\w]+(?:\s*\([^)]*\))?(?:\s+UNSIGNED)?(?:\s+ZEROFILL)?)/i); if(!col)continue;
    const raw=part.slice(col[0].length), type=col[2].replace(/\s+/g,' ').trim();
    const def=(raw.match(/\bDEFAULT\s+((?:'[^']*(?:''[^']*)*')|(?:b'[^']*')|(?:\"[^\"]*\")|(?:NULL)|(?:CURRENT_TIMESTAMP(?:\(\d*\))?)|(?:[-\w.]+))/i)||[])[1]||null;
    const generated=raw.match(/GENERATED\s+ALWAYS\s+AS\s*\((.*?)\)\s*(VIRTUAL|STORED)?/i);
    t.columns.push({name:col[1],type,nullable:!(/\bNOT\s+NULL\b/i.test(raw)),default:def,autoIncrement:/\bAUTO_INCREMENT\b/i.test(raw),generated:generated?{expression:generated[1],storage:generated[2]||null}:null,unique:false,primary:false,foreignKey:false,comment:(raw.match(/COMMENT\s+'((?:[^']|'')*)'/i)||[])[1]?.replace(/''/g,"'")||null});
  }
  for(const c of t.columns){c.primary=t.primaryKey.includes(c.name);c.unique=t.uniqueKeys.some(k=>k.columns.length===1&&k.columns[0]===c.name);c.foreignKey=t.foreignKeys.some(f=>f.columns.includes(c.name));}
  tables.push(t);
}
function cols(s){return (s.match(/`([^`]+)`/g)||[]).map(v=>v.slice(1,-1));}

const triggers=[];
const trigRe=/\/\*!50003\s+CREATE\*\/\s*\/\*!50017\s+DEFINER=.*?\*\/\s*\/\*!50003\s+TRIGGER\s+`([^`]+)`\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+`([^`]+)`[\s\S]*?\*\/;;/gi;
for(const m of sql.matchAll(trigRe)){const def=m[0].replace(/\/\*!\d+\s*/g,'').replace(/\*\//g,'').replace(/DEFINER=`[^`]*`@`[^`]*`\s*/i,'').replace(/;;$/,';').trim();triggers.push({name:m[1],timing:m[2],event:m[3],table:m[4],definition:def});}
function routines(kind){const out=[],re=new RegExp('CREATE\\s+(?:DEFINER=`[^`]*`@`[^`]*`\\s+)?'+kind+'\\s+`([^`]+)`\\s*\\(','gi'); for(const m of sql.matchAll(re)){const start=m.index,end=balanced(sql,m.index+m[0].lastIndexOf('(')); if(end<0)continue; let semi=sql.indexOf(';;',end); if(semi<0)semi=sql.indexOf(';',end);let def=sql.slice(start,semi<0?end+1:semi+1).replace(/DEFINER=`[^`]*`@`[^`]*`\s*/i,'').replace(/\/\*!\d+\s*/g,'').replace(/\*\//g,'').trim();
    // Never publish embedded email or password literals from routine bodies.
    def=def.replace(/'[^']*@[a-z0-9.-]+\.[a-z]{2,}[^']*'/gi,"'[correo omitido]'").replace(/(password\s*(?:=|,)\s*)'[^']*'/gi,"$1'[valor omitido]'");
    out.push({name:m[1],definition:def});}return out;}
const procedures=routines('PROCEDURE'), functions=routines('FUNCTION');
const views=[]; // No VIEW definition is emitted unless a CREATE VIEW statement exists.
const relationships=tables.flatMap(t=>t.foreignKeys.map(f=>({name:f.name,fromTable:t.name,fromColumns:f.columns,toTable:f.referencesTable,toColumns:f.referencesColumns,onDelete:f.onDelete,onUpdate:f.onUpdate,definition:f.definition,cardinality:f.columns.length===1&&t.uniqueKeys.some(k=>k.columns.length===1&&k.columns[0]===f.columns[0])?'1:1':'1:N',confirmed:true})));
const manyToMany=[];
for(const t of tables){const fkCols=[...new Set(t.foreignKeys.flatMap(f=>f.columns))].sort(),pkCols=[...t.primaryKey].sort();if(t.foreignKeys.length<2||fkCols.length!==pkCols.length||fkCols.some((c,i)=>c!==pkCols[i]))continue;const refs=[];for(const f of t.foreignKeys){if(!refs.some(x=>x.table===f.referencesTable))refs.push({table:f.referencesTable,columns:f.referencesColumns});}for(let i=0;i<refs.length;i++)for(let j=i+1;j<refs.length;j++){const a=refs[i],b=refs[j];if(a.table===t.name||b.table===t.name)continue;manyToMany.push({table:t.name,tableA:a.table,columnsA:a.columns,tableB:b.table,columnsB:b.columns,viaColumns:fkCols,inferred:true,explanation:`La clave primaria de ${t.name} está formada por columnas que también son llaves foráneas hacia ${a.table} y ${b.table}; esto identifica una tabla de vínculo entre ambos lados.`});}}
const tableSet=new Set(tables.map(t=>t.name));
const unresolved=relationships.filter(r=>!tableSet.has(r.toTable));
const dbMeta={name:db,source:'Respaldo14.sql',engine:[...new Set(tables.map(t=>t.engine).filter(Boolean))],tableCount:tables.length,columnCount:tables.reduce((a,t)=>a+t.columns.length,0),relationshipCount:relationships.length,primaryKeyCount:tables.filter(t=>t.primaryKey.length).length,foreignKeyCount:relationships.length,manyToMany,viewCount:views.length,procedureCount:procedures.length,functionCount:functions.length,triggerCount:triggers.length,generatedAt:new Date().toISOString().slice(0,10),notes:unresolved.map(r=>`La FK ${r.name} refiere a tabla no definida en el respaldo: ${r.toTable}`)};
fs.mkdirSync(output,{recursive:true});
for(const [file,data] of Object.entries({'database.json':dbMeta,'tables.json':tables,'relationships.json':relationships,'components.json':{views,procedures,functions,triggers,indexes:tables.flatMap(t=>t.indexes.map(i=>({...i,table:t.name}))),constraints:tables.flatMap(t=>[...(t.primaryKey.length?[{name:'PRIMARY',type:'PRIMARY KEY',table:t.name,columns:t.primaryKey,definition:t.primaryKeyDefinition}]:[]),...t.checks.map(x=>({...x,type:'CHECK',table:t.name})),...t.foreignKeys.map(f=>({...f,type:'FOREIGN KEY',table:t.name})),...t.uniqueKeys.map(k=>({...k,type:'UNIQUE',table:t.name}))])}}))fs.writeFileSync(path.join(output,file),JSON.stringify(data,null,2)+'\n');
console.log(`Estructura extraída: ${tables.length} tablas, ${dbMeta.columnCount} columnas, ${relationships.length} FK, ${views.length} vistas, ${procedures.length} procedimientos, ${functions.length} funciones, ${triggers.length} triggers.`);
