/**
 * Enemy Mapping Service
 * Maps frontend enemy names to backend enemy IDs for kill tracking integration
 */
import { apiRequest } from './api.js';

class EnemyMappingService {
    constructor() {
        this.enemyMappings = new Map();
        this.initialized = false;
        this.fallbackMappings = new Map([
            // Regular enemies (IDs based on actual database data)
            ['goblin', 1], // Basic Goblin
            ['goblin_archer', 5], // Dark Mage (closest ranged enemy)
            ['orc', 2], // Strong Orc
            ['skeleton', 3], // Fast Skeleton
            ['goblin_warrior', 4], // Goblin Warrior
            ['dark_mage', 5], // Dark Mage
            ['knight', 6], // Armored Knight
            ['assassin', 7], // Shadow Assassin
            ['troll', 8], // Troll Berserker
            ['wraith', 9], // Ice Wraith
            ['elemental', 10], // Fire Elemental
            // Bosses (IDs 100+ based on database data)
            ['boss', 100], // Shadow Lord (default boss)
            ['shadow_lord', 100], // Shadow Lord
            ['dragon', 101], // Fire Dragon
            ['fire_dragon', 101], // Fire Dragon
            ['ice_queen', 102] // Ice Queen
        ]);
    }

    /**
     * Initialize the enemy mapping service by loading enemy data from API
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Enemy Mapping Service...');
            
            // Load enemy data from API
            const enemies = await apiRequest('/enemies');
            
            if (enemies && Array.isArray(enemies)) {
                // Clear existing mappings
                this.enemyMappings.clear();
                
                // Build mappings from API data
                enemies.forEach(enemy => {
                    if (enemy.name && enemy.enemy_id) {
                        this.enemyMappings.set(enemy.name.toLowerCase(), enemy.enemy_id);
                        console.log(`📋 Mapped enemy: ${enemy.name} → ID ${enemy.enemy_id}`);
                    }
                });
                
                this.initialized = true;
                console.log(`✅ Enemy Mapping Service initialized with ${this.enemyMappings.size} enemies from API`);
                return true;
                
            } else {
                throw new Error('Invalid enemy data format from API');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Enemy Mapping Service from API:', error);
            console.log('🔄 Using fallback enemy mappings...');
            
            // Use fallback mappings
            this.enemyMappings = new Map(this.fallbackMappings);
            this.initialized = true;
            
            console.log(`⚠️ Enemy Mapping Service initialized with ${this.enemyMappings.size} fallback mappings`);
            return false;
        }
    }

    /**
     * Get enemy ID by enemy type name
     * @param {string} enemyTypeName - Enemy type name from frontend
     * @returns {number|null} Enemy ID for backend, or null if not found
     */
    getEnemyId(enemyTypeName) {
        if (!this.initialized) {
            console.warn('Enemy Mapping Service not initialized, using fallback ID');
            return this.fallbackMappings.get(enemyTypeName.toLowerCase()) || 1; // Default to ID 1
        }
        
        const enemyId = this.enemyMappings.get(enemyTypeName.toLowerCase());
        
        if (enemyId) {
            console.log(`🎯 Enemy mapped: ${enemyTypeName} → ID ${enemyId}`);
            return enemyId;
        } else {
            console.warn(`⚠️ Unknown enemy type: ${enemyTypeName}, using fallback ID`);
            // Try fallback mappings
            return this.fallbackMappings.get(enemyTypeName.toLowerCase()) || 1; // Default to ID 1
        }
    }

    /**
     * Get enemy data by name
     * @param {string} enemyTypeName - Enemy type name
     * @returns {Object|null} Enemy data object or null if not found
     */
    getEnemyData(enemyTypeName) {
        const enemyId = this.getEnemyId(enemyTypeName);
        if (enemyId) {
            return {
                enemyId: enemyId,
                name: enemyTypeName,
                mappingSource: this.initialized ? 'api' : 'fallback'
            };
        }
        return null;
    }

    /**
     * Check if an enemy ID is valid
     * @param {number} enemyId - Enemy ID to validate
     * @returns {boolean} True if valid
     */
    isValidEnemyId(enemyId) {
        if (!this.initialized) {
            return enemyId >= 1 && enemyId <= 200; // Basic range check
        }
        
        // Check if the ID exists in our mappings
        return Array.from(this.enemyMappings.values()).includes(enemyId);
    }

    /**
     * Get all available enemy mappings
     * @returns {Map} Current enemy mappings
     */
    getAllMappings() {
        return new Map(this.enemyMappings);
    }

    /**
     * Get initialization status
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized;
    }
}

// Export singleton instance
export const enemyMappingService = new EnemyMappingService(); 