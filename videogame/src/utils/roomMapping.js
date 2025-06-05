/**
 * Room Mapping Service
 * Handles mapping between frontend room layout indices and database room IDs
 * Provides fallback mechanisms for offline or error scenarios
 */

import { log } from './Logger.js';

export class RoomMappingService {
    constructor() {
        this.roomData = [];
        this.isInitialized = false;
        this.roomMappings = new Map(); // floor -> roomType -> sequence -> roomId
        this.fallbackMappings = this.createFallbackMappings();
    }

    /**
     * Initializes the service by loading room data from API
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            log.info("Initializing Room Mapping Service...");
            
            const response = await fetch('/api/rooms');
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            this.roomData = await response.json();
            this.buildMappings();
            this.isInitialized = true;
            
            log.info(`Room Mapping Service initialized with ${this.roomData.length} rooms`);
            log.debug("Room mappings built:", Object.fromEntries(this.roomMappings));
            
            return true;
        } catch (error) {
            log.error("Failed to initialize Room Mapping Service:", error);
            log.warn("Using fallback room mappings");
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Builds internal mappings from loaded room data
     * Structure: floor -> roomType -> sequence -> roomId
     */
    buildMappings() {
        this.roomMappings.clear();
        
        for (const room of this.roomData) {
            const floor = room.floor;
            const roomType = room.room_type;
            const sequence = room.sequence_order;
            const roomId = room.room_id;
            
            if (!this.roomMappings.has(floor)) {
                this.roomMappings.set(floor, new Map());
            }
            
            if (!this.roomMappings.get(floor).has(roomType)) {
                this.roomMappings.get(floor).set(roomType, new Map());
            }
            
            this.roomMappings.get(floor).get(roomType).set(sequence, roomId);
        }
        
        log.debug("Room mappings built successfully");
    }

    /**
     * Creates fallback mappings for offline scenarios
     * Based on known database structure
     */
    createFallbackMappings() {
        const fallback = new Map();
        
        // Floor 1 fallbacks
        const floor1 = new Map();
        floor1.set('entrance', new Map([[1, 1]]));
        floor1.set('combat', new Map([[2, 2], [3, 3], [6, 6], [7, 7]]));
        floor1.set('shop', new Map([[4, 4]]));
        floor1.set('boss', new Map([[5, 5]]));
        fallback.set(1, floor1);
        
        // Floor 2 fallbacks  
        const floor2 = new Map();
        floor2.set('combat', new Map([[1, 8], [2, 9], [3, 10], [4, 11]]));
        floor2.set('shop', new Map([[5, 12]]));
        floor2.set('boss', new Map([[6, 13]]));
        fallback.set(2, floor2);
        
        return fallback;
    }

    /**
     * Gets room ID for frontend room index and current game state
     * @param {number} frontendIndex - Room index used by FloorGenerator (0-5)
     * @param {number} currentFloor - Current floor number (1-2)
     * @param {string} roomType - Room type: 'combat', 'shop', 'boss'
     * @returns {number} Database room ID
     */
    getRoomId(frontendIndex, currentFloor, roomType) {
        try {
            // Map frontend index to sequence order based on room layout
            const sequenceOrder = this.getSequenceOrder(frontendIndex, roomType, currentFloor);
            
            // Get room ID from mappings or fallback
            const mappings = this.isInitialized ? this.roomMappings : this.fallbackMappings;
            
            if (mappings.has(currentFloor) && 
                mappings.get(currentFloor).has(roomType) && 
                mappings.get(currentFloor).get(roomType).has(sequenceOrder)) {
                
                const roomId = mappings.get(currentFloor).get(roomType).get(sequenceOrder);
                log.debug(`Mapped room: floor ${currentFloor}, index ${frontendIndex}, type ${roomType} -> room_id ${roomId}`);
                return roomId;
            }
            
            // Ultimate fallback - calculate based on known patterns
            const fallbackId = this.calculateFallbackRoomId(frontendIndex, currentFloor, roomType);
            log.warn(`Using calculated fallback room ID: ${fallbackId} for floor ${currentFloor}, index ${frontendIndex}, type ${roomType}`);
            return fallbackId;
            
        } catch (error) {
            log.error("Error getting room ID:", error);
            return this.calculateFallbackRoomId(frontendIndex, currentFloor, roomType);
        }
    }

