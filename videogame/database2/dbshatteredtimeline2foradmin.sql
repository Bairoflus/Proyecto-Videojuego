-- ===================================================
-- SHATTERED TIMELINE - OPTIMIZED DATABASE v2.4
-- ===================================================
-- Version: 2.4 - Added admin role system + admin user
-- Tables: 11 essential (same as v2.3 but with admin functionality)
-- Objective: Add role-based access for admin dashboard
-- Improvements: Based on admin dashboard requirements
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

-- Table: sessions - Active session control (OPTIMIZED: removed logout_at)
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
-- PLAYER STATE (3 tables)
-- ===================================================

-- Table: save_states - Saved state for continuity (OPTIMIZED: removed logout_timestamp)
CREATE TABLE save_states (
    save_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    run_id INT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Player saved state for continuity between sessions';

-- Table: permanent_player_upgrades - Character permanent upgrades
CREATE TABLE permanent_player_upgrades (
    upgrade_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    upgrade_type ENUM('health_max', 'stamina_max', 'movement_speed') NOT NULL,
    level INT DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_upgrade (user_id, upgrade_type),
    -- Performance indexes
    INDEX idx_user_upgrades (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Character permanent upgrades: Health (+15), Stamina (+20), MovementSpeed (+10%)';

-- Table: weapon_upgrades_temp - Temporary weapon upgrades per run
CREATE TABLE weapon_upgrades_temp (
    temp_upgrade_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    melee_level INT DEFAULT 1,
    ranged_level INT DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_run (user_id, run_id),
    -- Performance indexes
    INDEX idx_user_weapon_upgrades (user_id),
    INDEX idx_run_weapon_upgrades (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Temporary weapon upgrades. Maintained on logout, reset on death';

-- ===================================================
-- ANALYTICS AND STATISTICS (5 tables)
-- ===================================================

-- Table: player_stats - Aggregated historical statistics (ENHANCED: added total_gold_spent)
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
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_stats (user_id),
    -- Performance indexes
    INDEX idx_total_bosses (total_bosses_killed),
    INDEX idx_player_performance (total_runs, total_kills)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Player aggregated historical statistics';

-- Table: run_history - Game attempt history (ENHANCED: added gold_spent tracking)
CREATE TABLE run_history (
    run_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    final_floor INT DEFAULT 1,
    final_gold INT DEFAULT 0,
    gold_spent INT DEFAULT 0,
    cause_of_death ENUM('enemy_kill', 'boss_kill', 'timeout', 'disconnect', 'active') DEFAULT 'active',
    total_kills INT DEFAULT 0,
    bosses_killed INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    
    -- Performance indexes
    INDEX idx_user_runs (user_id, started_at),
    INDEX idx_active_runs (cause_of_death, ended_at),
    INDEX idx_run_performance (final_floor, total_kills)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Player game attempt history (runs)';

-- Table: weapon_upgrade_purchases - Shop purchases
CREATE TABLE weapon_upgrade_purchases (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    weapon_type ENUM('melee', 'ranged') NOT NULL,
    upgrade_level INT NOT NULL,
    cost INT NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_purchases (user_id, purchased_at),
    INDEX idx_run_purchases (run_id),
    INDEX idx_weapon_analytics (weapon_type, upgrade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Weapon upgrade purchase records from shop';

-- Table: enemy_kills - Enemy kill tracking
CREATE TABLE enemy_kills (
    kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    enemy_type ENUM('common', 'rare') NOT NULL,
    room_id INT NOT NULL,
    floor INT NOT NULL,
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_kills (user_id, killed_at),
    INDEX idx_run_kills (run_id),
    INDEX idx_combat_analytics (enemy_type, floor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Enemy elimination records for analytics';

-- Table: boss_kills - Boss-specific tracking
CREATE TABLE boss_kills (
    boss_kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    boss_type ENUM('dragon') NOT NULL DEFAULT 'dragon',
    floor INT NOT NULL,
    fight_duration_seconds INT DEFAULT 0,
    player_hp_remaining INT DEFAULT 0,
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_user_boss_kills (user_id, killed_at),
    INDEX idx_run_boss_kills (run_id),
    INDEX idx_boss_analytics (boss_type, floor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT = 'Boss elimination specific records';

-- ===================================================
-- CONFIGURATION (1 table)
-- ===================================================

-- Table: player_settings - Player configurations (OPTIMIZED: removed show_fps)
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
-- TRIGGERS AND PROCEDURES (ENHANCED)
-- ===================================================

-- Trigger: Update player_stats when run ends (ENHANCED: includes gold_spent tracking)
DELIMITER //
CREATE TRIGGER tr_update_player_stats_after_run
AFTER UPDATE ON run_history
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        INSERT INTO player_stats (user_id, total_runs, total_kills, total_deaths, total_gold_earned, total_gold_spent, total_bosses_killed, total_playtime_seconds)
        VALUES (NEW.user_id, 1, NEW.total_kills, 1, NEW.final_gold, NEW.gold_spent, NEW.bosses_killed, NEW.duration_seconds)
        ON DUPLICATE KEY UPDATE 
            total_runs = total_runs + 1,
            total_kills = total_kills + NEW.total_kills,
            total_deaths = total_deaths + 1,
            total_gold_earned = total_gold_earned + NEW.final_gold,
            total_gold_spent = total_gold_spent + NEW.gold_spent,
            total_bosses_killed = total_bosses_killed + NEW.bosses_killed,
            total_playtime_seconds = total_playtime_seconds + NEW.duration_seconds;
    END IF;
END//
DELIMITER ;

-- Trigger: Update run gold_spent when weapon purchase occurs (NEW)
DELIMITER //
CREATE TRIGGER tr_update_run_gold_spent
AFTER INSERT ON weapon_upgrade_purchases
FOR EACH ROW
BEGIN
    UPDATE run_history 
    SET gold_spent = gold_spent + NEW.cost
    WHERE run_id = NEW.run_id;
END//
DELIMITER ;

-- Trigger: Create default configurations for new users
DELIMITER //
CREATE TRIGGER tr_create_default_settings
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO player_settings (user_id) VALUES (NEW.user_id);
    INSERT INTO player_stats (user_id) VALUES (NEW.user_id);
END//
DELIMITER ;

-- ===================================================
-- INITIAL DATA FOR TESTING AND ADMIN
-- ===================================================

-- Admin user (password: 123456)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@shatteredtimeline.com', '$2b$10$N9qo8uLOickgx2ZMRjOYNe.5YSaGdm3JPcOF5Pb.G8HAwLYn4Yz6W', 'admin');

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
DESCRIBE sessions;
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
-- DATABASE SUMMARY v2.4
-- ===================================================
/*
TOTAL TABLES: 11 (unchanged from v2.3)
- Authentication: 2 (users, sessions)
- Player State: 3 (save_states, permanent_player_upgrades, weapon_upgrades_temp)  
- Analytics: 5 (player_stats, run_history, weapon_upgrade_purchases, enemy_kills, boss_kills)
- Configuration: 1 (player_settings)

NEW v2.4:
✅ ADMIN SYSTEM:
- Added users.role column (player/admin)
- Created admin user (username: admin, password: 123456)
- Added idx_user_role index for role-based queries

MAINTAINED OPTIMIZATIONS v2.3:
✅ REMOVED UNUSED COLUMNS:
- sessions.logout_at (redundant)
- save_states.logout_timestamp (redundant)
- player_settings.show_fps (not implemented in frontend)

✅ ENHANCED FUNCTIONALITY:
- Added player_stats.total_gold_spent (for complete statistics)
- Added run_history.gold_spent (for per-run tracking)
- Enhanced tr_update_player_stats_after_run trigger (includes gold_spent)
- Added tr_update_run_gold_spent trigger (automatic gold tracking)

✅ ALL REQUIRED FUNCTIONALITIES:
- #1 Run persistence: ✅ player_stats.total_runs + triggers
- #2 Permanent upgrades: ✅ permanent_player_upgrades table
- #3 Temporary weapon upgrades: ✅ weapon_upgrades_temp table
- #4 Player statistics: ✅ Enhanced with gold_spent tracking
- #5 Admin dashboard: ✅ Role-based access with admin user

ADMIN CREDENTIALS:
- Username: admin
- Password: 123456
- Email: admin@shatteredtimeline.com

RESULT: Complete database with admin functionality and 100% feature coverage
ENGINE: InnoDB for all tables
CHARSET: utf8mb4 for full Unicode support
NORMALIZATION: 1NF, 2NF, 3NF compliant
REFERENTIAL INTEGRITY: Full foreign key constraint enforcement
*/ 