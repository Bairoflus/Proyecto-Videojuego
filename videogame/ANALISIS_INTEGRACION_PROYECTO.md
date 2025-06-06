# 1. Introducción

Este documento presenta un análisis exhaustivo de la integración del proyecto "Shattered Timeline", un videojuego de aventura tipo dungeon crawler desarrollado con tecnologías web modernas. El juego implementa un sistema de combate en tiempo real, progresión por pisos con enfrentamientos contra jefes, y un sistema de persistencia completo para el seguimiento del progreso del jugador.

## Tecnologías principales utilizadas

**Backend:**
- Node.js con Express.js como framework web
- MySQL 2 para la gestión de base de datos
- bcrypt para el hash de contraseñas
- Arquitectura RESTful API

**Frontend:**
- HTML5 Canvas para el renderizado del juego
- JavaScript vanilla (ES6 modules)
- CSS3 para la interfaz de usuario
- Sistema de sprites para animaciones

**Base de datos:**
- MySQL con esquema relacional complejo
- 23 tablas principales con relaciones bien definidas
- Sistema de migraciones y datos de prueba

## Entornos de desarrollo existentes

El proyecto cuenta con un entorno de desarrollo local configurado con:
- Servidor frontend en puerto 8080 (servir archivos estáticos)
- Servidor backend API en puerto 3000
- Base de datos MySQL local (ProjectShatteredTimeline)
- Scripts de testing automatizados para integración
- Documentación técnica detallada

# 2. Estado actual del proyecto

## Estructura de carpetas y archivos clave

### Directorio `/src/api/` (Backend)
- `app.js`: Servidor principal Express (1,898 líneas) con 15+ endpoints RESTful
- `package.json`: Dependencias (express, mysql2, bcrypt)
- `README.md`: Documentación completa de la API (2,956 líneas)

### Directorio `/src/database/` (Base de datos)
- `projectshatteredtimeline.sql`: Esquema principal (312 líneas, 23 tablas)
- `complete_game_data.sql`: Datos de inicialización (359 líneas)

### Directorio `/src/` (Frontend)
- `server.js`: Servidor de desarrollo para archivos estáticos
- `main.js`: Punto de entrada del juego
- `config.js`: Configuraciones del juego (160 líneas)
- `pages/`: Páginas HTML (landing, login, register, game, stats)
- `classes/`: Lógica del juego organizada en módulos
- `utils/`: Servicios utilitarios (API, logging, mapping)

## Versiones de tecnologías

- **Node.js**: Módulos ES6 (type: "module")
- **Express**: ^4.18.2
- **MySQL**: ^3.6.5 (mysql2)
- **bcrypt**: ^5.1.1
- **Frontend**: JavaScript nativo, HTML5, CSS3

## Despliegue y configuración

### Comandos de inicio
```bash
# Backend API
cd api && npm start  # Puerto 3000

# Frontend
cd src && node server.js  # Puerto 8080
```

### Scripts disponibles
- `npm test`: Suite de pruebas de integración API
- `npm run test:browser`: Pruebas de compatibilidad del navegador
- `npm run test:login`: Pruebas del flujo de autenticación

# 3. Análisis de la capa de datos (Base de datos)

## Estructura de tablas y relaciones

### Entidades principales
**Usuarios y sesiones:**
- `users`: Cuentas de jugadores (user_id, username, email, password_hash)
- `sessions`: Sesiones activas con tokens UUID
- `player_stats`: Estadísticas acumulativas del jugador
- `player_settings`: Configuraciones de audio (música, efectos)
- `player_upgrades`: Mejoras permanentes entre partidas

**Sistema de partidas:**
- `run_history`: Historial de intentos de juego
- `save_states`: Sistema de guardado automático por sala
- `rooms`: 18 salas distribuidas en 3 pisos (6 salas cada uno)

**Combat y enemigos:**
- `enemy_types`: 20 tipos de enemigos + 3 jefes finales
- `boss_details`: Información extendida de jefes
- `boss_moves`: Movimientos especiales de jefes (13 movimientos)
- `enemy_kills`: Registro de eliminaciones
- `boss_encounters`: Estadísticas de combate contra jefes

**Economía del juego:**
- `shop_purchases`: Compras en tiendas
- `chest_events`: Eventos de cofres encontrados
- `permanent_upgrade_purchases`: Compras de mejoras permanentes

### Índices y claves

