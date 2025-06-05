-- ================================================================
-- SHATTERED TIMELINE - COMPLETE GAME DATA POPULATION SCRIPT
-- ================================================================
-- This script populates the database with all necessary data for
-- the game to operate correctly, matching the REAL database schema.
-- 
-- Execute this script after running projectshatteredtimeline.sql
-- ================================================================

USE ProjectShatteredTimeline;

-- Clean existing data (for fresh installation)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE player_events;
TRUNCATE TABLE boss_kills;
TRUNCATE TABLE boss_encounters;
TRUNCATE TABLE enemy_kills;
TRUNCATE TABLE chest_events;
TRUNCATE TABLE shop_purchases;
TRUNCATE TABLE permanent_upgrade_purchases;
TRUNCATE TABLE weapon_upgrades_temp;
TRUNCATE TABLE equipped_weapons;
TRUNCATE TABLE save_states;
TRUNCATE TABLE run_history;
TRUNCATE TABLE boss_moves;
TRUNCATE TABLE boss_details;
TRUNCATE TABLE enemy_types;
TRUNCATE TABLE rooms;
TRUNCATE TABLE player_upgrades;
TRUNCATE TABLE player_settings;
TRUNCATE TABLE player_stats;
TRUNCATE TABLE sessions;
TRUNCATE TABLE users;
TRUNCATE TABLE item_types;
TRUNCATE TABLE room_types;
TRUNCATE TABLE boss_results;
TRUNCATE TABLE upgrade_types;
TRUNCATE TABLE weapon_slots;
TRUNCATE TABLE event_types;
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- 1. LOOKUP TABLES (Reference Data)
-- ================================================================

-- Event Types
INSERT INTO event_types (event_type) VALUES
('room_enter'),
('enemy_kill'),
('player_death'),
('weapon_fire'),
('boss_encounter'),
('run_completion'),
('item_purchase'),
('floor_completion');

-- Weapon Slots
INSERT INTO weapon_slots (slot_type) VALUES
('melee'),
('ranged');

-- Upgrade Types
INSERT INTO upgrade_types (upgrade_type) VALUES
('health_upgrade'),
('stamina_upgrade'),
('damage_upgrade'),
('movement_speed_upgrade');

-- Boss Results
INSERT INTO boss_results (result_code) VALUES
('victory'),
('defeat');

-- Room Types
INSERT INTO room_types (room_type) VALUES
('combat'),
('shop'),
('boss');

-- Item Types
INSERT INTO item_types (item_type) VALUES
('health_potion'),
('stamina_potion'),
('damage_boost'),
('speed_boost'),
('armor_upgrade'),
('weapon_enhancement'),
('max_health_boost'),
('max_stamina_boost'),
('gold_multiplier'),
('resurrection_token');

-- ================================================================
-- 2. ROOMS (3 Floors with 6 Rooms Each)
-- ================================================================

INSERT INTO rooms (room_id, floor, name, room_type, sequence_order) VALUES
-- Floor 1 Rooms
(1, 1, 'Abandoned Courtyard', 'combat', 1),
(2, 1, 'Broken Armory', 'combat', 2),
(3, 1, 'Collapsed Kitchen', 'combat', 3),
(4, 1, 'Cursed Library', 'combat', 4),
(5, 1, 'Merchant Corner', 'shop', 5),
(6, 1, 'Throne Room', 'boss', 6),

-- Floor 2 Rooms
(7, 2, 'Frozen Entrance', 'combat', 1),
(8, 2, 'Crystal Cavern', 'combat', 2),
(9, 2, 'Ice Cavern', 'combat', 3),
(10, 2, 'Blizzard Chamber', 'combat', 4),
(11, 2, 'Ice Merchant Post', 'shop', 5),
(12, 2, 'Frozen Throne', 'boss', 6),

-- Floor 3 Rooms
(13, 3, 'Dragon Gate', 'combat', 1),
(14, 3, 'Molten Forge', 'combat', 2),
(15, 3, 'Lava Chamber', 'combat', 3),
(16, 3, 'Phoenix Lair', 'combat', 4),
(17, 3, 'Final Merchant', 'shop', 5),
(18, 3, 'Dragon Throne', 'boss', 6);

