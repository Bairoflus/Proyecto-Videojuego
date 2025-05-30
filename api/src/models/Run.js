import { executeQuery } from '../config/database.js';

export class Run {
  constructor(data = {}) {
    this.run_id = data.run_id;
    this.user_id = data.user_id;
    this.started_at = data.started_at;
    this.ended_at = data.ended_at;
    this.completed = data.completed;
    this.gold_collected = data.gold_collected;
    this.gold_spent = data.gold_spent;
    this.total_kills = data.total_kills;
    this.death_cause = data.death_cause;
    this.last_room_id = data.last_room_id;
  }

  /**
   * Create a new game run
   * @param {number} userId - User ID who is starting the run
   * @param {number} sessionId - Session ID to associate with the run
   * @returns {Promise<Object>} Created run data
   */
  static async createRun(userId, sessionId) {
    try {
      // First verify the session exists and belongs to the user
      const sessionQuery = `
        SELECT session_id, user_id 
        FROM sessions 
        WHERE session_id = ? AND user_id = ? AND closed_at IS NULL
      `;
      
      const sessionResults = await executeQuery(sessionQuery, [sessionId, userId]);
      
      if (sessionResults.length === 0) {
        return null; // Session not found or doesn't belong to user
      }
      
      // Create new run in run_history table
      const runQuery = `
        INSERT INTO run_history (user_id, started_at, completed, gold_collected, gold_spent, total_kills)
        VALUES (?, NOW(), 0, 0, 0, 0)
      `;
      
      const result = await executeQuery(runQuery, [userId]);
      
      // Get the created run data
      const getRunQuery = `
        SELECT run_id, user_id, started_at, completed, gold_collected, gold_spent, total_kills
        FROM run_history 
        WHERE run_id = ?
      `;
      
      const runResults = await executeQuery(getRunQuery, [result.insertId]);
      
      if (runResults.length === 0) {
        throw new Error('Failed to retrieve created run');
      }
      
      return new Run(runResults[0]);
    } catch (error) {
      console.error('Error creating run:', error);
      throw error;
    }
  }

  /**
   * Find run by ID
   * @param {number} runId - Run ID
   * @returns {Promise<Run|null>} Found run or null
   */
  static async findById(runId) {
    try {
      const query = 'SELECT * FROM run_history WHERE run_id = ?';
      const results = await executeQuery(query, [runId]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new Run(results[0]);
    } catch (error) {
      console.error('Error finding run by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's run history
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of runs to return
   * @returns {Promise<Run[]>} Array of user's runs
   */
  static async getUserRuns(userId, limit = 50) {
    try {
      const query = `
        SELECT * FROM run_history 
        WHERE user_id = ? 
        ORDER BY started_at DESC 
        LIMIT ?
      `;
      
      const results = await executeQuery(query, [userId, limit]);
      
      return results.map(runData => new Run(runData));
    } catch (error) {
      console.error('Error getting user runs:', error);
      throw error;
    }
  }

  /**
   * Verify if run exists and belongs to user
   * @param {number} runId - Run ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if run exists and belongs to user
   */
  static async verifyRunOwnership(runId, userId) {
    try {
      const query = 'SELECT run_id FROM run_history WHERE run_id = ? AND user_id = ?';
      const results = await executeQuery(query, [runId, userId]);
      return results.length > 0;
    } catch (error) {
      console.error('Error verifying run ownership:', error);
      throw error;
    }
  }

  /**
   * Equip weapons for a run (upsert into equipped_weapons table)
   * @param {number} runId - Run ID
   * @param {number} userId - User ID
   * @param {Array} weaponsData - Array of {weapon_slot, weapon_id}
   * @returns {Promise<Array>} Array of equipped weapons
   */
  static async equipWeapons(runId, userId, weaponsData) {
    try {
      // First delete existing equipped weapons for this run and user
      const deleteQuery = 'DELETE FROM equipped_weapons WHERE run_id = ? AND user_id = ?';
      await executeQuery(deleteQuery, [runId, userId]);
      
      // Insert new weapon equipment
      const equipped = [];
      for (const weaponData of weaponsData) {
        const insertQuery = `
          INSERT INTO equipped_weapons (run_id, user_id, weapon_slot, weapon_id)
          VALUES (?, ?, ?, ?)
        `;
        
        await executeQuery(insertQuery, [
          runId, 
          userId, 
          weaponData.weapon_slot, 
          weaponData.weapon_id
        ]);
        
        equipped.push({
          weapon_slot: weaponData.weapon_slot,
          weapon_id: weaponData.weapon_id
        });
      }
      
      return equipped;
    } catch (error) {
      console.error('Error equipping weapons:', error);
      throw error;
    }
  }

  /**
   * Get equipped weapons for a run
   * @param {number} runId - Run ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of equipped weapons
   */
  static async getEquippedWeapons(runId, userId) {
    try {
      const query = `
        SELECT weapon_slot, weapon_id 
        FROM equipped_weapons 
        WHERE run_id = ? AND user_id = ?
        ORDER BY weapon_slot
      `;
      
      const results = await executeQuery(query, [runId, userId]);
      return results;
    } catch (error) {
      console.error('Error getting equipped weapons:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON object
   * @returns {Object} Run data
   */
  toJSON() {
    return {
      run_id: this.run_id,
      user_id: this.user_id,
      started_at: this.started_at,
      ended_at: this.ended_at,
      completed: this.completed,
      gold_collected: this.gold_collected,
      gold_spent: this.gold_spent,
      total_kills: this.total_kills,
      death_cause: this.death_cause,
      last_room_id: this.last_room_id
    };
  }
} 