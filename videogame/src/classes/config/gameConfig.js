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
            playerState: true
        }
    },

    // Performance optimizations
    performance: {
        // Enable/disable performance optimizations
        enableOptimizations: true,
        // Skip unnecessary updates when possible
        skipRedundantUpdates: true,
        // Cache frequently accessed data
        enableCaching: true
    },

    // Debug features
    debug: {
        // Show hitboxes for all entities
        showHitboxes: false,
        // Show FPS counter
        showFPS: false,
        // Enable debug commands in console
        enableDebugCommands: true
    },

    // Game balance
    balance: {
        // Player settings
        player: {
            baseHealth: 100,
            baseSpeed: 3,
            dashMultiplier: 3,
            dashDuration: 100,
            dashCooldown: 0
        },
        // Enemy generation
        enemyGeneration: {
            minEnemies: 6,
            maxEnemies: 10,
            commonEnemyRatio: { min: 0.6, max: 0.8 }
        },
        // Combat
        combat: {
            daggerRange: 75,
            daggerDamage: 10,
            slingshotDamage: 15,
            projectileSpeed: 300
        }
    }
};

// Export convenience function to update config at runtime
export function updateConfig(path, value) {
    const keys = path.split('.');
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