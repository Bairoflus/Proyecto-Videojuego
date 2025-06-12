# Sistema de Transición de Salas - Análisis Técnico Detallado

## Introducción

El sistema de transición de salas en Shattered Timeline es un mecanismo complejo que permite al jugador moverse entre las diferentes habitaciones del juego. Este análisis examina en profundidad cómo funciona este sistema, desde la detección del jugador hasta la carga de la nueva sala.

## Arquitectura General

### Componentes Principales

1. **Game.js** - Coordinador principal de transiciones
2. **Room.js** - Validación y detección de posición del jugador
3. **FloorGenerator.js** - Gestión de pisos y habitaciones
4. **Player.js** - Entidad que trigger las transiciones

### Flujo General

```
Player en zona de transición → Room.isPlayerAtRightEdge() → Game.update() detecta → 
Game.handleRoomTransition() → FloorGenerator.nextRoom()/nextFloor() → 
Nueva habitación cargada → Player reposicionado
```

## Análisis Detallado por Componente

### 1. Room.js - Detección de Zona de Transición

#### Método `isPlayerAtRightEdge(player)`

```javascript
isPlayerAtRightEdge(player) {
    const playerHitbox = player.getHitboxBounds();
    const rightEdge = variables.canvasWidth - playerHitbox.width;

    // Primera verificación: ¿Está en la zona de transición?
    if (playerHitbox.x < rightEdge - this.transitionZone) {
        return false;
    }

    // Segunda verificación: ¿Está centrado verticalmente?
    const middleY = variables.canvasHeight / 2;
    const isAtRightEdge = playerHitbox.x >= rightEdge - this.transitionZone;
    const isAtMiddleY = Math.abs(playerHitbox.y + playerHitbox.height / 2 - middleY) < playerHitbox.height;

    return isAtRightEdge && isAtMiddleY;
}
```

**Parámetros Clave:**
- `transitionZone`: 64 píxeles (por defecto)
- Posición X: Debe estar en los últimos 64 píxeles del borde derecho
- Posición Y: Debe estar centrado verticalmente (±altura del jugador)

**Sistema de Debug Integrado:**
- Logging cada 30 frames cuando el jugador está cerca
- Detalles de posición, zona de transición y validaciones
- Identificación de fallas específicas (X/Y position)

#### Método `canTransition()`

El sistema de validación que determina si una sala permite transición:

```javascript
canTransition() {
    this.cleanEnemiesArray(); // Limpieza crítica
    
    if (this.roomType === 'boss') {
        // Lógica especial para salas de jefe
        const allEnemiesDead = aliveEnemies.length === 0;
        const bossDefeatedFlag = this.bossDefeated === true;
        return allEnemiesDead || bossDefeatedFlag;
    }
    
    if (!this.isCombatRoom) {
        return true; // Salas no combate siempre permiten transición
    }
    
    // Salas de combate: deben eliminar todos los enemigos
    const aliveEnemies = this.objects.enemies.filter(e => e !== undefined && e !== null && e.state !== 'dead');
    return aliveEnemies.length === 0;
}
```

**Tipos de Sala y Reglas:**
- **Combat**: Debe eliminar todos los enemigos
- **Shop**: Transición siempre permitida
- **Boss**: Debe derrotar al jefe O activar flag `bossDefeated`

### 2. Game.js - Coordinación de Transiciones

#### Ciclo de Detección en `update(deltaTime)`

```javascript
// Verificaciones en cada frame
const isAtRightEdge = this.currentRoom.isPlayerAtRightEdge(this.player);
const isNotTransitioning = !this.isTransitioning;
const noCooldown = this.transitionCooldown <= 0;
const canTransition = this.currentRoom.canTransition();

if (isAtRightEdge && isNotTransitioning && noCooldown && canTransition) {
    console.log("ROOM TRANSITION TRIGGERED - Player at right edge");
    this.startRoomTransition("right");
}
```

**Condiciones Requeridas (TODAS deben cumplirse):**
1. `isAtRightEdge`: Player en zona de transición
2. `isNotTransitioning`: No hay transición en progreso
3. `noCooldown`: Ha pasado el cooldown (500ms)
4. `canTransition`: La sala permite transición

#### Método `startRoomTransition(direction)`

Punto de entrada no-bloqueante:

```javascript
startRoomTransition(direction) {
    console.log("Starting room transition");

    this.handleRoomTransition(direction)
        .then(() => {
            console.log("Room transition completed successfully");
        })
        .catch((error) => {
            console.error("Error in room transition:", error);
            // Emergency cleanup
            this.isTransitioning = false;
            this.transitionCooldown = 0;
        });
}
```

**Características:**
- **No-bloqueante**: No pausa el render loop
- **Manejo de errores**: Cleanup automático en caso de fallo
- **Asíncrono**: Permite operaciones de backend sin freeze

