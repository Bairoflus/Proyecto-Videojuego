import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * General server configuration
 */
export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },

  // Security configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'default-secret-key'
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'combined'
  }
};

/**
 * Validate that critical environment variables are configured
 */
export const validateConfig = () => {
  const requiredEnvVars = [
    'DB_PASSWORD',
    'DB_NAME',
    'SESSION_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars.join(', '));
    console.error('Please configure these variables in your .env file');
    process.exit(1);
  }

  console.log('Configuration validated successfully');
};

export default config; 