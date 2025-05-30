import express from 'express';
import authRoutes from './auth.js';
import sessionRoutes from './sessions.js';
import runRoutes from './runs.js';

const router = express.Router();

/**
 * API health route
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API working correctly',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'ShatteredTimeline'
  });
});

/**
 * Authentication routes
 */
router.use('/auth', authRoutes);

/**
 * Session routes
 */
router.use('/sessions', sessionRoutes);

/**
 * Run routes
 */
router.use('/runs', runRoutes);

export default router; 