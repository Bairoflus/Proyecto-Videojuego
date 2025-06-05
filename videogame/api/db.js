/**
 * Simple database connection for Project Shattered Timeline
 * Hardcoded configuration for development environment
 * 
 * Para cambiar entorno, modificar directamente estas credenciales:
 * - host: dirección del servidor MySQL
 * - user: usuario de base de datos  
 * - password: contraseña del usuario
 * - database: nombre de la base de datos
 * - port: puerto de MySQL (normalmente 3306)
 */

const mysql = require('mysql2/promise');

// Función para crear conexión simple
async function createConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'tc2005b', 
    password: 'qwer1234',
    database: 'ProjectShatteredTimeline',
    port: 3306
  });
}

module.exports = createConnection; 