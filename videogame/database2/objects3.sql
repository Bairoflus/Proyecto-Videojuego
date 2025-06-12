-- ===================================================
-- SHATTERED TIMELINE - DATABASE OBJECTS v3.0
-- ===================================================
-- Version: 3.0 - Views, triggers, and procedures for enhanced functionality
-- Focus: Database objects only (views, triggers, procedures, permissions)
-- Objective: Complete database objects for run persistence, permanent & temporary upgrades
-- Note: Execute this file AFTER dbshatteredtimeline3forperm.sql
-- ===================================================

USE dbshatteredtimeline;

-- ===================================================
-- USER AND SESSION VIEWS (CLEAN)
-- ===================================================

-- View: User authentication profile
CREATE VIEW vw_user_profile AS
SELECT 
    user_id as player_id,
    username as player_name,
    email as contact_email,
    role as user_role,
    created_at as registration_date,
    last_login as last_session,
    is_active as account_status
FROM users;

-- View: Session management
CREATE VIEW vw_user_sessions AS
SELECT 
    session_id as session,
    user_id as player,
    created_at as login_time,
    expires_at as session_end,
    is_active as active_status
FROM sessions;

-- ===================================================
-- USER RUN PROGRESS VIEWS (CRITICAL FIX)
-- ===================================================

-- NEW VIEW: User run progress (for run persistence)
CREATE VIEW vw_user_run_progress AS
SELECT 
    progress_id as progress_identifier,
    user_id as player,
    current_run_number as current_run,
    highest_floor_reached as best_floor,
    total_completed_runs as finished_runs,
    last_updated as progress_updated
FROM user_run_progress;

-- NEW VIEW: Current run information (combines run_history + progress)
CREATE VIEW vw_current_run_info AS
SELECT 
    urp.user_id as player,
    urp.current_run_number as run_number,
    urp.highest_floor_reached as lifetime_best_floor,
    urp.total_completed_runs as total_completed,
    COALESCE(rh.run_id, 0) as current_run_id,
    COALESCE(rh.final_floor, 1) as current_floor,
    COALESCE(rh.total_kills, 0) as current_kills,
    COALESCE(rh.gold_spent, 0) as current_gold_spent,
    CASE 
        WHEN rh.run_id IS NOT NULL THEN 'active'
        ELSE 'none'
    END as run_status
FROM user_run_progress urp
LEFT JOIN run_history rh ON urp.user_id = rh.user_id 
    AND rh.ended_at IS NULL 
    AND rh.run_number = urp.current_run_number - 1; -- Current active run

-- ===================================================
-- GAME STATE VIEWS (ENHANCED)
-- ===================================================

-- View: Player saved states (ENHANCED with run_number)
CREATE VIEW vw_player_save AS
SELECT 
    save_id as save_identifier,
    user_id as player,
    session_id as current_session,
    run_id as game_session,
    run_number as run_number,  -- NEW: Run number for UI
    floor_id as current_floor,
    room_id as current_room,
    current_hp as health_points,
    gold as current_gold,
    saved_at as save_timestamp,
    is_active as save_status
FROM save_states;

-- NEW VIEW: Permanent upgrades with calculated values
CREATE VIEW vw_permanent_upgrades AS
SELECT 
    upgrade_id as upgrade_identifier,
    user_id as player,
    upgrade_type as upgrade_category,
    level as upgrade_level,
    current_value as calculated_value,  -- NEW: Ready-to-use calculated value
    base_value as base_stat,           -- NEW: Base stat for reference
    updated_at as last_modified,
    CASE upgrade_type
        WHEN 'health_max' THEN 'Max Health'
        WHEN 'stamina_max' THEN 'Max Stamina'
        WHEN 'movement_speed' THEN 'Movement Speed'
    END as display_name,
    CASE upgrade_type
        WHEN 'health_max' THEN 'HP'
        WHEN 'stamina_max' THEN 'STA'
        WHEN 'movement_speed' THEN '%'
    END as unit_suffix
FROM permanent_player_upgrades
ORDER BY upgrade_type;

