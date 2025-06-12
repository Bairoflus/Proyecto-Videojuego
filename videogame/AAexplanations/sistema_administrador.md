# Sistema de Administrador - Análisis Optimizado para Shattered Timeline

## Introducción

Este documento define el sistema de administrador optimizado para Shattered Timeline, enfocándose únicamente en funcionalidades útiles para los desarrolladores, con acceso seguro y análisis de datos relevantes.

## Estrategia de Acceso Seguro

### Acceso por URL Directa

El panel de administrador solo será accesible mediante:
- **URL directa**: `https://dominio.com/admin.html`
- **Sin enlaces públicos** desde otras páginas
- **Login independiente** con credenciales almacenadas en la base de datos

### Sistema de Autenticación Administrativa

**Credenciales definidas en la base de datos:**
```sql
-- Usuarios administrativos (ya implementado en dbshatteredtimeline3forperm.sql)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@shatteredtimeline.com', '$2b$10$N9qo8uLOickgx2ZMRjOYNe.5YSaGdm3JPcOF5Pb.G8HAwLYn4Yz6W', 'admin');

-- Agregar más administradores según sea necesario
INSERT INTO users (username, email, password_hash, role) VALUES 
('devteam', 'dev@shatteredtimeline.com', '$2b$10$[hash_para_password_seguro]', 'admin');
```

**Flujo de autenticación:**
1. Usuario accede a `/admin.html`
2. Sistema verifica si existe `sessionToken` con `role = 'admin'`
3. Si no existe, muestra formulario de login
4. Validación contra tabla `users` con `role = 'admin'`
5. Acceso denegado para cualquier usuario con `role = 'player'`

## Vistas de Base de Datos Implementadas

### 1. Vistas Relevantes (IMPLEMENTAR)

#### **vw_leaderboard_playtime** - Jugadores por tiempo jugado
```sql
CREATE VIEW vw_leaderboard_playtime AS
SELECT 
    u.username as dedicated_player,
    ROUND(ps.total_playtime_seconds / 3600, 2) as hours_played,
    ps.total_runs as sessions,
    ps.highest_floor_ever as best_achievement,
    urp.current_run_number as current_run,
    ps.total_gold_spent as total_invested,
    ps.last_updated as last_session
FROM player_stats ps
INNER JOIN users u ON ps.user_id = u.user_id
INNER JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE
ORDER BY ps.total_playtime_seconds DESC
LIMIT 20;
```

**Propósito:** Identificar a los jugadores más dedicados por tiempo de juego.

#### **vw_player_progression** - Progresión simplificada (MODIFICAR)
```sql
CREATE VIEW vw_player_progression AS
SELECT 
    u.user_id as player_id,
    u.username as player_name,
    u.created_at as registration_date,
    urp.current_run_number as current_run,
    ps.total_runs as sessions_played,
    ps.highest_floor_ever as best_progress,
    urp.total_completed_runs as completed_runs,
    ps.total_kills as combat_experience,
    ps.total_gold_spent as total_spent,
    ps.total_playtime_seconds as total_time_seconds,
    CASE 
        WHEN urp.current_run_number <= 5 THEN 'Newcomer'
        WHEN urp.current_run_number <= 20 THEN 'Regular'
        WHEN urp.current_run_number <= 50 THEN 'Experienced'
        ELSE 'Veteran'
    END as experience_tier
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY u.created_at DESC;
```

**Cambios realizados:**
- ❌ Eliminado `skill_tier` (solo hay 3 floors, no es útil)
- ❌ Eliminado `spending_tier` (no hay lógica válida para no gastar)
- ✅ Mantenido `experience_tier` basado en número de runs (útil)

