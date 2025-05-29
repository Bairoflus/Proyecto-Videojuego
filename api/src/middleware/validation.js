/**
 * Middleware de validación usando Joi
 * @param {Object} schema - Esquema de validación de Joi
 * @param {string} property - Propiedad del request a validar ('body', 'params', 'query')
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Mostrar todos los errores, no solo el primero
      stripUnknown: true // Remover propiedades no definidas en el esquema
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errorMessages
      });
    }

    // Reemplazar los datos originales con los datos validados y limpiados
    req[property] = value;
    next();
  };
};

/**
 * Middleware específico para validar el cuerpo de la petición
 * @param {Object} schema - Esquema de validación de Joi
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Middleware específico para validar los parámetros de la URL
 * @param {Object} schema - Esquema de validación de Joi
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Middleware específico para validar los query parameters
 * @param {Object} schema - Esquema de validación de Joi
 */
export const validateQuery = (schema) => validate(schema, 'query'); 