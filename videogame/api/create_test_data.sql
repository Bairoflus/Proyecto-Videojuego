-- Script para crear datos de prueba para testing del save-state endpoint
-- Este script debe ejecutarse en la base de datos ProjectShatteredTimeline

USE ProjectShatteredTimeline;

-- 1. Insertar tipos de rooms si no existen
INSERT IGNORE INTO room_types (room_type) VALUES 
('combat'), ('shop'), ('boss'), ('entrance');

-- 2. Insertar rooms de prueba
INSERT IGNORE INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES 
(1, 1, 'Entrance Room', 'entrance', 1),
(2, 1, 'Combat Room 1', 'combat', 2), 
(3, 1, 'Combat Room 2', 'combat', 3),
(4, 1, 'Shop Room', 'shop', 4),
(5, 1, 'Boss Room', 'boss', 5);

-- 3. Verificar session_id real para el usuario que acabamos de crear
-- El session_id es un AUTO_INCREMENT, así que debería ser el más reciente
SELECT session_id, user_id, session_token FROM sessions 
WHERE user_id = 20 
ORDER BY session_id DESC 
LIMIT 1;

-- 4. Mostrar datos disponibles para testing
SELECT 'ROOMS DISPONIBLES:' as info;
SELECT room_id, name, room_type FROM rooms LIMIT 5;

SELECT 'SESSIONS DISPONIBLES:' as info;
SELECT session_id, user_id FROM sessions WHERE user_id = 20;

SELECT 'RUNS ACTIVOS:' as info;
SELECT run_id, user_id, started_at FROM run_history 
WHERE ended_at IS NULL AND completed = FALSE 
ORDER BY run_id DESC LIMIT 5; 