-- NEW VIEW: Active temporary weapon upgrades
CREATE VIEW vw_active_weapon_upgrades AS
SELECT 
    temp_upgrade_id as upgrade_session,
    user_id as player,
    run_id as session,
    run_number as run_number,  -- NEW: Run number for validation
    melee_level as close_combat,
    ranged_level as distance_combat,
    is_active as upgrade_status,  -- NEW: Active status
    updated_at as modified
FROM weapon_upgrades_temp
WHERE is_active = TRUE;  -- Only show active upgrades

-- View: All weapon upgrades (including inactive for history)
CREATE VIEW vw_weapon_levels AS
SELECT 
    temp_upgrade_id as upgrade_session,
    user_id as player,
    run_id as session,
    run_number as run_number,
    melee_level as close_combat,
    ranged_level as distance_combat,
    is_active as upgrade_status,
    updated_at as modified,
    CASE 
        WHEN is_active = TRUE THEN 'Active'
        ELSE 'Inactive'
    END as status_display
FROM weapon_upgrades_temp;

-- ===================================================
-- STATISTICS AND ANALYTICS VIEWS (ENHANCED)
-- ===================================================

-- View: Player general statistics (ENHANCED with floor tracking)
CREATE VIEW vw_player_metrics AS
SELECT 
    user_id as player,
    total_runs as attempts,
    total_kills as eliminations,
    total_deaths as defeats,
    total_gold_earned as earnings,
    total_gold_spent as gold_spent,
    total_bosses_killed as boss_victories,
    total_playtime_seconds as time_played,
    highest_floor_ever as best_floor_ever,  -- NEW: Highest floor tracking
    last_updated as updated
FROM player_stats;

-- View: Game attempt history (ENHANCED with run numbers)
CREATE VIEW vw_game_history AS
SELECT 
    run_id as id,
    user_id as player,
    run_number as run_number,  -- NEW: Run number tracking
    started_at as begin_time,
    ended_at as finish_time,
    final_floor as reached_level,
    gold_spent as spent_coins,
    cause_of_death as end_reason,
    total_kills as enemies_defeated,
    CASE cause_of_death
        WHEN 'victory' THEN 'Victory'
        WHEN 'enemy_kill' THEN 'Enemy Death'
        WHEN 'boss_kill' THEN 'Boss Death'
        WHEN 'active' THEN 'In Progress'
        ELSE 'Other'
    END as death_reason_display
FROM run_history
ORDER BY started_at DESC;

-- View: Upgrade purchases (ENHANCED with run numbers)
CREATE VIEW vw_purchase_log AS
SELECT 
    user_id as buyer,
    run_id as session,
    run_number as run_number,  -- NEW: Run number tracking
    weapon_type as item_type,
    upgrade_level as item_level,
    cost as price,
    purchased_at as transaction_time
FROM weapon_upgrade_purchases
ORDER BY purchased_at DESC;

-- View: Enemy elimination records (ENHANCED with run numbers)
CREATE VIEW vw_combat_log AS
SELECT 
    user_id as hunter,
    run_id as session,
    run_number as run_number,  -- NEW: Run number tracking
    enemy_type as target_type,
    room_id as battle_location,
    floor as battle_level,
    killed_at as elimination_time
FROM enemy_kills
ORDER BY killed_at DESC;

-- View: Boss elimination records (ENHANCED with run numbers)
CREATE VIEW vw_boss_victories AS
SELECT 
    user_id as champion,
    run_id as session,
    run_number as run_number,  -- NEW: Run number tracking
    boss_type as defeated_boss,
    floor as victory_level,
    fight_duration_seconds as battle_duration,
    player_hp_remaining as surviving_health,
    killed_at as victory_time
FROM boss_kills
ORDER BY killed_at DESC;

-- ===================================================
-- CONFIGURATION VIEWS (UNCHANGED)
-- ===================================================

-- View: Player configurations
CREATE VIEW vw_player_config AS
SELECT 
    user_id as player,
    music_volume as audio_music,
    sfx_volume as audio_effects,
    auto_save_enabled as auto_backup,
    updated_at as modified
FROM player_settings;

-- ===================================================
-- ADMIN DASHBOARD VIEWS (OPTIMIZED PER USER REQUIREMENTS)
-- ===================================================

