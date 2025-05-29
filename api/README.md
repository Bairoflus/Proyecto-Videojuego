# Shattered Timeline API

RESTful API for the Shattered Timeline video game with comprehensive authentication and session management.

## Features

- **Advanced Authentication System**
  - User registration with complete profile setup
  - Secure login with bcrypt password hashing
  - Dual session management (Authentication + Game sessions)
  - JWT-like Bearer token authentication
  - Automatic session lifecycle management

- **Game Session Management**
  - Separate game session tracking
  - Device information logging
  - Session status management (active/inactive/closed)
  - Automatic session cleanup

- **Player Management**
  - Player profile management
  - Game statistics tracking
  - Player settings (audio, controls)
  - Player upgrades system (vida, stamina, melee, rango, velocidad)

- **Advanced Logging & Analytics**
  - Run/session management
  - Player events logging
  - Shop purchase tracking
  - Chest collection tracking
  - Comprehensive session analytics

## Requirements

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
# Server configuration
PORT=3002
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=newpassword
DB_NAME=ShatteredTimeline

# Security configuration
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# CORS configuration
CORS_ORIGIN=*

# Logging configuration
LOG_LEVEL=combined
```

### 4. Set up the database

#### Step 1: Create the complete database structure
```bash
# Create the ShatteredTimeline database with all tables
mysql -u root -p < database.sql
```

#### Step 2: Apply API-specific enhancements (migrations)
```bash
# Add API-specific features like closed_at, device_info, status columns
mysql -u root -p ShatteredTimeline < database-migration.sql
```

#### Alternative: Manual setup
```bash
# If you prefer to run each step manually:

# 1. Connect to MySQL
mysql -u root -p

# 2. Create and setup the database
source database.sql

# 3. Apply migrations
source database-migration.sql

# 4. Exit MySQL
exit
```

**Database Structure Created:**
- **Core Tables**: users, sessions, rooms, run_history
- **Game Mechanics**: player_stats, player_upgrades, player_settings
- **Combat System**: bosses, boss_moves, boss_encounters, boss_kills, enemy_types, enemy_kills
- **Gameplay Tracking**: shop_purchases, chest_events, player_events
- **Weapon System**: equipped_weapons, weapon_upgrades_temp, permanent_upgrade_purchases
- **Save System**: save_states

**Note:** The `database.sql` creates the base ShatteredTimeline database with all 21 game tables. The `database-migration.sql` adds API-specific enhancements for advanced session management and analytics.

## Architecture & Session System

### Dual Session Architecture

The API implements a sophisticated dual session system:

#### 🔑 **Authentication Sessions** (`device_info = NULL`)
- Created on `POST /api/auth/login`
- Used for API authentication and authorization
- Closed on `POST /api/auth/logout` 
- Short-lived and security-focused

#### 🎮 **Game Sessions** (`device_info = browser info`)
- Created on `POST /api/sessions`
- Used for gameplay tracking and analytics
- Remain active for historical tracking
- Include device and browser information

### Middleware Chain

#### `extractBearerToken`
**Purpose**: Extracts and validates Bearer tokens from Authorization headers.

**What it does**:
1. Checks for `Authorization` header
2. Validates `Bearer TOKEN` format
3. Extracts clean token (removes "Bearer " prefix)
4. Attaches token to `req.sessionToken` for next middleware
5. Returns 401 errors for missing/invalid formats

**Usage**:
```
Authorization: Bearer a020d57e-0337-412a-aab6-348c88e8b25f
Result: req.sessionToken = "a020d57e-0337-412a-aab6-348c88e8b25f"
```

#### `validateActiveSession`
**Purpose**: Validates that the session token exists and is active in the database.

**What it does**:
1. Queries database for active session (`closed_at IS NULL`)
2. Attaches session info to `req.session` and `req.userId`
3. Returns 401 for invalid/expired sessions

#### Middleware Flow Examples:
```
POST /api/auth/logout: extractBearerToken → closeSession
POST /api/sessions: extractBearerToken → validateActiveSession → validateBody → createSession
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3002 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | ShatteredTimeline |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds | 12 |
| `SESSION_SECRET` | Session secret key | - |
| `CORS_ORIGIN` | CORS origin | * |
| `LOG_LEVEL` | Logging level | combined |

