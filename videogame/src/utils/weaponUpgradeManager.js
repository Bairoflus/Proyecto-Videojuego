// ===================================================
// WEAPON UPGRADE MANAGER - SHATTERED TIMELINE
// ===================================================
// Objective: Handle temporary weapon upgrades
// Logic: Keep on logout, reset on death
// ===================================================

import { apiRequest } from "./api.js";
import { EnumUtils } from "../constants/gameEnums.js";

export class WeaponUpgradeManager {
  constructor() {
    this.currentUpgrades = {
      melee: 1,
      ranged: 1,
    };
    this.userId = null;
    this.runId = null;

    // Performance optimization: Cache calculated values
    this.damageCache = new Map();
    this.costCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 30000; // 30 seconds

    // Debouncing for save operations
    this.saveDebounceTimeout = null;
    this.pendingSave = false;

    // Performance metrics
    this.performanceMetrics = {
      saveCount: 0,
      loadCount: 0,
      averageSaveTime: 0,
      averageLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Memory leak prevention
    this.cleanupTasks = new Set();
    this.eventListeners = new Set();

    // Setup cleanup listeners
    this.setupCleanupListeners();
  }

  // ===================================================
  // MEMORY LEAK PREVENTION
  // ===================================================

  /**
   * Setup cleanup listeners to prevent memory leaks
   */
  setupCleanupListeners() {
    const beforeUnloadHandler = () => this.cleanup();
    window.addEventListener("beforeunload", beforeUnloadHandler);

    this.eventListeners.add(() =>
      window.removeEventListener("beforeunload", beforeUnloadHandler)
    );
  }

  /**
   * Cleanup all resources to prevent memory leaks
   */
  cleanup() {
    console.log("Cleaning up WeaponUpgradeManager resources...");

    // Clear debounce timeout
    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
      this.saveDebounceTimeout = null;
    }

    // Clear caches
    this.damageCache.clear();
    this.costCache.clear();

    // Remove event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.clear();

    // Execute cleanup tasks
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks.clear();

    // Reset state
    this.currentUpgrades = { melee: 1, ranged: 1 };
    this.userId = null;
    this.runId = null;
    this.pendingSave = false;

    console.log("Weapon upgrade manager cleaned up");
  }

  // ===================================================
  // CACHE MANAGEMENT
  // ===================================================

  /**
   * Generate cache key for damage/cost calculations
   * @param {string} weaponType - Weapon type
   * @param {number} level - Weapon level
   */
  generateCacheKey(weaponType, level) {
    return `${weaponType}_${level}`;
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    return Date.now() - this.lastCacheUpdate < this.cacheTimeout;
  }

  /**
   * Clear cache if expired
   */
  clearExpiredCache() {
    if (!this.isCacheValid()) {
      this.damageCache.clear();
      this.costCache.clear();
      this.lastCacheUpdate = Date.now();
    }
  }

  /**
   * Get cached weapon damage
   * @param {string} weaponType - Weapon type
   * @param {number} level - Weapon level
   */
  getCachedDamage(weaponType, level) {
    this.clearExpiredCache();

    const key = this.generateCacheKey(weaponType, level);

    if (this.damageCache.has(key)) {
      this.performanceMetrics.cacheHits++;
      return this.damageCache.get(key);
    }

    this.performanceMetrics.cacheMisses++;
    const damage = EnumUtils.calculateWeaponDamage(weaponType, level);
    this.damageCache.set(key, damage);

    return damage;
  }

  /**
   * Get cached upgrade cost
   * @param {string} weaponType - Weapon type
   * @param {number} level - Target level
   */
  getCachedCost(weaponType, level) {
    this.clearExpiredCache();

    const key = this.generateCacheKey(weaponType, level);

    if (this.costCache.has(key)) {
      this.performanceMetrics.cacheHits++;
      return this.costCache.get(key);
    }

    this.performanceMetrics.cacheMisses++;
    const cost = EnumUtils.calculateUpgradeCost(weaponType, level);
    this.costCache.set(key, cost);

    return cost;
  }

  // ===================================================
  // INITIALIZATION AND CONFIGURATION
  // ===================================================

