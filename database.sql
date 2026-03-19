CREATE DATABASE IF NOT EXISTS gym_crud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_crud;

-- Tabla de Usuarios (Clientes del Gimnasio)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    emergencyContact VARCHAR(100),
    subscriptionType ENUM('monthly', 'annual') NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expirationDate DATETIME NOT NULL
);

-- Tabla de Empleados
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar empleado y admin por defecto
INSERT IGNORE INTO employees (id, name, username, password) 
VALUES 
('A0000', 'Administrador Principal', 'admin', '1234'),
('T0000', 'Trabajador Demo', 'trabajador', '1234');

-- Tabla de Precios
CREATE TABLE IF NOT EXISTS prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    annual DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar precios por defecto
INSERT INTO prices (monthly, annual) 
SELECT 500.00, 5000.00 
WHERE NOT EXISTS (SELECT 1 FROM prices);

-- Tabla de Visitas (Historial)
CREATE TABLE IF NOT EXISTS visits (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    userName VARCHAR(100) NOT NULL,
    role ENUM('user', 'employee', 'visitor') NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Ventas
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    productId INT NOT NULL,
    productName VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    soldBy VARCHAR(100) NOT NULL,
    paymentType ENUM('efectivo', 'transferencia') NOT NULL DEFAULT 'efectivo',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
);

-- Tabla de Donaciones
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(50) PRIMARY KEY,
    productId INT NOT NULL,
    productName VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    donatedBy VARCHAR(100) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
);