## API Endpoints

### Health Check

#### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "success": true,
  "message": "API working correctly",
  "timestamp": "2025-05-29T07:30:00.000Z",
  "version": "1.0.0",
  "database": "ShatteredTimeline"
}
```

### Authentication

#### POST /api/auth/register
Register a new user with complete profile setup.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "user_id": 15,
  "username": "EAMD6",
  "email": "emorales6@gmail.com",
  "created_at": "2025-05-29T01:31:05.000Z"
}
```

**What it creates automatically**:
- User account in `users` table
- Initial player stats in `player_stats` table
- Default player settings in `player_settings` table
- Initial player upgrades in `player_upgrades` table

#### POST /api/auth/login
User login - creates authentication session.

**Request Body:**
```json
{
  "email": "string (valid email format)",
  "password": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "session_id": 31,
  "session_token": "68911164-14b0-4988-a4c9-0bd0f01802ca",
  "user_id": 15
}
```

**Session created in database**:
- `user_id`: User ID
- `session_token`: Unique UUID
- `started_at`: Current timestamp
- `last_active`: Current timestamp
- `device_info`: NULL (authentication session)
- `status`: 'active'
- `closed_at`: NULL

#### POST /api/auth/logout
User logout - closes authentication session.

**Headers Required:**
```
Authorization: Bearer {session_token}
```

**Response (204):** No content (successful logout)

**Response (401):** Unauthorized (invalid/expired token)

**What it does**:
- Finds session by token
- Sets `closed_at = NOW()`
- Idempotent operation (safe to call multiple times)

### Game Sessions

#### POST /api/sessions
Create a new game session for gameplay tracking.

**Headers Required:**
```
Authorization: Bearer {auth_session_token}
```

**Request Body:**
```json
{
  "device_info": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 - MacIntel"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Game session created successfully",
  "data": {
    "session_id": 32,
    "session_token": "a020d57e-0337-412a-aab6-348c88e8b25f",
    "user_id": 15,
    "device_info": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 - MacIntel",
    "started_at": "2025-05-29T02:11:01.000Z",
    "status": "active"
  }
}
```

**Middleware Chain**: `extractBearerToken → validateActiveSession → validateBody → createSession`

#### PUT /api/sessions/:session_id
Update an existing session (keep_alive or close action).

**Headers Required:**
```
Authorization: Bearer {auth_session_token}
```

**Path Parameters:**
- `session_id` (integer): Valid session ID that belongs to the authenticated user

**Request Body:**
```json
{
  "action": "keep_alive" | "close"
}
```

**Response (200) - Success:**
```json
{
  "session_id": 34,
  "last_active": "2025-05-29T18:52:11.000Z",
  "status": "active"
}
```

**Actions:**
- **`keep_alive`**: Updates `last_active` timestamp to current time and ensures status is 'active'
- **`close`**: Sets `closed_at` timestamp and changes status to 'closed'

**Security Features:**
- ✅ **Session Ownership Validation**: Only the session owner can update their sessions
- ✅ **Bearer Token Authentication**: Requires valid authentication session token
- ✅ **Parameter Validation**: Session ID must be positive integer
- ✅ **Action Validation**: Only accepts 'keep_alive' or 'close' actions

**Error Responses:**
- **400**: Invalid action, invalid session ID, or session already closed
- **401**: Missing/invalid Authorization header or not session owner
- **404**: Session not found

**Example Usage:**
```bash
# Keep session active
curl -X PUT http://localhost:3002/api/sessions/34 \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"action":"keep_alive"}'

# Close session
curl -X PUT http://localhost:3002/api/sessions/34 \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"action":"close"}'
```