-- REMOVED: vw_leaderboard_floors (only 3 floors, not useful for developers)
-- REMOVED: vw_leaderboard_bosses 

-- View: Top players by playtime (KEPT - Useful for 3-floor game)
CREATE VIEW vw_leaderboard_playtime AS
SELECT 
    u.username as dedicated_player,
    ROUND(ps.total_playtime_seconds / 3600, 2) as hours_played,
    ps.total_runs as sessions,
    ps.highest_floor_ever as best_achievement,  -- NEW: Use highest_floor_ever
    urp.current_run_number as current_run,  -- NEW: Current run number
    ps.total_gold_spent as total_invested,
    ps.last_updated as last_session
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE
ORDER BY ps.total_playtime_seconds DESC
LIMIT 20;

-- ===================================================
-- OPTIMIZED ANALYTICS VIEWS (FOCUSED ON USEFUL METRICS)
-- ===================================================

-- View: Player progression analysis (SIMPLIFIED - Only experience tier)
CREATE VIEW vw_player_progression AS
SELECT 
    u.user_id as player_id,
    u.username as player_name,
    u.created_at as registration_date,
    urp.current_run_number as current_run,
    ps.total_runs as sessions_played,
    ps.highest_floor_ever as best_progress,
    urp.total_completed_runs as completed_runs,
    ps.total_kills as combat_experience,
    ps.total_gold_spent as total_spent,
    ps.total_playtime_seconds as total_time_seconds,
    -- Keep only experience_tier based on run count (useful)
    CASE 
        WHEN urp.current_run_number <= 5 THEN 'Newcomer'
        WHEN urp.current_run_number <= 20 THEN 'Regular'
        WHEN urp.current_run_number <= 50 THEN 'Experienced'
        ELSE 'Veteran'
    END as experience_tier
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY u.created_at DESC;

-- ===================================================
-- NEW USEFUL ADMIN VIEWS (Per User Requirements)
-- ===================================================

-- View: Players who defeated all 3 bosses in their first run (MASTER PLAYERS)
CREATE VIEW vw_all_bosses_first_run AS
SELECT 
    u.username as player_name,
    u.created_at as registration_date,
    bk_stats.first_run_number,
    bk_stats.bosses_defeated_first_run,
    bk_stats.first_dragon_kill_date,
    CASE 
        WHEN bk_stats.bosses_defeated_first_run >= 3 THEN 'Master Player'
        WHEN bk_stats.bosses_defeated_first_run >= 2 THEN 'Advanced Player'
        WHEN bk_stats.bosses_defeated_first_run >= 1 THEN 'Beginner Player'
        ELSE 'No Bosses Defeated'
    END as skill_classification
FROM users u
INNER JOIN (
    SELECT 
        user_id,
        MIN(run_number) as first_run_number,
        COUNT(*) as bosses_defeated_first_run,
        MIN(killed_at) as first_dragon_kill_date
    FROM boss_kills 
    WHERE run_number = 1  -- Only first run
    GROUP BY user_id
    HAVING COUNT(*) >= 3  -- Only show players who killed all 3 bosses
) bk_stats ON u.user_id = bk_stats.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY bk_stats.first_dragon_kill_date ASC;

-- View: First permanent upgrade purchases analysis (FEATURE ADOPTION)
CREATE VIEW vw_first_permanent_purchases AS
SELECT 
    upgrade_type,
    CASE upgrade_type
        WHEN 'health_max' THEN 'Max Health Upgrade'
        WHEN 'stamina_max' THEN 'Max Stamina Upgrade'
        WHEN 'movement_speed' THEN 'Movement Speed Upgrade'
    END as upgrade_name,
    COUNT(*) as first_time_buyers,
    ROUND(AVG(first_purchase_run), 1) as avg_first_purchase_run,
    MIN(first_purchase_date) as earliest_purchase,
    MAX(first_purchase_date) as latest_purchase,
    ROUND(
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'player' AND is_active = TRUE), 
        2
    ) as adoption_percentage
