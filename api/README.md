# Shattered Timeline API

RESTful API for the Shattered Timeline video game

## Features

- User authentication (registration, login, logout)
- Player profile management
- Game statistics tracking
- Run/session management
- Player events logging
- Shop purchase tracking
- Chest collection tracking
- Player settings management
- Player upgrades system

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
PORT=3000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ShatteredTimeline

# Security configuration
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your_secret_key

# CORS configuration
CORS_ORIGIN=http://localhost:8000

# Logging configuration
LOG_LEVEL=combined
```

### 4. Set up the database
```bash
# Create the database and tables
mysql -u root -p < database.sql

# Run migrations
mysql -u root -p ShatteredTimeline < database-migration.sql
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | - |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds | 12 |
| `SESSION_SECRET` | Session secret key | - |
| `CORS_ORIGIN` | CORS origin | http://localhost:8000 |
| `LOG_LEVEL` | Logging level | combined |

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

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
  "user_id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

#### POST /api/auth/login
User login.

**Request Body:**
```json
{
  "email": "string (valid email format)",
  "password": "string (min 6 chars)"
}
```

**Response (200) - Success:**
```json
{
  "session_id": 1,
  "session_token": "uuid-v4-token",
  "user_id": 1
}
```

**Response (400) - Validation Error:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**Response (401) - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response (500) - Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

### Health

#### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "success": true,
  "message": "API working correctly",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "database": "ShatteredTimeline"
}
```

## Tests

### Run tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Test Structure
```
tests/
├── setup.js          # Test configuration
├── auth.test.js       # Authentication tests
└── game.test.js       # Game functionality tests
```

### Example Test
```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('user_id');
    expect(response.body.username).toBe(userData.username);
    expect(response.body.email).toBe(userData.email);
  });
});
```

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Use a production database
3. Set secure session secrets
4. Configure proper CORS origins
5. Use HTTPS
6. Set up proper logging

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_production_db_host
DB_PASSWORD=your_secure_password
SESSION_SECRET=your_very_secure_secret
CORS_ORIGIN=https://yourdomain.com
```

## License

This project is licensed under the ISC License.

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **bcrypt** - Password hashing
- **Joi** - Data validation
- **Jest** - Testing framework
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing 