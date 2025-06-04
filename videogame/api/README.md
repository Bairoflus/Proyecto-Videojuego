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

### GET /api/users/:userId/settings
Retrieves player settings (audio and game preferences) for a specific user.

**URL**: `/api/users/{userId}/settings`

**Method**: `GET`

**Parameters**:
- `userId` (path parameter) - The ID of the user whose settings to retrieve

**Example URL**:
```
/api/users/123/settings
```

**Success Response** (200 OK):
```json
{
  "user_id": 123,
  "music_volume": 70,
  "sfx_volume": 80,
  "last_updated": "2024-01-15 14:30:00"
}
```

**Error Responses**:

- **400 Bad Request** - Missing userId parameter:
```
Missing userId parameter
```

- **400 Bad Request** - Invalid userId type:
```
Invalid userId: must be an integer
```

- **404 Not Found** - User not found:
```
User not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Auto-Creation Behavior**:
If no settings exist for the user, the endpoint automatically creates default settings:
- **Music Volume**: 70 (out of 100)
- **SFX Volume**: 80 (out of 100)
- **Last Updated**: Current timestamp

This ensures all users have settings available immediately after registration.

**Usage Information**:
This endpoint is designed for:
1. **Settings page initialization** - Load current user preferences
2. **Game audio setup** - Apply volume settings on game start
3. **Settings validation** - Ensure settings exist before updates
4. **Default settings provision** - Auto-create missing settings

**Database Schema Requirements**:
The endpoint queries the player_settings table:

**player_settings table**:
```sql
CREATE TABLE player_settings (
  user_id INT NOT NULL,
  music_volume INT,
  sfx_volume INT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/users/123/settings
```

**Integration Points**:
- Settings page load and display
- Game audio initialization
- Volume control validation
- User preference management

### PUT /api/users/:userId/settings
Updates player settings (audio and game preferences) for a specific user.

**URL**: `/api/users/{userId}/settings`

**Method**: `PUT`

**Parameters**:
- `userId` (path parameter) - The ID of the user whose settings to update

**Headers**:
```
Content-Type: application/json
```

**Body** (partial update supported):
```json
{
  "musicVolume": 75,
  "sfxVolume": 85
}
```

**Body (single setting update)**:
```json
{
  "musicVolume": 90
}
```

**Success Response** (200 OK):
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "user_id": 123,
    "music_volume": 75,
    "sfx_volume": 85,
    "last_updated": "2024-01-15 15:45:00"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Missing userId parameter:
```
Missing userId parameter
```

- **400 Bad Request** - Invalid userId type:
```
Invalid userId: must be an integer
```

- **400 Bad Request** - No settings provided:
```
At least one setting must be provided: musicVolume or sfxVolume
```

- **400 Bad Request** - Invalid musicVolume type:
```
Invalid musicVolume: must be an integer
```

- **400 Bad Request** - Invalid musicVolume range:
```
Invalid musicVolume: must be between 0 and 100
```

- **400 Bad Request** - Invalid sfxVolume type:
```
Invalid sfxVolume: must be an integer
```

- **400 Bad Request** - Invalid sfxVolume range:
```
Invalid sfxVolume: must be between 0 and 100
```

- **404 Not Found** - User not found:
```
User not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Partial Update Support**:
This endpoint supports partial updates, meaning you can:
- Update only `musicVolume`
- Update only `sfxVolume`
- Update both settings simultaneously
- Omit unchanged settings from the request body

**Auto-Creation Behavior**:
If no settings exist for the user, the endpoint automatically creates them:
- Provided settings use the specified values
- Missing settings use defaults (musicVolume: 70, sfxVolume: 80)
- Timestamp is set to current time

**Validation Rules**:
- **Volume Range**: Both musicVolume and sfxVolume must be between 0 and 100 (inclusive)
- **Data Types**: Volume values must be integers
- **Required Fields**: At least one setting (musicVolume or sfxVolume) must be provided
- **User Validation**: User must exist in the users table

**Database Operations**:
The endpoint performs intelligent UPSERT operations:
1. **If settings don't exist**: INSERT new record with provided/default values
2. **If settings exist**: UPDATE only the provided fields + timestamp
3. **Always updates**: last_updated timestamp to NOW()

**Example Usage**:
```bash
# Update both settings
curl -X PUT http://localhost:3000/api/users/123/settings \
  -H "Content-Type: application/json" \
  -d '{"musicVolume": 75, "sfxVolume": 85}'

# Update only music volume
curl -X PUT http://localhost:3000/api/users/123/settings \
  -H "Content-Type: application/json" \
  -d '{"musicVolume": 90}'

# Update only SFX volume
curl -X PUT http://localhost:3000/api/users/123/settings \
  -H "Content-Type: application/json" \
  -d '{"sfxVolume": 60}'
```

**Integration Points**:
- Settings page save functionality
- In-game volume controls
- User preference persistence
- Real-time audio adjustments

**Data Flow**:
1. User adjusts settings in UI (settings page or in-game controls)
2. Frontend validates settings ranges (0-100)
3. Frontend calls this endpoint with new settings
4. API validates user existence and setting values
5. Settings updated/created in database with timestamp
6. Updated settings returned for UI confirmation
7. Frontend applies new settings to audio system

**Frontend Integration**:
```javascript
import { updatePlayerSettings } from '../../utils/api.js';

// Update both settings
const result = await updatePlayerSettings(userId, {
    musicVolume: 75,
    sfxVolume: 85
});

// Update single setting
const result = await updatePlayerSettings(userId, {
    musicVolume: 90
});

// Apply settings to game audio
if (result.settings) {
    audioManager.setMusicVolume(result.settings.music_volume);
    audioManager.setSfxVolume(result.settings.sfx_volume);
}
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

### POST /api/runs/:runId/boss-kill
Registers a successful boss kill during an active game run.

**URL**: `/api/runs/{runId}/boss-kill`

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
  "roomId": 2
}
```

**Success Response** (201 Created):
```json
{
  "killId": 456,
  "message": "Boss kill registered"
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

- **404 Not Found** - Boss not found:
```
Boss not found
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

1. **During active gameplay** - When a boss is successfully defeated
2. **For active runs only** - Cannot register kills for completed runs
3. **With valid game data** - Must reference existing runs, bosses, and rooms
4. **By the run owner** - userId must match the run's user_id
5. **For bosses only** - enemyId must exist in boss_details table

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**boss_kills table**:
```sql
CREATE TABLE boss_kills (
  kill_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  enemy_id INT NOT NULL,
  run_id INT NOT NULL,
  room_id INT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (enemy_id) REFERENCES boss_details(enemy_id),
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

**Validation Logic**:
1. **Run Exists Check**: `SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?`
2. **User Ownership Check**: Validates `userId` matches run owner
3. **Run Active Check**: Validates `ended_at IS NULL` (run not completed)
4. **Boss Exists Check**: `SELECT enemy_id FROM boss_details WHERE enemy_id = ?`
5. **Room Exists Check**: `SELECT room_id FROM rooms WHERE room_id = ?`
6. **Data Type Validation**: All fields must be integers

**Distinction from Boss Encounters**:
- **Boss Encounters**: Track combat statistics, damage, and results (including defeats)
- **Boss Kills**: Track only successful boss defeats for achievement and progression tracking
- Both endpoints can be called for the same boss fight - encounter for combat stats, kill for successful defeat

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/runs/123/boss-kill \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "enemyId": 100,
    "roomId": 2
  }'
```

**Integration Points**:
- Should be integrated with boss defeat logic in the game engine
- Called when boss health reaches 0 and boss is successfully defeated
- Tracks boss kill achievements and progression statistics
- Works in conjunction with boss encounter endpoint for complete boss combat tracking

**Data Flow**:
1. Player defeats a boss during gameplay (boss health reaches 0)
2. Game engine processes boss defeat
3. Frontend calls this endpoint with kill details
4. API validates run ownership and entity existence
5. Kill registered in `boss_kills` table with timestamp
6. Returns `killId` for confirmation/tracking

**Recommended Usage Pattern**:
```javascript
// During boss combat
await registerBossEncounter(runId, {
  userId, enemyId, damageDealt, damageTaken, resultCode: "victory"
});

// When boss is defeated (health <= 0)
await registerBossKill(runId, {
  userId, enemyId, roomId
});
```

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

### GET /api/lookups
Retrieves all lookup data from static reference tables for populating form dropdowns and UI elements.

**URL**: `/api/lookups`

**Method**: `GET`

**Headers**:
```
Content-Type: application/json
```

**Body**: None required

**Success Response** (200 OK):
```json
{
  "eventTypes": [],
  "weaponSlots": [
    { "name": "melee" },
    { "name": "primary" },
    { "name": "secondary" },
    { "name": "special" },
    { "name": "throwable" }
  ],
  "upgradeTypes": [
    { "name": "critical_chance" },
    { "name": "damage_boost" },
    { "name": "gold_multiplier" },
    { "name": "max_health" },
    { "name": "max_stamina" },
    { "name": "speed_boost" }
  ],
  "bossResults": [
    { "name": "defeat" },
    { "name": "escape" },
    { "name": "timeout" },
    { "name": "victory" }
  ],
  "roomTypes": [
    { "name": "boss" },
    { "name": "combat" },
    { "name": "entrance" },
    { "name": "shop" }
  ],
  "itemTypes": [
    { "name": "armor" },
    { "name": "consumable" },
    { "name": "health_potion" },
    { "name": "upgrade" },
    { "name": "weapon" }
  ]
}
```

**Error Responses**:

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Information**:
This endpoint is **read-only** and designed for frontend consumption:

1. **Form dropdowns** - Populate select elements with valid options
2. **Data validation** - Validate user input against allowed values
3. **UI filters** - Create filter options for lists and searches
4. **Admin interfaces** - Provide lookup options for content management
5. **Game configuration** - Load reference data for game mechanics
6. **Static data cache** - Load once and cache for session duration
7. **No authentication required** - Public endpoint for reference data

**Database Schema Requirements**:
The endpoint queries six lookup tables:

**event_types table**:
```sql
CREATE TABLE event_types (
  event_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**weapon_slots table**:
```sql
CREATE TABLE weapon_slots (
  slot_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**upgrade_types table**:
```sql
CREATE TABLE upgrade_types (
  upgrade_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**boss_results table**:
```sql
CREATE TABLE boss_results (
  result_code VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**room_types table**:
```sql
CREATE TABLE room_types (
  room_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**item_types table**:
```sql
CREATE TABLE item_types (
  item_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**Query Logic**:
```sql
SELECT event_type as name FROM event_types;
SELECT slot_type as name FROM weapon_slots;
SELECT upgrade_type as name FROM upgrade_types;
SELECT result_code as name FROM boss_results;
SELECT room_type as name FROM room_types;
SELECT item_type as name FROM item_types;
```

**Response Details**:
- **eventTypes**: Array of event type options (may be empty)
- **weaponSlots**: Array of weapon slot types for equipment
- **upgradeTypes**: Array of available upgrade categories
- **bossResults**: Array of possible boss encounter outcomes
- **roomTypes**: Array of room categories for level design
- **itemTypes**: Array of item categories for inventory systems

**Data Usage Examples**:

**Form Integration**:
```javascript
import { getLookups } from '../../utils/api.js';

// Load lookup data
const lookups = await getLookups();

// Populate weapon slot dropdown
const weaponSelect = document.getElementById('weaponSlot');
lookups.weaponSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot.name;
    option.textContent = slot.name;
    weaponSelect.appendChild(option);
});
```

**Validation Usage**:
```javascript
// Validate user input against lookup data
function isValidUpgradeType(upgradeType) {
    return lookups.upgradeTypes.some(upgrade => upgrade.name === upgradeType);
}
```

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/lookups
```

**Integration Points**:
- Form dropdown population across all admin interfaces
- Data validation for API endpoints requiring lookup values
- UI filter generation for search and browse interfaces
- Game configuration loading for valid option sets
- Content management system reference data

**Data Flow**:
1. Frontend requests all lookup data on application initialization
2. API queries all 6 lookup tables simultaneously
3. Results formatted with consistent structure (arrays of {name} objects)
4. Frontend caches data and uses for dropdowns, validation, and UI elements

**Frontend Integration**:
```javascript
import { getLookups } from '../../utils/api.js';

// Initialize application with lookup data
async function initializeApp() {
    try {
        const lookups = await getLookups();
        
        // Cache for session
        window.gameData = { lookups };
        
        // Populate all form dropdowns
        populateDropdowns(lookups);
        
    } catch (error) {
        console.error('Failed to load lookup data:', error);
    }
}
```

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

**Lookup Data Integration:**
```javascript
// Load lookup data for forms and dropdowns
import { getLookups } from '../../utils/api.js';

// Initialize lookup data
const lookups = await getLookups();

// Use for form population
function populateWeaponSlots(selectElement) {
    lookups.weaponSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.name;
        option.textContent = slot.name;
        selectElement.appendChild(option);
    });
}

// Use for validation
function validateUpgradeType(upgradeType) {
    return lookups.upgradeTypes.some(upgrade => upgrade.name === upgradeType);
}
```

**Item Types Integration:**
```javascript
// Load item types for shop menu
import { getItemTypes } from '../../utils/api.js';

// Initialize shop categories
const itemTypes = await getItemTypes();

// Create shop categories
function createShopMenu(itemTypes) {
    itemTypes.forEach(itemType => {
        const categoryButton = document.createElement('button');
        categoryButton.textContent = itemType.name.replace('_', ' ').toUpperCase();
        categoryButton.onclick = () => filterShopItems(itemType.name);
        shopMenu.appendChild(categoryButton);
    });
}

// Filter shop items by type
function filterShopItems(itemType) {
    const filteredItems = allShopItems.filter(item => item.type === itemType);
    displayShopItems(filteredItems);
}
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
9. Use `admin-test-lookups.html` to test lookup data integration (development only)
10. Use `admin-test-item-types.html` to test item types integration (development only)

### GET /api/item-types
Retrieves all item types from the database for shop menu categorization and item filtering.

**URL**: `/api/item-types`

**Method**: `GET`

**Headers**:
```
Content-Type: application/json
```

**Body**: None required

**Success Response** (200 OK):
```json
[
  { "name": "armor" },
  { "name": "consumable" },
  { "name": "health_potion" },
  { "name": "upgrade" },
  { "name": "weapon" }
]
```

**Error Responses**:

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Information**:
This endpoint is **read-only** and designed specifically for shop menu integration:

1. **Shop categories** - Populate shop menu categories for item browsing
2. **Item filtering** - Filter inventory and shop items by type
3. **Content organization** - Organize game items by category
4. **UI categorization** - Create category-based navigation
5. **Item validation** - Validate item types in forms and transactions
6. **No authentication required** - Public endpoint for reference data

**Database Schema Requirements**:
The endpoint queries the item_types table:

**item_types table**:
```sql
CREATE TABLE item_types (
  item_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**Query Logic**:
```sql
SELECT item_type AS name FROM item_types;
```

**Response Details**:
- **Array format**: Simple array of objects for easy iteration
- **name property**: Each object contains only the item type name
- **Direct consumption**: Ready for immediate use in frontend without processing

**Shop Menu Integration**:
```javascript
import { getItemTypes } from '../../utils/api.js';

// Load item types for shop menu
const itemTypes = await getItemTypes();

// Create shop categories
itemTypes.forEach(itemType => {
    const categoryButton = document.createElement('button');
    categoryButton.textContent = itemType.name.replace('_', ' ').toUpperCase();
    categoryButton.onclick = () => filterShopItems(itemType.name);
    shopMenu.appendChild(categoryButton);
});
```

**Item Filtering Example**:
```javascript
// Filter items by type
function filterShopItems(itemType) {
    const filteredItems = allShopItems.filter(item => item.type === itemType);
    displayShopItems(filteredItems);
}
```

**Example Usage**:
```bash
curl -X GET http://localhost:3000/api/item-types
```

**Integration Points**:
- Shop menu category population
- Item inventory filtering and organization
- Item type validation in purchase transactions
- Content management for item categorization
- Game UI category navigation

**Data Flow**:
1. Frontend requests item types for shop menu initialization
2. API queries item_types table with simple SELECT
3. Returns clean array of item type objects
4. Frontend uses data to populate shop categories and filters

**Frontend Integration**:
```javascript
import { getItemTypes } from '../../utils/api.js';

// Initialize shop with item types
async function initializeShop() {
    try {
        const itemTypes = await getItemTypes();
        
        // Populate shop categories
        populateShopCategories(itemTypes);
        
        // Set up filtering
        setupItemFiltering(itemTypes);
        
    } catch (error) {
        console.error('Failed to load item types:', error);
    }
}
```

**Performance Notes**:
- Very lightweight (5 items typical)
- Fast response time (< 5ms average)
- Perfect for frequent shop menu access
- Minimal database load (single simple query)

## Security Features
- Use of placeholders (?) in SQL queries to prevent SQL injection
- Proper database connection management (always closed)
- Basic field validation
- **Passwords hashed with bcrypt** (10 salt rounds)
- **CORS enabled** for frontend integration 

### POST /api/runs/:runId/events
Logs player events during an active game run for analytics and debugging purposes.

**URL**: `/api/runs/{runId}/events`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body** (supports batch event logging):
```json
{
  "userId": 123,
  "events": [
    {
      "eventType": "weapon_fire",
      "roomId": 2,
      "value": 45,
      "weaponType": "pistol",
      "context": "enemy_combat"
    },
    {
      "eventType": "item_pickup",
      "roomId": 2,
      "value": 1,
      "context": "health_potion"
    },
    {
      "eventType": "room_enter",
      "roomId": 3
    }
  ]
}
```

**Body** (single event example):
```json
{
  "userId": 123,
  "events": [
    {
      "eventType": "player_death",
      "roomId": 5,
      "weaponType": "sword",
      "context": "boss_fight"
    }
  ]
}
```

**Success Response** (201 Created):
```json
{
  "message": "3 event(s) logged successfully",
  "eventsLogged": 3,
  "eventIds": [1001, 1002, 1003]
}
```

**Error Responses**:

- **400 Bad Request** - Missing runId parameter:
```
Missing runId parameter
```

- **400 Bad Request** - Missing required fields:
```
Missing required fields: userId, events
```

- **400 Bad Request** - Invalid field types:
```
Invalid field types: userId, runId must be integers
```

- **400 Bad Request** - Invalid events format:
```
Invalid events: must be an array
```

- **400 Bad Request** - Empty events array:
```
Events array cannot be empty
```

- **400 Bad Request** - Too many events (rate limiting):
```
Too many events: maximum 100 events per request
```

- **400 Bad Request** - Event validation errors:
```
Event 0: Missing required fields: eventType, roomId
Event 1: eventType must be string
Event 2: roomId must be integer
Event 3: value must be integer
Event 4: eventType too long (max 50 characters)
Event 5: weaponType too long (max 20 characters)
Event 6: context too long (max 50 characters)
```

- **400 Bad Request** - User ID mismatch:
```
User ID does not match run owner
```

- **400 Bad Request** - Run already completed:
```
Run is already completed
```

- **400 Bad Request** - Invalid event types:
```
Invalid event types: invalid_event, another_invalid_event
```

- **400 Bad Request** - Invalid room IDs:
```
Invalid room IDs: 999, 888
```

- **404 Not Found** - Run not found:
```
Run not found
```

- **500 Internal Server Error** - Database error:
```
Database error
```

**Usage Restrictions**:
This endpoint is **NOT** exposed in the landing page or main user interface. It should **ONLY** be called:

1. **During active gameplay** - When tracking player actions and events
2. **For active runs only** - Cannot log events for completed runs
3. **With valid game data** - Must reference existing runs, event types, and rooms
4. **By the run owner** - userId must match the run's user_id
5. **Rate limited** - Maximum 100 events per request to prevent abuse
6. **Non-blocking** - Should not affect gameplay performance

**Database Schema Requirements**:
The endpoint validates against the actual database schema:

**player_events table**:
```sql
CREATE TABLE player_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  value INT,
  weapon_type VARCHAR(20),
  context VARCHAR(50),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES run_history(run_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  FOREIGN KEY (event_type) REFERENCES event_types(event_type)
);
```

**event_types table** (lookup):
```sql
CREATE TABLE event_types (
  event_type VARCHAR(50) NOT NULL PRIMARY KEY
);
```

**Event Structure Validation**:
Each event in the events array must have:
- **eventType** (required): String, max 50 characters, must exist in event_types table
- **roomId** (required): Integer, must exist in rooms table
- **value** (optional): Integer, for numeric event data
- **weaponType** (optional): String, max 20 characters, weapon used during event
- **context** (optional): String, max 50 characters, additional event context

**Batch Processing Features**:
- **Efficient validation**: Validates all unique event types and room IDs in batch queries
- **Atomic operations**: All events inserted in parallel for performance
- **Rate limiting**: Maximum 100 events per request prevents abuse
- **Detailed error reporting**: Specific validation errors for each event with index

**Common Event Types**:
- `weapon_fire` - Player fires a weapon
- `item_pickup` - Player collects an item
- `room_enter` - Player enters a new room
- `enemy_encounter` - Player encounters an enemy
- `player_death` - Player dies
- `ability_use` - Player uses a special ability
- `chest_open` - Player opens a chest
- `shop_visit` - Player visits a shop
- `upgrade_purchase` - Player buys an upgrade
- `boss_encounter` - Player encounters a boss

**Example Usage**:
```bash
# Log multiple events
curl -X POST http://localhost:3000/api/runs/123/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "events": [
      {
        "eventType": "weapon_fire",
        "roomId": 2,
        "value": 45,
        "weaponType": "pistol",
        "context": "enemy_combat"
      },
      {
        "eventType": "item_pickup",
        "roomId": 2,
        "value": 1,
        "context": "health_potion"
      }
    ]
  }'

