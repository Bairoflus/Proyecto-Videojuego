/**
 * Session controller for handling game session operations
 * Manages creation and lifecycle of user game sessions
 */
import { User } from '../models/User.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Create a new game session
 * POST /api/sessions
 * Requires Bearer token authentication
 */
export const createSession = async (req, res, next) => {
  try {
    // User ID is extracted by extractBearerToken and validateActiveSession middleware
    const userId = req.userId;
    const { device_info } = req.body;
    
    // Validate that user ID exists (should be set by middleware)
    if (!userId) {
      return next(createError('User ID not found in authenticated request', 401));
    }
    
    // Create new game session
    const gameSession = await User.createGameSession(userId, device_info);
    
    // Respond with 201 Created and session data
    res.status(201).json({
      success: true,
      message: 'Game session created successfully',
      data: {
        session_id: gameSession.session_id,
        session_token: gameSession.session_token,
        user_id: gameSession.user_id,
        device_info: gameSession.device_info,
        started_at: gameSession.started_at,
        status: gameSession.status
      }
    });
    
  } catch (error) {
    console.error('Create session error:', error);
    next(createError('Failed to create game session', 500));
  }
}; 