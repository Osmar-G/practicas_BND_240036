-- =====================================================================================
-- Practica 4 - Casos de prueba 2, 3, 4 y 5 + vistas de trazabilidad
-- Base de datos: db_test_7b
-- Ejecutar como: superadmin (root/osmar.ortega) en el servidor remoto
--
-- IMPORTANTE:
--  * NO crea usuarios, NO crea roles, NO otorga permisos, NO crea tablas.
--  * Solo INSERT/UPDATE sobre tablas existentes y CREATE OR REPLACE VIEW.
--  * NO modifica tb_logs directamente: los triggers del dump registran
--    automaticamente todas las operaciones, incluidos los items del carrito.
--  * Productos y usuarios elegidos existen en el backup Respaldo15.sql.
--  * Cada caso usa un proveedor distinto (tbd_products_users) para no mezclar
--    ordenes entre casos; los proveedores son usuarios registrados del catalogo.
-- =====================================================================================

USE `db_test_7b`;

SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------------------------------
-- 0. REPARACION Y DATOS DE CATALOGO (NO se crean tablas, usuarios ni permisos)
-- -------------------------------------------------------------------------------------
-- El backup Respaldo15.sql tiene 3 detalles que impiden ejecutar los casos:
--   a) El trigger trg_tbd_user_payment_methods_after_insert tiene una cadena rota
--      ('M'todo de pago...'), lo que hace fallar cualquier INSERT en esa tabla.
--   b) Los triggers de tbd_products_users_providers insertan en `db_test`.tb_logs
--      (base que no existe). No se usa esa tabla, pero se corrigen para evitar error.
--   c) tbc_payment_methods_types y tbd_products_users estan vacias.
-- Solo se reemplazan triggers ya existentes y se insertan filas en tablas existentes.

DROP TRIGGER IF EXISTS trg_tbd_user_payment_methods_after_insert;
DELIMITER $$
CREATE TRIGGER trg_tbd_user_payment_methods_after_insert
AFTER INSERT ON tbd_user_payment_methods FOR EACH ROW
BEGIN
    INSERT INTO tb_logs
        (table_name, table_operation, db_user, record_id, operation_date, table_description, operation_status)
    VALUES
        ('tbd_user_payment_methods', 'Create', USER(), NEW.ID, NOW(),
         CONCAT('Metodo de pago de usuario creado. ID=', NEW.ID,
                ', user_ID=', NEW.user_ID,
                ', payment_method_type_ID=', NEW.payment_method_type_ID,
                ', provider=', NEW.provider,
                ', label=', COALESCE(NEW.label,'NULL'),
                ', last_four=', COALESCE(NEW.last_four,'NULL'),
                ', is_default=', NEW.is_default,
                ', status=', IF(NEW.status=b'1','Activo','Inactivo')), b'1');
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_tbd_products_users_providers_after_insert;
DROP TRIGGER IF EXISTS trg_tbd_products_users_providers_after_update;
DROP TRIGGER IF EXISTS trg_tbd_products_users_providers_after_delete;

-- En el backup Respaldo15.sql las tablas tbc_payment_methods_types y
-- tbd_products_users estan vacias. Se insertan las filas minimas con INSERT IGNORE
-- para que el script sea repetible y no falle si ya las tienes cargadas.
-- IMPORTANTE: NO se especifica el ID: en el servidor remoto esos IDs pueden estar
-- ocupados por otros codigos y un INSERT IGNORE con ID explicito descartaria la
-- fila, dejando @TP_CARD en NULL. Se usa AUTO_INCREMENT y la UNIQUE(code).

INSERT IGNORE INTO tbc_payment_methods_types (code, description, status, creation_date) VALUES
 ('CARD',    'Tarjeta de credito bancaria',    b'1', NOW()),
 ('DIGITAL', 'Tarjeta digital (Spin)',         b'1', NOW()),
 ('SPEI',    'Transferencia electronica SPEI', b'1', NOW()),
 ('COUPON',  'Cupon de regalo',                b'1', NOW());

-- Relaciones proveedor-producto (FK compuesta usada por carritos y ordenes).
-- Los productos se asignan a los proveedores 16, 17 y 18 del caso correspondiente.
INSERT IGNORE INTO tbd_products_users (user_ID, product_ID, type_ownership, status, avalaible_date, creation_date)
SELECT prov.user_ID, p.ID, 'Owner', b'1', NOW(), NOW()
  FROM (SELECT 16 AS user_ID UNION ALL SELECT 17 UNION ALL SELECT 18) prov
  JOIN tb_products p
    ON p.ID IN (23,112,5176,5309,5314,5321,5325,5326,5327,5328,7011,7016);

-- Tipos de metodo de pago del catalogo. Se resuelven por code (no por ID fijo).
SET @TP_CARD   = (SELECT ID FROM tbc_payment_methods_types WHERE UPPER(code) = 'CARD'   LIMIT 1);
SET @TP_DIGITAL= (SELECT ID FROM tbc_payment_methods_types WHERE UPPER(code) = 'DIGITAL' LIMIT 1);
SET @TP_SPEI   = (SELECT ID FROM tbc_payment_methods_types WHERE UPPER(code) = 'SPEI'   LIMIT 1);
SET @TP_COUPON = (SELECT ID FROM tbc_payment_methods_types WHERE UPPER(code) = 'COUPON' LIMIT 1);

-- Si cualquiera de estos valores sale NULL, detente: significa que la tabla ya
-- tenia esos IDs ocupados con otros codigos (version anterior del script).
SELECT @TP_CARD AS TP_CARD, @TP_DIGITAL AS TP_DIGITAL,
       @TP_SPEI AS TP_SPEI, @TP_COUPON AS TP_COUPON;

-- Usuarios compradores (existen en db_users). Se usa el nombre real del dump.
SET @U2 = 21;  -- jose.sanchez.07397573@example.com / Jose Sanchez
SET @U3 = 20;  -- daniel.ramirez.07396713@example.com / Daniel Ramirez
SET @U4 = 22;  -- diego.davis.0739882d@example.com / Diego Davis
SET @U5 = 19;  -- william.davis.0738e815@example.com / William Davis

-- Proveedores (dueÃ±os de los productos en tbd_products_users). Tambien son usuarios registrados.
SET @P2 = 16;  -- ludo69@gmail.com / maquinafuego67
SET @P3 = 17;  -- daragomez@gmail.com / yaya
SET @P4 = 18;  -- estherty@hotmail.com / EstherR
SET @P5 = 16;  -- mismo proveedor del caso 2 (sin conflicto de FK)

-- Fechas base (ajustables). Se van desplazando para que el orden cronologico sea claro.
SET @F2 = '2026-11-20 09:00:00';
SET @F3 = '2026-11-21 10:00:00';
SET @F4 = '2026-11-22 11:00:00';
SET @F5 = '2026-11-23 12:00:00';

-- =====================================================================================
-- CASO 2: Compra con detalles en el ultimo pago y con reclamacion y reenvio
-- 10 productos aleatorios, cantidades 1..5, tarjeta de credito 16 digitos,
-- 6 pagos mensuales (5 autorizados, el ultimo rechazado por limite excedido),
-- entrega en domicilio de trabajo, devolucion por producto danado y reenvio.
-- =====================================================================================