FROM (
    SELECT 
        ppu.user_id,
        ppu.upgrade_type,
        MIN(COALESCE(urp.current_run_number, 1)) as first_purchase_run,
        MIN(ppu.updated_at) as first_purchase_date
    FROM permanent_player_upgrades ppu
    INNER JOIN users u ON ppu.user_id = u.user_id
    LEFT JOIN user_run_progress urp ON ppu.user_id = urp.user_id
    WHERE u.is_active = TRUE AND u.role = 'player'
    GROUP BY ppu.user_id, ppu.upgrade_type
) first_purchases
GROUP BY upgrade_type
ORDER BY first_time_buyers DESC;

-- ===================================================
-- CHART DATA VIEWS (For Beautiful Visualizations)
-- ===================================================

-- View: Daily activity data for charts
CREATE VIEW vw_daily_activity AS
SELECT 
    DATE(activity_date) as date,
    'registrations' as activity_type,
    COUNT(*) as count
FROM (
    SELECT created_at as activity_date 
    FROM users 
    WHERE role = 'player' AND is_active = TRUE
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
) reg_data
GROUP BY DATE(activity_date)

UNION ALL

SELECT 
    DATE(activity_date) as date,
    'active_players' as activity_type,
    COUNT(*) as count
FROM (
    SELECT last_login as activity_date 
    FROM users 
    WHERE role = 'player' AND is_active = TRUE
    AND last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
) login_data
GROUP BY DATE(activity_date)

ORDER BY date DESC, activity_type;

-- View: Playtime distribution for charts
CREATE VIEW vw_playtime_distribution AS
SELECT 
    CASE 
        WHEN total_playtime_seconds < 3600 THEN '< 1h'
        WHEN total_playtime_seconds < 10800 THEN '1-3h'
        WHEN total_playtime_seconds < 21600 THEN '3-6h'
        WHEN total_playtime_seconds < 43200 THEN '6-12h'
        ELSE '12h+'
    END as playtime_range,
    COUNT(*) as player_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM player_stats WHERE total_playtime_seconds > 0), 2) as percentage
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
WHERE u.is_active = TRUE AND u.role = 'player' AND ps.total_playtime_seconds > 0
GROUP BY 
    CASE 
        WHEN total_playtime_seconds < 3600 THEN '< 1h'
        WHEN total_playtime_seconds < 10800 THEN '1-3h'
        WHEN total_playtime_seconds < 21600 THEN '3-6h'
        WHEN total_playtime_seconds < 43200 THEN '6-12h'
        ELSE '12h+'
    END
ORDER BY 
    CASE 
        WHEN playtime_range = '< 1h' THEN 1
        WHEN playtime_range = '1-3h' THEN 2
        WHEN playtime_range = '3-6h' THEN 3
        WHEN playtime_range = '6-12h' THEN 4
        ELSE 5
    END;

-- View: Run experience distribution for charts
CREATE VIEW vw_run_experience_distribution AS
SELECT 
    CASE 
        WHEN current_run_number <= 5 THEN 'Run 1-5'
        WHEN current_run_number <= 15 THEN 'Run 6-15'
        WHEN current_run_number <= 30 THEN 'Run 16-30'
        ELSE 'Run 30+'
    END as run_range,
    COUNT(*) as player_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_run_progress), 2) as percentage
FROM user_run_progress urp
INNER JOIN users u ON urp.user_id = u.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
GROUP BY 
    CASE 
        WHEN current_run_number <= 5 THEN 'Run 1-5'
        WHEN current_run_number <= 15 THEN 'Run 6-15'
        WHEN current_run_number <= 30 THEN 'Run 16-30'
        ELSE 'Run 30+'
    END
ORDER BY 
    CASE 
        WHEN run_range = 'Run 1-5' THEN 1
        WHEN run_range = 'Run 6-15' THEN 2
        WHEN run_range = 'Run 16-30' THEN 3
        ELSE 4
    END;

-- View: Current active games (ENHANCED with run tracking)
CREATE VIEW vw_current_games AS
SELECT 
    rh.run_id as game_id,
    u.username as player,
    rh.run_number as run_number,  -- NEW: Run number display
    rh.started_at as session_start,
    TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) as minutes_playing,
    rh.final_floor as current_level,
    rh.total_kills as current_kills,
    rh.gold_spent as spent_this_run,
    (SELECT gold FROM save_states WHERE user_id = u.user_id AND is_active = TRUE LIMIT 1) as current_gold,
    CASE 
        WHEN TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) <= 30 THEN 'Fresh'
        WHEN TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) <= 120 THEN 'Active'
        ELSE 'Long Session'
    END as session_duration_type
