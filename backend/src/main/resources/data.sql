INSERT INTO products SELECT 'MUG', 'Ceramic mug', 12 WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MUG');
INSERT INTO products SELECT 'TOTE', 'Canvas tote', 8 WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TOTE');
