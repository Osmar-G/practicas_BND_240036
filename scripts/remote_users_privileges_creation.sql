/* Creasion de usuarios remotos */
CREATE USER IF NOT EXISTS 'marco.ramirez'@'%' IDENTIFIED BY 'qwerty123';
CREATE USER IF NOT EXISTS 'obed.vargas'@'%' IDENTIFIED BY '240145';
CREATE USER IF NOT EXISTS 'osmar.ortega'@'%' IDENTIFIED BY '240036';
CREATE USER IF NOT EXISTS 'jorge.lopez'@'%' IDENTIFIED BY '240456';
CREATE USER IF NOT EXISTS 'mago.rojas'@'%' IDENTIFIED BY '240242';

SET GLOBAL local_infile = 1;
GRANT FILE ON *.* TO 'obed.vargas'@'%';
GRANT FILE ON *.* TO 'mago.rojas'@'%';

/* Asignar los privilegios de super usuario */
GRANT ALL PRIVILEGES ON *.* TO 'osmar.ortega'@'%';

/* Asignar los privilegios de SELECCION, INSERCION, ACTUALIZACION Y ELIMINACION */
GRANT SELECT, INSERT, UPDATE, DELETE
ON db_test_7b.* TO 'obed.vargas'@'%';

/* CREACION DE ROLES PARA EL SISTEMA DE ECOMMERCE */
CREATE ROLE IF NOT EXISTS 'superadmin';
CREATE ROLE IF NOT EXISTS 'admin';
CREATE ROLE IF NOT EXISTS 'seller';
CREATE ROLE IF NOT EXISTS 'buyer';
CREATE ROLE IF NOT EXISTS 'support';
CREATE ROLE IF NOT EXISTS 'common';
CREATE ROLE IF NOT EXISTS 'user_not_registered';

/* ASIGNAR PRIVILEGIOS A LOS ROLES CREADOS */
GRANT ALL PRIVILEGES ON *.* TO 'superadmin';

GRANT ALL PRIVILEGES ON db_test_7b.* TO 'admin';

GRANT SELECT, INSERT, UPDATE
ON db_test_7b.db_users
TO 'support';

GRANT SELECT, INSERT, UPDATE
ON db_test_7b.tb_products
TO 'support';

/* seller */
GRANT SELECT, INSERT, UPDATE
ON db_test_7b.tb_products
TO 'seller';

/* ASIGNAR ROLES A LOS USUARIOS CREADOS */
GRANT 'superadmin' TO 'osmar.ortega'@'%';
GRANT 'admin' TO 'marco.ramirez'@'%';
GRANT 'support' TO 'obed.vargas'@'%';
GRANT 'seller' TO 'jorge.lopez'@'%';
GRANT 'seller' TO 'mago.rojas'@'%';

/* ACTIVAR ROLES POR DEFECTO */
SET DEFAULT ROLE 'superadmin' TO 'osmar.ortega'@'%';
SET DEFAULT ROLE 'admin' TO 'marco.ramirez'@'%';
SET DEFAULT ROLE 'support' TO 'obed.vargas'@'%';
SET DEFAULT ROLE 'seller' TO 'jorge.lopez'@'%';
SET DEFAULT ROLE 'seller' TO 'mago.rojas'@'%';

/* Mostrar los usuarios creados */
SELECT 'Los usuarios han sido creados correctamente, se muestran a continuacion:' AS mensaje;

/* Aplicar cambios */
FLUSH PRIVILEGES;