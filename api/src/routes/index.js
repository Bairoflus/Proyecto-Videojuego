import express from 'express';
import authRoutes from './auth.js';
import gameRoutes from './game.js';

const router = express.Router();

/**
 * Ruta de salud del API
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'ShatteredTimeline'
  });
});

/**
 * Rutas de autenticación
 */
router.use('/auth', authRoutes);

/**
 * Rutas del juego
 */
router.use('/game', gameRoutes);

export default router; 