-- =================================================================
-- COMPLEMENTARY SAMPLE DATA FOR PROJECT SHATTERED TIMELINE
-- =================================================================
-- This script adds missing data to complement existing database content
-- for proper backend-frontend integration.
-- 
-- Usage: mysql -u tc2005b -p ProjectShatteredTimeline < sample_data_complement.sql
-- =================================================================

USE `ProjectShatteredTimeline`;

-- =================================================================
-- 1. ADD MISSING LOOKUP DATA (if not exists)
-- =================================================================

-- Add missing upgrade_types (if table is empty)
INSERT IGNORE INTO upgrade_types (upgrade_type) VALUES 
('critical_chance'),
('damage_boost'),
('gold_multiplier'),
('max_health'),
('max_stamina'),
('speed_boost');

-- Add missing boss_results (if table is empty)
INSERT IGNORE INTO boss_results (result_code) VALUES 
('defeat'),
('escape'),
('timeout'),
('victory');

-- =================================================================
-- 2. ADD MISSING REGULAR ENEMY TYPES
-- =================================================================
-- The database has bosses (100-102) but no regular enemies (1-10)

INSERT IGNORE INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url) VALUES
(1, 'Basic Goblin', 1, FALSE, 50, 10, 50, 2, 40, NULL),
(2, 'Strong Orc', 1, FALSE, 100, 20, 40, 3, 45, NULL),
(3, 'Fast Skeleton', 1, FALSE, 30, 15, 80, 1, 35, NULL),
(4, 'Goblin Warrior', 1, FALSE, 75, 15, 45, 2, 42, NULL),
(5, 'Dark Mage', 1, TRUE, 60, 25, 35, 4, 80, NULL),
(6, 'Armored Knight', 1, TRUE, 150, 30, 25, 4, 50, NULL),
(7, 'Shadow Assassin', 1, TRUE, 40, 35, 90, 1, 30, NULL),
(8, 'Troll Berserker', 2, FALSE, 200, 40, 30, 3, 55, NULL),
(9, 'Ice Wraith', 2, TRUE, 80, 30, 70, 2, 60, NULL),
(10, 'Fire Elemental', 2, TRUE, 120, 45, 60, 3, 65, NULL);

-- =================================================================
-- 3. ADD MISSING BOSS MOVES (critical for boss encounters)
-- =================================================================

-- Shadow Lord Moves (enemy_id: 100)
INSERT IGNORE INTO boss_moves (enemy_id, name, description, phase) VALUES
(100, 'Shadow Strike', 'Quick shadow attack that deals moderate damage', 1),
(100, 'Dark Explosion', 'Area damage attack affecting multiple targets', 2),
(100, 'Shadow Realm', 'Ultimate shadow ability that creates darkness field', 3),
(100, 'Vanish', 'Becomes temporarily invisible and untargetable', 2),
(100, 'Soul Drain', 'Drains health from player over time', 3);

-- Fire Dragon Moves (enemy_id: 101)
INSERT IGNORE INTO boss_moves (enemy_id, name, description, phase) VALUES
(101, 'Fire Breath', 'Breath of fire in a cone area', 1),
(101, 'Flame Burst', 'Explosive fire attack at target location', 2),
(101, 'Inferno', 'Ultimate fire ability covering entire arena', 3),
(101, 'Wing Sweep', 'Physical attack with wings hitting wide area', 1),
(101, 'Meteor Storm', 'Rains fire meteors from the sky', 3);

-- Ice Queen Moves (enemy_id: 102)
INSERT IGNORE INTO boss_moves (enemy_id, name, description, phase) VALUES
(102, 'Ice Shard', 'Sharp ice projectile with piercing damage', 1),
(102, 'Freeze Blast', 'Area freeze attack that slows enemies', 2),
(102, 'Absolute Zero', 'Ultimate ice ability that freezes everything', 3),
(102, 'Glacial Wall', 'Creates ice walls that block movement', 2),
(102, 'Blizzard', 'Area-wide blizzard reducing visibility', 3);

-- =================================================================
-- 4. ADD MISSING ROOMS FOR PROPER FRONTEND MAPPING
-- =================================================================
-- Current rooms: 1-5 (entrance, combat1, combat2, shop, boss)
-- Need: More combat rooms to match frontend expectations

-- Add more combat rooms for floor 1
INSERT IGNORE INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES 
(6, 1, 'Combat Room 3', 'combat', 6),
(7, 1, 'Combat Room 4', 'combat', 7);

