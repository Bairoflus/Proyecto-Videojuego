# ANÁLISIS DE COMPATIBILIDAD BACKEND-FRONTEND
## Project Shattered Timeline

### 📊 **RESUMEN EJECUTIVO**

Este documento presenta un análisis detallado de la compatibilidad entre el backend API (`/videogame/api/app.js`) y el frontend (`/videogame/src/`) del proyecto, identificando **incompatibilidades críticas** que impiden la integración correcta y proponiendo soluciones viables.

**Estado Actual**: ❌ **INCOMPATIBLE** - Requiere intervención inmediata  
**Nivel de Riesgo**: 🔴 **CRÍTICO** - Sistema no funcional sin estos ajustes

---

## 🔍 **ANÁLISIS DETALLADO DE INCOMPATIBILIDADES**

### 1. **PROBLEMA CRÍTICO: Desconexión Room Management**

#### **Descripción del Problema**
El frontend y backend tienen conceptos completamente diferentes de "rooms":

**Frontend (Actual)**:
```javascript
// videogame/src/classes/rooms/combatRooms.js
export const COMBAT_ROOMS = [
  `WWWWWWWWWWWWWWWWWWWWWWWWW
   W..........WWW..........W
   // ... layout ASCII como string
  `
];
```

**Backend (Espera)**:
```javascript
// videogame/api/app.js - Endpoints que validan roomId
const [rooms] = await connection.execute(
    'SELECT room_id FROM rooms WHERE room_id = ?',
    [roomId]
);
```

#### **Impacto**
- **TODOS los endpoints que requieren `roomId` fallarán**:
  - `POST /api/runs/:runId/save-state`
  - `POST /api/runs/:runId/enemy-kill`
  - `POST /api/runs/:runId/chest-event`
  - `POST /api/runs/:runId/shop-purchase`
  - `POST /api/runs/:runId/boss-encounter`
- Error constante: **"Room not found"** (404)
- Frontend no puede proporcionar room IDs válidos

### 2. **PROBLEMA CRÍTICO: Base de Datos Vacía**

#### **Descripción del Problema**
El esquema de base de datos está creado pero **completamente vacío**:

```sql
-- videogame/database/projectshatteredtimeline.sql
-- ❌ NO CONTIENE INSERT STATEMENTS
CREATE TABLE rooms (...);  -- TABLA VACÍA
CREATE TABLE enemy_types (...);  -- TABLA VACÍA  
CREATE TABLE boss_details (...);  -- TABLA VACÍA
CREATE TABLE item_types (...);  -- TABLA VACÍA
```

#### **Impacto**
- `GET /api/rooms` → devuelve `[]` (array vacío)
- `GET /api/enemies` → devuelve `[]` (array vacío)
- `GET /api/bosses` → devuelve `[]` (array vacío)
- `GET /api/lookups` → devuelve objetos con arrays vacíos
- **Todas las validaciones de foreign keys fallan**

### 3. **PROBLEMA CRÍTICO: Desconexión Session Management**

#### **Descripción del Problema**
Mismatch en el manejo de sesiones:

**Frontend almacena**:
```javascript
// videogame/src/pages/js/login.js
localStorage.setItem('sessionToken', result.sessionToken);  // STRING (UUID)
```

**Backend requiere**:
```javascript
// videogame/api/app.js - save-state endpoint
const { userId, sessionId, roomId, ... } = req.body;  // sessionId = INT
```

#### **Impacto**
- Frontend no tiene acceso al `sessionId` numérico
- Endpoint `save-state` falla siempre por falta de `sessionId`
- No hay manera de obtener el `sessionId` desde `sessionToken`

### 4. **PROBLEMA ALTO: Falta de Integración Enemy Types**

#### **Descripción del Problema**
El frontend usa enemies genéricos, el backend espera `enemyId` específicos:

**Frontend**:
```javascript
// videogame/src/classes/entities/Enemy.js
// No hay campo enemyTypeId o enemyId
```

**Backend**:
```javascript
// enemy-kill endpoint requiere
const { userId, enemyId, roomId } = req.body;  // enemyId específico
```

#### **Impacto**
- `registerEnemyKill()` no puede ser llamado correctamente
- Tracking de kills no funciona
- Estadísticas de combat no se registran

