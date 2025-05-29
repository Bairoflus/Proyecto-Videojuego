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
      return next(createError('Email is already registered', 409));
    }

    // Check if username already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return next(createError('Username is already in use', 409));
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
 * User login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    // Verify password using bcrypt
    const isValidPassword = await User.verifyPassword(email, password);
    if (!isValidPassword) {
      return next(createError('Invalid credentials', 401));
    }

    // Generate session token and create session
    const session = await User.createSession(user.user_id);

    // Respond with 200 OK and session data
    res.status(200).json({
      session_id: session.sessionId,
      session_token: session.sessionToken,
      user_id: user.user_id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User logout
 * Closes the active session by marking it as closed
 */
export const logout = async (req, res, next) => {
  try {
    // Session token is extracted by extractBearerToken middleware
    const sessionToken = req.sessionToken;
    
    // Close the session (idempotent operation)
    const sessionClosed = await User.closeSession(sessionToken);
    
    // If session doesn't exist, respond with 401 Unauthorized
    if (!sessionClosed) {
      return next(createError('Invalid or expired session', 401));
    }
    
    // Respond with 204 No Content (successful logout, no body)
    res.status(204).send();
    
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
}; 