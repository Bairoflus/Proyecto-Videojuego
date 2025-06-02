-- Drop existing database if it exists
DROP DATABASE IF EXISTS `ProjectShatteredTimeline`;

-- 1. Create the database
CREATE DATABASE `ProjectShatteredTimeline`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 2. Select the database
USE `ProjectShatteredTimeline`;

-- 3. Lookup tables
CREATE TABLE `event_types` (
  `event_type` VARCHAR(50) NOT NULL COMMENT 'Type of event',
  PRIMARY KEY (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for event types';

CREATE TABLE `weapon_slots` (
  `slot_type` VARCHAR(50) NOT NULL COMMENT 'Type of weapon slot',
  PRIMARY KEY (`slot_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for weapon slot types';

CREATE TABLE `upgrade_types` (
  `upgrade_type` VARCHAR(50) NOT NULL COMMENT 'Type of upgrade',
  PRIMARY KEY (`upgrade_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for upgrade types';

CREATE TABLE `boss_results` (
  `result_code` VARCHAR(50) NOT NULL COMMENT 'Result code for boss fight',
  PRIMARY KEY (`result_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for boss combat results';

CREATE TABLE `room_types` (
  `room_type` VARCHAR(50) NOT NULL COMMENT 'Type of room',
  PRIMARY KEY (`room_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for room types';

CREATE TABLE `item_types` (
  `item_type` VARCHAR(50) NOT NULL COMMENT 'Type of item',
  PRIMARY KEY (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lookup table for item types';

-- 4. Core user tables
CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Player ID',
  `username` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Username',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email address',
  `password_hash` CHAR(60) NOT NULL COMMENT 'Password hash (bcrypt)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation timestamp',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player account data';

CREATE TABLE `sessions` (
  `session_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Session ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `session_token` CHAR(36) NOT NULL DEFAULT (UUID()) COMMENT 'Session token (UUID)',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Session start timestamp',
  `closed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Session closed timestamp',
  `last_active` DATETIME NULL DEFAULT NULL COMMENT 'Last active timestamp',
  PRIMARY KEY (`session_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Active player sessions';

CREATE TABLE `player_stats` (
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `total_runs` INT NOT NULL DEFAULT 0 COMMENT 'Total runs',
  `runs_completed` INT NOT NULL DEFAULT 0 COMMENT 'Runs completed',
  `total_kills` INT NOT NULL DEFAULT 0 COMMENT 'Total kills',
  `best_single_run_kills` INT NOT NULL DEFAULT 0 COMMENT 'Best single-run kills',
  `highest_damage_hit` INT NOT NULL DEFAULT 0 COMMENT 'Highest damage hit',
  `total_gold_earned` INT NOT NULL DEFAULT 0 COMMENT 'Total gold earned',
  `total_gold_spent` INT NOT NULL DEFAULT 0 COMMENT 'Total gold spent',
  `total_playtime_seconds` INT NOT NULL DEFAULT 0 COMMENT 'Total playtime in seconds',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player-visible statistics';


CREATE TABLE `player_upgrades` (
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `upgrade_type` VARCHAR(50) NOT NULL COMMENT 'References upgrade_types(upgrade_type)',
  `level` SMALLINT COMMENT 'Upgrade level',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  PRIMARY KEY (`user_id`,`upgrade_type`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`upgrade_type`) REFERENCES `upgrade_types`(`upgrade_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permanent upgrades between runs';

-- 5. Rooms and runs
CREATE TABLE `rooms` (
  `room_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Room ID',
  `floor` INT COMMENT 'Floor number',
  `name` VARCHAR(50) COMMENT 'Room name',
  `room_type` VARCHAR(50) NOT NULL COMMENT 'References room_types(room_type)',
  `sequence_order` SMALLINT COMMENT 'Sequence order within floor',
  PRIMARY KEY (`room_id`),
  FOREIGN KEY (`room_type`) REFERENCES `room_types`(`room_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Rooms by floor and type';

CREATE TABLE `run_history` (
  `run_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Run ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Run start timestamp',
  `ended_at` DATETIME NULL DEFAULT NULL COMMENT 'Run end timestamp',
  `completed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Run completion flag',
  `gold_collected` INT NOT NULL DEFAULT 0 COMMENT 'Gold collected',
  `gold_spent` INT NOT NULL DEFAULT 0 COMMENT 'Gold spent',
  `total_kills` INT NOT NULL DEFAULT 0 COMMENT 'Total kills',
  `death_cause` TEXT COMMENT 'Cause of death',
  `last_room_id` INT NULL DEFAULT NULL COMMENT 'Last room visited',
  PRIMARY KEY (`run_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`last_room_id`) REFERENCES `rooms`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Each player run attempt';

-- 6. Permanent upgrade purchases
CREATE TABLE `permanent_upgrade_purchases` (
  `purchase_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Purchase ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `upgrade_type` VARCHAR(50) NOT NULL COMMENT 'References upgrade_types(upgrade_type)',
  `level_before` SMALLINT COMMENT 'Upgrade level before purchase',
  `level_after` SMALLINT COMMENT 'Upgrade level after purchase',
  `gold_spent` INT COMMENT 'Gold spent',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Purchase timestamp',
  PRIMARY KEY (`purchase_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`upgrade_type`) REFERENCES `upgrade_types`(`upgrade_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Purchase history of permanent upgrades';

-- 7. Autosave states
CREATE TABLE `save_states` (
  `save_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Save ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `session_id` INT NOT NULL COMMENT 'References sessions(session_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `current_hp` SMALLINT COMMENT 'Current HP',
  `current_stamina` SMALLINT COMMENT 'Current stamina',
  `gold` INT COMMENT 'Gold amount',
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Save timestamp',
  PRIMARY KEY (`save_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Auto-save system per room';

-- 8. Equipped weapons & temporary upgrades
CREATE TABLE `equipped_weapons` (
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `slot_type` VARCHAR(50) NOT NULL COMMENT 'References weapon_slots(slot_type)',
  PRIMARY KEY (`run_id`,`user_id`,`slot_type`),
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`slot_type`) REFERENCES `weapon_slots`(`slot_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Equipped weapons by slot at run start';

CREATE TABLE `weapon_upgrades_temp` (
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `slot_type` VARCHAR(50) NOT NULL COMMENT 'References weapon_slots(slot_type)',
  `level` SMALLINT COMMENT 'Upgrade level',
  `damage_per_upgrade` SMALLINT COMMENT 'Damage per upgrade',
  `gold_cost_per_upgrade` SMALLINT COMMENT 'Gold cost per upgrade',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Upgrade timestamp',
  PRIMARY KEY (`run_id`,`user_id`,`slot_type`),
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`slot_type`) REFERENCES `weapon_slots`(`slot_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Temporary weapon upgrade progress';

-- 9. Enemies and bosses
CREATE TABLE `enemy_types` (
  `enemy_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Enemy ID',
  `name` VARCHAR(50) COMMENT 'Enemy name',
  `floor` INT COMMENT 'Enemy floor',
  `is_rare` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is rare enemy flag',
  `base_hp` SMALLINT COMMENT 'Base HP',
  `base_damage` SMALLINT COMMENT 'Base damage',
  `movement_speed` SMALLINT COMMENT 'Movement speed',
  `attack_cooldown_seconds` SMALLINT COMMENT 'Attack cooldown in seconds',
  `attack_range` SMALLINT COMMENT 'Attack range',
  `sprite_url` VARCHAR(255) COMMENT 'Enemy sprite URL',
  PRIMARY KEY (`enemy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Enemy catalog';

CREATE TABLE `boss_details` (
  `enemy_id` INT NOT NULL COMMENT 'References enemy_types(enemy_id)',
  `max_hp` INT COMMENT 'Maximum HP',
  `description` TEXT COMMENT 'Boss description',
  PRIMARY KEY (`enemy_id`),
  FOREIGN KEY (`enemy_id`) REFERENCES `enemy_types`(`enemy_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Boss details (subtype of enemy_types)';

CREATE TABLE `boss_moves` (
  `move_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Move ID',
  `enemy_id` INT NOT NULL COMMENT 'References boss_details(enemy_id)',
  `name` VARCHAR(50) COMMENT 'Move name',
  `description` TEXT COMMENT 'Move description',
  `phase` SMALLINT COMMENT 'Boss phase',
  PRIMARY KEY (`move_id`),
  FOREIGN KEY (`enemy_id`) REFERENCES `boss_details`(`enemy_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Special boss moves';

-- 10. Combat history
CREATE TABLE `enemy_kills` (
  `kill_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Kill ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `enemy_id` INT NOT NULL COMMENT 'References enemy_types(enemy_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Kill timestamp',
  PRIMARY KEY (`kill_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`enemy_id`) REFERENCES `enemy_types`(`enemy_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='History of enemies killed by player';

CREATE TABLE `boss_encounters` (
  `encounter_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Encounter ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `enemy_id` INT NOT NULL COMMENT 'References boss_details(enemy_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `damage_dealt` INT COMMENT 'Damage dealt to boss',
  `damage_taken` INT COMMENT 'Damage taken from boss',
  `result_code` VARCHAR(50) NOT NULL COMMENT 'References boss_results(result_code)',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Encounter timestamp',
  PRIMARY KEY (`encounter_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`enemy_id`) REFERENCES `boss_details`(`enemy_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`result_code`) REFERENCES `boss_results`(`result_code`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Boss combat statistics';

CREATE TABLE `boss_kills` (
  `kill_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Kill ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `enemy_id` INT NOT NULL COMMENT 'References boss_details(enemy_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Kill timestamp',
  PRIMARY KEY (`kill_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`enemy_id`) REFERENCES `boss_details`(`enemy_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='History of bosses killed by player';

-- 11. Economy events
CREATE TABLE `shop_purchases` (
  `purchase_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Purchase ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `item_type` VARCHAR(50) NOT NULL COMMENT 'References item_types(item_type)',
  `item_name` VARCHAR(50) COMMENT 'Item name',
  `gold_spent` INT COMMENT 'Gold spent',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Purchase timestamp',
  PRIMARY KEY (`purchase_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`item_type`) REFERENCES `item_types`(`item_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='History of shop purchases';

CREATE TABLE `chest_events` (
  `event_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Event ID',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `gold_received` INT COMMENT 'Gold received from chest',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Chest open timestamp',
  PRIMARY KEY (`event_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Record of chests opened by player';

-- 12. Settings and player actions
CREATE TABLE `player_settings` (
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `music_volume` INT COMMENT 'Music volume level',
  `sfx_volume` INT COMMENT 'SFX volume level',
  `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player audio settings';

CREATE TABLE `player_events` (
  `event_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Event ID',
  `run_id` INT NOT NULL COMMENT 'References run_history(run_id)',
  `user_id` INT NOT NULL COMMENT 'References users(user_id)',
  `room_id` INT NOT NULL COMMENT 'References rooms(room_id)',
  `event_type` VARCHAR(50) NOT NULL COMMENT 'References event_types(event_type)',
  `value` INT COMMENT 'Event value',
  `weapon_type` VARCHAR(20) COMMENT 'Weapon type used',
  `context` VARCHAR(50) COMMENT 'Event context',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Event timestamp',
  PRIMARY KEY (`event_id`),
  FOREIGN KEY (`run_id`) REFERENCES `run_history`(`run_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`event_type`) REFERENCES `event_types`(`event_type`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Player actions log';