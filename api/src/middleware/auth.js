/**
 * Authentication middleware for handling Bearer tokens
 * Extracts and validates session tokens from Authorization header
 */
import { createError } from './errorHandler.js';
import { User } from '../models/User.js';

/**
 * Extract Bearer token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
export const extractBearerToken = (req, res, next) => {
  try {
    // Search header Authorization
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      return next(createError('Authorization header is required', 401));
    }
    
    // Check if header follows Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return next(createError('Authorization header must start with "Bearer "', 401));
    }
    
    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Check if token exists after Bearer
    if (!token || token.trim() === '') {
      return next(createError('Session token is required', 401));
    }
    
    // Attach token to request object for use in controllers
    req.sessionToken = token.trim();
    next();
    
  } catch (error) {
    next(createError('Invalid authorization header format', 401));
  }
};

/**
 * Validate that session exists and is active
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateActiveSession = async (req, res, next) => {
  try {
    // Session token should be extracted by extractBearerToken middleware
    if (!req.sessionToken) {
      return next(createError('Session token not found in request', 401));
    }
    
    // Check if session exists and is active
    const session = await User.findActiveSession(req.sessionToken);
    
    if (!session) {
      return next(createError('Invalid or expired session', 401));
    }
    
    // Attach session info to request for use in controllers
    req.session = session;
    req.userId = session.user_id;
    next();
    
  } catch (error) {
    console.error('Session validation error:', error);
    next(createError('Session validation failed', 401));
  }
}; 