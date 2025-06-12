/**
 * Room Mapping Service
 * Handles mapping between frontend room indices and backend room IDs
 * Provides room data resolution and validation for game progression
 */
import { log } from "./Logger.js";

class RoomMappingService {
  constructor() {
    this.initialized = false;
    this.mappingData = {};
    this.debugInfo = {};
  }

  /**
   * Initialize the room mapping service
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      log.info("Initializing room mapping service...");

      // Create basic room mapping structure
      // Floor 1: rooms 1-6, Floor 2: rooms 7-12, Floor 3: rooms 13-18
      this.mappingData = {
        1: {
          // Floor 1
          0: { id: 1, type: "combat" }, // Room 1
          1: { id: 2, type: "combat" }, // Room 2
          2: { id: 3, type: "combat" }, // Room 3
          3: { id: 4, type: "combat" }, // Room 4
          4: { id: 5, type: "shop" }, // Room 5
          5: { id: 6, type: "boss" }, // Room 6
        },
        2: {
          // Floor 2
          0: { id: 7, type: "combat" }, // Room 7
          1: { id: 8, type: "combat" }, // Room 8
          2: { id: 9, type: "combat" }, // Room 9
          3: { id: 10, type: "combat" }, // Room 10
          4: { id: 11, type: "shop" }, // Room 11
          5: { id: 12, type: "boss" }, // Room 12
        },
        3: {
          // Floor 3
          0: { id: 13, type: "combat" }, // Room 13
          1: { id: 14, type: "combat" }, // Room 14
          2: { id: 15, type: "combat" }, // Room 15
          3: { id: 16, type: "combat" }, // Room 16
          4: { id: 17, type: "shop" }, // Room 17
          5: { id: 18, type: "boss" }, // Room 18
        },
      };

      this.debugInfo = {
        totalFloors: 3,
        roomsPerFloor: 6,
        totalRooms: 18,
        mappingStructure: "Static mapping for 3 floors with 6 rooms each",
      };

      this.initialized = true;
      log.info("Room mapping service initialized successfully");
      log.debug("Room mapping data loaded:", this.debugInfo);

      return true;
    } catch (error) {
      log.error("Failed to initialize room mapping service:", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Get room ID based on frontend index, floor, and room type
   * @param {number} frontendIndex - Room index within the floor (0-5)
   * @param {number} floor - Floor number (1-3)
   * @param {string} roomType - Room type ('combat', 'shop', 'boss')
   * @returns {number} Backend room ID
   */
  getRoomId(frontendIndex, floor, roomType) {
    try {
      if (!this.initialized) {
        log.warn(
          "Room mapping service not initialized, using fallback calculation"
        );
        return this.getFallbackRoomId(frontendIndex, floor);
      }

      const floorData = this.mappingData[floor];
      if (!floorData) {
        log.warn(`Floor ${floor} not found in mapping data, using fallback`);
        return this.getFallbackRoomId(frontendIndex, floor);
      }

      const roomData = floorData[frontendIndex];
      if (!roomData) {
        log.warn(
          `Room index ${frontendIndex} not found in floor ${floor}, using fallback`
        );
        return this.getFallbackRoomId(frontendIndex, floor);
      }

      // Validate room type matches expected type
      if (roomData.type !== roomType) {
        log.warn(
          `Room type mismatch: expected ${roomType}, got ${roomData.type}`
        );
      }

      log.debug(
        `Room mapping: Floor ${floor}, Index ${frontendIndex} (${roomType}) -> ID ${roomData.id}`
      );
      return roomData.id;
    } catch (error) {
      log.error("Error in getRoomId:", error);
      return this.getFallbackRoomId(frontendIndex, floor);
    }
  }

  /**
   * Fallback room ID calculation
   * @param {number} frontendIndex - Room index within the floor
   * @param {number} floor - Floor number
   * @returns {number} Calculated room ID
   */
  getFallbackRoomId(frontendIndex, floor) {
    const baseId = (floor - 1) * 6;
    const roomId = baseId + frontendIndex + 1;
    log.debug(
      `Fallback room ID calculation: Floor ${floor}, Index ${frontendIndex} -> ID ${roomId}`
    );
    return roomId;
  }

  /**
   * Get room data for a specific room ID
   * @param {number} roomId - Backend room ID
   * @returns {Object|null} Room data object
   */
  getRoomData(roomId) {
    try {
      if (!this.initialized) {
        log.warn("Room mapping service not initialized");
        return null;
      }

      // Find room data by ID
      for (const floor in this.mappingData) {
        for (const index in this.mappingData[floor]) {
          const roomData = this.mappingData[floor][index];
          if (roomData.id === roomId) {
            return {
              id: roomId,
              floor: parseInt(floor),
              index: parseInt(index),
              type: roomData.type,
            };
          }
        }
      }

      log.warn(`Room ID ${roomId} not found in mapping data`);
      return null;
    } catch (error) {
      log.error("Error in getRoomData:", error);
      return null;
    }
  }

  /**
   * Validate if a room ID is valid
   * @param {number} roomId - Room ID to validate
   * @returns {boolean} True if valid room ID
   */
  isValidRoomId(roomId) {
    try {
      if (!this.initialized) {
        // Fallback validation: IDs 1-18 are valid
        return roomId >= 1 && roomId <= 18;
      }

      const roomData = this.getRoomData(roomId);
      return roomData !== null;
    } catch (error) {
      log.error("Error in isValidRoomId:", error);
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
      currentMappingSize: Object.keys(this.mappingData).length,
    };
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create and export singleton instance
export const roomMapping = new RoomMappingService();
