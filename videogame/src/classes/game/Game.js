// filepath: /Users/fest/repos/Proyecto-Videojuego/videogame/src/classes/game/Game.js
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";
import { Boss } from "../entities/Boss.js";
import { saveRunState } from "../../utils/api.js";
import { serviceManager, SERVICE_STATUS, SERVICE_CRITICALITY } from "../../utils/serviceManager.js";
import { eventLogger } from '../../utils/eventLogger.js';

export class Game {
  constructor() {
    // FIX: Initialize properties FIRST before calling methods that use them
    this.canvas = null;
    this.ctx = null;
    this.player = null;
    this.floorGenerator = null;
    this.currentRoom = null;
    this.gameState = "loading"; // loading, playing, paused, gameover
    this.debug = false;
    this.lastTime = 0;
    
    // Auto-save timing
    this.lastAutoSave = Date.now();
    this.autoSaveInterval = 30000; // 30 seconds
    
    // ✅ FIX: Add room transition state management
    this.isTransitioning = false; // Flag to prevent multiple transitions
    this.transitionCooldown = 0; // Cooldown timer between transitions
    this.transitionCooldownTime = 500; // 500ms cooldown between transitions
    
    // Service initialization status
    this.servicesInitialized = false;
    this.serviceInitializationResult = null;
    this.lastServiceHealthCheck = null;
    this.serviceHealthCheckInterval = 60000; // Check every minute
    
    // Run statistics tracking
    this.runStats = {
      goldSpent: 0,
      totalKills: 0
    };

    // Event logging state
    this.loggedBossEncounters = new Set(); // Track logged boss encounters to avoid duplicates

    // FIX: Now initialize game objects AFTER properties are set up
    this.globalShop = new Shop();
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.enemies = [];
    
    // NEW: Load saved state BEFORE initializing objects
    this.loadSavedState().then(() => {
      this.initObjects(); // Now this.player won't be overwritten
    }).catch(error => {
      console.error("Failed to load saved state, starting fresh:", error);
      this.initObjects(); // Fallback to fresh start
    });

    window.game = this;

    if (variables.debug) {
      this.initializeDebugCommands();
    }

    // Initialize backend integration services using ServiceManager
    this.initializeServices();
  }

  /**
   * Initialize all backend integration services using ServiceManager
   * Enhanced with comprehensive orchestration and monitoring
   * @returns {Promise<void>}
   */
  async initializeServices() {
    try {
      console.log('Initializing Backend Integration Services with Service Manager...');
      
      // NEW: Ensure run data exists BEFORE initializing services
      await this.ensureRunDataExists();
      
      // Initialize services with configuration
      this.serviceInitializationResult = await serviceManager.initializeServices({
        blockOnCritical: true,   // Block game start if critical services fail
        timeout: 30000          // 30 second timeout
      });
      
      // Check if critical services failed
      if (this.serviceInitializationResult.criticalServicesFailed) {
        console.error('Critical services failed - game functionality may be limited');
        this.gameState = "service_error";
      } else {
        this.servicesInitialized = true;
        console.log('All critical services initialized successfully');
      }
      
      // Schedule periodic health checks
      this.scheduleServiceHealthChecks();
      
      // NEW: Always enable session debug commands (not just in debug mode)
      this.initializeSessionDebugCommands();
      
      // Enable debug commands for service management if debug mode is active
      if (variables.debug) {
        this.initializeServiceDebugCommands();
      }
      
    } catch (error) {
      console.error('Failed to initialize backend services:', error);
      this.serviceInitializationResult = { 
        success: false, 
        error: error.message,
        criticalServicesFailed: true
      };
      this.gameState = "service_error";
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
      
      console.log('🔍 Checking session data:', {
        userId: !!userId,
        sessionId: !!sessionId, 
        runId: !!runId
      });
      
      // If we already have all required data, we're good
      if (userId && sessionId && runId) {
        console.log('✅ All session data present, runId:', runId);
        return true;
      }
      
      // If missing basic auth data, enable test mode
      if (!userId || !sessionId) {
        console.warn('⚠️ Missing basic session data - enabling test mode');
        localStorage.setItem('testMode', 'true');
        return true;
      }
      
      // We have auth data but missing runId - create one
      if (!runId) {
        console.log('🚀 Creating new run for user:', userId);
        
        // Import createRun dynamically to avoid circular imports
        const { createRun } = await import('../../utils/api.js');
        
        const runData = await createRun(parseInt(userId));
        localStorage.setItem('currentRunId', runData.runId);
        
        console.log('✅ New run created successfully:', runData.runId);
        console.log('📊 Session data now complete:', {
          userId: localStorage.getItem('currentUserId'),
          sessionId: localStorage.getItem('currentSessionId'),
          runId: localStorage.getItem('currentRunId')
        });
        
        return true;
      }
      
    } catch (error) {
      console.error('Failed to ensure run data:', error);
      console.warn('🔧 Enabling test mode due to run creation failure');
      localStorage.setItem('testMode', 'true');
      return true; // Allow test mode
    }
  }

