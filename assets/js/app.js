/* =========================================================
   ESQUEMA·16 — lógica del explorador estático
   Fuente: data/*.json generados por scripts/refresh_all.js
   ========================================================= */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmt = value => Number(value || 0).toLocaleString('es-MX');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const safeId = value => String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
const pretty = value => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();

const PALETTE = ['#ed6541', '#0f9d90', '#c8872f', '#7a63a8', '#4c7fa8', '#bf5c78', '#6f9b4f', '#a67b4e'];

const TABLE_COPY = {
  db_users: ['Cuentas', 'Registro central de cuentas de acceso. Sus identificadores son referenciados por casi todas las entidades del modelo.'],
  tb_people: ['Personas', 'Datos personales asociados a una cuenta. Cada fila complementa al usuario con información de identidad y contacto.'],
  tb_user_addresses: ['Direcciones', 'Direcciones guardadas por usuario. Sirven como destino de envíos y como referencia jerárquica de componentes de dirección.'],
  tbd_address_components: ['Componentes de dirección', 'Partes que componen una dirección (calle, ciudad, código postal, etc.). Permite representar componentespadre e hijo dentro de una misma dirección.'],
  tb_products: ['Catálogo', 'Productos disponibles en la tienda. Aquí se guardan los datos descriptivos, precios, existencias y estado de cada artículo.'],
  tbc_categories: ['Categorías', 'Clasificación del catálogo. Una categoría puede tener una categoría superior, lo que permite construir un árbol de clasificación.'],
  tbd_products_categories: ['Productos por categoría', 'Tabla de vínculo entre productos y categorías. Define qué categorías etiquetan cada producto.'],
  tbd_products_users: ['Productos por usuario', 'Relación entre un usuario y un producto. Representa la oferta de un producto por parte de un usuario/proveedor.'],
  tbd_products_users_providers: ['Proveedores de producto', 'Detalle de proveedores asociados a la combinación producto-usuario. Amplía la relación comercial del catálogo.'],
  tbd_users_wishlist_products: ['Lista de deseos', 'Vínculo entre usuarios y productos que han marcado como favoritos o deseados.'],
  tb_carts: ['Carritos', 'Carritos de compra creados por los usuarios. Cada carrito agrupa artículos antes de convertirse en pedido.'],
  tbd_carts_items: ['Artículos del carrito', 'Detalle de los productos incluidos en cada carrito, con cantidades y referencia al proveedor del artículo.'],
  tb_buyer_orders: ['Pedidos', 'Órdenes de compra emitidas por compradores. Conecta al vendedor, al carrito de origen y al estado general de la operación.'],
  tbd_order_items: ['Artículos del pedido', 'Líneas de detalle de cada pedido. Registra qué producto se vendió, en qué cantidad y bajo qué condiciones.'],
  tb_payments: ['Pagos', 'Pagos asociados a una orden de compra. Guarda montos, estado, referencia del proveedor y método utilizado.'],
  tb_payment_methods: ['Métodos de pago', 'Métodos de pago configurados en el sistema y relacionados con un tipo y, cuando aplica, con un usuario.'],
  tbc_payment_methods_types: ['Tipos de método de pago', 'Catálogo de tipos de pago disponibles, por ejemplo tarjeta, transferencia, efectivo o cupón.'],
  tb_payment_transactions: ['Transacciones de pago', 'Movimientos técnicos o financieros registrados para un pago. Permite seguir intentos, aprobaciones y cambios de estado.'],
  tbd_user_payment_methods: ['Métodos por usuario', 'Métodos de pago guardados por cada usuario, con etiqueta y referencia al tipo de método.'],
  tb_shipments: ['Envíos', 'Envíos vinculados a un pedido y a una dirección. Registra seguimiento, estado y fechas de entrega.'],
  tb_returns: ['Devoluciones', 'Solicitudes de devolución de artículos de un pedido. Conecta al usuario, al pedido y al artículo devuelto.'],
  tbd_return_items: ['Artículos devueltos', 'Detalle de los artículos que forman parte de una devolución y su relación con la línea original del pedido.'],
  tb_cancellations: ['Cancelaciones', 'Cancelaciones registradas sobre pedidos. Pueden vincularse al usuario que las solicita y a los artículos afectados.'],
  tbd_cancellation_items: ['Artículos cancelados', 'Detalle de las líneas de pedido canceladas dentro de una cancelación.'],
  tb_refunds: ['Reembolsos', 'Reembolsos derivados de cancelaciones, devoluciones o pagos. Registra montos y estado del proceso.'],
  tb_logs: ['Bitácora', 'Registro automático de operaciones realizadas sobre las tablas. Es la base de las vistas de trazabilidad del respaldo.'],
};

const COLUMN_RULES = [
  [/^(id|.*_id|.*id)$/i, 'Identificador usado para reconocer o referenciar un registro dentro del modelo.'],
  [/email|correo/i, 'Dirección de correo asociada al registro; funciona como dato de contacto y, cuando es única, como forma de identificación.'],
  [/password|passwd|secret|hash|salt|token/i, 'Dato de autenticación o seguridad. La definición del campo está disponible, pero el explorador no muestra valores almacenados.'],
  [/nick|username|user_name/i, 'Nombre corto o alias con el que se identifica a una cuenta dentro del sistema.'],
  [/first_name|last_name|full_name|nombre|name|title|label/i, 'Texto descriptivo que nombra o etiqueta al elemento representado por la fila.'],
  [/description|descripcion|detail|detalle|notes?|remark/i, 'Texto libre que amplía la información del registro o describe una observación.'],
  [/price|precio|amount|monto|total|cost|subtotal|tax|balance/i, 'Cantidad económica. El tipo numérico permite conservar la precisión definida en el esquema.'],
  [/quantity|cantidad|stock|count|units/i, 'Número de unidades o elementos relacionados con este registro.'],
  [/date|time|created|updated|modified|login|operation/i, 'Fecha o momento relevante para el registro. El tipo define si incluye hora.'],
  [/status|state|active|enabled|is_|has_|flag/i, 'Estado o indicador lógico del registro. Sus opciones dependen del tipo y del valor predeterminado.'],
  [/address|street|city|state|zip|postal|country|component/i, 'Parte de la información de ubicación o dirección guardada para el registro.'],
  [/phone|telephone|mobile/i, 'Número de contacto telefónico asociado al registro.'],
  [/image|photo|picture|url|link|reference/i, 'Ruta, enlace o referencia externa vinculada al elemento.'],
  [/category|categor/i, 'Identifica o describe una categoría dentro de la clasificación del catálogo.'],
  [/provider|supplier|seller|buyer|user/i, 'Identifica al usuario, comprador, vendedor o proveedor relacionado con la operación.'],
  [/tracking|shipment|delivery/i, 'Dato de seguimiento o entrega asociado al envío del pedido.'],
  [/operation_status|success/i, 'Indica si la operación registrada se completó correctamente.'],
];

