/**
 * BackgroundManager - Dynamic background selection system
 * Handles background selection based on floor, room type, and room index
 * Supports combat rooms with rotation and specific backgrounds for shop/boss
 */
import { log } from './Logger.js';

export class BackgroundManager {
    constructor() {
        // Define combat backgrounds for each floor (4 backgrounds per floor for 4 combat rooms)
        this.combatBackgrounds = {
            1: ['cave.png', 'grass.png', 'swamp.png', 'woods.png'],
            2: ['factory.png', 'factory2.png', 'school.png', 'street.png'], 
            3: ['neon_room.png', 'spaceship.png', 'street.png', 'street2.png']
        };

        // Cache for loaded background images to avoid reloading
        this.backgroundCache = new Map();
        
        log.info("BackgroundManager initialized with dynamic background support");
    }

    /**
     * Get background path based on floor, room type, and room index
     * @param {number} floor - Current floor (1-3)
     * @param {string} roomType - Type of room ('combat', 'shop', 'boss')
     * @param {number} roomIndex - Index of room within floor (0-5)
     * @returns {string} Path to background image
     */
    getBackgroundPath(floor, roomType, roomIndex) {
        try {
            // Validate floor
            if (floor < 1 || floor > 3) {
                log.warn(`Invalid floor ${floor}, defaulting to floor 1`);
                floor = 1;
            }

            // Handle specific room types
            if (roomType === 'shop') {
                return `/assets/backgrounds/floor${floor}/store.png`;
            }
            
            if (roomType === 'boss') {
                return `/assets/backgrounds/floor${floor}/boss.png`;
            }
            
            // Handle combat rooms with rotation
            if (roomType === 'combat') {
                // Validate room index for combat rooms (should be 0-3)
                if (roomIndex < 0 || roomIndex >= 4) {
                    log.warn(`Invalid combat room index ${roomIndex}, defaulting to 0`);
                    roomIndex = 0;
                }
                
                const backgroundName = this.combatBackgrounds[floor][roomIndex];
                return `/assets/backgrounds/floor${floor}/${backgroundName}`;
            }

            // Fallback for unknown room types
            log.warn(`Unknown room type ${roomType}, using default combat background`);
            return `/assets/backgrounds/floor${floor}/${this.combatBackgrounds[floor][0]}`;

        } catch (error) {
            log.error('Error getting background path:', error);
            // Ultimate fallback to a valid background
            return '/assets/backgrounds/floor1/cave.png';
        }
    }

    /**
     * Preload a background image
     * @param {string} backgroundPath - Path to background image
     * @returns {Promise<HTMLImageElement>} Loaded image element
     */
    async loadBackground(backgroundPath) {
        // Check cache first
        if (this.backgroundCache.has(backgroundPath)) {
            return this.backgroundCache.get(backgroundPath);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // Cache the loaded image
                this.backgroundCache.set(backgroundPath, img);
                log.verbose(`Background loaded and cached: ${backgroundPath}`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                log.error(`Failed to load background: ${backgroundPath}`, error);
                // Try to load fallback background
                if (backgroundPath !== '/assets/backgrounds/floor1/cave.png') {
                    log.info('Attempting to load fallback background');
                    this.loadBackground('/assets/backgrounds/floor1/cave.png').then(resolve).catch(reject);
                } else {
                    reject(error);
                }
            };
            
            img.src = backgroundPath;
        });
    }

    /**
     * Get a loaded background image element
     * @param {number} floor - Current floor (1-3)
     * @param {string} roomType - Type of room ('combat', 'shop', 'boss')
     * @param {number} roomIndex - Index of room within floor (0-5)
     * @returns {Promise<HTMLImageElement>} Loaded background image
     */
    async getBackgroundImage(floor, roomType, roomIndex) {
        const backgroundPath = this.getBackgroundPath(floor, roomType, roomIndex);
        return await this.loadBackground(backgroundPath);
    }

    /**
     * Preload all backgrounds for a specific floor
     * @param {number} floor - Floor to preload (1-3)
     * @returns {Promise<void>}
     */
    async preloadFloorBackgrounds(floor) {
        try {
            log.info(`Preloading all backgrounds for floor ${floor}`);
            
            const promises = [];
            
            // Preload combat backgrounds
            for (const backgroundName of this.combatBackgrounds[floor]) {
                const path = `/assets/backgrounds/floor${floor}/${backgroundName}`;
                promises.push(this.loadBackground(path));
            }
            
            // Preload shop and boss backgrounds
            promises.push(this.loadBackground(`/assets/backgrounds/floor${floor}/store.png`));
            promises.push(this.loadBackground(`/assets/backgrounds/floor${floor}/boss.png`));
            
            await Promise.all(promises);
            log.info(`Successfully preloaded all backgrounds for floor ${floor}`);
            
        } catch (error) {
            log.error(`Error preloading backgrounds for floor ${floor}:`, error);
        }
    }

    /**
     * Get debug information about available backgrounds
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            totalFloors: 3,
            combatBackgroundsPerFloor: 4,
            specialBackgrounds: ['store.png', 'boss.png'],
            cachedBackgrounds: Array.from(this.backgroundCache.keys()),
            combatBackgrounds: this.combatBackgrounds
        };
    }

    /**
     * Clear background cache (useful for memory management)
     */
    clearCache() {
        this.backgroundCache.clear();
        log.info("Background cache cleared");
    }
}

// Create singleton instance
export const backgroundManager = new BackgroundManager(); 