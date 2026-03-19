USE gym_crud;
UPDATE visits SET timestamp = DATE_SUB(timestamp, INTERVAL 7 HOUR) WHERE role = 'visitor' AND timestamp > '2026-03-18 00:00:00';
