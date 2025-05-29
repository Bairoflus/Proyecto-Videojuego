/**
 * Centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error captured:', err);

  // Joi validation error
  if (err.isJoi) {
    const errorMessages = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errorMessages
    });
  }

  // MySQL error
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          success: false,
          message: 'Resource already exists',
          error: 'Duplicate entry'
        });
      
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({
          success: false,
          message: 'Invalid reference',
          error: 'Foreign key constraint'
        });
      
      case 'ECONNREFUSED':
        return res.status(503).json({
          success: false,
          message: 'Service unavailable',
          error: 'Database connection refused'
        });
      
      default:
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
  }

  // Custom error with status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

/**
 * Middleware to handle routes not found (404)
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

/**
 * Function to create custom errors
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 */
export const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
}; 