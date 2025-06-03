# API - Project Shattered Timeline

## Description
REST API for the Project Shattered Timeline video game. This API handles authentication operations, user management, player statistics, and game run management.

## Requirements
- Node.js
- MySQL Server
- npm

## Installation
```bash
npm install
```

## Database Configuration
The API connects to a MySQL database with the following credentials:
- **Host**: localhost
- **User**: tc2005b
- **Password**: qwer1234
- **Database**: ProjectShatteredTimeline
- **Port**: 3306

## Running the Server
```bash
node app.js
```
The server will run on port 3000.

## API Structure
All code is contained in a single `app.js` file following the MVP (Minimum Viable Product) pattern.

## Available Endpoints

### POST /api/auth/register
Registers a new user in the system.

**URL**: `/api/auth/register`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Success Response** (201 Created):
```json
{
  "userId": 1,
  "message": "User registered successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Missing fields:
```json
{
  "message": "All fields are required: username, email, password"
}
```

- **409 Conflict** - Duplicate user or email:
```json
{
  "message": "Username or email already exists"
}
```

- **500 Internal Server Error** - Database error:
```json
{
  "message": "Error registering user"
}
```

### POST /api/auth/login
Authenticates a user and creates a new session.

**URL**: `/api/auth/login`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response** (200 OK):
```json
{
  "userId": 123,
  "sessionToken": "uuid-string"
}
```

**Error Responses**:

- **400 Bad Request** - Missing fields:
```
Missing email or password
```

- **404 Not Found** - Invalid credentials:
```
Invalid credentials
```

- **500 Internal Server Error** - Database error:
```
Database error
```

### POST /api/auth/logout
Invalidates a user session.

**URL**: `/api/auth/logout`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "sessionToken": "uuid-string"
}
```

**Success Response** (204 No Content):
```
(empty response body)
```

**Error Responses**:

- **400 Bad Request** - Missing session token:
```
Missing sessionToken
```

- **500 Internal Server Error** - Database error:
```
Database error
```

### GET /api/users/:userId/stats
Retrieves player statistics for a specific user.

**URL**: `/api/users/{userId}/stats`

**Method**: `GET`

**Parameters**:
- `userId` (path parameter) - The ID of the user whose stats to retrieve

**Example URL**:
```
/api/users/123/stats
```

**Success Response** (200 OK):
```json
{
  "user_id": 123,
  "games_played": 15,
  "wins": 8,
  "losses": 7,
  "total_score": 45600,
  "highest_score": 8900,
  "total_playtime_minutes": 240,
  "last_played_at": "2024-01-15 14:30:00"
}
```

**Error Responses**:

- **404 Not Found** - No stats found for user:
```
Stats not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

### POST /api/runs
Creates a new game run for a specific user.

**URL**: `/api/runs`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123
}
```

**Success Response** (201 Created):
```json
{
  "runId": 15,
  "startedAt": "2025-05-30T20:33:33.000Z"
}
```

**Error Responses**:

- **400 Bad Request** - Missing userId:
```
Missing userId
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the user interface and should **ONLY** be called internally by the game logic in the following scenarios:

1. **When a player logs in successfully** - Automatically creates a new run
2. **When a player dies** - Records the death event
3. **When a player successfully completes all floors** - Records successful completion

**Integration Points**:
- `videogame/src/pages/js/login.js` - Called on successful login
- `videogame/src/classes/entities/Player.js` - Called in `die()` method
- `videogame/src/classes/game/FloorGenerator.js` - Called in `nextFloor()` when completing all floors

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'
```

### POST /api/runs/:runId/save-state
Saves the current state of an active game run.

**URL**: `/api/runs/{runId}/save-state`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
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

**Success Response** (201 Created):
```json
{
  "saveId": 789
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, sessionId, roomId, currentHp, currentStamina, gold
```

- **400 Bad Request** - Invalid field types:
```
Invalid field types: userId, sessionId, roomId, currentHp, currentStamina, gold must be integers
```

- **400 Bad Request** - Invalid HP/Stamina range:
```
Invalid range: currentHp and currentStamina must be between 0 and 32767
```

- **400 Bad Request** - Invalid room:
```
Invalid roomId: room does not exist
```

- **400 Bad Request** - Invalid session:
```
Invalid sessionId: session does not exist
```

- **404 Not Found** - Run not found or inactive:
```
Run not found or run is not active
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When saving game progress
2. **After run creation** - Only for active runs (ended_at IS NULL AND completed = FALSE)
3. **Before run completion/death** - Cannot save state for finished runs
4. **With valid game data** - Must reference existing rooms and sessions

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**save_states table**:
```sql
CREATE TABLE save_states (
  save_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  current_hp SMALLINT,      -- Range: 0-32767
  current_stamina SMALLINT, -- Range: 0-32767  
  gold INT,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

**Validation Logic**:
1. **Run Active Check**: `SELECT run_id FROM run_history WHERE run_id = ? AND ended_at IS NULL AND completed = FALSE`
2. **Room Exists Check**: `SELECT room_id FROM rooms WHERE room_id = ?`
3. **Session Exists Check**: `SELECT session_id FROM sessions WHERE session_id = ?`
4. **Data Type Validation**: All fields must be integers
5. **Range Validation**: HP and stamina must be 0-32767 (SMALLINT range)

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/save-state \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "sessionId": 456,
    "roomId": 1,
    "currentHp": 85,
    "currentStamina": 45,
    "gold": 150
  }'