const state = {
  meta: null,
  tables: [],
  relationships: [],
  components: null,
  backup: null,
  stats: null,
  source: 'Respaldo16.sql',
  currentComponent: 'views',
  openDict: new Set(),
  selectedTable: null,
  diagram: {
    positions: new Map(),
    scale: 1,
    tx: 0,
    ty: 0,
    selected: '',
    filter: 'all',
    query: '',
    hidden: false,
    showColumns: true,
    visible: [],
  },
};

/* ---------- Carga ---------- */
async function loadJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) throw new Error(`No se pudo cargar ${url} (HTTP ${response.status})`);
  if (!contentType.toLowerCase().includes('json')) throw new Error(`${url} no devolvió JSON. Revisa las rutas relativas.`);
  try { return await response.json(); } catch { throw new Error(`${url} contiene JSON inválido.`); }
}

async function boot() {
  try {
    const [structure, components, backup, stats] = await Promise.all([
      loadJson('data/structure.json'),
      loadJson('data/components.json'),
      loadJson('data/backup-summary.json'),
      loadJson('data/estadisticas.json'),
    ]);
    state.tables = Array.isArray(structure.tables) ? structure.tables : structure.tables?.value || [];
    state.relationships = Array.isArray(structure.relationships) ? structure.relationships : structure.relationships?.value || [];
    state.meta = structure.database || {};
    state.components = components || {};
    state.backup = backup || {};
    state.stats = stats || {};
    state.source = backup.source || state.meta.source || 'Respaldo16.sql';
  } catch (error) {
    const content = $('.content');
    if (content) content.innerHTML = `<div class="empty-state"><b>No se pudieron cargar los metadatos.</b><br>${esc(error.message)}</div>`;
    return;
  }

  applySourceLabels();
  renderStats();
  renderCharts();
  renderDictionary();
  renderTables();
  renderRelationships();
  renderComponents();
  initNavigation();
  initDiagram();
  initFilters();
  initTheme();
}

function applySourceLabels() {
  const generated = new Date(state.backup.generatedAt || state.meta.generatedAt || Date.now());
  const label = `Fuente ${state.source} · generado ${generated.toLocaleString('es-MX')}`;
  $$('[data-source]').forEach(el => { el.textContent = state.source; });
  $('#db-name').textContent = state.meta.name || 'db_test_7b';
  $('#intro-db').textContent = state.meta.name || 'la base de datos';
  $('#nav-tables').textContent = state.tables.length;
  $('#generated-at').textContent = label;
  $('#generated-at-secondary').textContent = label;
  $('#privacy-foot').textContent = `${fmt(state.backup.totalInsertRows)} tuplas INSERT del respaldo; no son datos en tiempo real.`;
  setLiveStatus(`${state.source} · ${new Date(state.backup.backupModifiedAt || generated).toLocaleString('es-MX')} · ${fmt(state.backup.totalInsertRows)} filas INSERT procesadas.`);
}

function setLiveStatus(message, error = false) {
  [$('#live-data-status'), $('#diagram-data-status')].filter(Boolean).forEach(el => {
    el.textContent = message;
    el.classList.toggle('error', error);
  });
}

/* ---------- Utilidades de contenido ---------- */
const allColumns = () => state.tables.flatMap(table => table.columns.map(column => ({ table, column })));
const relationCount = table => state.relationships.filter(r => r.fromTable === table.name || r.toTable === table.name).length;
const columnLength = column => column.length ?? ((column.type.match(/\(([^)]+)\)/) || [])[1] || '');

function tableCopy(table) {
  return TABLE_COPY[table.name] || {
    short: `Entidad ${table.name.startsWith('tbc_') ? 'de catálogo' : table.name.startsWith('tbd_') ? 'de detalle o vínculo' : 'del modelo'}.`,
    long: `${pretty(table.name)} agrupa ${table.columns.length} campos y participa en ${relationCount(table)} relaciones declaradas. Cada fila describe un registro según las columnas mostradas.`,
  };
}

function tableDescription(table) {
  const copy = tableCopy(table);
  return copy.long || copy;
}

function colDescription(table, column) {
  if (column.primary) return `Identifica de forma única cada fila de ${table.name}. ${column.autoIncrement ? 'El motor asigna el valor consecutivo automáticamente.' : 'El esquema espera un valor identificador.'}`;
  if (column.foreignKey) {
    const relation = table.foreignKeys?.find(fk => fk.columns.includes(column.name));
    return `Referencia ${relation?.referencesTable || 'otra tabla'} mediante una llave foránea declarada. Permite vincular este registro con la entidad relacionada.`;
  }
  if (column.generated) return `Columna calculada por MySQL con la expresión ${column.generated.expression}. No se escribe directamente.`;
  for (const [pattern, text] of COLUMN_RULES) if (pattern.test(column.name)) return text;
  return 'Almacena un dato propio de esta entidad según el tipo definido en el respaldo.';
}

function exampleValue(column) {
  const name = column.name.toLowerCase();
  if (/password|passwd|secret|hash|salt|token/.test(name)) return 'Valor omitido';
  if (column.default && column.default !== 'NULL') return `Default: ${column.default}`;
  if (/^int|^bigint|^smallint|^tinyint/.test(column.type)) return column.primary ? '101' : '42';
  if (/^varchar|^char|^text|^mediumtext/.test(column.type)) return /email/.test(name) ? 'persona@ejemplo.test' : 'Texto de ejemplo';
  if (/decimal|float|double/.test(column.type)) return '125.50';
  if (/datetime|timestamp/.test(column.type)) return '2026-01-15 10:30';
  if (column.type === 'date') return '2026-01-15';
  if (/bit|bool/.test(column.type)) return '1 (activo)';
  if (/^enum/.test(column.type)) return 'Una opción permitida';
  return 'Valor ilustrativo';
}

function flagBadges(column) {
  const badges = [];
  if (column.primary) badges.push(['PK', 'badge-pk']);
  if (column.foreignKey) badges.push(['FK', 'badge-fk']);
  if (column.unique) badges.push(['U', 'badge-u']);
  if (!column.nullable) badges.push(['●', 'badge-n']);
  if (column.autoIncrement) badges.push(['↗', 'badge-ai']);
  return badges.map(([label, css]) => `<i class="badge ${css}" title="${esc(label)}">${label}</i>`).join('');
}