FROM run_history rh
INNER JOIN users u ON rh.user_id = u.user_id
WHERE rh.ended_at IS NULL
  AND u.is_active = TRUE
  AND u.role = 'player'
ORDER BY rh.started_at;

-- View: Session duration distribution for live games
CREATE VIEW vw_session_duration_distribution AS
SELECT 
    session_duration_type,
    COUNT(*) as session_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vw_current_games WHERE session_duration_type IS NOT NULL), 2) as percentage
FROM vw_current_games
GROUP BY session_duration_type
ORDER BY 
    CASE 
        WHEN session_duration_type = 'Fresh' THEN 1
        WHEN session_duration_type = 'Active' THEN 2
        ELSE 3
    END;

-- ===================================================
-- ESSENTIAL STATUS VIEWS (KEPT)
-- ===================================================

-- View: Active players status (ENHANCED)
CREATE VIEW vw_active_players AS
SELECT 
    u.username as player_name,
    u.last_login as last_active,
    urp.current_run_number as current_run,  -- NEW: Current run number
    ps.total_runs as total_sessions,
    ps.total_kills as lifetime_kills,
    ps.total_gold_spent as lifetime_spending,
    ps.highest_floor_ever as best_floor,  -- NEW: Best floor achieved
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'Recent'
        ELSE 'Inactive'
    END as activity_status
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY u.last_login DESC;



-- ===================================================
-- SPECIALIZED VIEWS FOR API INTEGRATION
-- ===================================================

-- NEW VIEW: Complete player initialization data
CREATE VIEW vw_player_initialization AS
SELECT 
    u.user_id as player_id,
    urp.current_run_number as run_number,
    COALESCE(ss.floor_id, 1) as current_floor,
    COALESCE(ss.room_id, 1) as current_room,
    COALESCE(ss.current_hp, 100) as current_health,
    COALESCE(ss.gold, 0) as current_gold,
    -- Permanent upgrades as JSON-like structure
    GROUP_CONCAT(
        CASE WHEN ppu.upgrade_type IS NOT NULL 
        THEN CONCAT(ppu.upgrade_type, ':', ppu.current_value) 
        END SEPARATOR ','
    ) as permanent_upgrades,
    -- Active weapon upgrades
    COALESCE(MAX(wut.melee_level), 1) as melee_level,
    COALESCE(MAX(wut.ranged_level), 1) as ranged_level,
    -- Flags (FIXED: Use aggregate functions)
    CASE WHEN ss.save_id IS NOT NULL THEN TRUE ELSE FALSE END as has_save_state,
    CASE WHEN COUNT(ppu.upgrade_id) > 0 THEN TRUE ELSE FALSE END as has_permanent_upgrades,
    CASE WHEN COUNT(wut.temp_upgrade_id) > 0 THEN TRUE ELSE FALSE END as has_temp_upgrades
FROM users u
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
LEFT JOIN save_states ss ON u.user_id = ss.user_id AND ss.is_active = TRUE
LEFT JOIN permanent_player_upgrades ppu ON u.user_id = ppu.user_id
LEFT JOIN weapon_upgrades_temp wut ON u.user_id = wut.user_id AND wut.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.user_id, urp.current_run_number, ss.floor_id, ss.room_id, 
         ss.current_hp, ss.gold, ss.save_id;

-- NEW VIEW: Complete player statistics for API
CREATE VIEW vw_complete_player_stats AS
SELECT 
    ps.user_id as player_id,
    ps.total_runs as totalRuns,
    urp.total_completed_runs as completedRuns,  -- NEW: Use actual completed runs
    CASE 
        WHEN ps.total_runs > 0 THEN ROUND((urp.total_completed_runs / ps.total_runs) * 100, 2)
        ELSE 0 
    END as completionRate,
    ps.total_kills as totalKills,
    COALESCE(best_run.max_kills, 0) as bestRunKills,
    0 as maxDamageHit, -- Not tracked in current schema
    ps.total_gold_earned as goldEarned,
    ps.total_gold_spent as goldSpent,
    CONCAT(
        FLOOR(ps.total_playtime_seconds / 3600), 'h ',
        FLOOR((ps.total_playtime_seconds % 3600) / 60), 'm'
    ) as playtimeFormatted,
    ps.total_runs as totalSessions,
    ps.highest_floor_ever as highestFloorEver,  -- NEW: Highest floor tracking
    urp.current_run_number as currentRunNumber,  -- NEW: Current run number
    ps.last_updated as lastPlayed
