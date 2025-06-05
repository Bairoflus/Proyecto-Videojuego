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

export class Game {
  constructor() {
    this.globalShop = new Shop();
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.enemies = [];
    this.initObjects();

    window.game = this;

    if (variables.debug) {
      this.initializeDebugCommands();
    }

    this.canvas = null;
    this.ctx = null;
    this.player = null;
    this.floorGenerator = null;
    this.currentRoom = null;
    this.gameState = "loading"; // loading, playing, paused, gameover
    this.debug = false;
    this.lastTime = 0;
    
    // Auto-save timing
    this.lastAutoSave = 0;
    this.autoSaveInterval = 30000; // 30 seconds
    
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
      
      console.log('Service debug commands available:');
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
      const boss = room.objects.enemies.find(e => e instanceof Boss);
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
      iconImg.src = `../assets/sprites/hud/${icon.img}`;
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
    goldIcon.src = "../assets/sprites/hud/gold_coin.png";
    ctx.drawImage(goldIcon, 40, 100, 20, 20);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText(`${this.player.gold}`, 65, 115);
  }

  resetGameAfterDeath() {
    console.log("=== COMPLETE GAME RESET AFTER DEATH ===");

    try {
      // Auto-save final state before death reset
      console.log("💀 Auto-saving final state before death reset...");
      this.saveCurrentState().catch(error => {
        console.error("Failed to save final state before death:", error);
      });

      // Reset run statistics for new run
      this.resetRunStats();
      
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

  // Extracted helper method to handle room transitions
  async handleRoomTransition(direction) {
    const isBossRoom = this.floorGenerator.isBossRoom();
    const transitionMethod =
      direction === "right" ? "nextRoom" : "previousRoom";
    const edgePositionMethod =
      direction === "right"
        ? "getPlayerStartPosition"
        : "getPlayerRightEdgePosition";

    if (direction === "left" && this.floorGenerator.isFirstRoom()) {
      console.log("Cannot retreat: Already in the first room");
      return;
    }

    if (this.currentRoom.canTransition()) {
      // Auto-save current state before room transition
      console.log(`Auto-saving before ${direction} room transition...`);
      await this.saveCurrentState();

      this.floorGenerator.updateRoomState(
        this.floorGenerator.getCurrentRoomIndex(),
        this.currentRoom
      );

      if (isBossRoom && direction === "right") {
        console.log("Transitioning to next floor");
        await this.floorGenerator.nextFloor();
      } else if (!this.floorGenerator[transitionMethod]()) {
        console.log("Room transition failed");
        return;
      }

      this.currentRoom = this.floorGenerator.getCurrentRoom();
      if (this.currentRoom) {
        this.player.setCurrentRoom(this.currentRoom);
        this.player.position = this.currentRoom[edgePositionMethod]();
        this.player.velocity = new Vec(0, 0);
        this.player.keys = [];
        this.enemies = this.currentRoom.objects.enemies;
      }

      // Auto-save after successful room transition
      console.log(`Auto-saving after successful ${direction} room transition...`);
      await this.saveCurrentState();

    } else {
      console.log(
        direction === "right"
          ? "Cannot advance: Enemies still alive in combat room"
          : "Cannot retreat: Enemies still alive in current room"
      );
    }
  }

  update(deltaTime) {
    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      return;
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // Update global enemies array
    this.enemies = this.currentRoom.objects.enemies;

    // Check room transition
    if (this.currentRoom.isPlayerAtRightEdge(this.player)) {
      // Don't block the game loop with async operations
      this.handleRoomTransition("right").catch(error => {
        console.error("Error in room transition:", error);
      });
    } else if (this.currentRoom.isPlayerAtLeftEdge(this.player)) {
      // Don't block the game loop with async operations
      this.handleRoomTransition("left").catch(error => {
        console.error("Error in room transition:", error);
      });
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

      // Validate required data exists
      if (!userId || !sessionId || !runId) {
        console.warn('Save state skipped: Missing required session data', {
          userId: !!userId,
          sessionId: !!sessionId,
          runId: !!runId
        });
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
}
export function drawBossHealthBar(ctx, boss) {
  if (!boss || boss.health <= 0) return;

  const barWidth = 300;
  const barHeight = 12;
  const x = (variables.canvasWidth - barWidth) / 2;
  const y = (variables.canvasHeight - barHeight) - 20;

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