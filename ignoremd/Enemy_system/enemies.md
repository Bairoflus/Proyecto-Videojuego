# 🗡️ SISTEMA DE ENEMIGOS - SHATTERED TIMELINE

## 📚 DOCUMENTACIÓN COMPLETA

Este documento describe el funcionamiento completo del sistema de enemigos del juego Shattered Timeline, desde la base de datos hasta la implementación en el frontend.

---

## 📊 1. BASE DE DATOS

### 1.1 Tabla `enemy_kills`

**Propósito:** Registra todos los asesinatos de enemigos para analytics y tracking.

```sql
CREATE TABLE enemy_kills (
    kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,                    -- ID del jugador
    run_id INT NOT NULL,                     -- ID de la partida
    run_number INT NOT NULL,                 -- Número de run del jugador
    enemy_type ENUM('common', 'rare') NOT NULL,  -- Tipo de enemigo
    room_id INT NOT NULL,                    -- ID de la habitación
    floor INT NOT NULL,                      -- Piso donde ocurrió el kill
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_kills (user_id, killed_at),
    INDEX idx_run_kills (run_id),
    INDEX idx_combat_analytics (enemy_type, floor),
    INDEX idx_run_number_kills (user_id, run_number)
);
```

### 1.2 Tabla `boss_kills`

**Propósito:** Registra asesinatos de jefes con datos adicionales de duración de combate.

```sql
CREATE TABLE boss_kills (
    boss_kill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    run_number INT NOT NULL,
    boss_type ENUM('dragon') NOT NULL DEFAULT 'dragon',  -- Tipo de jefe
    floor INT NOT NULL,
    fight_duration_seconds INT DEFAULT 0,    -- Duración del combate
    player_hp_remaining INT DEFAULT 0,       -- HP restante del jugador
    killed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 Vistas de Analytics

#### `vw_combat_log` - Registro de combate
```sql
CREATE VIEW vw_combat_log AS
SELECT 
    user_id as hunter,
    run_id as session,
    run_number,
    enemy_type as target_type,
    room_id as battle_location,
    floor as battle_level,
    killed_at as elimination_time
FROM enemy_kills
ORDER BY killed_at DESC;
```

#### `vw_boss_victories` - Victorias contra jefes
```sql
CREATE VIEW vw_boss_victories AS
SELECT 
    user_id as champion,
    run_id as session,
    run_number,
    boss_type as defeated_boss,
    floor as victory_level,
    fight_duration_seconds as battle_duration,
    player_hp_remaining as surviving_health,
    killed_at as victory_time
FROM boss_kills
ORDER BY killed_at DESC;
```

### 1.4 Tipos de Enemigos en Base de Datos

- **`'common'`**: Enemigos básicos (GoblinDagger, enemigos cuerpo a cuerpo)
- **`'rare'`**: Enemigos especiales (GoblinArcher, enemigos a distancia)
- **`'dragon'`**: Jefe tipo dragón (único tipo de jefe actual)

---

## 🔗 2. API

### 2.1 Endpoints de Enemigos

#### `POST /api/runs/:runId/enemy-kill`
**Propósito:** Registra el asesinato de un enemigo.

**Request Body:**
```json
{
    "userId": 123,
    "enemyType": "common",  // 'common' o 'rare'
    "roomId": 5,
    "floor": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Enemy kill registered"
}
```

#### `POST /api/runs/:runId/boss-kill`
**Propósito:** Registra el asesinato de un jefe.

**Request Body:**
```json
{
    "userId": 123,
    "bossType": "dragon",
    "floor": 1,
    "fightDuration": 45,    // segundos
    "playerHpRemaining": 75
}
```

### 2.2 Lógica de la API

```javascript
// POST /api/runs/:runId/enemy-kill
app.post('/api/runs/:runId/enemy-kill', async (req, res) => {
    const { runId } = req.params;
    const { userId, enemyType, roomId, floor } = req.body;
    
    // Validar tipo de enemigo
    if (!['common', 'rare'].includes(enemyType)) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid enemy type' 
        });
    }
    
    // Obtener run_number
    const [runData] = await connection.execute(
        'SELECT run_number FROM run_history WHERE run_id = ?',
        [runId]
    );
    
    const runNumber = runData.length > 0 ? runData[0].run_number : 1;
    
    // Registrar kill
    await connection.execute(
        'INSERT INTO enemy_kills (user_id, run_id, run_number, enemy_type, room_id, floor) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, runId, runNumber, enemyType, roomId, floor]
    );
    
    res.status(201).json({
        success: true,
        message: 'Enemy kill registered'
    });
});
```

### 2.3 Triggers de Base de Datos

#### Actualizar estadísticas al completar run
```sql
DELIMITER //
CREATE TRIGGER tr_update_player_stats_after_run
AFTER UPDATE ON run_history
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        -- Actualizar total_kills en player_stats
        UPDATE player_stats 
        SET total_kills = total_kills + NEW.total_kills,
            total_bosses_killed = total_bosses_killed + NEW.bosses_killed
        WHERE user_id = NEW.user_id;
    END IF;
