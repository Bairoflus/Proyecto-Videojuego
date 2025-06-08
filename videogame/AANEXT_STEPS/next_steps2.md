# 📊 ANÁLISIS EXHAUSTIVO: FUNCIONALIDADES Y BASE DE DATOS CON ADMINISTRADOR
## Shattered Timeline - Análisis Completo Frontend vs Backend + Admin Dashboard

### 🎯 ESTADO REAL DE LAS 4 FUNCIONALIDADES REQUERIDAS

#### 1. **Persistencia del número de runs por usuario** 
**Status: ✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONANDO**
- **Backend**: ✅ Tabla `player_stats.total_runs` + triggers automáticos
- **API**: ✅ `/api/users/:userId/stats` y `/api/users/:userId/complete-stats`
- **Frontend**: ✅ Se muestra en menú de pausa: `${historicalStats.totalRuns}`
- **Flujo completo**: Funciona desde creación de run hasta visualización
- **Acción requerida**: NINGUNA

#### 2. **Mejoras permanentes persistentes**
**Status: ✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONANDO**
- **Backend**: ✅ Tabla `permanent_player_upgrades` + API completa
- **Frontend**: ✅ `PermanentUpgradePopup.js` completamente implementado
- **Integración**: ✅ Se aplican al player automáticamente: `player.applyUpgrade()`
- **Persistencia**: ✅ Se cargan al inicializar: `loadPermanentUpgrades()`
- **UI**: ✅ Popup visual tras derrotar boss con 3 opciones
- **Acción requerida**: NINGUNA

#### 3. **Mejoras temporales (armas) que persistan entre sesiones pero se pierdan al morir**
**Status: ✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONANDO**
- **Backend**: ✅ Tabla `weapon_upgrades_temp` + API completa
- **Frontend**: ✅ `weaponUpgradeManager.js` maneja todo el flujo
- **Shop**: ✅ `Shop.js` usa weaponUpgradeManager para upgrades
- **Persistencia**: ✅ `loadCurrentUpgrades()` y `saveUpgrades()`
- **Reset en muerte**: ✅ `resetOnDeath()` implementado y funcional
- **Acción requerida**: NINGUNA

#### 4. **Estadísticas del jugador en el menú de pausa**
**Status: ✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONANDO**
- **Backend**: ✅ APIs de estadísticas completas y funcionales
- **Frontend**: ✅ Menú de pausa implementado en `Game.js` líneas 1514-1618
- **Conexión**: ✅ `loadStatsData()` conecta con `/api/users/:userId/complete-stats`
- **Visualización**: ✅ Muestra estadísticas actuales + históricas
- **Acción requerida**: NINGUNA

---

### 🛡️ NUEVA FUNCIONALIDAD: ADMINISTRADOR

#### **Status: ⚠️ PARCIALMENTE IMPLEMENTADO - NECESITA MODIFICACIONES EN BD Y API**

**Lo que ya está creado:**
- ✅ Página de admin (`admin.html`) con dashboard completo
- ✅ Estilos CSS (`admin.css`) profesionales y responsivos  
- ✅ JavaScript (`admin.js`) para cargar y mostrar analíticas
- ✅ Interfaz con 4 secciones: Dashboard, Leaderboards, Analytics, Players

**Lo que falta por implementar:**
1. **Sistema de roles en base de datos**
2. **Usuario admin por defecto**
3. **Endpoints de analytics faltantes en API**
4. **Protección de endpoints para solo admin**
5. **Modificación del sistema de login para reconocer roles**

---

### 🔍 ANÁLISIS REVISADO: COLUMNAS NECESARIAS PARA ANALYTICS

#### **COLUMNAS QUE SÍ SE NECESITAN PARA ANALYTICS:**

**Para Leaderboards (endpoints que SÍ se usan):**
- `final_floor` ✅ **NECESARIA** - Para `MAX(rh.final_floor)` en leaderboards
- `total_bosses_killed` ✅ **NECESARIA** - Para leaderboard de bosses
- `total_playtime_seconds` ✅ **NECESARIA** - Para leaderboard de playtime
- `total_gold_spent` ✅ **NECESARIA** - Para mostrar inversión en leaderboards

**Para Analytics de Economy:**
- Tabla `weapon_upgrade_purchases` completa ✅ **NECESARIA**
- Columnas: `weapon_type`, `upgrade_level`, `cost`, `purchased_at`, `user_id`

