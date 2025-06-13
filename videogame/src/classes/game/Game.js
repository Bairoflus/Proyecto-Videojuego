import { Vec } from "../../utils/Vec.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";
import { Boss } from "../entities/Boss.js";
import { createRun, getPermanentUpgrades} from "../../utils/api.js";
import { saveStateManager } from "../../utils/saveStateManager.js";
import { weaponUpgradeManager } from "../../utils/weaponUpgradeManager.js";
import { PermanentUpgradePopup } from "../ui/PermanentUpgradePopup.js";
import { SimpleAudioManager } from "../../utils/SimpleAudioManager.js";
import { backgroundManager } from "../../utils/BackgroundManager.js";

export class Game {
  constructor() {
    // Basic game properties
    this.canvas = null;
    this.ctx = null;
    this.player = null;
    this.floorGenerator = null;
    this.currentRoom = null;
    this.gameState = "loading";
    this.debug = false;
    this.lastTime = 0;

    // Game ready state
    this.isReady = false;
    this.gameReadyCallback = null;

    // Auto-save timing
    this.lastAutoSave = Date.now();
    this.autoSaveInterval = 30000; // 30 seconds

    // NEW: Stats sync timing
    this.lastStatsSync = Date.now();
    this.statsSyncInterval = 10000; // 10 seconds

    // SIMPLIFIED: Only essential transition control
    this.isTransitioning = false; // Single flag to prevent multiple transitions

    // Enemy synchronization
    this.enemies = [];

    // Pause system
    this.isPaused = false;
    this.pauseOverlay = null;
    this.activeTab = 'controls';

    // Permanent upgrade popup
    this.permanentUpgradePopup = null;

    // Boss-related flags (simplified)
    this.bossUpgradeShown = false;
    this.bossJustDefeated = false;
    this.transitionZoneActivatedMessage = null;
    this.transitionZoneMessageTimer = 0;

    // Managers initialization
    this.managersInitialized = false;
    this.managersInitializationResult = null;

    // Run statistics
    this.runStats = {
      goldSpent: 0,
      totalKills: 0,
      maxDamageHit: 0,        // NEW: Track maximum damage dealt in single hit
      totalGoldEarned: 0      // NEW: Track total gold collected this run
    };

    // Event logging state
    this.loggedBossEncounters = new Set();

    // Initialize game components
    this.globalShop = new Shop();
    this.permanentUpgradePopup = new PermanentUpgradePopup();
    
    // Initialize audio manager for floor music
    this.audioManager = null;
    try {
      this.audioManager = new SimpleAudioManager();
      console.log('Audio manager initialized for floor music');
    } catch (error) {
      console.warn('Audio manager not available - floor music disabled:', error);
    }

    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.createPauseSystem();

    // Make managers globally available
    window.weaponUpgradeManager = weaponUpgradeManager;
    window.saveStateManager = saveStateManager;

    // SIMPLIFIED: Essential debug commands only
    this.initializeSessionDebugCommands();

    // Initialize game asynchronously
    this.initializeGameAsync();

    window.game = this;

    if (variables.debug) {
      this.initializeDebugCommands();
    }
  }

