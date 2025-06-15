// ===================================================
// GAME ENUMS - SHATTERED TIMELINE
// ===================================================
// Objectives: Centralize enums that were previously in the DB
// Benefits: Better performance, less queries to the DB
// ===================================================

export const GAME_ENUMS = {
  // ===================================================
  // GAME EVENT TYPES
  // ===================================================
  EVENT_TYPES: [
    "game_start", // Inicio de nueva partida
    "game_resume", // Reanudar partida guardada
    "room_enter", // Entrar a habitación
    "room_exit", // Salir de habitación
    "enemy_kill", // Eliminar enemigo
    "boss_encounter", // Encuentro con jefe
    "boss_kill", // Eliminar jefe
    "player_death", // Muerte del jugador
    "shop_open", // Abrir tienda
    "shop_close", // Cerrar tienda
    "weapon_switch", // Cambiar arma
    "weapon_upgrade", // Mejorar arma
    "chest_open", // Abrir cofre
    "floor_transition", // Transición de piso
  ],

  // ===================================================
  // PERMANENT UPGRADE TYPES
  // ===================================================
  UPGRADE_TYPES: [
    'health_max',        // Health max upgrade
    'stamina_max'        // Stamina max upgrade
  ],

  // ===================================================
  // WEAPON TYPES
  // ===================================================
  WEAPON_SLOTS: ["melee", "ranged"],

  // ===================================================
  // BOSS COMBAT RESULTS
  // ===================================================
  BOSS_RESULTS: [
    'victory',           // Victory
    'defeat',            // Defeat
    'escape',            // Escape
    'timeout'            // Timeout
  ],

  // ===================================================
  // ROOM TYPES
  // ===================================================
  ROOM_TYPES: ["combat", "shop", "boss"],

  // ===================================================
  // DEATH CAUSES
  // ===================================================
  DEATH_CAUSES: [
    'enemy_kill',        // Killed by enemy
    'boss_kill',         // Killed by boss
    'timeout',           // Session timeout
    'disconnect',        // Connection lost
    'active'             // Run active (not dead)
  ],

  // ===================================================
  // ENEMY TYPES
  // ===================================================
  ENEMY_TYPES: [
    'basic',             // Basic enemy
    'strong'             // Strong enemy
  ],

  // ===================================================
  // BOSS TYPES
  // ===================================================
  BOSS_TYPES: [
    'dragon'             // Dragon boss (only one currently)
  ],

  // ===================================================
  // PERMANENT UPGRADES CONFIGURATION
  // ===================================================
  PERMANENT_UPGRADES: {
    health_max: {
      name: "Health Boost",
      value: 15,
      description: "+15 Maximum Health",
      icon: "❤️",
    },
    stamina_max: {
      name: "Stamina Boost",
      value: 20,
      description: '+20 Maximum Stamina',
      icon: '💪'
    }
  },

  // ===================================================
  // WEAPON LEVELS CONFIGURATION
  // ===================================================
  WEAPON_LEVELS: {
    MIN_LEVEL: 1,
    MAX_LEVEL: 15,
    BASE_DAMAGE: {
      melee: 25,
      ranged: 20,
    },
    DAMAGE_INCREMENT: {
      melee: 5,
      ranged: 4,
    },
  },

  // ===================================================
  // SHOP COSTS CONFIGURATION
  // ===================================================
  SHOP_COSTS: {
    BASE_COST: {
      melee: 10,
      ranged: 12,
    },
    COST_MULTIPLIER: 1.5
  },

  // ===================================================
  // GAME CONFIGURATION
  // ===================================================
  GAME_CONFIG: {
    MAX_FLOORS: 10,
    ROOMS_PER_FLOOR: 12,
    STARTING_GOLD: 0,
    STARTING_HP: 100,
    STARTING_STAMINA: 100,
    CHEST_GOLD_REWARD: 5,
  },
};

// ===================================================
// UTILITY FUNCTIONS FOR ENUMS
// ===================================================

export const EnumUtils = {
  /**
   * Verifies if a value is valid for a specific enum
   * @param {string} enumName - Name of the enum in GAME_ENUMS
   * @param {string} value - Value to verify
   * @returns {boolean}
   */
  isValidEnumValue(enumName, value) {
    const enumArray = GAME_ENUMS[enumName];
    return Array.isArray(enumArray) && enumArray.includes(value);
  },

  /**
   * Gets information about permanent upgrade
   * @param {string} upgradeType - Upgrade type
   * @returns {object|null}
   */
  getPermanentUpgradeInfo(upgradeType) {
    return GAME_ENUMS.PERMANENT_UPGRADES[upgradeType] || null;
  },

  /**
   * Calculates the damage of a weapon based on its level
   * @param {string} weaponType - Weapon type ('melee' or 'ranged')
   * @param {number} level - Weapon level (1-15)
   * @returns {number}
   */
  calculateWeaponDamage(weaponType, level) {
    const { BASE_DAMAGE, DAMAGE_INCREMENT } = GAME_ENUMS.WEAPON_LEVELS;
    const baseDamage = BASE_DAMAGE[weaponType] || 0;
    const increment = DAMAGE_INCREMENT[weaponType] || 0;
    return baseDamage + increment * (level - 1);
  },

  /**
   * Calculates the cost of weapon upgrade in shop
   * @param {string} weaponType - Weapon type
   * @param {number} targetLevel - Target level
   * @returns {number}
   */
  calculateUpgradeCost(weaponType, targetLevel) {
    const { BASE_COST, COST_MULTIPLIER } = GAME_ENUMS.SHOP_COSTS;
    const baseCost = BASE_COST[weaponType] || 10;
    return Math.floor(baseCost * Math.pow(COST_MULTIPLIER, targetLevel - 1));
  },

  /**
   * Gets readable death cause description
   * @param {string} deathCause - Death cause
   * @returns {string}
   */
  getDeathCauseDescription(deathCause) {
    const descriptions = {
      enemy_kill: "Defeated by enemy",
      boss_kill: "Defeated by boss",
      timeout: "Session timeout",
      disconnect: "Connection lost",
      active: "Still alive",
    };
    return descriptions[deathCause] || "Unknown";
  },
};

// ===================================================
// ADDITIONAL EXPORTS
// ===================================================

// Export enums individually for easier import
export const {
  EVENT_TYPES,
  UPGRADE_TYPES,
  WEAPON_SLOTS,
  BOSS_RESULTS,
  ROOM_TYPES,
  DEATH_CAUSES,
  ENEMY_TYPES,
  BOSS_TYPES,
  PERMANENT_UPGRADES,
  WEAPON_LEVELS,
  SHOP_COSTS,
  GAME_CONFIG,
} = GAME_ENUMS;

// Export by default
export default GAME_ENUMS; 