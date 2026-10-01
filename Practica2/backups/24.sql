CREATE DATABASE  IF NOT EXISTS `db_test_7b` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_test_7b`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_test_7b
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `db_users`
--

DROP TABLE IF EXISTS `db_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `db_users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `nick` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_update` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `status` bit(1) DEFAULT b'1',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `nick` (`nick`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `db_users`
--

LOCK TABLES `db_users` WRITE;
/*!40000 ALTER TABLE `db_users` DISABLE KEYS */;
INSERT INTO `db_users` VALUES (4,'nova25.lucas@gmail.com','Osmar-Updated','25d55ad283aa400af464c76d713c07ad','2026-09-10 10:16:56',NULL,NULL,_binary ''),(5,'jorgeeloy@gmail.com','Jorge Eloy','292aa657650bcfde72287a6d32cfebbe','2026-09-10 10:17:43',NULL,NULL,_binary ''),(6,'240145@utxicotepec.edu.mx','Obed','25d55ad283aa400af464c76d713c07ad','2026-09-10 10:58:15',NULL,NULL,_binary ''),(8,'240148@utxicotepec.edu.mx','Obed-Updated','25d55ad283aa400af464c76d713c07ad','2026-09-10 10:59:59',NULL,NULL,_binary ''),(10,'obed@example.com','obedV','12345678','2026-09-17 10:55:11',NULL,NULL,_binary ''),(11,'yaneth@example.com','YG','12345678','2026-09-17 10:55:11',NULL,NULL,_binary ''),(12,'dorian@example.com','dorianV','12345678','2026-09-17 10:55:11',NULL,NULL,_binary '');
/*!40000 ALTER TABLE `db_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_users_after_insert` AFTER INSERT ON `db_users` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'db_users',
        'Create',
        USER(),
        CONCAT(
            'Usuario Creado. ID=', NEW.ID,
            ', email=', NEW.email,
            ', nick=', NEW.nick,
            ', creation_date=', NEW.creation_date,
            ', status=', NEW.status
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_users_after_update` AFTER UPDATE ON `db_users` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'db_users',
        'Update',
        USER(),
        CONCAT(
            'Usuario Actualizado. ID=', NEW.ID,
            ', email: [', OLD.email, '] -> [', NEW.email, ']',
            ', nick: [', OLD.nick, '] -> [', NEW.nick, ']',
            ', creation_date: [', OLD.creation_date, '] -> [', NEW.creation_date, ']',
            ', status: [', OLD.status, '] -> [', NEW.status, ']'
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_users_after_delete` AFTER DELETE ON `db_users` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'db_users',
        'Delete',
        USER(),
        CONCAT(
            'Usuario Eliminado. ID=', OLD.ID,
            ', email=', OLD.email,
            ', nick=', OLD.nick,
            ', creation_date=', OLD.creation_date,
            ', status=', OLD.status
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tb_logs`
--

DROP TABLE IF EXISTS `tb_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_logs` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `table_name` varchar(80) NOT NULL,
  `table_operation` enum('Create','Read','Update','Delete') DEFAULT NULL,
  `db_user` varchar(80) NOT NULL,
  `operation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `table_description` text NOT NULL,
  `operation_status` bit(1) DEFAULT b'1',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_logs`
--

LOCK TABLES `tb_logs` WRITE;
/*!40000 ALTER TABLE `tb_logs` DISABLE KEYS */;
INSERT INTO `tb_logs` VALUES (1,'db_users','Create','root@localhost','2026-09-10 10:14:16','Usuario Creado. ID=3, email=240036@utxicotepec.edu.mx, nick=ING-Gaelzinn, creation_date=2026-09-10 10:14:16, status=',_binary ''),(2,'db_users','Create','root@localhost','2026-09-10 10:16:56','Usuario Creado. ID=4, email=nova25.lucas@gmail.com, nick=Osmar Ortega, creation_date=2026-09-10 10:16:56, status=',_binary ''),(3,'db_users','Create','root@localhost','2026-09-10 10:17:43','Usuario Creado. ID=5, email=jorgeeloy@gmail.com, nick=Jorge Eloy, creation_date=2026-09-10 10:17:43, status=',_binary ''),(4,'db_users','Create','Obed@PC-06','2026-09-10 10:58:15','Usuario Creado. ID=6, email=240145@utxicotepec.edu.mx, nick=Obed, creation_date=2026-09-10 10:58:15, status=',_binary ''),(5,'db_users','Create','Obed@PC-06','2026-09-10 10:59:59','Usuario Creado. ID=8, email=240148@utxicotepec.edu.mx, nick=Valeria, creation_date=2026-09-10 10:59:59, status=',_binary ''),(6,'db_users','Create','Obed@PC-06','2026-09-10 11:00:05','Usuario Creado. ID=9, email=240149@utxicotepec.edu.mx, nick=Santiago, creation_date=2026-09-10 11:00:05, status=',_binary ''),(7,'db_users','Update','root@localhost','2026-09-10 12:42:58','Usuario Actualizado. ID=4, email: [nova25.lucas@gmail.com] -> [nova25.lucas@gmail.com], nick: [Osmar Ortega] -> [Osmar-Updated], creation_date: [2026-09-10 10:16:56] -> [2026-09-10 10:16:56], status: [] -> []',_binary ''),(8,'db_users','Delete','root@localhost','2026-09-10 12:44:50','Usuario Eliminado. ID=3, email=240036@utxicotepec.edu.mx, nick=ING-Gaelzinn, creation_date=2026-09-10 10:14:16, status=',_binary ''),(9,'db_users','Delete','Obed@PC-06','2026-09-10 12:45:54','Usuario Eliminado. ID=9, email=240149@utxicotepec.edu.mx, nick=Santiago, creation_date=2026-09-10 11:00:05, status=',_binary ''),(10,'db_users','Update','Obed@PC-06','2026-09-10 12:46:47','Usuario Actualizado. ID=8, email: [240148@utxicotepec.edu.mx] -> [240148@utxicotepec.edu.mx], nick: [Valeria] -> [Obed-Updated], creation_date: [2026-09-10 10:59:59] -> [2026-09-10 10:59:59], status: [] -> []',_binary ''),(11,'db_users','Create','obed.vargas@DESKTOP-978SUTP','2026-09-17 10:55:11','Usuario Creado. ID=10, email=obed@example.com, nick=obedV, creation_date=2026-09-17 10:55:11, status=',_binary ''),(12,'db_users','Create','obed.vargas@DESKTOP-978SUTP','2026-09-17 10:55:11','Usuario Creado. ID=11, email=yaneth@example.com, nick=YG, creation_date=2026-09-17 10:55:11, status=',_binary ''),(13,'db_users','Create','obed.vargas@DESKTOP-978SUTP','2026-09-17 10:55:11','Usuario Creado. ID=12, email=dorian@example.com, nick=dorianV, creation_date=2026-09-17 10:55:11, status=',_binary ''),(14,'tb_products','Create','root@localhost','2026-09-17 12:37:18','Producto creado. ID=5,SKU=PROD-001,name=Smartphone Galaxy S23,price=15000.00,stock=10,status=',_binary ''),(15,'tb_products','Create','root@localhost','2026-09-17 12:37:18','Producto creado. ID=6,SKU=PROD-002,name=Laptop Lenovo IdeaPad,price=12500.00,stock=8,status=',_binary ''),(16,'tb_products','Create','jorge.lopez@PC-06','2026-09-17 13:21:05','Producto creado. ID=7,SKU=PROD-003,name=Audífonos Bluetooth,price=850.00,stock=20,status=',_binary ''),(17,'tb_products','Create','jorge.lopez@PC-06','2026-09-17 13:21:05','Producto creado. ID=8,SKU=PROD-004,name=Teclado Mecánico,price=1200.00,stock=15,status=',_binary ''),(18,'tb_products','Create','jorge.lopez@PC-06','2026-09-17 13:21:05','Producto creado. ID=9,SKU=PROD-005,name=Mouse Gamer,price=650.00,stock=25,status=',_binary ''),(19,'tb_products','Create','jorge.lopez@PC-06','2026-09-17 13:21:05','Producto creado. ID=10,SKU=PROD-006,name=Monitor 24 Pulgadas,price=3200.00,stock=12,status=',_binary ''),(20,'tb_products','Create','jorge.lopez@PC-06','2026-09-17 13:21:05','Producto creado. ID=11,SKU=PROD-007,name=Bocina Bluetooth,price=1100.00,stock=18,status=',_binary ''),(21,'tb_products','Update','root@localhost','2026-09-17 13:29:47','Producto modificado. ID=5 | Nombre: Smartphone Galaxy S23 -> Smartphone Galaxy S23 | Precio: 15000.00 -> 15000.00 | Stock: 10 -> 10',_binary ''),(22,'tb_products','Update','root@localhost','2026-09-17 13:30:51','Producto modificado. ID=5 | Nombre: Smartphone Galaxy S23 -> Smartphone Galaxy S23 | Precio: 15000.00 -> 15000.00 | Stock: 10 -> 10',_binary '');
/*!40000 ALTER TABLE `tb_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_products`
--

DROP TABLE IF EXISTS `tb_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_products` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `SKU` varchar(50) NOT NULL,
  `name` varchar(250) NOT NULL,
  `description` text,
  `current_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `current_stock` int unsigned NOT NULL DEFAULT '0',
  `status` bit(1) DEFAULT b'1',
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_update` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `SKU` (`SKU`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_products`
--

LOCK TABLES `tb_products` WRITE;
/*!40000 ALTER TABLE `tb_products` DISABLE KEYS */;
INSERT INTO `tb_products` VALUES (5,'PROD-001','Smartphone Galaxy S23','Smartphone Samsung Galaxy S23',15000.00,10,_binary '','2026-09-17 12:37:18','2026-09-17 13:30:51'),(6,'PROD-002','Laptop Lenovo IdeaPad','Laptop Lenovo para uso escolar y profesional',12500.00,8,_binary '','2026-09-17 12:37:18','2026-09-17 12:37:18'),(7,'PROD-003','Audífonos Bluetooth','Audífonos inalámbricos con conexión Bluetooth',850.00,20,_binary '','2026-09-17 13:21:05','2026-09-17 13:21:05'),(8,'PROD-004','Teclado Mecánico','Teclado mecánico para computadora',1200.00,15,_binary '','2026-09-17 13:21:05','2026-09-17 13:21:05'),(9,'PROD-005','Mouse Gamer','Mouse óptico para videojuegos',650.00,25,_binary '','2026-09-17 13:21:05','2026-09-17 13:21:05'),(10,'PROD-006','Monitor 24 Pulgadas','Monitor LED de 24 pulgadas para computadora',3200.00,12,_binary '','2026-09-17 13:21:05','2026-09-17 13:21:05'),(11,'PROD-007','Bocina Bluetooth','Bocina portátil inalámbrica con conexión Bluetooth',1100.00,18,_binary '','2026-09-17 13:21:05','2026-09-17 13:21:05');
/*!40000 ALTER TABLE `tb_products` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_products_after_insert` AFTER INSERT ON `tb_products` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'tb_products',
        'Create',
        USER(),
        CONCAT(
            'Producto creado. ID=', NEW.ID,
            ',SKU=', NEW.SKU,
            ',name=', NEW.name,
            ',price=', NEW.current_price,
            ',stock=', NEW.current_stock,
            ',status=', NEW.status
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_products_after_update` AFTER UPDATE ON `tb_products` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'tb_products',
        'Update',
        USER(),
        CONCAT(
            'Producto modificado. ID=', NEW.ID,
            ' | Nombre: ', OLD.name, ' -> ', NEW.name,
            ' | Precio: ', OLD.current_price, ' -> ', NEW.current_price,
            ' | Stock: ', OLD.current_stock, ' -> ', NEW.current_stock
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_products_after_delete` AFTER DELETE ON `tb_products` FOR EACH ROW BEGIN
    INSERT INTO tb_logs (
        table_name,
        table_operation,
        db_user,
        table_description,
        operation_date,
        operation_status
    )
    VALUES (
        'tb_products',
        'Delete',
        USER(),
        CONCAT(
            'Producto eliminado. ID=', OLD.ID,
            ',SKU=', OLD.SKU,
            ',name=', OLD.name
        ),
        CURRENT_TIMESTAMP,
        b'1'
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `vw_trazabilidad_productos`
--

DROP TABLE IF EXISTS `vw_trazabilidad_productos`;
/*!50001 DROP VIEW IF EXISTS `vw_trazabilidad_productos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_trazabilidad_productos` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `inserted_by`,
 1 AS `roles`,
 1 AS `table_description`,
 1 AS `operation_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'db_test_7b'
--

--
-- Dumping routines for database 'db_test_7b'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_restore_product` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_restore_product`(
    IN p_product_id INT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM tb_products
        WHERE ID = p_product_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El producto especificado no existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tb_products
        WHERE ID = p_product_id
          AND status = b'1'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El producto ya se encuentra activo';
    END IF;

    UPDATE tb_products
    SET status = b'1'
    WHERE ID = p_product_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_soft_delete_product` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_soft_delete_product`(
    IN p_product_id INT UNSIGNED
)
BEGIN

    
    IF NOT EXISTS (
        SELECT 1
        FROM tb_products
        WHERE ID = p_product_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El producto especificado no existe';
    END IF;

    
    IF EXISTS (
        SELECT 1
        FROM tb_products
        WHERE ID = p_product_id
            AND status = b'0'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El producto ya se encuentra eliminado';
    END IF;

    
    UPDATE tb_products
    SET status = b'0'
    WHERE ID = p_product_id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_trazabilidad_productos`
--

/*!50001 DROP VIEW IF EXISTS `vw_trazabilidad_productos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_trazabilidad_productos` AS select `p`.`ID` AS `id`,`p`.`name` AS `name`,`p`.`description` AS `description`,`b`.`db_user` AS `inserted_by`,coalesce(group_concat(distinct `re`.`FROM_USER` order by `re`.`FROM_USER` ASC separator ', '),'Sin rol') AS `roles`,`b`.`table_description` AS `table_description`,`b`.`operation_date` AS `operation_date` from ((`tb_products` `p` join `tb_logs` `b` on((`b`.`table_description` like concat('%ID=',`p`.`ID`,'%')))) left join `mysql`.`role_edges` `re` on((`re`.`TO_USER` = substring_index(`b`.`db_user`,'@',1)))) where ((`b`.`table_operation` = 'Create') and (`b`.`table_name` = 'tb_products')) group by `p`.`ID`,`p`.`name`,`p`.`description`,`b`.`db_user`,`b`.`table_description`,`b`.`operation_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 13:02:00