**Claves primarias:** Todas las tablas principales tienen claves primarias auto-incrementales
**Claves foráneas:** Sistema completo de integridad referencial con CASCADE y RESTRICT apropiados
**Índices implícitos:** En todas las claves foráneas para optimizar JOINs

## Migraciones y scripts de inicialización

### Estado de los scripts
- `projectshatteredtimeline.sql`: Esquema completo y consistente
- `complete_game_data.sql`: 359 líneas de datos de prueba bien estructurados
- Datos de prueba incluyen: 3 usuarios, 18 salas, 20 enemigos, 3 jefes, datos analíticos

### Verificación de datos
El script incluye consultas de verificación para confirmar que todos los datos se insertan correctamente.

## Configuración de conexión

```javascript
// Configuración hardcodeada en app.js
const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'tc2005b',
    password: 'qwer1234',
    database: 'ProjectShatteredTimeline',
    port: 3306
});
```

## Consultas críticas realizadas por la API

### Principales operaciones
1. **Autenticación:** INSERT/SELECT en `users` y `sessions`
2. **Progreso del juego:** INSERT/UPDATE en `run_history` y `save_states`
3. **Combate:** INSERT en `enemy_kills`, `boss_encounters`
4. **Economía:** INSERT en `shop_purchases`, `chest_events`
5. **Configuraciones:** GET/PUT en `player_settings`

### Procedimientos y funciones
No se utilizan procedimientos almacenados; toda la lógica está en la capa de aplicación.

## Problemas detectados en la base de datos

1. **Configuración de conexión hardcodeada**: Credenciales directamente en el código
2. **Falta de pooling de conexiones**: Cada request crea una nueva conexión
3. **Transacciones incompletas**: Algunas operaciones críticas no usan transacciones
4. **Índices faltantes**: Campos frecuentemente consultados sin índices explícitos

# 4. Análisis de la API (Back-end)

## Estructura de carpetas y archivos

### Organización del código
- **Archivo único**: `app.js` contiene toda la lógica (1,898 líneas)
- **Sin separación por capas**: Controladores, rutas y lógica de negocio mezclados
- **Configuración inline**: Variables de entorno hardcodeadas

## Validación de modelos/entidades

### Estado actual
- **No hay ORM**: Consultas SQL directas con placeholders
- **Validación manual**: Verificaciones básicas de tipos y rangos
- **Sin esquemas formales**: No se utilizan librerías como Joi o Yup

### Consistencia con la base de datos
Los modelos están implícitos en las consultas SQL y son consistentes con el esquema de base de datos.

## Endpoints principales

### Autenticación
- `POST /api/auth/register`: Registro de usuarios con hash bcrypt
- `POST /api/auth/login`: Autenticación con JWT-like session tokens
- `POST /api/auth/logout`: Cierre de sesión (marca timestamp)

### Gestión de usuarios
- `GET /api/users/:userId/stats`: Estadísticas del jugador
- `GET /api/users/:userId/settings`: Configuraciones de audio
- `PUT /api/users/:userId/settings`: Actualización de configuraciones

### Sistema de partidas
- `POST /api/runs`: Crear nueva partida
- `POST /api/runs/:runId/save-state`: Guardar estado actual
- `PUT /api/runs/:runId/complete`: Finalizar partida
- `POST /api/runs/:runId/enemy-kill`: Registrar eliminación de enemigo
- `POST /api/runs/:runId/chest-event`: Registrar evento de cofre
- `POST /api/runs/:runId/shop-purchase`: Registrar compra en tienda

### Endpoints de información
- `GET /api/rooms`: Lista de salas (faltante en código actual)
- `GET /api/enemies`: Lista de enemigos (faltante en código actual)

## Autenticación y autorización

### Sistema implementado
- **Session tokens**: UUID generados automáticamente
- **Validación de sesión**: Verificación por sessionToken en requests
- **Sin middleware de auth**: Validación manual en cada endpoint

### Seguridad
- Passwords hasheados con bcrypt (salt rounds: 10)
- Validación de ownership en operaciones de partida
- Protección básica contra inyección SQL con placeholders

## Manejo de errores

### Estructura de respuestas
```javascript
// Respuestas exitosas
res.status(200).json({ data: result });

// Respuestas de error
res.status(400).json({ message: "Error description" });
```

### Cobertura de errores
- Validación de parámetros requeridos
- Manejo de errores de base de datos
- Códigos HTTP apropiados (400, 404, 409, 500)
- Logging de errores en consola