FROM player_stats ps
INNER JOIN user_run_progress urp ON ps.user_id = urp.user_id
LEFT JOIN (
    SELECT user_id, MAX(total_kills) as max_kills
    FROM run_history
    GROUP BY user_id
) best_run ON ps.user_id = best_run.user_id;

-- ===================================================
-- TRIGGERS AND PROCEDURES (ENHANCED FOR v3.0)
-- ===================================================

-- TRIGGER: Initialize user run progress for new users
DELIMITER //
CREATE TRIGGER tr_create_user_run_progress
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_run_progress (user_id) VALUES (NEW.user_id);
    INSERT INTO player_settings (user_id) VALUES (NEW.user_id);
    INSERT INTO player_stats (user_id) VALUES (NEW.user_id);
END//
DELIMITER ;

-- TRIGGER: Update permanent upgrade calculated values on insert
DELIMITER //
CREATE TRIGGER tr_calculate_permanent_upgrade_values
BEFORE INSERT ON permanent_player_upgrades
FOR EACH ROW
BEGIN
    -- Calculate values based on upgrade type and level
    CASE NEW.upgrade_type
        WHEN 'health_max' THEN 
            SET NEW.base_value = 100;
            SET NEW.current_value = 100 + (NEW.level * 15);  -- +15 HP per level
        WHEN 'stamina_max' THEN 
            SET NEW.base_value = 100;
            SET NEW.current_value = 100 + (NEW.level * 20);  -- +20 Stamina per level
        WHEN 'movement_speed' THEN 
            SET NEW.base_value = 1.0;
            SET NEW.current_value = 1.0 + (NEW.level * 0.1); -- +10% speed per level
    END CASE;
END//
DELIMITER ;

-- TRIGGER: Update permanent upgrade calculated values on update
DELIMITER //
CREATE TRIGGER tr_update_permanent_upgrade_values
BEFORE UPDATE ON permanent_player_upgrades
FOR EACH ROW
BEGIN
    -- Recalculate values when level changes
    IF NEW.level != OLD.level THEN
        CASE NEW.upgrade_type
            WHEN 'health_max' THEN 
                SET NEW.base_value = 100;
                SET NEW.current_value = 100 + (NEW.level * 15);
            WHEN 'stamina_max' THEN 
                SET NEW.base_value = 100;
                SET NEW.current_value = 100 + (NEW.level * 20);
            WHEN 'movement_speed' THEN 
                SET NEW.base_value = 1.0;
                SET NEW.current_value = 1.0 + (NEW.level * 0.1);
        END CASE;
    END IF;
END//
DELIMITER ;

-- TRIGGER: Increment run number on new run creation (FIXED)
DELIMITER //
CREATE TRIGGER tr_increment_run_number
BEFORE INSERT ON run_history
FOR EACH ROW
BEGIN
    DECLARE current_run_num INT DEFAULT 1;
    
    -- Get current run number for the user
    SELECT current_run_number INTO current_run_num 
    FROM user_run_progress 
    WHERE user_id = NEW.user_id;
    
    -- Set the run number for this run
    SET NEW.run_number = current_run_num;
    
    -- FIXED: Only increment run counter AFTER the run is completed, not when created
    -- The current_run_number should represent the active run number
    -- Increment will happen in tr_update_player_stats_after_run when run ends
END//
DELIMITER ;

