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
import { Supersoldier } from "../enemies/floor2/SupersoldierBoss.js";
import { MechaBoss } from "../enemies/floor3/MechaBoss.js";
import { Vec } from '../../utils/Vec.js';
import { createRun, completeRun } from '../../utils/api.js';
import { roomMapping } from '../../utils/roomMapping.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0; // ALWAYS start at room 0
        this.floorCount = 1;
        // NEW v3.0: runCount will be loaded from database, default fallback to 1
        this.runCount = 1; // Fallback value - will be updated by loadRunProgress()
        this.roomTypes = []; // Track room types: 'combat', 'shop', 'boss'
        this.roomStates = []; // Store room instances with enemy states for persistence
        this.visitedRooms = new Set(); // Track which rooms have been visited
        this.roomMappingInitialized = false; // Track room mapping initialization status
        this.runProgressLoaded = false; // Track if run progress has been loaded

        // PREVENTIVE FIX: Force clean initialization for new runs
        this.ensureCleanInitialization();

        // NEW v3.0: Initialize run progress (async, but don't block constructor)
        this.initializeWithRunProgress().then(() => {
            console.log('FloorGenerator v3.0 run progress loaded successfully');
        }).catch(error => {
            console.error('FloorGenerator v3.0 run progress load failed:', error);
        });

        this.generateFloor();
        this.initializeRoomMapping(); // Initialize room mapping service
    }

    /**
     * PREVENTIVE FIX: Ensure clean initialization to prevent room index corruption
     * This prevents the Room 1 → Room 5 jump issue caused by contaminated state
     */
    ensureCleanInitialization() {
        // Force currentRoomIndex to 0 (Room 1) - prevent corruption
        if (this.currentRoomIndex !== 0) {
            console.warn(`CORRUPTION DETECTED: currentRoomIndex was ${this.currentRoomIndex}, forcing to 0`);
            this.currentRoomIndex = 0;
        }

        // Force floor and run to proper starting values
        if (this.floorCount !== 1) {
            console.warn(`CORRUPTION DETECTED: floorCount was ${this.floorCount}, forcing to 1`);
            this.floorCount = 1;
        }

        // Ensure clean room states for new initialization
        this.roomStates = [];
        this.visitedRooms = new Set();
        this.currentFloor = [];
        this.roomTypes = [];

        console.log('FloorGenerator: Clean initialization enforced', {
            currentRoomIndex: this.currentRoomIndex,
            floorCount: this.floorCount,
            runCount: this.runCount
        });
    }

    /**
     * NEW v3.0: Initialize FloorGenerator with persistent run progress from database
     * This ensures run number continuity between sessions
     */
    async initializeWithRunProgress() {
        try {
            const userId = localStorage.getItem('currentUserId');
            const testMode = localStorage.getItem('testMode') === 'true';

            if (userId && !testMode) {
                console.log('Loading persistent run progress v3.0 for user:', userId);

                // Import the v3.0 API function
                const { getUserRunProgress } = await import('../../utils/api.js');

                const runProgress = await getUserRunProgress(parseInt(userId));

                if (runProgress && runProgress.current_run) {
                    this.runCount = runProgress.current_run;
                    console.log(`Run progress loaded: Currently on run ${this.runCount}`);

                    // Log additional progress info if available
                    if (runProgress.best_floor) {
                        console.log(`Player best achievement: Floor ${runProgress.best_floor}`);
                    }
                    if (runProgress.finished_runs) {
                        console.log(`Completed runs: ${runProgress.finished_runs}`);
                    }
                } else {
                    console.log('No run progress found, starting at run 1');
                    this.runCount = 1;
                }
            } else {
                console.log('Test mode or no user ID - using default run 1');
                this.runCount = 1;
            }

            this.runProgressLoaded = true;
            console.log(`FloorGenerator v3.0 initialized with run number: ${this.runCount}`);

        } catch (error) {
            console.error('Failed to load run progress v3.0, using default run 1:', error);
            this.runCount = 1; // Fallback to run 1
            this.runProgressLoaded = true; // Mark as loaded even on error
        }
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

        // PREVENTIVE FIX: FORCE reset room index to start of new floor
        this.currentRoomIndex = 0;

        // ADDITIONAL VERIFICATION: Ensure we're actually at room 0
        if (this.currentRoomIndex !== 0) {
            console.error(`CRITICAL: currentRoomIndex should be 0 but is ${this.currentRoomIndex}`);
            this.currentRoomIndex = 0; // Force it
        }

        log.info("Generated new floor", this.floorCount, "with", this.currentFloor.length, "rooms");
        log.debug("Room states and visit history cleared for new floor");
        console.log(`Floor generated: Floor ${this.floorCount}, starting at Room ${this.currentRoomIndex + 1}/${this.currentFloor.length}`);
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

        // Print only when room index changes
        if (roomIndex !== this.lastLoggedRoomIndex) {
            log.info(`Getting room ${roomIndex} (${roomType})`);
            this.lastLoggedRoomIndex = roomIndex;
        }

        // Check if we already have a saved state for this room
        if (this.roomStates[roomIndex]) {
            // FIXED: Only log ONCE when loading saved state, not every call
            if (!this.roomStates[roomIndex]._loggedLoad) {
                console.log(`LOADING SAVED ROOM STATE: index ${roomIndex}, type ${roomType}`);
                console.log(`Saved room has ${this.roomStates[roomIndex].objects.enemies.length} enemies`);
                this.roomStates[roomIndex]._loggedLoad = true; // Mark as logged
            }
            return this.roomStates[roomIndex];
        }

        console.log(`CREATING NEW ROOM: index ${roomIndex}, type ${roomType}`);

        // Create new room instance with room type and background info
        const room = new Room(layout, isCombatRoom, roomType, this.floorCount, roomIndex);

        // FIXED: Only initialize enemies for NEW rooms
        room.initializeEnemies();

        if (roomType === 'boss') {
            // RESET BOSS UPGRADE FLAG: Important - reset for every boss room
            if (window.game) {
                window.game.bossUpgradeShown = false;
                console.log('Boss room created - reset bossUpgradeShown flag for permanent upgrade popup');
            }

            let boss;
            if (this.floorCount === 1) {
                // Floor 1 boss
                boss = new DragonBoss(new Vec(380, 75));
                console.log(`Floor 1 boss (DragonBoss) created for room ${roomIndex}`);
            }
            else if (this.floorCount === 2) {
                // Floor 2 boss
                boss = new Supersoldier(new Vec(380, 75));
                console.log(`Floor 2 boss (Supersoldier) created for room ${roomIndex}`);
            }
            else if (this.floorCount === 3) {
                // Floor 3 boss
                boss = new MechaBoss(new Vec(380, 75));
                console.log(
                    `Floor 3 boss (MechaBoss) created for room ${roomIndex}`
                );
            } else {
                // Floor 4+ boss (use DragonBoss as fallback)
                console.warn(
                    `No specific boss defined for floor ${this.floorCount}, using DragonBoss as fallback`
                );
                boss = new DragonBoss(new Vec(380, 75));
                console.log(
                    `Floor ${this.floorCount} boss (DragonBoss fallback) created for room ${roomIndex}`
                );
            }

            // CRITICAL: Verify boss was created before adding to enemies
            if (boss) {
                room.objects.enemies.push(boss);
                console.log(`Boss successfully added to room ${roomIndex}, total enemies: ${room.objects.enemies.length}`);
            } else {
                console.error(`CRITICAL ERROR: Boss creation failed for floor ${this.floorCount}, room ${roomIndex}`);
            }
        }

        // Save the room state
        this.roomStates[roomIndex] = room;

        // Mark room as visited
        this.visitedRooms.add(roomIndex);

        if (isCombatRoom) {
            console.log(`NEW COMBAT ROOM ${roomIndex} created with ${room.objects.enemies.length} enemies`);
        } else {
            console.log(`NEW ${roomType} ROOM ${roomIndex} created`);
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

    // Advances to next room (ONLY FORWARD, no regression allowed)
    nextRoom() {
        const beforeIndex = this.currentRoomIndex;

        if (this.currentRoomIndex < this.currentFloor.length - 1) {
            this.currentRoomIndex++;

            // FIX: Validar que el mapeo sea correcto después de cambiar room
            const roomId = this.getCurrentRoomId();
            const expectedRoomId = this.getExpectedRoomId();

            if (roomId !== expectedRoomId) {
                console.error(`CRITICAL: Got ${roomId}, expected ${expectedRoomId}`);
                console.error(`  Floor: ${this.floorCount}, Index: ${this.currentRoomIndex}, Type: ${this.getCurrentRoomType()}`);
            } else {
                console.log(`ROOM MAPPING CORRECT: Floor ${this.floorCount}, Index ${this.currentRoomIndex} → Room ID ${roomId}`);
            }

            console.log(`ROOM PROGRESSION: ${beforeIndex} → ${this.currentRoomIndex} (${this.currentRoomIndex + 1}/${this.currentFloor.length})`);
            return true;
        }

        console.log(`Cannot advance: Already at last room (${this.currentRoomIndex + 1}/${this.currentFloor.length})`);
        return false;
    }

    // NEW: Método para calcular el Room ID esperado sin dependencias
    getExpectedRoomId() {
        // Cálculo directo basado en la estructura de la base de datos
        // Floor 1: rooms 1-6, Floor 2: rooms 7-12, Floor 3: rooms 13-18
        const baseId = (this.floorCount - 1) * 6;
        return baseId + this.currentRoomIndex + 1;
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

    // DEATH RESET: Complete game state reset (ONLY increments run on death)
    async resetToInitialState() {
        log.info("=== COMPLETE FLOOR GENERATOR RESET (DEATH) ===");

        // FIXED: Only increment run on DEATH, not on victory
        this.runCount++;
        console.log(`DEATH: Starting run ${this.runCount}`);

        // NEW: Complete current run BEFORE creating new one to prevent multiple active runs
        try {
            const currentRunId = localStorage.getItem('currentRunId');

            if (currentRunId && window.game) {
                console.log(`Completing current run (ID: ${currentRunId}) due to death...`);

                // Get run statistics from game instance
                const runStats = window.game.getRunStats();

                const completionData = {
                    goldCollected: runStats.goldCollected,
                    goldSpent: runStats.goldSpent,
                    totalKills: runStats.totalKills,
                    maxDamageHit: runStats.maxDamageHit,
                    deathCause: 'death' // Mark as death
                };

                console.log(`Death completion data for run ${currentRunId}:`, completionData);
                const result = await completeRun(currentRunId, completionData);
                console.log(`Run ${currentRunId} completed for death:`, result);

                // Clear old runId after completion
                localStorage.removeItem('currentRunId');
                console.log(`Cleared completed runId ${currentRunId} from localStorage`);

            } else {
                console.log("No current run ID found or game instance missing - skipping run completion");
            }
        } catch (error) {
            console.error("Failed to complete run on death:", error);
            // Continue with reset even if completion fails
        }

        // NEW: Create new run in backend after completing previous run
        try {
            const userId = localStorage.getItem('currentUserId');
            if (userId) {
                console.log("Creating new run after death...");
                const newRunData = await createRun(parseInt(userId));
                localStorage.setItem('currentRunId', newRunData.runId);
                console.log("New run created for reset:", newRunData.runId);
            } else {
                console.log("No userId available, enabling test mode for reset");
                localStorage.setItem('testMode', 'true');
            }
        } catch (error) {
            console.error("Failed to create new run during reset, enabling test mode:", error);
            localStorage.setItem('testMode', 'true');
        }

        // Reset all counters to initial state
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

        log.info("Floor generator reset after death complete");
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

    // COMPLETELY REWRITTEN: Fixed floor transition logic
    async nextFloor() {
        const beforeFloor = this.floorCount;
        const beforeRun = this.runCount;
        const beforeRunId = localStorage.getItem('currentRunId');

        console.log(`FLOOR TRANSITION starting from Floor ${beforeFloor}, Run ${beforeRun}, RunId ${beforeRunId}`);

        // FIXED: Correct condition - allow progression through all floors
        if (this.floorCount < FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN) {
            // Normal floor progression: 1→2, 2→3
            this.floorCount++;
            console.log(`FLOOR ADVANCED: Floor ${beforeFloor} → Floor ${this.floorCount}`);

            // Generate new floor and reset room index
            console.log(`Generating new floor ${this.floorCount}...`);
            this.generateFloor();
            console.log(`FLOOR TRANSITION COMPLETE: Now at Floor ${this.floorCount}, Room ${this.currentRoomIndex + 1}`);
            return true; // Success for normal floor progression
        } else {
            // Floor 3 completed - start new run
            console.log(`ALL FLOORS COMPLETED! Max floors (${FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN}) reached`);

            // Complete current run in backend FIRST
            try {
                const currentRunId = localStorage.getItem('currentRunId');

                if (currentRunId && window.game) {
                    console.log(`Completing current run (ID: ${currentRunId}) for successful completion...`);

                    // Get run statistics from game instance
                    const runStats = window.game.getRunStats();

                    const completionData = {
                        goldCollected: runStats.goldCollected,
                        goldSpent: runStats.goldSpent,
                        totalKills: runStats.totalKills,
                        maxDamageHit: runStats.maxDamageHit,  // NEW: Include max damage hit
                        deathCause: null // null for successful completion
                    };

                    console.log(`Victory completion data for run ${currentRunId}:`, completionData);
                    const result = await completeRun(currentRunId, completionData);
                    console.log(`Run ${currentRunId} completed for victory:`, result);

                } else {
                    console.log("No current run ID found or game instance missing - playing in test mode");
                }
            } catch (error) {
                console.error("Failed to complete run on victory:", error);
            }

            // CRITICAL: Clear the old runId BEFORE creating new one
            console.log(`Clearing old runId ${beforeRunId} from localStorage...`);
            localStorage.removeItem('currentRunId');

            // NEW v3.0: Increment run and create new run in database immediately
            this.runCount++;
            console.log(`VICTORY: Starting run ${this.runCount}`);

            // Create new run in backend immediately with enhanced error handling
            let newRunId = null;
            try {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                    console.log(`Creating new run for victory progression (user ${userId})...`);
                    const newRunData = await createRun(parseInt(userId));

                    if (newRunData && newRunData.runId) {
                        newRunId = newRunData.runId;
                        localStorage.setItem('currentRunId', newRunId);
                        console.log(`NEW RUN CREATED: runId ${newRunId} stored in localStorage`);

                        // VERIFICATION: Double-check localStorage was updated
                        const verifyRunId = localStorage.getItem('currentRunId');
                        if (verifyRunId === newRunId.toString()) {
                            console.log(`VERIFICATION PASSED: localStorage runId confirmed as ${verifyRunId}`);
                        } else {
                            console.error(`VERIFICATION FAILED: Expected ${newRunId}, got ${verifyRunId}`);
                        }
                    } else {
                        throw new Error('createRun returned invalid data');
                    }
                } else {
                    console.log("No userId available, enabling test mode");
                    localStorage.setItem('testMode', 'true');
                }
            } catch (error) {
                console.error("Failed to create new run during victory, enabling test mode:", error);
                localStorage.setItem('testMode', 'true');
            }

            // Reset to floor 1
            this.floorCount = 1;
            console.log(`VICTORY: New run started - Run ${this.runCount}, Floor 1`);

            // Generate new floor and reset room index
            console.log(`Generating new floor ${this.floorCount}...`);
            this.generateFloor();

            // FINAL STATUS LOG
            const finalRunId = localStorage.getItem('currentRunId');
            console.log(`NEW RUN COMPLETE: Run ${this.runCount}, Floor ${this.floorCount}, Room ${this.currentRoomIndex + 1}, RunId ${finalRunId}`);

            // SYNC CHECK: Verify everything is properly synchronized
            if (finalRunId && finalRunId !== beforeRunId) {
                console.log(`RUN TRANSITION SUCCESS: ${beforeRunId} → ${finalRunId}`);
            } else {
                console.error(`RUN TRANSITION ISSUE: Before=${beforeRunId}, After=${finalRunId}`);
            }

            // CRITICAL: Return true to indicate successful run transition
            return true;
        }
    }

    // FIXED: Apply saved state position with proper validation
    setCurrentPosition(floor, roomIndex) {
        try {
            console.log(`Restoring position to Floor ${floor}, Room ${roomIndex + 1}`);

            // Validate input parameters
            if (!floor || floor < 1 || floor > FLOOR_CONSTANTS.MAX_FLOORS_PER_RUN) {
                console.error(`Invalid floor: ${floor}, using Floor 1`);
                floor = 1;
            }

            if (roomIndex < 0 || roomIndex >= 6) { // 6 rooms per floor
                console.error(`Invalid room index: ${roomIndex}, using Room 0`);
                roomIndex = 0;
            }

            // Set current position
            this.floorCount = floor;
            this.currentRoomIndex = roomIndex;

            // FIXED: Generate floor using existing method instead of non-existent generateFloorRooms
            this.generateFloor();

            // FIXED: Validate against currentFloor (which exists) instead of currentFloorRooms (which doesn't)
            if (this.currentRoomIndex >= this.currentFloor.length) {
                console.warn(`Room index ${this.currentRoomIndex} exceeds available rooms (${this.currentFloor.length}), setting to last room`);
                this.currentRoomIndex = this.currentFloor.length - 1;
            }

            console.log(`Position restored successfully: Floor ${this.floorCount}, Room ${this.currentRoomIndex + 1}/${this.currentFloor.length}`);
            return true;

        } catch (error) {
            console.error('Failed to set current position:', error);

            // Fallback to safe state
            this.floorCount = 1;
            this.currentRoomIndex = 0;
            this.generateFloor();

            console.log('Fallback to Floor 1, Room 1 due to error');
            return false;
        }
    }

    // FIXED: Enhanced room ID validation to handle both mapping systems
    validateRoomMapping() {
        try {
            const mappedRoomId = this.getCurrentRoomId();
            const calculatedRoomId = this.getExpectedRoomId();

            if (mappedRoomId !== calculatedRoomId) {
                console.warn(`ROOM MAPPING MISMATCH: Mapped=${mappedRoomId}, Calculated=${calculatedRoomId}`);
                console.warn(`  Floor: ${this.floorCount}, Index: ${this.currentRoomIndex}, Type: ${this.getCurrentRoomType()}`);

                // Use calculated room ID as fallback
                return calculatedRoomId;
            }

            return mappedRoomId;
        } catch (error) {
            console.error('Room mapping validation failed:', error);
            return this.getExpectedRoomId(); // Fallback to calculated ID
        }
    }
} 