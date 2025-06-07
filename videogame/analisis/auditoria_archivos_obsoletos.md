# 🧹 **AUDITORÍA DE ARCHIVOS OBSOLETOS - SHATTERED TIMELINE**

---

## 🎯 **RESUMEN EJECUTIVO**

Después de reestructurar completamente la API y cambiar la base de datos de `ProjectShatteredTimeline` a `dbshatteredtimeline`, se identificaron **múltiples archivos obsoletos** que causan:

- ❌ **Errores de endpoints inexistentes**
- ❌ **Referencias a base de datos antigua**
- ❌ **Código innecesario y complejo**
- ❌ **Confusión en el desarrollo**

**Recomendación**: Limpiar estos archivos **ANTES** de continuar con el Paso 8 de integración.

---

## 🚨 **ARCHIVOS CRÍTICOS - ELIMINACIÓN INMEDIATA**

### **videogame/api/**

#### ❌ `db.js` - ELIMINAR
**Problema**: Configurado para BD antigua `'ProjectShatteredTimeline'`
```javascript
database: 'ProjectShatteredTimeline',  // ❌ BD obsoleta
```
**Acción**: 🗑️ **ELIMINAR** - Ya no se usa, el nuevo app.js tiene su propia configuración

#### ❌ `authMiddleware.js` - ELIMINAR
**Problemas**:
- Importa `db.js` obsoleto
- Busca `closed_at IS NULL` (nuevo sistema usa `is_active = TRUE`)
- No se usa en el nuevo app.js
**Acción**: 🗑️ **ELIMINAR** - Middleware obsoleto

### **videogame/src/utils/**

#### ❌ `roomMapping.js` - ELIMINAR
**Problemas**:
- Llama `getRooms()` → endpoint `/api/rooms` **YA NO EXISTE**
- 300 líneas de código innecesario
- Las habitaciones están hardcodeadas en frontend
**Acción**: 🗑️ **ELIMINAR** - Funcionalidad obsoleta

#### ❌ `enemyMapping.js` - ELIMINAR
**Problemas**:
- Llama `getEnemies()` → endpoint `/api/enemies` **YA NO EXISTE**
- 236 líneas de mapeo innecesario
- Nuevo sistema usa enums simples (`'basic'`, `'strong'`)
**Acción**: 🗑️ **ELIMINAR** - Funcionalidad obsoleta

#### ❌ `serviceManager.js` - ELIMINAR
**Problemas**:
- 447 líneas manejando servicios obsoletos
- Depende de `roomMapping` y `enemyMapping`
- Los nuevos managers se inicializan directamente
**Acción**: 🗑️ **ELIMINAR** - Sistema de orquestación obsoleto

#### ❌ `gameService.js` - ELIMINAR
**Problemas**:
- Llama endpoints obsoletos: `getRooms()`, `getEnemies()`, `getBosses()`
- Su propósito (cargar datos de BD) ya no es relevante
**Acción**: 🗑️ **ELIMINAR** - Servicio obsoleto

#### ❌ `eventLogger.js` - ELIMINAR
**Problemas**:
- Usa `logPlayerEvent()`, `logPlayerEvents()` → endpoints **YA NO EXISTEN**
- 224 líneas de código temporalmente deshabilitado
- Sistema de eventos innecesariamente complejo
**Acción**: 🗑️ **ELIMINAR** - Sistema obsoleto

---

## ⚠️ **ARCHIVOS CRÍTICOS - REESCRIBIR COMPLETAMENTE**

### ⚠️ `videogame/src/utils/api.js` - REESCRIBIR

**Problemas críticos**:
- **18 funciones obsoletas** que llaman endpoints inexistentes:
  ```javascript
  getRooms() → /api/rooms ❌
  getEnemies() → /api/enemies ❌
  getBosses() → /api/bosses ❌
  getLookups() → /api/lookups ❌
  getItemTypes() → /api/item-types ❌
  registerShopPurchase() → /api/runs/:id/shop-purchase ❌
  registerBossEncounter() → /api/runs/:id/boss-encounter ❌
  // ... y 11 más
  ```

- **Formato de respuesta incorrecto**: Espera respuesta directa, pero nuevo API retorna `{success, data/message}`

