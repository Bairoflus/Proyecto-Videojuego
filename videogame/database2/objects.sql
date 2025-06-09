-- ===================================================
-- MASKING VIEWS - SHATTERED TIMELINE  
-- ===================================================
-- Objective: Mask real column names
-- Usage: API GET endpoints
-- Benefit: Security and database abstraction
-- ===================================================

USE dbshatteredtimeline;

-- ===================================================
-- USER AND AUTHENTICATION VIEWS
-- ===================================================

-- View: Basic user information (without sensitive data)
CREATE VIEW vw_user_profile AS
SELECT 
    user_id as id,
    username as name,
    email as mail,
    created_at as registered,
    last_login as last_access,
    is_active as status
FROM users
WHERE is_active = TRUE;

-- View: Active user sessions
CREATE VIEW vw_user_sessions AS
SELECT 
    session_id as id,
    user_id as user,
    created_at as started,
    expires_at as expires,
    logout_at as ended,
    is_active as active
FROM sessions
WHERE is_active = TRUE;

-- ===================================================
-- GAME STATE VIEWS
-- ===================================================

-- View: Player active saved state
CREATE VIEW vw_player_save AS
SELECT 
    user_id as player,
    floor_id as floor,
    room_id as location,
    current_hp as health,
    gold as coins,
    saved_at as timestamp
FROM save_states
WHERE is_active = TRUE;

-- View: Player permanent upgrades
CREATE VIEW vw_player_boosts AS
SELECT 
    user_id as player,
    upgrade_type as boost_type,
    level as boost_level,
    updated_at as acquired
FROM permanent_player_upgrades;

-- View: Temporary weapon upgrades
CREATE VIEW vw_weapon_levels AS
SELECT 
    user_id as player,
    run_id as session,
    melee_level as close_combat,
    ranged_level as distance_combat,
    updated_at as modified
FROM weapon_upgrades_temp;

-- ===================================================
-- STATISTICS AND ANALYTICS VIEWS
-- ===================================================

-- View: Player general statistics
CREATE VIEW vw_player_metrics AS
SELECT 
    user_id as player,
    total_runs as attempts,
    total_kills as eliminations,
    total_deaths as defeats,
    total_gold_earned as earnings,
    total_bosses_killed as boss_victories,
    total_playtime_seconds as time_played,
    last_updated as updated
FROM player_stats;

-- View: Game attempt history
CREATE VIEW vw_game_history AS
SELECT 
    run_id as id,
    user_id as player,
    started_at as begin_time,
    ended_at as finish_time,
    final_floor as reached_level,
    final_gold as earned_coins,  
    cause_of_death as end_reason,
    total_kills as enemies_defeated,
    bosses_killed as bosses_defeated,
    duration_seconds as session_length
FROM run_history
ORDER BY started_at DESC;

-- View: Upgrade purchases
CREATE VIEW vw_purchase_log AS
SELECT 
    user_id as buyer,
    run_id as session,
    weapon_type as item_type,
    upgrade_level as item_level,
    cost as price,
    purchased_at as transaction_time
FROM weapon_upgrade_purchases
ORDER BY purchased_at DESC;

-- View: Enemy elimination records
CREATE VIEW vw_combat_log AS
SELECT 
    user_id as hunter,
    run_id as session,
    enemy_type as target_type,
    room_id as battle_location,
    floor as battle_level,
    killed_at as elimination_time
FROM enemy_kills
ORDER BY killed_at DESC;

-- View: Boss elimination records
CREATE VIEW vw_boss_victories AS
SELECT 
    user_id as champion,
    run_id as session,
    boss_type as defeated_boss,
    floor as victory_level,
    fight_duration_seconds as battle_duration,
    player_hp_remaining as surviving_health,
    killed_at as victory_time
FROM boss_kills
ORDER BY killed_at DESC;

-- ===================================================
-- CONFIGURATION VIEWS
-- ===================================================

-- View: Player configurations
CREATE VIEW vw_player_config AS
SELECT 
    user_id as player,
    music_volume as audio_music,
    sfx_volume as audio_effects,
    show_fps as display_fps,
    auto_save_enabled as auto_backup,
    updated_at as modified
FROM player_settings;

-- ===================================================
-- AGGREGATED VIEWS FOR LEADERBOARDS
-- ===================================================

-- View: Top players by floors reached (using run_history data)
CREATE VIEW vw_leaderboard_floors AS
SELECT 
    u.username as champion,
    MAX(rh.final_floor) as max_level,
    ps.total_runs as total_attempts,
    ps.total_kills as total_eliminations,
    ps.last_updated as last_achievement
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, ps.total_runs, ps.total_kills, ps.last_updated
ORDER BY MAX(rh.final_floor) DESC, ps.total_kills DESC
LIMIT 20;

-- View: Top players by bosses defeated
CREATE VIEW vw_leaderboard_bosses AS
SELECT 
    u.username as boss_slayer,
    ps.total_bosses_killed as bosses_defeated,
    MAX(rh.final_floor) as progression,
    ps.total_runs as attempts,
    ps.last_updated as last_victory
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE AND ps.total_bosses_killed > 0
GROUP BY u.user_id, u.username, ps.total_bosses_killed, ps.total_runs, ps.last_updated
ORDER BY ps.total_bosses_killed DESC, MAX(rh.final_floor) DESC
LIMIT 20;