function prefixOf(name) {
  const prefix = name.split('_')[0].toUpperCase();
  return ({ DB: 'NÚCLEO', TB: 'ENTIDAD', TBC: 'CATÁLOGO', TBD: 'DETALLE / VÍNCULO' })[prefix] || 'OBJETO';
}

function typeExplanation(type) {
  const key = String(type || '').match(/^[a-z]+/i)?.[0].toUpperCase() || '';
  return ({ INT: 'número entero', INTEGER: 'número entero', BIGINT: 'entero de gran capacidad', TINYINT: 'entero pequeño', VARCHAR: 'texto de longitud variable', CHAR: 'texto fijo', TEXT: 'texto extenso', MEDIUMTEXT: 'texto extenso', DATE: 'fecha', DATETIME: 'fecha y hora', TIMESTAMP: 'fecha y hora', DECIMAL: 'número decimal exacto', FLOAT: 'decimal aproximado', DOUBLE: 'decimal de alta precisión', BIT: 'valor binario', BOOLEAN: 'verdadero/falso', ENUM: 'opción definida', JSON: 'documento JSON' })[key] || 'tipo definido por MySQL';
}

/* ---------- Inicio ---------- */
function renderStats() {
  const stats = [
    ['Tablas', state.tables.length, 'entidades definidas', '▦'],
    ['Columnas', state.meta.columnCount ?? allColumns().length, 'campos en total', '▤'],
    ['Relaciones FK', state.relationships.length, 'vínculos declarados', '↗'],
    ['Claves primarias', state.meta.primaryKeyCount ?? state.tables.reduce((n, t) => n + t.primaryKey.length, 0), 'columnas identificadoras', '⌑'],
    ['Claves foráneas', state.meta.foreignKeyCount ?? state.relationships.length, 'restricciones activas', '⤴'],
    ['Vistas', state.meta.viewCount ?? 0, 'consultas guardadas', '◉'],
    ['Procedimientos', state.meta.procedureCount ?? 0, 'rutinas almacenadas', '⌘'],
    ['Triggers', state.meta.triggerCount ?? 0, 'acciones automáticas', 'ϟ'],
  ];
  $('#stats-grid').innerHTML = stats.map(([label, value, sub, symbol], i) => `
    <article class="stat-card">
      <span class="stat-index">${String(i + 1).padStart(2, '0')}</span>
      <span class="stat-symbol">${symbol}</span>
      <b class="stat-value">${fmt(value)}</b>
      <span class="stat-label">${esc(label)}</span>
      <small>${esc(sub)}</small>
    </article>`).join('');
}

