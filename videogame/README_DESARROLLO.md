# Shattered Timeline - Guía de Desarrollo

## Configuración Rápida (5 minutos)

### 1. Base de Datos
```bash
# Instalar MySQL localmente
# Crear usuario (opcional, o usar root):
mysql -u root -p
CREATE USER 'tc2005b'@'localhost' IDENTIFIED BY 'qwer1234';
GRANT ALL PRIVILEGES ON *.* TO 'tc2005b'@'localhost';

# Crear base de datos con datos de prueba
mysql -u tc2005b -p < database/setup_database.sql
```

### 2. Backend (API)
```bash
cd api
npm install
node app.js
# Servidor en http://localhost:3000
```

### 3. Frontend 
```bash
cd src
node server.js
# Servidor en http://localhost:8080
# Abre automáticamente en http://localhost:8080/pages/html/landing.html
```

## Estructura Simplificada

```
videogame/
├── api/
│   ├── app.js              # API completa (endpoints + lógica)
│   ├── db.js               # Conexión hardcodeada a MySQL
│   ├── authMiddleware.js   # Middleware de autenticación simple
│   └── package.json        # Dependencias backend
├── database/
│   └── setup_database.sql  # ÚNICO archivo SQL (esquema + datos)
└── src/
    ├── server.js           # Servidor frontend simple  
    ├── main.js             # Punto de entrada del juego
    ├── config.js           # Configuración del juego
    ├── utils/
    │   ├── api.js          # TODAS las llamadas al backend centralizadas
    │   ├── auth.js         # Gestión de sesiones centralizada
    │   └── gameService.js  # Carga de datos del juego centralizada
    ├── pages/              # HTML páginas
    ├── classes/            # Clases del juego
    └── assets/             # Sprites, sonidos, etc.
```

## Configuración de Credenciales

### Base de Datos
- **Archivo:** `api/db.js`
- **Credenciales por defecto:**
  - Host: `localhost`
  - Usuario: `tc2005b`
  - Contraseña: `qwer1234`
  - Base de datos: `ProjectShatteredTimeline`
  - Puerto: `3306`

### URLs del API
- **Archivo:** `src/utils/api.js`
- **URL por defecto:** `http://localhost:3000/api`

## Endpoints Disponibles

### Autenticación (Sin auth requerida)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Datos del Juego (Sin auth requerida)
- `GET /api/rooms` - Obtener todas las salas
- `GET /api/enemies` - Obtener todos los enemigos
- `GET /api/bosses` - Obtener todos los jefes
- `GET /api/lookups` - Obtener datos de referencia
- `GET /api/item-types` - Obtener tipos de items

### Usuario (Auth requerida)
- `GET /api/users/:id/stats` - Estadísticas del jugador
- `GET /api/users/:id/settings` - Configuraciones del jugador
- `PUT /api/users/:id/settings` - Actualizar configuraciones

### Partidas (Auth requerida)
- `POST /api/runs` - Crear nueva partida
- `POST /api/runs/:id/save-state` - Guardar estado
- `PUT /api/runs/:id/complete` - Completar partida
- `POST /api/runs/:id/enemy-kill` - Registrar muerte de enemigo
- `POST /api/runs/:id/chest-event` - Registrar evento de cofre
- `POST /api/runs/:id/shop-purchase` - Registrar compra en tienda
- `POST /api/runs/:id/boss-encounter` - Registrar encuentro con jefe
- `POST /api/runs/:id/boss-kill` - Registrar muerte de jefe
- `POST /api/runs/:id/events` - Registrar eventos del jugador
- `POST /api/runs/:id/upgrade-purchase` - Registrar compra de mejora
- `POST /api/runs/:id/equip-weapon` - Equipar arma
- `POST /api/runs/:id/weapon-upgrade` - Mejorar arma

## Desarrollo

### Agregar Nuevo Endpoint
1. **Backend:** Agregar ruta en `api/app.js`
2. **Frontend:** Agregar función en `src/utils/api.js`
3. **Usar:** Importar función donde necesites

### Modificar Base de Datos
1. Editar `database/setup_database.sql`
2. Ejecutar: `mysql -u tc2005b -p < database/setup_database.sql`
3. Reiniciar backend

### Usuario de Prueba
- **Email:** `test@test.com`
- **Contraseña:** `password` (hash: `$2b$10$rU8K9Z8Q4X5n7P2mY3tV4Oz1N6W0L5mR9dH3vB2qE8jF7kS1iA0uC`)

## Validaciones Simples

### Frontend
- **Email:** Debe contener `@` y `.`
- **Campos requeridos:** No pueden estar vacíos
- **Sesión:** Se valida automáticamente en páginas protegidas

### Backend
- **Autenticación:** Token en header `Authorization`
- **Campos requeridos:** Validación básica en cada endpoint
- **Errores:** Respuestas JSON con `{ message: "error" }`

## Sin Usar

- ❌ JWT tokens (usar tokens simples en `sessions`)
- ❌ ORM (usar MySQL directo)
- ❌ Migraciones complejas (un solo SQL)
- ❌ Variables de entorno (hardcodear credenciales)
- ❌ Pool de conexiones (una conexión por request)
- ❌ Middlewares complejos (solo auth básico)
- ❌ Validaciones avanzadas (solo checks básicos)

## Problemas Comunes

### Error de conexión a BD
```bash
# Verificar que MySQL esté corriendo
sudo service mysql start  # Linux
brew services start mysql # Mac

# Verificar credenciales en api/db.js
```

### Error CORS
```bash
# Verificar que backend esté en puerto 3000
# Verificar que frontend esté en puerto 8080
```

### Error 404 en API
```bash
# Verificar que la URL en src/utils/api.js sea correcta
# Verificar que el endpoint exista en api/app.js
``` 