```

**Integration Points**:
- `videogame/src/utils/api.js` - `saveRunState()` function
- `videogame/src/pages/html/admin-test-save-state.html` - Development testing only (not linked from landing)

**Data Flow**:
1. Player progresses through game
2. Game reaches save point (room transition, significant event)
3. Frontend calls `saveRunState()` with current game state
4. API validates run is active and all foreign keys exist
5. State saved to `save_states` table with timestamp
6. Returns `saveId` for confirmation

### POST /api/runs/:runId/enemy-kill
Registers an enemy kill event during an active game run.

**URL**: `/api/runs/{runId}/enemy-kill`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "enemyId": 1,
  "roomId": 2
}
```

**Success Response** (201 Created):
```json
{
  "killId": 456,
  "message": "Enemy kill registered"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, enemyId, roomId
```

- **400 Bad Request** - Invalid field types:
```
Invalid field types: userId, enemyId, roomId, runId must be integers
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Enemy type not found:
```
Enemy type not found
```

- **404 Not Found** - Room not found:
```
Room not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When an enemy is killed by the player
2. **For active runs only** - Cannot register kills for completed runs
3. **With valid game data** - Must reference existing enemies, rooms, and runs
4. **By the run owner** - userId must match the run's user_id

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**enemy_kills table**:
```sql
CREATE TABLE enemy_kills (
  kill_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  enemy_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (enemy_id) REFERENCES enemy_types(enemy_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Enemy Exists Check**: `SELECT enemy_id FROM enemy_types WHERE enemy_id = ?`
5. **Room Exists Check**: `SELECT room_id FROM rooms WHERE room_id = ?`
6. **Data Type Validation**: All fields must be integers

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/enemy-kill \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "enemyId": 1,
    "roomId": 2
  }'
```

**Integration Points**:
- Should be integrated with enemy death logic in the game engine
- Called when `Enemy.die()` method is triggered
- Tracks kill statistics for player progress and achievements

**Data Flow**:
1. Player kills an enemy during gameplay
2. Game engine detects enemy death
3. Frontend calls this endpoint with kill details
4. API validates run ownership and entity existence
5. Kill registered in `enemy_kills` table with timestamp
6. Returns `killId` for confirmation/tracking

### POST /api/runs/:runId/chest-event
Registers a chest opening event during an active game run.

**URL**: `/api/runs/{runId}/chest-event`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "roomId": 2,
  "goldReceived": 120
}
```

**Success Response** (201 Created):
```json
{
  "eventId": 456,
  "message": "Chest event registered"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, roomId, goldReceived
```

- **400 Bad Request** - Invalid field types:
```
Invalid field types: userId, roomId, goldReceived, runId must be integers
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Room not found:
```
Room not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When a chest is opened by the player
2. **For active runs only** - Cannot register chest events for completed runs
3. **With valid game data** - Must reference existing rooms and runs
4. **By the run owner** - userId must match the run's user_id

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**chest_events table**:
```sql
CREATE TABLE chest_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  gold_received INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Room Exists Check**: `SELECT room_id FROM rooms WHERE room_id = ?`
5. **Data Type Validation**: All fields must be integers

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/chest-event \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "roomId": 2,
    "goldReceived": 120
  }'
```

**Integration Points**:
- Should be integrated with chest opening logic in the game engine
- Called when player opens a chest in a room
- Tracks treasure collection for player progress and statistics

**Data Flow**:
1. Player opens a chest during gameplay
2. Game engine calculates gold received
3. Frontend calls this endpoint with chest details
4. API validates run ownership and entity existence
5. Chest event registered in `chest_events` table with timestamp
6. Returns `eventId` for confirmation/tracking

### POST /api/runs/:runId/shop-purchase
Registers a shop purchase event during an active game run.

**URL**: `/api/runs/{runId}/shop-purchase`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "roomId": 2,
  "itemType": "health_potion",
  "itemName": "Health Potion",
  "goldSpent": 80
}
```

**Success Response** (201 Created):
```json
{
  "purchaseId": 456,
  "message": "Shop purchase registered"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, roomId, itemType, itemName, goldSpent
```

- **400 Bad Request** - Invalid integer field types:
```
Invalid field types: userId, roomId, goldSpent, runId must be integers
```