END//
DELIMITER ;
```

---

## 🎮 3. FRONTEND

### 3.1 Arquitectura del Sistema de Enemigos

```
Enemy (Base Class)
├── GoblinDagger (Melee Enemy)
├── GoblinArcher (Ranged Enemy)
└── Boss (Base Boss Class)
    └── DragonBoss
```

### 3.2 Clase Base `Enemy`

**Ubicación:** `src/classes/entities/Enemy.js`

#### Propiedades Principales
```javascript
export class Enemy extends AnimatedObject {
    constructor(position, width, height, color, sheetCols, type, movementSpeed, baseDamage, maxHealth, enemyTypeName) {
        // Core stats
        this.maxHealth = maxHealth;
        this.health = this.maxHealth;
        this.movementSpeed = movementSpeed;
        this.baseDamage = baseDamage;
        this.attackRange = 50;
        this.attackCooldown = 0;
        this.attackDuration = 500;

        // State
        this.state = "idle"; // idle, chasing, attacking, dead
        this.target = null;
        this.velocity = new Vec(0, 0);
        this.type = type;
        this.enemyTypeName = enemyTypeName || type; // Para mapeo backend
        this.currentDirection = "down";
        this.isAttacking = false;
        this.currentRoom = null; // Referencia a la habitación actual
    }
}
```

#### Estados del Enemigo
- **`"idle"`**: Enemigo inactivo
- **`"chasing"`**: Persiguiendo al jugador
- **`"attacking"`**: Realizando ataque
- **`"dead"`**: Enemigo muerto

#### Métodos Principales

##### `takeDamage(amount)`
```javascript
takeDamage(amount) {
    if (this.state === "dead") return;

    this.health = Math.max(0, this.health - amount);
    
    if (this.health <= 0) {
        this.die();
    }
}
```

##### `die()`
```javascript
die() {
    this.state = "dead";
    
    // Tracking global de kills
    if (window.game && typeof window.game.trackKill === 'function') {
        window.game.trackKill();
    }

    // Registrar kill con backend (no bloqueante)
    this.registerKill().catch(error => {
        console.error('Failed to register enemy kill:', error);
    });

    // Actualizar estado de la habitación
    if (this.currentRoom) {
        if (window.game && window.game.floorGenerator) {
            window.game.floorGenerator.updateRoomState(undefined, this.currentRoom);
        }
    }
}
```

##### `registerKill()` - Registro Backend
```javascript
async registerKill() {
    try {
        // Obtener datos necesarios
        const userId = localStorage.getItem('currentUserId');
        const runId = localStorage.getItem('currentRunId');
        const testMode = localStorage.getItem('testMode') === 'true';
        
        if (!userId || !runId) {
            if (!testMode) {
                console.log('Kill tracking: Requires active session');
            }
            return false;
        }

        // Obtener ubicación actual
        const roomId = window.game?.floorGenerator?.getCurrentRoomId();
        const floor = window.game?.floorGenerator?.getCurrentFloor();
        
        // Mapear tipos de enemigos a categorías backend
        let enemyType = 'common'; // Por defecto
        
        if (this.enemyTypeName === 'goblin_archer' || 
            this.enemyTypeName === 'GoblinArcher' ||
            this.enemyTypeName.toLowerCase().includes('archer')) {
            enemyType = 'rare';
        }

        // Llamar a la API
        await registerEnemyKill(runId, {
            userId: parseInt(userId),
            enemyType,
            roomId,
            floor
        });

        return true;
    } catch (error) {
        console.error('Enemy kill registration failed:', error);
        return false;
    }
}
```

##### Sistema de Proyectiles
```javascript
fireProjectile(target) {
    if (this.state === "dead" || !target) return;

    this.initializeProjectiles();

    // Calcular posición del objetivo
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
        targetHitbox.x + targetHitbox.width / 2,
        targetHitbox.y + targetHitbox.height / 2
    );

    // Posición inicial del proyectil
    const startPosition = new Vec(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
    );

    // Vector de dirección
    const direction = targetCenter.minus(startPosition).normalize();

    // Crear proyectil
    const projectile = {
        position: new Vec(startPosition.x, startPosition.y),
        velocity: direction.times(this.projectileSpeed),
        damage: this.baseDamage,
        radius: 5,
        isActive: true,
        lifetime: 5000,
        timeAlive: 0
    };

    this.projectiles.push(projectile);
}
```

### 3.3 Tipos Específicos de Enemigos

#### GoblinDagger (Enemigo Cuerpo a Cuerpo)
**Ubicación:** `src/classes/enemies/floor1/GoblinDagger.js`

```javascript
export class GoblinDagger extends Enemy {
    constructor(position) {
        const config = ENEMY_CONSTANTS.GOBLIN_DAGGER;
        
        super(
            position,
            config.size.width,     // 32x32
            config.size.height,    
            "red",
            4,
            "goblin_dagger",      // tipo frontend
            config.speed,         // 70% velocidad del jugador
            config.damage,        // 10 damage
            config.health,        // 20 HP
            "goblin"              // nombre para backend (maps to 'common')
        );

        this.attackRange = config.attackRange;  // 32 pixels
        this.attackDuration = config.attackCooldown; // 1000ms
    }