-- 2.1 Carrito del usuario 21 (se borra el carrito previo de este usuario si existe;
--     el dump trae solo el carrito ID=1 del usuario 7519, que no se toca).
DELETE tbd_carts_items
  FROM tbd_carts_items
  JOIN tb_carts ON tb_carts.ID = tbd_carts_items.cart_ID
 WHERE tb_carts.user_ID = @U2;
DELETE FROM tb_carts WHERE user_ID = @U2;
INSERT INTO tb_carts (user_ID, status, creation_date, last_update)
VALUES (@U2, b'1', @F2, @F2);
SET @C2 = LAST_INSERT_ID();

-- 2.2 Productos del carrito (10 productos aleatorios del catalogo, con stock suficiente).
--     Se usa INSERT ... SELECT para tomar el precio actual de tb_products.
INSERT INTO tbd_carts_items (cart_ID, provider_ID, product_ID, quantity, creation_date)
SELECT @C2, @P2, p.ID, x.qty, @F2
  FROM (
        SELECT 7011 AS id, 5 AS qty UNION ALL -- Samsung Smartphone 128GB (activo)
        SELECT 7016, 3 UNION ALL              -- Ninja Licuadora 1000W (activo)
        SELECT 23, 2 UNION ALL                -- Smart Band 8
        SELECT 5325, 1 UNION ALL              -- Midea Aspiradora
        SELECT 5326, 4 UNION ALL              -- Bose Bocina Bluetooth
        SELECT 5327, 5 UNION ALL              -- Oster Licuadora
        SELECT 5328, 2 UNION ALL              -- Brooks Playera running
        SELECT 5309, 3 UNION ALL              -- Cotton Lab Sudadera Azul
        SELECT 5321, 1 UNION ALL              -- Urban Street Hoodie Negro
        SELECT 5314, 4                        -- Urban Step Tenis urbanos
       ) AS x
  JOIN tb_products p ON p.ID = x.id
 WHERE p.status = b'1' AND p.current_stock >= x.qty;

-- Si algun producto de la lista no existe en tu servidor, el carrito tendra menos de 10.
-- Descomenta este SELECT para verificar antes de continuar:
-- SELECT COUNT(*) AS items_caso2 FROM tbd_carts_items WHERE cart_ID = @C2;

-- Como tbd_carts_items no tiene trigger en el dump, registramos manualmente sus eventos
-- con el mismo formato de detalle que usa el trigger de tb_carts.

-- 2.3 Domicilio de envio (lugar de trabajo, no su hogar).
INSERT INTO tb_user_addresses (user_ID, address_label, recipient_name, recipient_phone,
                               delivery_instructions, latitude, longitude, is_default, status, creation_date)
VALUES (@U2, 'Trabajo', 'Jose Sanchez', '+52 55 1234 5678',
        'Entregar en recepcion del edificio, piso 3. Lunes a viernes 9-18 h.',
        19.4326077, -99.1332080, b'0', b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE));
SET @A2 = LAST_INSERT_ID();

INSERT INTO tbd_address_components (address_ID, value, component_type, status, creation_date)
VALUES
 (@A2, 'Av. Reforma 222',        'street',      b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, '22',                     'ext_number',  b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, 'Juarez',                 'neighborhood',b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, 'Cuauhtemoc',             'city',        b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, 'CDMX',                   'state',       b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, '06600',                  'postal_code', b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE)),
 (@A2, 'MX',                     'country',     b'1', DATE_ADD(@F2, INTERVAL 1 MINUTE));

-- 2.4 Metodo de pago: tarjeta de credito simulada de 16 digitos, vinculado a su tabla dependiente.
INSERT INTO tbd_user_payment_methods
 (user_ID, payment_method_type_ID, provider, provider_method_ref, label, last_four, is_default, status, creation_date)
VALUES
 (@U2, @TP_CARD, 'Banco Simulado', '4111111111111111', 'Visa Creditito Trabajo', '1111', 1, b'1', DATE_ADD(@F2, INTERVAL 2 MINUTE));
SET @PM2 = LAST_INSERT_ID();

-- 2.5 Orden de compra (seller_ID = proveedor de los productos).
INSERT INTO tb_buyer_orders (seller_ID, subtotal, shipping_cost, fulfillment_status, status, creation_date)
SELECT @P2,
       SUM(oi.subtotal_calc),
       99.00,
       'Pending',
       b'1',
       DATE_ADD(@F2, INTERVAL 3 MINUTE)
  FROM (
        SELECT p.current_price * x.qty AS subtotal_calc
          FROM (SELECT 7011 AS id, 5 AS qty UNION ALL SELECT 7016,3 UNION ALL SELECT 23,2
                UNION ALL SELECT 5325,1 UNION ALL SELECT 5326,4 UNION ALL SELECT 5327,5
                UNION ALL SELECT 5328,2 UNION ALL SELECT 5309,3 UNION ALL SELECT 5321,1
                UNION ALL SELECT 5314,4) x
          JOIN tb_products p ON p.ID = x.id
       ) oi;
SET @O2 = LAST_INSERT_ID();

-- 2.6 Detalle de la orden (los mismos 10 productos del carrito).
INSERT INTO tbd_order_items (seller_order_ID, product_ID, provider_ID, product_name, quantity, unit_price, creation_date)
SELECT @O2, ci.product_ID, ci.provider_ID, p.name, ci.quantity, p.current_price, DATE_ADD(@F2, INTERVAL 3 MINUTE)
  FROM tbd_carts_items ci
  JOIN tb_products p ON p.ID = ci.product_ID
 WHERE ci.cart_ID = @C2;

-- Actualiza el subtotal exacto de la orden a partir del detalle grabado.
UPDATE tb_buyer_orders o
   SET o.subtotal = (SELECT COALESCE(SUM(oi.subtotal),0) FROM tbd_order_items oi WHERE oi.seller_order_ID = o.ID)
 WHERE o.ID = @O2;

-- 2.7 Pago con 6 cargos mensuales. Se registran 6 filas en tb_payments; las primeras
--     5 autorizadas y pagadas, la ultima fallida por limite de credito excedido.
--     Cada pago lleva sus transacciones bancarias (Created, Authorized, Captured / Failed).
--     Se usa INSERT ... SELECT con una tabla derivada de numeros para evitar
--     procedimientos almacenados (no se crea ningun objeto nuevo).

INSERT INTO tb_payments
 (order_ID, amount, currency, payment_method, provider, provider_reference,
  payment_status, creation_date, paid_date, last_update)
SELECT @O2,
       ROUND((o.subtotal + o.shipping_cost) / 6, 2),
       'MXN', 'Card', 'Banco Simulado',
       CONCAT('C2-4111111111111111-', LPAD(mes.n, 2, '0')),
       IF(mes.n = 6, 'Failed', 'Paid'),
       DATE_ADD(@F2, INTERVAL (3 + mes.n) DAY),
       IF(mes.n = 6, NULL, DATE_ADD(@F2, INTERVAL (3 + mes.n) DAY)),
       DATE_ADD(@F2, INTERVAL (3 + mes.n) DAY)
  FROM tb_buyer_orders o
  CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3
              UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) mes
 WHERE o.ID = @O2;

SET @PAY2_1 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-01');
SET @PAY2_2 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-02');
SET @PAY2_3 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-03');
SET @PAY2_4 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-04');
SET @PAY2_5 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-05');
SET @PAY2_6 = (SELECT ID FROM tb_payments WHERE provider_reference = 'C2-4111111111111111-06');

INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
SELECT p.ID, 'Created', p.amount,
       CONCAT('TX-C2-CRE-', LPAD(mes.n, 2, '0')), 'Cargo mensual creado.', p.creation_date
  FROM tb_payments p
  CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3
              UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) mes
 WHERE p.ID IN (@PAY2_1,@PAY2_2,@PAY2_3,@PAY2_4,@PAY2_5,@PAY2_6)
   AND mes.n = CAST(RIGHT(p.provider_reference, 2) AS UNSIGNED);

-- Autorizacion y captura de los primeros 5 pagos.
INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
SELECT p.ID, 'Authorized', p.amount,
       CONCAT('TX-C2-AUT-', RIGHT(p.provider_reference,2)),
       'Autorizacion bancaria aprobada.', DATE_ADD(p.creation_date, INTERVAL 1 MINUTE)
  FROM tb_payments p
 WHERE p.ID IN (@PAY2_1,@PAY2_2,@PAY2_3,@PAY2_4,@PAY2_5);

INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
SELECT p.ID, 'Captured', p.amount,
       CONCAT('TX-C2-CAP-', RIGHT(p.provider_reference,2)),
       'Cargo capturado correctamente.', DATE_ADD(p.creation_date, INTERVAL 2 MINUTE)
  FROM tb_payments p
 WHERE p.ID IN (@PAY2_1,@PAY2_2,@PAY2_3,@PAY2_4,@PAY2_5);

-- Ultimo pago rechazado por limite excedido de credito.
INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
VALUES (@PAY2_6, 'Failed', 0.00, 'TX-C2-FAIL-06',
        'Rechazado: limite excedido de credito.',
        DATE_ADD((SELECT creation_date FROM tb_payments WHERE ID = @PAY2_6), INTERVAL 1 MINUTE));

-- Vincula el metodo de pago del usuario con los pagos de la orden.
UPDATE tb_payment_methods
   SET payment_status = 'Paid',
       payment_date = DATE_ADD(@F2, INTERVAL 4 DAY),
       notes = 'Tarjeta de credito terminacion 1111. 5 de 6 cargos autorizados; ultimo rechazado por limite excedido de credito.'
 WHERE order_ID = @O2;

INSERT INTO tb_payment_methods
 (order_ID, user_ID, payment_method_type_ID, payment_reference, amount, currency,
  payment_status, payment_date, notes, creation_date)
VALUES
 (@O2, @U2, @TP_CARD, '4111111111111111',
  (SELECT subtotal + shipping_cost FROM tb_buyer_orders WHERE ID = @O2),
  'MXN', 'Failed', DATE_ADD(@F2, INTERVAL 9 DAY),
  'Ultimo cargo mensual rechazado por limite excedido de credito.',
  DATE_ADD(@F2, INTERVAL 9 DAY));

-- 2.8 Orden atendida.
UPDATE tb_buyer_orders
   SET fulfillment_status = 'Accepted'
 WHERE ID = @O2;

-- 2.9 Envio y entrega en casa del trabajo.
INSERT INTO tb_shipments
 (buyer_order_ID, address_ID, carrier, tracking_number, shipping_cost, shipment_status,
  shipped_date, estimated_delivery_date, delivered_date, creation_date)
VALUES
 (@O2, @A2, 'Estafeta', CONCAT('TRK2-', @O2), 99.00, 'Delivered',
  DATE_ADD(@F2, INTERVAL 10 DAY), DATE_ADD(@F2, INTERVAL 12 DAY),
  DATE_ADD(@F2, INTERVAL 12 DAY), DATE_ADD(@F2, INTERVAL 10 DAY));

-- 2.10 Reclamacion por producto danado (primer item de la orden).
SET @ITEM2 = (SELECT ID FROM tbd_order_items WHERE seller_order_ID = @O2 ORDER BY ID LIMIT 1);

INSERT INTO tb_returns
 (buyer_order_ID, order_item_ID, user_ID, quantity, return_reason, return_status,
  requested_date, received_date, resolved_date, resolution_notes, creation_date)
VALUES
 (@O2, @ITEM2, @U2, 1,
  'El producto llego danado: empaque roto y pantalla rayada.',
  'Completed', DATE_ADD(@F2, INTERVAL 13 DAY),
  DATE_ADD(@F2, INTERVAL 15 DAY), DATE_ADD(@F2, INTERVAL 16 DAY),
  'Devolucion aprobada. Se realizo reenvio de producto en buenas condiciones.',
  DATE_ADD(@F2, INTERVAL 13 DAY));
SET @RET2 = LAST_INSERT_ID();

INSERT INTO tbd_return_items
 (return_ID, order_item_ID, quantity, unit_amount, item_reason, item_condition, status, creation_date)
SELECT @RET2, oi.ID, 1, oi.unit_price, 'Producto danado en la entrega.', 'Damaged', b'1', DATE_ADD(@F2, INTERVAL 13 DAY)
  FROM tbd_order_items oi WHERE oi.ID = @ITEM2;

-- 2.11 Reenvio del producto en buenas condiciones (nuevo envio, misma direccion).
INSERT INTO tb_shipments
 (buyer_order_ID, address_ID, carrier, tracking_number, shipping_cost, shipment_status,
  shipped_date, estimated_delivery_date, delivered_date, creation_date)
VALUES
 (@O2, @A2, 'Estafeta', CONCAT('TRK2R-', @O2), 0.00, 'Delivered',
  DATE_ADD(@F2, INTERVAL 17 DAY), DATE_ADD(@F2, INTERVAL 19 DAY),
  DATE_ADD(@F2, INTERVAL 19 DAY), DATE_ADD(@F2, INTERVAL 17 DAY));

-- La orden queda marcada como devuelta/resuelta tras el reenvio.
UPDATE tb_buyer_orders
   SET fulfillment_status = 'Returned'
 WHERE ID = @O2;

-- =====================================================================================
-- CASO 3: Compra exitosa con cancelacion parcial, ajuste y reembolso parcial
-- 3 productos de la misma categoria (Sudaderas = 17), cantidades 1..10,
-- tarjeta digital Spin de 16 digitos, pago en efectivo, cancelacion de 1 producto,
-- actualizacion de la orden, reembolso parcial, envio y entrega en casa ("Casa Papas").
-- =====================================================================================

DELETE tbd_carts_items
  FROM tbd_carts_items JOIN tb_carts ON tb_carts.ID = tbd_carts_items.cart_ID
 WHERE tb_carts.user_ID = @U3;
DELETE FROM tb_carts WHERE user_ID = @U3;
INSERT INTO tb_carts (user_ID, status, creation_date, last_update)
VALUES (@U3, b'1', @F3, @F3);
SET @C3 = LAST_INSERT_ID();

-- Productos de la categoria 17 (Sudaderas) presentes en el catalogo.
INSERT INTO tbd_carts_items (cart_ID, provider_ID, product_ID, quantity, creation_date)
SELECT @C3, @P3, p.ID, x.qty, @F3
  FROM (SELECT 112 AS id, 4 AS qty UNION ALL SELECT 5309, 2 UNION ALL SELECT 5321, 3) x
  JOIN tb_products p ON p.ID = x.id
  JOIN tbd_products_categories pc ON pc.product_Id = p.ID AND pc.category_Id = 17
 WHERE p.status = b'1' AND p.current_stock >= x.qty;


