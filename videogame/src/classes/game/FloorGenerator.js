/**
 * Floor generation and management system
 * Handles procedural floor creation, room progression, and game run management
 * Maintains state persistence for rooms across transitions
 */
import { COMBAT_ROOMS, SHOP_ROOM_LAYOUT, BOSS_ROOM_LAYOUT } from '../rooms/combatRooms.js';
import { Room } from '../rooms/Room.js';
import { log } from '../../utils/Logger.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.floorCount = 1;
        // Load persistent run count from localStorage or start at 1
        this.runCount = parseInt(localStorage.getItem('gameRunCount') || '1', 10);
        this.roomTypes = []; // Track room types: 'combat', 'shop', 'boss'
        this.roomStates = []; // Store room instances with enemy states for persistence
        this.visitedRooms = new Set(); // Track which rooms have been visited
        this.generateFloor();
    }

    // Generates a new floor with random rooms
    generateFloor() {
        // Select 4 random combat rooms
        const combatRoomLayouts = this.selectRandomCombatRooms(4);
        
        // Create floor layout: 4 combat rooms + shop + boss
        this.currentFloor = [
            ...combatRoomLayouts,
            SHOP_ROOM_LAYOUT,
            BOSS_ROOM_LAYOUT
        ];
        
        // Track room types
        this.roomTypes = [
            'combat', 'combat', 'combat', 'combat', // 4 combat rooms
            'shop',                                 // 1 shop room
            'boss'                                  // 1 boss room
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
    nextFloor() {
        if (this.floorCount >= 3) {
            // If we're at floor 3, increment run and reset floor
            this.runCount++;
            this.floorCount = 1;
            log.info("Completed floor 3, starting new run:", this.runCount);
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