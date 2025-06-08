-- ===================================================
-- SHATTERED TIMELINE - ENHANCED DATABASE VIEWS v3.0
-- ===================================================
-- Version: 3.0 - NEW: Support for run persistence, permanent & temporary upgrades
-- Objective: Complete views for all missing functionalities
-- New Views for:
-- 1. ✅ Run progress and persistence
-- 2. ✅ Permanent upgrades with calculated values
-- 3. ✅ Temporary upgrades with active status
-- 4. ✅ Enhanced analytics with run numbers
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
-- NEW: USER RUN PROGRESS VIEWS (CRITICAL FIX)
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
-- ADMIN DASHBOARD VIEWS (ENHANCED FOR v3.0)
-- ===================================================

-- View: Top players by floors reached (ENHANCED with run tracking)
CREATE VIEW vw_leaderboard_floors AS
SELECT 
    u.username as champion,
    ps.highest_floor_ever as max_level,  -- NEW: Use highest_floor_ever
    urp.current_run_number as current_run,  -- NEW: Current run number
    ps.total_runs as total_attempts,
    ps.total_kills as total_eliminations,
    ps.total_gold_spent as gold_invested,
    ps.last_updated as last_achievement
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE
ORDER BY ps.highest_floor_ever DESC, ps.total_kills DESC
LIMIT 20;

-- View: Top players by bosses defeated (ENHANCED)
CREATE VIEW vw_leaderboard_bosses AS
SELECT 
    u.username as boss_slayer,
    ps.total_bosses_killed as bosses_defeated,
    ps.highest_floor_ever as progression,  -- NEW: Use highest_floor_ever
    urp.current_run_number as current_run,  -- NEW: Current run number
    ps.total_runs as attempts,
    ps.total_gold_spent as gold_invested,
    ps.last_updated as last_victory
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE AND ps.total_bosses_killed > 0
ORDER BY ps.total_bosses_killed DESC, ps.highest_floor_ever DESC
LIMIT 20;

-- View: Top players by playtime (ENHANCED)
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
-- ADVANCED ANALYTICS VIEWS (ENHANCED FOR v3.0)
-- ===================================================

-- View: Game economy statistics (ENHANCED with run numbers)
CREATE VIEW vw_economy_stats AS
SELECT 
    weapon_type as item_category,
    upgrade_level as tier,
    COUNT(*) as purchase_count,
    AVG(cost) as avg_price,
    SUM(cost) as total_revenue,
    MIN(purchased_at) as first_purchase,
    MAX(purchased_at) as last_purchase,
    COUNT(DISTINCT user_id) as unique_buyers,
    COUNT(DISTINCT run_number) as unique_runs  -- NEW: Run number tracking
FROM weapon_upgrade_purchases
GROUP BY weapon_type, upgrade_level
ORDER BY weapon_type, upgrade_level;

-- View: Combat behavior analysis (ENHANCED with run numbers)
CREATE VIEW vw_combat_analytics AS
SELECT 
    enemy_type as creature_type,
    floor as encounter_level,
    room_id as battle_zone,
    COUNT(*) as elimination_count,
    COUNT(DISTINCT user_id) as hunters_involved,
    COUNT(DISTINCT run_number) as unique_runs,  -- NEW: Run number tracking
    MIN(killed_at) as first_encounter,
    MAX(killed_at) as latest_encounter
FROM enemy_kills
GROUP BY enemy_type, floor, room_id
ORDER BY floor, room_id, enemy_type;

-- View: Player progression analysis (ENHANCED with run tracking)
CREATE VIEW vw_player_progression AS
SELECT 
    u.user_id as player_id,
    u.username as player_name,
    u.created_at as registration_date,
    urp.current_run_number as current_run,  -- NEW: Current run number
    ps.total_runs as sessions_played,
    ps.highest_floor_ever as best_progress,  -- NEW: Use highest_floor_ever
    urp.total_completed_runs as completed_runs,  -- NEW: Completed runs
    ps.total_kills as combat_experience,
    CASE 
        WHEN ps.total_runs = 0 THEN 'New'
        WHEN ps.highest_floor_ever <= 1 THEN 'Beginner'
        WHEN ps.highest_floor_ever <= 2 THEN 'Intermediate'
        WHEN ps.highest_floor_ever <= 3 THEN 'Advanced'
        ELSE 'Expert'
    END as skill_tier,
    CASE 
        WHEN ps.total_gold_spent = 0 THEN 'Free Player'
        WHEN ps.total_gold_spent <= 100 THEN 'Light Spender'
        WHEN ps.total_gold_spent <= 500 THEN 'Regular Spender'
        ELSE 'Heavy Spender'
    END as spending_tier,
    CASE 
        WHEN urp.current_run_number <= 5 THEN 'Newcomer'
        WHEN urp.current_run_number <= 20 THEN 'Regular'
        WHEN urp.current_run_number <= 50 THEN 'Experienced'
        ELSE 'Veteran'
    END as run_tier  -- NEW: Run-based progression tier
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE
ORDER BY u.created_at DESC;

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

