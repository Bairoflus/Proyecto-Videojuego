/**
 * Floor generation and management system
 * Handles procedural floor creation, room progression, and game run management
 * Maintains state persistence for rooms across transitions
 */
import { COMBAT_ROOMS, SHOP_ROOM_LAYOUT, BOSS_ROOM_LAYOUT } from '../rooms/combatRooms.js';
import { Room } from '../rooms/Room.js';
import { log } from '../../utils/Logger.js';
import { FLOOR_CONSTANTS } from '../../constants/gameConstants.js';
import { DragonBoss } from '../enemies/floor1/DragonBoss.js';
import { Vec } from '../../utils/Vec.js';
import { createRun, completeRun } from '../../utils/api.js';
import { roomMapping } from '../../utils/roomMapping.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.floorCount = 1;
        // Load persistent run count from localStorage or start at initial value
        this.runCount = parseInt(localStorage.getItem('gameRunCount') || FLOOR_CONSTANTS.INITIAL_RUN_COUNT.toString(), 10);
        this.roomTypes = []; // Track room types: 'combat', 'shop', 'boss'
        this.roomStates = []; // Store room instances with enemy states for persistence
        this.visitedRooms = new Set(); // Track which rooms have been visited
        this.roomMappingInitialized = false; // Track room mapping initialization status
        this.generateFloor();
        this.initializeRoomMapping(); // Initialize room mapping service
    }

    // Initialize room mapping service for room ID resolution
    async initializeRoomMapping() {
        try {
            log.info("Initializing room mapping service in FloorGenerator...");
            const success = await roomMapping.initialize();
            this.roomMappingInitialized = success;
            
            if (success) {
                log.info("Room mapping service initialized successfully");
                log.debug("Room mapping debug info:", roomMapping.getDebugInfo());
            } else {
                log.warn("Room mapping service failed to initialize, using fallback mappings");
            }
        } catch (error) {
            log.error("Error initializing room mapping service:", error);
            this.roomMappingInitialized = false;
        }
    }

    // Gets current room ID for backend API calls
    getCurrentRoomId() {
        try {
            const currentFloor = this.getCurrentFloor();
            const frontendIndex = this.getCurrentRoomIndex();
            const roomType = this.getCurrentRoomType();
            
            if (roomType) {
                const roomId = roomMapping.getRoomId(frontendIndex, currentFloor, roomType);
                log.debug(`FloorGenerator: getCurrentRoomId() -> ${roomId} (floor: ${currentFloor}, index: ${frontendIndex}, type: ${roomType})`);
                return roomId;
            } else {
                log.warn("No room type available for current room, using fallback ID");
                return 1; // Ultimate fallback
            }
        } catch (error) {
            log.error("Error getting current room ID:", error);
            return 1; // Ultimate fallback for error scenarios
        }
    }

    // Gets room data for current room from mapping service
    getCurrentRoomData() {
        const roomId = this.getCurrentRoomId();
        return roomMapping.getRoomData(roomId);
    }

    // Validates if current room ID is valid in backend
    isCurrentRoomIdValid() {
        const roomId = this.getCurrentRoomId();
        return roomMapping.isValidRoomId(roomId);
    }

    // Generates a new floor with random rooms
    generateFloor() {
        // Select random combat rooms using constants
        const combatRoomLayouts = this.selectRandomCombatRooms(FLOOR_CONSTANTS.ROOMS_PER_FLOOR.COMBAT);

        // Create floor layout: 4 combat rooms + shop + boss
        this.currentFloor = [
            ...combatRoomLayouts,
            SHOP_ROOM_LAYOUT,
            BOSS_ROOM_LAYOUT
        ];

        // Track room types
        this.roomTypes = [
            ...Array(FLOOR_CONSTANTS.ROOMS_PER_FLOOR.COMBAT).fill('combat'),
            'shop',
            'boss'
        ];

        // Reset room states and visited rooms for new floor
        this.roomStates = [];
        this.visitedRooms = new Set();

        // Reset room index to start of new floor
        this.currentRoomIndex = 0;

        log.info("Generated new floor", this.floorCount, "with", this.currentFloor.length, "rooms");
        log.debug("Room states and visit history cleared for new floor");
    }

    // Selects n unique random combat rooms
    selectRandomCombatRooms(n) {
        const rooms = [...COMBAT_ROOMS];
        const selected = [];

        for (let i = 0; i < n; i++) {
            if (rooms.length === 0) break;
            const randomIndex = Math.floor(Math.random() * rooms.length);
            selected.push(rooms[randomIndex]);
            rooms.splice(randomIndex, 1);
        }

        return selected;
    }

    // Gets current room layout
    getCurrentRoomLayout() {
        if (this.currentRoomIndex >= this.currentFloor.length) {
            log.warn("Warning: Room index out of bounds");
            return null;
        }
        return this.currentFloor[this.currentRoomIndex];
    }

    // Creates a Room instance for the current room (with persistence)
    getCurrentRoom() {
        const layout = this.getCurrentRoomLayout();
        if (!layout) return null;

        const roomIndex = this.currentRoomIndex;
        const roomType = this.roomTypes[roomIndex]; // Get the room type
        const isCombatRoom = roomType === 'combat';

        log.info(`Getting room ${roomIndex} (${roomType})`);

        // Check if we already have a saved state for this room
        if (this.roomStates[roomIndex]) {
            log.debug(`Loading saved state for room ${roomIndex}`);
            return this.roomStates[roomIndex];
        }


        // Create new room instance with room type
        const room = new Room(layout, isCombatRoom, roomType);

        if (roomType === 'boss') {
            const boss = new DragonBoss(new Vec(380, 75));
            room.objects.enemies.push(boss);
        }

        // Save the room state
        this.roomStates[roomIndex] = room;

        // Mark room as visited
        this.visitedRooms.add(roomIndex);

        if (isCombatRoom) {
            log.info(`Created new combat room ${roomIndex} with ${room.objects.enemies.length} enemies`);
        } else {
            log.info(`Created new ${roomType} room ${roomIndex}`);
        }

        return room;
    }

    // Gets the type of current room
    getCurrentRoomType() {
        if (this.currentRoomIndex >= this.roomTypes.length) {
            return null;
        }
        return this.roomTypes[this.currentRoomIndex];
    }

    // Advances to next room
    nextRoom() {
        if (this.currentRoomIndex < this.currentFloor.length - 1) {
            this.currentRoomIndex++;
            log.debug("Advanced to room", this.currentRoomIndex);
            return true;
        }
        log.debug("Cannot advance: Already at last room");
        return false;
    }

    // Returns to previous room
    previousRoom() {
        if (this.currentRoomIndex > 0) {
            this.currentRoomIndex--;
            log.debug("Returned to room", this.currentRoomIndex);
            return true;
        }
        log.debug("Cannot return: Already at first room");
        return false;
    }

    // Checks if it's the first room
    isFirstRoom() {
        return this.currentRoomIndex === 0;
    }

    // Checks if it's the boss room
    isBossRoom() {
        const isBoss = this.currentRoomIndex === this.currentFloor.length - 1;
        log.verbose("Is boss room:", isBoss, "Current index:", this.currentRoomIndex, "Total rooms:", this.currentFloor.length);
        return isBoss;
    }

    // Advances to next floor
    async nextFloor() {
        if (this.floorCount >= FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN) {
            // Player completed all floors successfully! Complete current run
            try {
                const currentRunId = localStorage.getItem('currentRunId');
                
                if (currentRunId && window.game) {
                    console.log("Completing run for successful completion...");
                    
                    // Get run statistics from game instance
                    const runStats = window.game.getRunStats();
                    
                    const completionData = {
                        goldCollected: runStats.goldCollected,
                        goldSpent: runStats.goldSpent,
                        totalKills: runStats.totalKills,
                        deathCause: null // null for successful completion
                    };
                    
                    console.log("Victory completion data:", completionData);
                    const result = await completeRun(currentRunId, completionData);
                    console.log("Run completed for victory:", result);
                    
                    // Clear the current run ID since run is now complete  
                    localStorage.removeItem('currentRunId');
                    
                } else {
                    console.log("No current run ID found or game instance missing - playing in test mode");
                }
            } catch (error) {
                console.error("Failed to complete run on victory:", error);
            }

            // If we're at the max floor, increment run and reset floor
            this.runCount++;
            this.floorCount = 1;
            log.info(`Completed floor ${FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN}, starting new run:`, this.runCount);
        } else {
            // Otherwise just increment floor
            this.floorCount++;
            log.info("Advanced to floor", this.floorCount);
        }

        // Generate new floor and reset room index
        this.generateFloor();
    }

    // Gets current floor number
    getCurrentFloor() {
        return this.floorCount;
    }

    // Gets current run number
    getCurrentRun() {
        return this.runCount;
    }

    // Gets current room index
    getCurrentRoomIndex() {
        return this.currentRoomIndex;
    }

    // Gets total rooms in floor
    getTotalRooms() {
        return this.currentFloor.length;
    }

    // Check if a room has been visited before
    hasBeenVisited(roomIndex = this.currentRoomIndex) {
        return this.visitedRooms.has(roomIndex);
    }

    // Get saved room state if it exists
    getSavedRoomState(roomIndex = this.currentRoomIndex) {
        return this.roomStates[roomIndex] || null;
    }

    // Update room state (call this whenever enemies die or room changes)
    updateRoomState(roomIndex = this.currentRoomIndex, room) {
        if (room) {
            // Store the complete room instance including chest state
            this.roomStates[roomIndex] = room;
            log.verbose(`Updated room ${roomIndex} state`);
        }
    }

    // Increments run count on player death
    incrementRunCount() {
        this.runCount++;
        // Save to localStorage for persistence
        localStorage.setItem('gameRunCount', this.runCount.toString());
        log.info(`Player died. Starting run ${this.runCount}`);
    }

    // DEATH RESET: Complete game state reset
    resetToInitialState() {
        log.info("=== COMPLETE FLOOR GENERATOR RESET ===");

        // Increment run count on death
        this.incrementRunCount();

        // Reset all counters to initial state EXCEPT runCount
        this.floorCount = 1;
        this.currentRoomIndex = 0;

        // Clear all stored states
        this.roomStates = [];
        this.visitedRooms = new Set();
        this.currentFloor = [];
        this.roomTypes = [];

        log.debug("Cleared all room states and visit history");
        log.debug(`Reset to: Run ${this.runCount}, Floor 1, Room 1`);

        // Generate fresh floor
        this.generateFloor();

        log.info("Floor generator reset to initial state (run count preserved)");
    }

    // Get initial game state info
    getInitialStateInfo() {
        return {
            run: this.runCount,
            floor: this.floorCount,
            room: this.currentRoomIndex + 1,
            totalRooms: this.currentFloor.length,
            isInitialState: this.runCount === 1 && this.floorCount === 1 && this.currentRoomIndex === 0
        };
    }
} 