import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  changePasswordSchema 
} from '../validators/userValidators.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put('/change-password', authenticateToken, validateBody(changePasswordSchema), changePassword);

export default router; 