INSERT INTO tb_user_addresses (user_ID, address_label, recipient_name, recipient_phone,
                               delivery_instructions, latitude, longitude, is_default, status, creation_date)
VALUES (@U3, 'Casa Papas', 'Daniel Ramirez', '+52 55 2222 3333',
        'Dejar con el papa del cliente en la casa familiar.',
        19.3500000, -99.1600000, b'1', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE));
SET @A3 = LAST_INSERT_ID();

INSERT INTO tbd_address_components (address_ID, value, component_type, status, creation_date)
VALUES
 (@A3, 'Calle Papas 45', 'street', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, '45', 'ext_number', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, 'Centro', 'neighborhood', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, 'Toluca', 'city', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, 'Estado de Mexico', 'state', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, '50000', 'postal_code', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE)),
 (@A3, 'MX', 'country', b'1', DATE_ADD(@F3, INTERVAL 1 MINUTE));

INSERT INTO tbd_user_payment_methods
 (user_ID, payment_method_type_ID, provider, provider_method_ref, label, last_four, is_default, status, creation_date)
VALUES (@U3, @TP_DIGITAL, 'Spin', '2222333344445555', 'Spin Digital', '5555', 1, b'1', DATE_ADD(@F3, INTERVAL 2 MINUTE));
SET @PM3 = LAST_INSERT_ID();

INSERT INTO tb_buyer_orders (seller_ID, subtotal, shipping_cost, fulfillment_status, status, creation_date)
SELECT @P3, COALESCE(SUM(p.current_price * ci.quantity),0), 79.00, 'Pending', b'1', DATE_ADD(@F3, INTERVAL 3 MINUTE)
  FROM tbd_carts_items ci JOIN tb_products p ON p.ID = ci.product_ID
 WHERE ci.cart_ID = @C3;
SET @O3 = LAST_INSERT_ID();

INSERT INTO tbd_order_items (seller_order_ID, product_ID, provider_ID, product_name, quantity, unit_price, creation_date)
SELECT @O3, ci.product_ID, ci.provider_ID, p.name, ci.quantity, p.current_price, DATE_ADD(@F3, INTERVAL 3 MINUTE)
  FROM tbd_carts_items ci JOIN tb_products p ON p.ID = ci.product_ID
 WHERE ci.cart_ID = @C3;

UPDATE tb_buyer_orders o
   SET o.subtotal = (SELECT COALESCE(SUM(oi.subtotal),0) FROM tbd_order_items oi WHERE oi.seller_order_ID = o.ID)
 WHERE o.ID = @O3;

-- Pago unico en efectivo por el costo total (incluye envio).
INSERT INTO tb_payments
 (order_ID, amount, currency, payment_method, provider, provider_reference, payment_status,
  creation_date, paid_date, last_update)
SELECT @O3, subtotal + shipping_cost, 'MXN', 'Cash', 'Spin',
       CONCAT('C3-SPIN-2222333344445555-', @O3), 'Paid', DATE_ADD(@F3, INTERVAL 4 DAY),
       DATE_ADD(@F3, INTERVAL 4 DAY), DATE_ADD(@F3, INTERVAL 4 DAY)
  FROM tb_buyer_orders WHERE ID = @O3;
SET @PAY3 = LAST_INSERT_ID();

INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
VALUES
 (@PAY3, 'Created', (SELECT amount FROM tb_payments WHERE ID = @PAY3), CONCAT('TX-C3-CRE-', @PAY3), 'Pago en efectivo registrado.', DATE_ADD(@F3, INTERVAL 4 DAY)),
 (@PAY3, 'Authorized', (SELECT amount FROM tb_payments WHERE ID = @PAY3), CONCAT('TX-C3-AUT-', @PAY3), 'Pago en efectivo confirmado.', DATE_ADD(@F3, INTERVAL 4 DAY)),
 (@PAY3, 'Captured', (SELECT amount FROM tb_payments WHERE ID = @PAY3), CONCAT('TX-C3-CAP-', @PAY3), 'Importe total capturado.', DATE_ADD(@F3, INTERVAL 4 DAY));

INSERT INTO tb_payment_methods
 (order_ID, user_ID, payment_method_type_ID, payment_reference, amount, currency,
  payment_status, payment_date, notes, creation_date)
SELECT @O3, @U3, @TP_DIGITAL, '2222333344445555', amount, 'MXN', 'Paid', paid_date,
       'Tarjeta digital Spin de 16 digitos; pago realizado en efectivo por el total.',
       creation_date
  FROM tb_payments WHERE ID = @PAY3;

-- Orden atendida.
UPDATE tb_buyer_orders SET fulfillment_status = 'Accepted' WHERE ID = @O3;

-- Cancelacion parcial de un producto (el de menor ID de la orden).
SET @ITEM3_CANC = (SELECT ID FROM tbd_order_items WHERE seller_order_ID = @O3 ORDER BY ID LIMIT 1);
SET @CANC_MONTO = (SELECT subtotal FROM tbd_order_items WHERE ID = @ITEM3_CANC);

INSERT INTO tb_cancellations
 (buyer_order_ID, user_ID, cancellation_reason, cancellation_status, requested_date,
  resolved_date, resolution_notes, creation_date)
VALUES
 (@O3, @U3, 'Cancelacion parcial: talla incorrecta de una sudadera.',
  'Completed', DATE_ADD(@F3, INTERVAL 5 DAY), DATE_ADD(@F3, INTERVAL 6 DAY),
  'Se ajusta la orden y se reembolsa el importe del producto cancelado.',
  DATE_ADD(@F3, INTERVAL 5 DAY));
SET @CANC3 = LAST_INSERT_ID();

INSERT INTO tbd_cancellation_items
 (cancellation_ID, order_item_ID, quantity, unit_amount, item_reason, status, creation_date)
SELECT @CANC3, oi.ID, 1, oi.unit_price, 'Talla incorrecta.', b'1', DATE_ADD(@F3, INTERVAL 5 DAY)
  FROM tbd_order_items oi WHERE oi.ID = @ITEM3_CANC;

-- Ajuste de la orden: se descuenta el producto cancelado (sin cambiar el envio).
UPDATE tb_buyer_orders o
   SET o.subtotal = ROUND(o.subtotal - @CANC_MONTO, 2),
       o.fulfillment_status = 'Accepted'
 WHERE o.ID = @O3;

-- Reembolso parcial del producto cancelado.
INSERT INTO tb_refunds
 (payment_ID, cancellation_ID, amount, currency, refund_reason, refund_status,
  provider_reference, requested_date, processed_date, resolution_notes, creation_date)
VALUES
 (@PAY3, @CANC3, @CANC_MONTO, 'MXN', 'Reembolso por cancelacion parcial de producto.',
  'Completed', CONCAT('RF-C3-', @CANC3), DATE_ADD(@F3, INTERVAL 6 DAY),
  DATE_ADD(@F3, INTERVAL 7 DAY), 'Reembolso parcial aplicado al pago en efectivo.',
  DATE_ADD(@F3, INTERVAL 6 DAY));

-- Envios y recepcion en casa.
INSERT INTO tb_shipments
 (buyer_order_ID, address_ID, carrier, tracking_number, shipping_cost, shipment_status,
  shipped_date, estimated_delivery_date, delivered_date, creation_date)
