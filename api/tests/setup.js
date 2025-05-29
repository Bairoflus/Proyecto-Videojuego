import { jest } from '@jest/globals';

// Mock database configuration
jest.mock('../src/config/database.js', () => ({
  executeQuery: jest.fn(),
  testConnection: jest.fn(() => Promise.resolve(true))
}));

// Mock authentication functions
jest.mock('../src/utils/auth.js', () => ({
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
  generateSessionToken: jest.fn(() => 'mock_session_token'),
  generateExpirationDate: jest.fn(() => new Date('2024-01-02T00:00:00.000Z'))
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.BCRYPT_SALT_ROUNDS = '12';
process.env.SESSION_SECRET = 'test_secret';
process.env.CORS_ORIGIN = 'http://localhost:3000'; 