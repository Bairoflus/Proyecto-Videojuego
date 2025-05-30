import express from 'express';
import { createRun, getRunById, getUserRuns } from '../controllers/runController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { extractBearerToken, validateActiveSession } from '../middleware/auth.js';
import { createRunSchema, runIdParamSchema } from '../validators/runValidators.js';

const router = express.Router();

/**
 * @route   POST /api/runs
 * @desc    Create a new game run - Start a new run
 * @access  Private (requires valid session)
 */
router.post('/',
  extractBearerToken,
  validateActiveSession,
  validateBody(createRunSchema),
  createRun
);

/**
 * @route   GET /api/runs/:id
 * @desc    Get specific run by ID
 * @access  Private (requires valid session and ownership)
 */
router.get('/:id',
  extractBearerToken,
  validateActiveSession,
  validateParams(runIdParamSchema),
  getRunById
);

/**
 * @route   GET /api/runs
 * @desc    Get user's run history
 * @access  Private (requires valid session)
 */
router.get('/',
  extractBearerToken,
  validateActiveSession,
  getUserRuns
);

export default router; 