    // Comportamiento agresivo de persecución
    moveTo(targetPosition) {
        if (this.state === "dead") return;

        const direction = targetPosition.minus(this.position);
        this.state = "chasing";
        this.velocity = direction.normalize().times(this.movementSpeed);
        
        const newPosition = this.position.plus(this.velocity);
        this.moveToPosition(newPosition);
    }
}
```

**Características:**
- **Tipo Backend:** `'common'`
- **Comportamiento:** Persigue agresivamente al jugador
- **Ataque:** Cuerpo a cuerpo, rango de 32 pixels
- **Estadísticas:** 20 HP, 10 damage, velocidad media

#### GoblinArcher (Enemigo a Distancia)
**Ubicación:** `src/classes/enemies/floor1/GoblinArcher.js`

```javascript
export class GoblinArcher extends Enemy {
    constructor(position) {
        const config = ENEMY_CONSTANTS.GOBLIN_ARCHER;
        
        super(
            position,
            config.size.width,
            config.size.height,
            "red",
            4,
            "goblin_archer",      // tipo frontend
            config.speed,         // 0 (estático)
            config.damage,        // 15 damage
            config.health,        // 30 HP
            "goblin_archer"       // nombre para backend (maps to 'rare')
        );

        this.attackRange = config.attackRange;     // 200 pixels
        this.projectileSpeed = config.projectileSpeed; // 300
        this.retreatDistance = config.retreatDistance; // 80
        
        this.initializeProjectiles();
    }

    // Comportamiento estático
    moveTo(targetPosition) {
        this.velocity = new Vec(0, 0);
        this.state = "idle";
    }