-- ================================================================
-- 3. ENEMY TYPES (20 Different Enemies)
-- ================================================================

INSERT INTO enemy_types (enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url) VALUES
-- Floor 1 Enemies (Basic Tier)
(1, 'Basic Goblin', 1, FALSE, 40, 8, 100, 2, 80, '../assets/sprites/enemies/goblin_basic.png'),
(2, 'Goblin Archer', 1, FALSE, 30, 12, 80, 3, 200, '../assets/sprites/enemies/goblin_archer.png'),
(3, 'Skeleton Warrior', 1, FALSE, 50, 10, 90, 2, 100, '../assets/sprites/enemies/skeleton_warrior.png'),
(4, 'Cave Spider', 1, FALSE, 25, 6, 150, 1, 60, '../assets/sprites/enemies/cave_spider.png'),
(5, 'Corrupted Guard', 1, TRUE, 60, 14, 70, 3, 120, '../assets/sprites/enemies/corrupted_guard.png'),

-- Floor 1-2 Transition Enemies (Intermediate Tier)
(6, 'Orc Berserker', 1, TRUE, 80, 18, 120, 2, 100, '../assets/sprites/enemies/orc_berserker.png'),
(7, 'Dark Mage', 1, TRUE, 45, 20, 60, 4, 250, '../assets/sprites/enemies/dark_mage.png'),
(8, 'Armored Knight', 2, FALSE, 100, 16, 50, 3, 110, '../assets/sprites/enemies/armored_knight.png'),
(9, 'Shadow Assassin', 2, TRUE, 35, 22, 180, 1, 90, '../assets/sprites/enemies/shadow_assassin.png'),
(10, 'Troll Berserker', 2, TRUE, 120, 25, 80, 4, 130, '../assets/sprites/enemies/troll_berserker.png'),

-- Floor 2 Enemies (Ice Tier)
(11, 'Ice Wraith', 2, FALSE, 55, 15, 130, 2, 150, '../assets/sprites/enemies/ice_wraith.png'),
(12, 'Frost Goblin', 2, FALSE, 45, 12, 110, 2, 100, '../assets/sprites/enemies/frost_goblin.png'),
(13, 'Crystal Golem', 2, TRUE, 150, 20, 40, 5, 80, '../assets/sprites/enemies/crystal_golem.png'),
(14, 'Blizzard Wolf', 2, FALSE, 65, 18, 160, 2, 120, '../assets/sprites/enemies/blizzard_wolf.png'),
(15, 'Frozen Sentinel', 2, TRUE, 90, 24, 60, 4, 140, '../assets/sprites/enemies/frozen_sentinel.png'),

-- Floor 3 Enemies (Fire Tier)
(16, 'Fire Elemental', 3, FALSE, 70, 28, 140, 2, 100, '../assets/sprites/enemies/fire_elemental.png'),
(17, 'Lava Salamander', 3, FALSE, 85, 22, 100, 3, 110, '../assets/sprites/enemies/lava_salamander.png'),
(18, 'Molten Golem', 3, TRUE, 180, 30, 30, 6, 90, '../assets/sprites/enemies/molten_golem.png'),
(19, 'Dragon Cultist', 3, FALSE, 60, 26, 90, 3, 200, '../assets/sprites/enemies/dragon_cultist.png'),
(20, 'Phoenix Guardian', 3, TRUE, 95, 32, 170, 3, 150, '../assets/sprites/enemies/phoenix_guardian.png'),

-- ✅ FIXED: Boss entries moved here (BEFORE boss_details)
(100, 'Shadow Lord', 1, FALSE, 300, 35, 80, 3, 150, '../assets/sprites/bosses/shadow_lord.png'),
(101, 'Ice Queen', 2, FALSE, 450, 40, 70, 4, 200, '../assets/sprites/bosses/ice_queen.png'),
(102, 'Fire Dragon', 3, FALSE, 600, 50, 90, 5, 300, '../assets/sprites/bosses/fire_dragon.png');

-- ================================================================
-- 4. BOSS DETAILS (3 Unique Bosses)
-- ================================================================

INSERT INTO boss_details (enemy_id, max_hp, description) VALUES
(100, 300, 'Dragon'),
(101, 450, 'Supersoldier'),
(102, 600, 'Mecha');

