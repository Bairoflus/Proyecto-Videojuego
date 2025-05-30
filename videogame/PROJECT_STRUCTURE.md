# Project Shattered Timeline - Full Stack Structure

## Overview
This document describes the complete structure of the Project Shattered Timeline videogame, including both frontend and backend components with their integration.

## Project Structure

```
videogame/
├── api/                        # Backend API
│   ├── app.js                  # Express server with all endpoints
│   ├── package.json            # API dependencies
│   ├── package-lock.json       # Locked dependency versions
│   ├── node_modules/           # Installed packages
│   └── README.md               # API documentation
│
├── src/                        # Frontend source code
│   ├── pages/                  # HTML pages
│   │   ├── landing.html        # Home page
│   │   ├── login.html          # Login page
│   │   ├── register.html       # Registration page (integrated)
│   │   ├── register.js         # Registration logic (NEW)
│   │   ├── game.html           # Main game page
│   │   └── styles/
│   │       └── style.css       # Global styles
│   │
│   ├── utils/                  # Utility functions
│   │   ├── api.js              # API communication layer (NEW)
│   │   ├── Logger.js           # Logging utility
│   │   ├── Vec.js              # Vector math
│   │   ├── Rect.js             # Rectangle utility
│   │   ├── TextLabel.js        # Text rendering
│   │   └── utils.js            # General utilities
│   │
│   ├── classes/                # Game classes
│   ├── assets/                 # Game assets
│   ├── constants/              # Game constants
│   ├── config.js               # Game configuration
│   ├── draw.js                 # Drawing functions
│   ├── main.js                 # Game entry point
│   └── server.js               # Development HTTP server (NEW)
│
├── documentation/              # Project documentation
├── ilustrations/               # Game illustrations
├── UML/                        # UML diagrams
├── README.md                   # Project readme
├── test-integration.html       # Integration test page (NEW)
└── PROJECT_STRUCTURE.md        # This file

```

## Backend API

### Technology Stack
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MySQL**: Database (via mysql2/promise)
- **bcrypt**: Password hashing

### Database Schema
The MySQL database `ProjectShatteredTimeline` contains multiple tables. Key table for authentication:

**users**
- `user_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `username` (VARCHAR(30), UNIQUE)
- `email` (VARCHAR(100), UNIQUE)
- `password_hash` (CHAR(60))
- `created_at` (DATETIME)

### API Endpoints

#### POST /api/auth/register
- **Purpose**: Register new users
- **Request Body**: `{ username, email, password }`
- **Success Response**: `201 { userId, message }`
- **Error Responses**: `400`, `409`, `500`
- **Features**:
  - Password hashing with bcrypt
  - SQL injection prevention
  - CORS enabled
  - Duplicate user detection

## Frontend Integration

### Key Files for Registration

1. **`src/pages/register.html`**
   - Registration form UI
   - Links to register.js
   - Message containers for feedback

2. **`src/pages/register.js`**
   - Form submission handling
   - Client-side validation
   - API communication
   - Error/success messaging
   - Redirect on success

3. **`src/utils/api.js`**
   - Centralized API communication
   - Error handling
   - Request/response processing

4. **`src/pages/styles/style.css`**
   - Styling for all pages
   - Message container styles
   - Form styling
   - Animation effects

### Integration Flow

1. User fills registration form in `register.html`
2. JavaScript validates input on submit
3. API request sent to `http://localhost:3000/api/auth/register`
4. Backend validates and stores user with hashed password
5. Frontend displays success/error message
6. On success, redirects to login page

## Running the Application

### Backend Setup
```bash
cd videogame/api
npm install
node app.js
```
Server runs on port 3000

### Frontend Testing
1. Open `test-integration.html` in browser for standalone testing
2. Or use the development server:
   ```bash
   cd videogame/src
   node server.js
   ```
   Then navigate to `http://localhost:8080/pages/register.html`

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **SQL Injection Prevention**: Prepared statements with placeholders
- **CORS**: Enabled for frontend-backend communication
- **Input Validation**: Both client and server side
- **Connection Management**: Proper cleanup in all cases

## Future Enhancements

- Login endpoint implementation
- JWT authentication
- Session management
- Password reset functionality
- Email verification
- Rate limiting
- Input sanitization
- HTTPS support

## Development Notes

- All backend code in single file (MVP pattern)
- No authentication middleware yet
- Frontend uses vanilla JavaScript (no framework)
- API and frontend run on different ports
- CORS configured for cross-origin requests 