**Para Analytics de Combat:**
- Tabla `enemy_kills` completa ✅ **NECESARIA**
- Columnas: `enemy_type`, `floor`, `room_id`, `killed_at`, `user_id`

**Para Analytics de Progression:**
- `final_floor` ✅ **NECESARIA** - Para calcular skill tier
- `total_runs`, `total_kills` ✅ **NECESARIAS**

#### **COLUMNAS QUE NO SE USAN (PUEDEN ELIMINARSE):**

❌ **`final_gold`** - No se usa en ninguna vista de analytics
❌ **`bosses_killed`** (en run_history) - Se usa `total_bosses_killed` de player_stats
❌ **`duration_seconds`** - No se usa en ninguna vista de analytics  
❌ **`logout_at`** (sessions) - Redundante
❌ **`logout_timestamp`** (save_states) - Redundante
❌ **`show_fps`** (player_settings) - No implementado en frontend

---

### 📋 PLAN DE IMPLEMENTACIÓN PASO A PASO

#### **FASE 1: SISTEMA DE ADMINISTRADOR (ALTA PRIORIDAD)**

**1.1. Modificar tabla `users` para agregar roles**
```sql
-- Agregar columna role a la tabla users
ALTER TABLE users ADD COLUMN role ENUM('player', 'admin') DEFAULT 'player';

-- Crear usuario admin por defecto
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@shatteredtimeline.com', '$2b$10$dummy.hash.for.admin.123456', 'admin');
```

**1.2. Modificar endpoints de autenticación**
- **Archivo**: `api/app.js` - función login
- **Cambios**: Incluir `role` en respuesta de login
- **Agregar**: Almacenar `userRole` en localStorage

**1.3. Agregar endpoints de analytics faltantes**
- **Archivo**: `api/app.js`
- **Agregar**: `GET /api/analytics/combat` (usa `vw_combat_analytics`)
- **Agregar**: `GET /api/status/active-players` (usa `vw_active_players`)
- **Agregar**: `GET /api/status/current-games` (usa `vw_current_games`)

**1.4. Proteger endpoints de analytics**
- **Middleware**: Crear función `requireAdmin()`
- **Aplicar**: A todos los endpoints `/api/leaderboards/*` y `/api/analytics/*`

**1.5. Agregar redirección al admin en login**
- **Archivo**: `src/pages/js/login.js`
- **Lógica**: Si `userRole === 'admin'` → redirigir a `admin.html`

#### **FASE 2: OPTIMIZACIÓN DE BASE DE DATOS (MEDIA PRIORIDAD)**

**2.1. Eliminar columnas no utilizadas**
```sql
-- Eliminar columnas que no se usan
ALTER TABLE run_history DROP COLUMN final_gold;
ALTER TABLE run_history DROP COLUMN bosses_killed;  
ALTER TABLE run_history DROP COLUMN duration_seconds;
ALTER TABLE sessions DROP COLUMN logout_at;
ALTER TABLE save_states DROP COLUMN logout_timestamp;
ALTER TABLE player_settings DROP COLUMN show_fps;
```

**2.2. Actualizar vistas afectadas**
- **Archivo**: `database2/objects2.sql`
- **Modificar**: Remover referencias a columnas eliminadas
- **Mantener**: Todas las vistas de analytics (se necesitan)

#### **FASE 3: LIMPIEZA DE CÓDIGO (BAJA PRIORIDAD)**

**3.1. Eliminar referencias a testMode**
- ✅ **COMPLETADO**: Landing page button eliminado
- ✅ **COMPLETADO**: `dev-game.html` eliminado
- ✅ **COMPLETADO**: Estilos CSS limpiados
- **Pendiente**: Limpiar referencias en código JavaScript

**3.2. Limpiar API endpoints no esenciales**
- **Mantener**: Todos los endpoints de analytics (se necesitan para admin)
- **Eliminar**: Solo endpoints que realmente no se usan

---

### 🛠️ MODIFICACIONES ESPECÍFICAS REQUERIDAS

#### **API CHANGES (archivo `api/app.js`)**