  /**
   * NEW: Initialize all game managers with proper error handling
   * This is called during game initialization to setup backend integration
   */
  async initializeManagers() {
    try {
      console.log('Initializing Game Managers v3.0...');

      // Ensure run data exists BEFORE initializing managers
      await this.ensureRunDataExists();

      // Get session data for manager initialization
      const userId = parseInt(localStorage.getItem('currentUserId'));
      const runId = parseInt(localStorage.getItem('currentRunId'));

      // NEW v3.0: Use complete player initialization in one call
      console.log('Loading complete player data (v3.0)...');
      const { initializePlayerData } = await import('../../utils/api.js');

      this.playerInitData = await initializePlayerData(userId);

      if (this.playerInitData) {
        console.log('Player v3.0 initialization data loaded:', this.playerInitData);

        // Extract and store data for use in initObjects
        this.runNumber = this.playerInitData.run_number;
        this.weaponLevels = {
          melee: this.playerInitData.melee_level || 1,
          ranged: this.playerInitData.ranged_level || 1
        };
        this.permanentUpgrades = this.playerInitData.permanent_upgrades_parsed || {};
        this.hasSaveState = this.playerInitData.has_save_state === 1;

        console.log('EXTRACTED DATA DEBUG:', {
          rawRunNumber: this.playerInitData.run_number,
          extractedRunNumber: this.runNumber,
          rawPermanentUpgrades: this.playerInitData.permanent_upgrades_parsed,
          extractedPermanentUpgrades: this.permanentUpgrades,
          rawWeaponLevels: {
            melee: this.playerInitData.melee_level,
            ranged: this.playerInitData.ranged_level
          },
          extractedWeaponLevels: this.weaponLevels
        });

        // NEW v3.0: Auto-sync localStorage runId with database if inconsistent
        const localStorageRunId = parseInt(localStorage.getItem('currentRunId'));
        
        // FIXED: Don't compare runId with runNumber - they are different values
        // runId = unique database ID for the run (e.g., 68, 69, 70...)
        // runNumber = user's run counter (e.g., 1, 2, 3...)
        // We only need to ensure we have a valid runId, not sync with runNumber
        
        if (!localStorageRunId || isNaN(localStorageRunId)) {
          console.warn(`Invalid runId in localStorage: ${localStorageRunId}, creating new run...`);

          try {
            // Create a new run since we don't have a valid runId
              const { createRun } = await import('../../utils/api.js');
              const newRunResult = await createRun(userId);
              if (newRunResult.success) {
                localStorage.setItem('currentRunId', newRunResult.runId);
              console.log(`New run created: runId ${newRunResult.runId} for user's run number ${this.runNumber}`);
            }
          } catch (error) {
            console.error('Failed to create new run:', error);
            // Use a fallback runId based on current timestamp
            const fallbackRunId = Date.now().toString();
            localStorage.setItem('currentRunId', fallbackRunId);
            console.warn(`Using fallback runId: ${fallbackRunId}`);
          }
        } else {
          console.log(`Valid runId found: ${localStorageRunId} for user's run number ${this.runNumber}`);
        }

        console.log('v3.0 data extracted:', {
          runNumber: this.runNumber,
          weaponLevels: this.weaponLevels,
          permanentUpgrades: this.permanentUpgrades,
          hasSaveState: this.hasSaveState
        });

        // NEW v3.0: Sync run number with FloorGenerator
        if (this.floorGenerator && this.runNumber) {
          // Wait for FloorGenerator to load its run progress
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait

          while (!this.floorGenerator.runProgressLoaded && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          // Force sync the run number
          this.floorGenerator.runCount = this.runNumber;
          console.log(`FloorGenerator run number synced to: ${this.runNumber}`);
        }
      } else {
        console.warn('Failed to load player v3.0 data, using fallback values');
        // Use fallback values
        this.runNumber = 1;
        this.weaponLevels = { melee: 1, ranged: 1 };
        this.permanentUpgrades = {};
        this.hasSaveState = false;
      }

      // Initialize managers with proper user data
      console.log('Initializing saveStateManager...');
      // saveStateManager doesn't need initialize() - it's auto-initialized as singleton
      // Just check if it has save state available
      const hasSavedState = await saveStateManager.loadSaveState(userId);

      console.log('Initializing weaponUpgradeManager...');
      // NEW v3.0: Use the corrected/synced runId from localStorage
      const syncedRunId = parseInt(localStorage.getItem('currentRunId'));
      await weaponUpgradeManager.initialize(userId, syncedRunId, this.weaponLevels);

      // Check for existing saved state
      this.managersInitializationResult = {
        success: true,
        hasSavedState: !!hasSavedState,
        userData: { userId, runId: syncedRunId }
      };

      console.log('All Game Managers v3.0 initialized successfully');
      this.managersInitialized = true; // Mark as complete

      return this.managersInitializationResult;

    } catch (error) {
      console.error('Failed to initialize managers v3.0:', error);
      this.managersInitializationResult = {
        success: false,
        error: error.message
      };
      this.managersInitialized = true; // Mark as complete even on error to prevent infinite wait

      return this.managersInitializationResult;
    }
  }

  /**
   * NEW: Ensure run data exists for gameplay
   * This is called during game initialization to guarantee session data
   */
  async ensureRunDataExists() {
    try {
      const userId = localStorage.getItem('currentUserId');
      const sessionId = localStorage.getItem('currentSessionId');
      const runId = localStorage.getItem('currentRunId');

      console.log('Checking session data:', {
        userId: !!userId,
        sessionId: !!sessionId,
        runId: !!runId
      });

      // If we already have all required data, we're good
      if (userId && sessionId && runId) {
        console.log('All session data present, runId:', runId);
        return true;
      }

      // If missing basic auth data, enable test mode
      if (!userId || !sessionId) {
        console.warn('Missing basic session data - enabling test mode');
        localStorage.setItem('testMode', 'true');
        return true;
      }

      // We have auth data but missing runId - create one
      if (!runId) {
        console.log('Creating new run for user:', userId);

        const runResult = await createRun(parseInt(userId));

        if (runResult.success) {
          localStorage.setItem('currentRunId', runResult.runId);
          console.log('New run created successfully:', runResult.runId);
          return true;
        } else {
          throw new Error(runResult.message || 'Failed to create run');
        }
      }

    } catch (error) {
      console.error('Failed to ensure run data:', error);
      console.warn('Enabling test mode due to run creation failure');
      localStorage.setItem('testMode', 'true');
      return true; // Allow test mode
    }
  }

  /**
   * Initialize session debug commands (always available for troubleshooting)
   * @private
   */
  initializeSessionDebugCommands() {
    if (typeof window !== 'undefined') {
      // Session data debug commands - ALWAYS AVAILABLE
      window.gameSessionDebug = {
        check: () => {
          const data = {
            userId: localStorage.getItem('currentUserId'),
            sessionId: localStorage.getItem('currentSessionId'),
            runId: localStorage.getItem('currentRunId'),
            testMode: localStorage.getItem('testMode') === 'true'
          };
          console.log('Current session data:', data);
          return data;
        },
        createRun: async () => {
          try {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
              console.error('Cannot create run: No userId found');
              return false;
            }
            console.log('Manually creating run for user:', userId);
            const runResult = await createRun(parseInt(userId));
            if (runResult.success) {
              localStorage.setItem('currentRunId', runResult.runId);
              console.log('Run created successfully:', runResult.runId);
              return runResult;
            } else {
              throw new Error(runResult.message);
            }
          } catch (error) {
            console.error('Failed to create run:', error);
            return false;
          }
        },
        fix: async () => {
          console.log('Attempting to fix session data...');
          const userId = localStorage.getItem('currentUserId');
          const sessionId = localStorage.getItem('currentSessionId');

          if (!userId || !sessionId) {
            console.log('Missing basic auth data - enabling test mode');
            localStorage.setItem('testMode', 'true');
            return { testMode: true };
          }

          const runId = localStorage.getItem('currentRunId');
          if (!runId) {
            try {
              console.log('Creating missing runId...');
              const runResult = await createRun(parseInt(userId));
              if (runResult.success) {
                localStorage.setItem('currentRunId', runResult.runId);
                console.log('Session data fixed! runId:', runResult.runId);
                localStorage.removeItem('testMode');
                return { fixed: true, runId: runResult.runId };
              } else {
                throw new Error(runResult.message);
              }
            } catch (error) {
              console.error('Failed to create run, enabling test mode');
              localStorage.setItem('testMode', 'true');
              return { testMode: true, error: error.message };
            }
          }

          console.log('Session data is already complete');
          return { alreadyComplete: true };
        },
        // ENHANCED: Comprehensive debug for run transitions
        transition: {
          debug: () => {
            if (!window.game) return null;
            
            const fg = window.game.floorGenerator;
            const beforeRunId = localStorage.getItem('currentRunId');
            
            return {
              currentState: {
                floor: fg.getCurrentFloor(),
                room: fg.getCurrentRoomIndex() + 1,
                runNumber: fg.getCurrentRun(),
                runId: beforeRunId,
                isLastRoom: fg.getCurrentRoomIndex() === fg.getTotalRooms() - 1,
                isBossRoom: fg.isBossRoom()
              },
              nextTransition: {
                willAdvanceFloor: fg.isBossRoom(),
                willCreateNewRun: fg.getCurrentFloor() === 3 && fg.isBossRoom(),
                expectedRunId: 'Will be generated'
              }
            };
          },
          simulate: async () => {
            if (!window.game) return null;
            
            console.log('SIMULATING RUN TRANSITION...');
            const before = window.gameSessionDebug.transition.debug();
            console.log('Before transition:', before);
            
            try {
              await window.game.floorGenerator.nextFloor();
              
              const after = window.gameSessionDebug.transition.debug();
              console.log('After transition:', after);
              
              const result = {
                success: true,
                before: before,
                after: after,
                runIdChanged: before.currentState.runId !== after.currentState.runId,
                transitionType: before.nextTransition.willCreateNewRun ? 'NEW_RUN' : 'NEXT_FLOOR'
              };
              
              console.log('SIMULATION RESULT:', result);
              return result;
              
            } catch (error) {
              console.error('SIMULATION FAILED:', error);
              return { success: false, error: error.message };
            }
          }
        },
        // SIMPLIFIED: Basic room debugging
        room: {
          current: () => {
            if (!window.game) {
              console.error('Game instance not found');
              return null;
            }

            const fg = window.game.floorGenerator;
            const room = window.game.currentRoom;

            const data = {
              floor: fg.getCurrentFloor(),
              roomIndex: fg.getCurrentRoomIndex(),
              roomNumber: fg.getCurrentRoomIndex() + 1,
              roomType: fg.getCurrentRoomType(),
              canTransition: room ? room.canTransition() : 'N/A',
              enemies: room ? room.objects.enemies.length : 'N/A',
              aliveEnemies: room ? room.objects.enemies.filter(e => e.state !== 'dead').length : 'N/A',
              isTransitioning: window.game.isTransitioning,
              shopOpen: room?.objects?.shop?.isOpen || false,
              playerAtRightEdge: room ? room.isPlayerAtRightEdge(window.game.player) : false
            };

            console.log('CURRENT ROOM STATE:');
            console.table(data);
            return data;
          },
          forceTransition: () => {
            if (!window.game || !window.game.currentRoom) {
              console.error('Game or current room not found');
              return false;
            }

            console.log('FORCING ROOM TRANSITION...');

            // Clear transition lock
            window.game.isTransitioning = false;
            
            // Close shop if open
            if (window.game.currentRoom.objects?.shop?.isOpen) {
              window.game.currentRoom.objects.shop.close();
              console.log('Shop closed');
            }

            // Force kill all enemies if in combat room
            if (window.game.currentRoom.isCombatRoom) {
              window.game.enemies.forEach(enemy => {
                if (enemy.state !== 'dead') {
                  enemy.state = 'dead';
                  console.log(`Force killed: ${enemy.type}`);
                }
              });

              // Clean room enemies array
              window.game.currentRoom.objects.enemies = window.game.currentRoom.objects.enemies.filter(
                enemy => enemy.state !== 'dead'
              );
              }

            console.log('Transition forced - try moving to right edge');
            return true;
          },
          // NEW: Boss room specific debugging
          boss: {
            status: () => {
              if (!window.game || !window.game.currentRoom) {
                console.error('Game or current room not found');
                return null;
              }
              
              const room = window.game.currentRoom;
              const fg = window.game.floorGenerator;
              
              if (room.roomType !== 'boss') {
                console.log('Not currently in a boss room');
                return { error: 'Not in boss room' };
              }
              
              const allEnemies = room.objects.enemies;
              const aliveEnemies = allEnemies.filter(e => e !== undefined && e !== null && e.state !== 'dead');
              const bosses = allEnemies.filter(e => 
                e.constructor.name.includes('Boss') || 
                e.type === 'boss' || 
                e.isBoss === true
              );
              const aliveBosses = aliveEnemies.filter(e => 
                e.constructor.name.includes('Boss') || 
                e.type === 'boss' || 
                e.isBoss === true
              );
              
              const status = {
                floor: fg.getCurrentFloor(),
                roomType: room.roomType,
                totalEnemies: allEnemies.length,
                aliveEnemies: aliveEnemies.length,
                totalBosses: bosses.length,
                aliveBosses: aliveBosses.length,
                bossJustDefeated: window.game.bossJustDefeated,
                roomBossDefeated: room.bossDefeated,
                canTransition: room.canTransition(),
                playerAtRightEdge: room.isPlayerAtRightEdge(window.game.player),
                chestSpawned: room.chestSpawned,
                chestCollected: room.chestCollected,
                enemies: allEnemies.map(e => ({
                  type: e.type || e.constructor.name,
                  state: e.state,
                  health: e.health,
                  maxHealth: e.maxHealth,
                  isBoss: e.isBoss,
                  constructor: e.constructor.name
                }))
              };
              
              console.log('BOSS ROOM STATUS:');
              console.table(status.enemies);
              console.log('Summary:', {
                canTransition: status.canTransition,
                aliveBosses: status.aliveBosses,
                aliveEnemies: status.aliveEnemies,
                bossJustDefeated: status.bossJustDefeated,
                chestSpawned: status.chestSpawned,
                chestCollected: status.chestCollected
              });
              
              return status;
            },
            kill: () => {
              if (!window.game || !window.game.currentRoom) {
                console.error('Game or current room not found');
              return false;
            }

              const room = window.game.currentRoom;
              
              if (room.roomType !== 'boss') {
                console.log('Not currently in a boss room');
                return false;
              }
              
              const bosses = room.objects.enemies.filter(e => 
                e.constructor.name.includes('Boss') || 
                e.type === 'boss' || 
                e.isBoss === true
              );
              
              if (bosses.length === 0) {
                console.log('No bosses found in room');
                return false;
            }

              console.log(`Force killing ${bosses.length} boss(es)...`);
              bosses.forEach(boss => {
                console.log(`Killing ${boss.constructor.name} (health: ${boss.health})`);
                boss.health = 0;
                boss.die();
              });
              
              console.log('All bosses killed - check transition status');
            return true;
          },
            fix: () => {
              if (!window.game || !window.game.currentRoom) {
                console.error('Game or current room not found');
              return false;
            }

              const room = window.game.currentRoom;
              
              if (room.roomType !== 'boss') {
                console.log('Not currently in a boss room');
              return false;
            }
              
              console.log('Fixing boss room state...');
              
              // Force kill all enemies
              room.objects.enemies.forEach(enemy => {
                if (enemy.state !== 'dead') {
                  console.log(`Force killing: ${enemy.type || enemy.constructor.name}`);
                  enemy.state = 'dead';
                }
              });
              
              // Set boss defeated flags
              window.game.bossJustDefeated = true;
              room.bossDefeated = true;
              
              // Clean enemies array
              room.objects.enemies = room.objects.enemies.filter(e => e.state !== 'dead');
              
              // Force collect chest if spawned
              if (room.chestSpawned && !room.chestCollected) {
                room.chestCollected = true;
                if (room.objects.chest) {
                  room.objects.chest.isCollected = true;
                  room.objects.chest.isOpen = true;
                }
                console.log('Chest automatically collected');
              }
              
              console.log('Boss room fixed - should be able to transition now');
              return true;
            }
          }
        }
      };

      console.log('Debug commands available:');
      console.log('  gameSessionDebug.check() - Check session data');
      console.log('  gameSessionDebug.fix() - Auto-fix session issues');
      console.log('  gameSessionDebug.room.current() - Show room state');
      console.log('  gameSessionDebug.room.forceTransition() - Force enable transition');
      console.log('  gameSessionDebug.boss.status() - Show boss room detailed status');
      console.log('  gameSessionDebug.boss.kill() - Force kill all bosses');
      console.log('  gameSessionDebug.boss.fix() - Fix boss room transition issues');
      console.log('  quickBossCheck() - Quick boss status check (global function)');
      console.log('  supersoldierDebug() - Detailed Supersoldier analysis (global function)');
      
      // Add global quick boss check function
      window.quickBossCheck = () => {
        if (!window.game || !window.game.currentRoom) {
          console.log('No game or room found');
          return;
        }
        
        const room = window.game.currentRoom;
        
        if (room.roomType !== 'boss') {
          console.log('Not in boss room');
          return;
        }
        
        const allEnemies = room.objects.enemies;
        const aliveEnemies = allEnemies.filter(e => e !== undefined && e !== null && e.state !== 'dead');
        const bosses = allEnemies.filter(e => 
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        );
        const aliveBosses = aliveEnemies.filter(e => 
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        );
        
        console.log('QUICK BOSS CHECK:');
        console.log(`Total enemies: ${allEnemies.length}`);
        console.log(`Alive enemies: ${aliveEnemies.length}`);
        console.log(`Total bosses: ${bosses.length}`);
        console.log(`Alive bosses: ${aliveBosses.length}`);
        console.log(`Can transition: ${room.canTransition()}`);
        console.log(`Boss defeated flag: ${window.game.bossJustDefeated}`);
        console.log(`Chest spawned: ${room.chestSpawned}`);
        console.log(`Chest collected: ${room.chestCollected}`);
        
        if (aliveBosses.length > 0) {
          console.log('ALIVE BOSSES:');
          aliveBosses.forEach(boss => {
            console.log(`  - ${boss.constructor.name}: ${boss.health}/${boss.maxHealth} HP (state: ${boss.state})`);
          });
              } else {
          console.log('No alive bosses found');
        }
        
        if (room.chestSpawned && !room.chestCollected) {
          console.log('CHEST NEEDS TO BE COLLECTED');
        } else if (room.chestSpawned && room.chestCollected) {
          console.log('Chest already collected');
        } else {
          console.log('No chest in this room');
        }
        
        return {
          canTransition: room.canTransition(),
          aliveBosses: aliveBosses.length,
          aliveEnemies: aliveEnemies.length,
          bossDefeated: window.game.bossJustDefeated,
          chestSpawned: room.chestSpawned,
          chestCollected: room.chestCollected
        };
      };
      
      // Add specific Supersoldier debug function
      window.supersoldierDebug = () => {
        if (!window.game || !window.game.currentRoom) {
          console.log('No game or room found');
          return;
        }
        
        const room = window.game.currentRoom;
        const allEnemies = room.objects.enemies;
        
        console.log('SUPERSOLDIER DEBUG:');
        console.log(`Total enemies in room: ${allEnemies.length}`);
        
        allEnemies.forEach((enemy, index) => {
          console.log(`Enemy ${index + 1}:`, {
            name: enemy.constructor.name,
            type: enemy.type,
            health: `${enemy.health}/${enemy.maxHealth}`,
            state: enemy.state,
            isBoss: enemy.isBoss,
            isDrone: enemy.constructor.name === 'Drone',
            isSupersoldier: enemy.constructor.name === 'Supersoldier'
          });
        });
        
        const supersoldiers = allEnemies.filter(e => e.constructor.name === 'Supersoldier');
        const aliveSupersolders = supersoldiers.filter(e => e.state !== 'dead' && e.health > 0);
        
        console.log(`Supersoldiers found: ${supersoldiers.length}`);
        console.log(`Alive Supersoldiers: ${aliveSupersolders.length}`);
        console.log(`Chest spawned: ${room.chestSpawned}`);
        console.log(`Chest collected: ${room.chestCollected}`);
        
        return {
          totalEnemies: allEnemies.length,
          supersoldiers: supersoldiers.length,
          aliveSupersoldiers: aliveSupersolders.length,
          canTransition: room.canTransition(),
          chestSpawned: room.chestSpawned,
          chestCollected: room.chestCollected
        };
      };
    }
  }

