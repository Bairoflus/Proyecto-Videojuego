import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import { executeQuery } from '../src/config/database.js';
import { hashPassword, verifyPassword } from '../src/utils/auth.js';

// Mock data
const mockUser = {
  user_id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password_hash: '$2b$10$hashedpassword',
  created_at: new Date()
};

const mockSession = {
  sessionId: 1,
  sessionToken: 'mock-session-token-uuid',
  userId: 1
};

describe('Auth Endpoints', () => {
  let testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpass123'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      executeQuery
        .mockResolvedValueOnce([]) // No existing user by email
        .mockResolvedValueOnce([]) // No existing user by username
        .mockResolvedValueOnce({ insertId: 1 }) // Insert user
        .mockResolvedValueOnce([]) // Insert player stats
        .mockResolvedValueOnce([]) // Insert player settings
        .mockResolvedValueOnce([]) // Insert player upgrades (vida)
        .mockResolvedValueOnce([]) // Insert player upgrades (stamina)
        .mockResolvedValueOnce([]) // Insert player upgrades (melee)
        .mockResolvedValueOnce([]) // Insert player upgrades (rango)
        .mockResolvedValueOnce([]) // Insert player upgrades (velocidad)
        .mockResolvedValueOnce([mockUser]); // Find user by ID

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Verify response format according to instructions
      expect(response.body.user_id).toBe(1);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.created_at).toBeDefined();
      expect(response.body.password).toBeUndefined();
      expect(response.body.password_hash).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      // Mock existing user by email
      executeQuery.mockResolvedValueOnce([mockUser]);

      const duplicateEmailUser = {
        username: 'newuser',
        email: testUser.email,
        password: 'newpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateEmailUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should not register user with existing username', async () => {
      // Mock no existing user by email, but existing user by username
      executeQuery
        .mockResolvedValueOnce([]) // No existing user by email
        .mockResolvedValueOnce([mockUser]); // Existing user by username

      const duplicateUsernameUser = {
        username: testUser.username,
        email: 'newemail@example.com',
        password: 'newpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUsernameUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('username');
    });

    it('should not register user with invalid email', async () => {
      const invalidUser = {
        username: 'validuser',
        email: 'invalid-email',
        password: 'validpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with short password', async () => {
      const shortPasswordUser = {
        username: 'shortpass',
        email: 'short@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(shortPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with non-alphanumeric username', async () => {
      const invalidUsernameUser = {
        username: 'user@name!',
        email: 'invalid@example.com',
        password: 'validpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUsernameUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with username too short', async () => {
      const shortUsernameUser = {
        username: 'ab',
        email: 'shortuser@example.com',
        password: 'validpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(shortUsernameUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with username too long', async () => {
      const longUsernameUser = {
        username: 'a'.repeat(31),
        email: 'longuser@example.com',
        password: 'validpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(longUsernameUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with missing fields', async () => {
      const incompleteUser = {
        username: 'incomplete',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Mock database responses for successful login
      executeQuery
        .mockResolvedValueOnce([mockUser]) // Find user by email
        .mockResolvedValueOnce({ insertId: 1 }); // Create session

      // Mock password verification
      verifyPassword.mockResolvedValueOnce(true);

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Verify exact response format according to specifications
      expect(response.body.session_id).toBe(1);
      expect(response.body.session_token).toBeDefined();
      expect(response.body.user_id).toBe(1);
      expect(typeof response.body.session_token).toBe('string');
    });

    it('should not login with non-existent email', async () => {
      // Mock no user found
      executeQuery.mockResolvedValueOnce([]);

      const nonExistentLogin = {
        email: 'nonexistent@example.com',
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(nonExistentLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with incorrect password', async () => {
      // Mock user found but password verification fails
      executeQuery.mockResolvedValueOnce([mockUser]);
      verifyPassword.mockResolvedValueOnce(false);

      const invalidLogin = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with invalid email format', async () => {
      const invalidEmailLogin = {
        email: 'invalid-email-format',
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidEmailLogin)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not login with short password', async () => {
      const shortPasswordLogin = {
        email: testUser.email,
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(shortPasswordLogin)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not login with missing fields', async () => {
      const incompleteLogin = {
        email: testUser.email
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incompleteLogin)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      executeQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('API Health', () => {
  it('should return API health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('working');
  });

  it('should return API info on root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Shattered Timeline');
  });
}); 