  /**
   * Initializes the manager with user and run data
   * @param {number} userId - User ID
   * @param {number} runId - Current run ID
   */
  async initialize(userId, runId) {
    const startTime = performance.now();

    try {
      this.userId = userId;
      this.runId = runId;

      // Load existing upgrades for this run
      await this.loadCurrentUpgrades();

      const initTime = performance.now() - startTime;
      console.log(
        `WeaponUpgradeManager initialized in ${initTime.toFixed(2)}ms`
      );
    } catch (error) {
      console.error("Error initializing WeaponUpgradeManager:", error);
      throw error;
    }
  }

  /**
   * Loads current temporary upgrades from the database
   */
  async loadCurrentUpgrades() {
    const startTime = performance.now();

    try {
      if (!this.userId || !this.runId) {
        console.warn("Cannot load upgrades: missing userId or runId");
        return;
      }

      const response = await apiRequest(
        `/users/${this.userId}/weapon-upgrades/${this.runId}`
      );

      const loadTime = performance.now() - startTime;
      this.updateLoadMetrics(loadTime, true);

      if (response.success && response.data) {
        this.currentUpgrades = {
          melee: response.data.close_combat || 1,
          ranged: response.data.distance_combat || 1,
        };

        // Only log during initial load or significant events
        // console.log(`Weapon upgrades loaded in ${loadTime.toFixed(2)}ms:`, this.currentUpgrades);
      } else {
        // No previous upgrades, use default values
        this.currentUpgrades = { melee: 1, ranged: 1 };
        // console.log('Using default weapon levels');
      }

      // Clear cache since levels may have changed
      this.damageCache.clear();
      this.costCache.clear();
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      const loadTime = performance.now() - startTime;
      this.updateLoadMetrics(loadTime, false);
      console.error("Error loading weapon upgrades:", error);
      this.currentUpgrades = { melee: 1, ranged: 1 };
    }
  }

  // ===================================================
  // UPGRADE METHODS
  // ===================================================

  /**
   * Upgrades a weapon to the next level
   * @param {string} weaponType - Weapon type ('melee' or 'ranged')
   * @returns {Object} - {success: boolean, newLevel?: number, message?: string}
   */
  async upgradeWeapon(weaponType) {
    if (!this.isValidWeaponType(weaponType)) {
      console.error("Invalid weapon type:", weaponType);
      return {
        success: false,
        message: `Invalid weapon type: ${weaponType}`,
      };
    }

    const currentLevel = this.currentUpgrades[weaponType];
    const maxLevel = 15; // From gameEnums

    if (currentLevel >= maxLevel) {
      console.warn(`${weaponType} weapon already at max level (${maxLevel})`);
      return {
        success: false,
        message: `${weaponType} weapon already at max level (${maxLevel})`,
      };
    }

    // Store original level for rollback
    const originalLevel = currentLevel;

    // Increment level locally
    this.currentUpgrades[weaponType] = currentLevel + 1;

    // Clear cache for this weapon type
    this.invalidateWeaponCache(weaponType);

    // Sync with database using debounced save
    const success = await this.debouncedSave();

    if (success) {
      // Only log significant weapon upgrades, not every level change
      // console.log(`${weaponType} weapon upgraded to level ${this.currentUpgrades[weaponType]}`);
      return {
        success: true,
        newLevel: this.currentUpgrades[weaponType],
      };
    } else {
      // Rollback local change if sync failed
      this.currentUpgrades[weaponType] = originalLevel;
      this.invalidateWeaponCache(weaponType);
      return {
        success: false,
        message: "Failed to save upgrade to database",
      };
    }
  }

  /**
   * Sets the level of a specific weapon
   * @param {string} weaponType - Weapon type
   * @param {number} level - New level (1-15)
   */
  async setWeaponLevel(weaponType, level) {
    if (!this.isValidWeaponType(weaponType)) {
      console.error("Invalid weapon type:", weaponType);
      return false;
    }

    if (level < 1 || level > 15) {
      console.error("Invalid weapon level:", level);
      return false;
    }

    const originalLevel = this.currentUpgrades[weaponType];
    this.currentUpgrades[weaponType] = level;

    // Clear cache for this weapon type
    this.invalidateWeaponCache(weaponType);

    const success = await this.debouncedSave();

    if (!success) {
      // Rollback on failure
      this.currentUpgrades[weaponType] = originalLevel;
      this.invalidateWeaponCache(weaponType);
    }

    return success;
  }

