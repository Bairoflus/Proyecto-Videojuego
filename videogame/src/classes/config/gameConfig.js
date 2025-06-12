/**
 * Game configuration settings
 * Central location for all game constants and configuration options
 */

export const gameConfig = {
  // Logging configuration
  logging: {
    // Set to false in production to disable all logging
    enabled: true,
    // Log level: ERROR (0), WARN (1), INFO (2), DEBUG (3), VERBOSE (4)
    level: 2, // INFO level by default
    // Enable specific log categories
    categories: {
      combat: true,
      movement: true,
      roomTransition: true,
      enemyGeneration: true,
      playerState: true,
    },
  },

  // Performance optimizations
  performance: {
    // Enable/disable performance optimizations
    enableOptimizations: true,
    // Skip unnecessary updates when possible
    skipRedundantUpdates: true,
    // Cache frequently accessed data
    enableCaching: true,
  },

  // Debug features
  debug: {
    // Show hitboxes for all entities
    showHitboxes: false,
    // Show FPS counter
    showFPS: false,
    // Enable debug commands in console
    enableDebugCommands: true,
  },

  // Game balance
  balance: {
    // Player settings
    player: {
      baseHealth: 100,
      baseSpeed: 3,
      dashMultiplier: 3,
      dashDuration: 100,
      dashCooldown: 0,
    },
    // Enemy generation
    enemyGeneration: {
      minEnemies: 6,
      maxEnemies: 10,
      commonEnemyRatio: { min: 0.6, max: 0.8 },
    },
    // Combat
    combat: {
      daggerRange: 75,
      daggerDamage: 10,
      slingshotDamage: 15,
      projectileSpeed: 300,
    },
  },

  // Boss configuration - hardcoded (no longer loaded from API)
  bosses: {
    // Boss data hardcoded for better performance
    data: [
      {
        enemy_id: 101,
        name: "Dragon Boss",
        max_hp: 500,
        description: "A powerful dragon that guards the treasure",
        moves: [
          {
            name: "Fire Breath",
            description: "Breathes fire in a cone",
            phase: 1,
          },
          {
            name: "Claw Strike",
            description: "Powerful melee attack",
            phase: 1,
          },
          {
            name: "Wing Slam",
            description: "Area damage attack",
            phase: 2,
          },
        ],
      },
    ],
    loaded: true,
    error: null,
  },
};

// Export convenience function to update config at runtime
export function updateConfig(path, value) {
  const keys = path.split(".");
  let obj = gameConfig;

  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
    if (!obj) {
      console.error(`Invalid config path: ${path}`);
      return;
    }
  }

  obj[keys[keys.length - 1]] = value;
}

/**
 * Get boss data by enemy_id
 * @param {number} enemyId - The enemy ID to search for
 * @returns {Object|null} Boss data or null if not found
 */
export function getBossById(enemyId) {
  return (
    gameConfig.bosses.data.find((boss) => boss.enemy_id === enemyId) || null
  );
}

/**
 * Convert boss data to format expected by Boss class
 * @param {Object} bossData - Boss data from config
 * @returns {Object} Formatted boss data for game engine
 */
export function formatBossDataForGame(bossData) {
  return {
    enemyId: bossData.enemy_id,
    name: bossData.name,
    maxHp: bossData.max_hp,
    description: bossData.description,
    attacks: bossData.moves.map((move) => ({
      name: move.name,
      description: move.description,
      phase: move.phase,
      cooldown: 3000, // Default cooldown
      execute: (self) => {
        console.log(`${bossData.name} uses ${move.name}!`);
        // Default attack logic - can be customized per boss
      },
    })),
  };
}
