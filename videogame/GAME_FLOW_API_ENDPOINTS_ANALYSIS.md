# ANÁLISIS COMPLETO DEL FLUJO DEL JUEGO Y ENDPOINTS API
## Project Shattered Timeline

### 📋 **RESUMEN EJECUTIVO**

Este documento mapea **todo el flujo del juego** desde el inicio hasta el final, identificando **exactamente qué endpoints del API se llaman** en cada punto del gameplay, incluyendo cuando se llaman, con qué datos, y qué respuesta se espera.

---

## 🎮 **FLUJO COMPLETO DEL JUEGO**

### **1. FASE DE AUTENTICACIÓN**

#### **1.1. Registro de Usuario (Opcional)**
**Archivo**: `videogame/src/pages/js/register.js`
**Trigger**: Usuario completa formulario de registro

**API Call**:
```javascript
// Función: registerUser(username, email, password)
// Endpoint: POST /api/auth/register
```

**Datos Enviados**:
```json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

**Respuesta Esperada**:
```json
{
  "userId": 123,
  "message": "User registered successfully"
}
```

---

#### **1.2. Login de Usuario**
**Archivo**: `videogame/src/pages/js/login.js` (líneas 170, 187)
**Trigger**: Usuario completa formulario de login

**API Calls (Secuencia)**:

**Call 1 - Autenticación**:
```javascript
// Función: loginUser(email, password)  
// Endpoint: POST /api/auth/login
```

**Datos Enviados**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta Esperada**:
```json
{
  "userId": 123,
  "sessionToken": "uuid-string"
}
```

**Call 2 - Creación de Run**:
```javascript
// Función: createRun(loginResult.userId)
// Endpoint: POST /api/runs
```

**Datos Enviados**:
```json
{
  "userId": 123
}
```

**Respuesta Esperada**:
```json
{
  "runId": 456,
  "startedAt": "2024-01-15T10:30:00Z"
}
```

**Datos Almacenados en localStorage**:
- `sessionToken`: Token de sesión
- `currentUserId`: ID del usuario
- `currentRunId`: ID del run actual

---

### **2. FASE DE INICIALIZACIÓN DEL JUEGO**

#### **2.1. Inicialización de Servicios de Mapeo**
**Archivo**: `videogame/src/classes/game/Game.js` (líneas 61-102)
**Trigger**: Constructor del Game, inicialización automática

**API Calls (Paralelos)**:

**Call 1 - Obtener Rooms**:
```javascript
// Función: getRooms()
// Endpoint: GET /api/rooms
```

**Respuesta Esperada**:
```json
[
  {
    "room_id": 1,
    "floor": 1,
    "name": "Combat Room 1",
    "room_type": "combat",
    "sequence_order": 1
  },
  // ... más rooms
]
```

**Call 2 - Obtener Enemies**:
```javascript
// Función: getEnemies()
// Endpoint: GET /api/enemies
```

**Respuesta Esperada**:
```json
[
  {
    "enemy_id": 1,
    "name": "Basic Goblin",
    "floor": 1,
    "base_hp": 50,
    "base_damage": 10,
    "movement_speed": 50,
    "attack_cooldown_seconds": 2,
    "attack_range": 40
  },
  // ... más enemies
]
```

**Call 3 - Obtener Bosses**:
```javascript
// Función: getBosses()
// Endpoint: GET /api/bosses
```

**Respuesta Esperada**:
```json
[
  {
    "enemy_id": 100,
    "name": "Shadow Lord", 
    "floor": 1,
    "max_hp": 1000,
    "description": "Dark ruler of the shadow realm",
    "moves": [
      {
        "name": "Shadow Strike",
        "description": "Quick shadow attack",
        "phase": 1
      }
    ]
  },
  // ... más bosses
]
```

**Call 4 - Obtener Lookups**:
```javascript
// Función: getLookups()
// Endpoint: GET /api/lookups
```

**Respuesta Esperada**:
```json
{
  "eventTypes": ["enemy_kill", "chest_event", "shop_purchase"],
  "weaponSlots": ["melee", "primary", "secondary"],
  "upgradeTypes": ["max_health", "damage_boost"],
  "bossResults": ["victory", "defeat", "escape"],
  "roomTypes": ["combat", "shop", "boss"],
  "itemTypes": ["weapon", "armor", "consumable"]
}
```

---

### **3. FASE DE GAMEPLAY**

#### **3.1. Auto-Save Periódico del Estado**
**Archivo**: `videogame/src/classes/game/Game.js` (líneas 560-590)
**Trigger**: Cada 30 segundos automático (definido en autoSaveInterval)

**API Call**:
```javascript
// Función: saveRunState(runId, stateData)
// Endpoint: POST /api/runs/:runId/save-state
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "sessionId": 456,
  "roomId": 1,
  "currentHp": 85,
  "currentStamina": 45,
  "gold": 150
}
```

**Respuesta Esperada**:
```json
{
  "saveId": 789
}
```

---

#### **3.2. Auto-Save en Transiciones de Room**
**Archivo**: `videogame/src/classes/game/Game.js` (líneas 450-510)
**Trigger**: Antes y después de cambiar de room (izquierda/derecha)

**API Call**: Mismo que 3.1 (saveRunState)

**Timing**:
- **Antes de transición**: Guarda estado actual antes de moverse
- **Después de transición**: Guarda estado nuevo después de moverse exitosamente

---

#### **3.3. Registro de Enemy Kills**
**Archivo**: `videogame/src/classes/entities/Enemy.js` (líneas 165-185)
**Trigger**: Cuando un enemy muere (health <= 0)

**API Call**:
```javascript
// Función: registerEnemyKill(runId, killData)
// Endpoint: POST /api/runs/:runId/enemy-kill
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "enemyId": 1,
  "roomId": 1
}
```

**Respuesta Esperada**:
```json
{
  "killId": 456,
  "message": "Enemy kill registered"
}
```

**Notas**:
- Se llama automáticamente en `Enemy.die()`
- Es non-blocking (no bloquea el juego si falla)
- Mapea el nombre del enemy al enemyId usando `enemyMappingService`

---

#### **3.4. Registro de Chest Events**
**Archivo**: `videogame/src/utils/api.js` (línea 165)
**Trigger**: Cuando el jugador abre un chest

**API Call**:
```javascript
// Función: registerChestEvent(runId, chestData)
// Endpoint: POST /api/runs/:runId/chest-event
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "roomId": 1,
  "goldReceived": 120
}
```

**Respuesta Esperada**:
```json
{
  "eventId": 789,
  "message": "Chest event registered"
}
```

**Estado Actual**: ⚠️ **NO IMPLEMENTADO** en el frontend

---

#### **3.5. Registro de Shop Purchases**
**Archivo**: `videogame/src/utils/api.js` (línea 183)
**Trigger**: Cuando el jugador compra items en la tienda

**API Call**:
```javascript
// Función: registerShopPurchase(runId, purchaseData)
// Endpoint: POST /api/runs/:runId/shop-purchase
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "roomId": 2,
  "itemType": "health_potion",
  "itemName": "Health Potion",
  "goldSpent": 80
}
```

**Respuesta Esperada**:
```json
{
  "purchaseId": 456,
  "message": "Shop purchase registered"
}
```

**Estado Actual**: ⚠️ **NO IMPLEMENTADO** en el frontend

---

#### **3.6. Registro de Boss Encounters**
**Archivo**: `videogame/src/utils/api.js` (línea 201)
**Trigger**: Cuando el jugador pelea con un boss

**API Call**:
```javascript
// Función: registerBossEncounter(runId, encounterData)
// Endpoint: POST /api/runs/:runId/boss-encounter
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "enemyId": 100,
  "damageDealt": 120,
  "damageTaken": 30,
  "resultCode": "victory"
}
```

**Respuesta Esperada**:
```json
{
  "encounterId": 456,
  "message": "Boss encounter registered"
}
```

**Estado Actual**: ⚠️ **NO IMPLEMENTADO** en el frontend

---

#### **3.7. Registro de Upgrade Purchases**
**Archivo**: `videogame/src/utils/api.js` (línea 219)
**Trigger**: Cuando el jugador compra upgrades permanentes

**API Call**:
```javascript
// Función: registerUpgradePurchase(runId, upgradeData)
// Endpoint: POST /api/runs/:runId/upgrade-purchase
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "upgradeType": "max_health",
  "levelBefore": 1,
  "levelAfter": 2,
  "goldSpent": 200
}
```

**Respuesta Esperada**:
```json
{
  "purchaseId": 456,
  "message": "Upgrade purchase registered"
}
```

**Estado Actual**: ⚠️ **NO IMPLEMENTADO** en el frontend

---

#### **3.8. Equipar Weapons**
**Archivo**: `videogame/src/utils/api.js` (línea 240)
**Trigger**: Cuando el jugador equipa un arma

**API Call**:
```javascript
// Función: equipWeapon(runId, equipmentData)
// Endpoint: POST /api/runs/:runId/equip-weapon
```

**Datos Enviados**:
```json
{
  "userId": 123,
  "slotType": "primary"
}
```

**Respuesta Esperada**:
```json
{
  "message": "Weapon equipped for run"
}
```

**Estado Actual**: ⚠️ **NO IMPLEMENTADO** en el frontend

---

### **4. FASE DE FINALIZACIÓN**

#### **4.1. Completar Run (Victoria)**
**Archivo**: `videogame/src/classes/game/FloorGenerator.js` (líneas 320-350)
**Trigger**: Cuando el jugador completa todos los floors

**API Call**:
```javascript
// Función: completeRun(runId, completionData)
// Endpoint: POST /api/runs/:runId/complete
```

**Datos Enviados**:
```json
{
  "goldCollected": 500,
  "goldSpent": 300,
  "totalKills": 25,
  "deathCause": null
}
```

**Respuesta Esperada**:
```json
{
  "message": "Run completed successfully",
  "completedAt": "2024-01-15T11:30:00Z"
}
```

---

#### **4.2. Completar Run (Muerte)**
**Archivo**: `videogame/src/classes/entities/Player.js` (línea 20)
**Trigger**: Cuando el jugador muere (health <= 0)

**API Call**:
```javascript
// Función: completeRun(runId, completionData)
// Endpoint: POST /api/runs/:runId/complete
```

**Datos Enviados**:
```json
{
  "goldCollected": 250,
  "goldSpent": 150,
  "totalKills": 12,
  "deathCause": "enemy_damage"
}
```

**Respuesta Esperada**: Mismo que 4.1

---

#### **4.3. Logout**
**Archivo**: `videogame/src/utils/api.js` (línea 75)
**Trigger**: Cuando el usuario hace logout

**API Call**:
```javascript
// Función: logoutUser(sessionToken)
// Endpoint: POST /api/auth/logout
```

**Datos Enviados**:
```json
{
  "sessionToken": "uuid-string"
}
```

**Respuesta Esperada**:
```json
{}
```

---

## 📊 **ENDPOINTS ADICIONALES DISPONIBLES**

### **Endpoints de Consulta (GET)**

#### **Get User Stats**
```javascript
// Función: getUserStats(userId)
// Endpoint: GET /api/users/:userId/stats
```

#### **Get Item Types**
```javascript
// Función: getItemTypes()
// Endpoint: GET /api/item-types
```

### **Endpoints de Weapon Upgrades**

#### **Save Weapon Upgrade**
```javascript
// Endpoint: POST /api/runs/:runId/weapon-upgrade
```

**Datos**:
```json
{
  "userId": 123,
  "slotType": "primary",
  "level": 2,
  "damagePerUpgrade": 15,
  "goldCostPerUpgrade": 100
}
```

---

## ⚠️ **PROBLEMAS IDENTIFICADOS**

### **🔴 CRÍTICO: Endpoints No Implementados en Frontend**

1. **Chest Events** - Backend ready, frontend missing
2. **Shop Purchases** - Backend ready, frontend missing
3. **Boss Encounters** - Backend ready, frontend missing
4. **Upgrade Purchases** - Backend ready, frontend missing
5. **Weapon Equipment** - Backend ready, frontend missing
6. **Weapon Upgrades** - Backend ready, frontend missing

### **🔴 CRÍTICO: Problemas de Integración**

1. **Session Management**:
   - Backend requiere `sessionId` (INT)
   - Frontend solo tiene `sessionToken` (STRING)
   - **Solución**: Modificar login response para incluir sessionId

2. **Room ID Mapping**:
   - Frontend usa índices de arrays (0-3)
   - Backend usa room_id de base de datos (1-6)
   - **Solución**: Implementar roomMapping service

3. **Enemy ID Mapping**:
   - Frontend usa nombres ("Basic Goblin")
   - Backend usa enemy_id (1, 2, 3...)
   - **Solución**: Implementar enemyMapping service

4. **Base de Datos Vacía**:
   - Todas las tablas de lookup están vacías
   - **Solución**: Poblar con datos de muestra

---

## 🎯 **FLUJO IDEAL COMPLETO**

### **Secuencia Óptima de API Calls**

```
1. POST /api/auth/login                    → Login usuario
2. POST /api/runs                          → Crear nuevo run
3. GET /api/rooms                          → Cargar room mapping
4. GET /api/enemies                        → Cargar enemy mapping  
5. GET /api/bosses                         → Cargar boss data
6. GET /api/lookups                        → Cargar lookup data