-- ===================================================
-- NEW: SPECIALIZED VIEWS FOR API INTEGRATION
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
    COALESCE(wut.melee_level, 1) as melee_level,
    COALESCE(wut.ranged_level, 1) as ranged_level,
    -- Flags
    CASE WHEN ss.save_id IS NOT NULL THEN TRUE ELSE FALSE END as has_save_state,
    CASE WHEN ppu.upgrade_id IS NOT NULL THEN TRUE ELSE FALSE END as has_permanent_upgrades,
    CASE WHEN wut.temp_upgrade_id IS NOT NULL THEN TRUE ELSE FALSE END as has_temp_upgrades
FROM users u
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
LEFT JOIN save_states ss ON u.user_id = ss.user_id AND ss.is_active = TRUE
LEFT JOIN permanent_player_upgrades ppu ON u.user_id = ppu.user_id
LEFT JOIN weapon_upgrades_temp wut ON u.user_id = wut.user_id AND wut.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.user_id, urp.current_run_number, ss.floor_id, ss.room_id, 
         ss.current_hp, ss.gold, wut.melee_level, wut.ranged_level, 
         ss.save_id, wut.temp_upgrade_id;

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
-- PERMISSIONS AND SECURITY
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
GRANT SELECT ON vw_leaderboard_floors TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_leaderboard_bosses TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_leaderboard_playtime TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_economy_stats TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_combat_analytics TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_progression TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_active_players TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_current_games TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_initialization TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_complete_player_stats TO 'tc2005b'@'localhost';

-- ===================================================
-- VIEW TO ENDPOINT MAPPING (ENHANCED FOR v3.0)
-- ===================================================

/*
API ENDPOINT USAGE v3.0:

CORE PLAYER ENDPOINTS:
GET /api/users/:userId/profile → vw_user_profile
GET /api/users/:userId/sessions → vw_user_sessions  
GET /api/users/:userId/save-state → vw_player_save
GET /api/users/:userId/settings → vw_player_config

NEW: RUN PERSISTENCE ENDPOINTS:
GET /api/users/:userId/run-progress → vw_user_run_progress
GET /api/users/:userId/current-run-info → vw_current_run_info

NEW: PERMANENT UPGRADES ENDPOINTS:
GET /api/users/:userId/permanent-upgrades → vw_permanent_upgrades

NEW: TEMPORARY UPGRADES ENDPOINTS:
GET /api/users/:userId/active-weapon-upgrades → vw_active_weapon_upgrades
GET /api/users/:userId/weapon-upgrades → vw_weapon_levels

ENHANCED STATISTICS ENDPOINTS:
GET /api/users/:userId/stats → vw_player_metrics
GET /api/users/:userId/complete-stats → vw_complete_player_stats
GET /api/users/:userId/history → vw_game_history

NEW: PLAYER INITIALIZATION ENDPOINT:
GET /api/users/:userId/initialization-data → vw_player_initialization

ADMIN DASHBOARD ENDPOINTS:
GET /api/leaderboards/floors → vw_leaderboard_floors
GET /api/leaderboards/bosses → vw_leaderboard_bosses
GET /api/leaderboards/playtime → vw_leaderboard_playtime

GET /api/analytics/economy → vw_economy_stats
GET /api/analytics/combat → vw_combat_analytics
GET /api/analytics/player-progression → vw_player_progression

GET /api/status/active-players → vw_active_players
GET /api/status/current-games → vw_current_games

✅ NEW FUNCTIONALITIES v3.0:

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

BENEFITS:
- Complete run persistence across sessions
- Automatic permanent upgrade calculation
- Temporary upgrade persistence until run completion
- One-query player initialization
- Enhanced analytics with run tracking
- Ready-for-frontend calculated values
*/

-- ===================================================
-- CREATED VIEWS VERIFICATION
-- ===================================================

-- Show all created views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Example view usage with new functionality
SELECT * FROM vw_user_run_progress LIMIT 5;
SELECT * FROM vw_current_run_info LIMIT 5;
SELECT * FROM vw_permanent_upgrades LIMIT 5;
SELECT * FROM vw_active_weapon_upgrades LIMIT 5;
SELECT * FROM vw_player_initialization LIMIT 5;
SELECT * FROM vw_complete_player_stats LIMIT 5; 