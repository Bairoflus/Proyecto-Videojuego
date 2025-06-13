# Shattered Timeline API v2.0

REST API for the Shattered Timeline videogame built with Express.js, MySQL, and bcrypt for authentication.

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Database `dbshatteredtimeline` created and configured

### Installation & Setup

1. **Install dependencies:**
   ```bash
   cd videogame/api
   npm install
   ```

2. **Configure database connection:**
   - Edit `app.js` lines 18-23 to match your MySQL settings:
   ```javascript
   const dbConfig = {
     host: 'localhost',
     user: 'tc2005b',
     password: 'qwer1234',
     database: 'dbshatteredtimeline'
   };
   ```

3. **Start the server:**
   ```bash
   npm start
   # or
   node app.js
   ```

4. **Verify server is running:**
   - API will be available at: `http://localhost:3000`
   - Test endpoint: `http://localhost:3000/` should return server info

## API Endpoints

### Authentication

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `POST` | `/api/auth/register` | Register new user account | `src/pages/js/register.js` - User registration form |
| `POST` | `/api/auth/login` | Authenticate user and create session | `src/pages/js/login.js` - Login form |
| `POST` | `/api/auth/logout` | Invalidate user session | `src/utils/api.js` - enhancedLogout() function |

### User Management

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/users/:userId/settings` | Get user audio/display settings | `src/classes/game/Game.js` - loadGameSettings() |
| `PUT` | `/api/users/:userId/settings` | Update user audio/display settings | `src/classes/game/Game.js` - saveGameSettings() |
| `GET` | `/api/users/:userId/stats` | Get basic user statistics | `src/utils/api.js` - getUserStats() |
| `GET` | `/api/users/:userId/complete-stats` | Get complete historical statistics | `src/classes/game/Game.js` - loadStatsData() |
| `GET` | `/api/users/:userId/current-run` | Get current active run stats | `src/classes/game/Game.js` - loadStatsData() |

### Game Run Management

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `POST` | `/api/runs` | Create new game run | `src/classes/game/FloorGenerator.js` - nextFloor() |
| `PUT` | `/api/runs/:runId/complete` | Mark run as completed/ended | `src/classes/entities/Player.js` - die() method |
| `PUT` | `/api/runs/:runId/stats` | Update run statistics (kills, damage) | `src/classes/game/Game.js` - syncRunStatsWithBackend() |

### Combat & Events

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `POST` | `/api/runs/:runId/enemy-kill` | Register enemy elimination | `src/classes/entities/Enemy.js` - die() method |
| `POST` | `/api/runs/:runId/boss-kill` | Register boss elimination | `src/classes/entities/Boss.js` - die() method |
| `POST` | `/api/runs/:runId/weapon-purchase` | Register weapon upgrade purchase | `src/classes/entities/Shop.js` - purchaseUpgrade() |

### Permanent Upgrades

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/users/:userId/permanent-upgrades` | Get user's permanent upgrades | `src/classes/game/Game.js` - initializeManagers() |
| `POST` | `/api/users/:userId/permanent-upgrade` | Apply new permanent upgrade | `src/classes/ui/PermanentUpgradePopup.js` |

### Weapon Upgrades (Temporary)

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/users/:userId/weapon-upgrades/:runId` | Get current run weapon levels | `src/utils/weaponUpgradeManager.js` |
| `PUT` | `/api/users/:userId/weapon-upgrades/:runId` | Update weapon levels for run | `src/utils/weaponUpgradeManager.js` |
| `DELETE` | `/api/users/:userId/weapon-upgrades/:runId` | Reset weapon upgrades (on death) | `src/utils/weaponUpgradeManager.js` |

### Save State Management

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/users/:userId/save-state` | Get saved game state | `src/utils/saveStateManager.js` - loadSaveState() |
| `POST` | `/api/users/:userId/save-state` | Save current game state | `src/utils/saveStateManager.js` - saveCurrentState() |
| `DELETE` | `/api/users/:userId/save-state` | Clear save state (on death) | `src/utils/saveStateManager.js` - clearSaveState() |

### Leaderboards & Analytics

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/leaderboards/:type` | Get leaderboards (floors/bosses/playtime) | Available for future implementation |
| `GET` | `/api/analytics/economy` | Get economy analytics data | Available for future implementation |
| `GET` | `/api/analytics/player-progression` | Get player progression analytics | Available for future implementation |

### Server Status

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/status/active-players` | Get currently active players | Available for future implementation |
| `GET` | `/api/status/current-games` | Get ongoing game sessions | Available for future implementation |

