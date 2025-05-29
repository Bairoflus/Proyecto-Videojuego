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

/**
 * Schema for updating an existing session
 * PUT /sessions/:session_id
 */
export const updateSessionSchema = Joi.object({
  action: Joi.string()
    .valid('keep_alive', 'close')
    .required()
    .description('Action to perform on the session: keep_alive or close')
});

/**
 * Schema for session ID parameter validation
 * Used in PUT /sessions/:session_id
 */
export const sessionIdParamSchema = Joi.object({
  session_id: Joi.number()
    .integer()
    .positive()
    .required()
    .description('Valid session ID as positive integer')
}); 