import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config, validateConfig } from './config/config.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

// Validate configuration at startup
validateConfig();

// Create Express application
const app = express();

// Configure CORS
app.use(cors(config.cors));

// Logging middleware
app.use(morgan(config.logging.level));

// Middleware to parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic security middleware
app.use((req, res, next) => {
  // Remove header that exposes server information
  res.removeHeader('X-Powered-By');
  
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Main routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Shattered Timeline API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Middleware for not found routes
app.use(notFoundHandler);

// Error handling middleware (must be at the end)
app.use(errorHandler);

// Function to start the server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Could not connect to database');
      process.exit(1);
    }

    // Start server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      console.log(`Environment: ${config.server.env}`);
      console.log(`CORS configured for: ${config.cors.origin}`);
      console.log(`Logging level: ${config.logging.level}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`   GET  /                    - API information`);
      console.log(`   GET  /api/health          - Server status`);
      console.log(`   POST /api/auth/register   - Register user`);
      console.log(`   POST /api/auth/login      - Login`);
      console.log(`   POST /api/auth/logout     - Logout`);
      console.log(`   GET  /api/auth/profile    - Get profile`);
      console.log(`   PUT  /api/auth/profile    - Update profile`);
      console.log(`   PUT  /api/auth/change-password - Change password`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received, closing server...');
  process.exit(0);
});

// Start server
startServer();

export default app; 