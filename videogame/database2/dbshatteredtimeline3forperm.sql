-- ===================================================
-- SHATTERED TIMELINE - DATABASE STRUCTURE v3.0
-- ===================================================
-- Version: 3.0 - Complete database structure with fixed persistence
-- Focus: Tables, constraints, indexes, and initial data only
-- Objective: Create database structure for run persistence, permanent & temporary upgrades
-- Note: Execute objects3.sql after this file for views, triggers, and procedures
-- ===================================================

-- Drop database if exists and create new one
DROP DATABASE IF EXISTS dbshatteredtimeline;
CREATE DATABASE dbshatteredtimeline 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE dbshatteredtimeline;

-- ===================================================
-- AUTHENTICATION AND SESSIONS (2 tables)
-- ===================================================

-- Table: users - Basic authentication with role system
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('player', 'admin') DEFAULT 'player',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Performance indexes
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active_users (is_active, last_login),
    INDEX idx_user_role (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Game users - basic authentication with role system';

-- Table: sessions - Active session control
CREATE TABLE sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Performance indexes
    INDEX idx_user_sessions (user_id, is_active),
    INDEX idx_session_token (session_token),
    INDEX idx_session_expiry (expires_at, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Active user sessions';

-- ===================================================
-- USER RUN PROGRESS (CRITICAL FIX)
-- ===================================================

-- NEW TABLE: user_run_progress - Persistent run counter per user
CREATE TABLE user_run_progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    current_run_number INT DEFAULT 1,
    highest_floor_reached INT DEFAULT 1,
    total_completed_runs INT DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_progress (user_id),
    -- Performance indexes
    INDEX idx_user_runs (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'CRITICAL: Persistent run counter and progress per user';

-- ===================================================
-- PLAYER STATE (3 tables - ENHANCED)
-- ===================================================

-- Table: save_states - Saved state for continuity (ENHANCED with run_number)
CREATE TABLE save_states (
    save_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    run_id INT NULL,
    run_number INT DEFAULT 1,  -- NEW: Store run number for UI display
    floor_id INT DEFAULT 1,
    room_id INT DEFAULT 1,
    current_hp INT DEFAULT 100,
    gold INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_save_states (user_id, is_active),
    INDEX idx_session_save_states (session_id),
    INDEX idx_run_save_states (run_id),
    INDEX idx_floor_room (floor_id, room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Player saved state for continuity between sessions (ENHANCED with run_number)';

-- Table: permanent_player_upgrades - Character permanent upgrades (ENHANCED)
CREATE TABLE permanent_player_upgrades (
    upgrade_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    upgrade_type ENUM('health_max', 'stamina_max', 'movement_speed') NOT NULL,
    level INT DEFAULT 1,
    -- NEW: Add calculated values for frontend consumption
    current_value DECIMAL(10,2) DEFAULT 0,  -- Current calculated stat value
    base_value DECIMAL(10,2) DEFAULT 0,     -- Base stat value
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_upgrade (user_id, upgrade_type),
    -- Performance indexes
    INDEX idx_user_upgrades (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Character permanent upgrades with calculated values';

-- Table: weapon_upgrades_temp - Temporary weapon upgrades per run (ENHANCED)
CREATE TABLE weapon_upgrades_temp (
    temp_upgrade_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    run_number INT DEFAULT 1,  -- NEW: Store run number for validation
    melee_level INT DEFAULT 1,
    ranged_level INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,  -- NEW: Track if upgrades are active
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_run (user_id, run_id),
    -- Performance indexes
    INDEX idx_user_weapon_upgrades (user_id),
    INDEX idx_run_weapon_upgrades (run_id),
    INDEX idx_active_upgrades (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Temporary weapon upgrades with active status tracking';

-- ===================================================
-- ANALYTICS AND STATISTICS (5 tables - ENHANCED)
-- ===================================================

-- Table: player_stats - Aggregated historical statistics (ENHANCED)
CREATE TABLE player_stats (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_runs INT DEFAULT 0,
    total_kills INT DEFAULT 0,
    total_deaths INT DEFAULT 0,
    total_gold_earned INT DEFAULT 0,
    total_gold_spent INT DEFAULT 0,
    total_bosses_killed INT DEFAULT 0,
    total_playtime_seconds INT DEFAULT 0,
    highest_floor_ever INT DEFAULT 1,  -- NEW: Track highest floor reached
    max_damage_hit INT DEFAULT 0,      -- NEW: Track maximum damage dealt in single hit
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_stats (user_id),
    -- Performance indexes
    INDEX idx_total_bosses (total_bosses_killed),
    INDEX idx_player_performance (total_runs, total_kills),
    INDEX idx_highest_floor (highest_floor_ever),
    INDEX idx_max_damage (max_damage_hit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Player aggregated historical statistics with floor tracking and max damage';

-- Table: run_history - Game attempt history (ENHANCED)
CREATE TABLE run_history (
    run_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_number INT NOT NULL,  -- NEW: Store run number for reference
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    final_floor INT DEFAULT 1,
    final_gold INT DEFAULT 0,
    gold_spent INT DEFAULT 0,
    cause_of_death ENUM('enemy_kill', 'boss_kill', 'timeout', 'disconnect', 'victory', 'active') DEFAULT 'active',
    total_kills INT DEFAULT 0,
    bosses_killed INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    max_damage_hit INT DEFAULT 0,  -- NEW: Maximum damage dealt in single hit during this run
    
    -- Performance indexes
    INDEX idx_user_runs (user_id, started_at),
    INDEX idx_active_runs (cause_of_death, ended_at),
    INDEX idx_run_performance (final_floor, total_kills),
    INDEX idx_run_number (user_id, run_number),
    INDEX idx_max_damage_run (max_damage_hit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Player game attempt history with run numbers and max damage tracking';

-- Table: weapon_upgrade_purchases - Shop purchases
CREATE TABLE weapon_upgrade_purchases (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    run_number INT NOT NULL,  -- NEW: Store run number for reference
    weapon_type ENUM('melee', 'ranged') NOT NULL,
    upgrade_level INT NOT NULL,
    cost INT NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_purchases (user_id, purchased_at),
    INDEX idx_run_purchases (run_id),
    INDEX idx_weapon_analytics (weapon_type, upgrade_level),
    INDEX idx_run_number_purchases (user_id, run_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Weapon upgrade purchase records with run numbers';

-- Table: enemy_kills - Enemy kill tracking
CREATE TABLE enemy_kills (
    kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    run_number INT NOT NULL,  -- NEW: Store run number for reference
    enemy_type ENUM('common', 'rare') NOT NULL,
    room_id INT NOT NULL,
    floor INT NOT NULL,
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_kills (user_id, killed_at),
    INDEX idx_run_kills (run_id),
    INDEX idx_combat_analytics (enemy_type, floor),
    INDEX idx_run_number_kills (user_id, run_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Enemy elimination records with run numbers';

-- Table: boss_kills - Boss-specific tracking
CREATE TABLE boss_kills (
    boss_kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    run_number INT NOT NULL,  -- NEW: Store run number for reference
    boss_type ENUM('dragon') NOT NULL DEFAULT 'dragon',
    floor INT NOT NULL,
    fight_duration_seconds INT DEFAULT 0,
    player_hp_remaining INT DEFAULT 0,
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_boss_kills (user_id, killed_at),
    INDEX idx_run_boss_kills (run_id),
    INDEX idx_boss_analytics (boss_type, floor),
    INDEX idx_run_number_boss_kills (user_id, run_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'ENHANCED: Boss elimination records with run numbers';

-- ===================================================
-- CONFIGURATION (1 table)
-- ===================================================

-- Table: player_settings - Player configurations
CREATE TABLE player_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    music_volume FLOAT DEFAULT 0.7 CHECK (music_volume >= 0 AND music_volume <= 1),
    sfx_volume FLOAT DEFAULT 0.8 CHECK (sfx_volume >= 0 AND sfx_volume <= 1),
    auto_save_enabled BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Player custom configurations';

-- ===================================================
-- FOREIGN KEY CONSTRAINTS (Referential Integrity)
-- ===================================================

-- Authentication domain constraints
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

-- User run progress constraints
ALTER TABLE user_run_progress 
ADD CONSTRAINT fk_user_run_progress_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

-- Player state domain constraints
ALTER TABLE save_states 
ADD CONSTRAINT fk_save_states_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE save_states 
ADD CONSTRAINT fk_save_states_session 
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) 
    ON DELETE CASCADE;

ALTER TABLE save_states 
ADD CONSTRAINT fk_save_states_run 
    FOREIGN KEY (run_id) REFERENCES run_history(run_id) 
    ON DELETE SET NULL;

ALTER TABLE permanent_player_upgrades 
ADD CONSTRAINT fk_permanent_upgrades_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE weapon_upgrades_temp 
ADD CONSTRAINT fk_weapon_upgrades_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE weapon_upgrades_temp 
ADD CONSTRAINT fk_weapon_upgrades_run 
    FOREIGN KEY (run_id) REFERENCES run_history(run_id) 
    ON DELETE CASCADE;

-- Analytics domain constraints
ALTER TABLE player_stats 
ADD CONSTRAINT fk_player_stats_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE run_history 
ADD CONSTRAINT fk_run_history_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE weapon_upgrade_purchases 
ADD CONSTRAINT fk_purchases_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE weapon_upgrade_purchases 
ADD CONSTRAINT fk_purchases_run 
    FOREIGN KEY (run_id) REFERENCES run_history(run_id) 
    ON DELETE CASCADE;

ALTER TABLE enemy_kills 
ADD CONSTRAINT fk_enemy_kills_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE enemy_kills 
ADD CONSTRAINT fk_enemy_kills_run 
    FOREIGN KEY (run_id) REFERENCES run_history(run_id) 
    ON DELETE CASCADE;

ALTER TABLE boss_kills 
ADD CONSTRAINT fk_boss_kills_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE boss_kills 
ADD CONSTRAINT fk_boss_kills_run 
    FOREIGN KEY (run_id) REFERENCES run_history(run_id) 
    ON DELETE CASCADE;

-- Configuration domain constraints
ALTER TABLE player_settings 
ADD CONSTRAINT fk_player_settings_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE;

-- ===================================================
-- INITIAL DATA FOR TESTING
-- ===================================================

-- NOTE: Admin users are now created via admin_user_setup.sql
-- Execute admin_user_setup.sql after objects3.sql for admin access

-- Test user
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@shatteredtimeline.com', '$2b$10$dummy.hash.for.testing.purposes.only');

-- ===================================================
-- STRUCTURE VERIFICATION
-- ===================================================

-- Show all created tables
SHOW TABLES;

-- Show structure of main tables
DESCRIBE users;
DESCRIBE user_run_progress;
DESCRIBE save_states;
DESCRIBE permanent_player_upgrades;
DESCRIBE weapon_upgrades_temp;
DESCRIBE player_stats;

-- Verify foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dbshatteredtimeline'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ===================================================
-- DATABASE STRUCTURE SUMMARY v3.0
-- ===================================================
/*
TOTAL TABLES: 12 (NEW: +1 user_run_progress)
- Authentication: 2 (users, sessions)
- User Progress: 1 (user_run_progress) - CRITICAL FIX
- Player State: 3 (save_states, permanent_player_upgrades, weapon_upgrades_temp)  
- Analytics: 5 (player_stats, run_history, weapon_upgrade_purchases, enemy_kills, boss_kills)
- Configuration: 1 (player_settings)

STRUCTURE FEATURES v3.0:

#1 RUN PERSISTENCE (CRITICAL FIX):
- NEW TABLE: user_run_progress with current_run_number
- ENHANCED: All analytics tables now store run_number
- RESULT: Run number persists across logout/login

#2 PERMANENT UPGRADES (ENHANCED):
- NEW COLUMNS: current_value, base_value in permanent_player_upgrades
- RESULT: Frontend can read calculated values directly from DB

#3 TEMPORARY UPGRADES (ENHANCED):
- NEW COLUMN: is_active in weapon_upgrades_temp
- NEW COLUMN: run_number for validation
- RESULT: Upgrades persist between logout/login until run ends

#4 ADDITIONAL ENHANCEMENTS:
- ENHANCED: All tables track run_number for better analytics
- ENHANCED: player_stats tracks highest_floor_ever
- ENHANCED: user_run_progress tracks highest_floor_reached
- ENHANCED: Complete foreign key constraint enforcement

NEXT STEP: Execute objects3.sql for views, triggers, and procedures

ADMIN SETUP: Execute admin_user_setup.sql after objects3.sql for admin dashboard access

RESULT: Complete database structure with ALL required functionalities
ENGINE: InnoDB for all tables
CHARSET: utf8mb4 for full Unicode support
NORMALIZATION: 1NF, 2NF, 3NF compliant
REFERENTIAL INTEGRITY: Full foreign key constraint enforcement
*/ 