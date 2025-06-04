-- =================================================================
-- SAMPLE DATA FOR PROJECT SHATTERED TIMELINE
-- =================================================================
-- This file populates the database with initial data required for 
-- backend-frontend integration. Execute this after creating the 
-- database schema.
-- 
-- Usage: mysql -u tc2005b -p ProjectShatteredTimeline < sample_data.sql
-- =================================================================

USE `ProjectShatteredTimeline`;

-- =================================================================
-- 1. LOOKUP TABLES - REFERENCE DATA
-- =================================================================

-- Room Types
INSERT INTO room_types (room_type) VALUES 
('entrance'),
('combat'),
('shop'),
('boss');

-- Item Types for shop system
INSERT INTO item_types (item_type) VALUES 
('armor'),
('consumable'),
('health_potion'),
('upgrade'),
('weapon');

-- Weapon Slots for equipment system
INSERT INTO weapon_slots (slot_type) VALUES 
('melee'),
('primary'),
('secondary'),
('special'),
('throwable');

-- Upgrade Types for permanent upgrades
INSERT INTO upgrade_types (upgrade_type) VALUES 
('critical_chance'),
('damage_boost'),
('gold_multiplier'),
('max_health'),
('max_stamina'),
('speed_boost');

-- Boss Results for boss encounters
INSERT INTO boss_results (result_code) VALUES 
('defeat'),
('escape'),
('timeout'),
('victory');

-- Event Types (currently unused but required by schema)
-- INSERT INTO event_types (event_type) VALUES ('sample_event');

-- =================================================================
-- 2. ROOMS - MAPPING TO FRONTEND LAYOUTS
-- =================================================================
-- These rooms correspond to the layouts defined in:
-- videogame/src/classes/rooms/combatRooms.js
-- Order is critical for proper mapping

-- Floor 1 - Combat Rooms (correspond to COMBAT_ROOMS array indices 0-3)
INSERT INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES 
(1, 1, 'Combat Room 1', 'combat', 1),
(2, 1, 'Combat Room 2', 'combat', 2),
(3, 1, 'Combat Room 3', 'combat', 3),
(4, 1, 'Combat Room 4', 'combat', 4),
(5, 1, 'Shop Room', 'shop', 5),
(6, 1, 'Boss Room', 'boss', 6);

-- Future floors can be added here
INSERT INTO rooms (floor, name, room_type, sequence_order) VALUES 
(2, 'Combat Room 5', 'combat', 1),
(2, 'Combat Room 6', 'combat', 2),
(2, 'Combat Room 7', 'combat', 3),
(2, 'Combat Room 8', 'combat', 4),
(2, 'Shop Room 2', 'shop', 5),
(2, 'Boss Room 2', 'boss', 6);

-- =================================================================
-- 3. ENEMY TYPES - GAME ENTITIES
-- =================================================================

-- Basic Enemy Types (IDs 1-10 reserved for regular enemies)
INSERT INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url) VALUES
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

-- Boss Enemy Types (IDs 100+ reserved for bosses)
INSERT INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url) VALUES
(100, 'Shadow Lord', 1, FALSE, 1000, 100, 30, 2, 50, NULL),
(101, 'Fire Dragon', 1, FALSE, 2000, 150, 40, 3, 70, NULL),
(102, 'Ice Queen', 2, FALSE, 1500, 120, 35, 2, 60, NULL),
(103, 'Ancient Lich', 2, FALSE, 1800, 140, 25, 4, 90, NULL),
(104, 'Storm Giant', 3, FALSE, 2500, 180, 45, 3, 80, NULL);

-- =================================================================
-- 4. BOSS DETAILS - EXTENDED BOSS INFORMATION
-- =================================================================

INSERT INTO boss_details (enemy_id, max_hp, description) VALUES
(100, 1000, 'Dark ruler of the shadow realm, master of darkness and stealth attacks'),
(101, 2000, 'Ancient fire-breathing dragon with devastating flame attacks'),
(102, 1500, 'Mystical ice queen with freezing powers that can immobilize enemies'),
(103, 1800, 'Undead lich with powerful necromantic spells and dark magic'),
(104, 2500, 'Colossal storm giant wielding lightning and thunder');

-- =================================================================
-- 5. BOSS MOVES - PHASE-BASED ABILITIES
-- =================================================================

-- Shadow Lord Moves (enemy_id: 100)
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(100, 'Shadow Strike', 'Quick shadow attack that deals moderate damage', 1),
(100, 'Dark Explosion', 'Area damage attack affecting multiple targets', 2),
(100, 'Shadow Realm', 'Ultimate shadow ability that creates darkness field', 3),
(100, 'Vanish', 'Becomes temporarily invisible and untargetable', 2),
(100, 'Soul Drain', 'Drains health from player over time', 3);

-- Fire Dragon Moves (enemy_id: 101)
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(101, 'Fire Breath', 'Breath of fire in a cone area', 1),
(101, 'Flame Burst', 'Explosive fire attack at target location', 2),
(101, 'Inferno', 'Ultimate fire ability covering entire arena', 3),
(101, 'Wing Sweep', 'Physical attack with wings hitting wide area', 1),
(101, 'Meteor Storm', 'Rains fire meteors from the sky', 3);

