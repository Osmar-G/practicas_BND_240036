LOAD DATA LOCAL INFILE 'C:/Users/ti_la/Documents/practicas_BND_240036/Practica3/seeds/categorias_ecommerce_100 (1).csv'
INTO TABLE tbc_categorias
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(
    ID,name, description, sup_id_category, @status
)
SET status = IF(@status = '1', b'1', b'0');