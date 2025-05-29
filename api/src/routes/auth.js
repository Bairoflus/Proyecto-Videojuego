import express from 'express';
import { 
  register, 
  login,
  logout
} from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
import { extractBearerToken } from '../middleware/auth.js';
import { 
  registerSchema, 
  loginSchema
} from '../validators/userValidators.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout - Close active session
 * @access  Private (requires Bearer token)
 */
router.post('/logout', extractBearerToken, logout);

export default router; 