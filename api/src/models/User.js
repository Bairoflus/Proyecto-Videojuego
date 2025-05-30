import { executeQuery, executeTransaction } from '../config/database.js';
import { hashPassword, verifyPassword as bcryptVerifyPassword, generateSessionToken, generateExpirationDate } from '../utils/auth.js';

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
   * Verify password for a specific user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>} True if password is valid
   */
  static async verifyPassword(email, password) {
    try {
      const user = await User.findByEmail(email);
      
      if (!user) {
        return false;
      }
      
      return await bcryptVerifyPassword(password, user.password_hash);
    } catch (error) {
      console.error('Error verifying password:', error);
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
      
      // Create session with started_at and last_active timestamps
      const sessionQuery = `
        INSERT INTO sessions (user_id, session_token, started_at, last_active)
        VALUES (?, ?, NOW(), NOW())
      `;
      
      const result = await executeQuery(sessionQuery, [userId, sessionToken]);
      
      return {
        sessionId: result.insertId,
        sessionToken: sessionToken,
        userId: userId
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Find active session by token
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object|null>} Session data if active, null otherwise
   */
  static async findActiveSession(sessionToken) {
    try {
      const query = `
        SELECT session_id, user_id, session_token, started_at, last_active, closed_at
        FROM sessions 
        WHERE session_token = ? AND closed_at IS NULL
      `;
      
      const results = await executeQuery(query, [sessionToken]);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      console.error('Error finding active session:', error);
      throw error;
    }
  }

  /**
   * Close session by marking it as closed (idempotent operation)
   * @param {string} sessionToken - Session token
   * @returns {Promise<boolean>} True if session was found and processed
   */
  static async closeSession(sessionToken) {
    try {
      // First, check if session exists
      const sessionQuery = `
        SELECT session_id, closed_at 
        FROM sessions 
        WHERE session_token = ?
      `;
      
      const sessionResults = await executeQuery(sessionQuery, [sessionToken]);
      
      // If session doesn't exist, return false
      if (sessionResults.length === 0) {
        return false;
      }
      
      const session = sessionResults[0];
      
      // If session is already closed, operation is idempotent - return true
      if (session.closed_at !== null) {
        return true;
      }
      
      // Close the session by setting closed_at timestamp
      const closeQuery = `
        UPDATE sessions 
        SET closed_at = NOW() 
        WHERE session_token = ? AND closed_at IS NULL
      `;
      
      const result = await executeQuery(closeQuery, [sessionToken]);
      
      // Return true if session was found and updated, or if it was already closed
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Create a new game session for authenticated user
   * @param {number} userId - User ID from validated session
   * @param {string} deviceInfo - Optional device information
   * @returns {Promise<Object>} Game session data
   */
  static async createGameSession(userId, deviceInfo = null) {
    try {
      const sessionToken = generateSessionToken();
      
      // Create game session with active status
      const sessionQuery = `
        INSERT INTO sessions (user_id, session_token, device_info, started_at, last_active, status)
        VALUES (?, ?, ?, NOW(), NOW(), 'active')
      `;
      
      const result = await executeQuery(sessionQuery, [userId, sessionToken, deviceInfo]);
      
      return {
        session_id: result.insertId,
        session_token: sessionToken,
        user_id: userId,
        device_info: deviceInfo,
        started_at: new Date().toISOString(),
        status: 'active'
      };
    } catch (error) {
      console.error('Error creating game session:', error);
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

  /**
   * Find session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data if found, null otherwise
   */
  static async findSessionById(sessionId) {
    try {
      const query = `
        SELECT session_id, user_id, session_token, started_at, last_active, closed_at, device_info, status
        FROM sessions 
        WHERE session_id = ?
      `;
      
      const results = await executeQuery(query, [sessionId]);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  /**
   * Check if user owns the session
   * @param {number} userId - User ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<boolean>} True if user owns the session
   */
  static async isSessionOwner(userId, sessionId) {
    try {
      const session = await User.findSessionById(sessionId);
      
      if (!session) {
        return false;
      }
      
      return session.user_id === userId;
    } catch (error) {
      console.error('Error checking session ownership:', error);
      throw error;
    }
  }

  /**
   * Update session activity (keep_alive action)
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object|null>} Updated session data or null if not found
   */
  static async updateSessionActivity(sessionId) {
    try {
      // Update last_active timestamp and ensure status is active
      const updateQuery = `
        UPDATE sessions 
        SET last_active = NOW(), status = 'active'
        WHERE session_id = ? AND closed_at IS NULL
      `;
      
      const result = await executeQuery(updateQuery, [sessionId]);
      
      if (result.affectedRows === 0) {
        return null; // Session not found or already closed
      }
      
      // Return updated session data
      return await User.findSessionById(sessionId);
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  /**
   * Close session by ID (close action)
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object|null>} Updated session data or null if not found
   */
  static async closeSessionById(sessionId) {
    try {
      // Close session by setting closed_at and status
      const closeQuery = `
        UPDATE sessions 
        SET closed_at = NOW(), status = 'closed'
        WHERE session_id = ? AND closed_at IS NULL
      `;
      
      const result = await executeQuery(closeQuery, [sessionId]);
      
      if (result.affectedRows === 0) {
        return null; // Session not found or already closed
      }
      
      // Return updated session data
      return await User.findSessionById(sessionId);
    } catch (error) {
      console.error('Error closing session by ID:', error);
      throw error;
    }
  }
} 