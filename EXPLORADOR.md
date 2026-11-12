# Atlas de datos · db_test_7b

Explorador educativo estático para GitHub Pages. La interfaz consume únicamente los metadatos de `data/`; no consulta MySQL y no necesita servidor de aplicación.

## Publicación

Configura GitHub Pages para publicar desde la rama principal y la carpeta raíz (`/`). `index.html`, `assets/` y `data/` ya usan rutas relativas. El respaldo SQL está ignorado por Git y no forma parte del sitio.

Para una vista local, sirve la carpeta raíz con cualquier servidor de archivos estáticos (por ejemplo, `npx serve .`) y abre la dirección local indicada. La carga de JSON mediante `fetch` no funciona al abrir `index.html` directamente con `file://` en los navegadores habituales.

## Regenerar metadatos

Con Node.js instalado, ejecuta desde la raíz del repositorio:

```sh
node scripts/analyze_sql.js Practica3/backups/Respaldo14.sql data
```

El analizador lee el dump localmente y extrae definiciones `CREATE TABLE`, llaves, índices, triggers, procedimientos y funciones. No procesa ni copia bloques `INSERT`. Los archivos resultantes son `database.json`, `tables.json`, `relationships.json` y `components.json`. Las rutinas se publican sin `DEFINER` y con literales de correo/contraseña redactados.

## Alcance de la lectura

Los nombres, tipos, valores predeterminados, llaves, índices y definiciones SQL proceden del respaldo. Las descripciones para lectores no técnicos se generan como orientación usando nombres y estructura; el SQL no contiene descripciones de negocio para cada campo. Las relaciones N:M se señalan como inferencias cuando una clave primaria compuesta coincide con las llaves foráneas hacia tablas distintas. No se crean relaciones a partir de semejanzas de nombres.

Este proyecto contiene metadatos de estructura, no filas de la base de datos. Aun así, revisa los JSON generados antes de publicar cambios derivados de otro respaldo.
