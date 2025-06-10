-- ========================================
-- 📊 VIEWS FOR PLAYER STATISTICS 
-- Masking real column names as requested
-- ========================================

USE ProjectShatteredTimeline;

-- Vista para estadísticas históricas del jugador
CREATE VIEW player_stats_view AS
SELECT 
    user_id,
    total_runs AS runs_total,
    runs_completed,
    total_kills AS kills_total,
    best_single_run_kills AS best_run_kills,
    highest_damage_hit AS max_damage,
    total_gold_earned AS gold_earned,
    total_gold_spent AS gold_spent,
    total_playtime_seconds AS playtime_seconds
FROM player_stats;

-- Vista para calcular tiempo total jugado desde sesiones
CREATE VIEW player_playtime_view AS
SELECT 
    user_id,
    COUNT(*) AS total_sessions,
    SUM(
        CASE 
            WHEN closed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, closed_at)
            ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
        END
    ) AS calculated_playtime_seconds,
    AVG(
        CASE 
            WHEN closed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, closed_at)
            ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
        END
    ) AS avg_session_seconds,
    MAX(
        CASE 
            WHEN closed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, closed_at)
            ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
        END
    ) AS longest_session_seconds,
    MIN(started_at) AS first_played,
    COALESCE(MAX(closed_at), NOW()) AS last_played
FROM sessions 
GROUP BY user_id;

-- Vista para estadísticas de run actual
CREATE VIEW current_run_view AS
SELECT 
    rh.user_id,
    rh.run_id,
    rh.started_at AS run_started,
    rh.last_room_id,
    CASE 
        WHEN rh.ended_at IS NULL THEN 'in_progress'
        WHEN rh.completed = 1 THEN 'completed'
        ELSE 'failed'
    END AS run_status,
    rh.completed,
    rh.ended_at,
    rh.gold_collected,
    rh.gold_spent AS run_gold_spent,
    rh.total_kills AS run_kills,
    ss.current_hp AS health,
    ss.current_stamina AS stamina,
    ss.gold,
    r.floor,
    r.sequence_order AS room_sequence
FROM run_history rh
LEFT JOIN save_states ss ON rh.run_id = ss.run_id
LEFT JOIN rooms r ON rh.last_room_id = r.room_id
WHERE rh.ended_at IS NULL  -- Only in-progress runs
ORDER BY rh.started_at DESC;

-- Vista para weapon upgrades del run actual
CREATE VIEW current_weapon_upgrades_view AS
SELECT 
    user_id,
    run_id,
    slot_type AS weapon_type,
    level AS upgrade_level,
    damage_per_upgrade,
    gold_cost_per_upgrade,
    timestamp AS upgraded_at
FROM weapon_upgrades_temp
ORDER BY timestamp DESC;

-- Vista combinada para estadísticas completas
CREATE VIEW complete_player_stats_view AS
SELECT 
    ps.user_id,
    ps.runs_total,
    ps.runs_completed,
    ps.kills_total,
    ps.best_run_kills,
    ps.max_damage,
    ps.gold_earned,
    ps.gold_spent,
    ps.playtime_seconds AS stored_playtime,
    pt.calculated_playtime_seconds,
    pt.total_sessions,
    pt.avg_session_seconds,
    pt.first_played,
    pt.last_played
FROM player_stats_view ps
LEFT JOIN player_playtime_view pt ON ps.user_id = pt.user_id; 