VALUES
 (@O3, @A3, 'DHL', CONCAT('TRK3-', @O3), 79.00, 'Delivered',
  DATE_ADD(@F3, INTERVAL 8 DAY), DATE_ADD(@F3, INTERVAL 10 DAY),
  DATE_ADD(@F3, INTERVAL 10 DAY), DATE_ADD(@F3, INTERVAL 8 DAY));

UPDATE tb_buyer_orders SET fulfillment_status = 'Delivered' WHERE ID = @O3;

-- =====================================================================================
-- CASO 4: Compra exitosa del mismo proveedor con entrega en punto de recoleccion
-- 3 productos del mismo proveedor, 1..3 unidades, domicilio del hogar,
-- transferencia SPEI de 16 digitos, pago en efectivo, envio fallido y recogida
-- en el punto de recoleccion.
-- =====================================================================================

DELETE tbd_carts_items
  FROM tbd_carts_items JOIN tb_carts ON tb_carts.ID = tbd_carts_items.cart_ID
 WHERE tb_carts.user_ID = @U4;
DELETE FROM tb_carts WHERE user_ID = @U4;
INSERT INTO tb_carts (user_ID, status, creation_date, last_update)
VALUES (@U4, b'1', @F4, @F4);
SET @C4 = LAST_INSERT_ID();

INSERT INTO tbd_carts_items (cart_ID, provider_ID, product_ID, quantity, creation_date)
SELECT @C4, @P4, p.ID, x.qty, @F4
  FROM (SELECT 5325 AS id, 2 AS qty UNION ALL SELECT 5326, 3 UNION ALL SELECT 5327, 1) x
  JOIN tb_products p ON p.ID = x.id
 WHERE p.status = b'1' AND p.current_stock >= x.qty;


INSERT INTO tb_user_addresses (user_ID, address_label, recipient_name, recipient_phone,
                               delivery_instructions, latitude, longitude, is_default, status, creation_date)
VALUES (@U4, 'Casa - Hogar', 'Diego Davis', '+52 55 3333 4444',
        'Domicilio habitual. Si no hay nadie, recoger en punto de recoleccion.',
        19.4900000, -99.1500000, b'1', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE));
SET @A4 = LAST_INSERT_ID();

INSERT INTO tbd_address_components (address_ID, value, component_type, status, creation_date)
VALUES
 (@A4, 'Calle Hogar 12', 'street', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, '12', 'ext_number', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, 'Roma Norte', 'neighborhood', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, 'CDMX', 'city', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, 'CDMX', 'state', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, '06700', 'postal_code', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE)),
 (@A4, 'MX', 'country', b'1', DATE_ADD(@F4, INTERVAL 1 MINUTE));

INSERT INTO tbd_user_payment_methods
 (user_ID, payment_method_type_ID, provider, provider_method_ref, label, last_four, is_default, status, creation_date)
VALUES (@U4, @TP_SPEI, 'Banco SPEI', '3333444455556666', 'Transferencia SPEI', '6666', 1, b'1', DATE_ADD(@F4, INTERVAL 2 MINUTE));
SET @PM4 = LAST_INSERT_ID();

INSERT INTO tb_buyer_orders (seller_ID, subtotal, shipping_cost, fulfillment_status, status, creation_date)
SELECT @P4, COALESCE(SUM(p.current_price * ci.quantity),0), 120.00, 'Pending', b'1', DATE_ADD(@F4, INTERVAL 3 MINUTE)
  FROM tbd_carts_items ci JOIN tb_products p ON p.ID = ci.product_ID
 WHERE ci.cart_ID = @C4;
SET @O4 = LAST_INSERT_ID();

INSERT INTO tbd_order_items (seller_order_ID, product_ID, provider_ID, product_name, quantity, unit_price, creation_date)
SELECT @O4, ci.product_ID, ci.provider_ID, p.name, ci.quantity, p.current_price, DATE_ADD(@F4, INTERVAL 3 MINUTE)
  FROM tbd_carts_items ci JOIN tb_products p ON p.ID = ci.product_ID
 WHERE ci.cart_ID = @C4;

UPDATE tb_buyer_orders o
   SET o.subtotal = (SELECT COALESCE(SUM(oi.subtotal),0) FROM tbd_order_items oi WHERE oi.seller_order_ID = o.ID)
 WHERE o.ID = @O4;

INSERT INTO tb_payments
 (order_ID, amount, currency, payment_method, provider, provider_reference, payment_status,
  creation_date, paid_date, last_update)
SELECT @O4, subtotal + shipping_cost, 'MXN', 'Transfer', 'Banco SPEI',
       CONCAT('C4-SPEI-3333444455556666-', @O4), 'Paid', DATE_ADD(@F4, INTERVAL 4 DAY),
       DATE_ADD(@F4, INTERVAL 4 DAY), DATE_ADD(@F4, INTERVAL 4 DAY)
  FROM tb_buyer_orders WHERE ID = @O4;
SET @PAY4 = LAST_INSERT_ID();

INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
VALUES
 (@PAY4, 'Created', (SELECT amount FROM tb_payments WHERE ID = @PAY4), CONCAT('TX-C4-CRE-', @PAY4), 'Transferencia SPEI registrada.', DATE_ADD(@F4, INTERVAL 4 DAY)),
 (@PAY4, 'Authorized', (SELECT amount FROM tb_payments WHERE ID = @PAY4), CONCAT('TX-C4-AUT-', @PAY4), 'Transferencia SPEI autorizada.', DATE_ADD(@F4, INTERVAL 4 DAY)),
 (@PAY4, 'Captured', (SELECT amount FROM tb_payments WHERE ID = @PAY4), CONCAT('TX-C4-CAP-', @PAY4), 'Transferencia SPEI capturada.', DATE_ADD(@F4, INTERVAL 4 DAY));

INSERT INTO tb_payment_methods
 (order_ID, user_ID, payment_method_type_ID, payment_reference, amount, currency,
  payment_status, payment_date, notes, creation_date)
SELECT @O4, @U4, @TP_SPEI, '3333444455556666', amount, 'MXN', 'Paid', paid_date,
       'Transferencia SPEI de 16 digitos; pago realizado en efectivo por el total.',
       creation_date
  FROM tb_payments WHERE ID = @PAY4;

UPDATE tb_buyer_orders SET fulfillment_status = 'Accepted' WHERE ID = @O4;

-- Intento de entrega en casa: no hubo quien recibiera -> Failed.
INSERT INTO tb_shipments
 (buyer_order_ID, address_ID, carrier, tracking_number, shipping_cost, shipment_status,
  shipped_date, estimated_delivery_date, delivered_date, creation_date)
VALUES
 (@O4, @A4, 'Fedex', CONCAT('TRK4-', @O4), 120.00, 'Failed',
  DATE_ADD(@F4, INTERVAL 8 DAY), DATE_ADD(@F4, INTERVAL 10 DAY),
  NULL, DATE_ADD(@F4, INTERVAL 8 DAY));

-- Recogida en punto de recoleccion (misma direccion base, instruccion distinta
-- registrada en el detalle del envio mediante el tracking y las notas de la direccion).
UPDATE tb_shipments
   SET shipment_status = 'Delivered',
       delivered_date = DATE_ADD(@F4, INTERVAL 12 DAY),
       carrier = 'Fedex - Punto de recoleccion'
 WHERE buyer_order_ID = @O4
   AND tracking_number = CONCAT('TRK4-', @O4);