### 5. **PROBLEMA MEDIO: Save States No Implementados**

#### **Descripción del Problema**
El frontend nunca llama al sistema de save states:

**Actual**:
```javascript
// videogame/src/classes/game/Game.js
// ❌ No hay llamadas a saveRunState() durante gameplay
```

**Esperado**:
```javascript
// Debería llamar en transiciones de room
await saveRunState(runId, stateData);
```

#### **Impacto**
- Sistema de autosave no funciona
- Pérdida de progreso no se previene
- Tabla `save_states` permanece vacía

---

## 🛠️ **PROPUESTA DE SOLUCIÓN INTEGRADA**

### **FASE 1: FOUNDATION - Datos Básicos** ⏱️ **2-3 horas**

#### **Paso 1.1: Crear Datos de Muestra para Base de Datos**
```bash
# Crear archivo de datos de muestra
touch videogame/database/sample_data.sql
```

**Contenido de `sample_data.sql`**:
```sql
-- Lookup tables básicos
INSERT INTO room_types (room_type) VALUES 
('entrance'), ('combat'), ('shop'), ('boss');

INSERT INTO item_types (item_type) VALUES 
('armor'), ('consumable'), ('health_potion'), ('upgrade'), ('weapon');

INSERT INTO weapon_slots (slot_type) VALUES 
('melee'), ('primary'), ('secondary'), ('special'), ('throwable');

INSERT INTO upgrade_types (upgrade_type) VALUES 
('critical_chance'), ('damage_boost'), ('gold_multiplier'), 
('max_health'), ('max_stamina'), ('speed_boost');

INSERT INTO boss_results (result_code) VALUES 
('defeat'), ('escape'), ('timeout'), ('victory');

-- Rooms que corresponden a los layouts del frontend
INSERT INTO rooms (floor, name, room_type, sequence_order) VALUES 
(1, 'Combat Room 1', 'combat', 1),
(1, 'Combat Room 2', 'combat', 2),
(1, 'Combat Room 3', 'combat', 3),
(1, 'Combat Room 4', 'combat', 4),
(1, 'Shop Room', 'shop', 5),
(1, 'Boss Room', 'boss', 6);

-- Enemy types básicos
INSERT INTO enemy_types (enemy_id, name, floor, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range) VALUES
(1, 'Basic Goblin', 1, 50, 10, 50, 2, 40),
(2, 'Strong Orc', 1, 100, 20, 40, 3, 45),
(3, 'Fast Skeleton', 1, 30, 15, 80, 1, 35),
(100, 'Shadow Lord', 1, 1000, 100, 30, 2, 50),
(101, 'Fire Dragon', 1, 2000, 150, 40, 3, 70),
(102, 'Ice Queen', 1, 1500, 120, 35, 2, 60);

-- Boss details
INSERT INTO boss_details (enemy_id, max_hp, description) VALUES
(100, 1000, 'Dark ruler of the shadow realm'),
(101, 2000, 'Ancient fire-breathing dragon'),
(102, 1500, 'Mystical ice queen with freezing powers');

-- Boss moves
INSERT INTO boss_moves (enemy_id, name, description, phase) VALUES
(100, 'Shadow Strike', 'Quick shadow attack', 1),
(100, 'Dark Explosion', 'Area damage attack', 2),
(100, 'Shadow Realm', 'Ultimate shadow ability', 3),
(101, 'Fire Breath', 'Breath of fire', 1),
(101, 'Flame Burst', 'Explosive fire attack', 2),
(101, 'Inferno', 'Ultimate fire ability', 3),
(102, 'Ice Shard', 'Sharp ice projectile', 1),
(102, 'Freeze Blast', 'Area freeze attack', 2),
(102, 'Absolute Zero', 'Ultimate ice ability', 3);
```

#### **Paso 1.2: Aplicar Datos a Base de Datos**
```bash
# Aplicar datos de muestra
mysql -u tc2005b -p ProjectShatteredTimeline < videogame/database/sample_data.sql
```

### **FASE 2: SESSION MANAGEMENT FIX** ⏱️ **1-2 horas**

