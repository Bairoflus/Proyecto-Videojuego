import express from 'express';
import { 
  register, 
  login
} from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
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

export default router; 