-- ================================================================
-- 5. BOSS MOVES (Detailed Combat Abilities)
-- ================================================================

INSERT INTO boss_moves (move_id, enemy_id, name, description, phase) VALUES
-- Fire Dragon Move (Boss 101)
(1, 100, 'Fireball', 'Projectiles falling from sky', 1),
(2, 100, 'Firebreath', 'Firebreath', 2),
(3, 100, 'Firewalls', 'Powerful melee attack with extended range', 3),

-- Supersoldier Move (Boss 102)
(4, 101, 'Ice Storm', 'Creates multiple ice projectiles across the battlefield', 1),
(5, 101, 'Frozen Prison', 'Temporarily immobilizes the player in ice', 2),
(6, 101, 'Blizzard Aura', 'Continuous cold damage to players within range', 3),

-- Mecha Moves (Boss 103)
(7, 102, 'Fire Breath', 'Devastating cone of dragon fire', 1),
(8, 102, 'Meteor Strike', 'Targeted meteor that creates area damage', 2),
(9, 102, 'Dragon Roar', 'Stuns player and summons fire minions', 3);



-- ================================================================
-- 6. SAMPLE USERS AND SESSIONS (For Testing)
-- ================================================================

INSERT INTO users (user_id, username, email, password_hash, created_at) VALUES
(1, 'player1', 'test@example.com', '$2b$10$rU8K9Z8Q4X5n7P2mY3tV4Oz1N6W0L5mR9dH3vB2qE8jF7kS1iA0uC', NOW()),
(2, 'developer', 'dev@shatteredtimeline.com', '$2b$10$sT9L3A7R6Y4k8N5pZ2uW8Qx2M7R1K6nS0fH4wC3qF9jG8lT2jB1vD', NOW()),
(3, 'tester', 'tester@example.com', '$2b$10$uV0M4B8S7Z5l9O6qA3vX9Ry3N8S2L7oT1gI5xD4rG0kH9mU3kC2wE', NOW());

-- Sample Player Sessions
INSERT INTO sessions (session_id, user_id, session_token, started_at, last_active) VALUES
(1, 1, UUID(), NOW(), NOW()),
(2, 2, UUID(), NOW(), NOW()),
(3, 3, UUID(), NOW(), NOW());

-- Sample Player Settings
INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES
(1, 70, 80),
(2, 50, 90),
(3, 80, 60);

-- Sample Player Stats
INSERT INTO player_stats (user_id, total_runs, runs_completed, total_kills, best_single_run_kills, highest_damage_hit, total_gold_earned, total_gold_spent, total_playtime_seconds) VALUES
(1, 15, 3, 89, 12, 45, 1200, 800, 14400),
(2, 50, 15, 342, 25, 78, 5000, 3200, 72000),
(3, 8, 1, 45, 8, 32, 600, 400, 7200);

-- Sample Player Upgrades
INSERT INTO player_upgrades (user_id, upgrade_type, level) VALUES
(1, 'health_upgrade', 1),
(1, 'stamina_upgrade', 1),
(2, 'stamina_upgrade', 1),
(2, 'movement_speed_upgrade', 2),
(3, 'damage_upgrade', 1);

-- Sample Player Runs
INSERT INTO run_history (run_id, user_id, started_at, ended_at, completed, gold_collected, gold_spent, total_kills, last_room_id) VALUES
(1, 1, NOW(), NULL, FALSE, 50, 0, 0, 1),
(2, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 30 MINUTE), TRUE, 180, 120, 25, 12),
(3, 3, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 90 MINUTE), FALSE, 65, 45, 8, 4);

-- Sample Save States
INSERT INTO save_states (save_id, user_id, session_id, run_id, room_id, current_hp, current_stamina, gold) VALUES
(1, 1, 1, 1, 1, 100, 100, 50),
(2, 2, 2, 2, 12, 85, 75, 180),
(3, 3, 3, 3, 4, 45, 60, 65);

-- ================================================================
-- 7. SAMPLE ANALYTICS DATA (For Dashboard Testing)
-- ================================================================