#### **Paso 2.1: Modificar Backend Login Response**
```javascript
// videogame/api/app.js - línea ~142 (aproximada)
// CAMBIAR DE:
res.status(200).json({
    userId: user.user_id,
    sessionToken: sessions[0].session_token
});

// CAMBIAR A:
res.status(200).json({
    userId: user.user_id,
    sessionToken: sessions[0].session_token,
    sessionId: sessionResult.insertId  // AGREGAR ESTA LÍNEA
});
```

#### **Paso 2.2: Modificar Frontend Login**
```javascript
// videogame/src/pages/js/login.js - línea ~32 (aproximada)
// AGREGAR después de localStorage.setItem('currentUserId', result.userId):
localStorage.setItem('currentSessionId', result.sessionId);
```

### **FASE 3: ROOM ID MAPPING** ⏱️ **2-3 horas**

#### **Paso 3.1: Crear Room Mapping Service**
```javascript
// videogame/src/utils/roomMapping.js - ARCHIVO NUEVO
import { getRooms } from './api.js';

class RoomMappingService {
    constructor() {
        this.roomIdMap = new Map(); // layout_index -> room_id
        this.roomDataMap = new Map(); // room_id -> room_data
        this.initialized = false;
    }

    async initialize() {
        try {
            const rooms = await getRooms();
            
            // Mapear rooms por tipo y orden
            const combatRooms = rooms.filter(r => r.room_type === 'combat').sort((a, b) => a.sequence_order - b.sequence_order);
            const shopRoom = rooms.find(r => r.room_type === 'shop');
            const bossRoom = rooms.find(r => r.room_type === 'boss');
            
            // Mapear índices de COMBAT_ROOMS a room_ids
            combatRooms.forEach((room, index) => {
                this.roomIdMap.set(index, room.room_id);
                this.roomDataMap.set(room.room_id, room);
            });
            
            // Mapear shop y boss rooms
            if (shopRoom) {
                this.roomIdMap.set('shop', shopRoom.room_id);
                this.roomDataMap.set(shopRoom.room_id, shopRoom);
            }
            if (bossRoom) {
                this.roomIdMap.set('boss', bossRoom.room_id);
                this.roomDataMap.set(bossRoom.room_id, bossRoom);
            }
            
            this.initialized = true;
            console.log('Room mapping initialized with', rooms.length, 'rooms');
        } catch (error) {
            console.error('Failed to initialize room mapping:', error);
        }
    }

    getRoomId(layoutIndex, roomType = 'combat') {
        if (!this.initialized) {
            console.warn('Room mapping not initialized');
            return 1; // fallback
        }
        
        if (roomType === 'shop') return this.roomIdMap.get('shop') || 5;
        if (roomType === 'boss') return this.roomIdMap.get('boss') || 6;
        
        return this.roomIdMap.get(layoutIndex) || 1;
    }

    getRoomData(roomId) {
        return this.roomDataMap.get(roomId);
    }
}

export const roomMapping = new RoomMappingService();
```

#### **Paso 3.2: Integrar Room Mapping en FloorGenerator**
```javascript
// videogame/src/classes/game/FloorGenerator.js - MODIFICAR
import { roomMapping } from '../../utils/roomMapping.js';

export class FloorGenerator {
    constructor() {
        // ... código existente ...
        this.initializeRoomMapping();
    }

    async initializeRoomMapping() {
        await roomMapping.initialize();
    }

    // AGREGAR MÉTODO NUEVO
    getCurrentRoomId() {
        const roomType = this.getCurrentRoomType();
        
        if (roomType === 'shop') {
            return roomMapping.getRoomId(null, 'shop');
        } else if (roomType === 'boss') {
            return roomMapping.getRoomId(null, 'boss');
        } else {
            // Combat room - usar índice de room dentro de combat rooms
            const combatRoomIndex = this.currentRoomIndex; // 0-3 para combat rooms
            return roomMapping.getRoomId(combatRoomIndex, 'combat');
        }
    }
}
```

### **FASE 4: SAVE STATES INTEGRATION** ⏱️ **1-2 horas**