## Pruebas automatizadas

### Estado actual
Existen múltiples archivos de testing:
- `test_full_integration.js`: Pruebas de integración completa
- `automated_stress_test.js`: Pruebas de estrés (589 líneas)
- `comprehensive_game_test.js`: Pruebas comprehensivas (769 líneas)

# 5. Análisis del Front-end

## Estructura general

### Organización de archivos
```
src/
├── pages/
│   ├── html/: 5 páginas principales (landing, login, register, game, stats)
│   ├── css/: Estilos del juego
│   └── js/: Lógica específica de páginas
├── classes/: Arquitectura orientada a objetos del juego
│   ├── game/: Lógica principal del juego
│   ├── entities/: Player, Enemy, Boss
│   ├── rooms/: Gestión de salas
│   └── config/: Configuraciones
├── utils/: Servicios utilitarios
└── assets/: Sprites, fondos, iconos
```

### Framework/librería utilizada
- **JavaScript vanilla** con módulos ES6
- **HTML5 Canvas** para renderizado del juego
- **Arquitectura modular** con imports/exports

## Consumo de la API

### Servicios de API
Archivo `utils/api.js` centraliza las llamadas:
```javascript
const API_BASE_URL = 'http://localhost:3000';

export async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
}
```

### Configuración de URL base
- **URL hardcodeada**: `localhost:3000` no configurable por entorno
- **Sin variables de entorno**: No hay diferenciación desarrollo/producción

### Correspondencia de endpoints
Los servicios del frontend mapean correctamente a los endpoints del backend:
- `login()` → `POST /api/auth/login`
- `register()` → `POST /api/auth/register`
- `saveGameState()` → `POST /api/runs/:runId/save-state`

## Estado de la aplicación

### Gestión de estado
- **LocalStorage**: Para persistencia de sesión y configuraciones
- **Variables globales**: Para estado del juego actual
- **Sin gestor formal**: No Redux/Vuex, gestión manual

### Estructura del estado
```javascript
// En localStorage
sessionStorage: {
    userId: number,
    sessionToken: string,
    currentRunId: number
}

// Estado del juego
window.gameState: {
    currentRoom: Room,
    player: Player,
    enemies: Enemy[],
    hud: HUD
}
```

## Rutas y navegación

### Sistema de navegación
- **Páginas estáticas**: Sin router de SPA
- **Navegación por location.href**: Cambios de página tradicionales
- **Validación de sesión**: En cada página que lo requiere

### Control de acceso
- `game.html`: Requiere validación de sesión
- `stats.html`: Acceso público con datos opcionales
- Redirecciones automáticas en caso de sesión inválida

## Manejo de errores y feedback

### Feedback al usuario
- **Modales de error**: Para errores de API y validación
- **Console logging**: Para debugging durante desarrollo
- **Loading states**: Spinners durante operaciones asíncronas

### Robustez
- Fallback a modo offline si falla la API
- Validación client-side antes de enviar datos
- Manejo graceful de errores de red

# 6. Integración completa (API ↔ BD ↔ Front-end)

## Flujo de una solicitud completa

### Ejemplo: Proceso de login
1. **Frontend**: Usuario ingresa credenciales en `login.html`
2. **Validación client-side**: Verificación de formato de email
3. **API call**: `POST /api/auth/login` con email y password
4. **Backend**: Consulta `SELECT user_id, password_hash FROM users WHERE email = ?`
5. **Autenticación**: Verificación con `bcrypt.compare()`
6. **Sesión**: `INSERT INTO sessions (user_id, session_token) VALUES (?, UUID())`
7. **Respuesta**: `{ userId, sessionToken, sessionId }`
8. **Frontend**: Almacena datos en sessionStorage y redirige a game.html

### Ejemplo: Guardado de estado del juego
1. **Frontend**: Trigger automático al cambiar de sala
2. **Preparación**: Recolección del estado actual (HP, stamina, gold, roomId)
3. **API call**: `POST /api/runs/:runId/save-state`
4. **Backend**: Validación de runId, sessionId, roomId existentes
5. **Base de datos**: `INSERT INTO save_states` con timestamp automático
6. **Respuesta**: `{ saveId }` confirmando la operación
7. **Frontend**: Log de confirmación (opcional)

## Lista de rutas críticas y correspondencia

### Autenticación
- Frontend: `pages/js/login.js:23` → Backend: `app.js:34` → BD: `users, sessions`
- Frontend: `pages/js/register.js:15` → Backend: `app.js:68` → BD: `users, player_settings`

