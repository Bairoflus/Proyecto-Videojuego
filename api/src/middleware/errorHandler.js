/**
 * Middleware de manejo de errores centralizado
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err);

  // Error de validación de Joi
  if (err.isJoi) {
    const errorMessages = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errorMessages
    });
  }

  // Error de MySQL
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          success: false,
          message: 'El recurso ya existe',
          error: 'Duplicate entry'
        });
      
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida',
          error: 'Foreign key constraint'
        });
      
      case 'ECONNREFUSED':
        return res.status(503).json({
          success: false,
          message: 'Servicio no disponible',
          error: 'Database connection refused'
        });
      
      default:
        console.error('Error de base de datos:', err);
        return res.status(500).json({
          success: false,
          message: 'Error de base de datos',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
  }

  // Error personalizado con status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message || 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

/**
 * Función para crear errores personalizados
 * @param {string} message - Mensaje del error
 * @param {number} status - Código de estado HTTP
 */
export const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
}; 