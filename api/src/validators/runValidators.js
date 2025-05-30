import Joi from 'joi';

/**
 * Schema for creating a new game run
 */
export const createRunSchema = Joi.object({
  session_id: Joi.number().integer().positive().required()
    .description('Active game session ID to associate with the run')
});

/**
 * Schema for run ID parameter validation
 */
export const runIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .description('Run ID')
}); 