#### **vw_active_players** - Jugadores activos
```sql
CREATE VIEW vw_active_players AS
SELECT 
    u.username as player_name,
    u.last_login as last_active,
    urp.current_run_number as current_run,
    ps.total_runs as total_sessions,
    ps.total_kills as lifetime_kills,
    ps.total_gold_spent as lifetime_spending,
    ps.highest_floor_ever as best_floor,
    CASE 
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'Active'
        WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'Recent'
        ELSE 'Inactive'
    END as activity_status
FROM users u
LEFT JOIN player_stats ps ON u.user_id = ps.user_id
LEFT JOIN user_run_progress urp ON u.user_id = urp.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY u.last_login DESC;
```

#### **vw_current_games** - Partidas activas
```sql
CREATE VIEW vw_current_games AS
SELECT 
    rh.run_id as game_id,
    u.username as player,
    rh.run_number as run_number,
    rh.started_at as session_start,
    TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) as minutes_playing,
    rh.final_floor as current_level,
    rh.total_kills as current_kills,
    rh.gold_spent as spent_this_run,
    (SELECT gold FROM save_states WHERE user_id = u.user_id AND is_active = TRUE LIMIT 1) as current_gold,
    CASE 
        WHEN TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) <= 30 THEN 'Fresh'
        WHEN TIMESTAMPDIFF(MINUTE, rh.started_at, NOW()) <= 120 THEN 'Active'
        ELSE 'Long Session'
    END as session_duration_type
FROM run_history rh
INNER JOIN users u ON rh.user_id = u.user_id
WHERE rh.ended_at IS NULL
  AND u.is_active = TRUE
  AND u.role = 'player'
ORDER BY rh.started_at;
```

### 2. Nuevas Vistas Útiles (CREAR)

#### **vw_all_bosses_first_run** - Jugadores que mataron los 3 jefes en su primer run
```sql
CREATE VIEW vw_all_bosses_first_run AS
SELECT 
    u.username as player_name,
    u.created_at as registration_date,
    bk_stats.first_run_number,
    bk_stats.bosses_defeated_first_run,
    bk_stats.first_dragon_kill_date,
    CASE 
        WHEN bk_stats.bosses_defeated_first_run >= 3 THEN 'Master Player'
        WHEN bk_stats.bosses_defeated_first_run >= 2 THEN 'Advanced Player'
        WHEN bk_stats.bosses_defeated_first_run >= 1 THEN 'Beginner Player'
        ELSE 'No Bosses Defeated'
    END as skill_classification
FROM users u
INNER JOIN (
    SELECT 
        user_id,
        MIN(run_number) as first_run_number,
        COUNT(*) as bosses_defeated_first_run,
        MIN(killed_at) as first_dragon_kill_date
    FROM boss_kills 
    WHERE run_number = 1  -- Solo primer run
    GROUP BY user_id
    HAVING COUNT(*) >= 3  -- Solo mostrar quien mató los 3 jefes
) bk_stats ON u.user_id = bk_stats.user_id
WHERE u.is_active = TRUE AND u.role = 'player'
ORDER BY bk_stats.first_dragon_kill_date ASC;
```

**Propósito:** Identificar jugadores excepcionales que derrotaron los 3 jefes en su primera partida.

#### **vw_first_permanent_purchases** - Primera compra de mejoras permanentes por tipo
```sql
CREATE VIEW vw_first_permanent_purchases AS
SELECT 
    upgrade_type,
    CASE upgrade_type
        WHEN 'health_max' THEN 'Max Health Upgrade'
        WHEN 'stamina_max' THEN 'Max Stamina Upgrade'
        WHEN 'movement_speed' THEN 'Movement Speed Upgrade'
    END as upgrade_name,
    COUNT(*) as first_time_buyers,
    AVG(first_purchase_run) as avg_first_purchase_run,
    MIN(first_purchase_date) as earliest_purchase,
    MAX(first_purchase_date) as latest_purchase,
    COUNT(*) / (SELECT COUNT(*) FROM users WHERE role = 'player' AND is_active = TRUE) * 100 as adoption_percentage
FROM (
    SELECT 
        ppu.user_id,
        ppu.upgrade_type,
        MIN(urp.current_run_number) as first_purchase_run,
        MIN(ppu.updated_at) as first_purchase_date
    FROM permanent_player_upgrades ppu
    INNER JOIN user_run_progress urp ON ppu.user_id = urp.user_id
    INNER JOIN users u ON ppu.user_id = u.user_id
    WHERE u.is_active = TRUE AND u.role = 'player'
    GROUP BY ppu.user_id, ppu.upgrade_type
) first_purchases
GROUP BY upgrade_type
ORDER BY first_time_buyers DESC;
```