-- Sample Player Events
INSERT INTO player_events (event_id, run_id, user_id, room_id, event_type, value, weapon_type, context) VALUES
(1, 1, 1, 1, 'room_enter', NULL, 'melee', 'game_start'),
(2, 2, 2, 7, 'enemy_kill', 1, 'ranged', 'combat'),
(3, 2, 2, 8, 'room_enter', NULL, 'ranged', 'transition'),
(4, 3, 3, 4, 'player_death', NULL, 'melee', 'boss_fight'),
(5, 2, 2, 12, 'boss_encounter', 101, 'melee', 'boss_fight');

-- Sample Enemy Kills
INSERT INTO enemy_kills (kill_id, user_id, enemy_id, run_id, room_id) VALUES
(1, 2, 1, 2, 7),
(2, 2, 11, 2, 8),
(3, 2, 12, 2, 9),
(4, 3, 1, 3, 2),
(5, 3, 3, 3, 3);

-- Sample Boss Encounters
INSERT INTO boss_encounters (encounter_id, user_id, enemy_id, run_id, damage_dealt, damage_taken, result_code) VALUES
(1, 2, 101, 2, 450, 150, 'victory');

-- Sample Boss Kills
INSERT INTO boss_kills (kill_id, user_id, enemy_id, run_id, room_id) VALUES
(1, 2, 101, 2, 12);

-- Sample Shop Purchases
INSERT INTO shop_purchases (purchase_id, user_id, run_id, room_id, item_type, item_name, gold_spent) VALUES
(1, 2, 2, 5, 'health_potion', 'Health Potion', 25),
(2, 2, 2, 11, 'damage_boost', 'Damage Boost Potion', 50),
(3, 3, 3, 5, 'stamina_potion', 'Stamina Potion', 20);

-- Sample Chest Events
INSERT INTO chest_events (event_id, user_id, run_id, room_id, gold_received) VALUES
(1, 2, 2, 9, 75),
(2, 3, 3, 1, 30);

-- Sample Permanent Upgrade Purchases
INSERT INTO permanent_upgrade_purchases (purchase_id, user_id, run_id, upgrade_type, level_before, level_after, gold_spent) VALUES
(1, 2, 2, 'damage_upgrade', 4, 5, 200),
(2, 3, 3, 'damage_upgrade', 0, 1, 100);

-- Sample Equipped Weapons
INSERT INTO equipped_weapons (run_id, user_id, slot_type) VALUES
(1, 1, 'melee'),
(2, 2, 'ranged');

-- Sample Weapon Upgrades
INSERT INTO weapon_upgrades_temp (run_id, user_id, slot_type, level, damage_per_upgrade, gold_cost_per_upgrade) VALUES
(2, 2, 'ranged', 3, 5, 25),
(3, 3, 'melee', 1, 6, 20);

-- ================================================================
-- DATA VERIFICATION QUERIES
-- ================================================================

-- Verify all data has been inserted correctly
SELECT 'Event Types' AS table_name, COUNT(*) AS count FROM event_types
UNION ALL
SELECT 'Weapon Slots', COUNT(*) FROM weapon_slots
UNION ALL
SELECT 'Upgrade Types', COUNT(*) FROM upgrade_types
UNION ALL
SELECT 'Boss Results', COUNT(*) FROM boss_results
UNION ALL
SELECT 'Room Types', COUNT(*) FROM room_types
UNION ALL
SELECT 'Item Types', COUNT(*) FROM item_types
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'Enemy Types', COUNT(*) FROM enemy_types
UNION ALL
SELECT 'Boss Details', COUNT(*) FROM boss_details
UNION ALL
SELECT 'Boss Moves', COUNT(*) FROM boss_moves
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'Player Settings', COUNT(*) FROM player_settings
UNION ALL
SELECT 'Player Stats', COUNT(*) FROM player_stats
UNION ALL
SELECT 'Player Upgrades', COUNT(*) FROM player_upgrades
UNION ALL
SELECT 'Run History', COUNT(*) FROM run_history
UNION ALL
SELECT 'Save States', COUNT(*) FROM save_states;

-- ================================================================
-- END OF SCRIPT
-- ================================================================

COMMIT;

-- Final verification
SELECT 'Database population completed successfully! Schema matches projectshatteredtimeline.sql' AS message; 