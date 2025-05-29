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

/**
 * Update an existing session (keep_alive or close)
 * PUT /api/sessions/:session_id
 * Requires Bearer token authentication and session ownership validation
 */
export const updateSession = async (req, res, next) => {
  try {
    // Extract data from request
    const userId = req.userId; // Set by extractBearerToken middleware
    const sessionId = parseInt(req.params.session_id, 10);
    const { action } = req.body;
    
    // Validate user ID exists (should be set by middleware)
    if (!userId) {
      return next(createError('User ID not found in authenticated request', 401));
    }
    
    // Validate session ID is a valid number
    if (isNaN(sessionId) || sessionId <= 0) {
      return next(createError('Invalid session ID', 400));
    }
    
    // Check if session exists
    const session = await User.findSessionById(sessionId);
    if (!session) {
      return next(createError('Session not found', 404));
    }
    
    // Validate session ownership - only the owner can update their session
    const isOwner = await User.isSessionOwner(userId, sessionId);
    if (!isOwner) {
      return next(createError('Unauthorized: You can only update your own sessions', 401));
    }
    
    let updatedSession;
    
    // Execute the requested action
    switch (action) {
      case 'keep_alive':
        // Update last_active timestamp and ensure session is active
        updatedSession = await User.updateSessionActivity(sessionId);
        if (!updatedSession) {
          return next(createError('Failed to update session or session is already closed', 400));
        }
        break;
        
      case 'close':
        // Close the session
        updatedSession = await User.closeSessionById(sessionId);
        if (!updatedSession) {
          return next(createError('Failed to close session or session is already closed', 400));
        }
        break;
        
      default:
        return next(createError('Invalid action. Must be "keep_alive" or "close"', 400));
    }
    
    // Respond with 200 OK and updated session data
    res.status(200).json({
      session_id: updatedSession.session_id,
      last_active: updatedSession.last_active,
      status: updatedSession.status
    });
    
  } catch (error) {
    console.error('Update session error:', error);
    next(createError('Failed to update session', 500));
  }
}; 