### Gestión del juego
- Frontend: `utils/api.js:45` → Backend: `app.js:456` → BD: `run_history`
- Frontend: `utils/eventLogger.js:67` → Backend: `app.js:523` → BD: `save_states`
- Frontend: `classes/entities/Enemy.js:89` → Backend: `app.js:645` → BD: `enemy_kills`

### Datos del juego
- Frontend: `utils/roomMapping.js:24` → Backend: *FALTANTE* → BD: `rooms`
- Frontend: `utils/enemyMapping.js:43` → Backend: *FALTANTE* → BD: `enemy_types`

## Ejecución de consultas SQL y formato de respuesta JSON

### Consultas típicas y respuestas
```sql
-- Endpoint: GET /api/users/:userId/stats
SELECT * FROM player_stats WHERE user_id = ?

-- Respuesta JSON:
{
    "user_id": 1,
    "total_runs": 15,
    "runs_completed": 3,
    "total_kills": 89,
    "best_single_run_kills": 12,
    "highest_damage_hit": 45,
    "total_gold_earned": 1200,
    "total_gold_spent": 800,
    "total_playtime_seconds": 14400
}
```

### Relaciones complejas
Para objetos anidados como runs con detalles:
```sql
-- Múltiples consultas secuenciales (sin JOINs optimizados)
SELECT * FROM run_history WHERE user_id = ?;
SELECT * FROM save_states WHERE run_id = ?;
SELECT * FROM enemy_kills WHERE run_id = ?;
```

## Variables de entorno y configuración

### Estado actual
- **Backend**: Configuración hardcodeada en app.js
- **Frontend**: URLs absolutas en código
- **Base de datos**: Credenciales en código fuente

### Falta de archivos de configuración
- No existe `.env.example`
- No hay diferenciación por entornos
- Configuración no portable entre desarrolladores

# 7. Problemas detectados

## Backend (API)

### Problemas críticos
1. **Configuración hardcodeada**: Credenciales de BD y URLs en código fuente
2. **Archivo monolítico**: 1,898 líneas en un solo archivo sin separación de responsabilidades
3. **Manejo de conexiones ineficiente**: Nueva conexión por request sin pooling
4. **Endpoints faltantes**: `GET /api/rooms` y `GET /api/enemies` referenciados pero no implementados
5. **Sin middleware de autenticación**: Validación manual repetida en cada endpoint
6. **Transacciones incompletas**: Operaciones críticas sin atomicidad

### Problemas de seguridad
1. **CORS permisivo**: `Access-Control-Allow-Origin: *` en producción
2. **Logging inseguro**: Passwords en logs durante debugging
3. **Sin rate limiting**: API vulnerable a ataques de fuerza bruta
4. **Headers de seguridad faltantes**: Sin HELMET u otros middleware de seguridad

## Base de datos

### Problemas de rendimiento
1. **Índices faltantes**: Campos como `room_id`, `enemy_id` sin índices explícitos
2. **Consultas no optimizadas**: SELECT * en lugar de campos específicos
3. **Sin particionado**: Tablas grandes como `player_events` sin partición temporal

### Problemas de integridad
1. **Datos de prueba mezclados**: Datos de testing en scripts de producción
2. **Sin validaciones CHECK**: Rangos de valores no validados a nivel de BD
3. **Timestamps inconsistentes**: Algunos usando CURRENT_TIMESTAMP, otros NOW()

## Frontend

### Problemas de arquitectura
1. **Gestión de estado dispersa**: Sin patrón centralizado para estado global
2. **Código duplicado**: Lógica de validación repetida entre páginas
3. **Sin bundling**: Archivos separados sin optimización de carga
4. **Rutas hardcodeadas**: URLs de assets y API no configurables

### Problemas de user experience
1. **Errores no manejados**: Algunos fallos de API no muestran feedback al usuario
2. **Loading states inconsistentes**: Algunas operaciones sin indicadores de carga
3. **Validación client-side incompleta**: Formularios permiten datos inválidos
4. **Sin offline support**: Juego no funciona sin conexión al backend

## Integración completa

### Problemas de comunicación
1. **Formato de errores inconsistente**: Backend a veces devuelve texto plano en lugar de JSON
2. **Timeout no configurado**: Requests pueden colgarse indefinidamente
3. **Sin retry logic**: Fallos temporales de red no se reintientan automáticamente
4. **Versionado de API**: Sin versionado para compatibilidad futura

