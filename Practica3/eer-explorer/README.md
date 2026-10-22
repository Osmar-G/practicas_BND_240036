# Diccionario de datos · Schema Atlas

Aplicación local en español que analiza `../backups/10Respaldo.sql` como texto. No conecta con MySQL y nunca ejecuta sentencias del archivo. El respaldo se carga automáticamente al iniciar el servidor; también se puede seleccionar otro `.sql` en la interfaz.

## Uso

Requiere Node.js 18 o posterior. No necesita instalar dependencias.

```sh
node server.cjs
```

Abre <http://127.0.0.1:4173/eer-explorer/>. Para analizar y contar los objetos del respaldo desde la terminal:

```sh
node verify.cjs
```

Las filas que aparecen en el catálogo son tuplas de sentencias `INSERT` incluidas en el respaldo; no son un conteo actual de una base de datos conectada. La documentación inferida a partir de nombres se etiqueta como pendiente de confirmación. No se exhiben valores de los INSERT.

## Funciones

- Catálogo de tablas, columnas, claves, índices, relaciones declaradas y objetos SQL.
- Búsqueda global y filtros por tabla, tipo, nulabilidad y restricciones.
- Glosario generado para los tipos encontrados.
- Exportación de columnas a CSV, libro Excel `.xlsx` con siete hojas, HTML imprimible y PDF mediante el diálogo de impresión del navegador.
- El parser procesa comentarios, cadenas, identificadores entre acentos graves, paréntesis y restricciones declaradas en la tabla. Las advertencias se muestran en la validación.

El análisis es conservador: las relaciones se confirman solo si están declaradas por claves foráneas. El significado funcional que no pueda respaldarse con comentarios o restricciones se marca para confirmar.
