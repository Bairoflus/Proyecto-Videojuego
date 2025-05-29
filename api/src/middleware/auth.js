import { executeQuery } from '../config/database.js';

/**
 * Middleware to authenticate user token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Find session in database
    const sessionQuery = 'SELECT * FROM sessions WHERE session_token = ?';
    const sessions = await executeQuery(sessionQuery, [token]);

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const session = sessions[0];

    // Get user information
    const userQuery = 'SELECT user_id, username, email, created_at FROM users WHERE user_id = ?';
    const users = await executeQuery(userQuery, [session.user_id]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Add user information to request
    req.user = users[0];
    req.session = session;

    // Update last activity
    const updateQuery = 'UPDATE sessions SET last_active = NOW() WHERE session_token = ?';
    await executeQuery(updateQuery, [token]);

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Optional authentication middleware
 * Continues without authentication if no token is provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    // Find session in database
    const sessionQuery = 'SELECT * FROM sessions WHERE session_token = ?';
    const sessions = await executeQuery(sessionQuery, [token]);

    if (sessions.length === 0) {
      return next(); // Continue without authentication
    }

    const session = sessions[0];

    // Get user information
    const userQuery = 'SELECT user_id, username, email, created_at FROM users WHERE user_id = ?';
    const users = await executeQuery(userQuery, [session.user_id]);

    if (users.length === 0) {
      return next(); // Continue without authentication
    }

    // Add user information to request
    req.user = users[0];
    req.session = session;

    // Update last activity
    const updateQuery = 'UPDATE sessions SET last_active = NOW() WHERE session_token = ?';
    await executeQuery(updateQuery, [token]);

    next();
  } catch (error) {
    console.error('Error en autenticación opcional:', error);
    next(); // Continue without authentication in case of error
  }
}; 