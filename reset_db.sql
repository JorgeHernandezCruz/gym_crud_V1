USE gym_crud;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE donations;
TRUNCATE TABLE employees;
TRUNCATE TABLE products;
TRUNCATE TABLE promotions;
TRUNCATE TABLE sales;
TRUNCATE TABLE users;
TRUNCATE TABLE visits;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO employees (id, name, username, password) 
VALUES ('A0000', 'Admin', 'Admin', 'Gymadmin');