**Propósito:** Analizar qué mejoras permanentes son más populares y cuándo las compran los jugadores por primera vez.

### 3. Vistas Eliminadas (NO IMPLEMENTAR)

- ❌ **vw_leaderboard_floors** - Solo hay 3 floors, no es útil un ranking
- ❌ **vw_leaderboard_bosses** - No aporta información valiosa para desarrolladores
- ❌ **vw_economy_stats** - No implementar
- ❌ **vw_combat_analytics** - No implementar

## API Endpoints Necesarios

### Endpoints Principales

```javascript
// Leaderboards
GET /api/admin/leaderboards/playtime

// Analytics
GET /api/admin/analytics/player-progression
GET /api/admin/analytics/first-run-masters
GET /api/admin/analytics/permanent-upgrades-adoption

// System Status
GET /api/admin/status/active-players
GET /api/admin/status/current-games

// Authentication
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET /api/admin/auth/verify
```

### Implementación de Endpoints

```javascript
// Autenticación administrativa
app.post('/api/admin/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Buscar solo usuarios con role = 'admin'
    const [users] = await connection.execute(
        'SELECT * FROM users WHERE username = ? AND role = "admin" AND is_active = TRUE',
        [username]
    );
    
    if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Admin access denied' });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Crear sesión administrativa
    const sessionToken = generateSecureToken();
    await connection.execute(
        'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
        [user.user_id, sessionToken]
    );
    
    res.json({
        success: true,
        sessionToken,
        user: {
            id: user.user_id,
            username: user.username,
            role: user.role
        }
    });
});

// Verificación de sesión administrativa
const verifyAdminAuth = async (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
        return res.status(401).json({ success: false, message: 'No session token' });
    }
    
    const [sessions] = await connection.execute(`
        SELECT s.*, u.role 
        FROM sessions s 
        INNER JOIN users u ON s.user_id = u.user_id 
        WHERE s.session_token = ? AND s.is_active = TRUE AND s.expires_at > NOW() AND u.role = 'admin'
    `, [sessionToken]);
    
    if (sessions.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid admin session' });
    }
    
    req.adminUser = sessions[0];
    next();
};

// Nuevos endpoints administrativos
app.get('/api/admin/analytics/first-run-masters', verifyAdminAuth, async (req, res) => {
    const [data] = await connection.execute('SELECT * FROM vw_all_bosses_first_run');
    res.json({ success: true, data });
});

app.get('/api/admin/analytics/permanent-upgrades-adoption', verifyAdminAuth, async (req, res) => {
    const [data] = await connection.execute('SELECT * FROM vw_first_permanent_purchases');
    res.json({ success: true, data });
});
```

## Propuesta de Gráficas (Solo Datos Existentes)

### 1. Gráficas de Actividad de Jugadores

**Datos disponibles:**
- `users.last_login` - Última conexión
- `users.created_at` - Fecha de registro
- `run_history.started_at` - Inicio de partidas

**Gráficas propuestas:**

#### **Gráfica 1: Registros vs Actividad Diaria**
```javascript
// Datos: Últimos 30 días
const activityData = {
    labels: ['Day 1', 'Day 2', ..., 'Day 30'],
    datasets: [
        {
            label: 'New Registrations',
            data: [/* COUNT registros por día */],
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)'
        },
        {
            label: 'Active Players',
            data: [/* COUNT last_login por día */],
            borderColor: '#2196F3', 
            backgroundColor: 'rgba(33, 150, 243, 0.1)'
        }
    ]
};
```

