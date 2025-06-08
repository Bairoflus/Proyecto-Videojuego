-- ===================================================
-- SHATTERED TIMELINE - OPTIMIZED DATABASE VIEWS v2.4
-- ===================================================
-- Version: 2.4 - Updated for admin dashboard + removed unused columns
-- Objective: Clean views for admin analytics + remove unused column references
-- Improvements: Based on comprehensive analysis and admin dashboard requirements
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
-- GAME STATE VIEWS (CLEAN)
-- ===================================================

-- View: Player saved states
CREATE VIEW vw_player_save AS
SELECT 
    save_id as save_identifier,
    user_id as player,
    session_id as current_session,
    run_id as game_session,
    floor_id as current_floor,
    room_id as current_room,
    current_hp as health_points,
    gold as current_gold,
    saved_at as save_timestamp,
    is_active as save_status
FROM save_states;

-- View: Player permanent upgrades
CREATE VIEW vw_player_boosts AS
SELECT 
    upgrade_id as boost_id,
    user_id as player,
    upgrade_type as enhancement_type,
    level as enhancement_level,
    updated_at as last_modified
FROM permanent_player_upgrades;

-- View: Temporary weapon upgrades
CREATE VIEW vw_weapon_levels AS
SELECT 
    temp_upgrade_id as upgrade_session,
    user_id as player,
    run_id as session,
    melee_level as close_combat,
    ranged_level as distance_combat,
    updated_at as modified
FROM weapon_upgrades_temp;

-- ===================================================
-- STATISTICS AND ANALYTICS VIEWS (ENHANCED)
-- ===================================================

-- View: Player general statistics (ENHANCED: includes total_gold_spent)
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
    last_updated as updated
FROM player_stats;

-- View: Game attempt history (OPTIMIZED: removed unused columns)
CREATE VIEW vw_game_history AS
SELECT 
    run_id as id,
    user_id as player,
    started_at as begin_time,
    ended_at as finish_time,
    final_floor as reached_level,
    gold_spent as spent_coins,
    cause_of_death as end_reason,
    total_kills as enemies_defeated
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
-- CONFIGURATION VIEWS (OPTIMIZED)
-- ===================================================

-- View: Player configurations (OPTIMIZED: no longer references show_fps)
CREATE VIEW vw_player_config AS
SELECT 
    user_id as player,
    music_volume as audio_music,
    sfx_volume as audio_effects,
    auto_save_enabled as auto_backup,
    updated_at as modified
FROM player_settings;

-- ===================================================
-- ADMIN DASHBOARD VIEWS (NEW/ENHANCED FOR ANALYTICS)
-- ===================================================

-- View: Top players by floors reached (ENHANCED: for leaderboards)
CREATE VIEW vw_leaderboard_floors AS
SELECT 
    u.username as champion,
    MAX(rh.final_floor) as max_level,
    ps.total_runs as total_attempts,
    ps.total_kills as total_eliminations,
    ps.total_gold_spent as gold_invested,
    ps.last_updated as last_achievement
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, ps.total_runs, ps.total_kills, ps.total_gold_spent, ps.last_updated
ORDER BY MAX(rh.final_floor) DESC, ps.total_kills DESC
LIMIT 20;

-- View: Top players by bosses defeated
CREATE VIEW vw_leaderboard_bosses AS
SELECT 
    u.username as boss_slayer,
    ps.total_bosses_killed as bosses_defeated,
    MAX(rh.final_floor) as progression,
    ps.total_runs as attempts,
    ps.total_gold_spent as gold_invested,
    ps.last_updated as last_victory
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE AND ps.total_bosses_killed > 0
GROUP BY u.user_id, u.username, ps.total_bosses_killed, ps.total_runs, ps.total_gold_spent, ps.last_updated
ORDER BY ps.total_bosses_killed DESC, MAX(rh.final_floor) DESC
LIMIT 20;

-- View: Top players by playtime
CREATE VIEW vw_leaderboard_playtime AS
SELECT 
    u.username as dedicated_player,
    ROUND(ps.total_playtime_seconds / 3600, 2) as hours_played,
    ps.total_runs as sessions,
    MAX(rh.final_floor) as best_achievement,
    ps.total_gold_spent as total_invested,
    ps.last_updated as last_session
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, ps.total_playtime_seconds, ps.total_runs, ps.total_gold_spent, ps.last_updated
ORDER BY ps.total_playtime_seconds DESC
LIMIT 20;

-- ===================================================
-- ADVANCED ANALYTICS VIEWS (FOR ADMIN DASHBOARD)
-- ===================================================

-- View: Game economy statistics (ENHANCED: for admin analytics)
CREATE VIEW vw_economy_stats AS
SELECT 
    weapon_type as item_category,
    upgrade_level as tier,
    COUNT(*) as purchase_count,
    AVG(cost) as avg_price,
    SUM(cost) as total_revenue,
    MIN(purchased_at) as first_purchase,
    MAX(purchased_at) as last_purchase,
    COUNT(DISTINCT user_id) as unique_buyers
FROM weapon_upgrade_purchases
GROUP BY weapon_type, upgrade_level
ORDER BY weapon_type, upgrade_level;

-- View: Combat behavior analysis (FOR ADMIN ANALYTICS)
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