  /**
   * Schedule periodic service health checks
   * @private
   */
  scheduleServiceHealthChecks() {
    // Initial health check after 10 seconds
    setTimeout(() => this.performServiceHealthCheck(), 10000);
    
    // Regular health checks
    setInterval(() => this.performServiceHealthCheck(), this.serviceHealthCheckInterval);
  }

  /**
   * Perform service health check and handle degraded services
   * @private
   */
  async performServiceHealthCheck() {
    try {
      this.lastServiceHealthCheck = await serviceManager.performHealthCheck();
      
      const criticalServicesDown = Object.values(this.lastServiceHealthCheck.services)
        .filter(service => service.criticality === SERVICE_CRITICALITY.CRITICAL && !service.healthy);
      
      if (criticalServicesDown.length > 0) {
        console.warn('Critical services are unhealthy:', criticalServicesDown.map(s => s.name));
        
        // Attempt to restart failed services
        const restartResult = await serviceManager.restartFailedServices();
        if (restartResult.restarted > 0) {
          console.log(`Successfully restarted ${restartResult.restarted} services`);
        }
      }
      
    } catch (error) {
      console.error('Service health check failed:', error);
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
          console.log('📊 Current session data:', data);
          return data;
        },
        createRun: async () => {
          try {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
              console.error('Cannot create run: No userId found');
              return false;
            }
            console.log('🚀 Manually creating run for user:', userId);
            const { createRun } = await import('../../utils/api.js');
            const runData = await createRun(parseInt(userId));
            localStorage.setItem('currentRunId', runData.runId);
            console.log('Run created successfully:', runData.runId);
            return runData;
          } catch (error) {
            console.error('Failed to create run:', error);
            return false;
          }
        },
        enableTestMode: () => {
          localStorage.setItem('testMode', 'true');
          console.log('Test mode enabled - warnings will be suppressed');
        },
        disableTestMode: () => {
          localStorage.removeItem('testMode');
          console.log('Test mode disabled - full backend integration active');
        },
        clear: () => {
          localStorage.removeItem('currentUserId');
          localStorage.removeItem('currentSessionId');
          localStorage.removeItem('currentRunId');
          localStorage.removeItem('testMode');
          console.log('All session data cleared');
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
              const { createRun } = await import('../../utils/api.js');
              const runData = await createRun(parseInt(userId));
              localStorage.setItem('currentRunId', runData.runId);
              console.log('Session data fixed! runId:', runData.runId);
              localStorage.removeItem('testMode');
              return { fixed: true, runId: runData.runId };
            } catch (error) {
              console.error('Failed to create run, enabling test mode');
              localStorage.setItem('testMode', 'true');
              return { testMode: true, error: error.message };
            }
          }
          
          console.log('Session data is already complete');
          return { alreadyComplete: true };
        }
      };
      
      console.log('Session debug commands available (run in console):');
      console.log('  gameSessionDebug.check() - Check current session data');
      console.log('  gameSessionDebug.createRun() - Manually create run');
      console.log('  gameSessionDebug.fix() - Auto-fix session issues');
      console.log('  gameSessionDebug.enableTestMode() - Enable test mode');
      console.log('  gameSessionDebug.disableTestMode() - Disable test mode');
      console.log('  gameSessionDebug.clear() - Clear all session data');
    }
  }

  /**
   * Initialize debug commands for service management
   * @private
   */
  initializeServiceDebugCommands() {
    if (typeof window !== 'undefined') {
      // Global debug commands for service management
      window.gameServiceDebug = {
        status: () => serviceManager.getOverallStatus(),
        health: () => serviceManager.performHealthCheck(),
        restart: () => serviceManager.restartFailedServices(),
        serviceStatus: (serviceId) => serviceManager.getServiceStatus(serviceId),
        reinitialize: () => this.initializeServices()
      };

      console.log('🔧 Service debug commands available:');
      console.log('  window.gameServiceDebug.status() - Get overall service status');
      console.log('  window.gameServiceDebug.health() - Perform health check');
      console.log('  window.gameServiceDebug.restart() - Restart failed services');
      console.log('  window.gameServiceDebug.serviceStatus(id) - Get specific service status');
      console.log('  window.gameServiceDebug.reinitialize() - Reinitialize all services');
    }
  }

  /**
   * Check if game is ready to start based on service status
   * @returns {boolean} True if game can start
   */
  isGameReadyToStart() {
    if (!this.serviceInitializationResult) {
      return false;
    }
    
    // Game can start if no critical services failed
    return !this.serviceInitializationResult.criticalServicesFailed;
  }

  /**
   * Get service status summary for UI display
   * @returns {Object} Service status summary
   */
  getServiceStatusSummary() {
    if (!this.serviceInitializationResult) {
      return { status: 'initializing', ready: false };
    }
    
    const criticalServices = Object.values(this.serviceInitializationResult.services)
      .filter(service => service.criticality === SERVICE_CRITICALITY.CRITICAL);
    
    const criticalSuccessRate = criticalServices.length > 0 
      ? (criticalServices.filter(s => s.success).length / criticalServices.length) * 100
      : 100;
    
    return {
      status: this.serviceInitializationResult.success ? 'ready' : 'degraded',
      ready: this.isGameReadyToStart(),
      criticalSuccessRate: Math.round(criticalSuccessRate),
      totalServices: Object.keys(this.serviceInitializationResult.services).length,
      initializationTime: this.serviceInitializationResult.totalTime,
      lastHealthCheck: this.lastServiceHealthCheck?.timestamp
    };
  }

  initObjects() {
    this.currentRoom = this.floorGenerator.getCurrentRoom();
    const startPos = this.currentRoom.getPlayerStartPosition();

    this.player = new Player(startPos, 64, 64, "red", 13);
    // Initialize player with default weapon (melee) and proper animation
    this.player.setWeapon("melee");
    this.player.setCurrentRoom(this.currentRoom);

    this.enemies = this.currentRoom.objects.enemies;

    if (this.currentRoom.roomType === "shop" && this.currentRoom.objects.shop) {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }
    
    // Log game start event
    const startRoomId = this.floorGenerator.getCurrentRoomId();
    eventLogger.logRoomEnter(startRoomId, 'game_start').catch(error => {
      console.error('Failed to log game start:', error);
    });
  }

  draw(ctx) {
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
    if (this.floorGenerator.isBossRoom()) {
      const room = this.floorGenerator.getCurrentRoom();
      const boss = room.objects.enemies.find((e) => e instanceof Boss);
      drawBossHealthBar(ctx, boss);
    }
  }

  drawUI(ctx) {
    const iconSize = 20;
    const startX = 100;
    const startY = 100;
    const barWidth = 200;
    const barHeight = 20;

    // Draw Run/Floor/Room info in bottom-right corner
    const currentRun = this.floorGenerator.getCurrentRun();
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
    ctx.strokeText(
      runFloorRoomText,
      variables.canvasWidth - 10,
      variables.canvasHeight - 10
    );

    ctx.fillStyle = "white";
    ctx.fillText(
      runFloorRoomText,
      variables.canvasWidth - 10,
      variables.canvasHeight - 10
    );

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
  }

  resetGameAfterDeath() {
    console.log("=== COMPLETE GAME RESET AFTER DEATH ===");

    try {
      // Log player death event before reset
      const currentRoomId = this.floorGenerator.getCurrentRoomId();
      const weaponType = this.player ? this.player.weaponType : 'unknown';
      eventLogger.logPlayerDeath(currentRoomId, weaponType, 'enemy_damage').catch(error => {
        console.error('Failed to log player death:', error);
      });

      // Auto-save final state before death reset
      console.log("Auto-saving final state before death reset...");
      this.saveCurrentState().catch(error => {
        console.error("Failed to save final state before death:", error);
      });

      // ✅ FIX: Reset transition state for new run
      this.isTransitioning = false;
      this.transitionCooldown = 0;
      console.log("🔄 TRANSITION STATE RESET - Ready for new run");

      // Reset run statistics for new run
      this.resetRunStats();
      
      // Reset event logging state for new run
      this.loggedBossEncounters.clear();
      
      this.floorGenerator.resetToInitialState();
      this.globalShop.resetForNewRun();

      this.currentRoom = this.floorGenerator.getCurrentRoom();
      const startPos = this.currentRoom.getPlayerStartPosition();

      this.player.resetToInitialState(startPos);
      this.player.setCurrentRoom(this.currentRoom);
      this.player.previousPosition = new Vec(startPos.x, startPos.y);

      this.enemies = this.currentRoom.objects.enemies;

      console.log("Game reset complete!");
      return true;
    } catch (error) {
      console.error("Error during game reset:", error);
      return false;
    }
  }

  // Extracted helper method to handle room transitions (FORWARD ONLY)
  async handleRoomTransition(direction) {
    // ✅ FIX: Prevent multiple simultaneous transitions
    if (this.isTransitioning) {
      return; // Already transitioning, ignore additional calls
    }
    
    // ✅ FIXED: Only allow RIGHT transitions (forward progression)
    if (direction !== "right") {
      console.log("🚫 ROOM REGRESSION DISABLED - Only forward progression allowed");
      return;
    }

    if (this.currentRoom.canTransition()) {
      // ✅ FIX: Set transition flag to prevent multiple calls
      this.isTransitioning = true;
      console.log("🔒 ROOM TRANSITION STARTED - Blocking additional transitions");
      
      try {
        // DETAILED LOGGING for debugging
        const beforeIndex = this.floorGenerator.getCurrentRoomIndex();
        const beforeFloor = this.floorGenerator.getCurrentFloor();
        const wasInBossRoom = this.floorGenerator.isBossRoom();
        
        console.log(`🚪 ROOM TRANSITION FORWARD:`, {
          from: `Floor ${beforeFloor}, Room ${beforeIndex + 1}`,
          wasInBossRoom,
          canTransition: this.currentRoom.canTransition()
        });

        // Auto-save current state before room transition
        console.log(`Auto-saving before room transition...`);
        await this.saveCurrentState();

        this.floorGenerator.updateRoomState(
          this.floorGenerator.getCurrentRoomIndex(),
          this.currentRoom
        );

        // FIXED: Check for BOSS ROOM FIRST before attempting room transition
        if (wasInBossRoom) {
          console.log("🏰 BOSS DEFEATED - Transitioning to next floor...");
          
          // Go to next floor directly instead of trying nextRoom()
          await this.floorGenerator.nextFloor();
          
          const newFloor = this.floorGenerator.getCurrentFloor();
          const newIndex = this.floorGenerator.getCurrentRoomIndex();
          console.log(`🎉 FLOOR TRANSITION COMPLETE: Now at Floor ${newFloor}, Room ${newIndex + 1}`);
          
          // Set up new room after floor transition
          this.currentRoom = this.floorGenerator.getCurrentRoom();
          if (this.currentRoom) {
            this.player.setCurrentRoom(this.currentRoom);
            this.player.position = this.currentRoom.getPlayerStartPosition();
            this.player.velocity = new Vec(0, 0);
            this.player.keys = [];
            this.enemies = this.currentRoom.objects.enemies;
            
            console.log(`🎮 NEW FLOOR ROOM STATE: ${this.enemies.length} enemies, room completed: ${this.currentRoom.canTransition()}`);
            
            // Log room transition event for new floor
            const newRoomId = this.floorGenerator.getCurrentRoomId();
            const roomType = this.floorGenerator.getCurrentRoomType();
            await eventLogger.logRoomEnter(newRoomId, `floor_transition_to_${roomType}`).catch(error => {
              console.error('Failed to log floor transition:', error);
            });
          }
          
          // Auto-save after successful floor transition
          console.log(`Auto-saving after successful floor transition...`);
          await this.saveCurrentState();
          
        } else {
          // NORMAL ROOM TRANSITION (not boss room, forward only)
          if (!this.floorGenerator.nextRoom()) {
            console.log("Room transition FAILED");
            return;
          }

          // DETAILED LOGGING after normal room transition
          const afterIndex = this.floorGenerator.getCurrentRoomIndex();
          const afterFloor = this.floorGenerator.getCurrentFloor();
          
          console.log(`ROOM TRANSITION SUCCESS:`, {
            to: `Floor ${afterFloor}, Room ${afterIndex + 1}`,
            indexChanged: beforeIndex !== afterIndex,
            floorChanged: beforeFloor !== afterFloor
          });

          this.currentRoom = this.floorGenerator.getCurrentRoom();
          if (this.currentRoom) {
            this.player.setCurrentRoom(this.currentRoom);
            this.player.position = this.currentRoom.getPlayerStartPosition();
            this.player.velocity = new Vec(0, 0);
            this.player.keys = [];
            this.enemies = this.currentRoom.objects.enemies;
            
            // ENEMY STATE LOGGING
            console.log(`🎮 NEW ROOM STATE: ${this.enemies.length} enemies, room completed: ${this.currentRoom.canTransition()}`);
            
            // Log room transition event
            const newRoomId = this.floorGenerator.getCurrentRoomId();
            const roomType = this.floorGenerator.getCurrentRoomType();
            await eventLogger.logRoomEnter(newRoomId, `right_transition_to_${roomType}`).catch(error => {
              console.error('Failed to log room transition:', error);
            });
            
            // Log boss encounter if entering a boss room for the first time
            if (roomType === 'boss' && !this.loggedBossEncounters.has(newRoomId)) {
              const weaponType = this.player ? this.player.weaponType : 'unknown';
              await eventLogger.logBossEncounter(newRoomId, weaponType, 100).catch(error => {
                console.error('Failed to log boss encounter:', error);
              });
              this.loggedBossEncounters.add(newRoomId);
              console.log(`Boss encounter logged for room ${newRoomId}`);
            }
          }

          // Auto-save after successful room transition
          console.log(`Auto-saving after successful room transition...`);
          await this.saveCurrentState();
        }
        
        // ✅ FIX: Set cooldown timer to prevent immediate re-transition
        this.transitionCooldown = this.transitionCooldownTime;
        console.log(`✅ ROOM TRANSITION COMPLETE - Setting ${this.transitionCooldownTime}ms cooldown`);
        
      } catch (error) {
        console.error("Error during room transition:", error);
      } finally {
        // ✅ FIX: Always clear the transition flag, even if there was an error
        this.isTransitioning = false;
        console.log("🔓 ROOM TRANSITION UNLOCKED");
      }

    } else {
      console.log("Cannot advance: Enemies still alive in combat room");
    }
  }

  update(deltaTime) {
    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      return;
    }

    // ✅ FIX: Update transition cooldown timer
    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= deltaTime;
      if (this.transitionCooldown <= 0) {
        this.transitionCooldown = 0;
        console.log("🕒 ROOM TRANSITION COOLDOWN EXPIRED - Transitions now allowed");
      }
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // Update global enemies array
    this.enemies = this.currentRoom.objects.enemies;

    // ✅ FIXED: Check room transition (FORWARD ONLY) with proper state management
    if (
      this.currentRoom.isPlayerAtRightEdge(this.player) && 
      !this.isTransitioning && 
      this.transitionCooldown <= 0
    ) {
      console.log("🚪 ROOM TRANSITION TRIGGERED - Player at right edge");
      // Don't block the game loop with async operations
      this.handleRoomTransition("right").catch(error => {
        console.error("Error in room transition:", error);
      });
    }
    // REMOVED: Left edge transition - no regression allowed

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

    // Check if all enemies are dead and spawn chest
    const aliveEnemies = this.enemies.filter((enemy) => enemy.state !== "dead");
    if (
      this.currentRoom &&
      this.currentRoom.isCombatRoom &&
      aliveEnemies.length === 0 &&
      !this.currentRoom.chestSpawned
    ) {
      this.currentRoom.spawnChest();
    }

    // Update shop reference if we're in a shop room
    if (this.currentRoom && this.currentRoom.roomType === "shop") {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }

    // Auto-save current state periodically
    const currentTime = Date.now();
    if (currentTime - this.lastAutoSave >= this.autoSaveInterval) {
      this.saveCurrentState().catch(error => {
        console.error("Failed to auto-save game state:", error);
      });
      this.lastAutoSave = currentTime;
    }
  }

  // Event listeners
  createEventListeners() {
    addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

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
    
    // Log enemy kill event
    const roomId = this.floorGenerator.getCurrentRoomId();
    const weaponType = this.player ? this.player.weaponType : 'unknown';
    eventLogger.logEnemyKill(roomId, weaponType, 'combat').catch(error => {
      console.error('Failed to log enemy kill event:', error);
    });
  }

  resetRunStats() {
    console.log("Resetting run statistics...");
    this.runStats = {
      goldSpent: 0,
      totalKills: 0
    };
  }

  getRunStats() {
    return {
      goldSpent: this.runStats.goldSpent,
      totalKills: this.runStats.totalKills,
      goldCollected: this.player ? this.player.getGold() : 0
    };
  }

  // Save current game state to backend
  async saveCurrentState() {
    try {
      // Get required data from localStorage
      const userId = localStorage.getItem('currentUserId');
      const sessionId = localStorage.getItem('currentSessionId');
      const runId = localStorage.getItem('currentRunId');
      const testMode = localStorage.getItem('testMode') === 'true';

      // Validate required data exists
      if (!userId || !sessionId || !runId) {
        if (testMode) {
          console.log('Save state skipped: Running in test mode');
        } else {
          console.warn('Save state skipped: Missing session data. Run gameSessionDebug.fix() to resolve.', {
            userId: !!userId,
            sessionId: !!sessionId,
            runId: !!runId
          });
        }
        return false;
      }

      // Get current room ID from floor generator
      const roomId = this.floorGenerator.getCurrentRoomId();
      if (!roomId) {
        console.warn('Save state skipped: Could not determine current room ID');
        return false;
      }

      // Collect current player state
      const stateData = {
        userId: parseInt(userId),
        sessionId: parseInt(sessionId),
        roomId: roomId,
        currentHp: this.player.health,
        currentStamina: this.player.stamina,
        gold: this.player.gold
      };

      console.log('Saving game state:', stateData);

      // Call save state API
      const result = await saveRunState(runId, stateData);
      
      console.log('Game state saved successfully:', result);
      return true;

    } catch (error) {
      console.error('Failed to save game state:', error);
      // Don't throw error to prevent game disruption
      return false;
    }
  }

  // Game state management methods
  setupNewGame() {
  }

  // NEW: Load saved state BEFORE initializing objects
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

      console.log('Session data complete - will start with saved session:', {
        userId,
        sessionId, 
        runId
      });

      // TODO: In future, load actual saved state from database
      // For now, just verify session data exists
      return true;

    } catch (error) {
      console.error('Failed to load session data:', error);
      return false;
    }
  }
}

export function drawBossHealthBar(ctx, boss) {
  if (!boss || boss.health <= 0) return;

  const barWidth = 300;
  const barHeight = 12;
  const x = (variables.canvasWidth - barWidth) / 2;
  const y = variables.canvasHeight - barHeight - 20;

  const pct = boss.health / boss.maxHealth;

  // fondo rojo
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillRect(x, y, barWidth, barHeight);

  // vida actual verde
  ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
  ctx.fillRect(x, y, barWidth * pct, barHeight);

  // borde blanco
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);

  // nombre del boss
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("DRAGON BOSS", x + barWidth / 2, y - 6);
}