--- GAMEPLAY LOOP ---
7. POST /api/runs/:runId/save-state        → Auto-save periódico
8. POST /api/runs/:runId/enemy-kill        → Cada enemy kill
9. POST /api/runs/:runId/chest-event       → Abrir chest
10. POST /api/runs/:runId/shop-purchase    → Comprar en shop
11. POST /api/runs/:runId/boss-encounter   → Pelear con boss
12. POST /api/runs/:runId/equip-weapon     → Equipar arma
13. POST /api/runs/:runId/upgrade-purchase → Comprar upgrade

--- FINALIZACIÓN ---
14. POST /api/runs/:runId/complete         → Completar run
15. POST /api/auth/logout                  → Logout
```

---

## 🧪 **TESTING RECOMENDADO**

### **Test 1: Flujo Básico**
```
Login → Create Run → Save State → Enemy Kill → Complete Run
```

### **Test 2: Flujo Completo**
```
Login → Initialize Services → Combat → Shop → Boss → Victory → Logout
```

### **Test 3: Error Handling**
```
API Down → Network Issues → Invalid Data → Recovery
```

---

## 📈 **MÉTRICAS DE RENDIMIENTO**

### **API Calls por Sesión de Juego (Estimado)**

- **Inicialización**: 6 calls
- **Auto-save**: 1 call cada 30s (20-30 calls por sesión)
- **Enemy kills**: 15-25 calls por run
- **Shop/Chest/Boss**: 5-10 calls por run
- **Finalización**: 2 calls

**Total estimado**: **50-75 API calls por sesión de 30 minutos**

---

## 📞 **PRÓXIMOS PASOS PARA IMPLEMENTACIÓN COMPLETA**

1. **CRÍTICO**: Implementar session ID en login response
2. **CRÍTICO**: Poblar base de datos con datos de muestra
3. **ALTO**: Implementar room/enemy mapping services
4. **MEDIO**: Conectar chest events en frontend
5. **MEDIO**: Conectar shop purchases en frontend
6. **MEDIO**: Conectar boss encounters en frontend
7. **BAJO**: Implementar weapon equipment system
8. **BAJO**: Implementar upgrade purchase system

> **Nota**: Este documento debe actualizarse conforme se implementen las características faltantes para mantener sincronía con el estado actual del proyecto. 