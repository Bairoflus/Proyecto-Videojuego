/**
 * Session routes
 * Handles game session related endpoints
 */
import express from 'express';
import { createSession } from '../controllers/sessionController.js';
import { validateBody } from '../middleware/validation.js';
import { extractBearerToken, validateActiveSession } from '../middleware/auth.js';
import { createSessionSchema } from '../validators/sessionValidators.js';

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

export default router; 