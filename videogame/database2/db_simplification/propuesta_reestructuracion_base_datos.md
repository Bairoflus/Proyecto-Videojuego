# 🗄️ **PROPUESTA DE REESTRUCTURACIÓN DE BASE DE DATOS**

---

## 📋 **RESUMEN EJECUTIVO**

**Objetivo:** Reestructurar la base de datos actual (25+ tablas) a una versión optimizada (12 tablas) basada en análisis detallado del frontend y feedback específico del usuario.

**Principio:** Mantener solo datos esenciales para persistencia, analytics críticos e infraestructura futura, eliminando redundancias y datos que ya están hardcodeados en el frontend.

---

## 🎯 **DECISIONES FINALES BASADAS EN FEEDBACK**

### **🟢 TABLAS A MANTENER (12 tablas)**

#### **Autenticación y Sesiones (2 tablas)**
1. **`users`** ✅ - Autenticación básica
2. **`sessions`** ✅ - Control de sesiones activas

#### **Progreso y Estado del Jugador (3 tablas)**
3. **`save_states`** ✅ - Estado guardado para continuidad entre sesiones
4. **`permanent_player_upgrades`** ✅ - Mejoras permanentes del personaje (Health +15, Stamina +20, MovementSpeed)
5. **`weapon_upgrades_temp`** ✅ - Mejoras temporales de armas (se mantienen en logout, se resetean en muerte)

#### **Estadísticas y Analytics (4 tablas)**
6. **`player_stats`** ✅ - Métricas históricas agregadas
7. **`run_history`** ✅ - Historial de intentos de juego
8. **`weapon_upgrade_purchases`** ✅ - Compras en tienda para analytics de economía
9. **`enemy_kills`** ✅ - Tracking de kills para analytics
10. **`boss_kills`** ✅ - Tracking específico de jefes

#### **Configuración e Infraestructura (2 tablas)**
11. **`player_settings`** ✅ - Configuraciones de audio (infraestructura futura)
12. **`chest_events`** ❓ - **PENDIENTE DECISIÓN:** ¿Realmente útil si siempre da mismo oro?

### **🔴 TABLAS A ELIMINAR (13+ tablas)**
- `rooms` ❌ - Hardcodeado en combatRooms.js
- `enemy_types` ❌ - Solo 2 tipos hardcodeados  
- `boss_details` ❌ - Hardcodeado en DragonBoss.js
- `boss_moves` ❌ - Hardcodeado en clases de jefes
- `weapon_slots` ❌ - Solo 'melee'/'ranged'
- `upgrade_types` ❌ - Será enum en frontend
- `boss_results` ❌ - Será enum en frontend
- `room_types` ❌ - Solo 'combat'/'shop'/'boss'
- `equipped_weapons` ❌ - No se usa actualmente
- `permanent_upgrade_purchases` ❌ - Redundante
- `boss_encounters` ❌ - Demasiado granular
- `player_events` ❌ - Logs innecesarios

### **🔄 CONVERSIONES A FRONTEND**
- `event_types` → **Enum en frontend**

---

## 🛠️ **PLAN DE REESTRUCTURACIÓN PASO A PASO**

### **FASE 1: ANÁLISIS Y PREPARACIÓN**

#### **1.1 Backup de Datos Críticos**
```sql
-- Crear backup de la base de datos actual
CREATE DATABASE ProjectShatteredTimeline_Backup_20241201;
-- Copiar todas las tablas actuales como respaldo
```

#### **1.2 Análisis de Dependencias**
- [ ] Identificar todas las referencias FK en tablas a eliminar
- [ ] Verificar qué datos de las tablas eliminadas necesitan migrarse
- [ ] Documentar todos los endpoints del API que quedarán obsoletos

#### **1.3 Migración de Datos Esenciales**
```sql
-- Extraer datos críticos de tablas que se eliminarán
-- Ejemplo: weapon levels actuales → permanent_player_upgrades
SELECT user_id, upgrade_type, level 
FROM player_upgrades 
WHERE upgrade_type IN ('melee_weapon_level', 'ranged_weapon_level');
```

### **FASE 2: MODIFICACIONES DE ESQUEMA**

#### **2.1 Renombrar y Reestructurar Tablas Existentes**

