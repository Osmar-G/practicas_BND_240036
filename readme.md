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
|3.|Manipulación de Datos en Conexiones Remotas a Bases de Datos Relacionales| Crear Procedimientos Almacenados, Funciones, Tablas Derivada, Importación de Datos en el Contexto de E-Commerce |?? |🟢 Concluida|
|4.|Examen Práctico Instalación de Postgre y MySQL en un VPS| Instalar, Configurar, Desplegar y Simular datos en los Servicios de Bases de Datos Relacionales Remotas|100 |🟢 Concluida|

---

### Documentación del esquema (`index.html`)

El diccionario de datos y el modelo entidad-relación se generan desde `Practica4/backups/Respaldo16.sql`.

Para regenerar todos los JSON publicados después de cambiar el respaldo:

```bash
node scripts/refresh_all.js
```

La ruta del respaldo se configura en `scripts/config.js`. El sitio debe servirse por HTTP (por ejemplo, `python -m http.server 4173`) para que el navegador pueda cargar los archivos `data/*.json`.