-- View: Top players by playtime
CREATE VIEW vw_leaderboard_playtime AS
SELECT 
    u.username as dedicated_player,
    ROUND(ps.total_playtime_seconds / 3600, 2) as hours_played,
    ps.total_runs as sessions,
    MAX(rh.final_floor) as best_achievement,
    ps.last_updated as last_session
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, ps.total_playtime_seconds, ps.total_runs, ps.last_updated
ORDER BY ps.total_playtime_seconds DESC
LIMIT 20;

-- ===================================================
-- ADVANCED ANALYTICS VIEWS
-- ===================================================

-- View: Game economy statistics
CREATE VIEW vw_economy_stats AS
SELECT 
    weapon_type as item_category,
    upgrade_level as tier,
    COUNT(*) as purchase_count,
    AVG(cost) as avg_price,
    SUM(cost) as total_revenue,
    MIN(purchased_at) as first_purchase,
    MAX(purchased_at) as last_purchase
FROM weapon_upgrade_purchases
GROUP BY weapon_type, upgrade_level
ORDER BY weapon_type, upgrade_level;

-- View: Combat behavior analysis
CREATE VIEW vw_combat_analytics AS
SELECT 
    enemy_type as creature_type,
    floor as encounter_level,
    room_id as battle_zone,
    COUNT(*) as elimination_count,
    COUNT(DISTINCT user_id) as hunters_involved,
    MIN(killed_at) as first_encounter,
    MAX(killed_at) as latest_encounter
FROM enemy_kills
GROUP BY enemy_type, floor, room_id
ORDER BY floor, room_id, enemy_type;

-- View: New player progression analysis
CREATE VIEW vw_player_progression AS
SELECT 
    u.user_id as player_id,
    u.username as player_name,
    u.created_at as registration_date,
    ps.total_runs as sessions_played,
    COALESCE(MAX(rh.final_floor), 1) as best_progress,
    ps.total_kills as combat_experience,
    CASE 
        WHEN ps.total_runs = 0 THEN 'New'
        WHEN COALESCE(MAX(rh.final_floor), 1) <= 1 THEN 'Beginner'
        WHEN COALESCE(MAX(rh.final_floor), 1) <= 2 THEN 'Intermediate'
        WHEN COALESCE(MAX(rh.final_floor), 1) <= 3 THEN 'Advanced'
        ELSE 'Expert'
    END as skill_tier
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, u.created_at, ps.total_runs, ps.total_kills
ORDER BY u.created_at DESC;

-- ===================================================
-- SPECIFIC QUERY VIEWS
-- ===================================================

-- View: Active players (with recent runs)
CREATE VIEW vw_active_players AS
SELECT DISTINCT
    u.user_id as player,
    u.username as name,
    u.last_login as last_seen,
    rh.started_at as last_game_start,
    CASE WHEN rh.ended_at IS NULL THEN 'Playing' ELSE 'Offline' END as status
FROM users u
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE 
  AND rh.started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY rh.started_at DESC;

-- View: Active runs (players currently playing)
CREATE VIEW vw_current_games AS
SELECT 
    rh.run_id as game_id,
    u.username as player,
    rh.started_at as session_start,
    TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) as minutes_playing,
    rh.final_floor as current_level,
    rh.total_kills as current_kills
FROM run_history rh
INNER JOIN users u ON rh.user_id = u.user_id
WHERE rh.ended_at IS NULL
  AND u.is_active = TRUE
ORDER BY rh.started_at;

-- ===================================================
-- PERMISSIONS AND SECURITY
-- ===================================================

-- Grant SELECT permissions on all views to application user
GRANT SELECT ON vw_user_profile TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_user_sessions TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_save TO 'tc2005b'@'localhost';
GRANT SELECT ON vw_player_boosts TO 'tc2005b'@'localhost';
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

-- ===================================================
-- VIEW TO ENDPOINT MAPPING
-- ===================================================

/*
API ENDPOINT USAGE:

GET /api/users/:userId/profile → vw_user_profile
GET /api/users/:userId/sessions → vw_user_sessions  
GET /api/users/:userId/save-state → vw_player_save
GET /api/users/:userId/permanent-upgrades → vw_player_boosts
GET /api/users/:userId/weapon-upgrades → vw_weapon_levels
GET /api/users/:userId/stats → vw_player_metrics
GET /api/users/:userId/history → vw_game_history
GET /api/users/:userId/purchases → vw_purchase_log
GET /api/users/:userId/kills → vw_combat_log
GET /api/users/:userId/boss-kills → vw_boss_victories
GET /api/users/:userId/settings → vw_player_config

GET /api/leaderboards/floors → vw_leaderboard_floors
GET /api/leaderboards/bosses → vw_leaderboard_bosses
GET /api/leaderboards/playtime → vw_leaderboard_playtime

GET /api/analytics/economy → vw_economy_stats
GET /api/analytics/combat → vw_combat_analytics
GET /api/analytics/progression → vw_player_progression

GET /api/status/active-players → vw_active_players
GET /api/status/current-games → vw_current_games

BENEFITS:
- Hides real database structure
- Facilitates schema changes
- Improves security
- Simplifies API queries
- Allows name modifications without affecting frontend
*/

-- ===================================================
-- CREATED VIEWS VERIFICATION
-- ===================================================

-- Show all created views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Example view usage
SELECT * FROM vw_user_profile LIMIT 5; 