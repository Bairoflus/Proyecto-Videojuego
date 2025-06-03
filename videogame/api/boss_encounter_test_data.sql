-- Test data script for boss-encounter endpoint testing
-- Execute this in ProjectShatteredTimeline database

USE ProjectShatteredTimeline;

-- 1. Insert boss_results if not exist
INSERT IGNORE INTO boss_results (result_code) VALUES 
('victory'),
('defeat'),
('escape'),
('timeout');

-- 2. Insert enemy_types for bosses if not exist
INSERT IGNORE INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range) VALUES 
(100, 'Shadow Lord', 1, FALSE, 1000, 100, 30, 2, 50),
(101, 'Fire Dragon', 2, FALSE, 2000, 150, 40, 3, 70),
(102, 'Ice Queen', 3, FALSE, 1500, 120, 25, 4, 60);

-- 3. Insert boss_details if not exist
INSERT IGNORE INTO boss_details (enemy_id, max_hp, description) VALUES 
(100, 1000, 'Dark ruler of the shadow realm'),
(101, 2000, 'Ancient fire-breathing dragon'),
(102, 1500, 'Mystical ice queen with freezing powers');

-- 4. Create test user if not exists
INSERT IGNORE INTO users (user_id, username, email, password_hash) VALUES
(88, 'testuser_boss', 'boss@test.com', '$2b$10$hashedpassword');

-- 5. Show available test data
SELECT 'TEST DATA SUMMARY:' as info;

SELECT 'BOSS RESULTS:' as section;
SELECT result_code FROM boss_results;

SELECT 'BOSS DETAILS:' as section;
SELECT bd.enemy_id, et.name, bd.max_hp, bd.description 
FROM boss_details bd 
JOIN enemy_types et ON bd.enemy_id = et.enemy_id;

SELECT 'TEST USER:' as section;
SELECT user_id, username FROM users WHERE user_id = 88;

-- Test data for endpoint:
-- Create test run: POST /api/runs with userId: 88
-- runId: (will be generated)
-- userId: 88
-- enemyId: 100 (Shadow Lord)
-- damageDealt: 120
-- damageTaken: 30
-- resultCode: 'victory' 