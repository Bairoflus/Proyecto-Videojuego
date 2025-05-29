-- Script de migración para adaptar la base de datos ShatteredTimeline al API
-- Ejecutar después de crear la base de datos original

USE ShatteredTimeline;

-- 1. Agregar campo expires_at a la tabla sessions (opcional pero recomendado)
-- Esto mejora la seguridad de las sesiones
ALTER TABLE sessions 
ADD COLUMN expires_at TIMESTAMP NULL AFTER last_active;

-- 2. Actualizar sesiones existentes con fecha de expiración (24 horas desde last_active)
UPDATE sessions 
SET expires_at = DATE_ADD(COALESCE(last_active, started_at), INTERVAL 24 HOUR)
WHERE expires_at IS NULL;

-- 3. Crear índice para mejorar rendimiento de consultas de sesión
CREATE INDEX idx_sessions_token_active ON sessions(session_token, last_active);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 4. Agregar datos iniciales de habitaciones (ejemplo para Floor 1)
INSERT IGNORE INTO rooms (room_id, floor, name, type, sequence_order) VALUES
(1, 1, 'Entrada', 'combat', 1),
(2, 1, 'Sala de Combate 1', 'combat', 2),
(3, 1, 'Sala de Combate 2', 'combat', 3),
(4, 1, 'Sala de Combate 3', 'combat', 4),
(5, 1, 'Tienda', 'shop', 5),
(6, 1, 'Jefe del Piso 1', 'boss', 6);

-- 5. Agregar datos de jefes
INSERT IGNORE INTO bosses (boss_id, name, floor, max_hp, description) VALUES
(1, 'Dragón Ancestral', 1, 500, 'El guardián del primer piso, un dragón ancestral que protege los secretos del tiempo');

-- 6. Agregar tipos de enemigos básicos
INSERT IGNORE INTO enemy_types (enemy_id, name, floor, is_boss, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, boss_id) VALUES
(1, 'Goblin Daga', 1, FALSE, FALSE, 30, 10, 100, 2, 50, NULL),
(2, 'Goblin Arquero', 1, FALSE, TRUE, 25, 15, 80, 3, 150, NULL),
(3, 'Dragón Ancestral', 1, TRUE, FALSE, 500, 50, 50, 5, 200, 1);

-- 7. Agregar movimientos del jefe
INSERT IGNORE INTO boss_moves (move_id, boss_id, name, description, phase) VALUES
(1, 1, 'Aliento de Fuego', 'El dragón lanza una ráfaga de fuego en línea recta', 1),
(2, 1, 'Golpe de Cola', 'Ataque circular que daña a todos los enemigos cercanos', 1),
(3, 1, 'Vuelo Rasante', 'El dragón vuela y ataca desde arriba', 2),
(4, 1, 'Furia Ancestral', 'Modo berserker con ataques más rápidos', 3);

-- 8. Crear procedimiento para limpiar sesiones expiradas
DELIMITER //
CREATE PROCEDURE CleanExpiredSessions()
BEGIN
    DELETE FROM sessions 
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
       OR (expires_at IS NULL AND last_active < DATE_SUB(NOW(), INTERVAL 24 HOUR));
    SELECT ROW_COUNT() as deleted_sessions;
END//
DELIMITER ;

-- 9. Crear evento para limpiar sesiones automáticamente (cada hora)
CREATE EVENT IF NOT EXISTS clean_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
    CALL CleanExpiredSessions();

-- 10. Habilitar el programador de eventos
SET GLOBAL event_scheduler = ON;

-- 11. Crear vista para estadísticas rápidas de usuario
CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.created_at as user_created,
    ps.total_runs,
    ps.runs_completed,
    ps.total_kills,
    ps.best_single_run_kills,
    ps.total_gold_earned,
    ps.total_playtime_seconds,
    CASE 
        WHEN ps.total_runs > 0 THEN ROUND((ps.runs_completed / ps.total_runs) * 100, 2)
        ELSE 0 
    END as completion_rate_percent
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id;

-- 12. Crear función para calcular nivel de jugador basado en experiencia
DELIMITER //
CREATE FUNCTION GetPlayerLevel(total_kills INT, total_runs INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE player_level INT DEFAULT 1;
    DECLARE experience_points INT;
    
    -- Calcular puntos de experiencia: kills * 10 + runs completadas * 50
    SET experience_points = (total_kills * 10) + (total_runs * 50);
    
    -- Calcular nivel (cada 1000 puntos = 1 nivel)
    SET player_level = FLOOR(experience_points / 1000) + 1;
    
    -- Máximo nivel 100
    IF player_level > 100 THEN
        SET player_level = 100;
    END IF;
    
    RETURN player_level;
END//
DELIMITER ;

-- 13. Crear trigger para actualizar estadísticas automáticamente
DELIMITER //
CREATE TRIGGER update_player_stats_on_run_end
    AFTER UPDATE ON run_history
    FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        -- La partida acaba de terminar
        UPDATE player_stats 
        SET 
            total_kills = total_kills + NEW.total_kills,
            total_gold_earned = total_gold_earned + NEW.gold_collected,
            total_gold_spent = total_gold_spent + NEW.gold_spent,
            best_single_run_kills = GREATEST(best_single_run_kills, NEW.total_kills),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
END//
DELIMITER ;

COMMIT; 