-- View: Player progression analysis (ENHANCED: for admin dashboard)
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
    END as skill_tier,
    CASE 
        WHEN ps.total_gold_spent = 0 THEN 'Free Player'
        WHEN ps.total_gold_spent <= 100 THEN 'Light Spender'
        WHEN ps.total_gold_spent <= 500 THEN 'Regular Spender'
        ELSE 'Heavy Spender'
    END as spending_tier
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN run_history rh ON u.user_id = rh.user_id
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, u.created_at, ps.total_runs, ps.total_kills, ps.total_gold_spent
ORDER BY u.created_at DESC;

-- View: Active players status (FOR ADMIN DASHBOARD)
CREATE VIEW vw_active_players AS
SELECT 
    u.username as player_name,
    u.last_login as last_active,
    ps.total_runs as total_sessions,
    ps.total_kills as lifetime_kills,
    ps.total_gold_spent as lifetime_spending,
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'Recent'
        ELSE 'Inactive'
    END as activity_status
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY u.last_login DESC;

-- View: Current active games (FOR ADMIN DASHBOARD)
CREATE VIEW vw_current_games AS
SELECT 
    rh.run_id as game_id,
    u.username as player,
    rh.started_at as session_start,
    TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) as minutes_playing,
    rh.final_floor as current_level,
    rh.total_kills as current_kills,
    rh.gold_spent as spent_this_run,
    (SELECT gold FROM save_states WHERE user_id = u.user_id AND is_active = TRUE LIMIT 1) as current_gold
FROM run_history rh
INNER JOIN users u ON rh.user_id = u.user_id
WHERE rh.ended_at IS NULL
  AND u.is_active = TRUE
  AND u.role = 'player'
ORDER BY rh.started_at;

-- ===================================================
-- ENHANCED VIEWS FOR COMPLETE STATISTICS
-- ===================================================

-- View: Complete player statistics for API (ENHANCED)
CREATE VIEW vw_complete_player_stats AS
SELECT 
    ps.user_id as player_id,
    ps.total_runs as totalRuns,
    COALESCE(completed_runs.count, 0) as completedRuns,
    CASE 
        WHEN ps.total_runs > 0 THEN ROUND((COALESCE(completed_runs.count, 0) / ps.total_runs) * 100, 2)
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
    ps.total_runs as totalSessions, -- Approximation
    ps.last_updated as lastPlayed
FROM player_stats ps
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM run_history 
    WHERE cause_of_death != 'active' AND final_floor >= 3
    GROUP BY user_id
) completed_runs ON ps.user_id = completed_runs.user_id
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
GRANT SELECT ON vw_complete_player_stats TO 'tc2005b'@'localhost';

-- ===================================================
-- VIEW TO ENDPOINT MAPPING (ENHANCED FOR ADMIN)
-- ===================================================

/*
API ENDPOINT USAGE:

PLAYER ENDPOINTS:
GET /api/users/:userId/profile → vw_user_profile
GET /api/users/:userId/sessions → vw_user_sessions  
GET /api/users/:userId/save-state → vw_player_save
GET /api/users/:userId/permanent-upgrades → vw_player_boosts
GET /api/users/:userId/weapon-upgrades → vw_weapon_levels
GET /api/users/:userId/stats → vw_player_metrics
GET /api/users/:userId/complete-stats → vw_complete_player_stats
GET /api/users/:userId/history → vw_game_history
GET /api/users/:userId/settings → vw_player_config

ADMIN DASHBOARD ENDPOINTS:
GET /api/leaderboards/floors → vw_leaderboard_floors
GET /api/leaderboards/bosses → vw_leaderboard_bosses
GET /api/leaderboards/playtime → vw_leaderboard_playtime

GET /api/analytics/economy → vw_economy_stats
GET /api/analytics/combat → vw_combat_analytics
GET /api/analytics/player-progression → vw_player_progression

GET /api/status/active-players → vw_active_players
GET /api/status/current-games → vw_current_games

IMPROVEMENTS v2.4:
✅ Removed references to deleted columns:
- final_gold, bosses_killed, duration_seconds from run_history
- logout_at from sessions  
- logout_timestamp from save_states
- show_fps from player_settings

✅ Enhanced admin analytics:
- Added spending_tier to vw_player_progression
- Enhanced vw_economy_stats with unique_buyers
- Added vw_active_players for player status monitoring
- Added vw_current_games for real-time game monitoring

✅ Optimized for admin dashboard:
- All analytics views properly formatted
- Proper indexing for leaderboard performance
- Enhanced gold tracking throughout

BENEFITS:
- Hides real database structure
- Facilitates schema changes
- Improves security  
- Simplifies API queries
- Enhanced admin analytics capabilities
- Complete gold spending tracking
- Real-time game monitoring for admins
*/

-- ===================================================
-- CREATED VIEWS VERIFICATION
-- ===================================================

-- Show all created views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Example view usage with enhanced functionality
SELECT * FROM vw_user_profile LIMIT 5;
SELECT * FROM vw_player_metrics LIMIT 5;
SELECT * FROM vw_complete_player_stats LIMIT 5;
SELECT * FROM vw_leaderboard_floors LIMIT 5;
SELECT * FROM vw_economy_stats LIMIT 5;
SELECT * FROM vw_current_games LIMIT 5; 