-- TRIGGER: Update player_stats when run ends (ENHANCED)
DELIMITER //
CREATE TRIGGER tr_update_player_stats_after_run
AFTER UPDATE ON run_history
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        -- Update player stats
        INSERT INTO player_stats (
            user_id, total_runs, total_kills, total_deaths, 
            total_gold_earned, total_gold_spent, total_bosses_killed, 
            total_playtime_seconds, highest_floor_ever
        )
        VALUES (
            NEW.user_id, 1, NEW.total_kills, 1, 
            NEW.final_gold, NEW.gold_spent, NEW.bosses_killed, 
            NEW.duration_seconds, NEW.final_floor
        )
        ON DUPLICATE KEY UPDATE 
            total_runs = total_runs + 1,
            total_kills = total_kills + NEW.total_kills,
            total_deaths = total_deaths + 1,
            total_gold_earned = total_gold_earned + NEW.final_gold,
            total_gold_spent = total_gold_spent + NEW.gold_spent,
            total_bosses_killed = total_bosses_killed + NEW.bosses_killed,
            total_playtime_seconds = total_playtime_seconds + NEW.duration_seconds,
            highest_floor_ever = GREATEST(highest_floor_ever, NEW.final_floor);
            
        -- Update user run progress
        UPDATE user_run_progress 
        SET highest_floor_reached = GREATEST(highest_floor_reached, NEW.final_floor),
            total_completed_runs = total_completed_runs + 1,
            current_run_number = current_run_number + 1,  -- FIXED: Increment ONLY when run completes
            last_updated = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Mark weapon upgrades as inactive when run ends
        UPDATE weapon_upgrades_temp 
        SET is_active = FALSE 
        WHERE user_id = NEW.user_id AND run_id = NEW.run_id;
    END IF;
END//
DELIMITER ;

-- TRIGGER: Update run gold_spent when weapon purchase occurs
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

-- ===================================================
-- PERMISSIONS AND SECURITY (UPDATED FOR OPTIMIZED VIEWS)
-- ===================================================

-- Grant SELECT permissions on all views to application user
GRANT SELECT ON vw_user_profile TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_user_sessions TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_user_run_progress TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_current_run_info TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_save TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_permanent_upgrades TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_active_weapon_upgrades TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_weapon_levels TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_metrics TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_game_history TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_purchase_log TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_combat_log TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_boss_victories TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_config TO 'tc2005b'@'localhost';

-- Admin dashboard views (OPTIMIZED - removed unnecessary views)
GRANT SELECT ON vw_leaderboard_playtime TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_progression TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_active_players TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_current_games TO 'tc2005b'@'localhost';

-- New useful admin views
GRANT SELECT ON vw_all_bosses_first_run TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_first_permanent_purchases TO 'tc2005b'@'localhost';

-- Chart data views
GRANT SELECT ON vw_daily_activity TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_playtime_distribution TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_run_experience_distribution TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_session_duration_distribution TO 'tc2005b'@'localhost';

-- Specialized API views
GRANT SELECT ON vw_player_initialization TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_complete_player_stats TO 'tc2005b'@'localhost';

-- ===================================================
-- VIEW TO ENDPOINT MAPPING (OPTIMIZED FOR v3.0)
-- ===================================================

