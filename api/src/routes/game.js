import express from 'express';
import {
  getPlayerStats,
  getPlayerSettings,
  updatePlayerSettings,
  startNewRun,
  endRun,
  recordPlayerEvent,
  recordShopPurchase,
  recordChestCollection,
  getRunHistory
} from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Esquemas de validación
const settingsSchema = Joi.object({
  music_volume: Joi.number().integer().min(0).max(100).required(),
  sfx_volume: Joi.number().integer().min(0).max(100).required()
});

const endRunSchema = Joi.object({
  run_id: Joi.number().integer().positive().required(),
  completed: Joi.boolean().required(),
  death_cause: Joi.string().max(255).optional(),
  final_room_id: Joi.number().integer().positive().optional()
});

const playerEventSchema = Joi.object({
  run_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().required(),
  event_type: Joi.string().valid('dash', 'ataque', 'oro_recogido', 'item_usado', 'entrada_sala', 'salida_sala').required(),
  value: Joi.number().integer().required(),
  weapon_type: Joi.string().max(20).optional(),
  context: Joi.string().max(50).optional()
});

const shopPurchaseSchema = Joi.object({
  run_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().required(),
  item_type: Joi.string().max(20).required(),
  item_name: Joi.string().max(50).required(),
  gold_spent: Joi.number().integer().positive().required()
});

const chestCollectionSchema = Joi.object({
  run_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().required(),
  gold_received: Joi.number().integer().positive().required()
});

/**
 * @route   GET /api/game/stats
 * @desc    Obtener estadísticas del jugador
 * @access  Private
 */
router.get('/stats', authenticateToken, getPlayerStats);

/**
 * @route   GET /api/game/settings
 * @desc    Obtener configuraciones del jugador
 * @access  Private
 */
router.get('/settings', authenticateToken, getPlayerSettings);

/**
 * @route   PUT /api/game/settings
 * @desc    Actualizar configuraciones del jugador
 * @access  Private
 */
router.put('/settings', authenticateToken, validateBody(settingsSchema), updatePlayerSettings);

/**
 * @route   POST /api/game/run/start
 * @desc    Iniciar una nueva partida
 * @access  Private
 */
router.post('/run/start', authenticateToken, startNewRun);

/**
 * @route   PUT /api/game/run/end
 * @desc    Finalizar partida
 * @access  Private
 */
router.put('/run/end', authenticateToken, validateBody(endRunSchema), endRun);

/**
 * @route   GET /api/game/run/history
 * @desc    Obtener historial de partidas
 * @access  Private
 */
router.get('/run/history', authenticateToken, getRunHistory);

/**
 * @route   POST /api/game/event
 * @desc    Registrar evento del jugador
 * @access  Private
 */
router.post('/event', authenticateToken, validateBody(playerEventSchema), recordPlayerEvent);

/**
 * @route   POST /api/game/shop/purchase
 * @desc    Registrar compra en tienda
 * @access  Private
 */
router.post('/shop/purchase', authenticateToken, validateBody(shopPurchaseSchema), recordShopPurchase);

/**
 * @route   POST /api/game/chest/collect
 * @desc    Registrar recolección de cofre
 * @access  Private
 */
router.post('/chest/collect', authenticateToken, validateBody(chestCollectionSchema), recordChestCollection);

export default router; 