#### Método `handleRoomTransition(direction)` - Núcleo del Sistema

```javascript
async handleRoomTransition(direction) {
    // 1. VALIDACIÓN INICIAL
    if (!this.currentRoom.canTransition()) {
        return; // Early exit si no se puede transicionar
    }

    try {
        // 2. BLOQUEO DE TRANSICIONES
        this.isTransitioning = true;
        console.log("ROOM TRANSITION LOCKED");

        // 3. LOGGING DETALLADO PRE-TRANSICIÓN
        const beforeIndex = this.floorGenerator.getCurrentRoomIndex();
        const beforeFloor = this.floorGenerator.getCurrentFloor();
        const wasInBossRoom = this.floorGenerator.isBossRoom();

        // 4. LÓGICA DE TRANSICIÓN DIFERENCIADA
        if (wasInBossRoom) {
            // TRANSICIÓN DE PISO (Boss → Siguiente Piso)
            await this.handleBossRoomTransition();
        } else {
            // TRANSICIÓN NORMAL (Sala → Siguiente Sala)
            await this.handleNormalRoomTransition();
        }

        // 5. COOLDOWN PARA PREVENIR SPAM
        this.transitionCooldown = this.transitionCooldownTime; // 500ms

    } catch (error) {
        console.error("Error during room transition:", error);
        // Recuperación de estado estable
        this.recoverFromTransitionError();
    } finally {
        // 6. CLEANUP GARANTIZADO
        this.isTransitioning = false;
        console.log("ROOM TRANSITION UNLOCKED");
    }
}
```

#### Transición de Sala Normal

```javascript
async handleNormalRoomTransition() {
    if (!this.floorGenerator.nextRoom()) {
        console.log("Room transition FAILED - Could not advance to next room");
        return;
    }

    this.currentRoom = this.floorGenerator.getCurrentRoom();
    
    // Reposicionamiento del jugador
    this.player.setCurrentRoom(this.currentRoom);
    this.player.position = this.currentRoom.getPlayerStartPosition();
    this.player.velocity = new Vec(0, 0);
    this.player.keys = [];
    
    // Sincronización de enemigos
    this.enemies = this.currentRoom.objects.enemies;
    
    // Actualización de datos de tienda
    this.configureShopGameData();
    
    // Auto-guardado
    await this.saveCurrentGameState();
}
```

#### Transición de Piso (Boss Room)

```javascript
async handleBossRoomTransition() {
    console.log("BOSS ROOM - Proceeding to next floor");
    
    // Auto-save después de completar jefe
    await this.saveCurrentGameState();
    
    // Reset de flags de jefe
    this.resetBossFlags();
    
    // Avanzar al siguiente piso
    await this.floorGenerator.nextFloor();
    
    this.currentRoom = this.floorGenerator.getCurrentRoom();
    
    if (this.currentRoom) {
        this.currentRoom.resetBossState();
        
        // Reposicionamiento completo
        this.player.setCurrentRoom(this.currentRoom);
        this.player.position = this.currentRoom.getPlayerStartPosition();
        this.player.velocity = new Vec(0, 0);
        this.player.keys = [];
        this.enemies = this.currentRoom.objects.enemies;
        
        this.configureShopGameData();
    }
}
```

### 3. FloorGenerator.js - Gestión de Pisos y Salas

#### Método `nextRoom()` - Progresión de Sala

```javascript
nextRoom() {
    const beforeIndex = this.currentRoomIndex;

    if (this.currentRoomIndex < this.currentFloor.length - 1) {
        this.currentRoomIndex++;
        
        // Validación de mapeo de Room ID
        const roomId = this.getCurrentRoomId();
        const expectedRoomId = this.getExpectedRoomId();
        
        if (roomId !== expectedRoomId) {
            console.error(`🚨 ROOM MAPPING ERROR: Got ${roomId}, expected ${expectedRoomId}`);
        }
        
        console.log(`ROOM PROGRESSION: ${beforeIndex} → ${this.currentRoomIndex}`);
        return true;
    }
    
    return false; // Ya en la última sala
}
```

#### Método `nextFloor()` - Progresión de Piso

```javascript
async nextFloor() {
    if (this.floorCount < FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN) {
        // Progresión normal: 1→2, 2→3
        this.floorCount++;
        this.generateFloor(); // Genera nuevo piso
        
    } else {
        // Piso 3 completado - Nueva run
        console.log(`ALL FLOORS COMPLETED! Max floors (${FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN}) reached`);
        
        // Completar run actual en backend
        await this.completeCurrentRun();
        
        // Incrementar run y crear nueva
        this.runCount++;
        await this.createNewRun();
        
        // Reset a piso 1
        this.floorCount = 1;
        this.generateFloor();
    }
}
```

#### Sistema de Room ID Mapping