-- Ice Queen Moves (enemy_id: 102)
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(102, 'Ice Shard', 'Sharp ice projectile with piercing damage', 1),
(102, 'Freeze Blast', 'Area freeze attack that slows enemies', 2),
(102, 'Absolute Zero', 'Ultimate ice ability that freezes everything', 3),
(102, 'Glacial Wall', 'Creates ice walls that block movement', 2),
(102, 'Blizzard', 'Area-wide blizzard reducing visibility', 3);

-- Ancient Lich Moves (enemy_id: 103)
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(103, 'Death Ray', 'Concentrated dark energy beam', 1),
(103, 'Bone Prison', 'Traps player in bone cage', 2),
(103, 'Necromancy', 'Summons undead minions to fight', 3),
(103, 'Life Steal', 'Drains player health to heal self', 2),
(103, 'Soul Storm', 'Ultimate necromantic ability', 3);

-- Storm Giant Moves (enemy_id: 104)
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(104, 'Lightning Bolt', 'Single target lightning strike', 1),
(104, 'Thunder Clap', 'Area stunning attack with thunder', 2),
(104, 'Storm Call', 'Ultimate weather control ability', 3),
(104, 'Wind Slash', 'Sharp wind attack in line', 1),
(104, 'Hurricane', 'Area-wide wind and lightning storm', 3);

-- =================================================================
-- 6. SAMPLE USER DATA FOR TESTING
-- =================================================================
-- Note: Passwords are hashed with bcrypt (10 rounds)
-- Test password for all users: "password123"

INSERT INTO users (user_id, username, email, password_hash) VALUES
(1, 'testuser', 'test@example.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu'),
(2, 'player1', 'player1@game.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu'),
(3, 'gamedev', 'dev@shattered.com', '$2b$10$rN8dJSNk/s8PKxX7Q5XJXe8bTW8MbZJL8o7C3VgN6nP3K4ZqJ5wQu');

-- Sample Player Stats
INSERT INTO player_stats (user_id, total_runs, runs_completed, total_kills, best_single_run_kills, highest_damage_hit, total_gold_earned, total_gold_spent, total_playtime_seconds) VALUES
(1, 5, 2, 150, 45, 95, 2500, 1200, 7200),
(2, 3, 1, 89, 32, 78, 1800, 900, 4500),
(3, 10, 7, 320, 67, 112, 5500, 3200, 18000);

-- Sample Player Upgrades
INSERT INTO player_upgrades (user_id, upgrade_type, level) VALUES
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
-- 7. SAMPLE ACTIVE SESSIONS FOR TESTING
-- =================================================================
-- These sessions can be used for API testing

INSERT INTO sessions (session_id, user_id, session_token, started_at) VALUES
(1, 1, 'test-session-token-001', NOW()),
(2, 2, 'test-session-token-002', NOW()),
(3, 3, 'test-session-token-003', NOW());

-- =================================================================
-- 8. SAMPLE RUN HISTORY FOR TESTING
-- =================================================================

INSERT INTO run_history (run_id, user_id, started_at, ended_at, completed, gold_collected, gold_spent, total_kills, death_cause, last_room_id) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), TRUE, 450, 200, 15, NULL, 6),
(2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 30 MINUTE, FALSE, 180, 80, 8, 'Defeated by Shadow Lord', 6),
(3, 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, FALSE, 0, 0, 0, NULL, 1),
(4, 3, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR), TRUE, 680, 350, 25, NULL, 6);

-- =================================================================
-- DATA VERIFICATION QUERIES
-- =================================================================
-- Run these queries to verify data was inserted correctly:

-- SELECT 'Rooms populated:' AS check_type, COUNT(*) AS count FROM rooms;
-- SELECT 'Enemy types populated:' AS check_type, COUNT(*) AS count FROM enemy_types;
-- SELECT 'Boss details populated:' AS check_type, COUNT(*) AS count FROM boss_details;  
-- SELECT 'Boss moves populated:' AS check_type, COUNT(*) AS count FROM boss_moves;
-- SELECT 'Lookup tables populated:' AS check_type, 
--        (SELECT COUNT(*) FROM room_types) + 
--        (SELECT COUNT(*) FROM item_types) + 
--        (SELECT COUNT(*) FROM weapon_slots) + 
--        (SELECT COUNT(*) FROM upgrade_types) + 
--        (SELECT COUNT(*) FROM boss_results) AS total_lookups;

-- =================================================================
-- INTEGRATION NOTES
-- =================================================================
-- 
-- 1. Room IDs 1-6 correspond to Floor 1 layout in frontend
-- 2. Enemy IDs 1-10 are regular enemies, 100+ are bosses
-- 3. Boss moves are organized by phase (1=early, 2=mid, 3=late)
-- 4. Test users have password "password123" (already hashed)
-- 5. Sample sessions and runs are provided for API testing
-- 
-- After running this script, the following APIs should return data:
-- - GET /api/rooms (6 rooms)
-- - GET /api/enemies (15 enemy types)  
-- - GET /api/bosses (5 bosses with moves)
-- - GET /api/lookups (all lookup tables populated)
-- - GET /api/item-types (5 item types)
-- 
-- ================================================================= 