# Log single event
curl -X POST http://localhost:3000/api/runs/123/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "events": [
      {
        "eventType": "player_death",
        "roomId": 5,
        "context": "boss_fight"
      }
    ]
  }'
```

**Integration Points**:
- Game action tracking throughout gameplay
- Analytics data collection for game balancing
- Player behavior analysis for UX improvements
- Debugging and troubleshooting player issues
- A/B testing and feature usage tracking

**Data Flow**:
1. Player performs action during gameplay
2. Game engine captures event details
3. Frontend buffers events for batch processing (recommended)
4. Frontend calls this endpoint with event batch
5. API validates run ownership and entity existence
6. Events validated against event_types and rooms tables
7. All events inserted in parallel for performance
8. Returns confirmation with event IDs for tracking

**Performance Considerations**:
- **Batch logging**: Use arrays of events to reduce API calls
- **Async processing**: Events logged without blocking gameplay
- **Rate limiting**: 100 events per request prevents system overload
- **Buffer strategy**: Frontend should buffer events and send periodically
- **Non-critical**: Event logging failures should not break gameplay

**Frontend Integration Examples**:
```javascript
import { logPlayerEvents, logPlayerEvent } from '../../utils/api.js';

// Log multiple events (recommended for performance)
const events = [
  {
    eventType: 'weapon_fire',
    roomId: currentRoomId,
    value: damageDealt,
    weaponType: weapon.type,
    context: 'enemy_combat'
  },
  {
    eventType: 'enemy_kill',
    roomId: currentRoomId,
    value: enemy.id,
    weaponType: weapon.type
  }
];

await logPlayerEvents(runId, { userId, events });

// Log single event (convenience function)
await logPlayerEvent(runId, userId, {
  eventType: 'room_enter',
  roomId: newRoomId
});

// Error handling
try {
  await logPlayerEvents(runId, { userId, events });
} catch (error) {
  console.warn('Event logging failed:', error);
  // Continue gameplay - don't break on logging errors
}
```

**Analytics Use Cases**:
- **Player progression**: Track room transitions and completion rates
- **Combat analysis**: Weapon usage, damage dealt, death causes
- **Item economy**: Pickup patterns, shop purchases, upgrade choices
- **Difficulty balancing**: Player death locations, common failure points
- **Feature usage**: Which abilities/weapons are used most/least
- **Session analysis**: Play patterns, session length, engagement metrics

### POST /api/runs/:runId/upgrade-purchase