-- Add floor 2 rooms
INSERT IGNORE INTO rooms (floor, name, room_type, sequence_order) VALUES 
(2, 'Combat Room 5', 'combat', 1),
(2, 'Combat Room 6', 'combat', 2),
(2, 'Combat Room 7', 'combat', 3),
(2, 'Combat Room 8', 'combat', 4),
(2, 'Shop Room 2', 'shop', 5),
(2, 'Boss Room 2', 'boss', 6);

-- =================================================================
-- 5. ADD SAMPLE USER DATA FOR TESTING
-- =================================================================
-- Password for all test users: "password123" (hashed with bcrypt)

INSERT IGNORE INTO users (user_id, username, email, password_hash) VALUES
(1, 'testuser', 'test@example.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu'),
(2, 'player1', 'player1@game.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu'),
(3, 'gamedev', 'dev@shattered.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu');

-- Sample Player Stats
INSERT IGNORE INTO player_stats (user_id, total_runs, runs_completed, total_kills, best_single_run_kills, highest_damage_hit, total_gold_earned, total_gold_spent, total_playtime_seconds) VALUES
(1, 5, 2, 150, 45, 95, 2500, 1200, 7200),
(2, 3, 1, 89, 32, 78, 1800, 900, 4500),
(3, 10, 7, 320, 67, 112, 5500, 3200, 18000);

-- Sample Player Upgrades
INSERT IGNORE INTO player_upgrades (user_id, upgrade_type, level) VALUES
(1, 'max_health', 2),
(1, 'damage_boost', 1),
(1, 'gold_multiplier', 1),
(2, 'max_health', 1),
(2, 'speed_boost', 2),
(3, 'max_health', 3),
(3, 'damage_boost', 2),
(3, 'critical_chance', 2),
(3, 'max_stamina', 1);

-- =================================================================
-- 6. ADD SAMPLE SESSIONS AND RUNS FOR TESTING
-- =================================================================

INSERT IGNORE INTO sessions (session_id, user_id, session_token, started_at) VALUES
(1, 1, 'test-session-token-001', NOW()),
(2, 2, 'test-session-token-002', NOW()),
(3, 3, 'test-session-token-003', NOW());

INSERT IGNORE INTO run_history (run_id, user_id, started_at, ended_at, completed, gold_collected, gold_spent, total_kills, death_cause, last_room_id) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), TRUE, 450, 200, 15, NULL, 5),
(2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 30 MINUTE, FALSE, 180, 80, 8, 'Defeated by Shadow Lord', 5),
(3, 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, FALSE, 0, 0, 0, NULL, 1),
(4, 3, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR), TRUE, 680, 350, 25, NULL, 5);

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

SELECT 'DATA POPULATION SUMMARY:' AS info;
SELECT 'Rooms:' AS table_name, COUNT(*) AS count FROM rooms
UNION ALL
SELECT 'Enemy Types:', COUNT(*) FROM enemy_types
UNION ALL
SELECT 'Boss Details:', COUNT(*) FROM boss_details  
UNION ALL
SELECT 'Boss Moves:', COUNT(*) FROM boss_moves
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Room Types:', COUNT(*) FROM room_types
UNION ALL
SELECT 'Item Types:', COUNT(*) FROM item_types
UNION ALL
SELECT 'Weapon Slots:', COUNT(*) FROM weapon_slots
UNION ALL
SELECT 'Upgrade Types:', COUNT(*) FROM upgrade_types
UNION ALL
SELECT 'Boss Results:', COUNT(*) FROM boss_results;

-- =================================================================
-- INTEGRATION VERIFICATION
-- =================================================================

SELECT 'ROOM MAPPING VERIFICATION:' AS info;
SELECT room_id, floor, name, room_type, sequence_order 
FROM rooms 
WHERE floor = 1 
ORDER BY sequence_order;

SELECT 'ENEMY TYPES VERIFICATION:' AS info;
SELECT enemy_id, name, floor, is_rare, base_hp 
FROM enemy_types 
ORDER BY enemy_id;

SELECT 'BOSS MOVES VERIFICATION:' AS info;
SELECT bd.enemy_id, et.name as boss_name, COUNT(bm.move_id) as move_count
FROM boss_details bd
JOIN enemy_types et ON bd.enemy_id = et.enemy_id
LEFT JOIN boss_moves bm ON bd.enemy_id = bm.enemy_id
GROUP BY bd.enemy_id, et.name
ORDER BY bd.enemy_id; 