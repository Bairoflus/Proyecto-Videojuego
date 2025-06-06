# 🧪 Guía: Página de Desarrollo - Shattered Timeline

## Descripción

Se ha creado una página específica para desarrolladores (`dev-game.html`) que permite probar el juego directamente sin necesidad de autenticación, con herramientas de debug avanzadas integradas.

## 🚀 Cómo Usar

### Acceso Directo
```
http://localhost:8080/pages/html/dev-game.html
```

### Inicio Automático
1. **No requiere login** - La página omite toda la validación de sesión
2. **Configuración automática** - Establece modo de prueba y datos de sesión falsos
3. **Inicio inmediato** - El juego se carga directamente sin pasos adicionales

## 🛠️ Herramientas de Desarrollo Incluidas

### Panel de Control Lateral (Visual)
El panel negro en la esquina superior derecha incluye botones para:

#### 🎮 **Controles de Juego**
- **🔄 Restart Game** - Reinicia el juego completamente
- **💀 Kill Player** - Mata al jugador para probar mecánica de muerte
- **🛡️ God Mode** - Hace al jugador invencible (9999 HP)
- **💰 +1000 Gold** - Agrega 1000 de oro al jugador

#### 🚪 **Controles de Room**
- **➡️ Next Room** - Fuerza transición a la siguiente room
- **⚔️ Clear Enemies** - Elimina todos los enemigos de la room actual
- **📦 Spawn Chest** - Genera un cofre en la room actual

#### 📊 **Información de Debug**
- **📊 Game State** - Muestra estado detallado del juego en consola
- **🗺️ Test Mapping** - Ejecuta pruebas de mapeo de rooms
- **🔧 Check Services** - Verifica estado de servicios backend

#### 🧪 **Sesión**
- **📋 Session Data** - Muestra datos de sesión actuales
- **🧪 Toggle Test Mode** - Activa/desactiva modo de prueba
- **❌ Hide Panel** - Oculta/muestra el panel de herramientas

### Comandos de Consola (Avanzados)

Además del panel visual, todos los comandos están disponibles en la consola del navegador:

```javascript
// Controles básicos de juego
restartGame()          // Reinicia el juego
killPlayer()           // Mata al jugador
godMode()              // Activa modo dios
addGold()              // Agrega 1000 oro

// Controles de rooms
forceNextRoom()        // Fuerza siguiente room
clearEnemies()         // Elimina enemigos
spawnChest()           // Genera cofre

// Debug y análisis
showGameState()        // Estado completo del juego
testRoomMapping()      // Pruebas de mapeo
checkServices()        // Estado de servicios

// Gestión de sesión
showSessionData()      // Datos de sesión
toggleTestMode()       // Modo de prueba
toggleDevPanel()       // Panel de desarrollo

// Comandos avanzados del juego
gameSessionDebug.check()     // Verificar datos de sesión
gameServiceDebug.status()    // Estado de servicios backend
testGame()                   // Suite completa de pruebas
window.game                  // Acceso directo a instancia del juego
```

## 🎯 Casos de Uso Principales

### 1. **Prueba Rápida de Mecánicas**
```
1. Abrir dev-game.html
2. Usar godMode() para evitar morir
3. Usar forceNextRoom() para probar diferentes rooms
4. Usar clearEnemies() para forzar progresión
```

### 2. **Testing de Room Progression**
```
1. showGameState() para ver estado inicial
2. forceNextRoom() para avanzar manualmente
3. testRoomMapping() para verificar mapeo correcto
4. showGameState() para confirmar progresión
```

### 3. **Testing de Combate**
```
1. clearEnemies() para limpiar enemies actuales
2. Recargar room o usar restartGame()
3. Probar combate normalmente
4. killPlayer() para probar mecánica de muerte
```

### 4. **Testing de Economía**
```
1. addGold() para tener oro
2. Navegar a room de tienda
3. Probar compras
4. showGameState() para verificar cambios
```

### 5. **Debug de Problemas**
```
1. showGameState() para estado actual
2. checkServices() para verificar backend
3. showSessionData() para verificar sesión
4. testGame() para pruebas completas
```