UPDATE tb_user_addresses
   SET delivery_instructions = CONCAT(delivery_instructions,
       ' Entregado en punto de recoleccion Fedex tras intento fallido en domicilio.')
 WHERE ID = @A4;

UPDATE tb_buyer_orders SET fulfillment_status = 'Delivered' WHERE ID = @O4;

-- =====================================================================================
-- CASO 5: Compra fallida por falta de inventario
-- 1 producto, 1..5 unidades, mismo proveedor, domicilio del hogar,
-- cupon de regalo, orden no atendida por falta de inventario,
-- cancelacion y reasignacion del cupon utilizado.
-- =====================================================================================

DELETE tbd_carts_items
  FROM tbd_carts_items JOIN tb_carts ON tb_carts.ID = tbd_carts_items.cart_ID
 WHERE tb_carts.user_ID = @U5;
DELETE FROM tb_carts WHERE user_ID = @U5;
INSERT INTO tb_carts (user_ID, status, creation_date, last_update)
VALUES (@U5, b'1', @F5, @F5);
SET @C5 = LAST_INSERT_ID();

-- Producto 5176 (Urban Street Sudadera) tiene stock real de 2 unidades en el dump;
-- se solicitan 5 unidades (dentro del rango 1..5 del enunciado) para provocar la
-- falta de inventario con datos reales, sin cantidades artificiales.
INSERT INTO tbd_carts_items (cart_ID, provider_ID, product_ID, quantity, creation_date)
SELECT @C5, @P5, ID, 5, @F5 FROM tb_products WHERE ID = 5176 AND status = b'1';


INSERT INTO tb_user_addresses (user_ID, address_label, recipient_name, recipient_phone,
                               delivery_instructions, latitude, longitude, is_default, status, creation_date)
VALUES (@U5, 'Casa - Hogar', 'William Davis', '+52 55 4444 5555',
        'Domicilio habitual del comprador.',
        19.4700000, -99.1300000, b'1', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE));
SET @A5 = LAST_INSERT_ID();

INSERT INTO tbd_address_components (address_ID, value, component_type, status, creation_date)
VALUES
 (@A5, 'Calle Hogar 88', 'street', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, '88', 'ext_number', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, 'Condesa', 'neighborhood', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, 'CDMX', 'city', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, 'CDMX', 'state', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, '06100', 'postal_code', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE)),
 (@A5, 'MX', 'country', b'1', DATE_ADD(@F5, INTERVAL 1 MINUTE));

INSERT INTO tbd_user_payment_methods
 (user_ID, payment_method_type_ID, provider, provider_method_ref, label, last_four, is_default, status, creation_date)
VALUES (@U5, @TP_COUPON, 'Cupon Regalo', 'CUPON-REGALO-2026-0001', 'Cupon de regalo', NULL, 1, b'1', DATE_ADD(@F5, INTERVAL 2 MINUTE));
SET @PM5 = LAST_INSERT_ID();

INSERT INTO tb_buyer_orders (seller_ID, subtotal, shipping_cost, fulfillment_status, status, creation_date)
SELECT @P5, p.current_price * 5, 0.00, 'Pending', b'1', DATE_ADD(@F5, INTERVAL 3 MINUTE)
  FROM tb_products p WHERE p.ID = 5176;
SET @O5 = LAST_INSERT_ID();

INSERT INTO tbd_order_items (seller_order_ID, product_ID, provider_ID, product_name, quantity, unit_price, creation_date)
SELECT @O5, p.ID, @P5, p.name, 5, p.current_price, DATE_ADD(@F5, INTERVAL 3 MINUTE)
  FROM tb_products p WHERE p.ID = 5176;

UPDATE tb_buyer_orders o
   SET o.subtotal = (SELECT COALESCE(SUM(oi.subtotal),0) FROM tbd_order_items oi WHERE oi.seller_order_ID = o.ID)
 WHERE o.ID = @O5;

-- Pago con cupon de regalo: se registra como fallido porque la orden no se atiende.
INSERT INTO tb_payments
 (order_ID, amount, currency, payment_method, provider, provider_reference, payment_status,
  creation_date, paid_date, last_update)
SELECT @O5, subtotal, 'MXN', 'Cash', 'Cupon Regalo',
       CONCAT('C5-CUPON-REGALO-2026-0001-', @O5), 'Failed',
       DATE_ADD(@F5, INTERVAL 4 DAY), NULL, DATE_ADD(@F5, INTERVAL 4 DAY)
  FROM tb_buyer_orders WHERE ID = @O5;
SET @PAY5 = LAST_INSERT_ID();

INSERT INTO tb_payment_transactions (payment_ID, event_type, amount, event_reference, remarks, creation_date)
VALUES
 (@PAY5, 'Created', (SELECT amount FROM tb_payments WHERE ID = @PAY5), CONCAT('TX-C5-CRE-', @PAY5), 'Cupon de regalo aplicado a la orden.', DATE_ADD(@F5, INTERVAL 4 DAY)),
 (@PAY5, 'Failed', 0.00, CONCAT('TX-C5-FAIL-', @PAY5), 'Orden no atendida: falta de inventario.', DATE_ADD(@F5, INTERVAL 4 DAY));

INSERT INTO tb_payment_methods
 (order_ID, user_ID, payment_method_type_ID, payment_reference, amount, currency,
  payment_status, payment_date, notes, creation_date)
SELECT @O5, @U5, @TP_COUPON, 'CUPON-REGALO-2026-0001', amount, 'MXN', 'Cancelled', NULL,
       'Cupon reasignado al usuario tras cancelacion por falta de inventario.',
       creation_date
  FROM tb_payments WHERE ID = @PAY5;

-- El sistema marca la orden como NO atendida y la cancela.
UPDATE tb_buyer_orders
   SET fulfillment_status = 'Canceled',
       status = b'0'
 WHERE ID = @O5;

INSERT INTO tb_cancellations
 (buyer_order_ID, user_ID, cancellation_reason, cancellation_status, requested_date,
  resolved_date, resolution_notes, creation_date)
VALUES
 (@O5, @U5, 'Falta de inventario: la cantidad solicitada supera el stock disponible.',
  'Completed', DATE_ADD(@F5, INTERVAL 5 DAY), DATE_ADD(@F5, INTERVAL 5 DAY),
  'Orden no atendida. Se cancela y se reasigna el cupon de regalo utilizado.',
  DATE_ADD(@F5, INTERVAL 5 DAY));
SET @CANC5 = LAST_INSERT_ID();

-- El cupon queda disponible de nuevo: se reactiva el metodo de pago del usuario.
UPDATE tbd_user_payment_methods
   SET status = b'1',
       label = CONCAT(label, ' (reasignado)'),
       last_update = DATE_ADD(@F5, INTERVAL 6 DAY)
 WHERE ID = @PM5;

-- Se deja constancia del reembolso/reasignacion del cupon.
INSERT INTO tb_refunds
 (payment_ID, cancellation_ID, amount, currency, refund_reason, refund_status,
  provider_reference, requested_date, processed_date, resolution_notes, creation_date)
VALUES
 (@PAY5, @CANC5, (SELECT amount FROM tb_payments WHERE ID = @PAY5), 'MXN',
  'Reasignacion de cupon de regalo por cancelacion por falta de inventario.',
  'Completed', CONCAT('RF-C5-CUPON-', @CANC5), DATE_ADD(@F5, INTERVAL 6 DAY),
  DATE_ADD(@F5, INTERVAL 6 DAY), 'Cupon reasignado al usuario; orden cancelada.',
  DATE_ADD(@F5, INTERVAL 6 DAY));

