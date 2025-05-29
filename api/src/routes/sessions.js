/**
 * Session routes
 * Handles game session related endpoints
 */
import express from 'express';
import { createSession, updateSession } from '../controllers/sessionController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { extractBearerToken, validateActiveSession } from '../middleware/auth.js';
import { createSessionSchema, updateSessionSchema, sessionIdParamSchema } from '../validators/sessionValidators.js';

const router = express.Router();

/**
 * @route   POST /api/sessions
 * @desc    Create a new game session
 * @access  Private (requires Bearer token)
 */
router.post('/', 
  extractBearerToken,           // Extract and validate Bearer token
  validateActiveSession,        // Ensure session is active and get user_id
  validateBody(createSessionSchema),  // Validate request body
  createSession                 // Create game session
);

/**
 * @route   PUT /api/sessions/:session_id
 * @desc    Update an existing session (keep_alive or close)
 * @access  Private (requires Bearer token and session ownership)
 */
router.put('/:session_id',
  extractBearerToken,           // Extract and validate Bearer token
  validateActiveSession,        // Ensure session is active and get user_id
  validateParams(sessionIdParamSchema),  // Validate session_id parameter
  validateBody(updateSessionSchema),     // Validate request body (action field)
  updateSession                 // Update session
);

export default router; 