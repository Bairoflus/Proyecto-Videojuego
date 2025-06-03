-- Test data script for enemy-kill endpoint testing
-- Execute this in ProjectShatteredTimeline database

USE ProjectShatteredTimeline;

-- 1. Insert room_types if not exist
INSERT IGNORE INTO room_types (room_type) VALUES 
('combat'), ('shop'), ('boss'), ('entrance');

-- 2. Insert test rooms
INSERT IGNORE INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES 
(1, 1, 'Entrance Room', 'entrance', 1),
(2, 1, 'Combat Room 1', 'combat', 2), 
(3, 1, 'Combat Room 2', 'combat', 3),
(4, 1, 'Shop Room', 'shop', 4),
(5, 1, 'Boss Room', 'boss', 5);

-- 3. Insert test enemy types
INSERT IGNORE INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range) VALUES 
(1, 'Goblin Warrior', 1, FALSE, 50, 10, 100, 2, 30),
(2, 'Orc Archer', 1, FALSE, 40, 15, 80, 3, 60),
(3, 'Skeleton Mage', 1, TRUE, 30, 20, 60, 4, 80),
(4, 'Dragon Boss', 1, FALSE, 500, 50, 50, 1, 100);

-- 4. Create test user if not exists
INSERT IGNORE INTO users (user_id, username, email, password_hash) VALUES
(99, 'testuser_enemykill', 'enemykill@test.com', '$2b$10$hashedpassword');

-- 5. Create test run for enemy kill testing
INSERT INTO run_history (run_id, user_id, started_at) VALUES
(999, 99, NOW());

-- 6. Show available test data
SELECT 'TEST DATA SUMMARY:' as info;

SELECT 'ENEMY TYPES:' as section;
SELECT enemy_id, name, floor FROM enemy_types;

SELECT 'ROOMS:' as section;
SELECT room_id, name, room_type FROM rooms LIMIT 5;

SELECT 'TEST USER:' as section;
SELECT user_id, username FROM users WHERE user_id = 99;

SELECT 'TEST RUN:' as section;
SELECT run_id, user_id, started_at, ended_at FROM run_history WHERE run_id = 999;

-- Test data for endpoint:
-- runId: 999
-- userId: 99
-- enemyId: 1 (Goblin Warrior)
-- roomId: 2 (Combat Room 1) 