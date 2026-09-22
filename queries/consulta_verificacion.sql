USE db_test_7b;

/1. Cuantas tablas existen en la base de datos db_test_7b?/
SHOW TABLES;
/2. Cuantos triggers existen en la base de datos db_test_7b?/
SHOW TRIGGERS FROM db_test_7b;

/3. Cuantos registros existen en la tabla users?/
SELECT COUNT(*) AS total_registros FROM tb_users;

/4. Cuantos registros existen en la tabla bitacora?/
SELECT COUNT(*) AS total_registros FROM tb_logs;

/5. Consultar todas las operaciones realizadas en la base de datos/
SELECT * FROM tb_logs;

/6. Verificar que los usuarios remotoss hayan sido creados/
SELECT user, host from mysql.user where host='%' AND account_locked = 'N';

/7. Verificar los roles que fueron creados/
SELECT user, host from mysql.user where host='%' AND account_locked = 'Y';

/* 8. Verificar que usuarios tienen que roles */
SELECT TO_USER AS usuario, TO_HOST AS host, FROM_USER AS rol, FROM_HOST AS rol_host
FROM mysql.role_edges ORDER BY TO_USER, FROM_USER;

--9. verificar el total de los procedimientos almacenados que esten en la base de datos db_test_7b
SHOW PROCEDURE STATUS WHERE Db = 'db_test_7b';

/10 Consulta para verificar que usuario de la base de datos ,/
-- inserto a que usuario de la plataforma ecommerce
SELECT 
    u.nick,
    u.email,
    b.db_user AS inserted_by,
    b.operation_description,
    b.operation_date
FROM tb_users u
JOIN tb_logs b
    ON INSTR(b.operation_description, u.nick) > 0
   AND INSTR(b.operation_description, u.email) > 0
WHERE b.table_operation = 'Create'
  AND b.table_name = 'tb_users';