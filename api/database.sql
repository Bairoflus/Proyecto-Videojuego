-- 1. Crear la base de datos y seleccionarla
CREATE DATABASE IF NOT EXISTS ShatteredTimeline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ShatteredTimeline;

-- 2. Tabla users
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash CHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabla sessions
CREATE TABLE sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token CHAR(36) NOT NULL DEFAULT (UUID()),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 4. Tabla rooms
CREATE TABLE rooms (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  floor INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  sequence_order SMALLINT NOT NULL
) ENGINE=InnoDB;

-- 5. Tabla run_history
CREATE TABLE run_history (
  run_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  gold_collected INT NOT NULL DEFAULT 0,
  gold_spent INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0,
  death_cause TEXT,
  last_room_id INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (last_room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 6. Tabla player_stats
CREATE TABLE player_stats (
  user_id INT PRIMARY KEY,
  total_runs INT NOT NULL DEFAULT 0,
  runs_completed INT NOT NULL DEFAULT 0,
  total_kills INT NOT NULL DEFAULT 0,
  best_single_run_kills INT NOT NULL DEFAULT 0,
  highest_damage_hit INT NOT NULL DEFAULT 0,
  total_gold_earned INT NOT NULL DEFAULT 0,
  total_gold_spent INT NOT NULL DEFAULT 0,
  total_playtime_seconds INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 7. Tabla player_upgrades
CREATE TABLE player_upgrades (
  user_id INT NOT NULL,
  upgrade_type ENUM('vida','stamina','melee','rango','velocidad') NOT NULL,
  level SMALLINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, upgrade_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 8. Tabla bosses
CREATE TABLE bosses (
  boss_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  floor INT NOT NULL,
  max_hp INT NOT NULL,
  description TEXT
) ENGINE=InnoDB;

-- 9. Tabla boss_moves
CREATE TABLE boss_moves (
  move_id INT AUTO_INCREMENT PRIMARY KEY,
  boss_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  phase SMALLINT NOT NULL,
  FOREIGN KEY (boss_id) REFERENCES bosses(boss_id)
) ENGINE=InnoDB;

-- 10. Tabla enemy_types
CREATE TABLE enemy_types (
  enemy_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  floor INT NOT NULL,
  is_boss BOOLEAN NOT NULL DEFAULT FALSE,
  is_rare BOOLEAN NOT NULL DEFAULT FALSE,
  base_hp SMALLINT NOT NULL,
  base_damage SMALLINT NOT NULL,
  movement_speed SMALLINT NOT NULL,
  attack_cooldown_seconds SMALLINT NOT NULL,
  attack_range SMALLINT NOT NULL,
  sprite_url VARCHAR(255),
  boss_id INT NULL,
  FOREIGN KEY (boss_id) REFERENCES bosses(boss_id)
) ENGINE=InnoDB;

-- 11. Tabla permanent_upgrade_purchases
CREATE TABLE permanent_upgrade_purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  upgrade_type ENUM('vida','stamina','melee','rango','velocidad') NOT NULL,
  level_before SMALLINT NOT NULL,
  level_after SMALLINT NOT NULL,
  gold_spent INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id)
) ENGINE=InnoDB;

-- 12. Tabla equipped_weapons
CREATE TABLE equipped_weapons (
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  weapon_slot ENUM('melee','rango') NOT NULL,
  PRIMARY KEY (run_id, user_id, weapon_slot),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 13. Tabla weapon_upgrades_temp
CREATE TABLE weapon_upgrades_temp (
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  weapon_slot ENUM('melee','rango') NOT NULL,
  level SMALLINT NOT NULL,
  damage_per_upgrade SMALLINT NOT NULL,
  gold_cost_per_upgrade SMALLINT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id, user_id, weapon_slot),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 14. Tabla enemy_kills
CREATE TABLE enemy_kills (
  kill_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  enemy_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (enemy_id) REFERENCES enemy_types(enemy_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 15. Tabla boss_encounters
CREATE TABLE boss_encounters (
  encounter_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  boss_id INT NOT NULL,
  damage_dealt INT NOT NULL,
  damage_taken INT NOT NULL,
  result ENUM('win','loss') NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (boss_id) REFERENCES bosses(boss_id)
) ENGINE=InnoDB;

-- 16. Tabla boss_kills
CREATE TABLE boss_kills (
  kill_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  boss_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (boss_id) REFERENCES bosses(boss_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 17. Tabla shop_purchases
CREATE TABLE shop_purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_name VARCHAR(50) NOT NULL,
  gold_spent INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 18. Tabla chest_events
CREATE TABLE chest_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  gold_received INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 19. Tabla save_states
CREATE TABLE save_states (
  save_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  current_hp SMALLINT NOT NULL,
  current_stamina SMALLINT NOT NULL,
  gold INT NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

-- 20. Tabla player_settings
CREATE TABLE player_settings (
  user_id INT PRIMARY KEY,
  music_volume INT NOT NULL,
  sfx_volume INT NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 21. Tabla player_events
CREATE TABLE player_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  event_type ENUM(
    'dash','ataque','oro_recogido','item_usado','entrada_sala','salida_sala'
  ) NOT NULL,
  value INT NOT NULL,
  weapon_type VARCHAR(20),
  context VARCHAR(50),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB; 