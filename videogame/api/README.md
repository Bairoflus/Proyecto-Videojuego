# API - Project Shattered Timeline

## Description
REST API for the Project Shattered Timeline video game. This API handles authentication operations and user management.

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
The `users` table must have the following columns according to the database schema:
- `user_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `username` (VARCHAR(30), UNIQUE)
- `email` (VARCHAR(100), UNIQUE)
- `password_hash` (CHAR(60)) - Stores the bcrypt hash
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

## Dependencies
- `express`: ^4.18.2
- `mysql2`: ^3.6.5
- `bcrypt`: ^5.1.1

## Frontend Integration

The API is ready to be consumed by the frontend. To integrate with your frontend application:

1. **Make HTTP POST requests to**:
   ```
   http://localhost:3000/api/auth/register
   http://localhost:3000/api/auth/login
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

3. **Handle responses**:
   - Registration Success (201): User created, receives `userId`
   - Login Success (200): Session created, receives `sessionToken`
   - Error (400): Missing fields
   - Error (404): Invalid credentials (login only)
   - Error (409): Duplicate user (registration only)
   - Error (500): Server error

### Frontend Integration Example

The frontend integration is implemented in:
- `videogame/src/pages/register.js` - Registration form handling
- `videogame/src/pages/login.js` - Login form handling
- `videogame/src/utils/api.js` - API communication layer

Both pages automatically:
- Validate input fields
- Show error/success messages
- Handle loading states
- Redirect on success (register → login, login → game)

To use the authentication pages:
1. Ensure the API server is running (`node app.js`)
2. Open `register.html` to create a new account
3. Open `login.html` to authenticate
4. Session token is stored in localStorage 