    /**
     * Maps frontend room index to database sequence order
     * Frontend uses 0-5, database uses sequence_order 1-7 for floor 1, 1-6 for floor 2
     */
    getSequenceOrder(frontendIndex, roomType, currentFloor) {
        if (currentFloor === 1) {
            // Floor 1: entrance(1), combat(2,3), shop(4), boss(5), combat(6,7)
            // Frontend: combat(0,1,2,3), shop(4), boss(5)
            if (roomType === 'combat') {
                // Map combat indices 0,1,2,3 to sequences 2,3,6,7
                const combatSequences = [2, 3, 6, 7];
                return combatSequences[frontendIndex] || 2;
            } else if (roomType === 'shop') {
                return 4;
            } else if (roomType === 'boss') {
                return 5;
            }
        } else if (currentFloor === 2) {
            // Floor 2: combat(1,2,3,4), shop(5), boss(6)
            // Frontend: combat(0,1,2,3), shop(4), boss(5)
            if (roomType === 'combat') {
                return frontendIndex + 1; // 0->1, 1->2, 2->3, 3->4
            } else if (roomType === 'shop') {
                return 5;
            } else if (roomType === 'boss') {
                return 6;
            }
        }
        
        // Default fallback
        return frontendIndex + 1;
    }

    /**
     * Calculates fallback room ID when all other methods fail
     * Based on known database structure patterns
     */
    calculateFallbackRoomId(frontendIndex, currentFloor, roomType) {
        if (currentFloor === 1) {
            // Floor 1 base IDs: combat(2,3,6,7), shop(4), boss(5)
            if (roomType === 'combat') {
                const combatIds = [2, 3, 6, 7];
                return combatIds[frontendIndex] || 2;
            } else if (roomType === 'shop') {
                return 4;
            } else if (roomType === 'boss') {
                return 5;
            }
        } else if (currentFloor === 2) {
            // Floor 2 base IDs: combat(8,9,10,11), shop(12), boss(13)
            if (roomType === 'combat') {
                return 8 + frontendIndex; // 8,9,10,11
            } else if (roomType === 'shop') {
                return 12;
            } else if (roomType === 'boss') {
                return 13;
            }
        }
        
        // Ultimate fallback - start from room 1
        return 1;
    }

    /**
     * Gets complete room data for a given room ID
     * @param {number} roomId - Database room ID
     * @returns {Object|null} Room data object or null if not found
     */
    getRoomData(roomId) {
        const room = this.roomData.find(r => r.room_id === roomId);
        if (room) {
            log.debug(`Retrieved room data for ID ${roomId}:`, room);
            return room;
        }
        
        log.warn(`Room data not found for ID ${roomId}`);
        return null;
    }

    /**
     * Gets all rooms for a specific floor
     * @param {number} floor - Floor number
     * @returns {Array} Array of room objects for the floor
     */
    getFloorRooms(floor) {
        return this.roomData.filter(room => room.floor === floor);
    }

    /**
     * Validates if a room ID exists in the loaded data
     * @param {number} roomId - Room ID to validate
     * @returns {boolean} True if room exists
     */
    isValidRoomId(roomId) {
        return this.roomData.some(room => room.room_id === roomId);
    }

    /**
     * Gets the initialization status of the service
     * @returns {boolean} True if initialized with API data
     */
    isServiceInitialized() {
        return this.isInitialized;
    }

    /**
     * Gets debug information about current mappings
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            initialized: this.isInitialized,
            roomCount: this.roomData.length,
            floors: [...new Set(this.roomData.map(r => r.floor))],
            roomTypes: [...new Set(this.roomData.map(r => r.room_type))],
            mappingsSize: this.roomMappings.size,
            sampleMappings: this.roomData.slice(0, 3)
        };
    }
}

// Create singleton instance
export const roomMapping = new RoomMappingService(); 