## 🔧 Configuración Automática

### Datos de Sesión Falsos
La página automáticamente configura:
```javascript
localStorage.setItem('testMode', 'true');
localStorage.setItem('developerMode', 'true');
localStorage.setItem('currentUserId', '999');
localStorage.setItem('currentSessionId', '999');
localStorage.setItem('currentRunId', '999');
```

### Modo de Prueba Activado
- **Sin validación de autenticación**
- **Sin conexión requerida al backend**
- **Todos los logs de debug activos**
- **Herramientas de testing cargadas automáticamente**

## 🆚 Diferencias vs Página Normal

| Aspecto | Página Normal (`game.html`) | Página Desarrollo (`dev-game.html`) |
|---------|----------------------------|-------------------------------------|
| **Autenticación** | ✅ Requerida (login/register) | ❌ Omitida completamente |
| **Validación de Sesión** | ✅ Validación completa | ❌ Datos falsos automáticos |
| **Conexión Backend** | ✅ Requerida para funcionar | 🟡 Opcional (modo prueba) |
| **Herramientas Debug** | 🟡 Limitadas (solo consola) | ✅ Panel visual + consola |
| **Comandos de Control** | ❌ No disponibles | ✅ Panel completo + comandos |
| **Tiempo de Setup** | 🐌 Login → Validación → Juego | ⚡ Directo al juego |
| **Ideal Para** | Usuarios finales | Desarrolladores/Testing |

## 🎨 Indicadores Visuales

### Header Distintivo
```
🧪 DEVELOPER MODE - Shattered Timeline | No Authentication Required | All Debug Tools Active
```

### Panel de Herramientas
- **Color distintivo**: Fondo negro con borde cyan
- **Iconos claros**: Cada función tiene emoji distintivo
- **Posición fija**: Esquina superior derecha, siempre visible
- **Ocultable**: Se puede ocultar con el botón ❌

### Logs Mejorados
```
🧪 DEVELOPER MODE ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Game is running in full developer mode
🚫 No authentication required
🛠️ All debug tools are active
📊 Check the developer panel on the right →
```

## 🐛 Troubleshooting

### Problema: El juego no carga
**Solución:**
1. Verificar que el servidor esté corriendo en puerto 8080
2. Revisar consola del navegador para errores
3. Usar el botón "🔄 Retry" si aparece

### Problema: Los comandos no funcionan
**Solución:**
1. Esperar 2 segundos después de cargar la página
2. Verificar que aparezca el mensaje "🧪 DEVELOPER TOOLS READY"
3. Verificar que `window.game` existe en consola

### Problema: Panel de herramientas no visible
**Solución:**
1. Revisar esquina superior derecha
2. Usar `toggleDevPanel()` en consola
3. Recargar la página si es necesario

### Problema: Room transitions no funcionan
**Solución:**
1. Usar `showGameState()` para verificar estado
2. Usar `testRoomMapping()` para verificar mapeo
3. Usar `forceNextRoom()` para forzar transición
4. Revisar logs en consola para errores

## 📝 Logs y Debugging

### Logs Principales a Buscar
```
🧪 SETTING UP DEVELOPER ENVIRONMENT
✅ Developer environment configured
🎮 Starting game in developer mode...
🎉 DEVELOPER GAME MODE READY!
🧪 DEVELOPER TOOLS READY
```

### Comandos de Diagnóstico
```javascript
// Estado general
showGameState()

// Verificar servicios
checkServices()

// Verificar sesión
showSessionData()

// Probar mapeo
testRoomMapping()

// Suite completa
testGame()
```

## 🚀 Inicio Rápido para Desarrolladores

1. **Abrir directamente**: `http://localhost:8080/pages/html/dev-game.html`
2. **Esperar carga**: Ver "🎉 DEVELOPER GAME MODE READY!" en consola
3. **Usar panel**: Botones en esquina superior derecha
4. **Comandos rápidos**: 
   - `godMode()` para invencibilidad
   - `showGameState()` para estado actual
   - `forceNextRoom()` para navegar rápido

**¡Listo para desarrollar y probar!** 🎮🛠️ 