    // Ataque con proyectiles
    attack(target) {
        if (this.state === "dead" || this.attackCooldown > 0) return;

        const distance = this.calculateDistanceTo(target);
        if (distance <= this.attackRange) {
            this.isAttacking = true;
            this.attackCooldown = this.attackDuration;
            this.fireProjectile(target);
        }
    }
}
```

**Características:**
- **Tipo Backend:** `'rare'`
- **Comportamiento:** Estático, ataca desde la distancia
- **Ataque:** Proyectiles, rango de 200 pixels
- **Estadísticas:** 30 HP, 15 damage, velocidad 0

### 3.4 Constantes de Configuración

**Ubicación:** `src/constants/gameConstants.js`

```javascript
export const ENEMY_CONSTANTS = {
    // Goblin Dagger
    GOBLIN_DAGGER: {
        size: { width: 32, height: 32 },
        health: 20,
        damage: 10,
        speed: PLAYER_CONSTANTS.BASE_SPEED * 0.7, // 70% velocidad jugador
        attackRange: 32,
        attackCooldown: 1000,
    },

    // Goblin Archer
    GOBLIN_ARCHER: {
        size: { width: 32, height: 32 },
        health: 30,
        damage: 15,
        speed: 0, // Enemigo estático
        attackRange: 200,
        attackCooldown: 2000,
        projectileSpeed: 300,
        retreatDistance: 80,
    },
};
```

### 3.5 Sistema de Mapeo de Enemigos

**Ubicación:** `src/utils/enemyMapping.js`

```javascript
class EnemyMappingService {
    constructor() {
        this.enemyTypeMap = {
            // Floor 1 enemies
            'GoblinDagger': 1,
            'goblin_dagger': 1,
            'goblin': 1,
            'GoblinArcher': 2,
            'goblin_archer': 2,
            'DragonBoss': 3,
            'dragon_boss': 3,
            
            // Fallbacks genéricos
            'enemy': 1,
            'boss': 3,
            'combat': 1
        };
    }

