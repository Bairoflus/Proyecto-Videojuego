// filepath: /Users/fest/repos/Proyecto-Videojuego/videogame/src/classes/game/Game.js
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Player } from "../entities/Player.js";
import { variables, keyDirections } from "../../config.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Shop } from "../entities/Shop.js";
import { Boss } from "../entities/Boss.js";
import {
  completeRun,
  createRun,
  registerEnemyKill,
  registerBossKill,
  getPermanentUpgrades,
} from "../../utils/api.js";
import { saveStateManager } from "../../utils/saveStateManager.js";
import { weaponUpgradeManager } from "../../utils/weaponUpgradeManager.js";
import { PermanentUpgradePopup } from "../ui/PermanentUpgradePopup.js";

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

    // NEW: Game ready state
    this.isReady = false;
    this.gameReadyCallback = null;

    // Auto-save timing with new saveStateManager
    this.lastAutoSave = Date.now();
    this.autoSaveInterval = 30000; // 30 seconds

    // FIX: Add room transition state management
    this.isTransitioning = false; // Flag to prevent multiple transitions
    this.transitionCooldown = 0; // Cooldown timer between transitions
    this.transitionCooldownTime = 500; // 500ms cooldown between transitions

    // FIX: Enemy synchronization management
    this.needsEnemySync = false; // Flag to force enemy array synchronization when needed

    // NEW: Pause system
    this.isPaused = false;
    this.pauseOverlay = null;
    this.activeTab = "controls"; // Default tab

    // NEW: Permanent upgrade popup system
    this.permanentUpgradePopup = null;

    // FIX: Track permanent upgrade popup state to prevent multiple shows
    this.bossUpgradeShown = false; // Flag to track if upgrade popup was shown for current boss

    // FIX: Track boss defeat for immediate transition zone activation
    this.bossJustDefeated = false; // Flag to track if boss was just defeated for immediate feedback
    this.transitionZoneActivatedMessage = null; // Message display for transition zone activation
    this.transitionZoneMessageTimer = 0; // Timer for transition zone message display

    // NEW: Track when room is just cleared for immediate transition check
    this.roomJustCleared = false; // Flag set by Room.js when all enemies are eliminated

    // Managers initialization status
    this.managersInitialized = false;
    this.managersInitializationResult = null;

    // Run statistics tracking
    this.runStats = {
      goldSpent: 0,
      totalKills: 0,
    };

    // Event logging state
    this.loggedBossEncounters = new Set(); // Track logged boss encounters to avoid duplicates

    // FIX: Now initialize game objects AFTER properties are set up
    this.globalShop = new Shop();
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.enemies = [];

    // NEW: Initialize pause system
    this.createPauseSystem();

    // Make managers globally available for other classes
    window.weaponUpgradeManager = weaponUpgradeManager;
    window.saveStateManager = saveStateManager;

    // FIXED: Initialize game asynchronously but signal when ready
    this.initializeGameAsync();

    window.game = this;

    if (variables.debug) {
      this.initializeDebugCommands();
    }

    // Initialize managers
    this.initializeManagers();
  }

  /**
   * NEW: Initialize all game managers with proper error handling
   * This is called during game initialization to setup backend integration
   */
  async initializeManagers() {
    try {
      console.log("Initializing Game Managers...");

      // Ensure run data exists BEFORE initializing managers
      await this.ensureRunDataExists();

      // Get session data for manager initialization
      const userId = parseInt(localStorage.getItem("currentUserId"));
      const runId = parseInt(localStorage.getItem("currentRunId"));

      // Initialize saveStateManager (load saved state if exists)
      const savedState = await saveStateManager.loadSaveState(userId);
      console.log(
        "SaveStateManager initialized:",
        savedState ? "(found saved state)" : "(no saved state)"
      );

      // Initialize weaponUpgradeManager
      await weaponUpgradeManager.initialize(userId, runId);
      console.log("WeaponUpgradeManager initialized");

      // IMPORTANT: Sync player weapon levels after weaponUpgradeManager is initialized
      if (
        this.player &&
        typeof this.player.forceReloadWeaponLevels === "function"
      ) {
        this.player.forceReloadWeaponLevels();
        console.log("Player weapon levels synchronized with manager");
      }

      // Create permanent upgrade popup
      this.permanentUpgradePopup = new PermanentUpgradePopup();
      console.log("PermanentUpgradePopup created");

      this.managersInitialized = true;
      this.managersInitializationResult = {
        success: true,
        saveStateManager: true,
        weaponUpgradeManager: true,
        hasSavedState: !!savedState,
      };

      console.log("All managers initialized successfully");

      // Enable debug commands
      this.initializeSessionDebugCommands();
    } catch (error) {
      console.error("Failed to initialize managers:", error);
      this.managersInitializationResult = {
        success: false,
        error: error.message,
      };

      // Enable test mode on manager failure
      localStorage.setItem("testMode", "true");
      console.warn("Test mode enabled due to manager initialization failure");
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
        enableTestMode: () => {
          localStorage.setItem("testMode", "true");
          console.log("Test mode enabled - warnings will be suppressed");
        },
        disableTestMode: () => {
          localStorage.removeItem("testMode");
          console.log("Test mode disabled - full backend integration active");
        },
        clear: () => {
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("currentSessionId");
          localStorage.removeItem("currentRunId");
          localStorage.removeItem("testMode");
          console.log("🗑️ All session data cleared");
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
        managers: {
          saveState: () => saveStateManager.getCurrentSaveState(),
          weaponUpgrade: () => weaponUpgradeManager.getStatusSummary(),
          save: () => this.saveCurrentGameState(),
          load: async () => {
            const userId = parseInt(localStorage.getItem("currentUserId"));
            return await saveStateManager.loadSaveState(userId);
          },
          weaponLevels: () => weaponUpgradeManager.getAllWeaponsInfo(),
        },
        // ENHANCED: Room transition debugging commands
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
              roomId: fg.validateRoomMapping(),
              roomType: fg.getCurrentRoomType(),
              canTransition: room ? room.canTransition() : "N/A",
              isBossRoom: fg.isBossRoom(),
              bossDefeated: room ? room.bossDefeated : "N/A",
              enemies: room ? room.objects.enemies.length : "N/A",
              aliveEnemies: room
                ? room.objects.enemies.filter((e) => e.state !== "dead").length
                : "N/A",
              isTransitioning: window.game.isTransitioning,
              transitionCooldown: window.game.transitionCooldown,
            };

            console.log("🎯 CURRENT ROOM STATE:");
            console.table(data);
            return data;
          },
          validate: () => {
            if (!window.game || !window.game.floorGenerator) {
              console.error("❌ Game or FloorGenerator not found");
              return false;
            }

            try {
              const fg = window.game.floorGenerator;
              const mappedId = fg.getCurrentRoomId();
              const calculatedId = fg.getExpectedRoomId();
              const validatedId = fg.validateRoomMapping();

              const data = {
                mappedRoomId: mappedId,
                calculatedRoomId: calculatedId,
                validatedRoomId: validatedId,
                consistent:
                  mappedId === calculatedId && calculatedId === validatedId,
                floor: fg.getCurrentFloor(),
                roomIndex: fg.getCurrentRoomIndex(),
                roomType: fg.getCurrentRoomType(),
              };

              console.log("🗺️ ROOM MAPPING VALIDATION:");
              console.table(data);

              if (!data.consistent) {
                console.warn("⚠️ INCONSISTENT ROOM MAPPING DETECTED!");
              } else {
                console.log("✅ Room mapping is consistent");
              }

              return data;
            } catch (error) {
              console.error("❌ Room validation failed:", error);
              return false;
            }
          },
          forceTransition: () => {
            if (!window.game || !window.game.currentRoom) {
              console.error("❌ Game or current room not found");
              return false;
            }

            console.log("🔓 FORCING ROOM TRANSITION...");

            // Force boss room transition if in boss room
            if (window.game.currentRoom.roomType === "boss") {
              window.game.currentRoom.forceBossTransition();
              console.log("👑 Boss room transition forced");
            }

            // Force general transition
            window.game.isTransitioning = false;
            window.game.transitionCooldown = 0;

            // ENHANCED: Auto-fix for Floor 2, Room 4 and similar issues
            const currentFloor = window.game.floorGenerator.getCurrentFloor();
            const currentRoomIndex =
              window.game.floorGenerator.getCurrentRoomIndex();
            if (currentFloor === 2 && currentRoomIndex === 3) {
              console.log("🚨 FLOOR 2, ROOM 4 AUTO-FIX ACTIVATED");

              // Force kill all enemies
              window.game.enemies.forEach((enemy) => {
                if (enemy.state !== "dead") {
                  enemy.state = "dead";
                  console.log(`💀 Force killed: ${enemy.type}`);
                }
              });

              // Force room enemy cleanup
              window.game.currentRoom.objects.enemies =
                window.game.currentRoom.objects.enemies.filter(
                  (enemy) => enemy.state !== "dead"
                );

              // Force chest spawn
              if (
                window.game.currentRoom.isCombatRoom &&
                !window.game.currentRoom.chestSpawned
              ) {
                window.game.currentRoom.spawnChest();
                console.log("📦 Force spawned chest");
              }

              console.log("✅ Floor 2, Room 4 state corrected");
            }

            console.log(
              "✅ Transition locks cleared - try moving to right edge"
            );
            return true;
          },
          resetBoss: () => {
            if (!window.game) {
              console.error("❌ Game instance not found");
              return false;
            }

            // Reset all boss-related flags
            window.game.resetBossFlags();

            if (
              window.game.currentRoom &&
              window.game.currentRoom.roomType === "boss"
            ) {
              window.game.currentRoom.resetBossState();
              console.log("👑 Boss room state reset");
            }

            console.log("🔄 All boss flags reset");
            return true;
          },
          // NEW: Emergency reset command
          emergencyReset: () => {
            if (!window.game) {
              console.error("❌ Game instance not found");
              return false;
            }

            console.log("🚨 EMERGENCY RESET - Clearing all problematic flags");

            // Clear all transition-related flags
            window.game.isTransitioning = false;
            window.game.transitionCooldown = 0;
            window.game.transitionStartTime = null;
            window.game.roomJustCleared = false;
            window.game.bossJustDefeated = false;

            // Clear room transition logging throttle
            if (window.game.currentRoom) {
              window.game.currentRoom.lastCombatCanTransition = undefined;
              window.game.currentRoom.lastBossCanTransition = undefined;
            }

            console.log("✅ Emergency reset complete - All flags cleared");
            console.log("💡 Try moving to the right edge now");

            return true;
          },
          syncState: () => {
            if (!window.game || !saveStateManager) {
              console.error("❌ Game or SaveStateManager not found");
              return false;
            }

            try {
              const currentState = window.game.getCurrentGameState();
              const isValid =
                saveStateManager.validateGameStateSync(currentState);

              console.log("🔄 STATE SYNCHRONIZATION CHECK:");
              console.log("Current game state:", currentState);
              console.log("State is synchronized:", isValid);

              if (!isValid) {
                console.warn("⚠️ State synchronization issues detected!");
                console.log(
                  "💡 Try: gameSessionDebug.room.forceTransition() or restart the game"
                );
              }

              return isValid;
            } catch (error) {
              console.error("❌ State sync check failed:", error);
              return false;
            }
          },
        },
      };

      console.log("Session debug commands available (run in console):");
      console.log("  gameSessionDebug.check() - Check current session data");
      console.log("  gameSessionDebug.createRun() - Manually create run");
      console.log("  gameSessionDebug.fix() - Auto-fix session issues");
      console.log(
        "  gameSessionDebug.managers.saveState() - Check save state manager"
      );
      console.log(
        "  gameSessionDebug.managers.weaponUpgrade() - Check weapon upgrade manager"
      );
      console.log("");
      console.log("🎯 Room transition debugging commands:");
      console.log(
        "  gameSessionDebug.room.current() - Show current room state"
      );
      console.log(
        "  gameSessionDebug.room.validate() - Validate room mapping consistency"
      );
      console.log(
        "  gameSessionDebug.room.forceTransition() - Force enable room transition"
      );
      console.log(
        "  gameSessionDebug.room.resetBoss() - Reset boss room flags"
      );
      console.log(
        "  gameSessionDebug.room.emergencyReset() - Emergency reset all transition flags"
      );
      console.log(
        "  gameSessionDebug.room.syncState() - Check state synchronization"
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

    // Apply saved state to player if available
    if (savedState) {
      this.player.health = savedState.health || this.player.maxHealth;
      this.player.gold = savedState.gold || 0;

      console.log("Saved state applied to player:", {
        health: this.player.health,
        gold: this.player.gold,
        position: `(${startPos.x}, ${startPos.y})`,
      });
    }

    // NEW: Load and apply permanent upgrades after player creation
    if (this.managersInitialized) {
      const userId = parseInt(localStorage.getItem("currentUserId"));
      if (userId) {
        this.loadPermanentUpgrades(userId).catch((error) => {
          console.error(
            "Failed to load permanent upgrades during initialization:",
            error
          );
        });
      }
    }

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

      // Reinitialize objects
      this.initObjects();

      console.log("Game reset completed successfully");
    } catch (error) {
      console.error("Failed to reset game after death:", error);

      // Fallback: reset locally even if backend calls fail
      this.resetRunStats();

      // FIX: Reset all boss-related flags in fallback using helper method
      this.resetBossFlags();

      await this.floorGenerator.resetToInitialState();
      this.initObjects();
      console.log("Game reset completed with local fallback");
    }
  }

  async handleRoomTransition(direction) {
    // ENHANCED: Check if we can advance with better validation
    if (!this.currentRoom.canTransition()) {
      console.log("Cannot advance: Room transition not allowed");
      console.log(
        `  Room type: ${this.currentRoom.roomType}, Combat: ${this.currentRoom.isCombatRoom}`
      );

      // ENHANCED: Special logging for Floor 2, Room 4 issue diagnosis
      const currentFloor = this.floorGenerator.getCurrentFloor();
      const currentRoomIndex = this.floorGenerator.getCurrentRoomIndex();
      if (currentFloor === 2 && currentRoomIndex === 3) {
        // Room 4 (index 3)
        console.log("FLOOR 2, ROOM 4 DETECTED - DIAGNOSTIC MODE:");
        console.log(`  - Current enemies: ${this.enemies.length}`);
        console.log(
          `  - Enemy details:`,
          this.enemies.map((e) => ({
            type: e.type,
            state: e.state,
            health: e.health,
            position: `(${Math.round(e.position.x)}, ${Math.round(
              e.position.y
            )})`,
          }))
        );
        console.log(
          `  - Room can transition: ${this.currentRoom.canTransition()}`
        );
        console.log(
          `  - Room objects enemies: ${this.currentRoom.objects.enemies.length}`
        );
        console.log(`  - Chest spawned: ${this.currentRoom.chestSpawned}`);
        console.log(
          `  - Player position: (${Math.round(
            this.player.position.x
          )}, ${Math.round(this.player.position.y)})`
        );
        console.log(
          `  - Player at right edge: ${this.currentRoom.isPlayerAtRightEdge(
            this.player
          )}`
        );
        console.log(`  - Transition cooldown: ${this.transitionCooldown}`);
        console.log(`  - Is transitioning: ${this.isTransitioning}`);

        // Force diagnostic info
        const aliveEnemies = this.enemies.filter(
          (enemy) => enemy.state !== "dead"
        );
        const deadEnemies = this.enemies.filter(
          (enemy) => enemy.state === "dead"
        );
        console.log(
          `  - Alive enemies: ${aliveEnemies.length}`,
          aliveEnemies.map((e) => e.type)
        );
        console.log(
          `  - Dead enemies: ${deadEnemies.length}`,
          deadEnemies.map((e) => e.type)
        );
      }

      if (this.currentRoom.isCombatRoom) {
        const aliveEnemies = this.enemies.filter(
          (enemy) => enemy.state !== "dead"
        );
        console.log(`  ${aliveEnemies.length} enemies still alive`);
      }
      return;
    }

    // ENHANCED: Additional validation for combat rooms
    if (this.currentRoom.isCombatRoom) {
      const aliveEnemies = this.enemies.filter(
        (enemy) => enemy.state !== "dead"
      );
      if (aliveEnemies.length > 0) {
        console.log("Cannot advance: Enemies still alive in combat room");
        console.log(
          `  Alive enemies: ${aliveEnemies
            .map((e) => e.type || "unknown")
            .join(", ")}`
        );
        return;
      }
    }

    try {
      // FIX: Lock transitions immediately to prevent race conditions
      this.isTransitioning = true;
      console.log("ROOM TRANSITION LOCKED");

      // DETAILED LOGGING before transition
      const beforeIndex = this.floorGenerator.getCurrentRoomIndex();
      const beforeFloor = this.floorGenerator.getCurrentFloor();
      const wasInBossRoom = this.floorGenerator.isBossRoom();

      console.log(
        `ROOM TRANSITION ATTEMPT from Floor ${beforeFloor}, Room ${
          beforeIndex + 1
        } (Boss: ${wasInBossRoom})`
      );

      // BOSS ROOM TRANSITION LOGIC
      if (wasInBossRoom) {
        console.log("BOSS ROOM - Proceeding to next floor");

        // Auto-save after boss completion
        console.log(`Auto-saving after boss completion...`);
        await this.saveCurrentGameState();

        // ENHANCED: Reset boss flags before floor transition
        this.resetBossFlags();
        console.log("Boss flags reset before floor transition");

        // Proceed to next floor
        await this.floorGenerator.nextFloor();

        this.currentRoom = this.floorGenerator.getCurrentRoom();

        if (this.currentRoom) {
          // ENHANCED: Reset boss state for new floor's boss room
          this.currentRoom.resetBossState();

          this.player.setCurrentRoom(this.currentRoom);
          this.player.position = this.currentRoom.getPlayerStartPosition();
          this.player.velocity = new Vec(0, 0);
          this.player.keys = [];
          this.enemies = this.currentRoom.objects.enemies;

          console.log(
            `FLOOR TRANSITION SUCCESS: Now on Floor ${this.floorGenerator.getCurrentFloor()}, Room ${
              this.floorGenerator.getCurrentRoomIndex() + 1
            }`
          );

          // Update shop gameData with new room information
          this.configureShopGameData();
        }
      } else {
        // NORMAL ROOM TRANSITION (not boss room, forward only)
        console.log("🏃 NORMAL ROOM TRANSITION - Moving forward");

        if (!this.floorGenerator.nextRoom()) {
          console.log(
            "Room transition FAILED - Could not advance to next room"
          );
          return;
        }

        // DETAILED LOGGING after normal room transition
        const afterIndex = this.floorGenerator.getCurrentRoomIndex();
        const afterFloor = this.floorGenerator.getCurrentFloor();

        console.log(`ROOM TRANSITION SUCCESS:`, {
          to: `Floor ${afterFloor}, Room ${afterIndex + 1}`,
          indexChanged: beforeIndex !== afterIndex,
          floorChanged: beforeFloor !== afterFloor,
        });

        // ENHANCED: Reset boss upgrade flag when transitioning to new floor or leaving boss room
        if (beforeFloor !== afterFloor || wasInBossRoom) {
          this.resetBossFlags();
          console.log("Boss flags reset for new floor/room transition");
        }

        this.currentRoom = this.floorGenerator.getCurrentRoom();
        if (this.currentRoom) {
          // ENHANCED: Reset boss state if entering a new boss room
          if (this.currentRoom.roomType === "boss") {
            this.currentRoom.resetBossState();
            console.log("Entering boss room - state reset");
          }

          this.player.setCurrentRoom(this.currentRoom);
          this.player.position = this.currentRoom.getPlayerStartPosition();
          this.player.velocity = new Vec(0, 0);
          this.player.keys = [];
          this.enemies = this.currentRoom.objects.enemies;

          // ENEMY STATE LOGGING
          console.log(
            `NEW ROOM STATE: ${
              this.enemies.length
            } enemies, room can transition: ${this.currentRoom.canTransition()}`
          );

          // ENHANCED: Debug localStorage before configuring shop
          console.log("PRE-SHOP CONFIG DEBUG - localStorage state:", {
            userId: localStorage.getItem("currentUserId"),
            runId: localStorage.getItem("currentRunId"),
            sessionId: localStorage.getItem("currentSessionId"),
            testMode: localStorage.getItem("testMode"),
          });

          // Update shop gameData with new room information
          this.configureShopGameData();

          // ENHANCED: Register room enter event with validation
          const newRoomId = this.floorGenerator.validateRoomMapping(); // Use enhanced validation
          const roomType = this.floorGenerator.getCurrentRoomType();
          console.log(`Entered ${roomType} room (ID: ${newRoomId})`);

          // Log boss encounter if entering a boss room for the first time
          if (roomType === "boss") {
            console.log(`Boss encounter detected in room ${newRoomId}`);
            try {
              const userId = parseInt(localStorage.getItem("currentUserId"));
              const runId = parseInt(localStorage.getItem("currentRunId"));
              const floor = this.floorGenerator.getCurrentFloor();

              if (userId && runId) {
                await registerBossKill(runId, {
                  userId: userId,
                  bossType: "dragon",
                  floor: floor,
                  fightDuration: 0, // Fight hasn't started yet
                  playerHpRemaining: this.player.health,
                });
                console.log(`Boss encounter logged for room ${newRoomId}`);
              }
            } catch (error) {
              console.error("Failed to log boss encounter:", error);
            }
          }
        }

        // AUTO-SAVE: Using saveStateManager after successful room transition
        console.log(`Auto-saving after successful room transition...`);

        // ENHANCED: Debug localStorage before auto-save
        console.log("PRE-AUTOSAVE DEBUG - localStorage state:", {
          userId: localStorage.getItem("currentUserId"),
          runId: localStorage.getItem("currentRunId"),
          sessionId: localStorage.getItem("currentSessionId"),
          testMode: localStorage.getItem("testMode"),
        });

        await this.saveCurrentGameState();

        // ENHANCED: Debug localStorage after auto-save
        console.log("POST-AUTOSAVE DEBUG - localStorage state:", {
          userId: localStorage.getItem("currentUserId"),
          runId: localStorage.getItem("currentRunId"),
          sessionId: localStorage.getItem("currentSessionId"),
          testMode: localStorage.getItem("testMode"),
        });
      }

      // FIX: Set cooldown timer to prevent immediate re-transition
      this.transitionCooldown = this.transitionCooldownTime;
      console.log(
        `ROOM TRANSITION COMPLETE - Setting ${this.transitionCooldownTime}ms cooldown`
      );
    } catch (error) {
      console.error("Error during room transition:", error);

      // ENHANCED: Additional error recovery
      try {
        // Try to restore a stable state
        this.currentRoom = this.floorGenerator.getCurrentRoom();
        if (this.currentRoom && this.player) {
          this.player.setCurrentRoom(this.currentRoom);
          this.enemies = this.currentRoom.objects.enemies;
          console.log("State recovery attempted after transition error");
        }
      } catch (recoveryError) {
        console.error(
          "Failed to recover state after transition error:",
          recoveryError
        );
      }
    } finally {
      // FIX: Always clear the transition flag, even if there was an error
      this.isTransitioning = false;
      console.log("ROOM TRANSITION UNLOCKED");
    }
  }

  update(deltaTime) {
    // NEW: Don't update if game is not ready yet
    if (!this.isReady) {
      return;
    }

    // NEW: Skip update if game is paused only
    if (this.isPaused) {
      return;
    }

    // EMERGENCY FIX: Force reset isTransitioning if it's been stuck for too long
    if (this.isTransitioning) {
      if (!this.transitionStartTime) {
        this.transitionStartTime = Date.now();
      } else if (Date.now() - this.transitionStartTime > 5000) {
        // 5 seconds timeout
        console.error(
          "⚠️ EMERGENCY: isTransitioning stuck for 5+ seconds - Force resetting!"
        );
        this.isTransitioning = false;
        this.transitionStartTime = null;
        this.transitionCooldown = 0;
      }
    } else {
      this.transitionStartTime = null;
    }

    // FIX: Allow essential updates even during upgrade selection
    if (this.gameState === "upgradeSelection") {
      // CRITICAL: Keep essential systems running during upgrade selection
      console.log("UPGRADE SELECTION MODE: Allowing essential updates");

      // Update player movement
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

      // Save current position for next update
      this.player.previousPosition = new Vec(
        this.player.position.x,
        this.player.position.y
      );

      // FIX: Update transition cooldown timer even during upgrade selection
      if (this.transitionCooldown > 0) {
        this.transitionCooldown -= deltaTime;
        if (this.transitionCooldown <= 0) {
          this.transitionCooldown = 0;
          console.log(
            "ROOM TRANSITION COOLDOWN EXPIRED - Transitions now allowed"
          );
        }
      }

      // Return after essential updates - don't run full game loop
      return;
    }

    // Check if shop is open - if so, don't update game state
    if (this.currentRoom?.objects.shop?.isOpen) {
      return;
    }

    // FIX: Update transition cooldown timer
    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= deltaTime;
      if (this.transitionCooldown <= 0) {
        this.transitionCooldown = 0;
        console.log(
          "ROOM TRANSITION COOLDOWN EXPIRED - Transitions now allowed"
        );
      }
    }

    // Update current room
    this.currentRoom.update(deltaTime);

    // ENHANCED: Smart enemies array synchronization
    const roomEnemies = this.currentRoom.objects.enemies;
    const currentEnemiesLength = this.enemies ? this.enemies.length : 0;
    const roomEnemiesLength = roomEnemies ? roomEnemies.length : 0;

    // Check if arrays need synchronization
    if (this.enemies !== roomEnemies) {
      const lengthDifference = currentEnemiesLength - roomEnemiesLength;
      const isNormalEnemyCleanup =
        lengthDifference > 0 && roomEnemiesLength >= 0;

      // Only show warning for unexpected desyncs (not normal enemy death cleanup)
      if (
        !isNormalEnemyCleanup &&
        (currentEnemiesLength !== roomEnemiesLength || this.needsEnemySync)
      ) {
        console.warn("UNEXPECTED ENEMIES ARRAY DESYNC - Auto-correcting");
        console.warn(`  this.enemies.length: ${currentEnemiesLength}`);
        console.warn(
          `  this.currentRoom.objects.enemies.length: ${roomEnemiesLength}`
        );
        console.warn(
          `  Length difference: ${lengthDifference} (unexpected pattern)`
        );
        this.needsEnemySync = false; // Reset sync flag
      }

      // Always sync arrays (but only log for unexpected cases)
      this.enemies = roomEnemies;

      // Debug log for normal enemy cleanup (only when length actually changed)
      if (isNormalEnemyCleanup && lengthDifference > 0) {
        console.log(
          `Synchronized after enemy cleanup: ${currentEnemiesLength} → ${roomEnemiesLength} enemies`
        );
      }
    }

    // FIX: Check if boss was just defeated to show immediate transition feedback
    if (this.bossJustDefeated && this.floorGenerator.isBossRoom()) {
      console.log("Showing transition zone activation message to player");
      this.transitionZoneActivatedMessage =
        "BOSS DEFEATED! \nMove to the right edge to advance to next floor!";
      this.transitionZoneMessageTimer = 3000; // Show for 3 seconds
      this.bossJustDefeated = false; // Reset flag
    }

    // NEW: Handle room just cleared for immediate transition check
    if (this.roomJustCleared) {
      console.log(
        "ROOM JUST CLEARED - Performing immediate transition verification"
      );
      this.roomJustCleared = false; // Reset flag immediately

      // SIMPLIFIED: Just show feedback - let main loop handle the actual transition
      console.log(
        "Room cleared! Player can now advance by moving to the right edge"
      );

      // Show a brief message to the player
      if (this.currentRoom.isCombatRoom) {
        this.transitionZoneActivatedMessage =
          "ENEMIES DEFEATED!\nMove to the right edge to advance";
        this.transitionZoneMessageTimer = 2000; // Show for 2 seconds
      }

      // REMOVED: Duplicate transition check - main loop will handle it
    }

    // Update transition zone message timer
    if (this.transitionZoneMessageTimer > 0) {
      this.transitionZoneMessageTimer -= deltaTime;
      if (this.transitionZoneMessageTimer <= 0) {
        this.transitionZoneActivatedMessage = null;
      }
    }

    // REORDERED: Update player FIRST before checking transitions
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

    // NEW: Auto-save using saveStateManager periodically
    const currentTime = Date.now();
    if (currentTime - this.lastAutoSave >= this.autoSaveInterval) {
      this.saveCurrentGameState().catch((error) => {
        console.error("Failed to auto-save game state:", error);
      });
      this.lastAutoSave = currentTime;
    }

    // FIXED: Check room transition (FORWARD ONLY) with proper state management
    // NOW AFTER player.update() to ensure correct timing
    const isAtRightEdge = this.currentRoom.isPlayerAtRightEdge(this.player);
    const isNotTransitioning = !this.isTransitioning;
    const noCooldown = this.transitionCooldown <= 0;
    const canTransition = this.currentRoom.canTransition();

    // Debug every 60 frames (approximately once per second) when player might be near edge
    if (window.transitionDebugCounter === undefined)
      window.transitionDebugCounter = 0;
    window.transitionDebugCounter++;

    const playerHitbox = this.player.getHitboxBounds();
    const nearRightEdge = playerHitbox.x > variables.canvasWidth * 0.7; // Near right 30% of screen

    if (window.transitionDebugCounter % 60 === 0 && nearRightEdge) {
      console.log("TRANSITION DEBUG - Player near right edge:", {
        isAtRightEdge,
        isNotTransitioning,
        noCooldown: noCooldown,
        cooldownTime: this.transitionCooldown,
        canTransition,
        playerX: Math.round(playerHitbox.x),
        playerY: Math.round(playerHitbox.y),
        canvasWidth: variables.canvasWidth,
        rightEdgeThreshold: variables.canvasWidth - playerHitbox.width,
        transitionZone: this.currentRoom.transitionZone,
        middleY: variables.canvasHeight / 2,
        playerCenterY: Math.round(playerHitbox.y + playerHitbox.height / 2),
        yDifference: Math.abs(
          playerHitbox.y + playerHitbox.height / 2 - variables.canvasHeight / 2
        ),
        yTolerance: playerHitbox.height,
      });
    }

    if (isAtRightEdge && isNotTransitioning && noCooldown && canTransition) {
      console.log("ROOM TRANSITION TRIGGERED - Player at right edge");
      // Don't block the game loop with async operations
      this.handleRoomTransition("right").catch((error) => {
        console.error("Error in room transition:", error);
      });
    } else if (nearRightEdge && canTransition) {
      // Only log when player is near edge but transition not triggered
      if (window.transitionDebugCounter % 30 === 0) {
        // Every half second
        console.log("TRANSITION BLOCKED - Requirements not met:", {
          isAtRightEdge,
          isNotTransitioning,
          noCooldown,
          canTransition,
          blockingReason: !isAtRightEdge
            ? "Not at right edge"
            : this.isTransitioning
            ? "Currently transitioning"
            : this.transitionCooldown > 0
            ? `Cooldown: ${Math.round(this.transitionCooldown)}ms`
            : !canTransition
            ? "Room cannot transition"
            : "Unknown",
        });
      }
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
      const currentRun = this.floorGenerator.getCurrentRun();
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

      // Import logout function dynamically
      const { logoutUser } = await import("../../utils/api.js");

      // Get session data
      const sessionToken = localStorage.getItem("sessionToken");

      if (sessionToken) {
        console.log("Logging out from game...");
        await logoutUser(sessionToken);
      }

      // Clear session data
      const sessionKeys = [
        "sessionToken",
        "currentUserId",
        "currentSessionId",
        "currentRunId",
      ];
      sessionKeys.forEach((key) => localStorage.removeItem(key));

      // Redirect to landing
      window.location.href = "landing.html";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API fails
      const sessionKeys = [
        "sessionToken",
        "currentUserId",
        "currentSessionId",
        "currentRunId",
      ];
      sessionKeys.forEach((key) => localStorage.removeItem(key));
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

      // Load saved state BEFORE initializing objects
      await this.loadSavedState()
        .then(() => {
          this.initObjects(); // Now this.player won't be overwritten
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
    // ENHANCED: Debug localStorage values before parsing
    const userIdRaw = localStorage.getItem("currentUserId");
    const sessionIdRaw = localStorage.getItem("currentSessionId");
    const runIdRaw = localStorage.getItem("currentRunId");

    console.log("getCurrentGameState() - Raw localStorage values:", {
      userIdRaw,
      sessionIdRaw,
      runIdRaw,
      runIdType: typeof runIdRaw,
      runIdLength: runIdRaw ? runIdRaw.length : "N/A",
    });

    const roomId = this.floorGenerator?.getCurrentRoomId() || 1;

    // Parse values with validation
    const userId = parseInt(userIdRaw);
    const sessionId = parseInt(sessionIdRaw);
    const runId = parseInt(runIdRaw);

    console.log("getCurrentGameState() - Parsed values:", {
      userId,
      sessionId,
      runId,
      roomId,
      userIdIsNaN: isNaN(userId),
      sessionIdIsNaN: isNaN(sessionId),
      runIdIsNaN: isNaN(runId),
    });

    // ENHANCED: Warn about NaN values
    if (isNaN(userId)) {
      console.warn(
        "getCurrentGameState() - userId is NaN, raw value:",
        userIdRaw
      );
    }
    if (isNaN(sessionId)) {
      console.warn(
        "getCurrentGameState() - sessionId is NaN, raw value:",
        sessionIdRaw
      );
    }
    if (isNaN(runId)) {
      console.warn(
        "getCurrentGameState() - runId is NaN, raw value:",
        runIdRaw
      );
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

    console.log("getCurrentGameState() - Final game state:", gameState);

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

  // NEW: Load and apply permanent upgrades to player
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
      console.error("Failed to load permanent upgrades:", error);
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
