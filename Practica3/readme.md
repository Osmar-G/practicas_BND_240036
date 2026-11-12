# Práctica 03 - Base de Datos Relacional y Seguridad Remota

## Descripción general

En esta práctica se trabajó con una base de datos relacional en MySQL 8.0, enfocada en la creación, manipulación y validación de datos en un entorno remoto. La estructura del proyecto está organizada por módulos funcionales.

La práctica incorpora:

- Diseño y carga de datos relacionales
- Configuración de usuarios remotos y privilegios
- Generación de respaldos SQL
- Validación de datos mediante consultas
- Carga masiva desde archivos CSV y SQL

---

## GitHub Pages

[Visita mi sitio en GitHub Pages](https://osmar-g.github.io/practicas_BND_240036/)

---

## Estructura del proyecto

```text
Practica3/
├── backups/
│   ├── 5Respaldo.sql
│   ├── 6Respaldo.sql
│   ├── 7Respaldo.sql
│   ├── 8Respaldo.sql
│   ├── 9Respaldo.sql
│   ├── 10Respaldo.sql
│   ├── 11Respaldo.sql
│   ├── 12Respaldo.sql
│   ├── 13Respaldo.sql
│   └── 14Respaldo.sql
├── queries/
│   └── consultas_verificacion.sql
├── scripts/
│   └── remote_users_privileges_creation.sql
├── seeds/
│   ├── cargaProductos.sql
│   ├── categorias_ecommerce_100 (1).csv
│   └── categorizacion_productos.csv
├── readme.md
└── README.md (opcional, si se agrega en el futuro)
```

---

## Descripción de carpetas

### backups/
Contiene los respaldos SQL generados durante distintos momentos de la práctica. Sirven como versiones de seguridad y como punto de recuperación del estado de la base de datos.

Archivos principales:

- `5Respaldo.sql`
- `6Respaldo.sql`
- `7Respaldo.sql`
- `8Respaldo.sql`
- `9Respaldo.sql`
- `10Respaldo.sql`
- `11Respaldo.sql`
- `12Respaldo.sql`
- `13Respaldo.sql`
- `14Respaldo.sql`

### queries/
Contiene consultas de validación y revisión del comportamiento de la base de datos.

Archivo:

- `consultas_verificacion.sql`

Estas consultas permiten comprobar:

- estructura de la base de datos
- existencia de usuarios remotos
- privilegios asignados
- registros cargados
- consistencia de los datos

### scripts/
Incluye scripts SQL utilizados para la configuración de conexiones remotas, permisos y otros procesos de administración.

Archivo:

- `remote_users_privileges_creation.sql`

Este archivo se usa para:

- crear usuarios remotos
- asignar roles o privilegios
- definir accesos para conexiones externas

### seeds/
Contiene datos iniciales y archivos de carga para poblar la base de datos.

Archivos:

- `cargaProductos.sql`: script para insertar productos en la base de datos
- `categorias_ecommerce_100 (1).csv`: catálogo de categorías en formato CSV
- `categorizacion_productos.csv`: datos de categorización de productos

---

## Objetivos de la práctica

- Configurar y administrar una base de datos relacional en MySQL
- Gestionar conexiones remotas a la instancia de base de datos
- Crear y aplicar privilegios de acceso
- Generar copias de seguridad de la base de datos
- Poblar la base de datos con datos reales o semi reales
- Validar integridad, consistencia y operación del sistema mediante consultas SQL

---

## Flujo de trabajo sugerido

1. Revisar la estructura del proyecto en `Practica3/`
2. Ejecutar los scripts de configuración necesarios desde `scripts/`
3. Cargar datos iniciales desde `seeds/`
4. Ejecutar validaciones en `queries/`
5. Generar respaldos en `backups/` según avance del proyecto

---

## Notas importantes

- Los archivos SQL pueden ejecutarse en MySQL Workbench, terminal MySQL o cualquier cliente compatible.
- Es recomendable revisar primero los scripts de configuración antes de ejecutar cambios en producción o en entornos de prueba.
- Los respaldos deben mantenerse organizados por fecha o versión para facilitar recuperación.

---

## Estado de la práctica

Proyecto en proceso y estructurado por módulos funcionales para facilitar su administración y documentación.