    getEnemyId(enemyTypeName) {
        const normalizedName = enemyTypeName.trim();
        
        // Buscar coincidencia exacta
        let enemyId = this.enemyTypeMap[normalizedName];
        
        // Buscar versión en minúsculas
        if (!enemyId) {
            enemyId = this.enemyTypeMap[normalizedName.toLowerCase()];
        }
        
        // Buscar versión snake_case
        if (!enemyId) {
            const snakeCase = normalizedName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
            enemyId = this.enemyTypeMap[snakeCase];
        }

        return enemyId || this.getFallbackEnemyId(normalizedName);
    }
}
```

### 3.6 Generación de Enemigos en Habitaciones

**Ubicación:** `src/classes/rooms/Room.js`

#### Generación Procedural
```javascript
generateEnemies() {
    // Número aleatorio de enemigos (configurado en constantes)
    const enemyCount = Math.floor(Math.random() * (ROOM_CONSTANTS.MAX_ENEMIES - ROOM_CONSTANTS.MIN_ENEMIES + 1)) + ROOM_CONSTANTS.MIN_ENEMIES;

    // Proporción aleatoria de enemigos comunes vs raros
    const commonPercentage = Math.random() * (ROOM_CONSTANTS.COMMON_ENEMY_RATIO.max - ROOM_CONSTANTS.COMMON_ENEMY_RATIO.min) + ROOM_CONSTANTS.COMMON_ENEMY_RATIO.min;
    const commonCount = Math.floor(enemyCount * commonPercentage);
    const rareCount = enemyCount - commonCount;

    // Zona segura donde no aparecen enemigos
    const safeZone = {
        x: 0,
        y: variables.canvasHeight / 2 - ROOM_CONSTANTS.SAFE_ZONE_SIZE.height / 2,
        width: ROOM_CONSTANTS.SAFE_ZONE_SIZE.width,
        height: ROOM_CONSTANTS.SAFE_ZONE_SIZE.height,
    };

    // Generar enemigos comunes (mitad izquierda)
    for (let i = 0; i < commonCount; i++) {
        const position = this.getValidEnemyPosition(true, safeZone);
        if (position) {
            const enemy = new GoblinDagger(position);
            enemy.setCurrentRoom(this);
            this.objects.enemies.push(enemy);
        }
    }

    // Generar enemigos raros (mitad derecha)
    for (let i = 0; i < rareCount; i++) {
        const position = this.getValidEnemyPosition(false, safeZone);
        if (position) {
            const enemy = new GoblinArcher(position);
            enemy.setCurrentRoom(this);
            this.objects.enemies.push(enemy);
        }
    }
}
```

#### Validación de Posiciones
```javascript
getValidEnemyPosition(isCommon, safeZone) {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x, y;
        
        if (isCommon) {
            // Enemigos comunes: mitad izquierda
            x = Math.random() * (variables.canvasWidth / 2);
        } else {
            // Enemigos raros: mitad derecha
            x = (variables.canvasWidth / 2) + Math.random() * (variables.canvasWidth / 2);
        }
        
        y = Math.random() * variables.canvasHeight;
        
        const position = new Vec(x, y);
        
        // Verificar que no esté en zona segura ni colisione con paredes
        if (!this.isInSafeZone(position, safeZone) && !this.isPositionBlocked(position)) {
            return position;
        }
    }
    
    return null; // No se encontró posición válida
}
```

### 3.7 Integración con FloorGenerator

**Ubicación:** `src/classes/game/FloorGenerator.js`

```javascript
export class FloorGenerator {
    getCurrentRoom() {
        // ... lógica de habitación ...
        
        if (roomType === 'boss') {
            let boss;
            if (this.floorCount === 1) {
                boss = new DragonBoss(new Vec(380, 75));
            } else if (this.floorCount === 2) {
                boss = new Supersoldier(new Vec(380, 75));
            } else {
                boss = new DragonBoss(new Vec(380, 75)); // Fallback
            }
            
            if (boss) {
                room.objects.enemies.push(boss);
            }
        }

        // Guardar estado de la habitación
        this.roomStates[roomIndex] = room;
        this.visitedRooms.add(roomIndex);

        return room;
    }
}
```

---

## 🔄 4. FLUJO COMPLETO DEL SISTEMA

### 4.1 Ciclo de Vida de un Enemigo

1. **Generación:**
   - `Room.generateEnemies()` crea enemigos según configuración
   - Se asignan posiciones válidas evitando zona segura
   - Se establece referencia a la habitación actual

2. **Comportamiento:**
   - **GoblinDagger:** Persigue agresivamente al jugador
   - **GoblinArcher:** Permanece estático, dispara proyectiles

3. **Combate:**
   - Enemigo detecta jugador en rango de ataque
   - Realiza ataque (cuerpo a cuerpo o proyectil)
   - Cooldown de ataque según configuración

4. **Muerte:**
   - `takeDamage()` reduce HP
   - `die()` cambia estado a "dead"
   - `registerKill()` envía datos al backend
   - Actualiza estado de habitación

### 4.2 Tracking de Estadísticas

1. **Frontend → API:**
   ```javascript
   await registerEnemyKill(runId, {
       userId: 123,
       enemyType: 'common', // o 'rare'
       roomId: 5,
       floor: 1
   });
   ```

2. **API → Base de Datos:**
   ```sql
   INSERT INTO enemy_kills (user_id, run_id, run_number, enemy_type, room_id, floor) 
   VALUES (123, 456, 15, 'common', 5, 1);
   ```

3. **Analytics:**
   - Vista `vw_combat_log` para consultas detalladas
   - Triggers actualizan `player_stats.total_kills`
   - Dashboard admin muestra estadísticas en tiempo real

### 4.3 Diferencias entre Tipos de Enemigos

| Aspecto | GoblinDagger (Common) | GoblinArcher (Rare) |
|---------|----------------------|---------------------|
| **HP** | 20 | 30 |
| **Damage** | 10 | 15 |
| **Speed** | 70% jugador | 0 (estático) |
| **Attack Range** | 32 pixels | 200 pixels |
| **Attack Type** | Cuerpo a cuerpo | Proyectiles |
| **Cooldown** | 1000ms | 2000ms |
| **Behavior** | Persigue agresivamente | Estático, dispara |
| **Backend Type** | `'common'` | `'rare'` |
| **Spawn Location** | Mitad izquierda | Mitad derecha |

---

## 📊 5. ANÁLISIS Y MÉTRICAS

### 5.1 Métricas Rastreadas

- **Kills por tipo:** Común vs Raro
- **Ubicación:** Room ID y Floor
- **Timing:** Timestamp exacto del kill
- **Contexto:** Run ID y número de run
- **Rendimiento:** Total kills por jugador

### 5.2 Vistas de Analytics Disponibles

- **`vw_combat_log`**: Log detallado de todos los combates
- **`vw_boss_victories`**: Victorias contra jefes
- **`vw_player_progression`**: Progreso del jugador incluyendo kills
- **Dashboard Admin**: Métricas en tiempo real

### 5.3 Optimizaciones de Rendimiento

- **Índices de base de datos** para consultas rápidas
- **Registro no bloqueante** de kills
- **Pooling de objetos** para proyectiles
- **Detección de colisión optimizada**

---

## 🛠️ 6. CONFIGURACIÓN Y PERSONALIZACIÓN

### 6.1 Modificar Estadísticas de Enemigos

Editar `src/constants/gameConstants.js`:

```javascript
export const ENEMY_CONSTANTS = {
    GOBLIN_DAGGER: {
        health: 25,    // Incrementar HP
        damage: 12,    // Incrementar damage
        speed: PLAYER_CONSTANTS.BASE_SPEED * 0.8, // Más rápido
    }
};
```

### 6.2 Agregar Nuevo Tipo de Enemigo

1. **Crear clase en `src/classes/enemies/`:**
```javascript
export class NewEnemy extends Enemy {
    constructor(position) {
        super(position, width, height, color, sheetCols, "new_enemy", speed, damage, health, "new_enemy");
    }
}
```

2. **Agregar constantes:**
```javascript
export const ENEMY_CONSTANTS = {
    NEW_ENEMY: {
        size: { width: 32, height: 32 },
        health: 40,
        damage: 20,
        // ... otras propiedades
    }
};
```

3. **Actualizar mapeo backend:**
```javascript
// En enemyMapping.js
this.enemyTypeMap = {
    'NewEnemy': 4,
    'new_enemy': 4,
    // ...
};
```

4. **Actualizar generación en Room.js:**
```javascript
// Agregar lógica para instanciar NewEnemy
const enemy = new NewEnemy(position);
```

### 6.3 Modificar Comportamiento de IA

Override métodos en clases específicas:

```javascript
export class CustomEnemy extends Enemy {
    moveTo(targetPosition) {
        // Comportamiento personalizado
        // Ejemplo: movimiento circular
        this.angle = (this.angle || 0) + 0.02;
        const radius = 100;
        const newPos = new Vec(
            this.originalPosition.x + Math.cos(this.angle) * radius,
            this.originalPosition.y + Math.sin(this.angle) * radius
        );
        this.moveToPosition(newPos);
    }
}
```

---

## 🚀 7. CONCLUSIÓN

El sistema de enemigos de Shattered Timeline es un sistema robusto y escalable que integra:

- **Base de datos optimizada** con tracking completo
- **API RESTful** para comunicación eficiente
- **Frontend orientado a objetos** con herencia y polimorfismo
- **Analytics en tiempo real** para métricas de juego
- **Configuración flexible** para balance de juego

El sistema permite fácil expansión con nuevos tipos de enemigos y comportamientos, manteniendo la consistencia en el tracking de datos y las métricas de rendimiento. 