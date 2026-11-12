# Practicas de la Asignatura de Base de Datos en la Nube
## Ingenieria en Tecnologias de la Informacion e Innovacion Digital
### Docente: M.T.I Marco A. Ramirez Hernandez

Periodo: Septiembre - Diciembre 2026

---

### Tabla de Practicas de la Materia

|No.| Nombre | Descripción | Potenciador | Estatus |
|---|---|---|---|---|
|1.|Metodología de Evaluación de la Materia| Transcribir en libreta y comprender la metodología y fechas de evaluación de la asignatura| 5| 🟢 Conlcuida |
|2.|Conexiones Remotas para Bases de Datos SQL| Crear y administrar usuarios y privilegios para conexiones desde internet o redes locales|60 |🟢 Conlcuida|
|3.|Manipulación de Datos en Conexiones Remotas a Bases de Datos Relacionales| Crear Procedimientos Almacenados, Funciones, Tablas Derivada, Importación de Datos en el Contexto de E-Commerce |?? | 🟢 Concluida|
|4.|Examen Práctico Instalación de Postgre y MySQL en un VPS| Instalar, Configurar, Desplegar y Simular datos en los Servicios de Bases de Datos Relacionales Remotas|100 | 🟡 En progreso|

## Atlas est?tico del respaldo Respaldo14.sql

El sitio se publica como archivos est?ticos y funciona en GitHub Pages. No se conecta a MySQL ni utiliza PHP, endpoints, Node como servidor o credenciales en el navegador. Los conteos describen las filas presentes en las sentencias `INSERT` del respaldo analizado. Los posibles datos personales, credenciales, tokens y referencias de pago se redactan en los JSON generados; los archivos de datos resultantes siguen siendo p?blicos al publicar el sitio. El SQL de origen no se necesita para ejecutar el sitio; no lo incluyas en los archivos publicados.

### Regenerar metadatos y registros paginados

Desde la ra?z del repositorio, con Node.js disponible solo para ejecutar los analizadores de generaci?n:

```powershell
node scripts/analyze_sql.js Practica3/backups/Respaldo14.sql data
node scripts/analyze_backup_inserts.js Practica3/backups/Respaldo14.sql data/backup-summary.json
node scripts/generate_static_records.js Practica3/backups/Respaldo14.sql data/records
```

El flujo produce `data/structure.json`, `data/tables.json`, `data/relationships.json`, `data/components.json`, `data/estadisticas.json`, `data/backup-summary.json` y p?ginas JSON de hasta 100 filas por tabla en `data/records/`. La interfaz solicita metadatos al iniciar y trae solo la p?gina necesaria para mostrar registros. La b?squeda y el orden global recorren secuencialmente las p?ginas de la tabla seleccionada.

### Ejecutar localmente

`fetch()` requiere servir los archivos por HTTP (no abrir `index.html` directamente como `file://`). En PowerShell: `py -m http.server 8000`; abre `http://localhost:8000/`.

### Publicar en GitHub Pages

Sube los cambios del sitio y los JSON generados al repositorio y configura GitHub Pages para publicar la rama/carpeta que contiene `index.html`. Las rutas son relativas a la ra?z del sitio. Para reflejar cambios de base de datos, exporta un nuevo respaldo, gu?rdalo en la ruta indicada, ejecuta de nuevo los tres comandos en orden y publica los JSON regenerados.

El diagrama se construye en el navegador a partir de `structure.json`/los metadatos de tablas y `relationships.json`; sus conexiones f?sicas provienen exclusivamente de las cl?usulas `FOREIGN KEY` del respaldo. La relaci?n N:M se presenta como una derivaci?n cuando una tabla puente tiene una PK compuesta por sus FK.