#### **Paso 4.1: Implementar Auto-Save en Game Loop**
```javascript
// videogame/src/classes/game/Game.js - AGREGAR MÉTODOS
import { saveRunState } from '../../utils/api.js';

export class Game {
    // ... código existente ...

    // AGREGAR MÉTODO NUEVO
    async saveCurrentState() {
        try {
            const currentRunId = localStorage.getItem('currentRunId');
            const currentUserId = localStorage.getItem('currentUserId');
            const currentSessionId = localStorage.getItem('currentSessionId');
            
            if (currentRunId && currentUserId && currentSessionId) {
                const roomId = this.floorGenerator.getCurrentRoomId();
                
                const stateData = {
                    userId: parseInt(currentUserId),
                    sessionId: parseInt(currentSessionId),
                    roomId: roomId,
                    currentHp: this.player.health,
                    currentStamina: this.player.stamina,
                    gold: this.player.gold
                };
                
                const result = await saveRunState(currentRunId, stateData);
                console.log('State saved successfully:', result);
            }
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    // MODIFICAR MÉTODO EXISTENTE
    async handleRoomTransition(direction) {
        // ... código existente ANTES de la transición ...
        
        // AGREGAR: Guardar estado antes de transición
        if (this.currentRoom.canTransition()) {
            await this.saveCurrentState();
            
            // ... resto del código existente de transición ...
        }
    }
}
```

### **FASE 5: ENEMY INTEGRATION** ⏱️ **2 horas**

#### **Paso 5.1: Mapear Enemy Types**
```javascript
// videogame/src/utils/enemyMapping.js - ARCHIVO NUEVO
import { getEnemies } from './api.js';

class EnemyMappingService {
    constructor() {
        this.enemyTypeMap = new Map(); // enemy_name -> enemy_id
        this.initialized = false;
    }

    async initialize() {
        try {
            const enemies = await getEnemies();
            
            enemies.forEach(enemy => {
                this.enemyTypeMap.set(enemy.name.toLowerCase(), enemy.enemy_id);
            });
            
            this.initialized = true;
            console.log('Enemy mapping initialized with', enemies.length, 'enemy types');
        } catch (error) {
            console.error('Failed to initialize enemy mapping:', error);
        }
    }

    getEnemyId(enemyName) {
        if (!this.initialized) {
            console.warn('Enemy mapping not initialized');
            return 1; // fallback
        }
        
        return this.enemyTypeMap.get(enemyName.toLowerCase()) || 1;
    }
}

export const enemyMapping = new EnemyMappingService();
```

#### **Paso 5.2: Modificar Enemy Class**
```javascript
// videogame/src/classes/entities/Enemy.js - MODIFICAR
import { registerEnemyKill } from '../../utils/api.js';
import { enemyMapping } from '../../utils/enemyMapping.js';

export class Enemy {
    constructor(...args) {
        // ... código existente ...
        this.enemyTypeName = 'Basic Goblin'; // AGREGAR: nombre del tipo de enemy
    }

    // MODIFICAR MÉTODO EXISTENTE
    async die() {
        // ... código existente ...
        
        // AGREGAR: Registrar kill en backend
        await this.registerKill();
    }

    // AGREGAR MÉTODO NUEVO
    async registerKill() {
        try {
            const currentRunId = localStorage.getItem('currentRunId');
            const currentUserId = localStorage.getItem('currentUserId');
            
            if (currentRunId && currentUserId && window.game) {
                const roomId = window.game.floorGenerator.getCurrentRoomId();
                const enemyId = enemyMapping.getEnemyId(this.enemyTypeName);
                
                await registerEnemyKill(currentRunId, {
                    userId: parseInt(currentUserId),
                    enemyId: enemyId,
                    roomId: roomId
                });
                
                // Track in game stats
                if (window.game.trackKill) {
                    window.game.trackKill();
                }
                
                console.log('Enemy kill registered successfully');
            }
        } catch (error) {
            console.error('Failed to register enemy kill:', error);
            // No bloquear el juego si falla el registro
        }
    }
}
```

### **FASE 6: INITIALIZATION ORCHESTRATION** ⏱️ **1 hora**

