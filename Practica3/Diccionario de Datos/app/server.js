// Local, read-only SQL dictionary. The dump is parsed as text and never executed.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const DEFAULT_SQL = path.resolve(ROOT, '..', '..', 'backups', '12Respaldo.sql');
const PORT = Number(process.env.PORT || 4173);

function splitTop(s, separator = ',') {
  const out=[]; let start=0, depth=0, quote='', esc=false;
  for(let i=0;i<s.length;i++) { const c=s[i];
    if(quote) { if(esc){esc=false;continue} if(c==='\\'){esc=true;continue} if(c===quote){if(s[i+1]===quote){i++;continue}quote=''} continue }
    if(c==='\''||c==='"'||c==='`'){quote=c;continue}
    if(c==='(')depth++; else if(c===')')depth--;
    else if(c===separator&&depth===0){out.push(s.slice(start,i).trim());start=i+1}
  } out.push(s.slice(start).trim()); return out.filter(Boolean);
}
function unquote(s){return s?.replace(/^`|`$/g,'').replace(/``/g,'`')||''}
function statements(sql) {
  const out=[]; let start=0, quote='', esc=false, lineComment=false, blockComment=false;
  for(let i=0;i<sql.length;i++) { const c=sql[i], n=sql[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++}continue}
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote){if(sql[i+1]===quote){i++;continue}quote=''}continue}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue}
    if(c==='-'&&n==='-'&&(i+2>=sql.length||/\s/.test(sql[i+2]))){lineComment=true;i++;continue}
    if(c==='#'){lineComment=true;continue}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue}
    if(c===';'){out.push(sql.slice(start,i).trim());start=i+1}
  } if(sql.slice(start).trim())out.push(sql.slice(start).trim()); return out;
}
function statementEnd(sql,start){let quote='',esc=false,line=false,block=false;for(let i=start;i<sql.length;i++){const c=sql[i],n=sql[i+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++}continue}if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote){if(sql[i+1]===quote){i++;continue}quote=''}continue}if(c==="'"||c==='"'||c==='`'){quote=c;continue}if(c==='-'&&n==='-'&&(i+2>=sql.length||/\s/.test(sql[i+2]))){line=true;i++;continue}if(c==='#'){line=true;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if(c===';')return i}return sql.length}
function typeHelp(type) {
 const t=type.toLowerCase();
 if(/^enum|^set/.test(t))return 'Solo admite las opciones enumeradas en el tipo.';
 const n=t.match(/\((\d+)(?:\s*,\s*(\d+))?\)/);
 if(/^(tinyint|smallint|mediumint|int|integer|bigint)/.test(t))return `Número entero${/unsigned/.test(t)?' sin valores negativos':''}${n?`, con ancho indicado ${n[1]}`:''}.`;
 if(/^(decimal|numeric|float|double|real)/.test(t))return n?`Número con hasta ${n[1]} dígitos${n[2]?`, de los cuales ${n[2]} son decimales`:''}.`:'Número que puede incluir decimales.';
 if(/^(varchar|char|varbinary|binary)/.test(t))return `${/binary/.test(t)?'Dato binario':'Texto'}${n?` de hasta ${n[1]} ${/binary/.test(t)?'bytes':'caracteres'}`:''}.`;
 if(/^text|blob/.test(t))return 'Texto o contenido de mayor tamaño.';
 if(/^date/.test(t))return 'Fecha, hora o ambos, según el tipo.';
 if(/^bit/.test(t))return 'Valor almacenado como bits; puede representar indicadores.';
 if(/^bool|^boolean/.test(t))return 'Indicador lógico (verdadero o falso en el uso habitual).';
 return 'Tipo MySQL; consulta la definición técnica para sus características.';
}
function exampleFor(type){const t=type.toLowerCase();const e=t.match(/^(enum|set)\((.*)\)/);if(e){const first=(e[2].match(/'((?:[^']|'')*)'/)||[])[1];return first!==undefined?`'${first.replace(/''/g,"'")}'`:'opción permitida'}if(/^bit/.test(t))return "b'1' (ilustrativo)";if(/^bool|^boolean|^tinyint\(1\)/.test(t))return '1 (ilustrativo)';if(/^decimal|^numeric|^float|^double|^real/.test(t))return '123.45 (ilustrativo)';if(/^date$/.test(t))return '2026-01-15 (ilustrativo)';if(/^datetime|^timestamp/.test(t))return '2026-01-15 10:30:00 (ilustrativo)';if(/^time/.test(t))return '10:30:00 (ilustrativo)';if(/^int|^integer|^smallint|^mediumint|^bigint|^tinyint/.test(t))return '42 (ilustrativo)';if(/^json/.test(t))return '{"ejemplo":true} (ilustrativo)';if(/^char/.test(t))return "'AB' (ilustrativo)";if(/^varchar|^text/.test(t))return "'Texto de ejemplo' (ilustrativo)";if(/blob|binary/.test(t))return '[contenido binario de ejemplo]';return 'Valor compatible con el tipo (ilustrativo)'}
function describe(name,type) {
 const n=name.toLowerCase();
 const known={id:['Identificador','Número que distingue este registro.'],email:['Correo electrónico','Dirección de correo asociada a una cuenta.'],nick:['Nombre de usuario','Alias usado para identificar a la persona.'],password:['Credencial','Dato de autenticación. El respaldo contiene valores, pero esta aplicación nunca los muestra ni los exporta.'],creation_date:['Fecha de creación','Momento en que se creó el registro.'],last_update:['Última actualización','Momento de la última modificación registrada.'],last_login:['Último acceso','Momento del acceso más reciente, si está disponible.'],status:['Estado','Indicador de estado definido por el sistema; el tipo BIT(1) admite un bit.'],user_id:['Usuario relacionado','Identificador de la cuenta de usuario asociada.'],person_id:['Persona relacionada','Identificador del perfil de persona asociado.'],product_id:['Producto relacionado','Identificador del producto asociado.'],category_id:['Categoría relacionada','Identificador de la categoría asociada.'],price:['Precio','Importe asociado al registro.'],name:['Nombre','Nombre descriptivo del elemento.'],description:['Descripción','Texto que describe el elemento.'],quantity:['Cantidad','Número de unidades o elementos.'],operation_date:['Fecha de operación','Momento en que ocurrió la operación.'],table_name:['Tabla afectada','Nombre de la tabla relacionada con el evento registrado.'],table_operation:['Operación','Tipo de acción registrada sobre los datos.'],seller_id:['Vendedor relacionado','Identificador del vendedor asociado al pedido.'],subtotal:['Subtotal','Importe subtotal indicado para el pedido o sus productos.'],shipping_cost:['Costo de envío','Importe del envío del pedido.'],fulfillment_status:['Estado de preparación y entrega','Etapa del pedido, limitada a las opciones ENUM declaradas.'],sku:['Código SKU','Código utilizado para distinguir un producto en el catálogo.'],current_price:['Precio actual','Precio vigente del producto.'],current_stock:['Existencias actuales','Cantidad disponible del producto indicada en inventario.'],record_id:['Registro afectado','Identificador del registro mencionado en el evento de auditoría.'],db_user:['Usuario de base de datos','Cuenta MySQL asociada a la operación registrada.'],operation_status:['Resultado de la operación','Indicador del resultado guardado por la auditoría.'],courtesy_title:['Tratamiento','Título de cortesía o tratamiento de la persona.'],given_names:['Nombre(s)','Nombre o nombres propios de la persona.'],family_names:['Apellidos','Apellidos de la persona.'],birth_date:['Fecha de nacimiento','Fecha de nacimiento indicada para la persona.'],gender:['Género','Opción de género seleccionada entre los valores ENUM.'],country_code:['Código de país','Código de dos caracteres asociado al país.'],phone:['Teléfono','Número telefónico guardado para el perfil.'],address_label:['Etiqueta de dirección','Nombre corto para reconocer la dirección, por ejemplo, una etiqueta personal.'],recipient_name:['Nombre de quien recibe','Persona indicada para recibir una entrega en esa dirección.'],recipient_phone:['Teléfono de contacto','Teléfono indicado para contactar a quien recibe.'],delivery_instructions:['Instrucciones de entrega','Indicaciones adicionales para realizar una entrega.'],latitude:['Latitud','Coordenada geográfica norte-sur de la dirección.'],longitude:['Longitud','Coordenada geográfica este-oeste de la dirección.'],is_default:['Dirección o método predeterminado','Indicador de si este elemento está marcado como predeterminado.'],sup_id_category:['Categoría superior','Identificador de una categoría superior, según la relación declarada.'],code:['Código','Clave textual corta del tipo de método de pago.'],address_id:['Dirección relacionada','Identificador de la dirección a la que pertenece este componente.'],value:['Valor del componente','Contenido guardado para este componente de la dirección.'],component_type:['Tipo de componente','Etiqueta que indica qué clase de componente de dirección representa.'],address_sup_id:['Componente superior','Identificador del componente de dirección superior, según la relación declarada.'],cart_id:['Carrito relacionado','Identificador del carrito que contiene el artículo.'],provider_id:['Proveedor relacionado','Identificador del proveedor del producto en este registro.'],seller_order_id:['Pedido del vendedor','Identificador del pedido del vendedor al que pertenece el artículo.'],product_name:['Nombre del producto','Nombre de producto guardado en el detalle del pedido.'],unit_price:['Precio por unidad','Importe de una unidad del producto en el artículo del pedido.'],type_ownership:['Tipo de participación','Función asignada al usuario frente al producto, limitada a las opciones ENUM.'],avalaible_date:['Fecha de disponibilidad','Fecha y hora asociada a la disponibilidad indicada para el producto.'],payment_method_type_id:['Tipo de método de pago','Identificador del tipo de método de pago asociado.'],provider:['Proveedor de pago','Nombre del proveedor externo relacionado con el método de pago.'],provider_method_ref:['Referencia del proveedor','Referencia del método almacenada para identificarlo ante el proveedor.'],label:['Etiqueta','Nombre breve usado para reconocer este método de pago.'],last_four:['Últimos cuatro caracteres','Cuatro caracteres finales que pueden ayudar a reconocer un método; no equivalen al número completo.'],is_default:['Método predeterminado','Indicador de si el método está marcado como predeterminado.']};
 if(known[n])return {label:known[n][0],meaning:known[n][1],inferred:true};
 const label=n.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 return {label,meaning:`Dato «${label}»; el esquema no incluye comentario que precise su significado.`,inferred:true};
}
function parseSQL(sql, filename='12Respaldo.sql') {
 const warnings=[], tables=[], objects={views:[],triggers:[],routines:[]};
 const db=(sql.match(/\bCREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/i)||sql.match(/\bUSE\s+`([^`]+)`/i)||[])[1]||'No identificada';
 // Expand versioned MySQL comments because dumps commonly wrap actual DDL in them.
 const clean=sql.replace(/\/\*!\d*\s*([\s\S]*?)\*\//g,'$1');
 const ddl=[...clean.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(`(?:``|[^`])+`|[\w$]+)\s*\(([\s\S]*?)\)\s*(?:ENGINE\s*=|;)/gi)];
 for(const m of ddl){
  const name=unquote(m[1]), body=m[2], table={name,columns:[],indexes:[],foreignKeys:[],checks:[],comment:'',rows:null};
  const rawTableToken=m[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),rawCreate=new RegExp('CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?'+rawTableToken+'\\s*\\(','i'),rawStart=sql.search(rawCreate);
  table.createSql=rawStart>=0?sql.slice(rawStart,statementEnd(sql,rawStart)).trim():clean.slice(m.index,statementEnd(clean,m.index)).trim();
  for(const part of splitTop(body)){
   let x;
   if((x=part.match(/^(?:CONSTRAINT\s+(`[^`]+`|[\w$]+)\s+)?PRIMARY\s+KEY\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/i))){table.primaryKey=splitTop(x[2]).map(v=>unquote(v.replace(/\s+(ASC|DESC)$/i,'')));continue}
   if((x=part.match(/^(?:CONSTRAINT\s+(`[^`]+`|[\w$]+)\s+)?(?:UNIQUE\s+(?:KEY|INDEX)|UNIQUE)\s*(`[^`]+`|[\w$]+)?\s*\(([^)]+)\)/i))){table.indexes.push({name:unquote(x[2])||unquote(x[1])||'UNIQUE',columns:splitTop(x[3]).map(v=>unquote(v.replace(/\s+\([^)]*\)/,''))),unique:true});continue}
   if((x=part.match(/^(?:KEY|INDEX)\s+(`[^`]+`|[\w$]+)\s*\(([^)]+)\)/i))){table.indexes.push({name:unquote(x[1]),columns:splitTop(x[2]).map(v=>unquote(v.replace(/\s+\([^)]*\)/,''))),unique:false});continue}
   if((x=part.match(/^(?:CONSTRAINT\s+(`[^`]+`|[\w$]+)\s+)?FOREIGN\s+KEY\s*(?:`([^`]+)`\s*)?\(([^)]+)\)\s+REFERENCES\s+(`[^`]+`|[\w$]+)\s*\(([^)]+)\)([\s\S]*)/i))){table.foreignKeys.push({name:unquote(x[1])||x[2]||'FK',columns:splitTop(x[3]).map(unquote),target:unquote(x[4]),targetColumns:splitTop(x[5]).map(unquote),onDelete:(x[6].match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT)/i)||[])[1]||'NO ACTION (predeterminado)',onUpdate:(x[6].match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT)/i)||[])[1]||'NO ACTION (predeterminado)'});continue}
   if((x=part.match(/^(?:CONSTRAINT\s+(`[^`]+`|[\w$]+)\s+)?CHECK\s*\(([\s\S]*)\)/i))){table.checks.push({name:unquote(x[1])||'CHECK',expression:x[2]});continue}
   if((x=part.match(/^(`(?:``|[^`])+`|[\w$]+)\s+([\w]+(?:\s*\([^)]*\))?(?:\s+unsigned)?(?:\s+zerofill)?(?:\s+binary)?)/i))){
    const cname=unquote(x[1]), rest=part.slice(x[0].length), nullable=!/\bNOT\s+NULL\b/i.test(rest), def=(rest.match(/\bDEFAULT\s+((?:CURRENT_TIMESTAMP(?:\(\d*\))?)|(?:NULL)|(?:b?'(?:[^']|'')*')|(?:"[^"]*")|(?:[-+]?\d+(?:\.\d+)?))/i)||[])[1]||null;
    const col={name:cname,type:x[2].replace(/\s+/g,' ').trim(),nullable,default:def,autoIncrement:/\bAUTO_INCREMENT\b/i.test(rest),comment:(rest.match(/\bCOMMENT\s+'((?:[^']|'')*)'/i)||[])[1]?.replace(/''/g,"'")||'',onUpdate:(rest.match(/\bON\s+UPDATE\s+(CURRENT_TIMESTAMP(?:\(\d*\))?)/i)||[])[1]||null};
    const desc=describe(cname,col.type);Object.assign(col,desc,{typeHelp:typeHelp(col.type),example:exampleFor(col.type)});table.columns.push(col);continue;
   }
   if(part.trim())warnings.push(`No se interpretó una definición de «${name}»: ${part.slice(0,90)}`);
  }
  const opts=clean.slice(m.index+m[0].length, m.index+m[0].length+250).match(/COMMENT\s*=\s*'([^']*)'/i);if(opts)table.comment=opts[1];
  tables.push(table);
 }
 if(!ddl.length)warnings.push('No se encontraron definiciones CREATE TABLE reconocibles.');
 // Count inserted tuples without retaining, displaying, or exporting their values.
 const inserts=[...clean.matchAll(/INSERT\s+INTO\s+(`[^`]+`|[\w$]+)(?:\s*\([^;]*?\))?\s+VALUES\s*/gi)];
 for(const m of inserts){
  const end=statementEnd(clean,m.index+m[0].length);
  const tail=clean.slice(m.index+m[0].length,end);let count=0, depth=0, quote='',esc=false;
  for(let j=0;j<tail.length;j++){const c=tail[j];if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote){if(tail[j+1]===quote){j++;continue}quote=''}continue}if(c==="'"||c==='"'){quote=c;continue}if(c==='('){if(depth===0)count++;depth++}else if(c===')')depth--}
  const table=tables.find(t=>t.name===unquote(m[1]));if(table)table.rows=(table.rows||0)+count;
 }
 const triggerRe=/CREATE\s+(?:DEFINER\s*=\s*[^\s]+\s+)?TRIGGER\s+`([^`]+)`\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+`([^`]+)`/gi;
 for(const m of clean.matchAll(triggerRe)){const end=clean.indexOf('END',m.index+m[0].length),body=end<0?'':clean.slice(m.index+m[0].length,end);const writes=[...body.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(`[^`]+`|[\w$]+)/gi)].map(x=>({operation:x[1].split(/\s+/)[0].toUpperCase(),table:unquote(x[2])}));objects.triggers.push({name:m[1],timing:m[2],event:m[3],table:m[4],writes});}
 for(const m of clean.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+`([^`]+)`/gi)){const end=statementEnd(clean,m.index),definition=clean.slice(m.index,end);const dependencies=[...definition.matchAll(/\b(?:FROM|JOIN)\s+(`[^`]+`|[\w$]+)/gi)].map(x=>unquote(x[1]));const columns=[...definition.matchAll(/\bAS\s+`([^`]+)`/gi)].map(x=>x[1]);objects.views.push({name:m[1],dependencies:[...new Set(dependencies)],columns});}
 for(const m of clean.matchAll(/CREATE\s+(?:PROCEDURE|FUNCTION)\s+`([^`]+)`/gi))objects.routines.push({name:m[1],kind:/CREATE\s+FUNCTION/i.test(m[0])?'Función':'Procedimiento'});
 // Restrict relation output to declared foreign keys.
 const relations=tables.flatMap(t=>t.foreignKeys.map(f=>{const uniqueSource=(t.primaryKey||[]).length===f.columns.length&&f.columns.every(c=>t.primaryKey.includes(c))||t.indexes.some(i=>i.unique&&i.columns.length===f.columns.length&&f.columns.every(c=>i.columns.includes(c)));const optional=f.columns.some(c=>t.columns.find(x=>x.name===c)?.nullable);return {source:t.name,columns:f.columns,target:f.target,targetColumns:f.targetColumns,name:f.name,onDelete:f.onDelete,onUpdate:f.onUpdate,optional,cardinality:uniqueSource?'uno a uno desde el origen':'muchos a uno desde el origen',fromCardinality:uniqueSource?'one':'many',toCardinality:'one',fromOptional:true,toOptional:optional};}));
 // Mark key roles and indexes on each column.
 for(const t of tables)for(const c of t.columns){c.primary=(t.primaryKey||[]).includes(c.name);c.foreign=relations.filter(r=>r.source===t.name&&r.columns.includes(c.name));c.indexes=t.indexes.filter(x=>x.columns.includes(c.name)).map(x=>x.name);}
 const insertsTotal=tables.reduce((n,t)=>n+(t.rows||0),0);
 return {database:db,source:filename,generatedAt:new Date().toISOString(),tables,relations,objects,warnings,summary:{tables:tables.length,columns:tables.reduce((n,t)=>n+t.columns.length,0),primaryKeys:tables.filter(t=>t.primaryKey?.length).length,foreignKeys:relations.length,relations:relations.length,views:objects.views.length,triggers:objects.triggers.length,routines:objects.routines.length,rowsInDump:insertsTotal}};
}

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&u.pathname==='/api/schema'){try{const data=parseSQL(fs.readFileSync(DEFAULT_SQL,'utf8'));res.writeHead(200,{'content-type':mime['.json']});res.end(JSON.stringify(data));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e)}));}return}
 if(req.method==='POST'&&u.pathname==='/api/analyze'){
  let size=0,buf=[];req.on('data',c=>{size+=c.length;if(size>32*1024*1024){res.writeHead(413);res.end('Archivo mayor a 32 MB');req.destroy()}else buf.push(c)});
  req.on('end',()=>{try{const data=parseSQL(Buffer.concat(buf).toString('utf8'),decodeURIComponent(req.headers['x-filename']||'archivo.sql'));res.writeHead(200,{'content-type':mime['.json']});res.end(JSON.stringify(data));}catch(e){res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:'No fue posible analizar el SQL: '+e.message}));}});return;
 }
 const file=path.join(ROOT,'public',u.pathname==='/'?'index.html':path.basename(u.pathname));
 if(req.method==='GET'&&fs.existsSync(file)){res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);return}
 res.writeHead(404);res.end('No encontrado');
});
if(require.main===module)server.listen(PORT,'127.0.0.1',()=>console.log(`Diccionario local disponible en http://127.0.0.1:${PORT}`));
module.exports={parseSQL};
