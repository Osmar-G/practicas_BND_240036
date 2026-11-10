// Tiny dependency-free XLSX writer. The workbook contains metadata only.
const originalExport = exportAs;
exportAs = function (kind) {
  if (kind !== 'xlsx') return originalExport(kind);
  dlg.close();
  download(makeWorkbook(schema), filename('xlsx'));
};

function makeWorkbook(model) {
  const columns = [['Table', 'Column', 'MySQL type', 'Type explanation', 'Nullable', 'Default', 'Primary key', 'Foreign key', 'Indexes', 'Auto increment', 'Description', 'Meaning']];
  for (const t of model.tables) for (const c of t.columns) columns.push([
    t.name, c.name, c.type, c.typeHelp, c.nullable ? 'Yes' : 'No', c.default || '', c.primary ? 'Yes' : 'No',
    c.foreign.map(f => `${f.target}.${f.targetColumns.join('+')}`).join('; '), c.indexes.join('; '), c.autoIncrement ? 'Yes' : 'No', c.label, c.meaning
  ]);
  const relations = [['Source table', 'Source column', 'Target table', 'Target column', 'Cardinality', 'ON DELETE', 'ON UPDATE'], ...model.relations.map(r => [r.source, r.columns.join('+'), r.target, r.targetColumns.join('+'), r.cardinality, r.onDelete, r.onUpdate])];
  const xml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const col = n => { let x=''; for(n++;n;n=Math.floor((n-1)/26)) x=String.fromCharCode(65+(n-1)%26)+x; return x; };
  const sheet = rows => `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>`<c r="${col(ci)}${ri+1}" t="inlineStr"><is><t>${xml(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${col(rows[0].length-1)}${rows.length}"/></worksheet>`;
  const files = {
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Columns" sheetId="1" r:id="rId1"/><sheet name="Relations" sheetId="2" r:id="rId2"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet(columns), 'xl/worksheets/sheet2.xml': sheet(relations)
  };
  return zip(files);
}
function zip(files) {
  const enc=new TextEncoder(), locals=[], centrals=[]; let offset=0;
  const u16=n=>[n&255,(n>>>8)&255], u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
  for(const [name,value] of Object.entries(files)){
    const n=enc.encode(name),d=enc.encode(value),crc=crc32(d);
    const local=[0x50,0x4b,3,4,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...n];
    locals.push(new Uint8Array(local),d);
    centrals.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...n]));
    offset+=local.length+d.length;
  }
  const size=centrals.reduce((a,b)=>a+b.length,0), end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(centrals.length),...u16(centrals.length),...u32(size),...u32(offset),...u16(0)]);
  return new Blob([...locals,...centrals,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