#### **Paso 6.1: Coordinar Inicialización**
```javascript
// videogame/src/classes/game/Game.js - MODIFICAR CONSTRUCTOR
import { roomMapping } from '../../utils/roomMapping.js';
import { enemyMapping } from '../../utils/enemyMapping.js';

export class Game {
    constructor() {
        // ... código existente ...
        this.initializeServices();
    }

    // AGREGAR MÉTODO NUEVO
    async initializeServices() {
        console.log('Initializing backend integration services...');
        
        try {
            // Inicializar servicios de mapping
            await Promise.all([
                roomMapping.initialize(),
                enemyMapping.initialize()
            ]);
            
            console.log('All integration services initialized successfully');
            this.servicesInitialized = true;
        } catch (error) {
            console.error('Failed to initialize integration services:', error);
            this.servicesInitialized = false;
        }
    }
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Fase 1: Foundation** ✅
- [ ] Crear `videogame/database/sample_data.sql`
- [ ] Ejecutar script en base de datos
- [ ] Verificar datos con `GET /api/rooms`, `GET /api/enemies`

### **Fase 2: Session Management** ✅
- [ ] Modificar response de login en backend
- [ ] Actualizar localStorage en frontend login
- [ ] Probar flujo de login completo

### **Fase 3: Room Mapping** ✅
- [ ] Crear `videogame/src/utils/roomMapping.js`
- [ ] Integrar en `FloorGenerator.js`
- [ ] Probar `getCurrentRoomId()` en diferentes rooms

### **Fase 4: Save States** ✅
- [ ] Implementar `saveCurrentState()` en Game class
- [ ] Integrar auto-save en room transitions
- [ ] Probar con `POST /api/runs/:runId/save-state`

### **Fase 5: Enemy Integration** ✅
- [ ] Crear `videogame/src/utils/enemyMapping.js`
- [ ] Modificar Enemy class con `registerKill()`
- [ ] Probar enemy kill registration

### **Fase 6: Orchestration** ✅
- [ ] Coordinar inicialización de servicios
- [ ] Agregar error handling apropiado
- [ ] Testing end-to-end completo

---

## 🧪 **PLAN DE TESTING**

### **Test 1: Basic Data Flow**
```bash
# 1. Login y verificar sessionId almacenado
# 2. Iniciar juego y verificar room mapping
# 3. Matar enemy y verificar kill registration
# 4. Cambiar room y verificar save state
```

### **Test 2: API Integration**
```bash
# 1. GET /api/rooms - verificar rooms poblados
# 2. GET /api/enemies - verificar enemies poblados  
# 3. POST /api/runs/:runId/save-state - verificar save exitoso
# 4. POST /api/runs/:runId/enemy-kill - verificar kill exitoso
```

### **Test 3: Error Handling**
```bash
# 1. API offline - verificar fallbacks
# 2. Invalid room IDs - verificar error handling
# 3. Missing session data - verificar degradación graceful
```

---

## ⚠️ **RIESGOS Y MITIGACIONES**

### **Riesgo 1: Performance Impact**
**Problema**: Múltiples API calls en inicialización  
**Mitigación**: Cachear datos, parallel loading, fallbacks

### **Riesgo 2: Backwards Compatibility**
**Problema**: Cambios pueden romper funcionalidad existente  
**Mitigación**: Feature flags, gradual rollout, extensive testing

### **Riesgo 3: Data Consistency**
**Problema**: Frontend y backend pueden tener datos inconsistentes  
**Mitigación**: Single source of truth, validation layers

---

## 🎯 **RESULTADO ESPERADO**

Después de implementar estas fases:

1. ✅ **Frontend y backend completamente integrados**
2. ✅ **Todas las APIs funcionando correctamente**
3. ✅ **Save states automáticos funcionando**
4. ✅ **Enemy kills siendo registrados**
5. ✅ **Room transitions con IDs válidos**
6. ✅ **Sistema robusto con error handling**

**Tiempo total estimado**: **8-12 horas de desarrollo**  
**Complejidad**: **Media-Alta** (requiere coordinación backend-frontend)  
**Impacto**: **CRÍTICO** (sin esto el sistema no funciona)

---

## 📞 **PRÓXIMOS PASOS INMEDIATOS**

1. **EJECUTAR FASE 1** inmediatamente (datos de muestra)
2. **PROBAR APIs** básicas con datos poblados
3. **IMPLEMENTAR FASE 2** (session management)
4. **CONTINUAR SECUENCIALMENTE** con las demás fases

> **NOTA**: Este documento debe actualizarse conforme se implementen las soluciones para mantener track del progreso. 