**A. Renombrar `player_upgrades` → `permanent_player_upgrades`**
```sql
-- Renombrar tabla
RENAME TABLE player_upgrades TO permanent_player_upgrades;

-- Modificar estructura para nuevas mejoras permanentes
ALTER TABLE permanent_player_upgrades 
MODIFY COLUMN upgrade_type ENUM('health_max', 'stamina_max', 'movement_speed') NOT NULL;

-- Limpiar datos obsoletos (weapon levels van a weapon_upgrades_temp)
DELETE FROM permanent_player_upgrades 
WHERE upgrade_type NOT IN ('health_max', 'stamina_max', 'movement_speed');
```

**B. Optimizar `save_states` para mejor gestión de sesiones**
```sql
-- Agregar campos necesarios para lógica de sesión
ALTER TABLE save_states 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN logout_timestamp DATETIME NULL,
ADD INDEX idx_user_active (user_id, is_active);

-- Comentario de la tabla para clarificar propósito
ALTER TABLE save_states 
COMMENT = 'Estado guardado del jugador para continuidad entre sesiones. is_active=TRUE indica el save state actual del jugador.';
```

**C. Asegurar `weapon_upgrades_temp` tenga la lógica correcta**
```sql
-- Verificar que existe la tabla y tiene campos correctos
DESCRIBE weapon_upgrades_temp;

-- Si no existe, crearla:
CREATE TABLE IF NOT EXISTS weapon_upgrades_temp (
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  melee_level INT DEFAULT 0,
  ranged_level INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES run_history(run_id) ON DELETE CASCADE
) COMMENT = 'Mejoras temporales de armas por run. Se mantienen en logout, se resetean en muerte.';
```

#### **2.2 Eliminar Tablas Innecesarias**
```sql
-- Eliminar en orden correcto (FKs primero)
DROP TABLE IF EXISTS boss_moves;
DROP TABLE IF EXISTS boss_details;
DROP TABLE IF EXISTS boss_encounters;
DROP TABLE IF EXISTS permanent_upgrade_purchases;
DROP TABLE IF EXISTS player_events;
DROP TABLE IF EXISTS equipped_weapons;
DROP TABLE IF EXISTS enemy_types;
DROP TABLE IF EXISTS rooms;

-- Eliminar tablas lookup
DROP TABLE IF EXISTS event_types;
DROP TABLE IF EXISTS weapon_slots;
DROP TABLE IF EXISTS upgrade_types;
DROP TABLE IF EXISTS boss_results;
DROP TABLE IF EXISTS room_types;
```

### **FASE 3: MIGRACIÓN DE DATOS**

#### **3.1 Migrar Weapon Levels a weapon_upgrades_temp**
```sql
-- Migrar niveles de armas actuales de player_upgrades a weapon_upgrades_temp
INSERT INTO weapon_upgrades_temp (user_id, run_id, melee_level, ranged_level)
SELECT 
  pu_melee.user_id,
  COALESCE(rh.run_id, 1) as run_id,
  COALESCE(pu_melee.level, 1) as melee_level,
  COALESCE(pu_ranged.level, 1) as ranged_level
FROM users u
LEFT JOIN permanent_player_upgrades pu_melee ON u.user_id = pu_melee.user_id AND pu_melee.upgrade_type = 'melee_weapon_level'
LEFT JOIN permanent_player_upgrades pu_ranged ON u.user_id = pu_ranged.user_id AND pu_ranged.upgrade_type = 'ranged_weapon_level'
LEFT JOIN run_history rh ON u.user_id = rh.user_id AND rh.ended_at IS NULL
ON DUPLICATE KEY UPDATE 
  melee_level = VALUES(melee_level),
  ranged_level = VALUES(ranged_level);
```

#### **3.2 Limpiar permanent_player_upgrades**
```sql
-- Eliminar weapon levels de permanent_player_upgrades (ya migrados)
DELETE FROM permanent_player_upgrades 
WHERE upgrade_type IN ('melee_weapon_level', 'ranged_weapon_level');
```

### **FASE 4: CREAR ENUMS EN FRONTEND**