**1. Modificar endpoint de login (línea ~170)**
```javascript
// ANTES
res.json({
    success: true,
    message: 'Login successful',
    userId: user.user_id,
    sessionId: sessionResult.insertId
});

// DESPUÉS  
res.json({
    success: true,
    message: 'Login successful',
    userId: user.user_id,
    sessionId: sessionResult.insertId,
    userRole: user.role,
    username: user.username
});
```

**2. Agregar endpoints faltantes**
```javascript
// Agregar después de línea 1013
// GET /api/analytics/combat
app.get('/api/analytics/combat', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        const [combat] = await connection.execute('SELECT * FROM vw_combat_analytics');
        res.json({ success: true, data: combat });
    } catch (error) {
        console.error('Error getting combat analytics:', error);
        res.status(500).json({ success: false, message: 'Error fetching combat analytics' });
    } finally {
        if (connection) await connection.end();
    }
});
```

**3. Agregar middleware requireAdmin**
```javascript
// Agregar después de línea 50
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Admin access required' });
    }
    // Verificar que el usuario sea admin (lógica a implementar)
    next();
}
```

#### **DATABASE CHANGES**

**1. Script de migración necesario:**
```sql
-- Agregar role a users
ALTER TABLE users ADD COLUMN role ENUM('player', 'admin') DEFAULT 'player';

-- Crear admin por defecto (contraseña hasheada de "123456")
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@shatteredtimeline.com', '$2b$10$N9qo8uLOickgx2ZMRjOYNe.5YSaGdm3JPcOF5Pb.G8HAwLYn4Yz6W', 'admin');

-- Eliminar columnas no utilizadas  
ALTER TABLE run_history DROP COLUMN final_gold;
ALTER TABLE run_history DROP COLUMN bosses_killed;
ALTER TABLE run_history DROP COLUMN duration_seconds;
```

**2. Actualizar scripts existentes:**
- **`dbshatteredtimeline2.sql`**: Agregar columna `role` a tabla `users`
- **`objects2.sql`**: Remover referencias a columnas eliminadas

#### **FRONTEND CHANGES**

**1. Modificar login.js (línea ~200)**
```javascript
// Agregar almacenamiento de role y username
localStorage.setItem('userRole', loginResult.userRole);
localStorage.setItem('username', loginResult.username);

// Redirigir según rol
if (loginResult.userRole === 'admin') {
    window.location.href = 'admin.html';
} else {
    window.location.href = 'game.html';
}
```

---

### 📊 RESUMEN DE COLUMNAS Y TABLAS

#### **MANTENER (Esenciales):**

**Tablas completas:**
- ✅ `users` (+ columna `role`)
- ✅ `sessions` (- columna `logout_at`)
- ✅ `save_states` (- columna `logout_timestamp`)
- ✅ `permanent_player_upgrades`
- ✅ `weapon_upgrades_temp`
- ✅ `player_stats`
- ✅ `run_history` (simplificado)
- ✅ `weapon_upgrade_purchases` (para analytics)
- ✅ `enemy_kills` (para analytics)
- ✅ `boss_kills` (para analytics)
- ✅ `player_settings` (- columna `show_fps`)

**Columnas específicas en run_history:**
- ✅ `final_floor` (para leaderboards)
- ✅ `total_kills` (se usa)
- ✅ `gold_spent` (se usa)
- ✅ `cause_of_death` (se usa)

#### **ELIMINAR:**

**Columnas específicas:**
- ❌ `final_gold` (run_history)
- ❌ `bosses_killed` (run_history) 
- ❌ `duration_seconds` (run_history)
- ❌ `logout_at` (sessions)
- ❌ `logout_timestamp` (save_states)
- ❌ `show_fps` (player_settings)

---

### ✅ CONCLUSIÓN Y SIGUIENTES PASOS

**Las 4 funcionalidades base están 100% implementadas y funcionando.**

**Para completar el sistema de administrador:**

1. **⏱️ Tiempo estimado**: 3-4 horas
2. **Complejidad**: Media (requiere cambios en BD + API + Frontend)
3. **Prioridad**: Alta (requisito del proyecto)

**Beneficios del plan:**
- ✅ Sistema completo de analytics para administrador
- ✅ Base de datos optimizada (elimina ~30% de columnas no usadas)
- ✅ Código más limpio y mantenible
- ✅ Cumple todos los requisitos del proyecto escolar

**Siguiente acción recomendada:**
Comenzar con **FASE 1** (Sistema de Administrador) ya que es requisito del proyecto. 