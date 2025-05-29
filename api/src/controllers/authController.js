import { User } from '../models/User.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return next(createError('El email ya está registrado', 409));
    }

    // Check if username already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return next(createError('El nombre de usuario ya está en uso', 409));
    }

    // Create new user
    const newUser = await User.create({ username, email, password });

    // Respond with 201 status code and user information
    res.status(201).json({
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verify credentials
    const user = await User.verifyCredentials(email, password);
    if (!user) {
      return next(createError('Credenciales inválidas', 401));
    }

    // Create new session
    const session = await User.createSession(user.id);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: user.toJSON(),
        token: session.sessionToken,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await User.logout(token);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(createError('Usuario no encontrado', 404));
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return next(createError('Usuario no encontrado', 404));
    }

    // Check if new email already exists (if changing)
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return next(createError('El email ya está en uso', 409));
      }
    }

    // Check if new username already exists (if changing)
    if (username && username !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return next(createError('El nombre de usuario ya está en uso', 409));
      }
    }

    // Update user
    const updatedUser = await user.update({ username, email });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return next(createError('Usuario no encontrado', 404));
    }

    // Verify current password
    const isValidPassword = await User.verifyCredentials(user.email, currentPassword);
    if (!isValidPassword) {
      return next(createError('Contraseña actual incorrecta', 400));
    }

    // Change password
    const success = await user.changePassword(newPassword);
    
    if (!success) {
      return next(createError('Error al cambiar la contraseña', 500));
    }

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    next(error);
  }
}; 