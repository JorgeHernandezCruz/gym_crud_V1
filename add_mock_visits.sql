USE gym_crud;

-- Limpiar visitas antiguas de estos usuarios para tener cálculos claros
DELETE FROM visits WHERE userId IN ('T0000', 'T2228', 'T1786') AND role = 'employee';

-- Insertar Hoy para T0000 (Trabajador Demo): 8h
INSERT INTO visits (id, userId, userName, role, note, timestamp) VALUES 
('MOCK-1', 'T0000', 'Trabajador Demo', 'employee', 'Entrada', '2026-03-17 08:00:00'),
('MOCK-2', 'T0000', 'Trabajador Demo', 'employee', 'Salida', '2026-03-17 16:00:00');

-- Insertar Ayer para T0000 (Trabajador Demo): 5h 30m
INSERT INTO visits (id, userId, userName, role, note, timestamp) VALUES 
('MOCK-3', 'T0000', 'Trabajador Demo', 'employee', 'Entrada', '2026-03-16 09:00:00'),
('MOCK-4', 'T0000', 'Trabajador Demo', 'employee', 'Salida', '2026-03-16 14:30:00');

-- Insertar Este Mes (5 de Marzo) para T0000: 9h 15m
INSERT INTO visits (id, userId, userName, role, note, timestamp) VALUES 
('MOCK-5', 'T0000', 'Trabajador Demo', 'employee', 'Entrada', '2026-03-05 10:00:00'),
('MOCK-6', 'T0000', 'Trabajador Demo', 'employee', 'Salida', '2026-03-05 19:15:00');

-- Insertar Hoy para T2228 (Eduardo): 6h 30m
INSERT INTO visits (id, userId, userName, role, note, timestamp) VALUES 
('MOCK-7', 'T2228', 'Eduardo', 'employee', 'Entrada', '2026-03-17 07:15:00'),
('MOCK-8', 'T2228', 'Eduardo', 'employee', 'Salida', '2026-03-17 13:45:00');

-- Insertar Hoy (Aún Trabajando, sin salida) para T1786 (ale): ~7h 30m acumuladas
INSERT INTO visits (id, userId, userName, role, note, timestamp) VALUES 
('MOCK-9', 'T1786', 'ale', 'employee', 'Entrada', '2026-03-17 12:00:00');