- **400 Bad Request** - Invalid string field types:
```
Invalid field types: itemType and itemName must be strings
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Room not found:
```
Room not found
```

- **404 Not Found** - Item type not found:
```
Item type not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When a shop purchase is made by the player
2. **For active runs only** - Cannot register purchases for completed runs
3. **With valid game data** - Must reference existing rooms, runs, and item types
4. **By the run owner** - userId must match the run's user_id

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**shop_purchases table**:
```sql
CREATE TABLE shop_purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  item_name VARCHAR(50),
  gold_spent INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  FOREIGN KEY (item_type) REFERENCES item_types(item_type)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Room Exists Check**: `SELECT room_id FROM rooms WHERE room_id = ?`
5. **Item Type Exists Check**: `SELECT item_type FROM item_types WHERE item_type = ?`
6. **Data Type Validation**: Integers for userId, roomId, goldSpent, runId; strings for itemType, itemName

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/shop-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "roomId": 2,
    "itemType": "health_potion",
    "itemName": "Health Potion",
    "goldSpent": 80
  }'
```

**Integration Points**:
- Should be integrated with shop transaction logic in the game engine
- Called when player purchases items from shop NPCs or interfaces
- Tracks spending patterns for player progress and economy balancing

**Data Flow**:
1. Player makes purchase in shop during gameplay
2. Game engine processes transaction and item acquisition
3. Frontend calls this endpoint with purchase details
4. API validates run ownership and entity existence
5. Purchase registered in `shop_purchases` table with timestamp
6. Returns `purchaseId` for confirmation/tracking

### POST /api/runs/:runId/boss-encounter
Registers a boss encounter event during an active game run.

