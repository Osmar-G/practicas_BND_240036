# Schema Atlas · Explorador EER

Visor local del esquema MySQL contenido en `../backups/9Respaldo.sql`. El analizador interpreta el DDL y las tuplas de `INSERT` directamente en el navegador. No abre conexiones de base de datos ni ejecuta instrucciones SQL.

## Uso

Requiere Node.js 18 o posterior; no necesita instalar dependencias.

```sh
node server.cjs
```

Abre <http://127.0.0.1:4173/eer-explorer/>. También puedes elegir otro respaldo con **Cargar SQL**. Para comprobar el archivo inicial desde la terminal:

```sh
node verify.cjs
```

Los números mostrados son filas insertadas en el respaldo. No representan conteos actuales: el visor no tiene una conexión a MySQL. El panel permite inspeccionar columnas, claves, índices, relaciones y DDL. Arrastra las tarjetas o el fondo, usa la rueda para zoom y exporta el diagrama en SVG. La distribución se conserva en el almacenamiento local del navegador.

## Alcance del analizador

El parser recorre strings, identificadores entre backticks, comentarios SQL y paréntesis anidados para separar las definiciones. Interpreta tablas, columnas, claves primarias y foráneas, índices, checks, vistas, triggers, rutinas y filas presentes en sentencias `INSERT`. Los objetos no compatibles y referencias no resueltas se informan como advertencias. No infiere relaciones por similitud de nombres. Los conteos del respaldo son cantidades de tuplas incluidas en `INSERT`, no una reconstrucción de cambios posteriores ni un conteo vivo.
