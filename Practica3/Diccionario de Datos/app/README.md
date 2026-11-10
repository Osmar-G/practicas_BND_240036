# Diccionario de datos interactivo

Aplicación local, sin dependencias externas de Node. Analiza como texto el respaldo ubicado en `../../backups/12Respaldo.sql` desde esta carpeta; nunca ejecuta sentencias ni se conecta a MySQL.

## Iniciar

Desde esta carpeta, ejecuta:

```powershell
node server.js
```

Abre <http://127.0.0.1:4173>. Para cambiar el puerto, define la variable `PORT` antes de iniciar. Usa **Cargar otro respaldo** para analizar otro archivo SQL (máximo 32 MB).

## Uso y precisión

- Los conteos de filas se calculan contando tuplas de `INSERT ... VALUES` en el respaldo. No son conteos actuales.
- No se retienen ni presentan valores de filas. Las exportaciones contienen metadatos de estructura, no datos personales ni credenciales.
- Las descripciones en español derivadas de nombres se marcan como inferidas; los nombres técnicos y restricciones vienen del SQL.
- El análisis reconoce definiciones MySQL `CREATE TABLE`, índices y claves declarados dentro de ellas, `INSERT`, vistas, triggers y rutinas. Las construcciones que no reconoce generan avisos en la interfaz.
- El PDF se genera desde la opción de impresión del navegador (Guardar como PDF). CSV y XLSX contienen inventario de columnas; el libro XLSX añade una hoja de relaciones. JSON, Markdown y HTML pueden guardarse directamente.

La aplicación no tiene dependencias npm ni requiere instalación de paquetes.

## Modelo entidad-relación

Desde el encabezado del diccionario, abre **Modelo ER** para explorar el diagrama interactivo. El mismo servidor y analizador alimentan la vista; también puedes cargar un respaldo desde esa pantalla. Las posiciones se guardan en el almacenamiento local del navegador. El generador `generate-archify-erd.js` reconstruye el candidato ER de Archify desde el mismo respaldo.