function renderCharts() {
  const sorted = [...state.tables].sort((a, b) => b.columns.length - a.columns.length);
  const shown = sorted.slice(0, 8);
  const max = shown[0]?.columns.length || 1;
  $('#columns-chart').innerHTML = shown.map(table => `
    <div class="bar-row">
      <span class="bar-name" title="${esc(table.name)}">${esc(table.name)}</span>
      <span class="bar-track"><i class="bar-fill" style="width:${(table.columns.length * 100 / max).toFixed(1)}%"></i></span>
      <b class="bar-value">${table.columns.length}</b>
    </div>`).join('');

  const counts = {};
  for (const { column } of allColumns()) {
    const key = (column.type.match(/^[a-z]+/i) || ['OTRO'])[0].toUpperCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  const types = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = types.reduce((sum, item) => sum + item[1], 0) || 1;
  $('#types-chart').innerHTML = `
    <div class="type-total"><b>${fmt(total)}</b><span>campos clasificados por tipo</span></div>
    <div class="stacked-bar">${types.map(([, count], i) => `<i style="width:${(count * 100 / total).toFixed(2)}%;background:${PALETTE[i % PALETTE.length]}" title="${esc(types[i][0])}: ${count}"></i>`).join('')}</div>
    <div class="type-legend">${types.slice(0, 8).map(([name, count], i) => `<div><i style="background:${PALETTE[i % PALETTE.length]}"></i><span>${esc(name)}</span><b>${count}</b></div>`).join('')}</div>`;

  const connections = {};
  for (const relation of state.relationships) {
    connections[relation.fromTable] = (connections[relation.fromTable] || 0) + 1;
    connections[relation.toTable] = (connections[relation.toTable] || 0) + 1;
  }
  const top = Object.entries(connections).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxConnections = top[0]?.[1] || 1;
  $('#relations-chart').innerHTML = top.length ? top.map(([name, count], i) => `
    <div class="rank-row">
      <span class="rank-index">${String(i + 1).padStart(2, '0')}</span>
      <b class="rank-name" title="${esc(name)}">${esc(name)}</b>
      <span class="rank-meter"><i style="width:${count * 100 / maxConnections}%"></i></span>
      <span class="rank-count">${count}</span>
    </div>`).join('') : '<p class="muted">No hay relaciones declaradas.</p>';

  const primary = state.meta.primaryKeyCount ?? state.tables.reduce((n, t) => n + t.primaryKey.length, 0);
  const foreign = state.meta.foreignKeyCount ?? state.relationships.length;
  $('#keys-chart').innerHTML = `
    <div class="key-block"><b>${fmt(primary)}</b><span>claves primarias</span></div>
    <div class="key-divider"></div>
    <div class="key-block foreign"><b>${fmt(foreign)}</b><span>claves foráneas</span></div>`;
}

/* ---------- Diccionario ---------- */
function renderDictionary() {
  const types = [...new Set(allColumns().map(({ column }) => (column.type.match(/^[a-z]+/i) || [''])[0].toUpperCase()))].sort();
  $('#type-filter').innerHTML = '<option value="">Todos los tipos</option>' + types.map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join('');
  drawDictionary();
}

function drawDictionary() {
  const query = ($('#dict-search')?.value || '').toLowerCase();
  const type = $('#type-filter')?.value || '';
  const onlyPk = $('#filter-pk')?.checked;
  const onlyFk = $('#filter-fk')?.checked;
  const onlyRequired = $('#filter-required')?.checked;
  const sort = $('#sort-filter')?.value || 'table';

  let list = state.tables.map(table => ({
    ...table,
    columns: table.columns.filter(column =>
      (!query || table.name.toLowerCase().includes(query) || column.name.toLowerCase().includes(query)) &&
      (!type || column.type.toUpperCase().startsWith(type)) &&
      (!onlyPk || column.primary) &&
      (!onlyFk || column.foreignKey) &&
      (!onlyRequired || !column.nullable))
  })).filter(table => table.columns.length);

  if (sort === 'columns') list.sort((a, b) => b.columns.length - a.columns.length);
  else if (sort === 'name') list.sort((a, b) => a.columns[0].name.localeCompare(b.columns[0].name));
  else list.sort((a, b) => a.name.localeCompare(b.name));

  const matchedFields = list.reduce((sum, table) => sum + table.columns.length, 0);
  const rowMap = new Map((state.backup.tables || []).map(table => [table.name, table.insertRows]));
  const indexes = state.tables.reduce((sum, table) => sum + table.indexes.length + table.uniqueKeys.length + (table.primaryKey.length ? 1 : 0), 0);

  $('#dict-summary').innerHTML = `
    <div class="summary-card"><small>Total de tablas</small><b>${state.tables.length}</b></div>
    <div class="summary-card"><small>Total de columnas</small><b>${fmt(state.meta.columnCount ?? allColumns().length)}</b></div>
    <div class="summary-card"><small>Relaciones FK</small><b>${state.relationships.length}</b></div>
    <div class="summary-card"><small>PK / FK</small><b>${state.meta.primaryKeyCount ?? 0} / ${state.meta.foreignKeyCount ?? 0}</b></div>
    <div class="summary-card"><small>Filas INSERT del respaldo</small><b>${fmt(state.backup.totalInsertRows)}</b></div>
    <div class="summary-card"><small>Tablas con datos</small><b>${state.backup.tablesWithInsertRows ?? 0}</b></div>
    <div class="summary-card"><small>Tablas sin filas</small><b>${(state.backup.tablesWithoutInsertRows || []).length}</b></div>
    <div class="summary-card"><small>Índices detectados</small><b>${indexes}</b></div>
    <div class="summary-card wide"><small>Documentación derivada de</small><b data-source>${esc(state.source)}</b><span>${list.length} tablas · ${matchedFields} campos visibles</span></div>`;

  $('#backup-table-summary').innerHTML = (state.backup.tables || [])
    .slice()
    .sort((a, b) => b.insertRows - a.insertRows)
    .map(table => `<span class="strip-item"><b>${esc(table.name)}</b><i>${fmt(table.insertRows)} filas</i></span>`)
    .join('');

  $('#dict-list').innerHTML = list.map((table, index) => {
    const copy = tableCopy(table);
    const rows = fmt(rowMap.get(table.name) || 0);
    return `
      <details class="dict-card" id="dict-${safeId(table.name)}" data-table="${esc(table.name)}" ${state.openDict.has(table.name) ? 'open' : ''}>
        <summary>
          <span class="dict-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="dict-title"><b>${esc(table.name)}</b><small>${esc(copy.short || tableDescription(table))}</small></span>
          <span class="dict-tags">
            <i class="tag pk">${table.primaryKey.length} PK</i>
            <i class="tag fk">${table.foreignKeys.length} FK</i>
            <i class="tag">${table.columns.length} campos</i>
            <i class="tag">${rows} filas</i>
          </span>
          <span class="dict-caret">⌄</span>
        </summary>
        <div class="dict-content">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Campo</th><th>Tipo</th><th>Restricciones</th><th>Nulo</th><th>Predeterminado</th><th>Descripción</th><th>Ejemplo</th></tr></thead>
              <tbody>${table.columns.map(column => `
                <tr>
                  <td><code>${esc(column.name)}</code></td>
                  <td class="type-code" title="${esc(typeExplanation(column.type))}">${esc(column.type)}</td>
                  <td><span class="field-badges">${flagBadges(column) || '—'}</span></td>
                  <td>${column.nullable ? 'Sí' : 'No'}</td>
                  <td>${esc(column.default === null ? '—' : column.default)}</td>
                  <td class="col-desc">${esc(colDescription(table, column))}</td>
                  <td class="col-example">${esc(exampleValue(column))}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </details>`;
  }).join('');

  $('#dict-empty').classList.toggle('hidden', list.length > 0);
  $$('.dict-card').forEach(details => {
    details.addEventListener('toggle', () => {
      const name = details.dataset.table;
      if (details.open) state.openDict.add(name);
      else state.openDict.delete(name);
    });
  });
}

/* ---------- Tablas ---------- */
function renderTables() {
  const query = ($('#table-search')?.value || '').toLowerCase();
  const list = state.tables.filter(table => table.name.toLowerCase().includes(query));
  $('#table-count').textContent = `${list.length} de ${state.tables.length} tablas`;
  $('#table-grid').innerHTML = list.map((table, index) => {
    const copy = tableCopy(table);
    return `
      <article class="entity-card ${state.selectedTable === table.name ? 'selected' : ''}" data-select-table="${esc(table.name)}" tabindex="0" role="button">
        <span class="entity-prefix">${String(index + 1).padStart(2, '0')} · ${prefixOf(table.name)}</span>
        <h3>${esc(table.name)}</h3>
        <p>${esc(copy.short || tableDescription(table))}</p>
        <div class="entity-meta"><span>${table.columns.length} columnas</span><span>${relationCount(table)} relaciones</span></div>
        <div class="entity-tags"><i class="tag pk">${table.primaryKey.length} PK</i><i class="tag fk">${table.foreignKeys.length} FK</i></div>
      </article>`;
  }).join('');

  $$('[data-select-table]').forEach(card => {
    card.addEventListener('click', () => showTable(card.dataset.selectTable));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showTable(card.dataset.selectTable); }
    });
  });

  if (state.selectedTable) showTable(state.selectedTable, false);
}

function showTable(name, selectCard = true) {
  const table = state.tables.find(item => item.name === name);
  if (!table) return;
  state.selectedTable = name;
  if (selectCard) {
    $$('[data-select-table]').forEach(card => card.classList.toggle('selected', card.dataset.selectTable === name));
  }
  const relations = state.relationships.filter(r => r.fromTable === name || r.toTable === name);
  $('#table-detail').innerHTML = `
    <div class="detail-head">
      <div><h2>${esc(table.name)}</h2><p>${esc(tableDescription(table))}</p></div>
      <div class="detail-actions">
        <button class="small-button" type="button" data-table-go="diagrama" data-table="${esc(name)}">Ver en modelo ER ↗</button>
        <button class="small-button" type="button" data-table-go="diccionario" data-table="${esc(name)}">Ver en diccionario ↗</button>
      </div>
    </div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Campo</th><th>Tipo</th><th>Restricciones</th><th>Nulo</th><th>Predeterminado</th><th>Descripción</th></tr></thead>
        <tbody>${table.columns.map(column => `
          <tr>
            <td><code>${esc(column.name)}</code></td>
            <td class="type-code">${esc(column.type)}</td>
            <td><span class="field-badges">${flagBadges(column) || '—'}</span></td>
            <td>${column.nullable ? 'Sí' : 'No'}</td>
            <td>${esc(column.default === null ? '—' : column.default)}</td>
            <td class="col-desc">${esc(colDescription(table, column))}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
    <h3 class="detail-subtitle">Relaciones declaradas</h3>
    ${relations.length ? relations.map(relation => `<p class="relation-explanation">${esc(relation.fromTable)} (${esc(relation.fromColumns.join(', '))}) → ${esc(relation.toTable)} (${esc(relation.toColumns.join(', '))}) · ${esc(relation.cardinality)}</p>`).join('') : '<p class="muted">No hay llaves foráneas declaradas para esta tabla.</p>'}`;

  $$('[data-table-go]', $('#table-detail')).forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.tableGo;
      const tableName = button.dataset.table;
      go(target);
      setTimeout(() => {
        if (target === 'diagrama' && typeof focusTable === 'function') focusTable(tableName);
        if (target === 'diccionario') {
          const element = document.getElementById(`dict-${safeId(tableName)}`);
          if (element) { element.open = true; element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
      }, 80);
    });
  });
}

/* ---------- Relaciones ---------- */
function renderRelationships() {
  const manyToMany = state.meta.manyToMany || [];
  $('#relation-count').textContent = `${state.relationships.length} FK declaradas · ${manyToMany.length} lecturas N:M`;
  $('#relation-empty').classList.toggle('hidden', state.relationships.length > 0);

  $('#relation-cards').innerHTML = state.relationships.map(relation => `
    <article class="relation-card">
      <div class="relation-top"><span class="rel-type">${esc(relation.cardinality || '1:N')}</span><code>${esc(relation.name)}</code></div>
      <div class="relation-route">
        <div class="route-node"><small>ORIGEN · FK</small><b>${esc(relation.fromTable)}</b><code>${esc(relation.fromColumns.join(', '))}</code></div>
        <span class="route-arrow">→</span>
        <div class="route-node"><small>REFERENCIA</small><b>${esc(relation.toTable)}</b><code>${esc(relation.toColumns.join(', '))}</code></div>
      </div>
      <p>${esc(relation.fromTable)}.${esc(relation.fromColumns.join(', '))} referencia ${esc(relation.toTable)}.${esc(relation.toColumns.join(', '))}. Un registro de origen queda vinculado a uno de destino; la cardinalidad estimada es ${esc(relation.cardinality || '1:N')}. Borrar: ${esc(relation.onDelete || 'sin acción declarada')} · Actualizar: ${esc(relation.onUpdate || 'sin acción declarada')}.</p>
      <div class="relation-actions"><button class="small-button" type="button" data-relation-focus="${esc(relation.fromTable)}">Ver en modelo ER ↗</button></div>
    </article>`).join('') + manyToMany.map(relation => `
    <article class="relation-card">
      <div class="relation-top"><span class="rel-type inferred">N:M inferida</span><code>${esc(relation.table)}</code></div>
      <div class="relation-route">
        <div class="route-node"><small>TABLA A</small><b>${esc(relation.tableA)}</b><code>${esc(relation.columnsA.join(', '))}</code></div>
        <span class="route-arrow">↔</span>
        <div class="route-node"><small>TABLA B</small><b>${esc(relation.tableB)}</b><code>${esc(relation.columnsB.join(', '))}</code></div>
      </div>
      <p>${esc(relation.explanation)} Es una lectura deducida de las llaves foráneas de la tabla intermedia, no una restricción N:M declarada directamente.</p>
      <div class="relation-actions"><button class="small-button" type="button" data-relation-focus="${esc(relation.table)}">Ver en modelo ER ↗</button></div>
    </article>`).join('');

  $$('[data-relation-focus]').forEach(button => {
    button.addEventListener('click', () => { go('diagrama'); setTimeout(() => focusTable(button.dataset.relationFocus), 80); });
  });
}

/* ---------- Componentes SQL ---------- */
const COMPONENT_GROUPS = [
  ['views', 'Vistas'],
  ['triggers', 'Triggers'],
  ['procedures', 'Procedimientos'],
  ['functions', 'Funciones'],
  ['indexes', 'Índices'],
  ['constraints', 'Restricciones'],
];

function renderComponents() {
  $('#component-tabs').innerHTML = COMPONENT_GROUPS.map(([key, label]) => `
    <button class="component-tab ${state.currentComponent === key ? 'active' : ''}" type="button" data-component="${key}">
      ${label} <span>${(state.components[key] || []).length}</span>
    </button>`).join('');

  $$('.component-tab').forEach(tab => tab.addEventListener('click', () => {
    state.currentComponent = tab.dataset.component;
    renderComponents();
  }));

  const items = state.components[state.currentComponent] || [];
  const empty = $('#component-empty');
  empty.classList.toggle('hidden', items.length > 0);
  empty.textContent = items.length ? '' : `No se encontraron objetos en este grupo dentro del respaldo.`;

  $('#component-list').innerHTML = items.map(item => {
    const name = item.name || item.columns?.join(', ') || item.expression || 'Restricción';
    const definition = item.definition || item.expression || '';
    const table = item.table || item.fromTable || '';
    return `
      <article class="component-card">
        <div class="component-head"><span class="rel-type">${COMPONENT_GROUPS.find(group => group[0] === state.currentComponent)[1]}</span><b>${esc(name)}</b><small>${esc(table)}</small></div>
        <p class="component-desc">${esc(componentDescription(state.currentComponent, item))}</p>
        ${definition ? `<pre class="sql-code">${esc(definition)}</pre><div class="component-foot"><button type="button" data-copy="${encodeURIComponent(definition)}">Copiar definición SQL</button></div>` : ''}
      </article>`;
  }).join('');

  $$('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(decodeURIComponent(button.dataset.copy))));
}

function componentDescription(kind, item) {
  if (kind === 'views') return item.name.startsWith('vw_practica04') ? 'Vista de trazabilidad creada para los casos de la Práctica 4. Presenta eventos de la bitácora relacionados con un escenario concreto.' : 'Consulta guardada que presenta información de una o más tablas del modelo.';
  if (kind === 'triggers') return `Se ejecuta ${String(item.timing || '').toLowerCase()} de una operación ${item.event || 'sobre la tabla'} en ${item.table}. Registra o valida cambios automáticamente.`;
  if (kind === 'procedures') return 'Rutina almacenada que agrupa instrucciones SQL para realizar una tarea específica.';
  if (kind === 'functions') return 'Función almacenada definida en el respaldo.';
  if (kind === 'indexes') return `Índice de ${item.table} sobre ${item.columns?.join(', ') || 'las columnas indicadas'}; mejora la búsqueda de filas.`;
  return `Restricción ${item.type || 'de integridad'} declarada en ${item.table || 'el esquema'}.`;
}

/* ---------- Navegación y tema ---------- */
const PAGE_NAMES = {
  inicio: 'Inicio',
  diagrama: 'Modelo ER',
  diccionario: 'Diccionario de datos',
  tablas: 'Tablas',
  relaciones: 'Relaciones',
  componentes: 'Componentes SQL',
};

function go(page, setHash = true) {
  if (!PAGE_NAMES[page]) return;
  $$('.page').forEach(section => section.classList.toggle('active', section.id === `page-${page}`));
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === page));
  $('#crumb').textContent = PAGE_NAMES[page];
  $('#sidebar').classList.remove('open');
  if (setHash) history.replaceState(null, '', `#${page}`);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function initNavigation() {
  $$('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); go(link.dataset.page); }));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
  window.addEventListener('hashchange', () => {
    const page = location.hash.slice(1);
    if (PAGE_NAMES[page]) go(page, false);
  });
  if (location.hash && PAGE_NAMES[location.hash.slice(1)]) go(location.hash.slice(1), false);
}

function initTheme() {
  const stored = localStorage.getItem('esquema16-theme');
  document.body.classList.toggle('dark', stored === 'dark');
  const toggle = () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('esquema16-theme', dark ? 'dark' : 'light');
  };
  $('#theme-toggle')?.addEventListener('click', toggle);
  $('#top-theme')?.addEventListener('click', toggle);
  $('#mobile-menu')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    if (event.key.toLowerCase() === 't' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) toggle();
  });
}

/* ---------- Filtros, exportación y portapapeles ---------- */
function initFilters() {
  $('#dict-search')?.addEventListener('input', drawDictionary);
  $('#type-filter')?.addEventListener('change', drawDictionary);
  $('#sort-filter')?.addEventListener('change', drawDictionary);
  ['filter-pk', 'filter-fk', 'filter-required'].forEach(id => $('#' + id)?.addEventListener('change', drawDictionary));
  $('#table-search')?.addEventListener('input', renderTables);
  $('#refresh-metadata')?.addEventListener('click', () => location.reload());
  $('#print-dict')?.addEventListener('click', () => window.print());
  $('#export-csv')?.addEventListener('click', exportCsv);
}

function exportCsv() {
  const header = ['Tabla', 'Campo', 'Tipo de dato', 'Longitud', 'Llave', 'Permite NULL', 'Predeterminado', 'AUTO_INCREMENT', 'Relaciones', 'Descripción'];
  const rows = [header, ...allColumns().map(({ table, column }) => [
    table.name,
    column.name,
    column.type,
    columnLength(column),
    flagBadges(column).replace(/<[^>]+>/g, ''),
    column.nullable ? 'Sí' : 'No',
    column.default ?? '',
    column.autoIncrement ? 'Sí' : 'No',
    state.relationships.filter(r => r.fromTable === table.name && r.fromColumns.includes(column.name)).map(r => `${r.toTable}.${r.toColumns.join(', ')}`).join('; '),
    colDescription(table, column),
  ])];
  const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  download(csv, `diccionario-${state.source.replace(/\.sql$/i, '')}.csv`, 'text/csv;charset=utf-8');
}

function download(data, filename, type) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([data], { type }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  const toast = $('#toast');
  toast.textContent = 'Definición copiada al portapapeles';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1700);
}

