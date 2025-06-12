// ===================================================
// GAME ENUMS - SHATTERED TIMELINE
// ===================================================
// Objetivo: Centralizar enums que antes estaban en BD
// Beneficio: Mejor rendimiento, menos queries a BD
// ===================================================

export const GAME_ENUMS = {
  // ===================================================
  // TIPOS DE EVENTOS DEL JUEGO
  // ===================================================
  EVENT_TYPES: [
    'game_start',        // Inicio de nueva partida
    'game_resume',       // Reanudar partida guardada
    'room_enter',        // Entrar a habitación
    'room_exit',         // Salir de habitación
    'enemy_kill',        // Eliminar enemigo
    'boss_encounter',    // Encuentro con jefe
    'boss_kill',         // Eliminar jefe
    'player_death',      // Muerte del jugador
    'shop_open',         // Abrir tienda
    'shop_close',        // Cerrar tienda
    'weapon_switch',     // Cambiar arma
    'weapon_upgrade',    // Mejorar arma
    'chest_open',        // Abrir cofre
    'floor_transition'   // Transición de piso
  ],
  
  // ===================================================
  // TIPOS DE MEJORAS PERMANENTES
  // ===================================================
  UPGRADE_TYPES: [
    'health_max',        // Mejora HP máximo
    'stamina_max'        // Mejora Stamina máximo
  ],
  
  // ===================================================
  // TIPOS DE ARMAS
  // ===================================================
  WEAPON_SLOTS: ['melee', 'ranged'],
  
  // ===================================================
  // RESULTADOS DE COMBATE CON JEFES
  // ===================================================
  BOSS_RESULTS: [
    'victory',           // Victoria
    'defeat',            // Derrota
    'escape',            // Escape
    'timeout'            // Tiempo agotado
  ],
  
  // ===================================================
  // TIPOS DE HABITACIONES
  // ===================================================
  ROOM_TYPES: ['combat', 'shop', 'boss'],
  
  // ===================================================
  // CAUSAS DE MUERTE
  // ===================================================
  DEATH_CAUSES: [
    'enemy_kill',        // Muerto por enemigo
    'boss_kill',         // Muerto por jefe
    'timeout',           // Timeout de sesión
    'disconnect',        // Desconexión
    'active'             // Run activo (no muerto)
  ],
  
  // ===================================================
  // TIPOS DE ENEMIGOS
  // ===================================================
  ENEMY_TYPES: [
    'basic',             // Enemigo básico
    'strong'             // Enemigo fuerte
  ],
  
  // ===================================================
  // TIPOS DE JEFES
  // ===================================================
  BOSS_TYPES: [
    'dragon'             // Jefe dragón (único actual)
  ],
  
  // ===================================================
  // CONFIGURACIÓN DE MEJORAS PERMANENTES
  // ===================================================
  PERMANENT_UPGRADES: {
    health_max: {
      name: 'Health Boost',
      value: 15,
      description: '+15 Maximum Health',
      icon: '❤️'
    },
    stamina_max: {
      name: 'Stamina Boost', 
      value: 20,
      description: '+20 Maximum Stamina',
      icon: '💪'
    }
  },
  
  // ===================================================
  // CONFIGURACIÓN DE NIVELES DE ARMAS
  // ===================================================
  WEAPON_LEVELS: {
    MIN_LEVEL: 1,
    MAX_LEVEL: 15,
    BASE_DAMAGE: {
      melee: 25,
      ranged: 20
    },
    DAMAGE_INCREMENT: {
      melee: 5,
      ranged: 4
    }
  },
  
  // ===================================================
  // CONFIGURACIÓN DE COSTOS DE TIENDA
  // ===================================================
  SHOP_COSTS: {
    // Costo base para nivel 1, se incrementa por nivel
    BASE_COST: {
      melee: 10,
      ranged: 12
    },
    COST_MULTIPLIER: 1.5  // Multiplicador por nivel
  },
  
  // ===================================================
  // CONFIGURACIÓN DE JUEGO
  // ===================================================
  GAME_CONFIG: {
    MAX_FLOORS: 10,
    ROOMS_PER_FLOOR: 12,
    STARTING_GOLD: 0,
    STARTING_HP: 100,
    STARTING_STAMINA: 100,
    CHEST_GOLD_REWARD: 5
  }
};

// ===================================================
// FUNCIONES UTILITARIAS PARA ENUMS
// ===================================================

export const EnumUtils = {
  /**
   * Verifica si un valor es válido para un enum específico
   * @param {string} enumName - Nombre del enum en GAME_ENUMS
   * @param {string} value - Valor a verificar
   * @returns {boolean}
   */
  isValidEnumValue(enumName, value) {
    const enumArray = GAME_ENUMS[enumName];
    return Array.isArray(enumArray) && enumArray.includes(value);
  },

  /**
   * Obtiene información de mejora permanente
   * @param {string} upgradeType - Tipo de mejora
   * @returns {object|null}
   */
  getPermanentUpgradeInfo(upgradeType) {
    return GAME_ENUMS.PERMANENT_UPGRADES[upgradeType] || null;
  },

  /**
   * Calcula el daño de un arma basado en su nivel
   * @param {string} weaponType - Tipo de arma ('melee' o 'ranged')
   * @param {number} level - Nivel del arma (1-15)
   * @returns {number}
   */
  calculateWeaponDamage(weaponType, level) {
    const { BASE_DAMAGE, DAMAGE_INCREMENT } = GAME_ENUMS.WEAPON_LEVELS;
    const baseDamage = BASE_DAMAGE[weaponType] || 0;
    const increment = DAMAGE_INCREMENT[weaponType] || 0;
    return baseDamage + (increment * (level - 1));
  },

  /**
   * Calcula el costo de mejora de arma en tienda
   * @param {string} weaponType - Tipo de arma
   * @param {number} targetLevel - Nivel objetivo
   * @returns {number}
   */
  calculateUpgradeCost(weaponType, targetLevel) {
    const { BASE_COST, COST_MULTIPLIER } = GAME_ENUMS.SHOP_COSTS;
    const baseCost = BASE_COST[weaponType] || 10;
    return Math.floor(baseCost * Math.pow(COST_MULTIPLIER, targetLevel - 1));
  },

  /**
   * Obtiene descripción legible de causa de muerte
   * @param {string} deathCause - Causa de muerte
   * @returns {string}
   */
  getDeathCauseDescription(deathCause) {
    const descriptions = {
      'enemy_kill': 'Defeated by enemy',
      'boss_kill': 'Defeated by boss',
      'timeout': 'Session timeout',
      'disconnect': 'Connection lost',
      'active': 'Still alive'
    };
    return descriptions[deathCause] || 'Unknown';
  }
};

// ===================================================
// EXPORTACIONES ADICIONALES
// ===================================================

// Exportar enums individuales para facilitar importación
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
  GAME_CONFIG
} = GAME_ENUMS;

// Exportar por defecto
export default GAME_ENUMS; 