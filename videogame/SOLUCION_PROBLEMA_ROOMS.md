# Solución: Problema de Secuencia de Rooms (1 → 3 → 6)

## Problema Identificado

**Síntoma:** El jugador salta de room 1 a room 3 a room 6 de forma arbitraria en lugar de seguir la secuencia correcta 1 → 2 → 3 → 4 → 5 → 6.

## Causa Raíz

### 1. **Inicialización Asíncrona No Esperada**

En `FloorGenerator.js`, línea 32:
```javascript
constructor() {
    // ... código ...
    this.generateFloor();
    this.initializeRoomMapping(); // ❌ ASYNC call sin await
}
```

La función `initializeRoomMapping()` es **asíncrona** pero se llama sin `await` en el constructor, causando que:

1. El constructor termine inmediatamente
2. `roomMapping` aún no tenga los datos de la API 
3. `getRoomId()` use los **fallback mappings** incorrectos

### 2. **Fallback Mappings Incorrectos**

En `roomMapping.js`, los fallbacks están diseñados mal:
```javascript
getSequenceOrder(frontendIndex, roomType, currentFloor) {
    if (currentFloor === 1) {
        if (roomType === 'combat') {
            const combatSequences = [1, 2, 3, 4]; // ✅ Correcto
            return combatSequences[frontendIndex] || 1;
        }
    }
    // ❌ Pero si frontendIndex > 3, usa fallback genérico incorrecto
}
```

### 3. **Flujo de Mapeo Erróneo**

**Frontend Index → Database Room ID:**
- Frontend usa índices: `0, 1, 2, 3, 4, 5` (6 rooms)
- Database usa IDs secuenciales: `1, 2, 3, 4, 5, 6` (Floor 1)

**Pero cuando roomMapping no está inicializado:**
- Frontend index `1` → Fallback calcula incorrectamente
- Se salta a room IDs incorrectos

## Soluciones Implementadas

### Solución 1: Arreglar Inicialización Asíncrona

**Archivo: `FloorGenerator.js`**

```javascript
export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.floorCount = 1;
        this.runCount = FLOOR_CONSTANTS.INITIAL_RUN_COUNT;
        this.roomTypes = [];
        this.roomStates = [];
        this.visitedRooms = new Set();
        this.roomMappingInitialized = false;
        
        // ✅ FIX: Solo llamar generateFloor después de init
        this.initialize();
    }

    // ✅ NUEVO: Método de inicialización async separado
    async initialize() {
        this.ensureCleanInitialization();
        this.generateFloor();
        
        // ✅ FIX: Esperar a que termine roomMapping
        await this.initializeRoomMapping();
        
        console.log('✅ FloorGenerator fully initialized');
    }
}
```

### Solución 2: Simplificar Mapeo de Rooms

**Archivo: `roomMapping.js`**

```javascript
// ✅ SIMPLIFICADO: Mapeo directo sin lógica compleja
getRoomId(frontendIndex, currentFloor, roomType) {
    // Frontend: 0,1,2,3,4,5 → Database: sequential por floor
    const baseId = (currentFloor - 1) * 6; // Floor 1: 0, Floor 2: 6, Floor 3: 12
    return baseId + frontendIndex + 1; // +1 porque DB empieza en 1
}

// Ejemplo:
// Floor 1, Index 0 → (1-1)*6 + 0 + 1 = 1 ✅
// Floor 1, Index 1 → (1-1)*6 + 1 + 1 = 2 ✅
// Floor 2, Index 0 → (2-1)*6 + 0 + 1 = 7 ✅
```

### Solución 3: Validación de Secuencia

**Archivo: `FloorGenerator.js`**

```javascript
nextRoom() {
    const beforeIndex = this.currentRoomIndex;
    
    if (this.currentRoomIndex < this.currentFloor.length - 1) {
        this.currentRoomIndex++;
        
        // ✅ FIX: Validar que el mapeo sea correcto
        const roomId = this.getCurrentRoomId();
        const expectedRoomId = this.getExpectedRoomId();
        
        if (roomId !== expectedRoomId) {
            console.error(`🚨 ROOM MAPPING ERROR: Got ${roomId}, expected ${expectedRoomId}`);
            // Usar ID correcto
            this.forceCorrectRoomId(expectedRoomId);
        }
        
        console.log(`ROOM PROGRESSION: ${beforeIndex} → ${this.currentRoomIndex} (Room ID: ${roomId})`);
        return true;
    }
    
    return false;
}

getExpectedRoomId() {
    // Cálculo directo sin dependencias de roomMapping
    const baseId = (this.floorCount - 1) * 6;
    return baseId + this.currentRoomIndex + 1;
}
```

## Verificación de la Solución

### Prueba 1: Secuencia de Floor 1
```
Frontend Index: 0 → Room ID: 1 ✅ (Abandoned Courtyard)
Frontend Index: 1 → Room ID: 2 ✅ (Broken Armory)  
Frontend Index: 2 → Room ID: 3 ✅ (Collapsed Kitchen)
Frontend Index: 3 → Room ID: 4 ✅ (Cursed Library)
Frontend Index: 4 → Room ID: 5 ✅ (Merchant Corner)
Frontend Index: 5 → Room ID: 6 ✅ (Throne Room)
```

### Prueba 2: Secuencia de Floor 2
```
Frontend Index: 0 → Room ID: 7 ✅ (Frozen Entrance)
Frontend Index: 1 → Room ID: 8 ✅ (Crystal Cavern)
etc...
```

## Implementación de Emergency Fix

### Para fix inmediato sin refactor completo:

**Archivo: `roomMapping.js` - Línea 105**

```javascript
getRoomId(frontendIndex, currentFloor, roomType) {
    // ✅ EMERGENCY FIX: Mapeo directo simple
    const baseRoomId = (currentFloor - 1) * 6 + 1; // Floor 1: 1, Floor 2: 7, Floor 3: 13
    const roomId = baseRoomId + frontendIndex;
    
    console.log(`🎮 FIXED MAPPING: Floor ${currentFloor}, Index ${frontendIndex} → Room ID ${roomId}`);
    return roomId;
}
```

## Resultados Esperados

✅ **Secuencia correcta:** 1 → 2 → 3 → 4 → 5 → 6  
✅ **Sin saltos arbitrarios**  
✅ **Mapeo consistente entre frontend y backend**  
✅ **Logs claros para debugging**  

## Prevención Futura

1. **Siempre usar `await` para inicializaciones asíncronas**
2. **Tener fallbacks simples y confiables**
3. **Logs detallados de mapeo de rooms**
4. **Tests unitarios para mapeo room index → room ID** 