### Problemas de deployment
1. **Configuración manual**: Sin scripts de despliegue automatizado
2. **Dependencias de desarrollo**: Sin separación clara entre deps de dev y producción
3. **Sin monitoreo**: No hay logging centralizado ni métricas de salud del sistema

# 8. Recomendaciones y pasos a seguir

## 1. Revisión y ajuste de variables de entorno

### Crear sistema de configuración
```bash
# Crear archivo .env.example
cp .env.example .env

# Variables requeridas:
# Backend
DB_HOST=localhost
DB_USER=tc2005b
DB_PASSWORD=qwer1234
DB_NAME=ProjectShatteredTimeline
DB_PORT=3306
JWT_SECRET=generate_secure_random_key
API_PORT=3000
CORS_ORIGIN=http://localhost:8080

# Frontend
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
```

### Refactorizar configuración del backend
- Instalar dotenv: `npm install dotenv`
- Crear module de configuración centralizada
- Reemplazar valores hardcodeados por variables de entorno

## 2. Sincronizar modelos y esquemas

### Optimización de base de datos
```sql
-- Agregar índices faltantes
CREATE INDEX idx_enemy_kills_run_id ON enemy_kills(run_id);
CREATE INDEX idx_save_states_user_id ON save_states(user_id);
CREATE INDEX idx_player_events_run_id ON player_events(run_id);

-- Agregar constraints de validación
ALTER TABLE player_settings 
ADD CONSTRAINT chk_music_volume CHECK (music_volume BETWEEN 0 AND 100);
```

### Implementar ORM o Query Builder
- Considerar Prisma o TypeORM para type safety
- Crear modelos explícitos que reflejen el esquema
- Implementar migraciones versionadas

## 3. Validaciones en la API

### Implementar middleware de validación
```javascript
npm install joi express-validator helmet express-rate-limit

// Ejemplo de validación con Joi
const userRegistrationSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
});
```

### Estandarizar respuestas de error
```javascript
// Formato estándar para todas las respuestas
const ResponseFormat = {
    success: { status: 'success', data: result },
    error: { status: 'error', message: 'Description', code: 'ERROR_CODE' }
};
```

## 4. Endpoints faltantes o mal definidos

### Implementar endpoints faltantes
```javascript
// GET /api/rooms - Lista todas las salas
app.get('/api/rooms', async (req, res) => {
    const [rooms] = await connection.execute(
        'SELECT room_id, floor, name, room_type, sequence_order FROM rooms ORDER BY floor, sequence_order'
    );
    res.json({ status: 'success', data: rooms });
});

// GET /api/enemies - Lista todos los enemigos
app.get('/api/enemies', async (req, res) => {
    const [enemies] = await connection.execute(
        'SELECT enemy_id, name, floor, is_rare, base_hp, base_damage FROM enemy_types'
    );
    res.json({ status: 'success', data: enemies });
});
```

### Documentar API con OpenAPI/Swagger
- Instalar swagger-ui-express
- Crear especificación OpenAPI 3.0
- Generar documentación interactiva

## 5. Ajuste de llamadas en el Front-end

### Centralizar configuración de API
```javascript
// config/environment.js
const config = {
    development: {
        API_BASE_URL: 'http://localhost:3000',
        FRONTEND_URL: 'http://localhost:8080'
    },
    production: {
        API_BASE_URL: 'https://api.shatteredtimeline.com',
        FRONTEND_URL: 'https://shatteredtimeline.com'
    }
};

export const ENV = config[process.env.NODE_ENV || 'development'];
```

### Implementar manejo robusto de errores
```javascript
// utils/apiClient.js
export async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        
        if (!response.ok) {
            throw new ApiError(response.status, await response.json());
        }
        
        return await response.json();
    } catch (error) {
        // Log error and show user-friendly message
        console.error('API Error:', error);
        showUserNotification('Error connecting to server');
        throw error;
    }
}
```

### Proteger rutas del frontend
```javascript
// utils/auth.js
export function requireAuth() {
    const session = getSessionData();
    if (!session || !session.sessionToken) {
        window.location.href = '/pages/html/login.html';
        return false;
    }
    return true;
}
```

## 6. Pruebas integradas y end-to-end

### Implementar suite de pruebas de API
```javascript
// tests/api/integration.test.js
import { describe, test, expect } from 'jest';

describe('Authentication API', () => {
    test('should register new user successfully', async () => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'securepassword'
            })
        });
        expect(response.status).toBe(201);
    });
});
```

