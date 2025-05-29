import { jest } from '@jest/globals';

// Set environment variables first
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.BCRYPT_SALT_ROUNDS = '12';
process.env.SESSION_SECRET = 'test_secret';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Mock database configuration
jest.unstable_mockModule('../src/config/database.js', () => ({
  executeQuery: jest.fn(),
  testConnection: jest.fn(() => Promise.resolve(true)),
  executeTransaction: jest.fn()
}));

// Mock authentication functions
jest.unstable_mockModule('../src/utils/auth.js', () => ({
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
  generateSessionToken: jest.fn(() => 'mock_session_token'),
  generateExpirationDate: jest.fn(() => new Date('2024-01-02T00:00:00.000Z'))
}));

// Mock config module
jest.unstable_mockModule('../src/config/config.js', () => ({
  config: {
    database: {
      host: 'localhost',
      port: 3306,
      user: 'test_user',
      password: 'test_password',
      database: 'test_db'
    },
    security: {
      bcryptSaltRounds: 12,
      sessionSecret: 'test_secret'
    },
    server: {
      port: 3002,
      corsOrigin: 'http://localhost:3000'
    }
  },
  validateConfig: jest.fn(() => true)
})); 