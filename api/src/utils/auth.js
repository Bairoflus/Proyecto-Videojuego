import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config.js';

/**
 * Hashear una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = config.security.bcryptSaltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
};

/**
 * Verificar una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} True si la contraseña es correcta
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

/**
 * Generar un token de sesión único
 * @returns {string} Token UUID v4
 */
export const generateSessionToken = () => {
  return uuidv4();
};

/**
 * Generar una fecha de expiración para el token
 * @param {number} hours - Horas hasta la expiración (por defecto 24)
 * @returns {Date} Fecha de expiración
 */
export const generateExpirationDate = (hours = 24) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate;
};

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar fortaleza de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con resultado de validación y errores
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 