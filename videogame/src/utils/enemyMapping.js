/**
 * Enemy Mapping Service
 * Handles mapping between frontend enemy type names and backend enemy IDs
 * Provides enemy data resolution for kill tracking and statistics
 */
import { log } from "./Logger.js";

class EnemyMappingService {
  constructor() {
    this.initialized = false;
    this.enemyTypeMap = {};
    this.debugInfo = {};
  }

  /**
   * Initialize the enemy mapping service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      log.info("Initializing enemy mapping service...");

      // Create enemy type mapping based on game design
      this.enemyTypeMap = {
        // Floor 1 enemies
        GoblinDagger: 1,
        goblin_dagger: 1,
        goblin: 1,
        GoblinArcher: 2,
        goblin_archer: 2,
        DragonBoss: 3,
        dragon_boss: 3,

        // Floor 2 enemies (if they exist)
        OrcWarrior: 4,
        orc_warrior: 4,
        OrcShaman: 5,
        orc_shaman: 5,
        MinotaurBoss: 6,
        minotaur_boss: 6,

        // Floor 3 enemies (if they exist)
        DarkKnight: 7,
        dark_knight: 7,
        Necromancer: 8,
        necromancer: 8,
        DemonLordBoss: 9,
        demon_lord_boss: 9,

        // Generic fallbacks
        enemy: 1,
        boss: 3,
        combat: 1,
      };

      this.debugInfo = {
        totalEnemyTypes: Object.keys(this.enemyTypeMap).length / 2, // Divided by 2 because of aliases
        mappingStructure: "Static mapping for enemy types to backend IDs",
        supportedTypes: Object.keys(this.enemyTypeMap).filter(
          (key) => !key.includes("_")
        ),
      };

      this.initialized = true;
      log.info("Enemy mapping service initialized successfully");
      log.debug("Enemy mapping data loaded:", this.debugInfo);

      return true;
    } catch (error) {
      log.error("Failed to initialize enemy mapping service:", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Get enemy ID based on enemy type name
   * @param {string} enemyTypeName - Enemy type name from frontend
   * @returns {number|null} Backend enemy ID
   */
  getEnemyId(enemyTypeName) {
    try {
      if (!enemyTypeName) {
        log.warn("getEnemyId called with null/undefined enemy type");
        return this.getFallbackEnemyId();
      }

      // Normalize the enemy type name
      const normalizedName = enemyTypeName.trim();

      if (!this.initialized) {
        log.warn(
          "Enemy mapping service not initialized, using fallback calculation"
        );
        return this.getFallbackEnemyId(normalizedName);
      }

      // Try exact match first
      let enemyId = this.enemyTypeMap[normalizedName];

      // Try lowercase version if exact match fails
      if (!enemyId) {
        enemyId = this.enemyTypeMap[normalizedName.toLowerCase()];
      }

      // Try snake_case version if camelCase fails
      if (!enemyId) {
        const snakeCase = normalizedName
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");
        enemyId = this.enemyTypeMap[snakeCase];
      }

      if (enemyId) {
        log.debug(`Enemy mapping: "${normalizedName}" -> ID ${enemyId}`);
        return enemyId;
      } else {
        log.warn(
          `Enemy type "${normalizedName}" not found in mapping, using fallback`
        );
        return this.getFallbackEnemyId(normalizedName);
      }
    } catch (error) {
      log.error("Error in getEnemyId:", error);
      return this.getFallbackEnemyId(enemyTypeName);
    }
  }

  /**
   * Fallback enemy ID calculation
   * @param {string} enemyTypeName - Enemy type name
   * @returns {number} Fallback enemy ID
   */
  getFallbackEnemyId(enemyTypeName = "") {
    // Simple fallback logic
    if (
      enemyTypeName.toLowerCase().includes("boss") ||
      enemyTypeName.toLowerCase().includes("dragon")
    ) {
      log.debug(`Fallback enemy ID for "${enemyTypeName}": Boss = 3`);
      return 3; // Boss type
    } else if (
      enemyTypeName.toLowerCase().includes("archer") ||
      enemyTypeName.toLowerCase().includes("ranged")
    ) {
      log.debug(`Fallback enemy ID for "${enemyTypeName}": Archer = 2`);
      return 2; // Ranged type
    } else {
      log.debug(`Fallback enemy ID for "${enemyTypeName}": Generic = 1`);
      return 1; // Generic melee type
    }
  }

  /**
   * Get enemy data for a specific enemy ID
   * @param {number} enemyId - Backend enemy ID
   * @returns {Object|null} Enemy data object
   */
  getEnemyData(enemyId) {
    try {
      if (!this.initialized) {
        log.warn("Enemy mapping service not initialized");
        return null;
      }

      // Find enemy data by ID
      for (const [typeName, id] of Object.entries(this.enemyTypeMap)) {
        if (id === enemyId && !typeName.includes("_")) {
          // Skip snake_case aliases
          return {
            id: enemyId,
            typeName: typeName,
            displayName: typeName.replace(/([A-Z])/g, " $1").trim(),
          };
        }
      }

      log.warn(`Enemy ID ${enemyId} not found in mapping data`);
      return null;
    } catch (error) {
      log.error("Error in getEnemyData:", error);
      return null;
    }
  }

  /**
   * Validate if an enemy ID is valid
   * @param {number} enemyId - Enemy ID to validate
   * @returns {boolean} True if valid enemy ID
   */
  isValidEnemyId(enemyId) {
    try {
      if (!this.initialized) {
        // Fallback validation: IDs 1-9 are valid
        return enemyId >= 1 && enemyId <= 9;
      }

      const enemyData = this.getEnemyData(enemyId);
      return enemyData !== null;
    } catch (error) {
      log.error("Error in isValidEnemyId:", error);
      return false;
    }
  }

  /**
   * Get debug information about the mapping service
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      ...this.debugInfo,
      initialized: this.initialized,
      currentMappingSize: Object.keys(this.enemyTypeMap).length,
    };
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get all supported enemy type names
   * @returns {Array<string>} List of supported enemy types
   */
  getSupportedEnemyTypes() {
    return Object.keys(this.enemyTypeMap).filter((key) => !key.includes("_"));
  }
}

// Create and export singleton instance
export const enemyMappingService = new EnemyMappingService();

// Auto-initialize the service
enemyMappingService.initialize().catch((error) => {
  console.error("Failed to auto-initialize enemy mapping service:", error);
});