#### **4.1 Crear constants/gameEnums.js**
```javascript
// videogame/src/constants/gameEnums.js
export const GAME_ENUMS = {
  EVENT_TYPES: [
    'game_start', 'game_resume', 'room_enter', 'room_exit',
    'enemy_kill', 'boss_encounter', 'boss_kill', 'player_death',
    'shop_open', 'shop_close', 'weapon_switch', 'weapon_upgrade',
    'chest_open', 'floor_transition'
  ],
  
  UPGRADE_TYPES: [
    'health_max', 'stamina_max', 'movement_speed'
  ],
  
  WEAPON_SLOTS: ['melee', 'ranged'],
  
  BOSS_RESULTS: ['victory', 'defeat', 'escape', 'timeout'],
  
  ROOM_TYPES: ['combat', 'shop', 'boss'],
  
  PERMANENT_UPGRADES: {
    health_max: { name: 'Health Boost', value: 15, description: '+15 Maximum Health' },
    stamina_max: { name: 'Stamina Boost', value: 20, description: '+20 Maximum Stamina' },
    movement_speed: { name: 'Speed Boost', value: 0.1, description: '+10% Movement Speed' }
  }
};
```

### **FASE 5: ACTUALIZAR API**

#### **5.1 Endpoints a Eliminar**
```javascript
// Eliminar de app.js:
// GET /api/rooms
// GET /api/enemies  
// GET /api/bosses
// GET /api/lookups
// GET /api/item-types
// POST /api/runs/:runId/boss-encounter
// POST /api/runs/:runId/events
// POST /api/runs/:runId/upgrade-purchase
// POST /api/runs/:runId/equip-weapon
```

#### **5.2 Nuevos Endpoints Necesarios**
```javascript
// GET /api/users/:userId/permanent-upgrades
app.get('/api/users/:userId/permanent-upgrades', async (req, res) => {
  // Obtener mejoras permanentes del jugador
  const [upgrades] = await connection.execute(
    'SELECT upgrade_type, level FROM permanent_player_upgrades WHERE user_id = ?',
    [req.params.userId]
  );
  res.json(upgrades);
});

// POST /api/users/:userId/permanent-upgrade
app.post('/api/users/:userId/permanent-upgrade', async (req, res) => {
  // Aplicar mejora permanente después de matar jefe
  const { upgradeType, level } = req.body;
  await connection.execute(
    'INSERT INTO permanent_player_upgrades (user_id, upgrade_type, level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE level = level + VALUES(level)',
    [req.params.userId, upgradeType, level]
  );
  res.json({ message: 'Permanent upgrade applied' });
});

// GET/PUT /api/users/:userId/weapon-upgrades-temp  
// Para manejar mejoras temporales de armas
```

### **FASE 6: LÓGICA DE SESIONES Y SAVE STATES**

#### **6.1 Lógica de Save States Mejorada**
```javascript
// utils/saveStateManager.js
export class SaveStateManager {
  
  // Guardar estado al hacer logout
  static async saveOnLogout(userId, gameState) {
    // Marcar save state anterior como inactivo
    await connection.execute(
      'UPDATE save_states SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );
    
    // Crear nuevo save state activo
    await connection.execute(
      'INSERT INTO save_states (user_id, session_id, run_id, room_id, current_hp, current_stamina, gold, is_active, logout_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())',
      [userId, sessionId, runId, roomId, hp, stamina, gold]
    );
  }
  
  // Cargar estado al hacer login
  static async loadOnLogin(userId) {
    const [states] = await connection.execute(
      'SELECT * FROM save_states WHERE user_id = ? AND is_active = TRUE ORDER BY saved_at DESC LIMIT 1',
      [userId]
    );
    
    return states[0] || null;
  }
}
```

#### **6.2 Lógica de Weapon Upgrades Temp**
```javascript
// utils/weaponUpgradeManager.js
export class WeaponUpgradeManager {
  
  // Reset en muerte
  static async resetOnDeath(userId, runId) {
    await connection.execute(
      'UPDATE weapon_upgrades_temp SET melee_level = 0, ranged_level = 0 WHERE user_id = ? AND run_id = ?',
      [userId, runId]
    );
  }
  
  // Mantener en logout
  static async preserveOnLogout(userId, runId, meleeLevel, rangedLevel) {
    await connection.execute(
      'INSERT INTO weapon_upgrades_temp (user_id, run_id, melee_level, ranged_level) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE melee_level = VALUES(melee_level), ranged_level = VALUES(ranged_level)',
      [userId, runId, meleeLevel, rangedLevel]
    );
  }
}
```