- **Endpoints faltantes**: No tiene funciones para los nuevos endpoints:
  ```javascript
  // Faltantes:
  /api/users/:id/permanent-upgrades
  /api/users/:id/weapon-upgrades/:runId
  /api/users/:id/save-state
  /api/leaderboards/:type
  /api/analytics/economy
  ```

**Acción**: 🔄 **REESCRIBIR COMPLETAMENTE** con solo las funciones necesarias

---

## 🔧 **ARCHIVOS - ACTUALIZACIÓN MENOR**

### 🔧 `videogame/src/classes/config/gameConfig.js` - ACTUALIZAR

**Problemas menores**:
- Importa `getBosses()` obsoleto
- Función `loadBossData()` ya no necesaria

**Acción**: 🔧 **ACTUALIZAR** - Eliminar imports obsoletos, mantener configuraciones válidas

### 🔧 `videogame/src/pages/js/login.js` - ACTUALIZAR

**Problemas menores**:
- Usa `loginUser()` y `createRun()` que necesitan manejo del nuevo formato de respuesta

**Acción**: 🔧 **ACTUALIZAR** - Ajustar manejo de respuestas `{success, data}`

---

## ✅ **ARCHIVOS CORRECTOS - NO MODIFICAR**

### ✅ Archivos que están bien:
- `videogame/src/utils/auth.js` ✅ (Solo sessionStorage)
- `videogame/src/utils/saveStateManager.js` ✅ (Nuevo sistema)
- `videogame/src/utils/weaponUpgradeManager.js` ✅ (Nuevo sistema)
- `videogame/src/constants/gameEnums.js` ✅ (Nuevo sistema)
- `videogame/src/classes/ui/PermanentUpgradePopup.js` ✅ (Nuevo sistema)
- `videogame/src/config.js` ✅ (Configuración frontend)
- `videogame/src/server.js` ✅ (Servidor estático)

---

## 📋 **PLAN DE LIMPIEZA - ACCIONES INMEDIATAS**

### **Fase 1: Eliminación Segura (5 minutos)**
```bash
# Eliminar archivos obsoletos
rm videogame/api/db.js
rm videogame/api/authMiddleware.js
rm videogame/src/utils/roomMapping.js
rm videogame/src/utils/enemyMapping.js
rm videogame/src/utils/serviceManager.js
rm videogame/src/utils/gameService.js
rm videogame/src/utils/eventLogger.js
```

### **Fase 2: Reescribir api.js (30 minutos)**
Crear `videogame/src/utils/api.js` nuevo con:
- ✅ Solo funciones para endpoints que existen
- ✅ Manejo correcto de `{success, data/message}`
- ✅ Funciones para nuevos endpoints (permanent upgrades, etc.)

### **Fase 3: Actualizar archivos menores (15 minutos)**
- 🔧 `gameConfig.js`: Remover imports obsoletos
- 🔧 `login.js`: Ajustar manejo de respuestas

---

## 📊 **BENEFICIOS DE LA LIMPIEZA**

### **🚀 Proyecto más limpio**
- **7 archivos menos** (2,500+ líneas eliminadas)
- **18 funciones obsoletas eliminadas**
- **Sin dependencias rotas**

### **🔧 Desarrollo más fácil**
- **Sin confusión** sobre qué archivos usar
- **Sin errores** de endpoints inexistentes
- **Código más mantenible**

### **⚡ Mejor rendimiento**
- **Sin imports innecesarios**
- **Sin código muerto**
- **Bundles más pequeños**

---

## ⚡ **ORDEN DE EJECUCIÓN RECOMENDADO**

### **AHORA - Antes del Paso 8:**
1. 🗑️ **Eliminar archivos obsoletos** (Fase 1)
2. 🔄 **Reescribir api.js** (Fase 2)
3. 🔧 **Actualizar archivos menores** (Fase 3)

### **DESPUÉS - Continuar con Paso 8:**
4. ✅ Verificar configuración API
5. ✅ Integrar managers en Game.js
6. ✅ Modificar clases existentes

---

## 🎯 **RESULTADO ESPERADO**

Después de la limpieza:
- ✅ **Proyecto 100% compatible** con nueva API
- ✅ **Sin archivos obsoletos** que causen confusión
- ✅ **Base sólida** para continuar integración
- ✅ **Desarrollo más rápido** y sin errores

---

**🎮 Recomendación**: Ejecutar esta limpieza **AHORA** antes de continuar con la integración frontend. El proyecto quedará mucho más limpio y fácil de mantener. 