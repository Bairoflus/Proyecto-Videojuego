// filepath: /Users/fest/repos/Proyecto-Videojuego/videogame/src/classes/game/Game.js
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections, preloadBackgrounds } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";
import { Boss } from "../entities/Boss.js";
import {
  completeRun,
  createRun,
  registerEnemyKill,
  registerBossKill,
  getPermanentUpgrades,
  getCurrentRunInfo,
} from "../../utils/api.js";
import { saveStateManager } from "../../utils/saveStateManager.js";
import { weaponUpgradeManager } from "../../utils/weaponUpgradeManager.js";
import { PermanentUpgradePopup } from "../ui/PermanentUpgradePopup.js";

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

    // SIMPLIFIED: Only essential transition control
    this.isTransitioning = false; // Single flag to prevent multiple transitions

    // Enemy synchronization
    this.enemies = [];

    // Pause system
    this.isPaused = false;
    this.pauseOverlay = null;
    this.activeTab = "controls";

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
    };

    // Event logging state
    this.loggedBossEncounters = new Set();

    // Initialize game components
    this.globalShop = new Shop();
    this.permanentUpgradePopup = new PermanentUpgradePopup();

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
      console.log("Initializing Game Managers v3.0...");

      // Ensure run data exists BEFORE initializing managers
      await this.ensureRunDataExists();

      // Get session data for manager initialization
      const userId = parseInt(localStorage.getItem("currentUserId"));
      const runId = parseInt(localStorage.getItem("currentRunId"));

      // NEW v3.0: Use complete player initialization in one call
      console.log("Loading complete player data (v3.0)...");
      const { initializePlayerData } = await import("../../utils/api.js");

      this.playerInitData = await initializePlayerData(userId);

      if (this.playerInitData) {
        console.log(
          "Player v3.0 initialization data loaded:",
          this.playerInitData
        );

        // Extract and store data for use in initObjects
        this.runNumber = this.playerInitData.run_number;
        this.weaponLevels = {
          melee: this.playerInitData.melee_level || 1,
          ranged: this.playerInitData.ranged_level || 1,
        };
        this.permanentUpgrades =
          this.playerInitData.permanent_upgrades_parsed || {};
        this.hasSaveState = this.playerInitData.has_save_state === 1;

        console.log("EXTRACTED DATA DEBUG:", {
          rawRunNumber: this.playerInitData.run_number,
          extractedRunNumber: this.runNumber,
          rawPermanentUpgrades: this.playerInitData.permanent_upgrades_parsed,
          extractedPermanentUpgrades: this.permanentUpgrades,
          rawWeaponLevels: {
            melee: this.playerInitData.melee_level,
            ranged: this.playerInitData.ranged_level,
          },
          extractedWeaponLevels: this.weaponLevels,
        });

        // NEW v3.0: Auto-sync localStorage runId with database if inconsistent
        const localStorageRunId = parseInt(
          localStorage.getItem("currentRunId")
        );
        if (localStorageRunId !== this.runNumber) {
          console.warn(
            `Run ID sync issue detected! localStorage: ${localStorageRunId}, Database: ${this.runNumber}`
          );
          console.log("Auto-syncing localStorage with database run number...");

          // FIXED: Don't create new run - sync localStorage to match database
          // The database is the source of truth for run numbers
          try {
            // Check if there's an active run for the current run number
            const { getCurrentRunInfo } = await import("../../utils/api.js");
            const runInfo = await getCurrentRunInfo(userId);

            if (
              runInfo &&
              runInfo.current_run_id &&
              runInfo.current_run_id > 0
            ) {
              // Use the existing active run
              localStorage.setItem("currentRunId", runInfo.current_run_id);
              console.log(
                `localStorage synced: runId updated to ${runInfo.current_run_id} for run number ${this.runNumber}`
              );
            } else {
              // Create a new run only if no active run exists
              const { createRun } = await import("../../utils/api.js");
              const newRunResult = await createRun(userId);
              if (newRunResult.success) {
                localStorage.setItem("currentRunId", newRunResult.runId);
                console.log(
                  `New run created: runId ${newRunResult.runId} for run number ${this.runNumber}`
                );
              }
            }
          } catch (error) {
            console.error(
              "Failed to sync runId, using database run number as fallback:",
              error
            );
            // As a last resort, create a placeholder runId based on run number
            localStorage.setItem("currentRunId", this.runNumber.toString());
          }
        }

        console.log("v3.0 data extracted:", {
          runNumber: this.runNumber,
          weaponLevels: this.weaponLevels,
          permanentUpgrades: this.permanentUpgrades,
          hasSaveState: this.hasSaveState,
        });

        // NEW v3.0: Sync run number with FloorGenerator
        if (this.floorGenerator && this.runNumber) {
          // Wait for FloorGenerator to load its run progress
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait

          while (
            !this.floorGenerator.runProgressLoaded &&
            attempts < maxAttempts
          ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }

          // Force sync the run number
          this.floorGenerator.runCount = this.runNumber;
          console.log(`FloorGenerator run number synced to: ${this.runNumber}`);
        }
      } else {
        console.warn("Failed to load player v3.0 data, using fallback values");
        // Use fallback values
        this.runNumber = 1;
        this.weaponLevels = { melee: 1, ranged: 1 };
        this.permanentUpgrades = {};
        this.hasSaveState = false;
      }

      // Initialize managers with proper user data
      console.log("Initializing saveStateManager...");
      // saveStateManager doesn't need initialize() - it's auto-initialized as singleton
      // Just check if it has save state available
      const hasSavedState = await saveStateManager.loadSaveState(userId);

      console.log("Initializing weaponUpgradeManager...");
      // NEW v3.0: Use the corrected/synced runId from localStorage
      const syncedRunId = parseInt(localStorage.getItem("currentRunId"));
      await weaponUpgradeManager.initialize(
        userId,
        syncedRunId,
        this.weaponLevels
      );

      // Check for existing saved state
      this.managersInitializationResult = {
        success: true,
        hasSavedState: !!hasSavedState,
        userData: { userId, runId: syncedRunId },
      };

      console.log("All Game Managers v3.0 initialized successfully");
      this.managersInitialized = true; // Mark as complete

      return this.managersInitializationResult;
    } catch (error) {
      console.error("Failed to initialize managers v3.0:", error);
      this.managersInitializationResult = {
        success: false,
        error: error.message,
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
      const userId = localStorage.getItem("currentUserId");
      const sessionId = localStorage.getItem("currentSessionId");
      const runId = localStorage.getItem("currentRunId");

      console.log("Checking session data:", {
        userId: !!userId,
        sessionId: !!sessionId,
        runId: !!runId,
      });

      // If we already have all required data, we're good
      if (userId && sessionId && runId) {
        console.log("All session data present, runId:", runId);
        return true;
      }

      // If missing basic auth data, enable test mode
      if (!userId || !sessionId) {
        console.warn("Missing basic session data - enabling test mode");
        localStorage.setItem("testMode", "true");
        return true;
      }

      // We have auth data but missing runId - create one
      if (!runId) {
        console.log("Creating new run for user:", userId);

        const runResult = await createRun(parseInt(userId));

        if (runResult.success) {
          localStorage.setItem("currentRunId", runResult.runId);
          console.log("New run created successfully:", runResult.runId);
          return true;
        } else {
          throw new Error(runResult.message || "Failed to create run");
        }
      }
    } catch (error) {
      console.error("Failed to ensure run data:", error);
      console.warn("Enabling test mode due to run creation failure");
      localStorage.setItem("testMode", "true");
      return true; // Allow test mode
    }
  }

  /**
   * Initialize session debug commands (always available for troubleshooting)
   * @private
   */
  initializeSessionDebugCommands() {
    if (typeof window !== "undefined") {
      // Session data debug commands - ALWAYS AVAILABLE
      window.gameSessionDebug = {
        check: () => {
          const data = {
            userId: localStorage.getItem("currentUserId"),
            sessionId: localStorage.getItem("currentSessionId"),
            runId: localStorage.getItem("currentRunId"),
            testMode: localStorage.getItem("testMode") === "true",
          };
          console.log("📊 Current session data:", data);
          return data;
        },
        createRun: async () => {
          try {
            const userId = localStorage.getItem("currentUserId");
            if (!userId) {
              console.error("Cannot create run: No userId found");
              return false;
            }
            console.log("Manually creating run for user:", userId);
            const runResult = await createRun(parseInt(userId));
            if (runResult.success) {
              localStorage.setItem("currentRunId", runResult.runId);
              console.log("Run created successfully:", runResult.runId);
              return runResult;
            } else {
              throw new Error(runResult.message);
            }
          } catch (error) {
            console.error("Failed to create run:", error);
            return false;
          }
        },
        fix: async () => {
          console.log("Attempting to fix session data...");
          const userId = localStorage.getItem("currentUserId");
          const sessionId = localStorage.getItem("currentSessionId");

          if (!userId || !sessionId) {
            console.log("Missing basic auth data - enabling test mode");
            localStorage.setItem("testMode", "true");
            return { testMode: true };
          }

          const runId = localStorage.getItem("currentRunId");
          if (!runId) {
            try {
              console.log("Creating missing runId...");
              const runResult = await createRun(parseInt(userId));
              if (runResult.success) {
                localStorage.setItem("currentRunId", runResult.runId);
                console.log("Session data fixed! runId:", runResult.runId);
                localStorage.removeItem("testMode");
                return { fixed: true, runId: runResult.runId };
              } else {
                throw new Error(runResult.message);
              }
            } catch (error) {
              console.error("Failed to create run, enabling test mode");
              localStorage.setItem("testMode", "true");
              return { testMode: true, error: error.message };
            }
          }

          console.log("Session data is already complete");
          return { alreadyComplete: true };
        },
        // SIMPLIFIED: Basic room debugging
        room: {
          current: () => {
            if (!window.game) {
              console.error("❌ Game instance not found");
              return null;
            }

            const fg = window.game.floorGenerator;
            const room = window.game.currentRoom;

            const data = {
              floor: fg.getCurrentFloor(),
              roomIndex: fg.getCurrentRoomIndex(),
              roomNumber: fg.getCurrentRoomIndex() + 1,
              roomType: fg.getCurrentRoomType(),
              canTransition: room ? room.canTransition() : "N/A",
              enemies: room ? room.objects.enemies.length : "N/A",
              aliveEnemies: room
                ? room.objects.enemies.filter((e) => e.state !== "dead").length
                : "N/A",
              isTransitioning: window.game.isTransitioning,
            };

            console.log("🎯 CURRENT ROOM STATE:");
            console.table(data);
            return data;
          },
          forceTransition: () => {
            if (!window.game || !window.game.currentRoom) {
              console.error("❌ Game or current room not found");
              return false;
            }

            console.log("🔓 FORCING ROOM TRANSITION...");

            // Clear transition lock
            window.game.isTransitioning = false;

            // Force kill all enemies if in combat room
            if (window.game.currentRoom.isCombatRoom) {
              window.game.enemies.forEach((enemy) => {
                if (enemy.state !== "dead") {
                  enemy.state = "dead";
                  console.log(`💀 Force killed: ${enemy.type}`);
                }
              });

              // Clean room enemies array
              window.game.currentRoom.objects.enemies =
                window.game.currentRoom.objects.enemies.filter(
                  (enemy) => enemy.state !== "dead"
                );
            }

            console.log("✅ Transition forced - try moving to right edge");
            return true;
          },
        },
      };

      console.log("Debug commands available:");
      console.log("  gameSessionDebug.check() - Check session data");
      console.log("  gameSessionDebug.fix() - Auto-fix session issues");
      console.log("  gameSessionDebug.room.current() - Show room state");
      console.log(
        "  gameSessionDebug.room.forceTransition() - Force enable transition"
      );
    }
  }

  initObjects() {
    // NEW: Apply saved state if available
    let savedState = null;
    if (
      this.managersInitializationResult &&
      this.managersInitializationResult.hasSavedState
    ) {
      savedState = saveStateManager.getCurrentSaveState();
      console.log("Applying saved state to game objects:", savedState);
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
    if (
      this.permanentUpgrades &&
      Object.keys(this.permanentUpgrades).length > 0
    ) {
      console.log("=== APPLYING PERMANENT UPGRADES ===");
      console.log("Permanent upgrades data:", this.permanentUpgrades);
      console.log(
        "Applying permanent upgrades from v3.0 initialization data:",
        this.permanentUpgrades
      );

      // Log player base stats BEFORE applying upgrades
      console.log("Player BASE stats before permanent upgrades:", {
        baseHealth: this.player.maxHealth,
        baseStamina: this.player.maxStamina,
        baseSpeed: this.player.speedMultiplier || 1.0,
      });

      Object.entries(this.permanentUpgrades).forEach(([type, value]) => {
        console.log(`Applying v3.0 permanent upgrade: ${type} = ${value}`);

        switch (type) {
          case "health_max":
            this.player.maxHealth = value;
            this.player.health = value; // Start with full health
            console.log(
              `✅ Health set from permanent upgrades: ${this.player.maxHealth}`
            );
            break;
          case "stamina_max":
            this.player.maxStamina = value;
            this.player.stamina = value; // Start with full stamina
            console.log(
              `✅ Stamina set from permanent upgrades: ${this.player.maxStamina}`
            );
            break;
          case "movement_speed":
            this.player.speedMultiplier = value;
            console.log(
              `✅ Movement speed set from permanent upgrades: ${(
                value * 100
              ).toFixed(1)}%`
            );
            break;
        }
      });

      // Log player FINAL stats AFTER applying upgrades
      console.log("Player FINAL stats after permanent upgrades:", {
        finalHealth: `${this.player.health}/${this.player.maxHealth}`,
        finalStamina: `${this.player.stamina}/${this.player.maxStamina}`,
        finalSpeed: `${(this.player.speedMultiplier * 100).toFixed(1)}%`,
      });

      console.log(
        "✅ All v3.0 permanent upgrades applied during player initialization"
      );
      console.log("=== PERMANENT UPGRADES COMPLETE ===");
    } else {
      console.log("⚠️ No permanent upgrades found to apply");
      console.log("Permanent upgrades data:", this.permanentUpgrades);
      console.log("Available keys:", Object.keys(this.permanentUpgrades || {}));
    }

    // NEW: Critical weapon sync after player creation and save state loading
    if (this.managersInitialized && window.weaponUpgradeManager) {
      // Force reload weapon levels after player is created
      setTimeout(() => {
        if (
          this.player &&
          typeof this.player.forceReloadWeaponLevels === "function"
        ) {
          this.player.forceReloadWeaponLevels();
          console.log("Post-initialization weapon sync completed");

          // Also sync the shop to show correct levels
          if (
            this.globalShop &&
            typeof this.globalShop.syncWithWeaponUpgradeManager === "function"
          ) {
            this.globalShop.syncWithWeaponUpgradeManager();
            console.log("Shop weapon levels synchronized");
          }
        }
      }, 100); // Small delay to ensure everything is properly initialized
    }

    // Apply saved state to player if available (override any defaults)
    if (savedState) {
      this.player.health = savedState.health || this.player.maxHealth;
      this.player.gold = savedState.gold || 0;

      console.log("Saved state applied to player:", {
        health: this.player.health,
        gold: this.player.gold,
        position: `(${startPos.x}, ${startPos.y})`,
      });
    }

    // REMOVED: Individual loadPermanentUpgrades call since it's now handled above in v3.0 style
    // The permanent upgrades are already applied from this.permanentUpgrades

    // Configure shop with current game data
    this.configureShopGameData();

    // Now we can safely check currentRoom properties
    if (
      this.currentRoom &&
      this.currentRoom.roomType === "shop" &&
      this.currentRoom.objects.shop
    ) {
      this.currentRoom.objects.shop = this.globalShop;
      this.currentRoom.objects.shop.setOnCloseCallback(() => {
        this.currentRoom.shopCanBeOpened = false;
      });
    }

    // Initialize enemies array from current room
    this.enemies = this.currentRoom ? this.currentRoom.objects.enemies : [];

    // NEW v3.0: Log final player state after complete initialization
    console.log("Player v3.0 initialization complete:", {
      runNumber: this.runNumber,
      health: `${this.player.health}/${this.player.maxHealth}`,
      stamina: `${this.player.stamina}/${this.player.maxStamina}`,
      speedMultiplier: this.player.speedMultiplier || 1.0,
      weaponLevels: this.weaponLevels,
      gold: this.player.gold,
      hasSaveState: this.hasSaveState,
      permanentUpgradesApplied: Object.keys(this.permanentUpgrades || {})
        .length,
    });
  }

  /**
   * Configure shop with current game data for backend integration
   * Should be called whenever game data changes (room transitions, etc.)
   */
  configureShopGameData() {
    try {
      // ENHANCED: Debug localStorage values before parsing
      const userIdRaw = localStorage.getItem("currentUserId");
      const runIdRaw = localStorage.getItem("currentRunId");
      const sessionIdRaw = localStorage.getItem("currentSessionId");

      console.log("SHOP CONFIG DEBUG - Raw localStorage values:", {
        userIdRaw,
        runIdRaw,
        sessionIdRaw,
        runIdType: typeof runIdRaw,
        runIdLength: runIdRaw ? runIdRaw.length : "N/A",
      });

      const gameData = {
        userId: parseInt(userIdRaw),
        runId: parseInt(runIdRaw),
        roomId: this.floorGenerator.getCurrentRoomId(),
      };

      // ENHANCED: Debug parsed values
      console.log("SHOP CONFIG DEBUG - Parsed values:", {
        userIdParsed: gameData.userId,
        runIdParsed: gameData.runId,
        roomIdParsed: gameData.roomId,
        userIdIsNaN: isNaN(gameData.userId),
        runIdIsNaN: isNaN(gameData.runId),
        roomIdIsNaN: isNaN(gameData.roomId),
      });

      // ENHANCED: Try to recover runId if it's missing
      if (isNaN(gameData.runId) || !runIdRaw) {
        console.warn(
          "SHOP CONFIG - runId is missing or invalid, attempting recovery..."
        );

        // Try to get runId from other sources
        const testMode = localStorage.getItem("testMode") === "true";

        if (testMode) {
          console.log("Test mode active - using fallback runId");
          gameData.runId = 999; // Fallback for test mode
        } else {
          // Try to create a new run if user exists
          if (gameData.userId && !isNaN(gameData.userId)) {
            console.log("Attempting emergency run creation...");
            this.createEmergencyRun(gameData.userId);
            gameData.runId = 0; // Temporary placeholder
          } else {
            console.error("Cannot recover runId - no valid userId");
            gameData.runId = 0; // Fallback
          }
        }
      }

      // Validate that we have the required data
      if (
        gameData.userId &&
        gameData.runId &&
        gameData.roomId &&
        !isNaN(gameData.userId) &&
        !isNaN(gameData.runId) &&
        !isNaN(gameData.roomId)
      ) {
        this.globalShop.setGameData(gameData);
        console.log("Shop configured with valid game data:", gameData);
      } else {
        console.warn(
          "Shop game data incomplete, backend registration may fail:",
          gameData
        );
        console.warn("  Missing data details:", {
          hasUserId: !!gameData.userId && !isNaN(gameData.userId),
          hasRunId: !!gameData.runId && !isNaN(gameData.runId),
          hasRoomId: !!gameData.roomId && !isNaN(gameData.roomId),
        });

        // Still set the data - Shop.js will handle missing data gracefully
        this.globalShop.setGameData(gameData);
      }
    } catch (error) {
      console.error("Failed to configure shop game data:", error);
      console.error("  Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * EMERGENCY: Create a new run when runId is lost during gameplay
   */
  async createEmergencyRun(userId) {
    try {
      console.log("EMERGENCY RUN CREATION for userId:", userId);

      const { createRun } = await import("../../utils/api.js");
      const runResult = await createRun(userId);

      if (runResult.success) {
        localStorage.setItem("currentRunId", runResult.runId);
        console.log("Emergency run created successfully:", runResult.runId);
        return runResult.runId;
      } else {
        throw new Error(runResult.message || "Failed to create emergency run");
      }
    } catch (error) {
      console.error("Emergency run creation failed:", error);
      // Enable test mode as fallback
      localStorage.setItem("testMode", "true");
      console.log("Test mode enabled as fallback");
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
      ctx.fillText(
        "Loading game...",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
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
      const boss = room.objects.enemies.find((e) => e instanceof Boss);
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
    const currentRun =
      this.runNumber || this.floorGenerator.getCurrentRun() || 1; // Fallback to 1
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

    // Draw health text (HP actual/máximo)
    const currentHP = Math.round(this.player.health);
    const maxHP = Math.round(this.player.maxHealth);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `HP ${currentHP}/${maxHP}`,
      40 + barWidth / 2,
      40 + barHeight / 2
    );
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
      const messageLines = this.transitionZoneActivatedMessage.split("\n");
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
      const userId = parseInt(localStorage.getItem("currentUserId"));
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
      console.log(
        "Re-initializing managers to load updated permanent upgrades..."
      );
      await this.initializeManagers();
      console.log("Managers re-initialized with fresh data from database");

      // NEW v3.0: Sync frontend run number after death reset
      console.log("Syncing frontend run number after death...");
      this.runNumber = this.floorGenerator.getCurrentRun();
      console.log(`Frontend run number updated to: ${this.runNumber}`);

      // NEW v3.0: Update localStorage with new runId after death
      try {
        const newRunId = localStorage.getItem("currentRunId");
        if (newRunId) {
          console.log(`localStorage runId after death: ${newRunId}`);

          // Update weaponUpgradeManager with new runId (already done in initializeManagers)
          console.log(
            "WeaponUpgradeManager already initialized with new runId"
          );
        }
      } catch (error) {
        console.error("Failed to sync runId after death:", error);
      }

      // Reinitialize objects - NOW with fresh permanent upgrades data
      this.initObjects();

      console.log(
        "Game reset completed successfully with updated permanent upgrades"
      );
    } catch (error) {
      console.error("Failed to reset game after death:", error);

      // Fallback: reset locally even if backend calls fail
      this.resetRunStats();

      // FIX: Reset all boss-related flags in fallback using helper method
      this.resetBossFlags();

      await this.floorGenerator.resetToInitialState();

      // NEW v3.0: Sync run number even in fallback
      this.runNumber = this.floorGenerator.getCurrentRun();
      console.log(
        `Fallback: Frontend run number updated to: ${this.runNumber}`
      );

      // CRITICAL: Try to re-initialize managers even in fallback
      try {
        console.log("Attempting to re-initialize managers in fallback mode...");
        await this.initializeManagers();
        console.log("Managers re-initialized successfully in fallback");
      } catch (managerError) {
        console.error(
          "Failed to re-initialize managers in fallback:",
          managerError
        );
        console.log("Using existing permanent upgrades data as final fallback");
      }

      this.initObjects();
      console.log("Game reset completed with local fallback");
    }
  }

  async handleRoomTransition(direction) {
    // SIMPLIFIED: Single validation check
    if (!this.currentRoom.canTransition()) {
      return;
    }

    // SIMPLIFIED: Basic lock to prevent double transitions
    if (this.isTransitioning) {
      return;
    }

    try {
      this.isTransitioning = true;
      console.log("Starting room transition...");

      // Determine if this is a boss room
      const wasInBossRoom = this.floorGenerator.isBossRoom();

      if (wasInBossRoom) {
        // BOSS ROOM: Advance to next floor
        console.log("🏆 Boss defeated! Advancing to next floor...");

        // Reset boss flags immediately
        this.resetBossFlags();

        // Advance to next floor immediately
        await this.floorGenerator.nextFloor();

        console.log(
          `📍 Advanced to Floor ${this.floorGenerator.getCurrentFloor()}, Room 1`
        );

        // Save after boss completion (can be async since transition is visually complete)
        this.saveCurrentGameState().catch((error) => {
          console.error("Failed to auto-save after boss completion:", error);
        });
      } else {
        // NORMAL ROOM: Advance to next room
        if (!this.floorGenerator.nextRoom()) {
          console.warn("Cannot advance to next room");
          return;
        }

        console.log(
          `📍 Advanced to Room ${this.floorGenerator.getCurrentRoomIndex() + 1}`
        );
      }

      // Update game state IMMEDIATELY for instant transition
      this.currentRoom = this.floorGenerator.getCurrentRoom();
      this.currentRoom.resetBossState();

      // Update player position IMMEDIATELY
      this.player.setCurrentRoom(this.currentRoom);
      this.player.position = this.currentRoom.getPlayerStartPosition();
      this.player.velocity = new Vec(0, 0);
      this.player.keys = [];

      // Update enemies IMMEDIATELY
      this.enemies = this.currentRoom.objects.enemies;

      // Update shop data IMMEDIATELY
      this.configureShopGameData();

      console.log("✅ Room transition completed successfully");

      // Save game state AFTER visual transition is complete (non-blocking)
      if (!wasInBossRoom) {
        // For normal rooms, save asynchronously without blocking
        this.saveCurrentGameState().catch((error) => {
          console.error("Failed to auto-save after room transition:", error);
        });
      }
    } catch (error) {
      console.error("❌ Room transition failed:", error);

      // Simple recovery: try to restore current room state
      try {
        this.currentRoom = this.floorGenerator.getCurrentRoom();
        if (this.currentRoom && this.player) {
          this.player.setCurrentRoom(this.currentRoom);
          this.enemies = this.currentRoom.objects.enemies;
        }
      } catch (recoveryError) {
        console.error(
          "Failed to recover from transition error:",
          recoveryError
        );
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  // SIMPLIFIED: Non-blocking transition starter
  startRoomTransition(direction) {
    this.handleRoomTransition(direction).catch((error) => {
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
      if (
        this.currentRoom.isPlayerAtRightEdge(this.player) &&
        !this.isTransitioning
      ) {
        this.startRoomTransition("right");
      }

      return;
    }

    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      return;
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // SIMPLIFIED: Basic enemy synchronization
    if (this.enemies !== this.currentRoom.objects.enemies) {
      this.enemies = this.currentRoom.objects.enemies;
    }

    // Show boss defeat message
    if (this.bossJustDefeated && this.floorGenerator.isBossRoom()) {
      this.transitionZoneActivatedMessage =
        "BOSS DEFEATED! \nMove to the right edge to advance to next floor!";
      this.transitionZoneMessageTimer = 3000;
      this.bossJustDefeated = false;
    }

    // Update transition zone message timer
    if (this.transitionZoneMessageTimer > 0) {
      this.transitionZoneMessageTimer -= deltaTime;
      if (this.transitionZoneMessageTimer <= 0) {
        this.transitionZoneActivatedMessage = null;
      }
    }

    // SIMPLIFIED: Room transition check - only 3 conditions
    if (
      this.currentRoom.isPlayerAtRightEdge(this.player) &&
      !this.isTransitioning &&
      this.currentRoom.canTransition()
    ) {
      this.startRoomTransition("right");
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
      this.saveCurrentGameState().catch((error) => {
        console.error("Failed to auto-save game state:", error);
      });
      this.lastAutoSave = currentTime;
    }
  }

  // Event listeners
  createEventListeners() {
    addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      // NEW: Handle pause key (P) - always check first
      if (key === "p") {
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
    console.log(
      `Gold spent: +${amount}, Total spent this run: ${this.runStats.goldSpent}`
    );
  }

  trackKill() {
    this.runStats.totalKills++;
    console.log(
      `Enemy killed! Total kills this run: ${this.runStats.totalKills}`
    );

    // NOTE: Enemy kill registration is handled by Enemy.js to avoid duplicates
    // Each enemy instance registers its own kill with proper type mapping
  }

  resetRunStats() {
    console.log("Resetting run statistics...");
    this.runStats = {
      goldSpent: 0,
      totalKills: 0,
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
    };
  }

  // 🎮 NEW: Save current game state using saveStateManager
  async saveCurrentState() {
    // 🎮 NEW: Delegate to saveStateManager
    return await this.saveCurrentGameState();
  }

  // 🎮 NEW: Load saved state using saveStateManager
  async loadSavedState() {
    try {
      // Get required data from localStorage
      const userId = localStorage.getItem("currentUserId");
      const sessionId = localStorage.getItem("currentSessionId");
      const runId = localStorage.getItem("currentRunId");
      const testMode = localStorage.getItem("testMode") === "true";

      // Validate required data exists
      if (!userId || !sessionId || !runId) {
        if (testMode) {
          console.log("Load state skipped: Running in test mode");
        } else {
          console.warn(
            "Load state skipped: Missing session data. Starting fresh game.",
            {
              userId: !!userId,
              sessionId: !!sessionId,
              runId: !!runId,
            }
          );
        }
        return false;
      }

      console.log("Session data complete - attempting to load saved state:", {
        userId,
        sessionId,
        runId,
      });

      // Use saveStateManager to load saved state
      try {
        const saveState = await saveStateManager.loadSaveState(
          parseInt(userId)
        );

        if (saveState) {
          console.log("Save state found - restoring game position:", {
            floor: saveState.floor || 1,
            room: saveState.roomId,
            gold: saveState.gold,
            health: saveState.currentHp,
          });

          // Store save state for use in initObjects
          this.savedStateData = {
            hasSaveState: true,
            floor:
              saveState.floor || this.calculateFloorFromRoom(saveState.roomId),
            room: saveState.roomId,
            roomId: saveState.roomId,
            gold: saveState.gold,
            currentHealth: saveState.currentHp,
          };
          return true;
        } else {
          console.log("No save state found - starting fresh game");
          return false;
        }
      } catch (error) {
        console.warn("Failed to load save state from backend:", error);
        console.log("Starting fresh game due to save state load failure");
        return false;
      }
    } catch (error) {
      console.error("Failed to load session data:", error);
      return false;
    }
  }

  // NEW: Create pause system
  createPauseSystem() {
    // Create pause overlay HTML
    this.createPauseOverlay();

    // Will add pause event listener in createEventListeners method
    console.log("Pause system initialized");
  }

  //  NEW: Create pause overlay DOM element
  createPauseOverlay() {
    if (this.pauseOverlay) return; // Already exists

    const overlay = document.createElement("div");
    overlay.id = "pauseOverlay";
    overlay.className = "pause-overlay hidden";

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

  // NEW: Setup event listeners for pause overlay
  setupPauseEventListeners() {
    if (!this.pauseOverlay) return;

    // Tab switching
    const tabButtons = this.pauseOverlay.querySelectorAll(".pause-tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchPauseTab(e.target.dataset.tab);
      });
    });

    // Resume button
    const resumeBtn = this.pauseOverlay.querySelector("#resumeBtn");
    resumeBtn?.addEventListener("click", () => {
      this.togglePause();
    });

    // Logout button
    const logoutBtn = this.pauseOverlay.querySelector("#pauseLogoutBtn");
    logoutBtn?.addEventListener("click", () => {
      this.handlePauseLogout();
    });

    // Settings
    this.setupSettingsEventListeners();
  }

  // NEW: Setup settings event listeners
  setupSettingsEventListeners() {
    // Volume sliders
    const musicSlider = this.pauseOverlay.querySelector("#musicVolume");
    const sfxSlider = this.pauseOverlay.querySelector("#sfxVolume");
    const musicValue = this.pauseOverlay.querySelector("#musicVolumeValue");
    const sfxValue = this.pauseOverlay.querySelector("#sfxVolumeValue");

    musicSlider?.addEventListener("input", (e) => {
      musicValue.textContent = e.target.value + "%";
    });

    sfxSlider?.addEventListener("input", (e) => {
      sfxValue.textContent = e.target.value + "%";
    });

    // Save settings button
    const saveBtn = this.pauseOverlay.querySelector("#saveSettings");
    saveBtn?.addEventListener("click", () => {
      this.saveGameSettings();
    });
  }

  // NEW: Switch pause menu tab
  switchPauseTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    const tabButtons = this.pauseOverlay.querySelectorAll(".pause-tab-btn");
    tabButtons.forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update content
    const contents = this.pauseOverlay.querySelectorAll(".tab-content");
    contents.forEach((content) => {
      if (content.id === `${tabName}-content`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    // Load stats if stats tab
    if (tabName === "stats") {
      this.loadStatsData();
    }
  }

  // NEW: Load stats data into pause menu
  async loadStatsData() {
    const statsContainer = this.pauseOverlay.querySelector("#stats-data");
    if (!statsContainer) return;

    try {
      // Show loading state
      statsContainer.innerHTML =
        '<div class="loading">Loading statistics...</div>';

      // Get current run stats (local)
      // FIXED v3.0: Use run number from initialization data with proper fallback
      const currentRun =
        this.runNumber || this.floorGenerator.getCurrentRun() || 1; // Fallback to 1
      const currentFloor = this.floorGenerator.getCurrentFloor();
      const currentRoom = this.floorGenerator.getCurrentRoomIndex() + 1;
      const totalRooms = this.floorGenerator.getTotalRooms();

      const runStats = this.getRunStats();
      const shopUpgrades = this.globalShop.getUpgradeCounts();

      // Get user ID for API calls
      const userId = localStorage.getItem("currentUserId");
      const testMode = localStorage.getItem("testMode") === "true";

      let historicalStats = null;
      let currentRunStatsAPI = null;

      // Try to fetch from API if not in test mode
      if (userId && !testMode) {
        try {
          // Import API functions dynamically
          const { getCompletePlayerStats, getCurrentRunStats } = await import(
            "../../utils/api.js"
          );

          // Fetch both historical and current run stats
          const [historical, currentAPI] = await Promise.allSettled([
            getCompletePlayerStats(parseInt(userId)),
            getCurrentRunStats(parseInt(userId)),
          ]);

          console.log("API Stats Results:", {
            historical: {
              status: historical.status,
              hasValue: historical.status === "fulfilled" && historical.value,
              data:
                historical.status === "fulfilled"
                  ? historical.value
                  : historical.reason,
            },
            currentAPI: {
              status: currentAPI.status,
              hasValue: currentAPI.status === "fulfilled" && currentAPI.value,
              data:
                currentAPI.status === "fulfilled"
                  ? currentAPI.value
                  : currentAPI.reason,
            },
          });

          if (historical.status === "fulfilled" && historical.value) {
            historicalStats = historical.value;
            console.log(
              " Historical stats loaded successfully:",
              historicalStats
            );
          } else {
            console.warn(
              " Failed to load historical stats:",
              historical.reason
            );
          }

          if (currentAPI.status === "fulfilled" && currentAPI.value) {
            currentRunStatsAPI = currentAPI.value;
            console.log(
              " Current run stats loaded successfully:",
              currentRunStatsAPI
            );
          } else {
            console.warn(
              " Failed to load current run stats:",
              currentAPI.reason
            );
          }
        } catch (error) {
          console.warn("Failed to fetch stats from API:", error);
        }
      }

      // Build stats HTML
      let statsHTML = `
        <div class="stats-section">
          <h4>Current Run</h4>
          <div class="stat-item">Run #: <span>${currentRun}</span></div>
          <div class="stat-item">Position: <span>Floor ${currentFloor}, Room ${currentRoom}/${totalRooms}</span></div>
          <div class="stat-item">Gold: <span>${
            this.player ? this.player.gold : 0
          }</span></div>
          <div class="stat-item">HP: <span>${
            this.player ? this.player.health : 0
          }/${this.player ? this.player.maxHealth : 100}</span></div>
          <div class="stat-item">Stamina: <span>${
            this.player ? this.player.stamina : 0
          }/${this.player ? this.player.maxStamina : 100}</span></div>
          <div class="stat-item">Kills this run: <span>${
            runStats.totalKills
          }</span></div>
          <div class="stat-item">Gold spent: <span>${
            runStats.goldSpent
          }</span></div>
          <div class="stat-item">Weapon upgrades: <span>Melee +${
            shopUpgrades.melee
          }, Ranged +${shopUpgrades.ranged}</span></div>
        </div>
      `;

      // Add historical stats if available
      if (
        historicalStats &&
        typeof historicalStats === "object" &&
        historicalStats.totalRuns !== undefined
      ) {
        console.log(" Rendering historical stats:", historicalStats);
        statsHTML += `
          <div class="stats-section">
            <h4> Player History</h4>
            <div class="stat-item">Total runs: <span>${historicalStats.totalRuns}</span></div>
            <div class="stat-item">Completed runs: <span>${historicalStats.completedRuns}</span></div>
            <div class="stat-item">Completion rate: <span>${historicalStats.completionRate}%</span></div>
            <div class="stat-item">Total kills: <span>${historicalStats.totalKills}</span></div>
            <div class="stat-item">Best run kills: <span>${historicalStats.bestRunKills}</span></div>
            <div class="stat-item">Max damage hit: <span>${historicalStats.maxDamageHit}</span></div>
            <div class="stat-item">Total gold earned: <span>${historicalStats.goldEarned}</span></div>
            <div class="stat-item">Total gold spent: <span>${historicalStats.goldSpent}</span></div>
            <div class="stat-item">Total playtime: <span>${historicalStats.playtimeFormatted}</span></div>
            <div class="stat-item">Total sessions: <span>${historicalStats.totalSessions}</span></div>
          </div>
        `;
      } else if (testMode) {
        console.log(" Test mode - showing test mode message");
        statsHTML += `
          <div class="stats-section">
            <h4> Player History</h4>
            <div class="stat-item">Test mode - Historical data not available</div>
          </div>
        `;
      } else {
        console.warn(" Unable to load historical data:", {
          hasHistoricalStats: !!historicalStats,
          historicalStatsType: typeof historicalStats,
          historicalStatsContent: historicalStats,
          userId: userId,
          testMode: testMode,
        });
        statsHTML += `
          <div class="stats-section">
            <h4> Player History</h4>
            <div class="stat-item">Unable to load historical data</div>
          </div>
        `;
      }

      statsContainer.innerHTML = statsHTML;
    } catch (error) {
      console.error("Error loading stats:", error);
      statsContainer.innerHTML =
        '<div class="error">Error loading statistics</div>';
    }
  }

  // NEW: Save game settings
  saveGameSettings() {
    const musicVolume = this.pauseOverlay.querySelector("#musicVolume").value;
    const sfxVolume = this.pauseOverlay.querySelector("#sfxVolume").value;
    const autoSave = this.pauseOverlay.querySelector("#autoSave").checked;

    // Save to localStorage for now (Phase 2 will add backend integration)
    localStorage.setItem(
      "gameSettings",
      JSON.stringify({
        musicVolume: parseInt(musicVolume),
        sfxVolume: parseInt(sfxVolume),
        autoSave: autoSave,
      })
    );

    console.log(" Game settings saved");

    // Show feedback
    const saveBtn = this.pauseOverlay.querySelector("#saveSettings");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved!";
    saveBtn.disabled = true;

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  }

  // NEW: Handle logout from pause menu
  async handlePauseLogout() {
    const confirmed = confirm(
      "Are you sure you want to logout? Any unsaved progress may be lost."
    );
    if (!confirmed) return;

    try {
      // Hide pause menu first
      this.hidePause();

      // Save current state before logout
      console.log("Saving state before logout...");
      await this.saveCurrentState();

      // Import enhanced logout function
      const { enhancedLogout } = await import("../../utils/api.js");

      // Get session data
      const sessionToken = localStorage.getItem("sessionToken");

      // Use centralized enhanced logout
      console.log("Using enhanced logout for complete session cleanup...");
      const logoutSuccess = await enhancedLogout(sessionToken);

      if (!logoutSuccess) {
        console.warn("Backend logout failed, but localStorage was cleared");
      }

      // Redirect to landing
      window.location.href = "landing.html";
    } catch (error) {
      console.error("Logout error:", error);

      // Force logout even if save/logout API fails
      console.log("Force logout with emergency localStorage cleanup...");
      const { clearSessionLocalStorage } = await import("../../utils/api.js");
      clearSessionLocalStorage();

      window.location.href = "landing.html";
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

    console.log(` Game ${this.isPaused ? "PAUSED" : "RESUMED"}`);
  }

  // NEW: Show pause overlay
  showPause() {
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.remove("hidden");
      // Load current stats
      if (this.activeTab === "stats") {
        this.loadStatsData();
      }
    }
  }

  // NEW: Hide pause overlay
  hidePause() {
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.add("hidden");
    }
  }

  // NEW: Async initialization method
  async initializeGameAsync() {
    try {
      console.log("Starting game initialization...");

      // CRITICAL FIX: Wait for managers to initialize FIRST
      await this.initializeManagers();
      console.log("Managers initialization complete");

      // Preload all background images
      console.log("Preloading background images...");
      await preloadBackgrounds();
      console.log("Background preloading complete");

      // THEN load saved state
      await this.loadSavedState()
        .then(() => {
          // FINALLY initialize objects with all data available
          this.initObjects();
        })
        .catch((error) => {
          console.error("Failed to load saved state, starting fresh:", error);
          this.initObjects(); // Fallback to fresh start
        });

      // Mark game as ready
      this.isReady = true;
      this.gameState = "playing";
      console.log("Game initialization complete - ready to start");

      // Call ready callback if set
      if (this.gameReadyCallback) {
        this.gameReadyCallback();
      }
    } catch (error) {
      console.error("Game initialization failed:", error);
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
    const userIdRaw = localStorage.getItem("currentUserId");
    const sessionIdRaw = localStorage.getItem("currentSessionId");
    const runIdRaw = localStorage.getItem("currentRunId");

    const roomId = this.floorGenerator?.getCurrentRoomId() || 1;

    // Parse values with validation
    const userId = parseInt(userIdRaw);
    const sessionId = parseInt(sessionIdRaw);
    const runId = parseInt(runIdRaw);

    // Only log warnings for NaN values (potential issues)
    if (isNaN(userId) && userIdRaw) {
      console.warn("⚠️ Invalid userId in localStorage:", userIdRaw);
    }
    if (isNaN(sessionId) && sessionIdRaw) {
      console.warn("⚠️ Invalid sessionId in localStorage:", sessionIdRaw);
    }
    if (isNaN(runId) && runIdRaw) {
      console.warn("⚠️ Invalid runId in localStorage:", runIdRaw);
    }

    const gameState = {
      userId: userId,
      sessionId: sessionId,
      runId: runId,
      floorId: this.calculateFloorFromRoom(roomId),
      roomId: roomId,
      currentHp: this.player?.health || 100,
      gold: this.player?.gold || 0,
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
      console.error("Failed to save current game state:", error);
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
      console.log("Loading permanent upgrades for player...");

      // Fetch permanent upgrades from backend
      const upgrades = await getPermanentUpgrades(userId);

      if (upgrades && upgrades.length > 0) {
        console.log("Permanent upgrades loaded successfully:", upgrades);

        // Apply upgrades to player
        upgrades.forEach((upgrade) => {
          this.player.applyUpgrade(upgrade);
        });

        console.log("Permanent upgrades applied to player");
      } else {
        console.log("No permanent upgrades found for player");
      }
    } catch (error) {
      console.error("Failed to load permanent upgrades v3.0:", error);

      // Fallback: Try to use locally stored permanent upgrades from initialization
      if (
        this.permanentUpgrades &&
        Object.keys(this.permanentUpgrades).length > 0
      ) {
        console.log(
          "Using fallback permanent upgrades from initialization data:",
          this.permanentUpgrades
        );

        // Apply fallback upgrades if available
        Object.entries(this.permanentUpgrades).forEach(([type, value]) => {
          console.log(`Applying fallback upgrade: ${type} = ${value}`);

          switch (type) {
            case "health_max":
              this.player.maxHealth = value;
              this.player.health = Math.min(
                this.player.health,
                this.player.maxHealth
              );
              break;
            case "stamina_max":
              this.player.maxStamina = value;
              this.player.stamina = Math.min(
                this.player.stamina,
                this.player.maxStamina
              );
              break;
            case "movement_speed":
              this.player.speedMultiplier = value;
              break;
          }
        });

        console.log("Fallback permanent upgrades applied successfully");
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
    const elapsed = this.transitionStartTime
      ? Date.now() - this.transitionStartTime
      : 0;
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
    if (this.transitionState === "error") {
      barColor = "#F44336"; // Red for error
    } else if (this.transitionState === "completing") {
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
    if (
      this.transitionState === "starting" ||
      this.transitionState === "in_progress"
    ) {
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
      case "starting":
        statusText = "Saving game state...";
        break;
      case "in_progress":
        statusText = "Loading next room...";
        break;
      case "completing":
        statusText = "Ready to continue!";
        break;
      case "error":
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
}