#### **Gráfica 2: Distribución de Tiempo de Juego**
```javascript
// Datos: total_playtime_seconds agrupado
const playtimeData = {
    labels: ['< 1h', '1-3h', '3-6h', '6-12h', '12h+'],
    datasets: [{
        label: 'Players by Playtime',
        data: [/* COUNT por rango de horas */],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
};
```

#### **Gráfica 3: Progresión de Runs**
```javascript
// Datos: current_run_number agrupado
const runProgressData = {
    labels: ['Run 1-5', 'Run 6-15', 'Run 16-30', 'Run 30+'],
    datasets: [{
        label: 'Players by Run Experience',
        data: [/* COUNT por rango de runs */],
        backgroundColor: '#FF9F40'
    }]
};
```

### 2. Gráficas de Mejoras Permanentes

#### **Gráfica 4: Adopción de Mejoras Permanentes**
```javascript
// Datos: permanent_player_upgrades agrupado por tipo
const upgradeAdoptionData = {
    labels: ['Health Max', 'Stamina Max', 'Movement Speed'],
    datasets: [{
        label: 'Adoption Rate (%)',
        data: [/* adoption_percentage de vw_first_permanent_purchases */],
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1']
    }]
};
```

### 3. Gráficas de Rendimiento del Juego

#### **Gráfica 5: Duración de Sesiones Activas**
```javascript
// Datos: vw_current_games.minutes_playing
const sessionDurationData = {
    labels: ['Fresh (0-30min)', 'Active (30-120min)', 'Long (120min+)'],
    datasets: [{
        label: 'Current Sessions',
        data: [/* COUNT por session_duration_type */],
        backgroundColor: ['#26C6DA', '#66BB6A', '#FFA726']
    }]
};
```

## Frontend - Panel de Administrador Optimizado

### Estructura de Pestañas Simplificada

```html
<nav class="admin-nav">
    <button class="nav-btn active" data-section="dashboard">📊 Dashboard</button>
    <button class="nav-btn" data-section="analytics">📈 Analytics</button>
    <button class="nav-btn" data-section="players">👥 Players</button>
    <button class="nav-btn" data-section="system">⚙️ System</button>
</nav>
```

### Dashboard Principal

**Métricas clave:**
```html
<div class="dashboard-cards">
    <div class="metric-card">
        <div class="metric-value" id="total-players">-</div>
        <div class="metric-label">Total Players</div>
    </div>
    <div class="metric-card">
        <div class="metric-value" id="active-today">-</div>
        <div class="metric-label">Active Today</div>
    </div>
    <div class="metric-card">
        <div class="metric-value" id="current-games">-</div>
        <div class="metric-label">Live Games</div>
    </div>
    <div class="metric-card">
        <div class="metric-value" id="first-run-masters">-</div>
        <div class="metric-label">First Run Masters</div>
    </div>
</div>
```

### Sección Analytics

**Gráficas implementadas:**
```html
<div class="analytics-section">
    <div class="chart-row">
        <div class="chart-container">
            <h3>Player Activity Trends</h3>
            <canvas id="activity-chart"></canvas>
        </div>
        <div class="chart-container">
            <h3>Playtime Distribution</h3>
            <canvas id="playtime-chart"></canvas>
        </div>
    </div>
    
    <div class="chart-row">
        <div class="chart-container">
            <h3>Permanent Upgrades Adoption</h3>
            <canvas id="upgrades-chart"></canvas>
        </div>
        <div class="chart-container">
            <h3>Run Experience Distribution</h3>
            <canvas id="runs-chart"></canvas>
        </div>
    </div>
</div>
```

### Lógica JavaScript Optimizada