  /**
   * Invalidate cache entries for a specific weapon type
   * @param {string} weaponType - Weapon type to invalidate
   */
  invalidateWeaponCache(weaponType) {
    // Remove all cache entries for this weapon type
    for (let level = 1; level <= 15; level++) {
      const key = this.generateCacheKey(weaponType, level);
      this.damageCache.delete(key);
      this.costCache.delete(key);
    }
  }

  /**
   * Debounced save to prevent excessive API calls
   */
  async debouncedSave() {
    if (this.pendingSave) {
      return true; // Already saving
    }

    return new Promise((resolve) => {
      if (this.saveDebounceTimeout) {
        clearTimeout(this.saveDebounceTimeout);
      }

      this.saveDebounceTimeout = setTimeout(async () => {
        const result = await this.saveUpgrades();
        this.pendingSave = false;
        resolve(result);
      }, 1000); // 1 second debounce

      this.pendingSave = true;
    });
  }

  /**
   * Saves current
   */
  async saveUpgrades() {
    const startTime = performance.now();

    try {
      if (!this.userId || !this.runId) {
        console.warn("Cannot save upgrades: missing userId or runId");
        return false;
      }

      const response = await apiRequest(
        `/users/${this.userId}/weapon-upgrades/${this.runId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            meleeLevel: this.currentUpgrades.melee,
            rangedLevel: this.currentUpgrades.ranged,
          }),
        }
      );

      const saveTime = performance.now() - startTime;
      this.updateSaveMetrics(saveTime, response.success);

      if (response.success) {
        console.log(
          `Weapon upgrades saved successfully in ${saveTime.toFixed(2)}ms`
        );
        return true;
      } else {
        console.error("Failed to save weapon upgrades:", response.message);
        return false;
      }
    } catch (error) {
      const saveTime = performance.now() - startTime;
      this.updateSaveMetrics(saveTime, false);
      console.error("Error saving weapon upgrades:", error);
      return false;
    }
  }

  // ===================================================
  // DEATH AND LOGOUT MANAGEMENT
  // ===================================================

  /**
   * Resets all temporary upgrades (when the player dies)
   */
  async resetOnDeath() {
    try {
      console.log("Resetting weapon upgrades due to player death...");

      if (!this.userId || !this.runId) {
        console.warn("Cannot reset upgrades: missing userId or runId");
        return false;
      }

      const response = await apiRequest(
        `/users/${this.userId}/weapon-upgrades/${this.runId}`,
        {
          method: "DELETE",
        }
      );

      if (response.success) {
        // Reset local values
        this.currentUpgrades = { melee: 1, ranged: 1 };

        // Clear all caches
        this.damageCache.clear();
        this.costCache.clear();
        this.lastCacheUpdate = Date.now();

        // Reset performance metrics
        this.performanceMetrics = {
          saveCount: 0,
          loadCount: 0,
          averageSaveTime: 0,
          averageLoadTime: 0,
          cacheHits: 0,
          cacheMisses: 0,
        };

        console.log("Weapon upgrades reset successfully");
        return true;
      } else {
        console.error("Failed to reset weapon upgrades:", response.message);
        return false;
      }
    } catch (error) {
      console.error("Error resetting weapon upgrades:", error);
      return false;
    }
  }

  /**
   * Preserves upgrades on logout (does nothing, they are automatically maintained)
   */
  async preserveOnLogout() {
    // Clear any pending debounced saves
    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
      this.saveDebounceTimeout = null;
    }

    // Force immediate save
    const success = await this.saveUpgrades();

    if (success) {
      console.log("🚪 Weapon upgrades preserved for logout");
    }

    return success;
  }

  // ===================================================
  // QUERY METHODS
  // ===================================================

  /**
   * Get current weapon levels for both weapon types
   * @returns {Object} Object with melee and ranged levels
   */
  getWeaponLevels() {
    return {
      melee: this.currentUpgrades.melee,
      ranged: this.currentUpgrades.ranged,
    };
  }

  /**
   * Get current weapon level for a specific weapon type
   * @param {string} weaponType - Weapon type
   * @returns {number} Current weapon level
   */
  getWeaponLevel(weaponType) {
    if (!this.isValidWeaponType(weaponType)) {
      console.error("Invalid weapon type:", weaponType);
      return 1;
    }

    return this.currentUpgrades[weaponType];
  }

  /**
   * Gets the current damage of a weapon
   * @param {string} weaponType - Weapon type
   * @returns {number} - Current damage of the weapon
   */
  getWeaponDamage(weaponType) {
    const level = this.getWeaponLevel(weaponType);
    return this.getCachedDamage(weaponType, level);
  }

  /**
   * Gets the upgrade cost for the next level
   * @param {string} weaponType - Weapon type
   * @returns {number} - Cost to upgrade to the next level
   */
  getUpgradeCost(weaponType) {
    const currentLevel = this.getWeaponLevel(weaponType);
    const nextLevel = currentLevel + 1;

    if (nextLevel > 15) {
      return 0; // Already at max level
    }

    return this.getCachedCost(weaponType, nextLevel);
  }

  /**
   * Checks if a weapon can be upgraded
   * @param {string} weaponType - Weapon type
   * @returns {boolean} - True if it can be upgraded
   */
  canUpgradeWeapon(weaponType) {
    if (!this.isValidWeaponType(weaponType)) {
      return false;
    }

    return this.getWeaponLevel(weaponType) < 15;
  }

  /**
   * Gets complete information about all weapons
   * @returns {Object} - Detailed information about all weapons
   */
  getAllWeaponsInfo() {
    return {
      melee: {
        level: this.getWeaponLevel("melee"),
        damage: this.getWeaponDamage("melee"),
        upgradeCost: this.getUpgradeCost("melee"),
        canUpgrade: this.canUpgradeWeapon("melee"),
      },
      ranged: {
        level: this.getWeaponLevel("ranged"),
        damage: this.getWeaponDamage("ranged"),
        upgradeCost: this.getUpgradeCost("ranged"),
        canUpgrade: this.canUpgradeWeapon("ranged"),
      },
    };
  }

  // ===================================================
  // UTILITY METHODS
  // ===================================================

  /**
   * Validates if a weapon type is valid
   * @param {string} weaponType - Weapon type to validate
   * @returns {boolean} - True if it is valid
   */
  isValidWeaponType(weaponType) {
    return ["melee", "ranged"].includes(weaponType);
  }

  // ===================================================
  // PERFORMANCE METRICS
  // ===================================================

  /**
   * Update save performance metrics
   * @param {number} saveTime - Time taken for save operation
   * @param {boolean} success - Whether save was successful
   */
  updateSaveMetrics(saveTime, success) {
    if (success) {
      this.performanceMetrics.saveCount++;
      const count = this.performanceMetrics.saveCount;
      this.performanceMetrics.averageSaveTime =
        (this.performanceMetrics.averageSaveTime * (count - 1) + saveTime) /
        count;
    }
  }

  /**
   * Update load performance metrics
   * @param {number} loadTime - Time taken for load operation
   * @param {boolean} success - Whether load was successful
   */
  updateLoadMetrics(loadTime, success) {
    if (success) {
      this.performanceMetrics.loadCount++;
      const count = this.performanceMetrics.loadCount;
      this.performanceMetrics.averageLoadTime =
        (this.performanceMetrics.averageLoadTime * (count - 1) + loadTime) /
        count;
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    const cacheTotal =
      this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    const cacheHitRate =
      cacheTotal > 0
        ? (this.performanceMetrics.cacheHits / cacheTotal) * 100
        : 0;

    return {
      ...this.performanceMetrics,
      cacheHitRate: cacheHitRate.toFixed(1) + "%",
      cacheSize: this.damageCache.size + this.costCache.size,
      cacheValidUntil: new Date(
        this.lastCacheUpdate + this.cacheTimeout
      ).toISOString(),
    };
  }

  /**
   * Get status summary with performance data
   * @returns {Object} - Status summary
   */
  getStatusSummary() {
    return {
      userId: this.userId,
      runId: this.runId,
      upgrades: { ...this.currentUpgrades },
      totalDamage:
        this.getWeaponDamage("melee") + this.getWeaponDamage("ranged"),
      performance: this.getPerformanceMetrics(),
    };
  }
}

// ===================================================
// SINGLETON INSTANCE
// ===================================================

export const weaponUpgradeManager = new WeaponUpgradeManager();
export default weaponUpgradeManager;
