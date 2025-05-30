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

/**
 * Schema for weapon equipment request body
 */
export const equipWeaponsSchema = Joi.array().items(
  Joi.object({
    weapon_slot: Joi.string().valid('melee', 'rango').required()
      .description('Weapon slot type: melee or rango'),
    weapon_id: Joi.number().integer().positive().required()
      .description('ID of the weapon to equip')
  })
).min(1).max(2).required()
  .description('Array of weapons to equip (max 2: one per slot)');

/**
 * Schema for run ID parameter in weapons endpoint
 */
export const runIdWeaponsParamSchema = Joi.object({
  run_id: Joi.number().integer().positive().required()
    .description('Run ID for weapon equipment')
}); 