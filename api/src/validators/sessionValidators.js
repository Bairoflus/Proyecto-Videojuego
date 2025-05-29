/**
 * Joi validation schemas for session endpoints
 * Validates request data for session-related operations
 */
import Joi from 'joi';

/**
 * Schema for creating a new game session
 * POST /api/sessions
 */
export const createSessionSchema = Joi.object({
  device_info: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .description('Optional device information for the session')
}); 