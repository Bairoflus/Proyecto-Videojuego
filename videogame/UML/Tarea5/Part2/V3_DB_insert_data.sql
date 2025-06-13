USE shatteredtimeline;

-- Disable foreign key checks temporarily for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- USERS TABLE (Base table, no dependencies)
-- =====================================================
INSERT INTO users (username, email, password_hash) VALUES
('player1', 'player1@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('gamer_pro', 'gamer@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('shadow_warrior', 'shadow@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('time_keeper', 'timekeeper@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('dark_mage', 'darkmage@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('blade_runner', 'blade@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('archer_elite', 'archer@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('frost_giant', 'frost@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('fire_lord', 'fire@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('storm_caller', 'storm@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('void_walker', 'void@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('light_bringer', 'light@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('chaos_knight', 'chaos@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('dream_weaver', 'dream@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('soul_reaper', 'soul@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('crystal_sage', 'crystal@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('thunder_bolt', 'thunder@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('moon_dancer', 'moon@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('star_seeker', 'star@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('earth_shaker', 'earth@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('wind_runner', 'wind@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('ice_queen', 'ice@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('flame_dancer', 'flame@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('shadow_blade', 'shadowblade@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('mystic_archer', 'mystic@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('iron_fist', 'iron@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('golden_eagle', 'golden@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('silver_wolf', 'silver@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('crimson_fox', 'crimson@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('azure_dragon', 'azure@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('jade_tiger', 'jade@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('ruby_phoenix', 'ruby@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('emerald_serpent', 'emerald@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('diamond_hawk', 'diamond@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('obsidian_raven', 'obsidian@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('platinum_lion', 'platinum@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('steel_bear', 'steel@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('copper_shark', 'copper@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('bronze_whale', 'bronze@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('legendary_warrior', 'legendary@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('mythic_guardian', 'mythic@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('epic_champion', 'epic@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('rare_hunter', 'rare@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('common_fighter', 'common@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('master_chief', 'master@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('veteran_soldier', 'veteran@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('rookie_pilot', 'rookie@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('skilled_assassin', 'skilled@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('wise_oracle', 'wise@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('brave_knight', 'brave@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
('swift_rogue', 'swift@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- =====================================================
-- ROOMS TABLE (No dependencies)
-- =====================================================
INSERT INTO rooms (floor, name, type, sequence_order) VALUES
-- Floor 1
(1, 'Entrance Hall', 'combat', 1),
(1, 'Ancient Library', 'combat', 2),
(1, 'Treasure Vault', 'chest', 3),
(1, 'Weapon Shop', 'shop', 4),
(1, 'Training Grounds', 'combat', 5),
(1, 'Secret Passage', 'combat', 6),
(1, 'Guardian Chamber', 'boss', 7),
-- Floor 2
(2, 'Crystal Cavern', 'combat', 1),
(2, 'Underground Lake', 'combat', 2),
(2, 'Mining Tunnels', 'combat', 3),
(2, 'Gem Repository', 'chest', 4),
(2, 'Equipment Store', 'shop', 5),
(2, 'Stalactite Forest', 'combat', 6),
(2, 'Crystal Throne', 'boss', 7),
-- Floor 3
(3, 'Sky Bridge', 'combat', 1),
(3, 'Cloud Gardens', 'combat', 2),
(3, 'Wind Temple', 'combat', 3),
(3, 'Aerial Treasury', 'chest', 4),
(3, 'Sky Merchant', 'shop', 5),
(3, 'Storm Peaks', 'combat', 6),
(3, 'Celestial Arena', 'boss', 7),
-- Floor 4
(4, 'Lava Fields', 'combat', 1),
(4, 'Molten Core', 'combat', 2),
(4, 'Fire Shrine', 'combat', 3),
(4, 'Volcanic Vault', 'chest', 4),
(4, 'Forge Shop', 'shop', 5),
(4, 'Inferno Valley', 'combat', 6),
(4, 'Dragon Lair', 'boss', 7),
-- Floor 5
(5, 'Void Entrance', 'combat', 1),
(5, 'Shadow Realm', 'combat', 2),
(5, 'Dark Sanctuary', 'combat', 3),
(5, 'Cursed Treasury', 'chest', 4),
(5, 'Soul Trader', 'shop', 5),
(5, 'Nightmare Maze', 'combat', 6),
(5, 'Temporal Nexus', 'boss', 7),
-- Additional rooms
(1, 'Side Chamber A', 'combat', 8),
(1, 'Side Chamber B', 'combat', 9),
(2, 'Hidden Grotto', 'combat', 8),
(2, 'Secret Mine', 'combat', 9),
(3, 'Floating Island', 'combat', 8),
(3, 'Cloud Palace', 'combat', 9),
(4, 'Ember Cave', 'combat', 8),
(4, 'Magma Pool', 'combat', 9),
(5, 'Void Fragment', 'combat', 8),
(5, 'Time Rift', 'combat', 9),
(1, 'Meditation Room', 'rest', 10),
(2, 'Underground Spring', 'rest', 10),
(3, 'Peaceful Clouds', 'rest', 10),
(4, 'Cooling Cave', 'rest', 10),
(5, 'Quiet Void', 'rest', 10);

-- =====================================================
-- BOSSES TABLE (No dependencies)
-- =====================================================
INSERT INTO bosses (name, floor, max_hp, description) VALUES
('Ancient Guardian', 1, 500, 'The protector of the first floor, wielding ancient magic and heavy armor.'),
('Crystal Golem', 2, 750, 'A massive creature made of living crystal, with devastating physical attacks.'),
('Storm Lord', 3, 1000, 'Master of wind and lightning, capable of aerial combat and storm magic.'),
('Inferno Dragon', 4, 1250, 'A mighty dragon breathing fire and commanding lava-based attacks.'),
('Temporal Wraith', 5, 1500, 'The final boss, manipulating time itself to confuse and destroy enemies.'),
('Shadow Sentinel', 1, 450, 'A dark guardian protecting forbidden knowledge.'),
('Frost Behemoth', 2, 800, 'An ice-covered giant with freezing attacks.'),
('Wind Serpent', 3, 950, 'A massive flying snake controlling air currents.'),
('Lava Titan', 4, 1100, 'A giant made of molten rock and fire.'),
('Void Emperor', 5, 1600, 'The ultimate challenge, ruler of the void realm.'),
('Iron Colossus', 1, 600, 'A mechanical giant from ancient times.'),
('Gem Harvester', 2, 700, 'A crystalline spider that feeds on precious stones.'),
('Sky Warden', 3, 900, 'Guardian of the heavenly realms.'),
('Flame Sovereign', 4, 1200, 'Ruler of all fire elementals.'),
('Time Devourer', 5, 1700, 'A creature that feeds on temporal energy.'),
('Stone Watcher', 1, 550, 'Ancient statue brought to life.'),
('Crystal Empress', 2, 850, 'Queen of the underground crystal kingdom.'),
('Thunder King', 3, 1050, 'Monarch of storms and lightning.'),
('Magma Lord', 4, 1300, 'Ancient ruler of volcanic regions.'),
('Chaos Incarnate', 5, 1800, 'Pure embodiment of chaotic forces.'),
('Gargoyle Chief', 1, 525, 'Leader of stone creatures.'),
('Diamond Destroyer', 2, 775, 'A beast that crushes the hardest materials.'),
('Cyclone Master', 3, 975, 'Controller of devastating wind storms.'),
('Phoenix Overlord', 4, 1150, 'Immortal bird of fire and rebirth.'),
('Entropy Avatar', 5, 1650, 'Living representation of universal decay.'),
('Bronze Guardian', 1, 475, 'Metallic protector of ancient halls.'),
('Quartz Queen', 2, 725, 'Ruler of crystalline forces.'),
('Gale General', 3, 925, 'Military commander of air elementals.'),
('Ember Emperor', 4, 1175, 'Supreme ruler of fire domain.'),
('Oblivion Oracle', 5, 1750, 'Prophet of the end times.'),
('Marble Maiden', 1, 500, 'Elegant yet deadly stone warrior.'),
('Sapphire Sage', 2, 800, 'Wise crystal mage with powerful spells.'),
('Zephyr Zealot', 3, 1000, 'Fanatical devotee of wind magic.'),
('Cinder Champion', 4, 1225, 'Elite warrior of the flame legion.'),
('Nexus Nightmare', 5, 1850, 'Horror from the junction of realities.'),
('Granite Gladiator', 1, 575, 'Arena fighter carved from solid rock.'),
('Amethyst Assassin', 2, 750, 'Stealthy killer with crystal weapons.'),
('Tempest Tyrant', 3, 1025, 'Despotic ruler of weather phenomena.'),
('Plasma Paladin', 4, 1275, 'Holy warrior wielding superheated energy.'),
('Paradox Phantom', 5, 1900, 'Ghostly entity existing in multiple timelines.'),
('Limestone Lord', 1, 450, 'Ancient noble of stone halls.'),
('Opal Overlord', 2, 825, 'Majestic ruler of gem territories.'),
('Hurricane Herald', 3, 1075, 'Messenger of catastrophic storms.'),
('Blaze Baron', 4, 1325, 'Noble commander of fire armies.'),
('Reality Ripper', 5, 2000, 'Entity capable of tearing holes in existence.'),
('Basalt Beast', 1, 625, 'Volcanic rock creature with immense strength.'),
('Topaz Templar', 2, 875, 'Holy warrior blessed by crystal power.'),
('Vortex Villain', 3, 1125, 'Evil mastermind of swirling destruction.'),
('Inferno Inquisitor', 4, 1375, 'Judge and executioner of fire realm.'),
('Eternity Eater', 5, 2100, 'Ancient being that consumes time itself.');

-- =====================================================
-- BOSS_MOVES TABLE (Depends on bosses)
-- =====================================================
INSERT INTO boss_moves (boss_id, name, description, phase) VALUES
-- Ancient Guardian moves
(1, 'Shield Bash', 'Powerful melee attack with enchanted shield', 1),
(1, 'Ancient Spell', 'Casts protective magic and damage spells', 1),
(1, 'Berserker Rage', 'Increases attack speed and damage', 2),
-- Crystal Golem moves
(2, 'Crystal Spike', 'Shoots sharp crystal projectiles', 1),
(2, 'Ground Slam', 'Shakes the ground causing area damage', 1),
(2, 'Crystal Storm', 'Summons a barrage of crystal shards', 2),
-- Storm Lord moves
(3, 'Lightning Strike', 'Targeted lightning bolt attack', 1),
(3, 'Wind Gust', 'Pushes enemies back with strong winds', 1),
(3, 'Thunder Roar', 'Stuns enemies with deafening sound', 2),

(4, 'Fire Breath', 'Breathes intense flames in a cone', 1),
(4, 'Lava Pool', 'Creates damaging lava on the ground', 1),
(4, 'Dragon Fury', 'Ultimate fire attack covering large area', 2),
(5, 'Time Slow', 'Slows down enemy movement and attacks', 1),
(5, 'Temporal Shift', 'Teleports around the battlefield', 1),
(5, 'Chronos Blast', 'Devastating time-based area attack', 2),
(6, 'Shadow Strike', 'Quick stealth attack from darkness', 1),
(6, 'Dark Veil', 'Reduces visibility and accuracy', 1),
(7, 'Ice Shards', 'Throws frozen projectiles', 1),
(7, 'Freeze Ray', 'Slows and damages with cold', 1),
(8, 'Aerial Dive', 'Swift diving attack from above', 1),
(8, 'Tornado Spin', 'Creates damaging whirlwind', 1),
(9, 'Magma Burst', 'Explosive molten rock attack', 1),
(9, 'Heat Wave', 'Area of effect fire damage', 1),
(10, 'Void Portal', 'Summons dangerous void creatures', 1),
(10, 'Reality Tear', 'Damages space-time around enemies', 2);

-- Add more boss moves for remaining bosses (30-50 total)
INSERT INTO boss_moves (boss_id, name, description, phase) VALUES
(11, 'Metal Crush', 'Devastating mechanical attack', 1),
(12, 'Web Trap', 'Immobilizes enemies with crystal threads', 1),
(13, 'Sky Judgment', 'Divine punishment from above', 1),
(14, 'Flame Wheel', 'Rolling fire attack across battlefield', 1),
(15, 'Time Drain', 'Steals time energy from enemies', 1),
(16, 'Stone Throw', 'Hurls massive rocks at targets', 1),
(17, 'Crystal Maze', 'Creates confusing crystal barriers', 1),
(18, 'Thunder Clap', 'Stunning sonic boom attack', 1),
(19, 'Volcano Summon', 'Creates mini volcanic eruptions', 1),
(20, 'Chaos Wave', 'Unpredictable magical energy blast', 1);

-- =====================================================
-- ENEMY_TYPES TABLE (Depends on bosses)
-- =====================================================
INSERT INTO enemy_types (name, floor, is_boss, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url, boss_id) VALUES
-- Floor 1 enemies
('Skeleton Warrior', 1, FALSE, FALSE, 50, 10, 3, 2, 1, '/sprites/skeleton.png', NULL),
('Goblin Scout', 1, FALSE, FALSE, 30, 8, 5, 1, 2, '/sprites/goblin.png', NULL),
('Stone Gargoyle', 1, FALSE, TRUE, 80, 15, 2, 3, 1, '/sprites/gargoyle.png', NULL),
('Ancient Guardian', 1, TRUE, FALSE, 500, 50, 2, 4, 2, '/sprites/guardian.png', 1),
('Zombie Soldier', 1, FALSE, FALSE, 40, 12, 2, 2, 1, '/sprites/zombie.png', NULL),
('Shadow Imp', 1, FALSE, TRUE, 25, 20, 6, 1, 3, '/sprites/imp.png', NULL),
('Rust Golem', 1, FALSE, FALSE, 70, 18, 1, 4, 1, '/sprites/rust_golem.png', NULL),
('Bone Archer', 1, FALSE, FALSE, 35, 14, 3, 2, 4, '/sprites/bone_archer.png', NULL),
('Cave Spider', 1, FALSE, FALSE, 20, 6, 7, 1, 1, '/sprites/spider.png', NULL),
('Lost Soul', 1, FALSE, TRUE, 15, 25, 8, 1, 2, '/sprites/soul.png', NULL),

-- Floor 2 enemies
('Crystal Hound', 2, FALSE, FALSE, 60, 16, 4, 2, 1, '/sprites/crystal_hound.png', NULL),
('Gem Beetle', 2, FALSE, FALSE, 45, 12, 2, 3, 1, '/sprites/beetle.png', NULL),
('Crystal Golem', 2, TRUE, FALSE, 750, 75, 1, 5, 2, '/sprites/crystal_golem.png', 2),
('Stalactite Bat', 2, FALSE, FALSE, 25, 8, 8, 1, 2, '/sprites/bat.png', NULL),
('Mining Droid', 2, FALSE, TRUE, 90, 20, 2, 4, 3, '/sprites/droid.png', NULL),
('Prism Wraith', 2, FALSE, FALSE, 40, 18, 5, 2, 3, '/sprites/wraith.png', NULL),
('Rock Worm', 2, FALSE, FALSE, 100, 25, 1, 5, 1, '/sprites/worm.png', NULL),
('Quartz Guardian', 2, FALSE, TRUE, 120, 30, 2, 4, 2, '/sprites/quartz.png', NULL),
('Cave Troll', 2, FALSE, FALSE, 150, 35, 1, 6, 1, '/sprites/troll.png', NULL),
('Diamond Shard', 2, FALSE, FALSE, 30, 22, 6, 1, 4, '/sprites/diamond.png', NULL),

-- Floor 3 enemies
('Wind Elemental', 3, FALSE, FALSE, 50, 20, 7, 2, 3, '/sprites/wind_elem.png', NULL),
('Sky Serpent', 3, FALSE, FALSE, 80, 25, 5, 3, 2, '/sprites/serpent.png', NULL),
('Storm Lord', 3, TRUE, FALSE, 1000, 100, 3, 6, 4, '/sprites/storm_lord.png', 3),
('Cloud Walker', 3, FALSE, FALSE, 35, 15, 6, 2, 2, '/sprites/cloud.png', NULL),
('Thunder Bird', 3, FALSE, TRUE, 70, 30, 8, 2, 5, '/sprites/thunder_bird.png', NULL),
('Air Sprite', 3, FALSE, FALSE, 20, 12, 9, 1, 2, '/sprites/sprite.png', NULL),
('Flying Fortress', 3, FALSE, TRUE, 200, 45, 2, 7, 3, '/sprites/fortress.png', NULL),
('Zephyr Wolf', 3, FALSE, FALSE, 60, 22, 7, 2, 1, '/sprites/wolf.png', NULL),
('Cyclone Mage', 3, FALSE, FALSE, 55, 28, 4, 3, 4, '/sprites/mage.png', NULL),
('Lightning Falcon', 3, FALSE, FALSE, 40, 18, 10, 1, 6, '/sprites/falcon.png', NULL),

-- Floor 4 enemies
('Fire Demon', 4, FALSE, FALSE, 100, 35, 3, 3, 2, '/sprites/demon.png', NULL),
('Lava Slug', 4, FALSE, FALSE, 120, 40, 1, 4, 1, '/sprites/slug.png', NULL),
('Inferno Dragon', 4, TRUE, FALSE, 1250, 125, 2, 7, 3, '/sprites/dragon.png', 4),
('Ember Sprite', 4, FALSE, FALSE, 30, 25, 6, 2, 3, '/sprites/ember.png', NULL),
('Molten Golem', 4, FALSE, TRUE, 180, 50, 1, 5, 2, '/sprites/molten.png', NULL),
('Fire Salamander', 4, FALSE, FALSE, 70, 30, 4, 3, 1, '/sprites/salamander.png', NULL),
('Flame Wraith', 4, FALSE, FALSE, 50, 28, 5, 2, 3, '/sprites/flame_wraith.png', NULL),
('Volcano Worm', 4, FALSE, TRUE, 250, 60, 1, 8, 1, '/sprites/volcano_worm.png', NULL),
('Phoenix Guardian', 4, FALSE, FALSE, 90, 38, 6, 3, 4, '/sprites/phoenix.png', NULL),
('Magma Elemental', 4, FALSE, FALSE, 110, 42, 2, 4, 2, '/sprites/magma_elem.png', NULL),

-- Floor 5 enemies
('Void Stalker', 5, FALSE, FALSE, 120, 45, 4, 3, 2, '/sprites/stalker.png', NULL),
('Time Phantom', 5, FALSE, FALSE, 80, 55, 6, 2, 4, '/sprites/phantom.png', NULL),
('Temporal Wraith', 5, TRUE, FALSE, 1500, 150, 4, 8, 5, '/sprites/temporal.png', 5),
('Shadow Fiend', 5, FALSE, FALSE, 100, 50, 5, 3, 3, '/sprites/fiend.png', NULL),
('Chaos Beast', 5, FALSE, TRUE, 200, 70, 3, 5, 2, '/sprites/chaos.png', NULL),
('Void Crawler', 5, FALSE, FALSE, 90, 40, 7, 2, 1, '/sprites/crawler.png', NULL),
('Dark Oracle', 5, FALSE, FALSE, 70, 60, 3, 4, 5, '/sprites/oracle.png', NULL),
('Nightmare Hound', 5, FALSE, TRUE, 150, 65, 6, 3, 1, '/sprites/nightmare.png', NULL),
('Entropy Spider', 5, FALSE, FALSE, 60, 45, 5, 2, 2, '/sprites/entropy.png', NULL),
('Reality Bender', 5, FALSE, FALSE, 110, 55, 4, 4, 4, '/sprites/bender.png', NULL);

-- =====================================================
-- SESSIONS TABLE (Depends on users)
-- =====================================================
INSERT INTO sessions (user_id, last_active) VALUES
(1, '2024-01-15 10:30:00'), (2, '2024-01-15 11:45:00'), (3, '2024-01-15 12:15:00'),
(4, '2024-01-15 13:20:00'), (5, '2024-01-15 14:10:00'), (6, '2024-01-15 15:35:00'),
(7, '2024-01-15 16:50:00'), (8, '2024-01-15 17:25:00'), (9, '2024-01-15 18:40:00'),
(10, '2024-01-15 19:15:00'), (11, '2024-01-15 20:30:00'), (12, '2024-01-15 21:45:00'),
(13, '2024-01-16 08:20:00'), (14, '2024-01-16 09:35:00'), (15, '2024-01-16 10:50:00'),
(16, '2024-01-16 11:25:00'), (17, '2024-01-16 12:40:00'), (18, '2024-01-16 13:55:00'),
(19, '2024-01-16 14:30:00'), (20, '2024-01-16 15:45:00'), (21, '2024-01-16 16:20:00'),
(22, '2024-01-16 17:35:00'), (23, '2024-01-16 18:50:00'), (24, '2024-01-16 19:25:00'),
(25, '2024-01-16 20:40:00'), (26, '2024-01-16 21:55:00'), (27, '2024-01-17 08:10:00'),
(28, '2024-01-17 09:25:00'), (29, '2024-01-17 10:40:00'), (30, '2024-01-17 11:55:00'),
(31, '2024-01-17 12:30:00'), (32, '2024-01-17 13:45:00'), (33, '2024-01-17 14:20:00'),
(34, '2024-01-17 15:35:00'), (35, '2024-01-17 16:50:00'), (36, '2024-01-17 17:25:00'),
(37, '2024-01-17 18:40:00'), (38, '2024-01-17 19:55:00'), (39, '2024-01-17 20:30:00'),
(40, '2024-01-17 21:45:00'), (41, '2024-01-18 08:15:00'), (42, '2024-01-18 09:30:00'),
(43, '2024-01-18 10:45:00'), (44, '2024-01-18 11:20:00'), (45, '2024-01-18 12:35:00'),
(46, '2024-01-18 13:50:00'), (47, '2024-01-18 14:25:00'), (48, '2024-01-18 15:40:00'),
(49, '2024-01-18 16:55:00'), (50, '2024-01-18 17:30:00');

-- =====================================================
-- RUN_HISTORY TABLE (Depends on users and rooms)
-- =====================================================
INSERT INTO run_history (user_id, ended_at, completed, gold_collected, gold_spent, total_kills, death_cause, last_room_id) VALUES
(1, '2024-01-15 11:00:00', TRUE, 450, 300, 25, NULL, 7),
(2, '2024-01-15 12:30:00', FALSE, 200, 150, 12, 'Killed by Crystal Golem', 14),
(3, '2024-01-15 13:45:00', TRUE, 600, 500, 35, NULL, 21),
(4, '2024-01-15 14:20:00', FALSE, 150, 100, 8, 'Killed by Storm Lord', 21),
(5, '2024-01-15 15:10:00', TRUE, 800, 650, 42, NULL, 28),
(6, '2024-01-15 16:35:00', FALSE, 300, 200, 18, 'Killed by Inferno Dragon', 28),
(7, '2024-01-15 17:50:00', FALSE, 100, 50, 5, 'Killed by Skeleton Warrior', 1),
(8, '2024-01-15 18:25:00', TRUE, 550, 400, 28, NULL, 14),
(9, '2024-01-15 19:40:00', FALSE, 250, 180, 14, 'Killed by Wind Elemental', 15),
(10, '2024-01-15 20:15:00', TRUE, 700, 550, 38, NULL, 21),
(11, '2024-01-16 09:30:00', FALSE, 180, 120, 10, 'Killed by Goblin Scout', 2),
(12, '2024-01-16 10:45:00', TRUE, 520, 380, 31, NULL, 14),
(13, '2024-01-16 11:20:00', FALSE, 320, 240, 16, 'Killed by Crystal Hound', 8),
(14, '2024-01-16 12:35:00', TRUE, 650, 500, 36, NULL, 21),
(15, '2024-01-16 13:50:00', FALSE, 280, 200, 15, 'Killed by Fire Demon', 22),
(16, '2024-01-16 14:25:00', TRUE, 750, 600, 40, NULL, 28),
(17, '2024-01-16 15:40:00', FALSE, 220, 160, 12, 'Killed by Void Stalker', 29),
(18, '2024-01-16 16:55:00', TRUE, 480, 350, 26, NULL, 7),
(19, '2024-01-16 17:30:00', FALSE, 160, 100, 9, 'Killed by Stone Gargoyle', 3),
(20, '2024-01-16 18:45:00', TRUE, 580, 450, 33, NULL, 14),
(21, '2024-01-17 09:20:00', FALSE, 240, 180, 13, 'Killed by Prism Wraith', 16),
(22, '2024-01-17 10:35:00', TRUE, 620, 480, 34, NULL, 21),
(23, '2024-01-17 11:50:00', FALSE, 190, 140, 11, 'Killed by Thunder Bird', 18),
(24, '2024-01-17 12:25:00', TRUE, 680, 520, 37, NULL, 28),
(25, '2024-01-17 13:40:00', FALSE, 270, 190, 14, 'Killed by Molten Golem', 25),
(26, '2024-01-17 14:55:00', TRUE, 560, 420, 29, NULL, 14),
(27, '2024-01-17 15:30:00', FALSE, 210, 150, 12, 'Killed by Time Phantom', 30),
(28, '2024-01-17 16:45:00', TRUE, 640, 490, 35, NULL, 21),
(29, '2024-01-17 17:20:00', FALSE, 180, 130, 10, 'Killed by Chaos Beast', 32),
(30, '2024-01-17 18:35:00', TRUE, 720, 570, 39, NULL, 28);

-- Add more runs to reach 40-50 total
INSERT INTO run_history (user_id, ended_at, completed, gold_collected, gold_spent, total_kills, death_cause, last_room_id) VALUES
(31, '2024-01-18 09:15:00', FALSE, 260, 180, 13, 'Killed by Ancient Guardian', 7),
(32, '2024-01-18 10:30:00', TRUE, 590, 440, 32, NULL, 14),
(33, '2024-01-18 11:45:00', FALSE, 230, 170, 11, 'Killed by Crystal Golem', 14),
(34, '2024-01-18 12:20:00', TRUE, 670, 510, 36, NULL, 21),
(35, '2024-01-18 13:35:00', FALSE, 290, 210, 15, 'Killed by Storm Lord', 21),
(36, '2024-01-18 14:50:00', TRUE, 610, 460, 33, NULL, 28),
(37, '2024-01-18 15:25:00', FALSE, 200, 140, 10, 'Killed by Inferno Dragon', 28),
(38, '2024-01-18 16:40:00', TRUE, 730, 580, 41, NULL, 35),
(39, '2024-01-18 17:15:00', FALSE, 250, 180, 12, 'Killed by Temporal Wraith', 35),
(40, '2024-01-18 18:30:00', TRUE, 690, 530, 38, NULL, 35),
(41, '2024-01-19 09:10:00', FALSE, 170, 120, 9, 'Killed by Shadow Imp', 6),
(42, '2024-01-19 10:25:00', TRUE, 540, 400, 30, NULL, 14),
(43, '2024-01-19 11:40:00', FALSE, 310, 230, 16, 'Killed by Mining Droid', 15),
(44, '2024-01-19 12:15:00', TRUE, 660, 500, 35, NULL, 21),
(45, '2024-01-19 13:30:00', FALSE, 280, 200, 14, 'Killed by Flying Fortress', 19),
(46, '2024-01-19 14:45:00', TRUE, 620, 470, 34, NULL, 28),
(47, '2024-01-19 15:20:00', FALSE, 240, 170, 12, 'Killed by Volcano Worm', 26),
(48, '2024-01-19 16:35:00', TRUE, 710, 560, 39, NULL, 35),
(49, '2024-01-19 17:10:00', FALSE, 220, 160, 11, 'Killed by Nightmare Hound', 33),
(50, '2024-01-19 18:25:00', TRUE, 760, 600, 42, NULL, 35);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1; 