import { executeQuery, executeTransaction } from '../config/database.js';
import { hashPassword, verifyPassword, generateSessionToken, generateExpirationDate } from '../utils/auth.js';

export class User {
  constructor(data = {}) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.created_at = data.created_at;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  static async create(userData) {
    const { username, email, password } = userData;
    
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      const query = `
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      
      const result = await executeQuery(query, [username, email, hashedPassword]);
      
      // Get the created user
      const newUser = await User.findById(result.insertId);
      
      // Create initial player stats
      await User.createInitialPlayerStats(newUser.user_id);
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Create initial player stats
   * @param {number} userId - User ID
   */
  static async createInitialPlayerStats(userId) {
    try {
      // Create player stats
      const statsQuery = `
        INSERT INTO player_stats (user_id, total_runs, runs_completed, total_kills, 
                                 best_single_run_kills, highest_damage_hit, total_gold_earned, 
                                 total_gold_spent, total_playtime_seconds, updated_at)
        VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, NOW())
      `;
      await executeQuery(statsQuery, [userId]);

      // Create initial player settings
      const settingsQuery = `
        INSERT INTO player_settings (user_id, music_volume, sfx_volume, last_updated)
        VALUES (?, 50, 50, NOW())
      `;
      await executeQuery(settingsQuery, [userId]);

      // Create initial player upgrades
      const upgradeTypes = ['vida', 'stamina', 'melee', 'rango', 'velocidad'];
      for (const upgradeType of upgradeTypes) {
        const upgradeQuery = `
          INSERT INTO player_upgrades (user_id, upgrade_type, level, updated_at)
          VALUES (?, ?, 0, NOW())
        `;
        await executeQuery(upgradeQuery, [userId, upgradeType]);
      }
    } catch (error) {
      console.error('Error creating initial stats:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} Found user or null
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE user_id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0]);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} Found user or null
   */
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const results = await executeQuery(query, [email]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} Found user or null
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = ?';
      const results = await executeQuery(query, [username]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0]);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Verify login credentials
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<User|null>} User if credentials are valid
   */
  static async verifyCredentials(email, password) {
    try {
      const user = await User.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }

  /**
   * Create session for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Session data
   */
  static async createSession(userId) {
    try {
      const sessionToken = generateSessionToken();
      const expiresAt = generateExpirationDate(24); // 24 hours
      
      // First create the basic session
      const sessionQuery = `
        INSERT INTO sessions (user_id, session_token, started_at, last_active)
        VALUES (?, ?, NOW(), NOW())
      `;
      
      const result = await executeQuery(sessionQuery, [userId, sessionToken]);
      
      return {
        sessionToken,
        expiresAt,
        sessionId: result.insertId
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Logout (delete token)
   * @param {string} sessionToken - Session token
   * @returns {Promise<boolean>} True if logged out successfully
   */
  static async logout(sessionToken) {
    try {
      const query = 'DELETE FROM sessions WHERE session_token = ?';
      const result = await executeQuery(query, [sessionToken]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   */
  async update(updateData) {
    try {
      const allowedFields = ['username', 'email'];
      const updates = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        return this;
      }
      
      values.push(this.user_id);
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `;
      
      await executeQuery(query, values);
      
      // Get updated user
      const updatedUser = await User.findById(this.user_id);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if changed successfully
   */
  async changePassword(newPassword) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const query = `
        UPDATE users 
        SET password_hash = ?
        WHERE user_id = ?
      `;
      
      const result = await executeQuery(query, [hashedPassword, this.user_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Get player stats
   * @returns {Promise<Object>} Player stats
   */
  async getPlayerStats() {
    try {
      const query = 'SELECT * FROM player_stats WHERE user_id = ?';
      const results = await executeQuery(query, [this.user_id]);
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * Get player settings
   * @returns {Promise<Object>} Player settings
   */
  async getPlayerSettings() {
    try {
      const query = 'SELECT * FROM player_settings WHERE user_id = ?';
      const results = await executeQuery(query, [this.user_id]);
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting player settings:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON object (without password)
   * @returns {Object} User data without sensitive information
   */
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return {
      id: this.user_id, // Maintain API compatibility
      user_id: this.user_id,
      username: this.username,
      email: this.email,
      created_at: this.created_at
    };
  }
} 