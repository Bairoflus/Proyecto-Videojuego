-- Test data script for shop-purchase endpoint testing
-- Execute this in ProjectShatteredTimeline database

USE ProjectShatteredTimeline;

-- 1. Insert item_types if not exist
INSERT IGNORE INTO item_types (item_type) VALUES 
('health_potion'),
('weapon'),
('armor'),
('consumable'),
('upgrade');

-- 2. Insert room_types if not exist (needed for rooms)
INSERT IGNORE INTO room_types (room_type) VALUES 
('shop'), ('combat'), ('boss'), ('entrance');

-- 3. Insert test rooms if not exist
INSERT IGNORE INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES 
(1, 1, 'Entrance Room', 'entrance', 1),
(2, 1, 'Shop Room 1', 'shop', 2), 
(3, 1, 'Combat Room 1', 'combat', 3),
(4, 1, 'Shop Room 2', 'shop', 4);

-- 4. Create test user if not exists
INSERT IGNORE INTO users (user_id, username, email, password_hash) VALUES
(99, 'testuser_shop', 'shop@test.com', '$2b$10$hashedpassword');

-- 5. Show available test data
SELECT 'TEST DATA SUMMARY:' as info;

SELECT 'ITEM TYPES:' as section;
SELECT item_type FROM item_types;

SELECT 'ROOMS:' as section;
SELECT room_id, name, room_type FROM rooms WHERE room_type = 'shop' LIMIT 5;

SELECT 'TEST USER:' as section;
SELECT user_id, username FROM users WHERE user_id = 99;

-- Test data for endpoint:
-- Create test run: POST /api/runs with userId: 99
-- runId: (will be generated)
-- userId: 99
-- roomId: 2 (Shop Room 1)
-- itemType: 'health_potion'
-- itemName: 'Health Potion'
-- goldSpent: 80 