/* ---------- Diagrama ER ---------- */
const DIAGRAM_LAYERS = [
  ['db_users', 'tb_logs'],
  ['tb_people', 'tb_user_addresses', 'tbd_address_components', 'tb_payment_methods', 'tbc_payment_methods_types', 'tbd_user_payment_methods'],
  ['tb_products', 'tbc_categories', 'tbd_products_categories', 'tbd_products_users', 'tbd_products_users_providers', 'tbd_users_wishlist_products'],
  ['tb_carts', 'tbd_carts_items', 'tb_buyer_orders', 'tbd_order_items'],
  ['tb_payments', 'tb_payment_transactions', 'tb_shipments'],
  ['tb_returns', 'tbd_return_items', 'tb_cancellations', 'tbd_cancellation_items', 'tb_refunds'],
];

function defaultPositions() {
  const positions = new Map();
  const seen = new Set();
  DIAGRAM_LAYERS.forEach((layer, layerIndex) => layer.forEach((name, rowIndex) => {
    positions.set(name, { x: 38 + layerIndex * 292, y: 34 + rowIndex * 318 });
    seen.add(name);
  }));
  const extras = state.tables.filter(table => !seen.has(table.name));
  if (extras.length) extras.forEach((table, index) => positions.set(table.name, { x: 38 + DIAGRAM_LAYERS.length * 292, y: 34 + index * 318 }));
  return positions;
}