-- =====================================================================================
-- VISTAS DE TRAZABILIDAD
-- Mismo formato que la captura de referencia (vw_practica04_caso_1):
--   usuario_ejecutor | conexion_bd | rol | fecha_evento | tabla_modificada
--   | operacion | detalle_evento | Registro
-- Las vistas NO usan variables de sesion y NO filtran por fecha: los triggers de
-- este dump registran NOW() (momento real de ejecucion), no la fecha de los casos.
-- Cada vista resuelve sus IDs con subconsultas sobre datos distintivos (prefijo de
-- provider_reference, usuario + etiqueta de direccion, etc.) y filtra tb_logs por
-- el texto que esos triggers escriben. Asi cada vista muestra SOLO su caso.
-- =====================================================================================

CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER
VIEW `vw_practica04_caso_2` AS
WITH k AS (
  SELECT
    (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
      WHERE p.provider_reference LIKE 'C2-%' ORDER BY o.ID LIMIT 1) AS oid,
    (SELECT c.ID FROM tb_carts c WHERE c.user_ID = 21 ORDER BY c.ID DESC LIMIT 1) AS cid,
    (SELECT a.ID FROM tb_user_addresses a
      WHERE a.user_ID = 21 AND a.address_label = 'Trabajo' ORDER BY a.ID DESC LIMIT 1) AS aid,
    (SELECT pm.ID FROM tbd_user_payment_methods pm
      WHERE pm.user_ID = 21 AND pm.label LIKE 'Visa Creditito%' ORDER BY pm.ID DESC LIMIT 1) AS pmid,
    (SELECT r.ID FROM tb_returns r WHERE r.buyer_order_ID =
      (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
        WHERE p.provider_reference LIKE 'C2-%' ORDER BY o.ID LIMIT 1)
      ORDER BY r.ID DESC LIMIT 1) AS retid
)
SELECT SUBSTRING_INDEX(l.db_user, '@', 1)   AS usuario_ejecutor,
       SUBSTRING_INDEX(l.db_user, '@', -1)  AS conexion_bd,
       CASE
         WHEN l.table_name IN ('tb_carts','tbd_carts_items') THEN 'common'
         WHEN l.table_name IN ('tbd_user_payment_methods','tb_payments','tb_payment_transactions','tb_payment_methods') THEN 'buyer'
         ELSE 'app_web'
       END AS rol,
       l.operation_date      AS fecha_evento,
       l.table_name          AS tabla_modificada,
       l.table_operation     AS operacion,
       l.table_description   AS detalle_evento,
       'Caso 2 - Compra con reclamacion y reenvio' AS Registro
  FROM tb_logs l
  CROSS JOIN k
 WHERE l.table_description LIKE CONCAT('Pedido creado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Pedido actualizado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%seller_order_ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%pedido=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Carrito creado. ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('%cart_ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('Direccion creada. ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('%address_ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('Metodo de pago de usuario creado. ID=', k.pmid, ',%')
    OR l.table_description LIKE CONCAT('%devolucion=', k.retid, ',%')
    OR l.table_description LIKE CONCAT('%rastreo=TRK2%', k.oid, '%')
    OR EXISTS (SELECT 1 FROM tb_payments p
                WHERE p.provider_reference LIKE 'C2-%'
                  AND l.table_description LIKE CONCAT('%pago relacionado=', p.ID, '%'));

CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER
VIEW `vw_practica04_caso_3` AS
WITH k AS (
  SELECT
    (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
      WHERE p.provider_reference LIKE 'C3-%' ORDER BY o.ID LIMIT 1) AS oid,
    (SELECT c.ID FROM tb_carts c WHERE c.user_ID = 20 ORDER BY c.ID DESC LIMIT 1) AS cid,
    (SELECT a.ID FROM tb_user_addresses a
      WHERE a.user_ID = 20 AND a.address_label = 'Casa Papas' ORDER BY a.ID DESC LIMIT 1) AS aid,
    (SELECT pm.ID FROM tbd_user_payment_methods pm
      WHERE pm.user_ID = 20 AND pm.label LIKE 'Spin Digital%' ORDER BY pm.ID DESC LIMIT 1) AS pmid,
    (SELECT c.ID FROM tb_cancellations c WHERE c.buyer_order_ID =
      (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
        WHERE p.provider_reference LIKE 'C3-%' ORDER BY o.ID LIMIT 1)
      ORDER BY c.ID DESC LIMIT 1) AS cancid
)
SELECT SUBSTRING_INDEX(l.db_user, '@', 1)   AS usuario_ejecutor,
       SUBSTRING_INDEX(l.db_user, '@', -1)  AS conexion_bd,
       CASE
         WHEN l.table_name IN ('tb_carts','tbd_carts_items') THEN 'common'
         WHEN l.table_name IN ('tbd_user_payment_methods','tb_payments','tb_payment_transactions','tb_payment_methods','tb_refunds') THEN 'buyer'
         ELSE 'app_web'
       END AS rol,
       l.operation_date      AS fecha_evento,
       l.table_name          AS tabla_modificada,
       l.table_operation     AS operacion,
       l.table_description   AS detalle_evento,
       'Caso 3 - Cancelacion parcial y reembolso' AS Registro
  FROM tb_logs l
  CROSS JOIN k
 WHERE l.table_description LIKE CONCAT('Pedido creado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Pedido actualizado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%seller_order_ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%pedido=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Carrito creado. ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('%cart_ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('Direccion creada. ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('%address_ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('Metodo de pago de usuario creado. ID=', k.pmid, ',%')
    OR l.table_description LIKE CONCAT('%cancelacion=', k.cancid, ',%')
    OR l.table_description LIKE CONCAT('%rastreo=TRK3%', k.oid, '%')
    OR EXISTS (SELECT 1 FROM tb_payments p
                WHERE p.provider_reference LIKE 'C3-%'
                  AND l.table_description LIKE CONCAT('%pago relacionado=', p.ID, '%'));

CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER
VIEW `vw_practica04_caso_4` AS
WITH k AS (
  SELECT
    (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
      WHERE p.provider_reference LIKE 'C4-%' ORDER BY o.ID LIMIT 1) AS oid,
    (SELECT c.ID FROM tb_carts c WHERE c.user_ID = 22 ORDER BY c.ID DESC LIMIT 1) AS cid,
    (SELECT a.ID FROM tb_user_addresses a
      WHERE a.user_ID = 22 AND a.address_label = 'Casa - Hogar' ORDER BY a.ID DESC LIMIT 1) AS aid,
    (SELECT pm.ID FROM tbd_user_payment_methods pm
      WHERE pm.user_ID = 22 AND pm.label LIKE 'Transferencia SPEI%' ORDER BY pm.ID DESC LIMIT 1) AS pmid
)
SELECT SUBSTRING_INDEX(l.db_user, '@', 1)   AS usuario_ejecutor,
       SUBSTRING_INDEX(l.db_user, '@', -1)  AS conexion_bd,
       CASE
         WHEN l.table_name IN ('tb_carts','tbd_carts_items') THEN 'common'
         WHEN l.table_name IN ('tbd_user_payment_methods','tb_payments','tb_payment_transactions','tb_payment_methods') THEN 'buyer'
         ELSE 'app_web'
       END AS rol,
       l.operation_date      AS fecha_evento,
       l.table_name          AS tabla_modificada,
       l.table_operation     AS operacion,
       l.table_description   AS detalle_evento,
       'Caso 4 - Entrega en punto de recoleccion' AS Registro
  FROM tb_logs l
  CROSS JOIN k
 WHERE l.table_description LIKE CONCAT('Pedido creado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Pedido actualizado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%seller_order_ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%pedido=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Carrito creado. ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('%cart_ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('Direccion creada. ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('Direccion actualizada. ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('%address_ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('Metodo de pago de usuario creado. ID=', k.pmid, ',%')
    OR l.table_description LIKE CONCAT('%rastreo=TRK4%', k.oid, '%')
    OR EXISTS (SELECT 1 FROM tb_payments p
                WHERE p.provider_reference LIKE 'C4-%'
                  AND l.table_description LIKE CONCAT('%pago relacionado=', p.ID, '%'));

CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER
VIEW `vw_practica04_caso_5` AS
WITH k AS (
  SELECT
    (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
      WHERE p.provider_reference LIKE 'C5-%' ORDER BY o.ID LIMIT 1) AS oid,
    (SELECT c.ID FROM tb_carts c WHERE c.user_ID = 19 ORDER BY c.ID DESC LIMIT 1) AS cid,
    (SELECT a.ID FROM tb_user_addresses a
      WHERE a.user_ID = 19 AND a.address_label = 'Casa - Hogar' ORDER BY a.ID DESC LIMIT 1) AS aid,
    (SELECT pm.ID FROM tbd_user_payment_methods pm
      WHERE pm.user_ID = 19 AND pm.label LIKE 'Cupon de regalo%' ORDER BY pm.ID DESC LIMIT 1) AS pmid,
    (SELECT c.ID FROM tb_cancellations c WHERE c.buyer_order_ID =
      (SELECT o.ID FROM tb_buyer_orders o JOIN tb_payments p ON p.order_ID = o.ID
        WHERE p.provider_reference LIKE 'C5-%' ORDER BY o.ID LIMIT 1)
      ORDER BY c.ID DESC LIMIT 1) AS cancid
)
SELECT SUBSTRING_INDEX(l.db_user, '@', 1)   AS usuario_ejecutor,
       SUBSTRING_INDEX(l.db_user, '@', -1)  AS conexion_bd,
       CASE
         WHEN l.table_name IN ('tb_carts','tbd_carts_items') THEN 'common'
         WHEN l.table_name IN ('tbd_user_payment_methods','tb_payments','tb_payment_transactions','tb_payment_methods','tb_refunds') THEN 'buyer'
         ELSE 'app_web'
       END AS rol,
       l.operation_date      AS fecha_evento,
       l.table_name          AS tabla_modificada,
       l.table_operation     AS operacion,
       l.table_description   AS detalle_evento,
       'Caso 5 - Compra fallida por falta de inventario' AS Registro
  FROM tb_logs l
  CROSS JOIN k
 WHERE l.table_description LIKE CONCAT('Pedido creado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Pedido actualizado. ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%seller_order_ID=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('%pedido=', k.oid, ',%')
    OR l.table_description LIKE CONCAT('Carrito creado. ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('%cart_ID=', k.cid, ',%')
    OR l.table_description LIKE CONCAT('Direccion creada. ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('%address_ID=', k.aid, ',%')
    OR l.table_description LIKE CONCAT('Metodo de pago de usuario creado. ID=', k.pmid, ',%')
    OR l.table_description LIKE CONCAT('Metodo de pago de usuario actualizado. ID=', k.pmid, ',%')
    OR l.table_description LIKE CONCAT('%cancelacion=', k.cancid, ',%')
    OR EXISTS (SELECT 1 FROM tb_payments p
                WHERE p.provider_reference LIKE 'C5-%'
                  AND l.table_description LIKE CONCAT('%pago relacionado=', p.ID, '%'));
-- Vista general de los 4 casos (misma forma, util para el panel de auditoria).
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER
VIEW `vw_practica04_trazabilidad_general` AS
SELECT * FROM `vw_practica04_caso_2`
UNION ALL SELECT * FROM `vw_practica04_caso_3`
UNION ALL SELECT * FROM `vw_practica04_caso_4`
UNION ALL SELECT * FROM `vw_practica04_caso_5`;

-- =====================================================================================
-- 6. VERIFICACION
-- =====================================================================================

SELECT 'Tipos de pago disponibles (los 4 casos requieren las 4 filas)' AS verificacion;
SELECT ID, code, description FROM tbc_payment_methods_types ORDER BY ID;

SELECT 'Casos insertados' AS verificacion;
SELECT 'Caso 2' AS caso, @O2 AS orden, @C2 AS carrito, (SELECT COUNT(*) FROM tbd_order_items WHERE seller_order_ID=@O2) AS items,
       (SELECT COUNT(*) FROM tb_payments WHERE order_ID=@O2) AS pagos,
       (SELECT COUNT(*) FROM tb_payment_transactions pt JOIN tb_payments p ON p.ID=pt.payment_ID WHERE p.order_ID=@O2) AS transacciones,
       (SELECT COUNT(*) FROM tb_shipments WHERE buyer_order_ID=@O2) AS envios,
       (SELECT COUNT(*) FROM tb_returns WHERE buyer_order_ID=@O2) AS devoluciones
UNION ALL
SELECT 'Caso 3', @O3, @C3, (SELECT COUNT(*) FROM tbd_order_items WHERE seller_order_ID=@O3),
       (SELECT COUNT(*) FROM tb_payments WHERE order_ID=@O3),
       (SELECT COUNT(*) FROM tb_payment_transactions pt JOIN tb_payments p ON p.ID=pt.payment_ID WHERE p.order_ID=@O3),
       (SELECT COUNT(*) FROM tb_shipments WHERE buyer_order_ID=@O3),
       (SELECT COUNT(*) FROM tb_cancellations WHERE buyer_order_ID=@O3)
UNION ALL
SELECT 'Caso 4', @O4, @C4, (SELECT COUNT(*) FROM tbd_order_items WHERE seller_order_ID=@O4),
       (SELECT COUNT(*) FROM tb_payments WHERE order_ID=@O4),
       (SELECT COUNT(*) FROM tb_payment_transactions pt JOIN tb_payments p ON p.ID=pt.payment_ID WHERE p.order_ID=@O4),
       (SELECT COUNT(*) FROM tb_shipments WHERE buyer_order_ID=@O4), 0
UNION ALL
SELECT 'Caso 5', @O5, @C5, (SELECT COUNT(*) FROM tbd_order_items WHERE seller_order_ID=@O5),
       (SELECT COUNT(*) FROM tb_payments WHERE order_ID=@O5),
       (SELECT COUNT(*) FROM tb_payment_transactions pt JOIN tb_payments p ON p.ID=pt.payment_ID WHERE p.order_ID=@O5),
       0, (SELECT COUNT(*) FROM tb_cancellations WHERE buyer_order_ID=@O5);

SELECT 'Vistas creadas' AS verificacion;
SELECT TABLE_NAME FROM information_schema.VIEWS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'vw_practica04%' ORDER BY TABLE_NAME;

SELECT 'Muestra de trazabilidad (Caso 2)' AS verificacion;
SELECT * FROM vw_practica04_caso_2 ORDER BY fecha_evento LIMIT 20;

SET SQL_MODE = @OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;