```javascript
getCurrentRoomId() {
    const currentFloor = this.getCurrentFloor();
    const frontendIndex = this.getCurrentRoomIndex();
    const roomType = this.getCurrentRoomType();
    
    return roomMapping.getRoomId(frontendIndex, currentFloor, roomType);
}

getExpectedRoomId() {
    // Floor 1: rooms 1-6, Floor 2: rooms 7-12, Floor 3: rooms 13-18
    const baseId = (this.floorCount - 1) * 6;
    return baseId + this.currentRoomIndex + 1;
}

validateRoomMapping() {
    const mappedRoomId = this.getCurrentRoomId();
    const calculatedRoomId = this.getExpectedRoomId();
    
    if (mappedRoomId !== calculatedRoomId) {
        console.warn(`⚠️ ROOM MAPPING MISMATCH: Mapped=${mappedRoomId}, Calculated=${calculatedRoomId}`);
        return calculatedRoomId; // Fallback
    }
    
    return mappedRoomId;
}
```

## Estados y Gestión de Errores

### Flags de Control

```javascript
// Game.js
this.isTransitioning = false;        // Previene transiciones múltiples
this.transitionCooldown = 0;         // Cooldown entre transiciones
this.transitionCooldownTime = 500;   // 500ms de cooldown

// Room.js
this.bossDefeated = false;           // Flag especial para salas de jefe
this.chestSpawned = false;           // Control de chest en salas de combate
```

### Sistema de Recovery

```javascript
recoverFromTransitionError() {
    try {
        this.currentRoom = this.floorGenerator.getCurrentRoom();
        if (this.currentRoom && this.player) {
            this.player.setCurrentRoom(this.currentRoom);
            this.enemies = this.currentRoom.objects.enemies;
            console.log("State recovery attempted after transition error");
        }
    } catch (recoveryError) {
        console.error("Failed to recover state after transition error:", recoveryError);
    }
}
```

### Logging y Debug

El sistema incluye logging exhaustivo en múltiples niveles:

1. **Debug de posición de jugador** (cada 30 frames)
2. **Estados de transición** (inicio/fin/error)
3. **Validación de condiciones** (por qué se bloquea una transición)
4. **Mapeo de Room IDs** (consistencia de base de datos)
5. **Sincronización de enemigos** (arrays y estados)

## Casos Especiales y Edge Cases

### 1. Transiciones de Jefe
- **Timing**: Popup de upgrade permanente + transición
- **Estados**: `bossDefeated` flag vs `enemies.length === 0`
- **Auto-save**: Guardado inmediato antes de transición

### 2. Salas de Combate con Enemigos Dinámicos
- **Boss 2 (Supersoldier)**: Spawns drones dinámicamente
- **Detección inteligente**: Distingue entre spawning legítimo vs desync
- **Auto-sincronización**: Arrays de enemigos se mantienen consistentes

### 3. Interrupciones de Sesión
- **Logout durante transición**: Estado se guarda automáticamente
- **Reconexión**: Posición se restaura correctamente
- **Fallbacks**: Posición segura si hay inconsistencias

## Optimizaciones y Performance

### 1. Detección No-Bloqueante
- Las transiciones no pausan el render loop
- Operaciones async no afectan FPS
- Emergency cleanup garantiza estabilidad

### 2. Throttling de Logging
- Debug cada 30-60 frames (no cada frame)
- Logging de estados solo cuando cambian
- Evita spam en console

### 3. Validación Temprana
- `canTransition()` verifica condiciones antes de procesar
- Early exit si no se cumplen requisitos
- Previene operaciones innecesarias

## Integración con Backend

### Auto-save en Transiciones
```javascript
// Guardado automático en cada transición
await this.saveCurrentGameState();
```

### Sincronización de Room IDs
```javascript
// Update shop gameData with new room information
this.configureShopGameData();
```

### Manejo de Runs
```javascript
// Completar run en backend cuando se completan 3 pisos
const completionData = {
    goldCollected: runStats.goldCollected,
    goldSpent: runStats.goldSpent,
    totalKills: runStats.totalKills,
    deathCause: null // null para completado exitoso
};
await completeRun(currentRunId, completionData);
```

## Conclusiones

El sistema de transición de salas es **robusto y bien estructurado**, con:

### Fortalezas:
- **Separación clara de responsabilidades**
- **Manejo exhaustivo de errores**
- **Logging detallado para debugging**
- **Integración completa con backend**
- **Performance optimizada**

### Áreas de Complejidad:
- **Múltiples validaciones simultáneas**
- **Estados asincrónicos complejos**
- **Diferentes tipos de transición (sala vs piso)**
- **Sincronización de múltiples sistemas**

### Reliability:
- **Emergency cleanup garantiza estabilidad**
- **Fallbacks para casos de error**
- **Validación redundante de estados**
- **Recovery automático de errores**

El sistema permite **progresión fluida y confiable** a través del juego, manteniendo **consistencia de estado** y **experiencia de usuario** optimal. 