  initObjects() {
    // NEW: Apply saved state if available
    let savedState = null;
    if (this.managersInitializationResult && this.managersInitializationResult.hasSavedState) {
      savedState = saveStateManager.getCurrentSaveState();
      console.log('Applying saved state to game objects:', savedState);
    }

    // Initialize game objects based on saved state or defaults
    const startPos = savedState
      ? new Vec(savedState.position?.x || 50, savedState.position?.y || 300)
      : new Vec(50, 300);

    // CRITICAL FIX: Set currentRoom BEFORE initializing player
    this.currentRoom = this.floorGenerator.getCurrentRoom();

    // Initialize player at correct position
    this.player = new Player(startPos, 64, 64, "blue");
    this.player.setCurrentRoom(this.currentRoom);

    // NEW v3.0: Apply permanent upgrades from initialization data BEFORE weapon sync
    if (this.permanentUpgrades && Object.keys(this.permanentUpgrades).length > 0) {
      console.log('=== APPLYING PERMANENT UPGRADES ===');
      console.log('Permanent upgrades data:', this.permanentUpgrades);
      console.log('Applying permanent upgrades from v3.0 initialization data:', this.permanentUpgrades);

      // Log player base stats BEFORE applying upgrades
      console.log('Player BASE stats before permanent upgrades:', {
        baseHealth: this.player.maxHealth,
        baseStamina: this.player.maxStamina,
        baseSpeed: this.player.speedMultiplier || 1.0
      });

      Object.entries(this.permanentUpgrades).forEach(([type, value]) => {
        console.log(`Applying v3.0 permanent upgrade: ${type} = ${value}`);

        switch (type) {
          case 'health_max':
            this.player.maxHealth = value;
            this.player.health = value; // Start with full health
            console.log(`Health set from permanent upgrades: ${this.player.maxHealth}`);
            break;
          case 'stamina_max':
            this.player.maxStamina = value;
            this.player.stamina = value; // Start with full stamina
            console.log(`Stamina set from permanent upgrades: ${this.player.maxStamina}`);
            break;
          case 'movement_speed':
            this.player.speedMultiplier = value;
            console.log(`Movement speed set from permanent upgrades: ${(value * 100).toFixed(1)}%`);
            break;
        }
      });

      // Log player FINAL stats AFTER applying upgrades
      console.log('Player FINAL stats after permanent upgrades:', {
        finalHealth: `${this.player.health}/${this.player.maxHealth}`,
        finalStamina: `${this.player.stamina}/${this.player.maxStamina}`,
        finalSpeed: `${(this.player.speedMultiplier * 100).toFixed(1)}%`
      });

      console.log('All v3.0 permanent upgrades applied during player initialization');
      console.log('=== PERMANENT UPGRADES COMPLETE ===');
    } else {
      console.log('No permanent upgrades found to apply');
      console.log('Permanent upgrades data:', this.permanentUpgrades);
      console.log('Available keys:', Object.keys(this.permanentUpgrades || {}));
    }

    // NEW: Critical weapon sync after player creation and save state loading
    if (this.managersInitialized && window.weaponUpgradeManager) {
      // Force reload weapon levels after player is created
      setTimeout(() => {
        if (this.player && typeof this.player.forceReloadWeaponLevels === 'function') {
          this.player.forceReloadWeaponLevels();
          console.log('Post-initialization weapon sync completed');

          // Also sync the shop to show correct levels
          if (this.globalShop && typeof this.globalShop.syncWithWeaponUpgradeManager === 'function') {
            this.globalShop.syncWithWeaponUpgradeManager();
            console.log('Shop weapon levels synchronized');
          }
        }
      }, 100); // Small delay to ensure everything is properly initialized
    }

    // Apply saved state to player if available (override any defaults)
    if (savedState) {
      this.player.health = savedState.health || this.player.maxHealth;
      this.player.gold = savedState.gold || 0;

      console.log('Saved state applied to player:', {
        health: this.player.health,
        gold: this.player.gold,
        position: `(${startPos.x}, ${startPos.y})`
      });
    }

    // REMOVED: Individual loadPermanentUpgrades call since it's now handled above in v3.0 style
    // The permanent upgrades are already applied from this.permanentUpgrades

    // Configure shop with current game data
    this.configureShopGameData();

    // Now we can safely check currentRoom properties
    if (this.currentRoom && this.currentRoom.roomType === "shop" && this.currentRoom.objects.shop) {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }

    // Initialize enemies array from current room
    this.enemies = this.currentRoom ? this.currentRoom.objects.enemies : [];

    // NEW v3.0: Log final player state after complete initialization
    console.log('Player v3.0 initialization complete:', {
      runNumber: this.runNumber,
      health: `${this.player.health}/${this.player.maxHealth}`,
      stamina: `${this.player.stamina}/${this.player.maxStamina}`,
      speedMultiplier: this.player.speedMultiplier || 1.0,
      weaponLevels: this.weaponLevels,
      gold: this.player.gold,
      hasSaveState: this.hasSaveState,
      permanentUpgradesApplied: Object.keys(this.permanentUpgrades || {}).length
    });
  }

