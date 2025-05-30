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

3. **Handle responses**:
   - Registration Success (201): User created, receives `userId`
   - Login Success (200): Session created, receives `sessionToken`
   - Logout Success (204): Session invalidated, empty response
   - Stats Success (200): Player stats data as JSON
   - Runs Success (201): New run created, receives `runId` and `startedAt`
   - Save State Success (201): Save state created, receives `saveId`
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

All pages automatically:
- Validate input fields
- Show error/success messages
- Handle loading states
- Redirect on success
- Session token is stored in localStorage

To use the application:
1. Ensure the API server is running (`node app.js`)
2. Open `landing.html` to access the main menu
3. Use `register.html` to create a new account
4. Use `login.html` to authenticate
5. Use `stats.html` to view player statistics
6. Use `runs.html` to start new game runs
7. Use `game.html` for the main game with logout functionality 