```javascript
class AdminDashboard {
    constructor() {
        this.init();
    }

    async init() {
        if (!this.verifyAdminAccess()) {
            this.redirectToLogin();
            return;
        }
        
        this.setupEventListeners();
        await this.loadDashboardData();
        this.initializeCharts();
    }

    verifyAdminAccess() {
        const sessionToken = localStorage.getItem('adminSessionToken');
        const userRole = localStorage.getItem('userRole');
        
        return sessionToken && userRole === 'admin';
    }

    async loadDashboardData() {
        try {
            // Cargar métricas principales
            const [players, currentGames, firstRunMasters, upgradeStats] = await Promise.all([
                this.getAdminData('/admin/status/active-players'),
                this.getAdminData('/admin/status/current-games'),
                this.getAdminData('/admin/analytics/first-run-masters'),
                this.getAdminData('/admin/analytics/permanent-upgrades-adoption')
            ]);

            this.updateDashboardMetrics({
                totalPlayers: players.length,
                activeToday: players.filter(p => p.activity_status === 'Active').length,
                currentGames: currentGames.length,
                firstRunMasters: firstRunMasters.length
            });

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    initializeCharts() {
        // Solo implementar gráficas con datos existentes
        this.createActivityChart();
        this.createPlaytimeChart();
        this.createUpgradesChart();
        this.createRunsChart();
    }

    async createUpgradesChart() {
        const upgradeData = await this.getAdminData('/admin/analytics/permanent-upgrades-adoption');
        
        new Chart(document.getElementById('upgrades-chart'), {
            type: 'doughnut',
            data: {
                labels: upgradeData.map(u => u.upgrade_name),
                datasets: [{
                    data: upgradeData.map(u => u.adoption_percentage),
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Permanent Upgrades Adoption Rate'
                    }
                }
            }
        });
    }
}

// Inicializar dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
```

## Roadmap de Implementación

### Fase 1: Seguridad y Acceso (Prioritario)
1. ✅ Implementar autenticación administrativa independiente
2. ✅ Configurar acceso solo por URL directa
3. ✅ Verificación de roles en backend

### Fase 2: Vistas de Base de Datos (Desarrollo)
1. ✅ Modificar `vw_player_progression` (eliminar skill_tier y spending_tier)
2. ✅ Crear `vw_all_bosses_first_run`
3. ✅ Crear `vw_first_permanent_purchases`
4. ✅ Validar vistas existentes: `vw_leaderboard_playtime`, `vw_active_players`, `vw_current_games`

### Fase 3: API y Frontend (Implementación)
1. ✅ Crear endpoints administrativos con autenticación
2. ✅ Implementar gráficas con Chart.js
3. ✅ Dashboard optimizado con métricas relevantes

### Fase 4: Testing y Optimización
1. ✅ Pruebas de seguridad del acceso administrativo
2. ✅ Optimización de consultas SQL
3. ✅ Testing de gráficas en tiempo real

## Resultado Final

### Métricas Útiles para Desarrolladores:
- **Jugadores excepcionales**: Quién derrotó los 3 jefes en el primer run
- **Adopción de features**: Qué mejoras permanentes prefieren los jugadores
- **Retención**: Tiempo de juego y frecuencia de conexión
- **Actividad en vivo**: Partidas activas y duración de sesiones

### Características de Seguridad:
- **Acceso restringido**: Solo por URL directa
- **Autenticación robusta**: Verificación de roles en backend
- **Sesiones administrativas**: Tokens específicos para admins

### Datos Basados en Realidad:
- **Sin métricas artificiales**: Solo datos reales del juego
- **Análisis práctico**: Información útil para tomar decisiones
- **Gráficas relevantes**: Visualizaciones con datos existentes

Este sistema de administrador optimizado provee exactamente la información que necesitas para entender cómo los jugadores interactúan con tu juego, sin funcionalidades innecesarias y con máxima seguridad. 