  /**
   * Configure shop with current game data for backend integration
   * Should be called whenever game data changes (room transitions, etc.)
   */
  configureShopGameData() {
    try {
      // ENHANCED: Debug localStorage values before parsing
      const userIdRaw = localStorage.getItem('currentUserId');
      const runIdRaw = localStorage.getItem('currentRunId');
      const sessionIdRaw = localStorage.getItem('currentSessionId');

      console.log('SHOP CONFIG DEBUG - Raw localStorage values:', {
        userIdRaw,
        runIdRaw,
        sessionIdRaw,
        runIdType: typeof runIdRaw,
        runIdLength: runIdRaw ? runIdRaw.length : 'N/A'
      });

      const gameData = {
        userId: parseInt(userIdRaw),
        runId: parseInt(runIdRaw),
        roomId: this.floorGenerator.getCurrentRoomId()
      };

      // ENHANCED: Debug parsed values
      console.log('SHOP CONFIG DEBUG - Parsed values:', {
        userIdParsed: gameData.userId,
        runIdParsed: gameData.runId,
        roomIdParsed: gameData.roomId,
        userIdIsNaN: isNaN(gameData.userId),
        runIdIsNaN: isNaN(gameData.runId),
        roomIdIsNaN: isNaN(gameData.roomId)
      });

      // ENHANCED: Try to recover runId if it's missing
      if (isNaN(gameData.runId) || !runIdRaw) {
        console.warn('SHOP CONFIG - runId is missing or invalid, attempting recovery...');

        // Try to get runId from other sources
        const testMode = localStorage.getItem('testMode') === 'true';

        if (testMode) {
          console.log('Test mode active - using fallback runId');
          gameData.runId = 999; // Fallback for test mode
        } else {
          // Try to create a new run if user exists
          if (gameData.userId && !isNaN(gameData.userId)) {
            console.log('Attempting emergency run creation...');
            this.createEmergencyRun(gameData.userId);
            gameData.runId = 0; // Temporary placeholder
          } else {
            console.error('Cannot recover runId - no valid userId');
            gameData.runId = 0; // Fallback
          }
        }
      }

      // Validate that we have the required data
      if (gameData.userId && gameData.runId && gameData.roomId &&
        !isNaN(gameData.userId) && !isNaN(gameData.runId) && !isNaN(gameData.roomId)) {
        this.globalShop.setGameData(gameData);
        console.log('Shop configured with valid game data:', gameData);
      } else {
        console.warn('Shop game data incomplete, backend registration may fail:', gameData);
        console.warn('  Missing data details:', {
          hasUserId: !!gameData.userId && !isNaN(gameData.userId),
          hasRunId: !!gameData.runId && !isNaN(gameData.runId),
          hasRoomId: !!gameData.roomId && !isNaN(gameData.roomId)
        });

        // Still set the data - Shop.js will handle missing data gracefully
        this.globalShop.setGameData(gameData);
      }
    } catch (error) {
      console.error('Failed to configure shop game data:', error);
      console.error('  Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * EMERGENCY: Create a new run when runId is lost during gameplay
   */
  async createEmergencyRun(userId) {
    try {
      console.log('EMERGENCY RUN CREATION for userId:', userId);

      const { createRun } = await import('../../utils/api.js');
      const runResult = await createRun(userId);

      if (runResult.success) {
        localStorage.setItem('currentRunId', runResult.runId);
        console.log('Emergency run created successfully:', runResult.runId);
        return runResult.runId;
      } else {
        throw new Error(runResult.message || 'Failed to create emergency run');
      }
    } catch (error) {
      console.error('Emergency run creation failed:', error);
      // Enable test mode as fallback
      localStorage.setItem('testMode', 'true');
      console.log('Test mode enabled as fallback');
      return null;
    }
  }

  draw(ctx) {
    // NEW: Don't draw if game is not ready yet
    if (!this.isReady) {
      // Draw loading message
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading game...", ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    this.currentRoom.draw(ctx);
    this.player.draw(ctx);
    this.drawUI(ctx);

    if (this.currentRoom?.objects.shop?.isOpen) {
      this.currentRoom.objects.shop.draw(
        ctx,
        variables.canvasWidth,
        variables.canvasHeight,
        this.player
      );
    }

    // NEW: Draw permanent upgrade popup if active
    if (this.permanentUpgradePopup && this.permanentUpgradePopup.isActive) {
      this.permanentUpgradePopup.draw(ctx);
    }

    if (this.floorGenerator.isBossRoom()) {
      const room = this.floorGenerator.getCurrentRoom();
      const boss = room.objects.enemies.find(e => e instanceof Boss);
      if (boss && typeof boss.drawUI === "function") {
        boss.drawUI(ctx);
      }
    }

    // Removed transition overlay - no more visual feedback during transitions
  }

  drawUI(ctx) {
    const iconSize = 20;
    const startX = 100;
    const startY = 100;
    const barWidth = 200;
    const barHeight = 20;

    // Draw Run/Floor/Room info in bottom-right corner
    // FIXED v3.0: Use run number from initialization data with proper fallback
    const currentRun = this.runNumber || this.floorGenerator.getCurrentRun() || 1; // Fallback to 1
    const currentFloor = this.floorGenerator.getCurrentFloor();
    const currentRoom = this.floorGenerator.getCurrentRoomIndex() + 1; // Convert to 1-based
    const totalRooms = this.floorGenerator.getTotalRooms();

    // Set text properties
    ctx.font = "18px Arial";
    ctx.textAlign = "right";
    const runFloorRoomText = `Run ${currentRun} | Floor ${currentFloor} | Room ${currentRoom}/${totalRooms}`;

    // Draw text with outline for better visibility in bottom-right
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(runFloorRoomText, variables.canvasWidth - 10, variables.canvasHeight - 10);

    ctx.fillStyle = "white";
    ctx.fillText(runFloorRoomText, variables.canvasWidth - 10, variables.canvasHeight - 10);

    // Reset text alignment for other UI elements
    ctx.textAlign = "left";

    // Draw weapon icons
    const icons = [
      { type: "melee", img: "Sword.png" },
      { type: "ranged", img: "Bow.png" },
    ];

    icons.forEach((icon, i) => {
      const iconImg = new Image();
      iconImg.src = `/assets/sprites/hud/${icon.img}`;
      const x = startX + i * (iconSize + 10);
      const y = startY;

      ctx.drawImage(iconImg, x, y, iconSize, iconSize);
      ctx.strokeStyle = this.player.weaponType === icon.type ? "white" : "gray";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, iconSize + 2, iconSize + 2);
    });

    // Draw health bar
    const hpRatio = this.player.health / this.player.maxHealth;
    ctx.fillStyle = "grey";
    ctx.fillRect(40, 40, barWidth, barHeight);
    ctx.fillStyle = "red";
    ctx.fillRect(40, 40, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(40, 40, barWidth, barHeight);

    // Draw health text (HP actual/máximo)
    const currentHP = Math.round(this.player.health);
    const maxHP = Math.round(this.player.maxHealth);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`HP ${currentHP}/${maxHP}`, 40 + barWidth / 2, 40 + barHeight / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Draw stamina bar
    const staminaRatio = this.player.stamina / this.player.maxStamina;
    ctx.fillStyle = "grey";
    ctx.fillRect(40, 70, barWidth, barHeight);
    ctx.fillStyle = "yellow";
    ctx.fillRect(40, 70, barWidth * staminaRatio, barHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(40, 70, barWidth, barHeight);

    // Draw gold counter
    const goldIcon = new Image();
    goldIcon.src = "/assets/sprites/hud/gold_coin.png";
    ctx.drawImage(goldIcon, 40, 100, 20, 20);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText(`${this.player.gold}`, 65, 115);

    // FIX: Draw transition zone activation message when boss is defeated
    if (this.transitionZoneActivatedMessage) {
      // Calculate fade effect for the last 500ms
      const fadeTime = 500; // Last 500ms
      let alpha = 1.0;
      if (this.transitionZoneMessageTimer < fadeTime) {
        alpha = this.transitionZoneMessageTimer / fadeTime;
      }

      // Draw background box
      const messageLines = this.transitionZoneActivatedMessage.split('\n');
      const lineHeight = 30;
      const totalHeight = messageLines.length * lineHeight + 20;
      const boxWidth = 500;
      const boxX = (variables.canvasWidth - boxWidth) / 2;
      const boxY = variables.canvasHeight / 2 - totalHeight / 2;

      // Background with alpha
      ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
      ctx.fillRect(boxX, boxY, boxWidth, totalHeight);

      // Border with alpha
      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, totalHeight);

      // Draw text lines
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      messageLines.forEach((line, index) => {
        if (index === 0) {
          // First line (boss defeated) - gold color
          ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.font = "bold 28px Arial";
        } else {
          // Second line (instruction) - white color
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.font = "bold 20px Arial";
        }

        const textY = boxY + 10 + (index + 1) * lineHeight;
        ctx.fillText(line, variables.canvasWidth / 2, textY);
      });

      // Reset text alignment
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  }

  async resetGameAfterDeath() {
    console.log("Resetting game state after player death...");

    try {
      // NEW: Clear save state and weapon upgrades using managers
      console.log("Clearing save state...");
      const userId = parseInt(localStorage.getItem('currentUserId'));
      await saveStateManager.clearSaveState(userId);

      console.log("Resetting weapon upgrades...");
      await weaponUpgradeManager.resetOnDeath();

      // Reset run statistics
      this.resetRunStats();

      // FIX: Reset all boss-related flags using helper method
      this.resetBossFlags();

      // Reset floor generator to beginning - FIXED: Use correct method name
      await this.floorGenerator.resetToInitialState();

      // CRITICAL FIX: Re-initialize managers to load updated permanent upgrades
      console.log("Re-initializing managers to load updated permanent upgrades...");
      await this.initializeManagers();
      console.log("Managers re-initialized with fresh data from database");

      // NEW v3.0: Sync frontend run number after death reset
      console.log("Syncing frontend run number after death...");
      this.runNumber = this.floorGenerator.getCurrentRun();
      console.log(`Frontend run number updated to: ${this.runNumber}`);

      // NEW v3.0: Update localStorage with new runId after death
      try {
        const newRunId = localStorage.getItem('currentRunId');
        if (newRunId) {
          console.log(`localStorage runId after death: ${newRunId}`);

          // Update weaponUpgradeManager with new runId (already done in initializeManagers)
          console.log("WeaponUpgradeManager already initialized with new runId");
        }
      } catch (error) {
        console.error("Failed to sync runId after death:", error);
      }

      // Reinitialize objects - NOW with fresh permanent upgrades data
      this.initObjects();

      // Reset floor music to Floor 1 after death
      if (this.audioManager) {
        console.log('Resetting to Floor 1 music after death');
        await this.audioManager.playFloorMusic(1);
      }

      console.log("Game reset completed successfully with updated permanent upgrades");
    } catch (error) {
      console.error("Failed to reset game after death:", error);

      // Fallback: reset locally even if backend calls fail
      this.resetRunStats();

      // FIX: Reset all boss-related flags in fallback using helper method
      this.resetBossFlags();

      await this.floorGenerator.resetToInitialState();

      // NEW v3.0: Sync run number even in fallback
      this.runNumber = this.floorGenerator.getCurrentRun();
      console.log(`Fallback: Frontend run number updated to: ${this.runNumber}`);

      // CRITICAL: Try to re-initialize managers even in fallback
      try {
        console.log("Attempting to re-initialize managers in fallback mode...");
        await this.initializeManagers();
        console.log("Managers re-initialized successfully in fallback");
      } catch (managerError) {
        console.error("Failed to re-initialize managers in fallback:", managerError);
        console.log("Using existing permanent upgrades data as final fallback");
      }

      this.initObjects();
      console.log("Game reset completed with local fallback");
    }
  }

  async handleRoomTransition(direction) {
    // SIMPLIFIED: Single validation check
    if (!this.currentRoom.canTransition()) {
      console.log('canTransition() returned false - blocking transition');
      return;
    }

    // SIMPLIFIED: Basic lock to prevent double transitions
    if (this.isTransitioning) {
        console.log('Already transitioning - blocking');
        return;
    }

    try {
      this.isTransitioning = true;
      console.log("Starting room transition...");

      // Determine if this is a boss room
      const wasInBossRoom = this.floorGenerator.isBossRoom();

      if (wasInBossRoom) {
        console.log("ATTEMPTING BOSS ROOM TRANSITION - Performing final validation...");
        
        // CRITICAL SAFETY CHECK: Verify boss is actually dead before proceeding
        const allEnemies = this.currentRoom.objects.enemies;
        const aliveEnemies = allEnemies.filter(e => e !== undefined && e !== null && e.state !== 'dead');
        const aliveBosses = aliveEnemies.filter(e => 
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        );
        
        // CHECK: Chest requirement
        const chestSpawned = this.currentRoom.chestSpawned;
        const chestCollected = this.currentRoom.chestCollected;
        const chestRequirementMet = !chestSpawned || chestCollected;
        
        console.log('BOSS ROOM SAFETY CHECK:', {
          allEnemies: allEnemies.length,
          aliveEnemies: aliveEnemies.length,
          aliveBosses: aliveBosses.length,
          bossJustDefeated: this.bossJustDefeated,
          chestSpawned: chestSpawned,
          chestCollected: chestCollected,
          chestRequirementMet: chestRequirementMet
        });
        
        if (aliveBosses.length > 0) {
          console.log('BLOCKING BOSS ROOM TRANSITION: Boss still alive!');
          return;
        } else if (!this.bossJustDefeated) {
          console.log('BLOCKING BOSS ROOM TRANSITION: Boss defeat not confirmed!');
          return;
        } else if (!chestRequirementMet) {
          console.log('BLOCKING BOSS ROOM TRANSITION: Chest not collected!');
          return;
        } else {
          console.log('BOSS ROOM TRANSITION: All checks passed - advancing to next floor');
          
          // FIXED: Handle boss room floor transition directly here - no recursive calls
          console.log("Boss defeated! Advancing to next floor...");

          // Reset boss flags since we're transitioning successfully
          this.bossJustDefeated = false;
          this.transitionZoneActivatedMessage = null;
          this.transitionZoneMessageTimer = 0;

          // CRITICAL DEBUG: Log state before nextFloor()
          console.log("BEFORE nextFloor():", {
            currentFloor: this.floorGenerator.getCurrentFloor(),
            currentRoomIndex: this.floorGenerator.getCurrentRoomIndex(),
            currentRun: this.floorGenerator.getCurrentRun()
          });
          
          // CRITICAL FIX: Advance to next floor and WAIT for completion
          console.log("CALLING nextFloor() and waiting for completion...");
          const nextFloorResult = await this.floorGenerator.nextFloor();
          
          if (!nextFloorResult && nextFloorResult !== undefined) {
            console.warn("Cannot advance to next floor - game completed or error");
            return;
          }
          
          // CRITICAL: Add small delay to ensure complete state synchronization
          console.log("WAITING for state synchronization...");
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          
          // CRITICAL DEBUG: Log state after nextFloor()
          console.log("AFTER nextFloor():", {
            currentFloor: this.floorGenerator.getCurrentFloor(),
            currentRoomIndex: this.floorGenerator.getCurrentRoomIndex(),
            currentRun: this.floorGenerator.getCurrentRun()
          });
          
          // CRITICAL FIX: Sync frontend run number after successful run completion
          const beforeRunNumber = this.runNumber;
          this.runNumber = this.floorGenerator.getCurrentRun();
          console.log(`Frontend run number synchronized: ${beforeRunNumber} → ${this.runNumber}`);

          console.log(`Advanced to Floor ${this.floorGenerator.getCurrentFloor()}`);

          // Update floor music
          if (this.audioManager) {
            const currentFloor = this.floorGenerator.getCurrentFloor();
            console.log(`Playing music for floor ${currentFloor}`);
            await this.audioManager.playFloorMusic(currentFloor);
          }

          // PERFORMANCE OPTIMIZATION: Preload backgrounds for next floor
          const currentFloor = this.floorGenerator.getCurrentFloor();
          if (currentFloor < 3) { // Only preload if not on last floor
            const nextFloor = currentFloor + 1;
            console.log(`Preloading backgrounds for floor ${nextFloor}...`);
            backgroundManager.preloadFloorBackgrounds(nextFloor).catch(error => {
              console.warn(`Failed to preload backgrounds for floor ${nextFloor}:`, error);
            });
          }
        }
      } else {
        // NORMAL ROOM: Advance to next room
        if (!this.floorGenerator.nextRoom()) {
          console.warn("Cannot advance to next room");
          return;
        }

        console.log(`Advanced to Room ${this.floorGenerator.getCurrentRoomIndex() + 1}`);
      }

      // CRITICAL FIX: Update game state with proper debugging
      console.log("UPDATING GAME STATE - Getting new current room...");
      const newCurrentRoom = this.floorGenerator.getCurrentRoom();
      
      console.log("NEW ROOM INFO:", {
        roomType: newCurrentRoom ? newCurrentRoom.roomType : 'null',
        isCombatRoom: newCurrentRoom ? newCurrentRoom.isCombatRoom : 'null',
        floor: this.floorGenerator.getCurrentFloor(),
        roomIndex: this.floorGenerator.getCurrentRoomIndex(),
        roomTypesArray: this.floorGenerator.roomTypes
      });
      
      this.currentRoom = newCurrentRoom;
      
      // FIXED: Only call resetBossState() if the new room is actually a boss room
      if (this.currentRoom && this.currentRoom.roomType === 'boss') {
        console.log("New room IS a boss room - calling resetBossState()");
            this.currentRoom.resetBossState();
      } else {
        console.log("New room is NOT a boss room - skipping resetBossState()");
          }

      // Update player position
          this.player.setCurrentRoom(this.currentRoom);
          this.player.position = this.currentRoom.getPlayerStartPosition();
          this.player.velocity = new Vec(0, 0);
          this.player.keys = [];
      
      // CRITICAL FIX: After successful floor transition, add a brief transition cooldown
      // to prevent immediate re-triggering of transitions
      if (wasInBossRoom) {
        console.log("Setting transition cooldown after floor completion to prevent immediate re-triggers");
        this.lastFloorTransition = Date.now();
        this.floorTransitionCooldown = 2000; // 2 second cooldown
        
        // ADDITIONAL DEBUG: Verify player position and room state after floor transition
        console.log("AFTER FLOOR TRANSITION STATE:", {
          playerPosition: `(${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)})`,
          currentRoomType: this.currentRoom ? this.currentRoom.roomType : 'null',
          playerAtRightEdge: this.currentRoom ? this.currentRoom.isPlayerAtRightEdge(this.player) : 'null',
          floorTransitionCooldown: this.floorTransitionCooldown,
          currentTime: Date.now()
        });
      }
      
      // Update enemies
      this.enemies = this.currentRoom.objects.enemies;
      
      // FINAL VERIFICATION: Ensure everything is in the expected state
      console.log("FINAL TRANSITION STATE:", {
        currentFloor: this.floorGenerator.getCurrentFloor(),
        currentRoom: this.floorGenerator.getCurrentRoomIndex() + 1,
        currentRun: this.floorGenerator.getCurrentRun(),
        roomType: this.currentRoom ? this.currentRoom.roomType : 'null',
        enemyCount: this.enemies.length,
        isTransitioning: this.isTransitioning,
        hasCooldown: !!this.lastFloorTransition
      });

      // Update shop data with new room information
      this.configureShopGameData();

      console.log("Room transition completed successfully");

      // NON-BLOCKING: Auto-save after successful transition (don't await)
      this.saveCurrentGameState().catch(error => {
        console.warn("Auto-save after transition failed (non-critical):", error);
      });

    } catch (error) {
      console.error("Room transition failed:", error);

      // Simple recovery: try to restore current room state
      try {
        this.currentRoom = this.floorGenerator.getCurrentRoom();
        if (this.currentRoom && this.player) {
          this.player.setCurrentRoom(this.currentRoom);
          this.enemies = this.currentRoom.objects.enemies;
        }
      } catch (recoveryError) {
        console.error("Failed to recover from transition error:", recoveryError);
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  // SIMPLIFIED: Non-blocking transition starter
  startRoomTransition(direction) {
    console.log(`ROOM TRANSITION INITIATED with direction: ${direction}`);
    
    if (this.currentRoom.roomType === 'boss') {
      console.log('BOSS ROOM TRANSITION INITIATED');
      
      // Last-chance safety check
      const allEnemies = this.currentRoom.objects.enemies;
      const aliveBosses = allEnemies.filter(e => 
        e !== undefined && e !== null && e.state !== 'dead' && (
          e.constructor.name.includes('Boss') || 
          e.type === 'boss' || 
          e.isBoss === true ||
          e.constructor.name === 'DragonBoss' ||
          e.constructor.name === 'Supersoldier'
        )
      );
      
      // CHECK: Chest requirement
      const chestSpawned = this.currentRoom.chestSpawned;
      const chestCollected = this.currentRoom.chestCollected;
      const chestRequirementMet = !chestSpawned || chestCollected;
      
      if (aliveBosses.length > 0) {
        console.log('EMERGENCY STOP: Boss still alive in startRoomTransition!');
        return; // Emergency stop
      }
      
      if (!chestRequirementMet) {
        console.log('EMERGENCY STOP: Chest not collected in startRoomTransition!');
        return; // Emergency stop
      }
    }
    
    this.handleRoomTransition(direction).catch(error => {
      console.error("Error in room transition:", error);
      this.isTransitioning = false; // Emergency cleanup
      });
  }

  async update(deltaTime) {
    // NEW: Don't update if game is not ready yet
    if (!this.isReady) {
      return;
    }

    // NEW: Skip update if game is paused only
    if (this.isPaused) {
      return;
    }

    // FIX: Allow essential updates even during upgrade selection
    if (this.gameState === "upgradeSelection") {
      // CRITICAL: Keep essential systems running during upgrade selection
      this.player.update(deltaTime);

      // Update transition zone message timer
      if (this.transitionZoneMessageTimer > 0) {
        this.transitionZoneMessageTimer -= deltaTime;
        if (this.transitionZoneMessageTimer <= 0) {
          this.transitionZoneActivatedMessage = null;
        }
      }

      // Check wall collisions
      if (this.currentRoom.checkWallCollision(this.player)) {
        this.player.position = this.player.previousPosition;
      }

      this.player.previousPosition = new Vec(
        this.player.position.x,
        this.player.position.y
      );

      // SIMPLIFIED: Check for room transition during upgrade selection
      if (this.currentRoom.isPlayerAtRightEdge(this.player) && !this.isTransitioning) {
        this.startRoomTransition("right");
      }

      return;
    }

    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      // FIXED: Allow player movement and transition checks even when shop is open
      this.player.update(deltaTime);
      
      // Check wall collisions
      if (this.currentRoom.checkWallCollision(this.player)) {
        this.player.position = this.player.previousPosition;
      }

      this.player.previousPosition = new Vec(
        this.player.position.x,
        this.player.position.y
      );

      // CRITICAL FIX: Allow transitions even when shop is open
      if (
        this.currentRoom.isPlayerAtRightEdge(this.player) &&
        !this.isTransitioning &&
        this.currentRoom.canTransition()
      ) {
        // Close shop before transitioning
        if (this.currentRoom.objects.shop.isOpen) {
          this.currentRoom.objects.shop.close();
        }
        this.startRoomTransition("right");
      }
      
      return;
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // SIMPLIFIED: Basic enemy synchronization
    if (this.enemies !== this.currentRoom.objects.enemies) {
      this.enemies = this.currentRoom.objects.enemies;
    }

    // Show boss defeat message but DON'T reset flag yet
    if (this.bossJustDefeated && this.floorGenerator.isBossRoom()) {
      this.transitionZoneActivatedMessage = "BOSS DEFEATED! \nMove to the right edge to advance to next floor!";
      this.transitionZoneMessageTimer = 3000;
      // CRITICAL FIX: DON'T reset bossJustDefeated here - it will be reset in handleRoomTransition
      // this.bossJustDefeated = false; // REMOVED - was causing premature reset
    }

    // Update transition zone message timer
    if (this.transitionZoneMessageTimer > 0) {
      this.transitionZoneMessageTimer -= deltaTime;
      if (this.transitionZoneMessageTimer <= 0) {
        this.transitionZoneActivatedMessage = null;
      }
    }

    // SIMPLIFIED: Room transition check - only 3 conditions
    const playerAtRightEdge = this.currentRoom.isPlayerAtRightEdge(this.player);
    const notTransitioning = !this.isTransitioning;
    const canTransition = this.currentRoom.canTransition();
    
    // CRITICAL FIX: Check for floor transition cooldown
    const now = Date.now();
    const inFloorTransitionCooldown = this.lastFloorTransition && 
      (now - this.lastFloorTransition < this.floorTransitionCooldown);
    
    if (inFloorTransitionCooldown) {
      // Skip transition checks during cooldown period
      const remainingCooldown = Math.ceil((this.floorTransitionCooldown - (now - this.lastFloorTransition)) / 1000);
      if (!this.lastCooldownLog || now - this.lastCooldownLog > 1000) {
        console.log(`Floor transition cooldown active: ${remainingCooldown}s remaining`);
        this.lastCooldownLog = now;
      }
      // Continue with normal game update, just skip transitions
    } else if (playerAtRightEdge && notTransitioning && canTransition) {
      // ADDITIONAL BOSS ROOM SAFETY CHECK
      if (this.currentRoom.roomType === 'boss') {
        // FIXED: Heavily throttle boss room checks - only check/log once every 5 seconds to prevent spam
        const now = Date.now();
        if (!this.lastBossTransitionAttempt || now - this.lastBossTransitionAttempt > 5000) {
          console.log('BOSS ROOM TRANSITION TRIGGERED - Starting safety checks...');
          
          // Double-check boss room state before allowing transition
          const allEnemies = this.currentRoom.objects.enemies;
          const aliveEnemies = allEnemies.filter(e => e !== undefined && e !== null && e.state !== 'dead');
          const aliveBosses = aliveEnemies.filter(e => 
            e.constructor.name.includes('Boss') || 
            e.type === 'boss' || 
            e.isBoss === true ||
            e.constructor.name === 'DragonBoss' ||
            e.constructor.name === 'Supersoldier'
          );
          
          // CHECK: Chest requirement
          const chestSpawned = this.currentRoom.chestSpawned;
          const chestCollected = this.currentRoom.chestCollected;
          const chestRequirementMet = !chestSpawned || chestCollected;
          
          console.log('BOSS ROOM SAFETY CHECK:', {
            allEnemies: allEnemies.length,
            aliveEnemies: aliveEnemies.length,
            aliveBosses: aliveBosses.length,
            bossJustDefeated: this.bossJustDefeated,
            chestSpawned: chestSpawned,
            chestCollected: chestCollected,
            chestRequirementMet: chestRequirementMet
          });
          
          if (aliveBosses.length > 0) {
            console.log('GAME.JS BLOCKING BOSS ROOM TRANSITION: Boss still alive!');
            console.log('TIP: Defeat all bosses AND collect the chest to enable floor transition');
            this.lastBossTransitionAttempt = now;
          } else if (!this.bossJustDefeated) {
            console.log('GAME.JS BLOCKING BOSS ROOM TRANSITION: Boss defeat not confirmed!');
            console.log('TIP: Kill the boss first, then collect the chest, then return to the right edge to advance to the next floor');
            this.lastBossTransitionAttempt = now;
          } else if (!chestRequirementMet) {
            console.log('GAME.JS BLOCKING BOSS ROOM TRANSITION: Chest not collected!');
            console.log('TIP: Collect the chest first, then return to the right edge to advance to the next floor');
            this.lastBossTransitionAttempt = now;
          } else {
            console.log('GAME.JS ALLOWING BOSS ROOM TRANSITION: All boss checks passed');
            console.log('Boss successfully defeated and chest collected - proceeding with floor transition');
            this.lastBossTransitionAttempt = now;
            this.startRoomTransition("right");
          }
        }
        // If within cooldown period, silently skip transition attempt but allow normal update
      } else {
        // Non-boss room - proceed normally
        this.startRoomTransition("right");
      }
    }
    
    // FIXED: Only log boss room diagnostics when specifically needed and heavily throttled
    if (this.currentRoom.roomType === 'boss' && playerAtRightEdge && !canTransition) {
      // Only log once every 10 seconds to avoid spam
      const now = Date.now();
      if (!this.lastBossConditionLog || now - this.lastBossConditionLog > 10000) {
        console.log('BOSS ROOM: Player at right edge but cannot transition');
        console.log(`  - Can transition: ${canTransition}`);
        console.log('TIP: Defeat all bosses AND collect the chest to enable floor transition');
        
        this.lastBossConditionLog = now;
      }
    }

    // Update player
    this.player.update(deltaTime);

    // Check wall collisions
    if (this.currentRoom.checkWallCollision(this.player)) {
      this.player.position = this.player.previousPosition;
    }

    // Save current position for next update
    this.player.previousPosition = new Vec(
      this.player.position.x,
      this.player.position.y
    );

    // Spawn chest when all enemies are dead
    const aliveEnemies = this.enemies.filter((enemy) => enemy.state !== "dead");
    if (
      this.currentRoom &&
      this.currentRoom.isCombatRoom &&
      aliveEnemies.length === 0 &&
      !this.currentRoom.chestSpawned
    ) {
      this.currentRoom.spawnChest();
    }

    // Update shop reference for shop rooms
    if (this.currentRoom && this.currentRoom.roomType === "shop") {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }

    // Auto-save periodically
    const currentTime = Date.now();
    if (currentTime - this.lastAutoSave >= this.autoSaveInterval) {
      this.saveCurrentGameState().catch(error => {
        console.error("Failed to auto-save game state:", error);
      });
      this.lastAutoSave = currentTime;
    }

    // NEW: Auto-sync run statistics periodically
    if (currentTime - this.lastStatsSync >= this.statsSyncInterval) {
      this.syncRunStatsWithBackend().catch(error => {
        console.warn("Failed to auto-sync run stats:", error);
      });
      this.lastStatsSync = currentTime;
    }
  }

  // Event listeners
  createEventListeners() {
    addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      // NEW: Handle pause key (P) - always check first
      if (key === 'p') {
        this.togglePause();
        e.preventDefault();
        return;
      }

      // NEW: If game is paused, don't process other keys except pause
      if (this.isPaused) {
        e.preventDefault();
        return;
      }

      if (this.currentRoom?.objects.shop?.isOpen) {
        this.currentRoom.objects.shop.handleInput(e.key, this.player);
        e.preventDefault();
        return;
      }

      const action = keyDirections[key];

      if (action === "melee" || action === "ranged") {
        this.player.setWeapon(action);
      } else if (action === "attack") {
        this.player.attack();
      } else if (action === "dash") {
        this.player.startDash();
      } else if (action && ["up", "down", "left", "right"].includes(action)) {
        if (!this.player.keys.includes(action)) {
          this.player.keys.push(action);
        }
      }
    });

    addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();

      // NEW: Skip keyup processing if paused
      if (this.isPaused) {
        return;
      }

      const action = keyDirections[key];

      if (action && ["up", "down", "left", "right"].includes(action)) {
        this.player.keys = this.player.keys.filter((k) => k !== action);
      }
    });
  }

  // Run statistics tracking methods
  trackGoldSpent(amount) {
    this.runStats.goldSpent += amount;
    console.log(`Gold spent: +${amount}, Total spent this run: ${this.runStats.goldSpent}`);
  }

  trackKill() {
    this.runStats.totalKills++;
    console.log(`Enemy killed! Total kills this run: ${this.runStats.totalKills}`);

    // NOTE: Enemy kill registration is handled by Enemy.js to avoid duplicates
    // Each enemy instance registers its own kill with proper type mapping
  }

  // NEW: Track maximum damage dealt in a single hit
  trackDamageDealt(damage) {
    if (damage > this.runStats.maxDamageHit) {
      this.runStats.maxDamageHit = damage;
      console.log(`New max damage record: ${damage}`);
    }
  }

  // NEW: Track gold collected during the run
  trackGoldEarned(amount) {
    this.runStats.totalGoldEarned += amount;
    console.log(`Gold collected: +${amount}, Total earned this run: ${this.runStats.totalGoldEarned}`);
  }

  resetRunStats() {
    console.log("Resetting run statistics...");
    this.runStats = {
      goldSpent: 0,
      totalKills: 0,
      maxDamageHit: 0,
      totalGoldEarned: 0
    };
  }

  // FIX: Helper method to reset all boss-related flags (DRY principle)
  resetBossFlags() {
    this.bossUpgradeShown = false;
    this.bossJustDefeated = false;
    this.transitionZoneActivatedMessage = null;
    this.transitionZoneMessageTimer = 0;
    console.log("All boss-related flags reset");
  }

  getRunStats() {
    return {
      goldSpent: this.runStats.goldSpent,
      totalKills: this.runStats.totalKills,
      goldCollected: this.player ? this.player.getGold() : 0,
      maxDamageHit: this.runStats.maxDamageHit,
      totalGoldEarned: this.runStats.totalGoldEarned
    };
  }

  // NEW: Sync run statistics with backend
  async syncRunStatsWithBackend() {
    try {
      const runId = localStorage.getItem('currentRunId');
      const testMode = localStorage.getItem('testMode') === 'true';
      
      // Skip if no runId or in test mode
      if (!runId || testMode) {
        return;
      }

      const { updateRunStats } = await import('../../utils/api.js');
      
      const statsData = {
        maxDamageHit: this.runStats.maxDamageHit,
        totalGoldEarned: this.runStats.totalGoldEarned,
        totalKills: this.runStats.totalKills
      };

      await updateRunStats(runId, statsData);
      console.log('Run stats synced with backend:', statsData);
      
    } catch (error) {
      console.warn('Failed to sync run stats (non-critical):', error);
    }
  }

  // NEW: Save current game state using saveStateManager
  async saveCurrentState() {
    // NEW: Delegate to saveStateManager
    return await this.saveCurrentGameState();
  }

  // NEW: Load saved state using saveStateManager
  async loadSavedState() {
    try {
      // Get required data from localStorage
      const userId = localStorage.getItem('currentUserId');
      const sessionId = localStorage.getItem('currentSessionId');
      const runId = localStorage.getItem('currentRunId');
      const testMode = localStorage.getItem('testMode') === 'true';

      // Validate required data exists
      if (!userId || !sessionId || !runId) {
        if (testMode) {
          console.log('Load state skipped: Running in test mode');
        } else {
          console.warn('Load state skipped: Missing session data. Starting fresh game.', {
            userId: !!userId,
            sessionId: !!sessionId,
            runId: !!runId
          });
        }
        return false;
      }

      console.log('Session data complete - attempting to load saved state:', {
        userId,
        sessionId,
        runId
      });

      // Use saveStateManager to load saved state
      try {
        const saveState = await saveStateManager.loadSaveState(parseInt(userId));

        if (saveState) {
          console.log('Save state found - restoring game position:', {
            floor: saveState.floor || 1,
            room: saveState.roomId,
            gold: saveState.gold,
            health: saveState.currentHp
          });

          // Store save state for use in initObjects
          this.savedStateData = {
            hasSaveState: true,
            floor: saveState.floor || this.calculateFloorFromRoom(saveState.roomId),
            room: saveState.roomId,
            roomId: saveState.roomId,
            gold: saveState.gold,
            currentHealth: saveState.currentHp
          };
          return true;
        } else {
          console.log('No save state found - starting fresh game');
          return false;
        }

      } catch (error) {
        console.warn('Failed to load save state from backend:', error);
        console.log('Starting fresh game due to save state load failure');
        return false;
      }

    } catch (error) {
      console.error('Failed to load session data:', error);
      return false;
    }
  }

  // NEW: Create pause system
  createPauseSystem() {
    // Create pause overlay HTML
    this.createPauseOverlay();

    // Will add pause event listener in createEventListeners method
    console.log('Pause system initialized');
  }

  //  NEW: Create pause overlay DOM element
  createPauseOverlay() {
    if (this.pauseOverlay) return; // Already exists

    const overlay = document.createElement('div');
    overlay.id = 'pauseOverlay';
    overlay.className = 'pause-overlay hidden';

    overlay.innerHTML = `
      <div class="pause-container">
        <div class="pause-header">
          <h2>GAME PAUSED</h2>
        </div>
        
        <div class="pause-tabs">
          <button class="pause-tab-btn active" data-tab="controls">Controls</button>
          <button class="pause-tab-btn" data-tab="stats">Stats</button>
          <button class="pause-tab-btn" data-tab="settings">Settings</button>
        </div>
        
        <div class="pause-content">
          <div id="controls-content" class="tab-content active">
            <h3> Game Controls</h3>
            <div class="controls-grid">
              <div class="control-section">
                <h4>Movement</h4>
                <div class="control-item"><kbd>W A S D</kbd> Move player</div>
                <div class="control-item"><kbd>SHIFT</kbd> Dash</div>
              </div>
              <div class="control-section">
                <h4>Combat</h4>
                <div class="control-item"><kbd>Q</kbd> Switch to Melee</div>
                <div class="control-item"><kbd>E</kbd> Switch to Ranged</div>
                <div class="control-item"><kbd>SPACE</kbd> Attack</div>
              </div>
              <div class="control-section">
                <h4>Shop</h4>
                <div class="control-item"><kbd>W / S</kbd> Navigate options</div>
                <div class="control-item"><kbd>ENTER</kbd> Purchase</div>
                <div class="control-item"><kbd>ESC</kbd> Exit shop</div>
              </div>
              <div class="control-section">
                <h4>System</h4>
                <div class="control-item"><kbd>P</kbd> Pause / Resume</div>
              </div>
            </div>
          </div>
          
          <div id="stats-content" class="tab-content">
            <h3> Player Statistics</h3>
            <div id="stats-data">Loading stats...</div>
          </div>
          
          <div id="settings-content" class="tab-content">
            <h3> Game Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label> Music Volume</label>
                <input type="range" id="musicVolume" min="0" max="100" value="70">
                <span id="musicVolumeValue">70%</span>
              </div>
              <div class="setting-item">
                <label> SFX Volume</label>
                <input type="range" id="sfxVolume" min="0" max="100" value="80">
                <span id="sfxVolumeValue">80%</span>
              </div>
              <div class="setting-item">
                <label> Auto-save</label>
                <input type="checkbox" id="autoSave" checked>
                <span>Every 30 seconds</span>
              </div>
            </div>
            <button id="saveSettings" class="save-settings-btn">Save Settings</button>
          </div>
        </div>
        
        <div class="pause-actions">
          <button id="resumeBtn" class="resume-btn">Resume Game (P)</button>
          <button id="pauseLogoutBtn" class="logout-btn">Logout</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.pauseOverlay = overlay;

    // Set up event listeners for pause overlay
    this.setupPauseEventListeners();
  }

  // ENHANCED: Setup event listeners for pause overlay with settings loading
  setupPauseEventListeners() {
    if (!this.pauseOverlay) return;

    // Tab switching
    const tabButtons = this.pauseOverlay.querySelectorAll('.pause-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchPauseTab(btn.dataset.tab);
      });
    });

    // Resume button
    const resumeBtn = this.pauseOverlay.querySelector('#resumeBtn');
    resumeBtn?.addEventListener('click', () => {
      this.togglePause();
    });

    // Logout button
    const logoutBtn = this.pauseOverlay.querySelector('#pauseLogoutBtn');
    logoutBtn?.addEventListener('click', () => {
      this.handlePauseLogout();
    });

    // Setup settings event listeners
    this.setupSettingsEventListeners();
    
    // ENHANCED: Load saved settings when pause is opened
    this.loadGameSettings();
  }

  // ENHANCED: Setup settings event listeners with real-time volume updates
  setupSettingsEventListeners() {
    // Volume sliders with real-time updates
    const musicSlider = this.pauseOverlay.querySelector('#musicVolume');
    const sfxSlider = this.pauseOverlay.querySelector('#sfxVolume');
    const musicValue = this.pauseOverlay.querySelector('#musicVolumeValue');
    const sfxValue = this.pauseOverlay.querySelector('#sfxVolumeValue');

    musicSlider?.addEventListener('input', (e) => {
      const volume = e.target.value;
      musicValue.textContent = volume + '%';
      
      // Real-time audio update for immediate feedback
      if (this.audioManager) {
        this.audioManager.musicVolume = parseInt(volume) / 100;
        if (this.audioManager.audio && !this.audioManager.audio.paused) {
          this.audioManager.audio.volume = this.audioManager.musicVolume;
        }
      }
    });

    sfxSlider?.addEventListener('input', (e) => {
      const volume = e.target.value;
      sfxValue.textContent = volume + '%';
      
      // Real-time audio update for immediate feedback
      if (this.audioManager) {
        this.audioManager.sfxVolume = parseInt(volume) / 100;
        // Play a test SFX to demonstrate the volume change
        this.audioManager.playPlayerDashSFX();
      }
    });

    // Save settings button
    const saveBtn = this.pauseOverlay.querySelector('#saveSettings');
    saveBtn?.addEventListener('click', () => {
      this.saveGameSettings();
    });
  }

  // NEW: Load game settings from backend and localStorage
  async loadGameSettings() {
    try {
      const userId = localStorage.getItem('currentUserId');
      const testMode = localStorage.getItem('testMode') === 'true';

      let settings = null;

      // ENHANCED: Force load from backend first, especially after login
      if (userId && !testMode) {
        try {
          const { getPlayerSettings } = await import('../../utils/api.js');
          console.log('Loading audio settings from backend for user:', userId);
          settings = await getPlayerSettings(parseInt(userId));
          console.log('Settings loaded from backend:', settings);
          
          // CRITICAL FIX: Backend returns different field names
          if (settings && typeof settings === 'object') {
            // Normalize field names - backend uses different naming
            settings = {
              music_volume: settings.music_volume || settings.musicVolume || 0.7,
              sfx_volume: settings.sfx_volume || settings.sfxVolume || 0.8,
              auto_save_enabled: settings.auto_save_enabled !== undefined ? 
                settings.auto_save_enabled : 
                (settings.autoSaveEnabled !== undefined ? settings.autoSaveEnabled : true)
            };
            
            console.log('Normalized backend settings:', settings);
          }
        } catch (error) {
          console.warn('Failed to load settings from backend:', error);
          settings = null; // Ensure we try localStorage fallback
        }
      }
      
      // Fallback to localStorage if backend fails or test mode
      if (!settings) {
        console.log('Trying localStorage fallback for audio settings...');
        const localSettings = localStorage.getItem('gameSettings');
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            // Convert localStorage format (0-100) to backend format (0-1)
            settings = {
              music_volume: (parsed.musicVolume || 70) / 100,
              sfx_volume: (parsed.sfxVolume || 80) / 100,
              auto_save_enabled: parsed.autoSave !== undefined ? parsed.autoSave : true
            };
            console.log('Settings loaded from localStorage:', settings);
          } catch (parseError) {
            console.warn('Failed to parse localStorage settings:', parseError);
            settings = null;
          }
        }
      }

      // Apply settings to UI and AudioManager
      if (settings) {
        // Update UI sliders (convert 0-1 to 0-100 for display)
        const musicVolume = Math.round(Math.max(0, Math.min(100, (settings.music_volume || 0.7) * 100)));
        const sfxVolume = Math.round(Math.max(0, Math.min(100, (settings.sfx_volume || 0.8) * 100)));
        const autoSave = settings.auto_save_enabled !== false; // Default to true
        
        // ENHANCED: Always update UI elements if pause overlay exists
        if (this.pauseOverlay) {
          const musicSlider = this.pauseOverlay.querySelector('#musicVolume');
          const sfxSlider = this.pauseOverlay.querySelector('#sfxVolume');
          const musicValue = this.pauseOverlay.querySelector('#musicVolumeValue');
          const sfxValue = this.pauseOverlay.querySelector('#sfxVolumeValue');
          const autoSaveCheckbox = this.pauseOverlay.querySelector('#autoSave');
          
          if (musicSlider) {
            musicSlider.value = musicVolume;
            if (musicValue) musicValue.textContent = musicVolume + '%';
          }
          
          if (sfxSlider) {
            sfxSlider.value = sfxVolume;
            if (sfxValue) sfxValue.textContent = sfxVolume + '%';
          }
          
          if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = autoSave;
          }
        }
        
        // CRITICAL FIX: Always update AudioManager with proper values
        if (this.audioManager) {
          const normalizedMusicVolume = Math.max(0, Math.min(1, settings.music_volume || 0.7));
          const normalizedSfxVolume = Math.max(0, Math.min(1, settings.sfx_volume || 0.8));
          
          this.audioManager.musicVolume = normalizedMusicVolume;
          this.audioManager.sfxVolume = normalizedSfxVolume;
          
          // ENHANCED: Update current playing music volume immediately
          if (this.audioManager.audio && !this.audioManager.audio.paused) {
            this.audioManager.audio.volume = normalizedMusicVolume;
          }
          
          console.log('AudioManager updated with loaded settings:', {
            musicVolume: normalizedMusicVolume,
            sfxVolume: normalizedSfxVolume,
            source: userId && !testMode ? 'backend' : 'localStorage'
          });
        }
        
        return true; // Settings loaded successfully
        
      } else {
        // Use default settings
        console.log('Using default audio settings (no saved settings found)');
        if (this.audioManager) {
          this.audioManager.musicVolume = 0.7;
          this.audioManager.sfxVolume = 0.8;
          console.log('AudioManager set to defaults');
        }
        return false; // Using defaults
      }
      
    } catch (error) {
      console.error('Error loading game settings:', error);
      // Use safe defaults on error
      if (this.audioManager) {
        this.audioManager.musicVolume = 0.7;
        this.audioManager.sfxVolume = 0.8;
        console.log('AudioManager set to safe defaults due to error');
      }
      return false;
    }
  }

  // NEW: Handle logout from pause menu
  async handlePauseLogout() {
    const confirmed = confirm('Are you sure you want to logout? Any unsaved progress may be lost.');
    if (!confirmed) return;

    try {
      // Hide pause menu first
      this.hidePause();

      // Save current state before logout
      console.log('Saving state before logout...');
      await this.saveCurrentState();

      // Import enhanced logout function
      const { enhancedLogout } = await import('../../utils/api.js');

      // Get session data
      const sessionToken = localStorage.getItem('sessionToken');

      // Use centralized enhanced logout
      console.log('Using enhanced logout for complete session cleanup...');
      const logoutSuccess = await enhancedLogout(sessionToken);
      
      if (!logoutSuccess) {
        console.warn('Backend logout failed, but localStorage was cleared');
      }

      // Redirect to landing
      window.location.href = 'landing.html';

    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout even if save/logout API fails
      console.log('Force logout with emergency localStorage cleanup...');
      const { clearSessionLocalStorage } = await import('../../utils/api.js');
      clearSessionLocalStorage();
      
      window.location.href = 'landing.html';
    }
  }

  // NEW: Toggle pause state
  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.showPause();
    } else {
      this.hidePause();
    }

    console.log(` Game ${this.isPaused ? 'PAUSED' : 'RESUMED'}`);
  }

  // NEW: Show pause overlay
  showPause() {
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.remove('hidden');
      // Load current stats
      if (this.activeTab === 'stats') {
        this.loadStatsData();
      }
    }
  }

  // NEW: Hide pause overlay
  hidePause() {
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.add('hidden');
    }
  }

  // NEW: Async initialization method
  async initializeGameAsync() {
    try {
      console.log('Starting game initialization...');

      // CRITICAL FIX: Wait for managers to initialize FIRST
      await this.initializeManagers();
      console.log('Managers initialization complete');

      // THEN load saved state
      await this.loadSavedState().then(() => {
        // FINALLY initialize objects with all data available
        this.initObjects(); 
      }).catch(error => {
        console.error("Failed to load saved state, starting fresh:", error);
        this.initObjects(); // Fallback to fresh start
      });

      // ENHANCED: Load audio settings after initialization
      if (this.audioManager) {
        await this.loadGameSettings();
        console.log('Audio settings loaded');
      }

      // Mark game as ready
      this.isReady = true;
      this.gameState = "playing";
      console.log('Game initialization complete - ready to start');

      // Initialize floor music when game is ready
      if (this.audioManager) {
        const currentFloor = this.floorGenerator.getCurrentFloor();
        console.log(`🎵 Starting floor ${currentFloor} music`);
        await this.audioManager.playFloorMusic(currentFloor);
      }

      // Call ready callback if set
      if (this.gameReadyCallback) {
        this.gameReadyCallback();
      }

    } catch (error) {
      console.error('Game initialization failed:', error);
      this.gameState = "error";
    }
  }

  // NEW: Set callback for when game is ready
  onReady(callback) {
    if (this.isReady) {
      // Already ready, call immediately
      callback();
    } else {
      // Wait for ready state
      this.gameReadyCallback = callback;
    }
  }

  /**
   * Gets current game state for saving
   * @returns {Object} Current game state object
   */
  getCurrentGameState() {
    // Get localStorage values
    const userIdRaw = localStorage.getItem('currentUserId');
    const sessionIdRaw = localStorage.getItem('currentSessionId');
    const runIdRaw = localStorage.getItem('currentRunId');

    const roomId = this.floorGenerator?.getCurrentRoomId() || 1;

    // Parse values with validation
    const userId = parseInt(userIdRaw);
    const sessionId = parseInt(sessionIdRaw);
    const runId = parseInt(runIdRaw);

    // Only log warnings for NaN values (potential issues)
    if (isNaN(userId) && userIdRaw) {
      console.warn('Invalid userId in localStorage:', userIdRaw);
    }
    if (isNaN(sessionId) && sessionIdRaw) {
      console.warn('Invalid sessionId in localStorage:', sessionIdRaw);
    }
    if (isNaN(runId) && runIdRaw) {
      console.warn('Invalid runId in localStorage:', runIdRaw);
    }

    const gameState = {
      userId: userId,
      sessionId: sessionId,
      runId: runId,
      floorId: this.calculateFloorFromRoom(roomId),
      roomId: roomId,
      currentHp: this.player?.health || 100,
      gold: this.player?.gold || 0
    };

    return gameState;
  }

  /**
   * NEW: Saves current game state using saveStateManager
   */
  async saveCurrentGameState(isLogout = false) {
    try {
      const gameState = this.getCurrentGameState();
      return await saveStateManager.saveCurrentState(gameState, isLogout);
    } catch (error) {
      console.error('Failed to save current game state:', error);
      return false;
    }
  }

  /**
   * Calculate floor number from room ID
   * @param {number} roomId - Room ID (1-18)
   * @returns {number} Floor number (1-3)
   */
  calculateFloorFromRoom(roomId) {
    return Math.ceil(roomId / 6);
  }

  // NEW: Load and apply permanent upgrades to player (ENHANCED v3.0)
  async loadPermanentUpgrades(userId) {
    try {
      console.log('Loading permanent upgrades for player...');

      // Fetch permanent upgrades from backend
      const upgrades = await getPermanentUpgrades(userId);

      if (upgrades && upgrades.length > 0) {
        console.log('Permanent upgrades loaded successfully:', upgrades);

        // Apply upgrades to player
        upgrades.forEach(upgrade => {
          this.player.applyUpgrade(upgrade);
        });

        console.log('Permanent upgrades applied to player');
      } else {
        console.log('No permanent upgrades found for player');
      }

    } catch (error) {
      console.error('Failed to load permanent upgrades v3.0:', error);

      // Fallback: Try to use locally stored permanent upgrades from initialization
      if (this.permanentUpgrades && Object.keys(this.permanentUpgrades).length > 0) {
        console.log('Using fallback permanent upgrades from initialization data:', this.permanentUpgrades);

        // Apply fallback upgrades if available
        Object.entries(this.permanentUpgrades).forEach(([type, value]) => {
          console.log(`Applying fallback upgrade: ${type} = ${value}`);

          switch (type) {
            case 'health_max':
              this.player.maxHealth = value;
              this.player.health = Math.min(this.player.health, this.player.maxHealth);
              break;
            case 'stamina_max':
              this.player.maxStamina = value;
              this.player.stamina = Math.min(this.player.stamina, this.player.maxStamina);
              break;
            case 'movement_speed':
              this.player.speedMultiplier = value;
              break;
          }
        });

        console.log('Fallback permanent upgrades applied successfully');
      }
    }
  }

  /**
   * NEW: Draw transition overlay to provide visual feedback
   * Prevents canvas from appearing empty during room transitions
   */
  drawTransitionOverlay(ctx) {
    // Semi-transparent dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, variables.canvasWidth, variables.canvasHeight);

    // Calculate elapsed time for animation
    const elapsed = this.transitionStartTime ? Date.now() - this.transitionStartTime : 0;
    const progress = Math.min(elapsed / 1000, 1); // 1 second max for full animation

    // Animated progress bar
    const barWidth = 300;
    const barHeight = 8;
    const barX = (variables.canvasWidth - barWidth) / 2;
    const barY = variables.canvasHeight / 2 + 40;

    // Progress bar background
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill with color based on state
    let barColor = "#4CAF50"; // Green for normal
    if (this.transitionState === 'error') {
      barColor = "#F44336"; // Red for error
    } else if (this.transitionState === 'completing') {
      barColor = "#2196F3"; // Blue for completing
    }

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Main transition message
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const messageY = variables.canvasHeight / 2;
    ctx.fillText(this.transitionMessage, variables.canvasWidth / 2, messageY);

    // Animated dots for "in progress" states
    if (this.transitionState === 'starting' || this.transitionState === 'in_progress') {
      const dotCount = Math.floor(elapsed / 200) % 4; // Cycle every 800ms
      const dots = ".".repeat(dotCount);

      ctx.font = "bold 20px Arial";
      ctx.fillText(dots, variables.canvasWidth / 2, messageY + 35);
    }

    // Additional status text
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    let statusText = "";
    switch (this.transitionState) {
      case 'starting':
        statusText = "Saving game state...";
        break;
      case 'in_progress':
        statusText = "Loading next room...";
        break;
      case 'completing':
        statusText = "Ready to continue!";
        break;
      case 'error':
        statusText = "Something went wrong";
        break;
    }

    if (statusText) {
      ctx.fillText(statusText, variables.canvasWidth / 2, messageY + 60);
    }

    // Reset text properties
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // NEW: Switch pause menu tab
  switchPauseTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    const tabButtons = this.pauseOverlay.querySelectorAll('.pause-tab-btn');
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update content
    const contents = this.pauseOverlay.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.id === `${tabName}-content`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Load stats if stats tab
    if (tabName === 'stats') {
      this.loadStatsData();
    }
  }

  // NEW: Load stats data into pause menu
  async loadStatsData() {
    const statsContainer = this.pauseOverlay.querySelector('#stats-data');
    if (!statsContainer) return;

    try {
      // Show loading state
      statsContainer.innerHTML = '<div class="loading">Loading statistics...</div>';

      // Get current run stats (local)
      // FIXED v3.0: Use run number from initialization data with proper fallback
      const currentRun = this.runNumber || this.floorGenerator.getCurrentRun() || 1; // Fallback to 1
      const currentFloor = this.floorGenerator.getCurrentFloor();
      const currentRoom = this.floorGenerator.getCurrentRoomIndex() + 1;
      const totalRooms = this.floorGenerator.getTotalRooms();

      const runStats = this.getRunStats();
      const shopUpgrades = this.globalShop.getUpgradeCounts();

      // Get user ID for API calls
      const userId = localStorage.getItem('currentUserId');
      const testMode = localStorage.getItem('testMode') === 'true';

      let historicalStats = null;
      let currentRunStatsAPI = null;

      // Try to fetch from API if not in test mode
      if (userId && !testMode) {
        try {
          // Import API functions dynamically
          const { getCompletePlayerStats, getCurrentRunStats } = await import('../../utils/api.js');

          // Fetch both historical and current run stats
          const [historical, currentAPI] = await Promise.allSettled([
            getCompletePlayerStats(parseInt(userId)),
            getCurrentRunStats(parseInt(userId))
          ]);

          console.log('API Stats Results:', {
            historical: {
              status: historical.status,
              hasValue: historical.status === 'fulfilled' && historical.value,
              data: historical.status === 'fulfilled' ? historical.value : historical.reason
            },
            currentAPI: {
              status: currentAPI.status,
              hasValue: currentAPI.status === 'fulfilled' && currentAPI.value,
              data: currentAPI.status === 'fulfilled' ? currentAPI.value : currentAPI.reason
            }
          });

          if (historical.status === 'fulfilled' && historical.value) {
            historicalStats = historical.value;
            console.log('Historical stats loaded successfully:', historicalStats);
          } else {
            console.warn('Failed to load historical stats:', historical.reason);
          }

          if (currentAPI.status === 'fulfilled' && currentAPI.value) {
            currentRunStatsAPI = currentAPI.value;
            console.log('Current run stats loaded successfully:', currentRunStatsAPI);
          } else {
            console.warn('Failed to load current run stats:', currentAPI.reason);
          }

        } catch (error) {
          console.warn('Failed to fetch stats from API:', error);
        }
      }

      // Build stats HTML
      let statsHTML = `
        <div class="stats-section">
          <h4>Current Run</h4>
          <div class="stat-item">Run #: <span>${currentRun}</span></div>
          <div class="stat-item">Position: <span>Floor ${currentFloor}, Room ${currentRoom}/${totalRooms}</span></div>
          <div class="stat-item">Gold: <span>${this.player ? this.player.gold : 0}</span></div>
          <div class="stat-item">HP: <span>${this.player ? this.player.health : 0}/${this.player ? this.player.maxHealth : 100}</span></div>
          <div class="stat-item">Stamina: <span>${this.player ? this.player.stamina : 0}/${this.player ? this.player.maxStamina : 100}</span></div>
          <div class="stat-item">Kills this run: <span>${runStats.totalKills}</span></div>
          <div class="stat-item">Gold spent: <span>${runStats.goldSpent}</span></div>
          <div class="stat-item">Gold earned: <span>${runStats.totalGoldEarned}</span></div>
          <div class="stat-item">Max damage hit: <span>${runStats.maxDamageHit}</span></div>
          <div class="stat-item">Weapon upgrades: <span>Melee +${shopUpgrades.melee}, Ranged +${shopUpgrades.ranged}</span></div>
        </div>
      `;

      // Add historical stats if available
      if (historicalStats && typeof historicalStats === 'object' && historicalStats.totalRuns !== undefined) {
        console.log('Rendering historical stats:', historicalStats);
        statsHTML += `
          <div class="stats-section">
            <h4>Player History</h4>
            <div class="stat-item">Total runs: <span>${historicalStats.totalRuns}</span></div>
            <div class="stat-item">Completed runs: <span>${historicalStats.completedRuns}</span></div>
            <div class="stat-item">Completion rate: <span>${historicalStats.completionRate}%</span></div>
            <div class="stat-item">Total kills: <span>${historicalStats.totalKills}</span></div>
            <div class="stat-item">Best run kills: <span>${historicalStats.bestRunKills}</span></div>
            <div class="stat-item">Max damage hit: <span>${historicalStats.maxDamageHit}</span></div>
            <div class="stat-item">Total gold earned: <span>${historicalStats.totalGoldEarned || 'N/A'}</span></div>
            <div class="stat-item">Total gold spent: <span>${historicalStats.goldSpent}</span></div>
            <div class="stat-item">Total sessions: <span>${historicalStats.totalSessions}</span></div>
          </div>
        `;
      } else if (testMode) {
        console.log('Test mode - showing test mode message');
        statsHTML += `
          <div class="stats-section">
            <h4>Player History</h4>
            <div class="stat-item">Test mode - Historical data not available</div>
          </div>
        `;
      } else {
        console.warn('Unable to load historical data:', {
          hasHistoricalStats: !!historicalStats,
          historicalStatsType: typeof historicalStats,
          historicalStatsContent: historicalStats,
          userId: userId,
          testMode: testMode
        });
        statsHTML += `
          <div class="stats-section">
            <h4>Player History</h4>
            <div class="stat-item">Unable to load historical data</div>
          </div>
        `;
      }

      statsContainer.innerHTML = statsHTML;

    } catch (error) {
      console.error('Error loading stats:', error);
      statsContainer.innerHTML = '<div class="error">Error loading statistics</div>';
    }
  }

  // ENHANCED: Save game settings with backend integration
  async saveGameSettings() {
    try {
      const musicVolume = this.pauseOverlay.querySelector('#musicVolume').value;
      const sfxVolume = this.pauseOverlay.querySelector('#sfxVolume').value;
      const autoSave = this.pauseOverlay.querySelector('#autoSave').checked;
      
      const saveBtn = this.pauseOverlay.querySelector('#saveSettings');
      const originalText = saveBtn.textContent;
      
      // Show saving state
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      // Convert to normalized values for AudioManager (0-1)
      const normalizedMusicVolume = parseInt(musicVolume) / 100;
      const normalizedSfxVolume = parseInt(sfxVolume) / 100;
      
      // Update AudioManager immediately for real-time feedback
      if (this.audioManager) {
        this.audioManager.musicVolume = normalizedMusicVolume;
        this.audioManager.sfxVolume = normalizedSfxVolume;
        
        // Update current playing music volume if active
        if (this.audioManager.audio && !this.audioManager.audio.paused) {
          this.audioManager.audio.volume = normalizedMusicVolume;
        }
        
        console.log('AudioManager updated with new volumes:', {
          musicVolume: normalizedMusicVolume,
          sfxVolume: normalizedSfxVolume
        });
      }

      // Save to backend
      const userId = localStorage.getItem('currentUserId');
      const testMode = localStorage.getItem('testMode') === 'true';
      
      if (userId && !testMode) {
        // Import API functions
        const { updatePlayerSettings } = await import('../../utils/api.js');
        
        // CRITICAL FIX: Use correct field names that backend expects
        const settingsData = {
          musicVolume: normalizedMusicVolume,    // Backend expects musicVolume (0-1 range)
          sfxVolume: normalizedSfxVolume,        // Backend expects sfxVolume (0-1 range)
          autoSaveEnabled: autoSave              // Backend expects autoSaveEnabled
        };
        
        console.log('Saving settings to backend:', settingsData);
        
        const result = await updatePlayerSettings(parseInt(userId), settingsData);
        
        if (result.success) {
          console.log('Settings saved to backend successfully');
          
          // Also save to localStorage as backup with UI format (0-100)
          localStorage.setItem('gameSettings', JSON.stringify({
            musicVolume: parseInt(musicVolume), // localStorage keeps 0-100 for UI
            sfxVolume: parseInt(sfxVolume),     // localStorage keeps 0-100 for UI
            autoSave: autoSave
          }));
          
          // Show success feedback
          saveBtn.textContent = 'Saved!';
          saveBtn.style.backgroundColor = '#4CAF50';
          
        } else {
          throw new Error(result.message || 'Failed to save settings');
        }
        
      } else {
        console.log('Test mode or no user ID - saving locally only');
        
        // Save to localStorage only (test mode or no user)
        localStorage.setItem('gameSettings', JSON.stringify({
          musicVolume: parseInt(musicVolume),
          sfxVolume: parseInt(sfxVolume),
          autoSave: autoSave
        }));
        
        saveBtn.textContent = 'Saved locally!';
        saveBtn.style.backgroundColor = '#FF9800';
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      
      const saveBtn = this.pauseOverlay.querySelector('#saveSettings');
      saveBtn.textContent = 'Error - Try again';
      saveBtn.style.backgroundColor = '#F44336';
    }
    
    // Reset button after delay
    setTimeout(() => {
      const saveBtn = this.pauseOverlay.querySelector('#saveSettings');
      saveBtn.textContent = 'Save Settings';
      saveBtn.disabled = false;
      saveBtn.style.backgroundColor = '';
    }, 2000);
  }
}