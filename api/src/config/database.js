import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración de la conexión a la base de datos MySQL
 * Adaptada para la base de datos ShatteredTimeline
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ShatteredTimeline',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * Pool de conexiones a la base de datos
 */
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection to ShatteredTimeline established successfully');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    return false;
  }
};

/**
 * Execute a SQL query
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {query, params} objects
 * @returns {Promise<Array>} Array of results
 */
export const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export default pool; 