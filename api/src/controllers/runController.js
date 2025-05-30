import { Run } from '../models/Run.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Create a new game run
 */
export const createRun = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const userId = req.userId; // From validateActiveSession middleware
    const { session_id } = req.body;
    
    // 2. Business validations
    if (!userId) {
      return next(createError('User ID not found', 401));
    }
    
    if (!session_id) {
      return next(createError('Session ID is required', 400));
    }
    
    // 3. Main logic - Create run
    const newRun = await Run.createRun(userId, session_id);
    
    if (!newRun) {
      return next(createError('Invalid session or session does not belong to user', 404));
    }
    
    // 4. Successful response
    res.status(201).json({
      run_id: newRun.run_id,
      started_at: newRun.started_at,
      user_id: newRun.user_id,
      gold_collected: newRun.gold_collected,
      gold_spent: newRun.gold_spent,
      total_kills: newRun.total_kills,
      completed: newRun.completed
    });
    
  } catch (error) {
    console.error('Create run error:', error);
    next(createError('Failed to create run', 500));
  }
};

/**
 * Get run by ID
 */
export const getRunById = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const userId = req.userId;
    const runId = parseInt(req.params.id, 10);
    
    // 2. Business validations
    if (!userId) {
      return next(createError('User ID not found', 401));
    }
    
    if (isNaN(runId)) {
      return next(createError('Invalid run ID', 400));
    }
    
    // 3. Main logic - Get run
    const run = await Run.findById(runId);
    
    if (!run) {
      return next(createError('Run not found', 404));
    }
    
    // Verify ownership
    if (run.user_id !== userId) {
      return next(createError('Access denied', 403));
    }
    
    // 4. Successful response
    res.status(200).json(run.toJSON());
    
  } catch (error) {
    console.error('Get run error:', error);
    next(createError('Failed to get run', 500));
  }
};

/**
 * Get user's run history
 */
export const getUserRuns = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const userId = req.userId;
    const limit = parseInt(req.query.limit, 10) || 50;
    
    // 2. Business validations
    if (!userId) {
      return next(createError('User ID not found', 401));
    }
    
    if (limit < 1 || limit > 100) {
      return next(createError('Limit must be between 1 and 100', 400));
    }
    
    // 3. Main logic - Get user runs
    const runs = await Run.getUserRuns(userId, limit);
    
    // 4. Successful response
    res.status(200).json({
      runs: runs.map(run => run.toJSON()),
      total: runs.length
    });
    
  } catch (error) {
    console.error('Get user runs error:', error);
    next(createError('Failed to get user runs', 500));
  }
};

/**
 * Equip weapons for a run
 */
export const equipWeapons = async (req, res, next) => {
  try {
    // 1. Extract data from request
    const userId = req.userId; // From validateActiveSession middleware
    const runId = parseInt(req.params.run_id, 10);
    const weaponsData = req.body; // Array of {weapon_slot, weapon_id}
    
    // 2. Business validations
    if (!userId) {
      return next(createError('User ID not found', 401));
    }
    
    if (isNaN(runId)) {
      return next(createError('Invalid run ID', 400));
    }
    
    // Verify run exists and belongs to user
    const runExists = await Run.verifyRunOwnership(runId, userId);
    if (!runExists) {
      return next(createError('Run not found or access denied', 404));
    }
    
    // Validate weapon slots uniqueness (one weapon per slot)
    const slots = weaponsData.map(w => w.weapon_slot);
    const uniqueSlots = new Set(slots);
    if (slots.length !== uniqueSlots.size) {
      return next(createError('Duplicate weapon slots not allowed', 400));
    }
    
    // 3. Main logic - Equip weapons
    const equippedWeapons = await Run.equipWeapons(runId, userId, weaponsData);
    
    // 4. Successful response
    res.status(200).json({
      run_id: runId,
      equipped: equippedWeapons
    });
    
  } catch (error) {
    console.error('Equip weapons error:', error);
    next(createError('Failed to equip weapons', 500));
  }
}; 