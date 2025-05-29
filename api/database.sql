-- Crear base de datos
CREATE DATABASE IF NOT EXISTS shattered_timeline_db;
USE shattered_timeline_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Tabla de estadísticas del juego por usuario
CREATE TABLE IF NOT EXISTS game_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_runs INT DEFAULT 0,
    best_floor_reached INT DEFAULT 1,
    total_enemies_defeated INT DEFAULT 0,
    total_gold_collected INT DEFAULT 0,
    total_playtime_seconds INT DEFAULT 0,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Tabla de partidas guardadas
CREATE TABLE IF NOT EXISTS saved_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_number INT NOT NULL CHECK (slot_number BETWEEN 1 AND 3),
    current_floor INT NOT NULL DEFAULT 1,
    current_room INT NOT NULL DEFAULT 1,
    current_run INT NOT NULL DEFAULT 1,
    player_health INT NOT NULL DEFAULT 100,
    player_stamina INT NOT NULL DEFAULT 100,
    player_gold INT NOT NULL DEFAULT 0,
    melee_damage_bonus INT NOT NULL DEFAULT 0,
    ranged_damage_bonus INT NOT NULL DEFAULT 0,
    game_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_slot (user_id, slot_number),
    INDEX idx_user_id (user_id)
);

-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    music_volume DECIMAL(3,2) DEFAULT 0.50 CHECK (music_volume BETWEEN 0.00 AND 1.00),
    sfx_volume DECIMAL(3,2) DEFAULT 0.50 CHECK (sfx_volume BETWEEN 0.00 AND 1.00),
    controls_config JSON,
    graphics_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
);

-- Insertar configuración por defecto para nuevos usuarios (trigger)
DELIMITER //
CREATE TRIGGER after_user_insert 
    AFTER INSERT ON users 
    FOR EACH ROW 
BEGIN
    -- Crear estadísticas iniciales
    INSERT INTO game_stats (user_id) VALUES (NEW.id);
    
    -- Crear configuración por defecto
    INSERT INTO user_settings (user_id, controls_config, graphics_settings) 
    VALUES (
        NEW.id,
        JSON_OBJECT(
            'moveUp', 'KeyW',
            'moveDown', 'KeyS', 
            'moveLeft', 'KeyA',
            'moveRight', 'KeyD',
            'attack', 'Space',
            'dash', 'ShiftLeft',
            'weaponDagger', 'KeyQ',
            'weaponSlingshot', 'KeyE'
        ),
        JSON_OBJECT(
            'showHitboxes', false,
            'showFPS', false,
            'particleEffects', true
        )
    );
END//
DELIMITER ;

-- Procedimiento para limpiar sesiones expiradas
DELIMITER //
CREATE PROCEDURE CleanExpiredSessions()
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    SELECT ROW_COUNT() as deleted_sessions;
END//
DELIMITER ;

-- Evento para limpiar sesiones expiradas automáticamente (cada hora)
CREATE EVENT IF NOT EXISTS clean_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
    CALL CleanExpiredSessions();

-- Habilitar el programador de eventos
SET GLOBAL event_scheduler = ON; 