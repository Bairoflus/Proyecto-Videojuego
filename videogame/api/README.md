# API - Project Shattered Timeline

## Description
REST API for the Project Shattered Timeline video game. This API handles authentication operations, user management, and player statistics.

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

3. **Handle responses**:
   - Registration Success (201): User created, receives `userId`
   - Login Success (200): Session created, receives `sessionToken`
   - Logout Success (204): Session invalidated, empty response
   - Stats Success (200): Player stats data as JSON
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
6. Use `game.html` for the main game with logout functionality 