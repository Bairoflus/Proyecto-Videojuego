import { User } from '../models/User.js';
import { executeQuery } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Obtener estadísticas del jugador
 */
export const getPlayerStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) {
      return next(createError('Usuario no encontrado', 404));
    }

    const stats = await user.getPlayerStats();
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener configuraciones del jugador
 */
export const getPlayerSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) {
      return next(createError('Usuario no encontrado', 404));
    }

    const settings = await user.getPlayerSettings();
    
    res.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar configuraciones del jugador
 */
export const updatePlayerSettings = async (req, res, next) => {
  try {
    const { music_volume, sfx_volume } = req.body;
    const userId = req.user.user_id;

    const query = `
      UPDATE player_settings 
      SET music_volume = ?, sfx_volume = ?, last_updated = NOW()
      WHERE user_id = ?
    `;

    await executeQuery(query, [music_volume, sfx_volume, userId]);

    res.json({
      success: true,
      message: 'Configuraciones actualizadas exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Iniciar una nueva partida
 */
export const startNewRun = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Crear nueva entrada en run_history
    const query = `
      INSERT INTO run_history (user_id, started_at, completed, gold_collected, 
                              gold_spent, total_kills, last_room_id)
      VALUES (?, NOW(), FALSE, 0, 0, 0, 1)
    `;

    const result = await executeQuery(query, [userId]);
    const runId = result.insertId;

    // Actualizar estadísticas del jugador
    const updateStatsQuery = `
      UPDATE player_stats 
      SET total_runs = total_runs + 1, updated_at = NOW()
      WHERE user_id = ?
    `;
    await executeQuery(updateStatsQuery, [userId]);

    res.json({
      success: true,
      message: 'Nueva partida iniciada',
      data: {
        run_id: runId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizar partida
 */
export const endRun = async (req, res, next) => {
  try {
    const { run_id, completed, death_cause, final_room_id } = req.body;
    const userId = req.user.user_id;

    // Actualizar run_history
    const query = `
      UPDATE run_history 
      SET ended_at = NOW(), completed = ?, death_cause = ?, last_room_id = ?
      WHERE run_id = ? AND user_id = ?
    `;

    await executeQuery(query, [completed, death_cause, final_room_id, run_id, userId]);

    // Si completó la partida, actualizar estadísticas
    if (completed) {
      const updateStatsQuery = `
        UPDATE player_stats 
        SET runs_completed = runs_completed + 1, updated_at = NOW()
        WHERE user_id = ?
      `;
      await executeQuery(updateStatsQuery, [userId]);
    }

    res.json({
      success: true,
      message: 'Partida finalizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar evento del jugador
 */
export const recordPlayerEvent = async (req, res, next) => {
  try {
    const { run_id, room_id, event_type, value, weapon_type, context } = req.body;
    const userId = req.user.user_id;

    const query = `
      INSERT INTO player_events (run_id, user_id, room_id, event_type, value, 
                                weapon_type, context, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await executeQuery(query, [run_id, userId, room_id, event_type, value, weapon_type, context]);

    res.json({
      success: true,
      message: 'Evento registrado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar compra en tienda
 */
export const recordShopPurchase = async (req, res, next) => {
  try {
    const { run_id, room_id, item_type, item_name, gold_spent } = req.body;
    const userId = req.user.user_id;

    const query = `
      INSERT INTO shop_purchases (user_id, run_id, room_id, item_type, 
                                 item_name, gold_spent, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    await executeQuery(query, [userId, run_id, room_id, item_type, item_name, gold_spent]);

    // Actualizar gold_spent en run_history
    const updateRunQuery = `
      UPDATE run_history 
      SET gold_spent = gold_spent + ?
      WHERE run_id = ? AND user_id = ?
    `;
    await executeQuery(updateRunQuery, [gold_spent, run_id, userId]);

    res.json({
      success: true,
      message: 'Compra registrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar recolección de cofre
 */
export const recordChestCollection = async (req, res, next) => {
  try {
    const { run_id, room_id, gold_received } = req.body;
    const userId = req.user.user_id;

    const query = `
      INSERT INTO chest_events (user_id, run_id, room_id, gold_received, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await executeQuery(query, [userId, run_id, room_id, gold_received]);

    // Actualizar gold_collected en run_history
    const updateRunQuery = `
      UPDATE run_history 
      SET gold_collected = gold_collected + ?
      WHERE run_id = ? AND user_id = ?
    `;
    await executeQuery(updateRunQuery, [gold_received, run_id, userId]);

    res.json({
      success: true,
      message: 'Recolección de cofre registrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de partidas
 */
export const getRunHistory = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT run_id, started_at, ended_at, completed, gold_collected, 
             gold_spent, total_kills, death_cause, last_room_id
      FROM run_history 
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `;

    const runs = await executeQuery(query, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: {
        runs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: runs.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 