**Middleware Chain**: `extractBearerToken → validateActiveSession → validateParams → validateBody → updateSession`

## Database Schema

### sessions table
```sql
CREATE TABLE sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token CHAR(36) NOT NULL DEFAULT (UUID()),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  device_info VARCHAR(255) NULL,
  status ENUM('active','inactive','closed') DEFAULT 'active',
  
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_sessions_token_active (session_token, last_active),
  INDEX idx_sessions_expires (expires_at)
);
```

### Session Data Analysis
Query active vs closed sessions:
```sql
-- Authentication sessions (device_info = NULL)
SELECT COUNT(*) as auth_sessions 
FROM sessions 
WHERE user_id = 15 AND device_info IS NULL;

-- Game sessions (device_info contains browser info)
SELECT COUNT(*) as game_sessions 
FROM sessions 
WHERE user_id = 15 AND device_info IS NOT NULL;

-- Active vs closed sessions
SELECT 
  CASE WHEN closed_at IS NULL THEN 'Active' ELSE 'Closed' END as status,
  COUNT(*) as count
FROM sessions 
WHERE user_id = 15 
GROUP BY (closed_at IS NULL);
```

## Frontend Integration

### Login Flow
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { session_token } = await loginResponse.json();
localStorage.setItem('sessionToken', session_token);

// 2. Create game session (in game.html)
const gameSessionResponse = await fetch('/api/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    device_info: `${navigator.userAgent.substring(0, 100)} - ${navigator.platform}`
  })
});

// 3. Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session_token}`
  }
});
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldname",
      "message": "Specific field error"
    }
  ]
}
```

### Common HTTP Status Codes
- **200**: Success (GET, successful operations)
- **201**: Created (POST register, POST sessions)
- **204**: No Content (POST logout)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found (invalid endpoints)
- **500**: Internal Server Error

## Testing

### Run tests
```bash
npm test
```

### Test user account
```
Username: EAMD6
Email: emorales6@gmail.com
Password: Alonso200
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3002/api/health

# Register
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Create game session
curl -X POST http://localhost:3002/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"device_info":"Test Device - cURL"}'

# Update session - keep alive
curl -X PUT http://localhost:3002/api/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action":"keep_alive"}'

# Update session - close
curl -X PUT http://localhost:3002/api/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action":"close"}'

# Logout
curl -X POST http://localhost:3002/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development Guidelines

### Endpoint Development Process
1. **Environment preparation**: Verify server and database
2. **Backend development**: Controllers, validators, routes, models
3. **Frontend integration**: Configuration, HTML structure, JavaScript
4. **Testing and debugging**: cURL tests, error cases
5. **Standards compliance**: Naming conventions, HTTP status codes

### Code Standards
- Use descriptive variable names
- Follow RESTful conventions
- Implement proper error handling
- Use middleware chains for security
- Include comprehensive JSDoc documentation
- Follow idempotent operation principles

## Security Features

- **bcrypt password hashing** with configurable salt rounds
- **Bearer token authentication** with proper validation
- **Session lifecycle management** with automatic cleanup
- **SQL injection prevention** through parameterized queries
- **CORS configuration** for cross-origin requests
- **Input validation** using Joi schemas
- **Error handling** without information leakage

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use production database credentials
- [ ] Set secure session secrets (256-bit minimum)
- [ ] Configure specific CORS origins
- [ ] Enable HTTPS
- [ ] Set up proper logging and monitoring
- [ ] Configure session cleanup cron jobs
- [ ] Set up database backups

## License

This project is licensed under the ISC License.

## Technologies Used

- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework  
- **MySQL 8.0+** - Database with advanced session management
- **bcrypt** - Password hashing
- **Joi** - Data validation
- **Jest** - Testing framework
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing
- **mysql2** - MySQL client with Promise support
- **dotenv** - Environment variable management 