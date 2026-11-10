// Rebuild the Archify ERD reference from the same read-only MySQL dump parser.
const fs=require('node:fs'),path=require('node:path');
const {parseSQL}=require('./server');
const appDir=__dirname,repoRoot=path.resolve(appDir,'..','..','..');
const sql=fs.readFileSync(path.join(repoRoot,'Practica3','backups','12Respaldo.sql'),'utf8');
const model=parseSQL(sql);
const outDir=path.join(repoRoot,'.archify','erd-db-test-7b-20261026-2241');
const groups={
  accounts:['db_users','tb_people','tb_user_addresses','tbd_address_components','tbd_user_payment_methods','tbd_users_wishlist_products'],
  catalog:['tb_products','tbc_categories','tbc_payment_methods_types','tbd_products_categories','tbd_products_users'],
  transactions:['tb_buyer_orders','tb_carts','tbd_carts_items','tbd_order_items'],
  audit:['tb_logs']
};
const placement=new Map();
for(const [tag,names] of Object.entries(groups))names.forEach((name,row)=>placement.set(name,{tag,row,col:Object.keys(groups).indexOf(tag)}));
const minimumWidths={tb_buyer_orders:679,tb_logs:407,tb_people:399,tb_user_addresses:277,tbd_address_components:269,tbd_products_users:414,tbd_user_payment_methods:283};
const entities=model.tables.map(t=>{
  const pos=placement.get(t.name),unique=new Set(t.indexes.filter(i=>i.unique).flatMap(i=>i.columns));
  return {id:t.name,label:t.name,tag:pos.tag,row:pos.row,col:pos.col,...(minimumWidths[t.name]?{width:minimumWidths[t.name]}:{}),attributes:t.columns.map(c=>{
    const roles=[];if(c.primary)roles.push('pk');if(c.foreign.length)roles.push('fk');if(unique.has(c.name))roles.push('uk');
    const a={name:c.name,type:c.type};if(roles.length)a.key=roles.length===1?roles[0]:roles;
    if(c.foreign.length){const f=c.foreign[0],rel=t.foreignKeys.find(x=>x.columns.includes(c.name)&&x.target===f.target);const index=rel.columns.indexOf(c.name);a.references=`${f.target}.${rel.targetColumns[index]}`;}
    return a;
  })};
});
const relationships=model.relations.filter(r=>r.source!==r.target).map((r,i)=>{
  const table=model.tables.find(t=>t.name===r.source),pk=new Set(table.primaryKey||[]),identifying=r.columns.every(c=>pk.has(c));
  const rel={id:`rel_${i+1}`,from:r.source,to:r.target,fromCardinality:r.fromCardinality,toCardinality:r.toCardinality,fromOptional:r.fromOptional,toOptional:r.toOptional,identifying};
  if(!identifying)rel.variant='dashed';
  return rel;
});
const selfReferences=model.relations.filter(r=>r.source===r.target);
const candidate={schema_version:1,diagram_type:'erd',meta:{title:`Modelo entidad-relación · ${model.database}`,locale:'es',output:'.archify/erd-db-test-7b-20261026-2241/erd-db-test-7b.html',quality_profile:'standard',legend:{mode:'all',entries:{pk:{label:'Clave primaria'},fk:{label:'Clave foránea'},uk:{label:'Único'},one:{label:'Uno'},many:{label:'Varios'},optional:{label:'Opcional'}}}},layout:{mode:'grid',gapX:22,gapY:22,entityW:254,rowH:14},entities,relationships,cards:selfReferences.length?[{dot:'amber',title:'Relaciones autorreferenciales',items:selfReferences.map(r=>`${r.name}: ${r.source}.${r.columns.join(', ')} referencia a ${r.target}.${r.targetColumns.join(', ')}. La entidad conserva la relación; este diagrama no la dibuja como conector hacia sí misma.`)}]:[]};
fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'candidate.erd.json'),JSON.stringify(candidate,null,2));
console.log(JSON.stringify({output:path.join(outDir,'candidate.erd.json'),database:model.database,entities:entities.length,attributes:entities.reduce((n,e)=>n+e.attributes.length,0),relationships:relationships.length,domains:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length]))},null,2));