function initDiagram() {
  const diagram = state.diagram;
  diagram.positions = defaultPositions();

  $('#diagram-search')?.addEventListener('input', event => { diagram.query = event.target.value.toLowerCase(); renderDiagram(); });
  $('#diagram-filter')?.addEventListener('change', event => { diagram.filter = event.target.value; renderDiagram(); });
  $('#toggle-columns')?.addEventListener('click', () => {
    diagram.showColumns = !diagram.showColumns;
    $('#toggle-columns').textContent = diagram.showColumns ? 'Ocultar campos' : 'Mostrar campos';
    renderDiagram();
  });
  $('#toggle-all')?.addEventListener('click', () => {
    diagram.hidden = !diagram.hidden;
    $('#toggle-all').textContent = diagram.hidden ? 'Mostrar tablas' : 'Ocultar tablas';
    renderDiagram();
  });
  $('#refresh-diagram')?.addEventListener('click', renderDiagram);
  $('#diagram-auto-layout')?.addEventListener('click', () => { diagram.positions = defaultPositions(); renderDiagram(); });
  $('#diagram-reset')?.addEventListener('click', resetDiagram);
  $('#diagram-fit')?.addEventListener('click', fitDiagram);
  $('#zoom-in')?.addEventListener('click', () => zoomBy(1.12));
  $('#zoom-out')?.addEventListener('click', () => zoomBy(1 / 1.12));

  const wrap = $('#diagram-wrap');
  let pan = null;
  wrap?.addEventListener('pointerdown', event => {
    if (event.target.closest('.er-node') || event.button !== 0) return;
    pan = { x: event.clientX, y: event.clientY, tx: diagram.tx, ty: diagram.ty };
    wrap.classList.add('panning');
    wrap.setPointerCapture(event.pointerId);
  });
  wrap?.addEventListener('pointermove', event => {
    if (!pan) return;
    diagram.tx = pan.tx + event.clientX - pan.x;
    diagram.ty = pan.ty + event.clientY - pan.y;
    applyTransform();
  });
  const endPan = () => { pan = null; wrap?.classList.remove('panning'); };
  wrap?.addEventListener('pointerup', endPan);
  wrap?.addEventListener('pointercancel', endPan);
  wrap?.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = wrap.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY < 0 ? 1.1 : 1 / 1.1);
  }, { passive: false });

  renderDiagram();
}

