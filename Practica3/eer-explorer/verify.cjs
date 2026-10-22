const fs = require('node:fs');
global.window = global;
require('./parser.js');
const file = process.argv[2] || require('node:path').resolve(__dirname, '../backups/10Respaldo.sql');
const schema = SQLSchema.parse(fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify({database:schema.database,tables:schema.tables.map(t=>({name:t.name,columns:t.columns.length,primaryKey:t.primaryKey,foreignKeys:t.foreignKeys.length,backupRows:t.count})),views:schema.views.length,triggers:schema.triggers.length,routines:schema.routines.map(x=>`${x.kind} ${x.name}`),relationships:schema.relationshipCount,backupRowsTotal:schema.sourceRows,warnings:schema.warnings},null,2));
