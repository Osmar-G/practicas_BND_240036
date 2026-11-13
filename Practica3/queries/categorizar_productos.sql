USE db_test_7b;

DROP TEMPORARY TABLE IF EXISTS tmp_product_category_map;
CREATE TEMPORARY TABLE tmp_product_category_map (
    product_Id INT UNSIGNED NOT NULL,
    category_Id INT UNSIGNED NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    product_name VARCHAR(250) NOT NULL,
    KEY (product_Id),
    KEY (category_Id)
);

LOAD DATA LOCAL INFILE 'C:/Users/osmar/OneDrive/Documentos/practicas_BND_240036/Practica3/seeds/categorizacion_productos.csv'
INTO TABLE tmp_product_category_map
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(product_Id, category_Id, category_name, product_name);

SELECT
    COUNT(*) AS csv_rows,
    COUNT(DISTINCT product_Id) AS products_in_csv
FROM tmp_product_category_map;

SELECT
    m.product_Id,
    m.category_Id,
    m.category_name,
    m.product_name,
    p.name AS backup_product_name,
    c.name AS backup_category_name
FROM tmp_product_category_map AS m
LEFT JOIN tb_products AS p ON p.ID = m.product_Id
LEFT JOIN tbc_categories AS c ON c.ID = m.category_Id
WHERE p.ID IS NULL
   OR c.ID IS NULL
   OR p.name <> m.product_name
   OR c.name <> m.category_name;

SELECT COUNT(*) AS products_without_csv_mapping
FROM tb_products AS p
LEFT JOIN (
    SELECT DISTINCT product_Id
    FROM tmp_product_category_map
) AS m ON m.product_Id = p.ID
WHERE m.product_Id IS NULL;

START TRANSACTION;

DELETE pc
FROM tbd_products_categories AS pc
JOIN (
    SELECT DISTINCT product_Id
    FROM tmp_product_category_map
) AS m ON m.product_Id = pc.product_Id;

INSERT INTO tbd_products_categories
    (product_Id, category_Id, status, creation_date, last_update)
WITH RECURSIVE category_path AS (
    SELECT DISTINCT
        m.product_Id,
        c.ID AS category_Id,
        c.sup_id_category AS parent_category_Id
    FROM tmp_product_category_map AS m
    JOIN tb_products AS p ON p.ID = m.product_Id AND p.name = m.product_name
    JOIN tbc_categories AS c
        ON c.ID = m.category_Id
       AND c.name = m.category_name

    UNION ALL

    SELECT
        path.product_Id,
        parent.ID AS category_Id,
        parent.sup_id_category AS parent_category_Id
    FROM category_path AS path
    JOIN tbc_categories AS parent ON parent.ID = path.parent_category_Id
)
SELECT DISTINCT
    product_Id,
    category_Id,
    b'1',
    CURRENT_TIMESTAMP,
    NULL
FROM category_path;

COMMIT;

SELECT
    pc.product_Id,
    p.name AS product_name,
    GROUP_CONCAT(c.name ORDER BY c.ID SEPARATOR ' > ') AS assigned_categories
FROM tbd_products_categories AS pc
JOIN tb_products AS p ON p.ID = pc.product_Id
JOIN tbc_categories AS c ON c.ID = pc.category_Id
WHERE pc.product_Id IN (
    SELECT DISTINCT product_Id
    FROM tmp_product_category_map
)
GROUP BY pc.product_Id, p.name
ORDER BY pc.product_Id;