function renderDiagram() {
  const diagram = state.diagram;
  const canvas = $('#diagram-canvas');
  const svg = $('#diagram-lines');
  if (!canvas || !svg) return;
  canvas.innerHTML = '';
  canvas.append(svg);

  const neighbors = new Set([diagram.selected, ...state.relationships.filter(r => r.fromTable === diagram.selected || r.toTable === diagram.selected).flatMap(r => [r.fromTable, r.toTable])]);
  const visible = [];
  for (const table of state.tables) {
    const relations = relationCount(table);
    const matchesFilter = diagram.filter === 'all' ||
      (diagram.filter === 'with-relations' && relations > 0) ||
      (diagram.filter === 'without-relations' && relations === 0) ||
      (diagram.filter === 'related' && neighbors.has(table.name));
    const show = !diagram.hidden && matchesFilter && table.name.toLowerCase().includes(diagram.query);
    if (!show) continue;
    visible.push(table);
    const position = diagram.positions.get(table.name) || { x: 40, y: 40 };
    const rowCount = state.backup.tables?.find(item => item.name === table.name)?.insertRows || 0;
    const node = document.createElement('div');
    node.className = 'er-node' + (diagram.selected === table.name ? ' selected' : '') + (diagram.selected && !neighbors.has(table.name) ? ' faded' : '');
    node.dataset.node = table.name;
    node.style.left = `${position.x}px`;
    node.style.top = `${position.y}px`;
    node.innerHTML = `
      <div class="er-node__head">
        <span class="er-node__index">${prefixOf(table.name).slice(0, 2)}</span>
        <b class="er-node__name" title="${esc(table.name)}">${esc(table.name)}</b>
        <span class="er-node__count">${fmt(rowCount)} filas · ${table.columns.length} col</span>
      </div>
      ${diagram.showColumns ? `<div class="er-node__body">${table.columns.map(column => `
        <div class="er-col" data-col="${esc(column.name)}">
          ${column.primary ? '<i class="node-mark badge-pk">PK</i>' : column.foreignKey ? '<i class="node-mark badge-fk">FK</i>' : column.unique ? '<i class="node-mark badge-u">U</i>' : '<i class="node-mark"></i>'}
          <span class="c-name">${esc(column.name)}</span>
          <span class="c-type">${esc(column.type)}</span>
        </div>`).join('')}</div>` : ''}`;
    canvas.append(node);
    attachNodeDrag(node, table.name);
  }
  diagram.visible = visible;
  $('#diagram-empty').style.display = visible.length ? 'none' : 'grid';
  applyTransform();
  drawEdges(visible);
  if (diagram.selected) showDiagramDetail(state.tables.find(table => table.name === diagram.selected));
}

function attachNodeDrag(node, name) {
  let drag = null;
  node.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const position = state.diagram.positions.get(name);
    drag = { x: event.clientX, y: event.clientY, origin: { ...position }, moved: false };
    setSelectedTable(name, false);
    node.setPointerCapture(event.pointerId);
  });
  node.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = (event.clientX - drag.x) / state.diagram.scale;
    const dy = (event.clientY - drag.y) / state.diagram.scale;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    state.diagram.positions.set(name, { x: Math.round(drag.origin.x + dx), y: Math.round(drag.origin.y + dy) });
    node.style.left = `${drag.origin.x + dx}px`;
    node.style.top = `${drag.origin.y + dy}px`;
    drawEdges(state.diagram.visible);
  });
  const stop = () => { drag = null; };
  node.addEventListener('pointerup', stop);
  node.addEventListener('pointercancel', stop);
}

function setSelectedTable(name, rerender = true) {
  state.diagram.selected = name;
  const neighbors = new Set([name, ...state.relationships.filter(r => r.fromTable === name || r.toTable === name).flatMap(r => [r.fromTable, r.toTable])]);
  $$('.er-node').forEach(node => {
    node.classList.toggle('selected', node.dataset.node === name);
    node.classList.toggle('faded', !!name && !neighbors.has(node.dataset.node));
  });
  const table = state.tables.find(item => item.name === name);
  if (table) showDiagramDetail(table);
  drawEdges(state.diagram.visible);
  if (rerender) renderDiagram();
}

