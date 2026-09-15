/* Creacion de usuarios remotos */
CREATE USER 'marco.ramirez'@'%' IDENTIFIED BY 'qwerty123';
CREATE USER 'osmar.ortega'@'%' IDENTIFIED BY '240036';
CREATE USER 'obed.vargas'@'%' IDENTIFIED BY '240145';
CREATE USER 'jorge.gonzalez'@'%' IDENTIFIED BY '240456';

/*Asignar los privilegios de super usuario*/
GRANT ALL PRIVILEGES ON *.* TO 'osmar.ortega'@'%';

/* Asignar los privilegios de SELECCION, INCERSION, ACTUALIZACION Y ELIMINACION */
GRANT SELECT, INSERT, UPDATE, DELETE ON db_test_7b TO 'obed.vargas'@'%';

/*CREACION DE ROLES PARA EL SISTEMA DE ECOMMERCE */
CREATE ROLE 'admin';
CREATE ROLE 'seller';
CREATE ROLE 'buyer';
CREATE ROLE 'support';
CREATE ROLE 'common';
CREATE ROLE 'user_not_registered';


/* ASIGNAR PRIVILEGIOS A LOS ROLES CREADOS */
GRANT ALL PRIVILEGES ON db_test_7b.* TO 'admin';
-- SUPPORT
GRANT SELECT, INSERT, UPDATE,ON db_test_7b.* TO 'support';

/* ASIGNAR ROLES A LOS USUARIOS CREADOS */
GRANT 'admin' TO 'marco.ramirez'@'%';
GRANT 'support' TO 'obed.vargas'@'%';



