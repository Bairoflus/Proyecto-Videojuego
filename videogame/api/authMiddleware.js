/**
 * Simple authentication middleware
 * Verifica token de sesión en headers['authorization']
 */

const createConnection = require('./db.js');

async function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Sin token' 
    });
  }
  
  let connection;
  try {
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT user_id FROM sessions WHERE session_token = ? AND closed_at IS NULL',
      [token]
    );
    
    if (!rows.length) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Token inválido' 
      });
    }
    
    // Adjuntar userId al request para usar en endpoints
    req.userId = rows[0].user_id;
    next();
    
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error de autenticación' 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = authMiddleware; 