### **FASE 7: IMPLEMENTAR SISTEMA DE MEJORAS PERMANENTES**

#### **7.1 Frontend - Boss Kill Popup**
```javascript
// classes/entities/Boss.js - Al morir el jefe
die() {
  // ... lógica existente de muerte
  
  // Mostrar popup de mejoras permanentes
  this.showPermanentUpgradePopup();
}

showPermanentUpgradePopup() {
  const upgradeOptions = [
    { type: 'health_max', name: 'Health Boost', description: '+15 Maximum Health' },
    { type: 'stamina_max', name: 'Stamina Boost', description: '+20 Maximum Stamina' },
    { type: 'movement_speed', name: 'Speed Boost', description: '+10% Movement Speed' }
  ];
  
  // Crear UI para seleccionar 1 de 3 opciones
  // Pausar juego hasta que se seleccione
  // Enviar selección al backend
}
```

### **FASE 8: TESTING Y VALIDACIÓN**

#### **8.1 Tests de Migración**
- [ ] Verificar que todos los usuarios existentes mantienen sus datos
- [ ] Confirmar que save states funcionan correctamente
- [ ] Validar lógica de weapon upgrades temp (logout vs muerte)
- [ ] Probar sistema de mejoras permanentes

#### **8.2 Tests de Rendimiento**
- [ ] Medir tiempo de queries antes/después
- [ ] Verificar que auto-save sigue funcionando
- [ ] Confirmar que el frontend es completamente autosuficiente

---

## 📊 **ESQUEMA FINAL DE BASE DE DATOS (12 TABLAS)**

### **Autenticación (2)**
- `users` - Cuentas de usuario
- `sessions` - Sesiones activas

### **Estado del Jugador (3)**  
- `save_states` - Estado para continuidad entre sesiones
- `permanent_player_upgrades` - Mejoras permanentes (Health, Stamina, Speed)
- `weapon_upgrades_temp` - Mejoras temporales de armas

### **Analytics (5)**
- `player_stats` - Estadísticas históricas
- `run_history` - Historial de runs
- `weapon_upgrade_purchases` - Compras en tienda
- `enemy_kills` - Tracking de kills
- `boss_kills` - Tracking de jefes

### **Configuración (2)**
- `player_settings` - Configuraciones de audio
- `chest_events` - ❓ **PENDIENTE:** ¿Mantener o eliminar?

---

## ❓ **DECISIONES PENDIENTES**

### **1. `chest_events` - ¿Mantener o Eliminar?**
**Tu comentario:** *"¿En realidad sí es útil? Porque el cofre siempre aparece al finalizar combat y boss room y siempre da el mismo oro."*

**Opciones:**
- **A) Eliminar:** Si siempre da mismo oro, no aporta analytics útiles
- **B) Mantener:** Útil para tracking de progresión y balancing futuro

**Recomendación:** Eliminar por simplicidad, ya que es un evento predecible.

### **2. Frecuencia de Auto-Save**
**Actual:** Cada 30 segundos
**¿Cambiar a:** Solo en transiciones de habitación + logout?

---

## 🎯 **CRONOGRAMA DE IMPLEMENTACIÓN**

| Fase | Duración | Descripción |
|------|----------|-------------|
| **Fase 1** | 1 día | Backup y análisis de dependencias |
| **Fase 2** | 2 días | Modificaciones de esquema |
| **Fase 3** | 1 día | Migración de datos |
| **Fase 4** | 1 día | Crear enums en frontend |
| **Fase 5** | 2 días | Actualizar API endpoints |
| **Fase 6** | 2 días | Implementar lógica de sesiones |
| **Fase 7** | 3 días | Sistema de mejoras permanentes |
| **Fase 8** | 2 días | Testing y validación |
| **TOTAL** | **14 días** | Implementación completa |

---

## ✅ **PRÓXIMOS PASOS**

1. **Confirmar decisión sobre `chest_events`**
2. **Aprobar el cronograma de implementación**  
3. **Iniciar Fase 1: Backup y análisis**
4. **Coordinar testing durante la migración**

**¿Apruebas esta propuesta de reestructuración? ¿Hay algún aspecto que quisieras modificar antes de proceder?**

---

*Propuesta basada en análisis completo del frontend, 39 endpoints del API, y feedback específico del usuario* 