/*
API ENDPOINT USAGE v3.0 - OPTIMIZED:

CORE PLAYER ENDPOINTS:
GET /api/users/:userId/profile → vw_user_profile
GET /api/users/:userId/sessions → vw_user_sessions  
GET /api/users/:userId/save-state → vw_player_save
GET /api/users/:userId/settings → vw_player_config

RUN PERSISTENCE ENDPOINTS:
GET /api/users/:userId/run-progress → vw_user_run_progress
GET /api/users/:userId/current-run-info → vw_current_run_info

PERMANENT UPGRADES ENDPOINTS:
GET /api/users/:userId/permanent-upgrades → vw_permanent_upgrades

TEMPORARY UPGRADES ENDPOINTS:
GET /api/users/:userId/active-weapon-upgrades → vw_active_weapon_upgrades
GET /api/users/:userId/weapon-upgrades → vw_weapon_levels

STATISTICS ENDPOINTS:
GET /api/users/:userId/stats → vw_player_metrics
GET /api/users/:userId/complete-stats → vw_complete_player_stats
GET /api/users/:userId/history → vw_game_history

PLAYER INITIALIZATION ENDPOINT:
GET /api/users/:userId/initialization-data → vw_player_initialization

OPTIMIZED ADMIN DASHBOARD ENDPOINTS:

KEPT ADMIN ENDPOINTS (Useful for 3-floor game):
GET /api/admin/leaderboards/playtime → vw_leaderboard_playtime
GET /api/admin/analytics/player-progression → vw_player_progression (simplified)
GET /api/admin/status/active-players → vw_active_players
GET /api/admin/status/current-games → vw_current_games

NEW USEFUL ADMIN ENDPOINTS:
GET /api/admin/analytics/first-run-masters → vw_all_bosses_first_run
GET /api/admin/analytics/permanent-upgrades-adoption → vw_first_permanent_purchases

CHART DATA ENDPOINTS (For visualizations):
GET /api/admin/charts/activity-trends → vw_daily_activity
GET /api/admin/charts/playtime-distribution → vw_playtime_distribution
GET /api/admin/charts/run-experience → vw_run_experience_distribution
GET /api/admin/charts/session-duration → vw_session_duration_distribution
GET /api/admin/charts/upgrade-adoption → vw_first_permanent_purchases

REMOVED ADMIN ENDPOINTS (Unnecessary for 3-floor game):
❌ GET /api/admin/leaderboards/floors (only 3 floors, not useful)
❌ GET /api/admin/leaderboards/bosses (no developer value)  
❌ GET /api/admin/analytics/economy (not needed)
❌ GET /api/admin/analytics/combat (not needed)

✅ OPTIMIZED FUNCTIONALITIES v3.0:

#1 RUN PERSISTENCE:
- vw_user_run_progress: Persistent run counter per user
- vw_current_run_info: Combined run + progress information
- All analytics views include run_number tracking

#2 PERMANENT UPGRADES:
- vw_permanent_upgrades: Ready-to-use calculated values
- Auto-calculated current_value (health +15, stamina +20, speed +10%)
- Display-friendly names and units

#3 TEMPORARY UPGRADES:
- vw_active_weapon_upgrades: Only currently active upgrades
- vw_weapon_levels: Complete upgrade history with status
- Automatic deactivation when run ends

#4 PLAYER INITIALIZATION:
- vw_player_initialization: Complete initialization data in one query
- JSON-like permanent upgrades string
- All flags for frontend consumption

#5 OPTIMIZED ADMIN ANALYTICS:
- vw_all_bosses_first_run: Exceptional players who beat all 3 bosses in first run
- vw_first_permanent_purchases: Feature adoption analysis for permanent upgrades
- Chart data views: Activity trends, playtime distribution, run experience, session duration
- Simplified progression: Only experience tier (Newcomer/Regular/Experienced/Veteran)

OPTIMIZATION BENEFITS:
- Removed 4 unnecessary admin views for better performance
- Focused on actionable insights for developers
- Added 6 new useful views for meaningful analytics
- Chart-ready data for beautiful visualizations
- Simplified player progression without vanity metrics
- Enhanced with first-run masters tracking for exceptional players

TRIGGERS:
- tr_create_user_run_progress: Auto-initialize new users
- tr_calculate_permanent_upgrade_values: Auto-calculate upgrade values
- tr_update_permanent_upgrade_values: Recalculate on level changes
- tr_increment_run_number: Set run number (fixed to not increment on creation)
- tr_update_player_stats_after_run: Update stats and increment run number on completion
- tr_update_run_gold_spent: Track gold spending during runs

DATABASE OPTIMIZATION:
- Complete run persistence across sessions
- Automatic permanent upgrade calculation
- Temporary upgrade persistence until run completion
- One-query player initialization
- Enhanced analytics with run tracking
- Ready-for-frontend calculated values
- Optimized admin views focused on useful metrics only
*/

-- ===================================================
-- OBJECTS VERIFICATION
-- ===================================================

-- Show all created views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Show all triggers
SHOW TRIGGERS;

-- Example view usage with new functionality
SELECT * FROM vw_user_run_progress LIMIT 5;
SELECT * FROM vw_current_run_info LIMIT 5;
SELECT * FROM vw_permanent_upgrades LIMIT 5;
SELECT * FROM vw_active_weapon_upgrades LIMIT 5;
SELECT * FROM vw_player_initialization LIMIT 5;
SELECT * FROM vw_complete_player_stats LIMIT 5; 