### Enhanced v3.0 Endpoints

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/users/:userId/run-progress` | Get user run progress (persistent counter) | `src/classes/game/FloorGenerator.js` |
| `GET` | `/api/users/:userId/current-run-info` | Get current run information | `src/utils/api.js` - getCurrentRunInfo() |
| `GET` | `/api/users/:userId/initialization-data` | Get complete player initialization data | `src/classes/game/Game.js` - initializeManagers() |
| `GET` | `/api/users/:userId/active-weapon-upgrades` | Get only active weapon upgrades | `src/utils/api.js` - getActiveWeaponUpgrades() |

### Admin Panel Endpoints

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `POST` | `/api/admin/auth/login` | Admin authentication | `src/pages/html/admin.html` |
| `POST` | `/api/admin/auth/logout` | Admin logout | `src/pages/html/admin.html` |
| `GET` | `/api/admin/auth/verify` | Verify admin session | `src/pages/html/admin.html` |
| `GET` | `/api/admin/debug/users` | Debug user information | `src/pages/html/admin.html` |
| `GET` | `/api/admin/leaderboards/playtime` | Admin playtime leaderboard | `src/pages/html/admin.html` |
| `GET` | `/api/admin/analytics/player-progression` | Admin player progression data | `src/pages/html/admin.html` |
| `GET` | `/api/admin/status/active-players` | Admin active players view | `src/pages/html/admin.html` |
| `GET` | `/api/admin/status/current-games` | Admin current games monitoring | `src/pages/html/admin.html` |
| `GET` | `/api/admin/analytics/permanent-upgrades-adoption` | Permanent upgrade adoption rates | `src/pages/html/admin.html` |

### Admin Chart Data Endpoints

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| `GET` | `/api/admin/charts/activity-trends` | Daily activity trends (registrations/logins) | `src/pages/html/admin.html` |
| `GET` | `/api/admin/charts/playtime-distribution` | Player playtime distribution | `src/pages/html/admin.html` |
| `GET` | `/api/admin/charts/run-experience` | Run experience distribution | `src/pages/html/admin.html` |
| `GET` | `/api/admin/charts/session-duration` | Session duration distribution | `src/pages/html/admin.html` |
| `GET` | `/api/admin/charts/upgrade-adoption` | Upgrade adoption chart data | `src/pages/html/admin.html` |

## Frontend Integration

### Main API Client
- **File:** `src/utils/api.js`
- **Base URL:** `http://localhost:3000/api`
- **Error Handling:** Centralized error handling with try-catch blocks
- **Response Format:** Standardized `{success: boolean, data?: any, message?: string}` format

### Key Frontend Files Using API

1. **Game Core:** `src/classes/game/Game.js`
   - Player initialization, settings, statistics
   - Run management and completion
   - Auto-save functionality

2. **Authentication:** `src/pages/js/login.js`, `src/pages/js/register.js`
   - User registration and login flows
   - Session management

3. **Game State Management:**
   - `src/utils/saveStateManager.js` - Save/load game progress
   - `src/utils/weaponUpgradeManager.js` - Temporary weapon upgrades
   - `src/classes/game/FloorGenerator.js` - Run progression

4. **Game Events:**
   - `src/classes/entities/Enemy.js` - Enemy kill tracking
   - `src/classes/entities/Boss.js` - Boss kill tracking
   - `src/classes/entities/Shop.js` - Purchase tracking

5. **Admin Dashboard:** `src/pages/html/admin.html`
   - Administrative analytics and monitoring

## Database Configuration

The API connects to MySQL database `dbshatteredtimeline` with the following structure:

- **Authentication:** `users`, `sessions`
- **Game State:** `save_states`, `user_run_progress`, `permanent_player_upgrades`, `weapon_upgrades_temp`
- **Analytics:** `player_stats`, `run_history`, `enemy_kills`, `boss_kills`, `weapon_upgrade_purchases`
- **Configuration:** `player_settings`

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **Session Management:** UUID-based session tokens with expiration
- **Role-Based Access:** Player and admin role differentiation
- **CORS Configuration:** Development-friendly CORS setup
- **Admin Protection:** Admin endpoints require session verification

## Development Notes

- **Port:** 3000 (configurable in `app.js`)
- **Database Engine:** InnoDB for referential integrity
- **Character Set:** utf8mb4 for full Unicode support
- **Connection Pooling:** mysql2 with promise support
- **Error Logging:** Console-based error logging for development

## Related Files

- **Database Schema:** `../database/dbshatteredtimeline.sql`
- **Database Objects:** `../database/objects.sql`
- **Admin Setup:** `../database/admin_user_setup.sql`
- **Frontend API Client:** `../src/utils/api.js` 