function showDiagramDetail(table) {
  const detail = $('#diagram-detail');
  if (!detail || !table) return;
  const relations = state.relationships.filter(r => r.fromTable === table.name || r.toTable === table.name);
  detail.innerHTML = `
    <h3>${esc(table.name)}</h3>
    <p class="detail-meta">${prefixOf(table.name)} · ${table.columns.length} columnas · ${table.primaryKey.length} PK · ${table.foreignKeys.length} FK</p>
    <div>${relations.length ? relations.map(r => `<span class="detail-link">${esc(r.fromTable)}.${esc(r.fromColumns.join(','))} → ${esc(r.toTable)}.${esc(r.toColumns.join(','))} · ${esc(r.cardinality)}</span>`).join('') : '<span class="muted">No tiene relaciones declaradas mediante FK.</span>'}</div>
    <button class="small-button" type="button" id="detail-to-dict">Abrir en diccionario ↗</button>`;
  $('#detail-to-dict').addEventListener('click', () => {
    go('diccionario');
    setTimeout(() => {
      const element = document.getElementById(`dict-${safeId(table.name)}`);
      if (element) { element.open = true; element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 80);
  });
}

function drawEdges(visible) {
  const svg = $('#diagram-lines');
  if (!svg) return;
  const visibleNames = new Set(visible.map(table => table.name));
  const positions = state.diagram.positions;
  const bounds = visible.map(table => {
    const position = positions.get(table.name);
    const node = $(`[data-node="${CSS.escape(table.name)}"]`);
    return { x: position.x, y: position.y, w: 226, h: node?.offsetHeight || 120 };
  });
  const width = Math.max(1000, ...bounds.map(b => b.x + b.w + 80));
  const height = Math.max(700, ...bounds.map(b => b.y + b.h + 80));
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.innerHTML = `<defs><marker id="er-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="var(--line-strong)"></path></marker><marker id="er-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="var(--accent)"></path></marker></defs>`;
  const ns = 'http://www.w3.org/2000/svg';

  for (const relation of state.relationships) {
    if (!visibleNames.has(relation.fromTable) || !visibleNames.has(relation.toTable)) continue;
    const from = positions.get(relation.fromTable);
    const to = positions.get(relation.toTable);
    const fromNode = $(`[data-node="${CSS.escape(relation.fromTable)}"]`);
    const toNode = $(`[data-node="${CSS.escape(relation.toTable)}"]`);
    const related = state.diagram.selected === relation.fromTable || state.diagram.selected === relation.toTable;
    const fromY = columnOffset(fromNode, relation.fromColumns[0]);
    const toY = columnOffset(toNode, relation.toColumns[0]);
    let path;
    if (relation.fromTable === relation.toTable) {
      const x = from.x + 226;
      path = `M ${x} ${from.y + fromY} C ${x + 80} ${from.y + fromY - 40}, ${x + 90} ${from.y + fromY + 70}, ${x} ${from.y + fromY + 44}`;
    } else {
      const forward = to.x >= from.x;
      const x1 = forward ? from.x + 226 : from.x;
      const x2 = forward ? to.x : to.x + 226;
      const bend = Math.max(50, Math.abs(x2 - x1) * .45);
      path = `M ${x1} ${from.y + fromY} C ${x1 + (forward ? bend : -bend)} ${from.y + fromY}, ${x2 - (forward ? bend : -bend)} ${to.y + toY}, ${x2} ${to.y + toY}`;
    }
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', path);
    line.setAttribute('class', 'er-edge' + (related ? ' related' : ''));
    line.setAttribute('marker-end', `url(#${related ? 'er-arrow-active' : 'er-arrow'})`);
    svg.append(line);

    const label = document.createElementNS(ns, 'text');
    const labelX = relation.fromTable === relation.toTable ? from.x + 300 : (from.x + to.x) / 2 + 113;
    const labelY = relation.fromTable === relation.toTable ? from.y + fromY + 15 : (from.y + fromY + to.y + toY) / 2 - 5;
    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'er-edge-label');
    label.textContent = `${relation.cardinality || '1:N'} · ${relation.name}`;
    svg.append(label);
  }
}

function columnOffset(node, columnName) {
  if (!node) return 44;
  const row = node.querySelector(`[data-col="${CSS.escape(columnName || '')}"]`);
  if (!row) return 44;
  return row.offsetTop + row.offsetHeight / 2;
}

function applyTransform() {
  const diagram = state.diagram;
  const canvas = $('#diagram-canvas');
  if (!canvas) return;
  canvas.style.transform = `translate(${diagram.tx}px, ${diagram.ty}px) scale(${diagram.scale})`;
  $('#zoom-level').textContent = `${Math.round(diagram.scale * 100)}%`;
}

function zoomAt(pointX, pointY, factor) {
  const diagram = state.diagram;
  const next = clamp(diagram.scale * factor, .35, 1.8);
  const ratio = next / diagram.scale;
  diagram.tx = pointX - (pointX - diagram.tx) * ratio;
  diagram.ty = pointY - (pointY - diagram.ty) * ratio;
  diagram.scale = next;
  applyTransform();
}

function zoomBy(factor) {
  const wrap = $('#diagram-wrap');
  if (!wrap) return;
  zoomAt(wrap.clientWidth / 2, wrap.clientHeight / 2, factor);
}

function resetDiagram() {
  const diagram = state.diagram;
  diagram.scale = 1;
  diagram.tx = 0;
  diagram.ty = 0;
  diagram.selected = '';
  diagram.filter = 'all';
  diagram.query = '';
  diagram.hidden = false;
  diagram.showColumns = true;
  diagram.positions = defaultPositions();
  $('#diagram-search').value = '';
  $('#diagram-filter').value = 'all';
  $('#toggle-columns').textContent = 'Ocultar campos';
  $('#toggle-all').textContent = 'Ocultar tablas';
  renderDiagram();
  const detail = $('#diagram-detail');
  if (detail) detail.innerHTML = '<p class="placeholder">Selecciona una tabla para ver sus conexiones y campos principales.</p>';
}

function fitDiagram() {
  const wrap = $('#diagram-wrap');
  if (!wrap || !state.diagram.visible.length) return;
  const diagram = state.diagram;
  const bounds = state.diagram.visible.map(table => {
    const position = diagram.positions.get(table.name);
    const node = $(`[data-node="${CSS.escape(table.name)}"]`);
    return { x: position.x, y: position.y, w: 226, h: node?.offsetHeight || 120 };
  });
  const minX = Math.min(...bounds.map(b => b.x));
  const minY = Math.min(...bounds.map(b => b.y));
  const maxX = Math.max(...bounds.map(b => b.x + b.w));
  const maxY = Math.max(...bounds.map(b => b.y + b.h));
  const totalW = maxX - minX + 40;
  const totalH = maxY - minY + 40;
  diagram.scale = clamp(Math.min(wrap.clientWidth / totalW, wrap.clientHeight / totalH), .35, 1);
  diagram.tx = 20 - minX * diagram.scale;
  diagram.ty = 20 - minY * diagram.scale;
  applyTransform();
}

function focusTable(name) {
  const diagram = state.diagram;
  if (!diagram.positions.has(name)) return;
  diagram.hidden = false;
  diagram.filter = 'all';
  diagram.query = '';
  $('#diagram-search').value = '';
  $('#diagram-filter').value = 'all';
  $('#toggle-all').textContent = 'Ocultar tablas';
  diagram.selected = name;
  renderDiagram();
  requestAnimationFrame(() => {
    const wrap = $('#diagram-wrap');
    if (!wrap) return;
    const position = diagram.positions.get(name);
    diagram.tx = wrap.clientWidth / 2 - (position.x + 113) * diagram.scale;
    diagram.ty = wrap.clientHeight / 2 - (position.y + 70) * diagram.scale;
    applyTransform();
  });
}

boot();