**URL**: `/api/runs/{runId}/boss-encounter`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "enemyId": 100,
  "damageDealt": 120,
  "damageTaken": 30,
  "resultCode": "victory"
}
```

**Success Response** (201 Created):
```json
{
  "encounterId": 456,
  "message": "Boss encounter registered"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, enemyId, damageDealt, damageTaken, resultCode
```

- **400 Bad Request** - Invalid integer field types:
```
Invalid field types: userId, enemyId, damageDealt, damageTaken, runId must be integers
```

- **400 Bad Request** - Invalid string field types:
```
Invalid field types: resultCode must be string
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Boss not found:
```
Boss not found
```

- **404 Not Found** - Result code not found:
```
Result code not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When a boss encounter occurs
2. **For active runs only** - Cannot register encounters for completed runs
3. **With valid game data** - Must reference existing runs, bosses, and result codes
4. **By the run owner** - userId must match the run's user_id

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**boss_encounters table**:
```sql
CREATE TABLE boss_encounters (
  encounter_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  enemy_id INT NOT NULL,
  run_id INT NOT NULL,
  damage_dealt INT,
  damage_taken INT,
  result_code VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (enemy_id) REFERENCES boss_details(enemy_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (result_code) REFERENCES boss_results(result_code)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Boss Exists Check**: `SELECT enemy_id FROM boss_details WHERE enemy_id = ?`
5. **Result Code Exists Check**: `SELECT result_code FROM boss_results WHERE result_code = ?`
6. **Data Type Validation**: Integers for userId, enemyId, damageDealt, damageTaken, runId; string for resultCode

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/boss-encounter \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "enemyId": 100,
    "damageDealt": 120,
    "damageTaken": 30,
    "resultCode": "victory"
  }'
```

**Integration Points**:
- Should be integrated with boss combat mechanics in the game engine
- Called when player engages in combat with boss enemies
- Tracks combat statistics for player progress and boss difficulty balancing

**Data Flow**:
1. Player encounters a boss during gameplay
2. Combat system processes the encounter
3. Frontend calls this endpoint with encounter details
4. API validates run ownership and entity existence
5. Encounter registered in `boss_encounters` table with timestamp
6. Returns `encounterId` for confirmation/tracking

### POST /api/runs/:runId/upgrade-purchase
Registers a permanent upgrade purchase during an active game run.

**URL**: `/api/runs/{runId}/upgrade-purchase`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "upgradeType": "max_health",
  "levelBefore": 1,
  "levelAfter": 2,
  "goldSpent": 200
}
```

**Success Response** (201 Created):
```json
{
  "purchaseId": 456,
  "message": "Upgrade purchase registered"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, upgradeType, levelBefore, levelAfter, goldSpent
```

- **400 Bad Request** - Invalid integer field types:
```
Invalid field types: userId, levelBefore, levelAfter, goldSpent, runId must be integers
```

- **400 Bad Request** - Invalid string field types:
```
Invalid field types: upgradeType must be string
```

- **400 Bad Request** - Business logic validation:
```
Invalid upgrade: levelAfter must be greater than levelBefore
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Upgrade type not found:
```
Upgrade type not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When a permanent upgrade is purchased
2. **For active runs only** - Cannot register purchases for completed runs
3. **With valid game data** - Must reference existing runs and upgrade types
4. **By the run owner** - userId must match the run's user_id
5. **With valid upgrade progression** - levelAfter must be greater than levelBefore

**Database Schema Requirements**:
The endpoint validates against the actual database schema and performs dual operations:

**permanent_upgrade_purchases table** (INSERT):
```sql
CREATE TABLE permanent_upgrade_purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_id INT NOT NULL,
  upgrade_type VARCHAR(50) NOT NULL,
  level_before SMALLINT,
  level_after SMALLINT,
  gold_spent INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (upgrade_type) REFERENCES upgrade_types(upgrade_type)
);
```

**player_upgrades table** (UPSERT):
```sql
CREATE TABLE player_upgrades (
  user_id INT NOT NULL,
  upgrade_type VARCHAR(50) NOT NULL,
  level SMALLINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, upgrade_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (upgrade_type) REFERENCES upgrade_types(upgrade_type)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Upgrade Type Exists Check**: `SELECT upgrade_type FROM upgrade_types WHERE upgrade_type = ?`
5. **Business Logic Check**: Validates `levelAfter > levelBefore`
6. **Data Type Validation**: Integers for userId, levelBefore, levelAfter, goldSpent, runId; string for upgradeType

**Database Operations**:
1. **Purchase Record**: `INSERT INTO permanent_upgrade_purchases (...) VALUES (...)`
2. **Player Upgrade**: `INSERT INTO player_upgrades (...) VALUES (...) ON DUPLICATE KEY UPDATE level = VALUES(level), updated_at = NOW()`

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/upgrade-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "upgradeType": "max_health",
    "levelBefore": 1,
    "levelAfter": 2,
    "goldSpent": 200
  }'
```

**Integration Points**:
- Should be integrated with permanent upgrade shop mechanics
- Called when player purchases permanent upgrades that persist between runs
- Tracks upgrade progression and spending for character development

**Data Flow**:
1. Player purchases permanent upgrade during gameplay
2. Game engine processes upgrade transaction
3. Frontend calls this endpoint with upgrade details
4. API validates run ownership and entity existence
5. Purchase recorded in `permanent_upgrade_purchases` table
6. Player's upgrade level updated/inserted in `player_upgrades` table
7. Returns `purchaseId` for confirmation/tracking

### POST /api/runs/:runId/equip-weapon
Equips a weapon in a specific slot during an active game run.

**URL**: `/api/runs/{runId}/equip-weapon`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "slotType": "primary"
}
```

**Success Response** (201 Created):
```json
{
  "message": "Weapon equipped for run"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, slotType
```

- **400 Bad Request** - Invalid integer field types:
```
Invalid field types: userId, runId must be integers
```

- **400 Bad Request** - Invalid string field types:
```
Invalid field types: slotType must be string
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Weapon slot type not found:
```
Weapon slot type not found
```

- **409 Conflict** - Weapon already equipped in slot:
```
Weapon already equipped for this slot in this run
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When a weapon is equipped by the player
2. **For active runs only** - Cannot equip weapons for completed runs
3. **With valid game data** - Must reference existing runs and weapon slot types
4. **By the run owner** - userId must match the run's user_id
5. **No duplicates** - Cannot equip multiple weapons in the same slot for the same run

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**equipped_weapons table**:
```sql
CREATE TABLE equipped_weapons (
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  slot_type VARCHAR(50) NOT NULL,
  PRIMARY KEY (run_id, user_id, slot_type),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (slot_type) REFERENCES weapon_slots(slot_type)
);
```

**weapon_slots table** (lookup):
```sql
CREATE TABLE weapon_slots (
  slot_type VARCHAR(50) NOT NULL,
  PRIMARY KEY (slot_type)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Slot Type Exists Check**: `SELECT slot_type FROM weapon_slots WHERE slot_type = ?`
5. **Data Type Validation**: Integers for userId, runId; string for slotType
6. **Uniqueness**: Primary key constraint prevents duplicate equipment for same (run_id, user_id, slot_type)

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/equip-weapon \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "slotType": "primary"
  }'
```

**Integration Points**:
- Should be integrated with weapon selection and equipment mechanics
- Called when player chooses and equips weapons at run start or during gameplay
- Tracks weapon loadout for each run

**Data Flow**:
1. Player selects weapon to equip during gameplay
2. Game engine processes weapon selection
3. Frontend calls this endpoint with equipment details
4. API validates run ownership and entity existence
5. Equipment recorded in `equipped_weapons` table
6. Returns confirmation message for UI feedback

### POST /api/runs/:runId/weapon-upgrade
Saves temporary weapon upgrade progress during an active game run.

**URL**: `/api/runs/{runId}/weapon-upgrade`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "userId": 123,
  "slotType": "primary",
  "level": 2,
  "damagePerUpgrade": 15,
  "goldCostPerUpgrade": 100
}
```

**Success Response** (201 Created):
```json
{
  "message": "Weapon upgrade saved",
  "runId": 123,
  "userId": 123,
  "slotType": "primary"
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade
```

- **400 Bad Request** - Invalid integer field types:
```
Invalid field types: userId, level, damagePerUpgrade, goldCostPerUpgrade, runId must be integers
```

- **400 Bad Request** - Invalid string field types:
```
Invalid field types: slotType must be string
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **404 Not Found** - Weapon slot type not found:
```
Weapon slot type not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When weapon upgrades are being saved/updated
2. **For active runs only** - Cannot save upgrades for completed runs
3. **With valid game data** - Must reference existing runs and weapon slot types
4. **By the run owner** - userId must match the run's user_id
5. **UPSERT functionality** - Updates existing upgrades or creates new ones

**Database Schema Requirements**:
The endpoint validates against the actual database schema and uses UPSERT functionality:

**weapon_upgrades_temp table**:
```sql
CREATE TABLE weapon_upgrades_temp (
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  slot_type VARCHAR(50) NOT NULL,
  level SMALLINT,
  damage_per_upgrade SMALLINT,
  gold_cost_per_upgrade SMALLINT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id, user_id, slot_type),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (slot_type) REFERENCES weapon_slots(slot_type)
);
```

**weapon_slots table** (lookup):
```sql
CREATE TABLE weapon_slots (
  slot_type VARCHAR(50) NOT NULL,
  PRIMARY KEY (slot_type)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Slot Type Exists Check**: `SELECT slot_type FROM weapon_slots WHERE slot_type = ?`
5. **Data Type Validation**: Integers for userId, level, damagePerUpgrade, goldCostPerUpgrade, runId; string for slotType
6. **UPSERT Operation**: `INSERT ... ON DUPLICATE KEY UPDATE` for seamless save/update

**UPSERT Functionality**:
```sql
INSERT INTO weapon_upgrades_temp (run_id, user_id, slot_type, level, damage_per_upgrade, gold_cost_per_upgrade) 
VALUES (?, ?, ?, ?, ?, ?) 
ON DUPLICATE KEY UPDATE 
  level = VALUES(level), 
  damage_per_upgrade = VALUES(damage_per_upgrade), 
  gold_cost_per_upgrade = VALUES(gold_cost_per_upgrade), 
  timestamp = NOW()
```

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/weapon-upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "slotType": "primary",
    "level": 2,
    "damagePerUpgrade": 15,
    "goldCostPerUpgrade": 100
  }'
```

**Integration Points**:
- Should be integrated with weapon upgrade mechanics during gameplay
- Called when player invests in temporary weapon improvements
- Tracks upgrade progression and costs for run-specific weapon enhancement
- Automatically saves or updates existing upgrades for the same weapon slot

**Data Flow**:
1. Player upgrades weapon during gameplay
2. Game engine calculates new upgrade values
3. Frontend calls this endpoint with upgrade details
4. API validates run ownership and entity existence
5. Upgrade saved/updated in `weapon_upgrades_temp` table with timestamp
6. Returns confirmation with run, user, and slot details

### GET /api/rooms
Retrieves all rooms from the database ordered by floor and sequence order.

**URL**: `/api/rooms`

**Method**: `GET`

**Headers**:
```
Content-Type: application/json
```

**Body**: None required

**Success Response** (200 OK):
```json
[
  {
    "room_id": 1,
    "floor": 1,
    "name": "Entrance Room",
    "room_type": "entrance",
    "sequence_order": 1
  },
  {
    "room_id": 2,
    "floor": 1,
    "name": "Combat Room 1",
    "room_type": "combat",
    "sequence_order": 2
  }
]
```

**Error Responses**:

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Information**:
This endpoint is **read-only** and can be safely called from any part of the application:

1. **Frontend initialization** - Load room data for game setup
2. **Game map generation** - Display available rooms and sequences
3. **Navigation systems** - Room-to-room movement logic
4. **Admin interfaces** - Room management and editing tools
5. **No authentication required** - Public endpoint for game data

**Database Schema Requirements**:
The endpoint queries the rooms table:

**rooms table**:
```sql
CREATE TABLE rooms (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  floor INT,
  name VARCHAR(50),
  room_type VARCHAR(50) NOT NULL,
  sequence_order SMALLINT,
  FOREIGN KEY (room_type) REFERENCES room_types(room_type)
);
```

**Query Logic**:
```sql
SELECT room_id, floor, name, room_type, sequence_order 
FROM rooms 
ORDER BY floor ASC, sequence_order ASC
```

**Response Details**:
- **room_id**: Unique identifier for the room
- **floor**: Floor number where the room is located
- **name**: Display name of the room
- **room_type**: Type classification (entrance, combat, shop, boss, etc.)
- **sequence_order**: Order within the floor for progression logic

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/rooms
```

**Integration Points**:
- Room layout generation for game maps
- Navigation and progression systems
- Game state initialization
- Level design and room sequence planning

**Data Flow**:
1. Frontend requests room data on game initialization
2. API queries all rooms with proper ordering
3. Returns complete room array for frontend use
4. Frontend uses data for map generation and navigation

### GET /api/enemies
Retrieves all enemy types from the database with their complete stats and information.

**URL**: `/api/enemies`

**Method**: `GET`

**Headers**:
```
Content-Type: application/json
```

**Body**: None required

**Success Response** (200 OK):
```json
[
  {
    "enemy_id": 100,
    "name": "Shadow Lord",
    "floor": 1,
    "is_rare": 0,
    "base_hp": 1000,
    "base_damage": 100,
    "movement_speed": 30,
    "attack_cooldown_seconds": 2,
    "attack_range": 50,
    "sprite_url": null
  },
  {
    "enemy_id": 101,
    "name": "Fire Dragon",
    "floor": 2,
    "is_rare": 0,
    "base_hp": 2000,
    "base_damage": 150,
    "movement_speed": 40,
    "attack_cooldown_seconds": 3,
    "attack_range": 70,
    "sprite_url": null
  }
]
```

**Error Responses**:

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Information**:
This endpoint is **read-only** and can be safely called from any part of the application:

1. **Game initialization** - Load enemy data for combat systems
2. **Enemy catalog** - Display available enemy types and stats
3. **Combat mechanics** - Enemy stats for damage calculations
4. **Level design** - Enemy placement and difficulty balancing
5. **Admin interfaces** - Enemy management and editing tools
6. **No authentication required** - Public endpoint for game data

**Database Schema Requirements**:
The endpoint queries the enemy_types table:

**enemy_types table**:
```sql
CREATE TABLE enemy_types (
  enemy_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  floor INT,
  is_rare BOOLEAN DEFAULT FALSE,
  base_hp SMALLINT,
  base_damage SMALLINT,
  movement_speed SMALLINT,
  attack_cooldown_seconds SMALLINT,
  attack_range SMALLINT,
  sprite_url VARCHAR(255)
);
```

**Query Logic**:
```sql
SELECT enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url 
FROM enemy_types
```

**Response Details**:
- **enemy_id**: Unique identifier for the enemy type
- **name**: Display name of the enemy
- **floor**: Floor where this enemy appears
- **is_rare**: Boolean flag for rare enemy types (0/1)
- **base_hp**: Base health points of the enemy
- **base_damage**: Base damage the enemy deals
- **movement_speed**: Movement speed stat
- **attack_cooldown_seconds**: Time between attacks in seconds
- **attack_range**: Attack range in game units
- **sprite_url**: URL to the enemy sprite image (may be null)

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/enemies
```

**Integration Points**:
- Combat system initialization and enemy spawning
- Enemy stats display and information panels
- Game balance and difficulty scaling
- Enemy catalog and bestiary features
- Level design and enemy placement tools

**Data Flow**:
1. Frontend requests enemy data for game systems
2. API queries all enemy types with complete stats
3. Returns enemy catalog for frontend use
4. Frontend uses data for combat, display, and game mechanics

### GET /api/bosses
Retrieves all boss types from the database with their moves, stats, and complete information.

**URL**: `/api/bosses`

**Method**: `GET`

**Headers**:
```
Content-Type: application/json
```

**Body**: None required

**Success Response** (200 OK):
```json
[
  {
    "enemy_id": 100,
    "name": "Shadow Lord",
    "max_hp": 1000,
    "description": "Dark ruler of the shadow realm",
    "moves": [
      {
        "move_id": 1,
        "name": "Shadow Strike",
        "description": "Quick shadow attack",
        "phase": 1
      },
      {
        "move_id": 2,
        "name": "Dark Explosion",
        "description": "Area damage attack",
        "phase": 2
      }
    ]
  },
  {
    "enemy_id": 101,
    "name": "Fire Dragon",
    "max_hp": 2000,
    "description": "Ancient fire-breathing dragon",
    "moves": [
      {
        "move_id": 3,
        "name": "Fire Breath",
        "description": "Breath of fire",
        "phase": 1
      }
    ]
  },
  {
    "enemy_id": 102,
    "name": "Ice Queen",
    "max_hp": 1500,
    "description": "Mystical ice queen with freezing powers",
    "moves": []
  }
]
```

**Error Responses**:

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Information**:
This endpoint is **read-only** and can be safely called from any part of the application:

1. **Boss catalog** - Display available boss types with moves and stats
2. **Combat mechanics** - Boss stats and move information for boss encounters
3. **Game initialization** - Load boss data for boss encounter systems
4. **Level design** - Boss placement and difficulty balancing
5. **Admin interfaces** - Boss management and editing tools
6. **Phase-based combat** - Move selection based on boss health phases
7. **No authentication required** - Public endpoint for game data

**Database Schema Requirements**:
The endpoint joins three tables to provide complete boss information:

**boss_details table**:
```sql
CREATE TABLE boss_details (
  enemy_id INT PRIMARY KEY,
  max_hp SMALLINT,
  description TEXT,
  FOREIGN KEY (enemy_id) REFERENCES enemy_types(enemy_id)
);
```

**enemy_types table** (for boss names):
```sql
CREATE TABLE enemy_types (
  enemy_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  floor INT,
  is_rare BOOLEAN DEFAULT FALSE,
  base_hp SMALLINT,
  base_damage SMALLINT,
  movement_speed SMALLINT,
  attack_cooldown_seconds SMALLINT,
  attack_range SMALLINT,
  sprite_url VARCHAR(255)
);
```

**boss_moves table**:
```sql
CREATE TABLE boss_moves (
  move_id INT AUTO_INCREMENT PRIMARY KEY,
  enemy_id INT NOT NULL,
  name VARCHAR(100),
  description TEXT,
  phase SMALLINT,
  FOREIGN KEY (enemy_id) REFERENCES boss_details(enemy_id)
);
```

**Query Logic**:
```sql
SELECT bd.enemy_id, et.name, bd.max_hp, bd.description, bm.move_id, bm.name as move_name, bm.description as move_description, bm.phase 
FROM boss_details bd 
INNER JOIN enemy_types et ON bd.enemy_id = et.enemy_id 
LEFT JOIN boss_moves bm ON bd.enemy_id = bm.enemy_id 
ORDER BY bd.enemy_id, bm.phase, bm.move_id
```

**Response Details**:
- **enemy_id**: Unique identifier for the boss type
- **name**: Display name of the boss (from enemy_types)
- **max_hp**: Maximum health points for the boss
- **description**: Detailed description of the boss
- **moves**: Array of boss moves/abilities
  - **move_id**: Unique identifier for the move
  - **name**: Name of the move/ability
  - **description**: Description of what the move does
  - **phase**: Combat phase when this move becomes available (1, 2, 3)

**Boss Phase System**:
- **Phase 1**: 100% - 67% health (all phase 1 moves available)
- **Phase 2**: 66% - 34% health (phase 1 + 2 moves available)
- **Phase 3**: 33% - 0% health (all moves available)

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/bosses
```

**Integration Points**:
- Boss encounter initialization and move selection
- Boss catalog and information displays
- Combat system for phase-based boss fights
- Game balance and boss difficulty scaling
- Boss move execution and AI systems

**Data Flow**:
1. Frontend requests boss data for boss encounter systems
2. API joins boss_details, enemy_types, and boss_moves tables
3. Results are grouped by boss with moves nested as arrays
4. Frontend uses data for boss encounters, move selection, and combat mechanics

**Frontend Integration**:
The endpoint integrates with the game configuration system:

```javascript
import { getBosses } from '../../utils/api.js';
import { loadBossData, formatBossDataForGame } from '../../classes/config/gameConfig.js';

// Load boss data into game configuration
const bossData = await loadBossData();

// Format for game engine
const formattedBoss = formatBossDataForGame(bossData[0]);
```

## Security Features
- Use of placeholders (?) in SQL queries to prevent SQL injection
- Proper database connection management (always closed)
- Basic field validation
- **Passwords hashed with bcrypt** (10 salt rounds)
- **CORS enabled** for frontend integration

## Implementation Notes
- Each endpoint opens its own database connection
- Connections are always closed in the `finally` block
- Errors are logged to console with `console.error`
- No authentication or authorization implemented in this MVP
- **Passwords are hashed with bcrypt before storage**

## Database Table Structure

### Users Table
The `users` table must have the following columns:
- `user_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `username` (VARCHAR(30), UNIQUE)
- `email` (VARCHAR(100), UNIQUE)
- `password_hash` (CHAR(60)) - Stores the bcrypt hash
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Sessions Table
The `sessions` table must have the following columns:
- `session_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY)
- `session_token` (VARCHAR(36), UNIQUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Player Stats Table
The `player_stats` table must have the following columns:
- `user_id` (INT, PRIMARY KEY, FOREIGN KEY)
- `games_played` (INT, DEFAULT 0)
- `wins` (INT, DEFAULT 0)
- `losses` (INT, DEFAULT 0)
- `total_score` (BIGINT, DEFAULT 0)
- `highest_score` (INT, DEFAULT 0)
- `total_playtime_minutes` (INT, DEFAULT 0)
- `last_played_at` (DATETIME, NULL)

### Run History Table
The `run_history` table must have the following columns:
- `run_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY)
- `started_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `ended_at` (DATETIME, NULL)
- `score` (INT, DEFAULT 0)
- `status` (ENUM('active', 'completed', 'abandoned'), DEFAULT 'active')

## Dependencies
- `express`: ^4.18.2
- `mysql2`: ^3.6.5
- `bcrypt`: ^5.1.1

## Frontend Integration

The API is ready to be consumed by the frontend. To integrate with your frontend application:

1. **Make HTTP requests to**:
   ```
   POST http://localhost:3000/api/auth/register
   POST http://localhost:3000/api/auth/login  
   POST http://localhost:3000/api/auth/logout
   GET  http://localhost:3000/api/users/{userId}/stats
   POST http://localhost:3000/api/runs
   POST http://localhost:3000/api/runs/{runId}/save-state
   POST http://localhost:3000/api/runs/{runId}/enemy-kill
   POST http://localhost:3000/api/runs/{runId}/chest-event
   POST http://localhost:3000/api/runs/{runId}/shop-purchase
   POST http://localhost:3000/api/runs/{runId}/boss-encounter
   POST http://localhost:3000/api/runs/{runId}/upgrade-purchase
   POST http://localhost:3000/api/runs/{runId}/equip-weapon
   POST http://localhost:3000/api/runs/{runId}/weapon-upgrade
   GET  http://localhost:3000/api/rooms
   GET  http://localhost:3000/api/enemies
   GET  http://localhost:3000/api/bosses
   ```

2. **Send data in JSON format**:
   - For registration:
   ```json
   {
     "username": "user",
     "email": "email@example.com",
     "password": "password"
   }
   ```
   - For login:
   ```json
   {
     "email": "email@example.com",
     "password": "password"
   }
   ```
   - For logout:
   ```json
   {
     "sessionToken": "uuid-string"
   }
   ```
   - For stats: No body required, userId in URL path
   - For runs:
   ```json
   {
     "userId": 123
   }
   ```
   - For save state:
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
   - For enemy kill:
   ```json
   {
     "userId": 123,
     "enemyId": 1,
     "roomId": 2
   }
   ```
   - For chest event:
   ```json
   {
     "userId": 123,
     "roomId": 2,
    "goldReceived": 120
   }
   ```
   - For shop purchase:
   ```json
   {
     "userId": 123,
     "roomId": 2,
     "itemType": "health_potion",
     "itemName": "Health Potion",
     "goldSpent": 80
   }
   ```
   - For boss encounter:
   ```json
   {
     "userId": 123,
     "enemyId": 100,
     "damageDealt": 120,
     "damageTaken": 30,
     "resultCode": "victory"
   }
   ```
   - For upgrade purchase:
   ```json
   {
     "userId": 123,
     "upgradeType": "max_health",
     "levelBefore": 1,
     "levelAfter": 2,
     "goldSpent": 200
   }
   ```
   - For equip weapon:
   ```json
   {
     "userId": 123,
     "slotType": "primary"
   }
   ```
   - For weapon upgrade:
   ```json
   {
     "userId": 123,
     "slotType": "primary",
     "level": 2,
     "damagePerUpgrade": 15,
     "goldCostPerUpgrade": 100
   }
   ```

3. **Handle responses**:
   - Registration Success (201): User created, receives `userId`
   - Login Success (200): Session created, receives `sessionToken`
   - Logout Success (204): Session invalidated, empty response
   - Stats Success (200): Player stats data as JSON
   - Runs Success (201): New run created, receives `runId` and `startedAt`
   - Save State Success (201): Save state created, receives `saveId`
   - Enemy Kill Success (201): Kill registered, receives `killId`
   - Chest Event Success (201): Chest event registered, receives `eventId`
   - Shop Purchase Success (201): Purchase registered, receives `purchaseId`
   - Boss Encounter Success (201): Encounter registered, receives `encounterId`
   - Upgrade Purchase Success (201): Purchase registered, receives `purchaseId`
   - Equip Weapon Success (201): Weapon equipped, receives confirmation message
   - Weapon Upgrade Success (201): Upgrade saved, receives confirmation message
   - Get Rooms Success (200): Array of room objects, receives room data
   - Get Enemies Success (200): Array of enemy objects, receives enemy data
   - Get Bosses Success (200): Array of boss objects with moves, receives boss data
   - Error (400): Missing fields or parameters
   - Error (404): Invalid credentials or stats not found
   - Error (409): Duplicate user (registration only)
   - Error (500): Server error

### Frontend Integration Example

The frontend integration is implemented in:
- `videogame/src/pages/auth/register.js` - Registration form handling
- `videogame/src/pages/auth/login.js` - Login form handling
- `videogame/src/pages/html/game.html` - Logout functionality
- `videogame/src/pages/html/stats.html` - Player statistics display
- `videogame/src/pages/html/runs.html` - Game run creation
- `videogame/src/utils/api.js` - API communication layer
- `videogame/src/classes/config/gameConfig.js` - Boss data integration

All pages automatically:
- Validate input fields
- Show error/success messages
- Handle loading states
- Redirect on success
- Session token is stored in localStorage

**Boss Data Integration:**
```javascript
// Load boss data into game configuration
import { loadBossData, getBossById, formatBossDataForGame } from './classes/config/gameConfig.js';

// Initialize boss data
await loadBossData();

// Get specific boss
const shadowLord = getBossById(100);

// Format for game engine
const bossConfig = formatBossDataForGame(shadowLord);
```

To use the application:
1. Ensure the API server is running (`node app.js`)
2. Open `landing.html` to access the main menu
3. Use `register.html` to create a new account
4. Use `login.html` to authenticate
5. Use `stats.html` to view player statistics
6. Use `runs.html` to start new game runs
7. Use `game.html` for the main game with logout functionality
8. Use `admin-test-bosses.html` to test boss data integration (development only) 