### Pruebas end-to-end con Playwright
```javascript
// e2e/gameflow.spec.js
import { test, expect } from '@playwright/test';

test('complete game flow', async ({ page }) => {
    // 1. Landing page
    await page.goto('/');
    await page.click('text=Create Account');
    
    // 2. Registration
    await page.fill('[name="username"]', 'e2euser');
    await page.fill('[name="email"]', 'e2e@test.com');
    await page.fill('[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // 3. Game start
    await expect(page.locator('#gameCanvas')).toBeVisible();
    await page.keyboard.press('w'); // Move up
    await page.keyboard.press(' '); // Attack
    
    // 4. Verify game state saved
    const saveResponse = await page.waitForResponse('/api/runs/*/save-state');
    expect(saveResponse.status()).toBe(201);
});
```

## 7. Despliegue en entorno de staging

### Configurar Docker para desarrollo
```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports: ["3000:3000"]
    environment:
      - DB_HOST=mysql
    depends_on: [mysql]
  
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ProjectShatteredTimeline
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - ./database:/docker-entrypoint-initdb.d
```

### Configurar nginx para frontend
```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 8. Monitoreo y logs

### Implementar logging estructurado
```javascript
// utils/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console()
    ]
});
```

### Métricas de aplicación
```javascript
// middleware/metrics.js
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

export function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        httpRequestDuration.observe(
            { method: req.method, route: req.route?.path, status: res.statusCode },
            duration
        );
    });
    next();
}
```

## 9. Documentación final

### README.md del proyecto
```markdown
# Shattered Timeline Game

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Setup database
mysql -u root -p < database/projectshatteredtimeline.sql
mysql -u root -p ProjectShatteredTimeline < database/complete_game_data.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start services
npm run dev  # Starts both frontend and backend
```

## Development
- Backend API: http://localhost:3000
- Frontend: http://localhost:8080
- API Documentation: http://localhost:3000/docs

## Testing
```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:api      # API integration tests
```
```

### Documentación técnica
- Crear diagramas de arquitectura
- Documentar flujos de datos críticos
- Guías de contribución para desarrolladores
- Especificaciones de API actualizadas

# 9. Conclusión

## Estado final esperado

Siguiendo los pasos recomendados, el proyecto alcanzará un estado de madurez técnica con:

### Robustez técnica
- **Configuración externalizada**: Variables de entorno para todos los despliegues
- **Arquitectura escalable**: Separación clara de responsabilidades y capas
- **Pruebas automatizadas**: Cobertura integral desde unidad hasta end-to-end
- **Monitoreo activo**: Logging estructurado y métricas de rendimiento

### Experiencia de desarrollo
- **Entorno reproducible**: Docker y scripts de setup automatizados
- **Documentación completa**: APIs documentadas y guías de desarrollo actualizadas
- **Workflow optimizado**: CI/CD pipeline para testing y deployment
- **Debugging eficiente**: Logs centralizados y herramientas de monitoreo

### Experiencia de usuario
- **Rendimiento consistente**: Optimizaciones de base de datos y frontend
- **Manejo robusto de errores**: Feedback claro y recuperación automática
- **Seguridad mejorada**: Autenticación robusta y protección contra vulnerabilidades
- **Escalabilidad**: Arquitectura preparada para crecimiento de usuarios

## Importancia de la coherencia

La coherencia entre modelos, esquemas y consumo de la API es fundamental para mantener la integridad del sistema. Los cambios en cualquier capa deben propagarse sistemáticamente a través de:

1. **Esquema de base de datos** → Actualización de migraciones
2. **Modelos de API** → Actualización de validaciones y respuestas
3. **Servicios de frontend** → Actualización de interfaces y manejo de datos
4. **Documentación** → Actualización de especificaciones y ejemplos

## Necesidad de pruebas constantes

El desarrollo continuo requiere un enfoque disciplinado de testing:

- **Pruebas unitarias**: Para lógica de negocio crítica
- **Pruebas de integración**: Para verificar comunicación entre capas
- **Pruebas end-to-end**: Para validar flujos completos de usuario
- **Pruebas de regresión**: Para asegurar que nuevas funcionalidades no rompan las existentes

La implementación de estas recomendaciones transformará el proyecto de un prototipo funcional a una aplicación robusta, mantenible y lista para producción. 