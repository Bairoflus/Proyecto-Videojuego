// ===================================================
// SAVE STATE MANAGER - SHATTERED TIMELINE
// ===================================================
// Objetivo: Manejar estados guardados de manera optimizada
// Base de datos: dbshatteredtimeline
// Version: 3.1 - Performance Optimized
// ===================================================

import { saveGameState, getSaveState, clearSaveState } from "./api.js";

export class SaveStateManager {
  constructor() {
    this.currentSaveState = null;
    this.autoSaveInterval = null;
    this.baseAutoSaveFrequency = 30000; // 30 seconds default
    this.adaptiveFrequency = 30000;
    this.lastSaveTime = 0;
    this.gameActivity = "normal";
    this.savePerformanceMetrics = {
      averageSaveTime: 0,
      saveCount: 0,
      failedSaves: 0,
    };

    // Performance optimization: Debounce rapid saves
    this.saveDebounceTimeout = null;
    this.pendingSaveState = null;

    // Memory leak prevention
    this.eventListeners = new Set();
    this.cleanupTasks = new Set();

    // Setup automatic cleanup on page unload
    this.setupCleanupListeners();
  }

  // ===================================================
  // MEMORY LEAK PREVENTION
  // ===================================================

  /**
   * Setup cleanup listeners to prevent memory leaks
   */
  setupCleanupListeners() {
    const beforeUnloadHandler = () => this.cleanup();
    const visibilityChangeHandler = () => {
      if (document.hidden) {
        this.handlePageHidden();
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    document.addEventListener("visibilitychange", visibilityChangeHandler);

    this.eventListeners.add(() =>
      window.removeEventListener("beforeunload", beforeUnloadHandler)
    );
    this.eventListeners.add(() =>
      document.removeEventListener("visibilitychange", visibilityChangeHandler)
    );
  }

  /**
   * Handle page being hidden (browser tab inactive)
   */
  handlePageHidden() {
    // Reduce auto-save frequency when tab is not active
    if (this.autoSaveInterval) {
      this.setAdaptiveFrequency({ inBackground: true });
    }
  }

  /**
   * Cleanup all resources to prevent memory leaks
   */
  cleanup() {
    console.log("Cleaning up SaveStateManager resources...");

    // Stop auto-save
    this.stopAutoSave();

    // Clear debounce timeout
    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
      this.saveDebounceTimeout = null;
    }

    // Remove all event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.clear();

    // Execute cleanup tasks
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks.clear();

    // Clear references
    this.currentSaveState = null;
    this.pendingSaveState = null;
  }

  // ===================================================
  // ADAPTIVE AUTO-SAVE OPTIMIZATION
  // ===================================================

  /**
   * Calculate optimal auto-save frequency based on game state
   * @param {Object} gameState - Current game state
   */
  calculateOptimalFrequency(gameState) {
    const baseFreq = this.baseAutoSaveFrequency / 1000; // Convert to seconds

    // High-priority situations (more frequent saves)
    if (gameState.inCombat || gameState.inBossRoom) {
      return Math.max(15, baseFreq / 2) * 1000;
    }

    // Medium-priority situations
    if (gameState.playerHealthLow || gameState.hasValuableItems) {
      return Math.max(20, baseFreq * 0.75) * 1000;
    }

    // Low-priority situations (less frequent saves)
    if (gameState.inMenu || gameState.inShop || gameState.inBackground) {
      return Math.min(60, baseFreq * 2) * 1000;
    }

    // Default frequency
    return this.baseAutoSaveFrequency;
  }

  /**
   * Set adaptive frequency based on game context
   * @param {Object} gameContext - Game context information
   */
  setAdaptiveFrequency(gameContext) {
    const newFrequency = this.calculateOptimalFrequency(gameContext);

    if (newFrequency !== this.adaptiveFrequency) {
      this.adaptiveFrequency = newFrequency;

      // Restart auto-save with new frequency if active
      if (this.autoSaveInterval) {
        this.restartAutoSaveWithNewFrequency();
      }

      console.log(
        `Auto-save frequency adapted to ${newFrequency / 1000}s for context:`,
        gameContext
      );
    }
  }

  /**
   * Restart auto-save with new adaptive frequency
   */
  restartAutoSaveWithNewFrequency() {
    if (this.autoSaveInterval && this.getGameStateCallback) {
      this.stopAutoSave();
      this.startAutoSave(this.getGameStateCallback);
    }
  }

  // ===================================================
  // OPTIMIZED SAVE STATE METHODS
  // ===================================================

  /**
   * Save current game state with performance optimization
   * @param {Object} gameState - Current game state
   * @param {boolean} isLogout - If saving due to logout
   * @param {boolean} force - Force save even if debounced
   */
  async saveCurrentState(gameState, isLogout = false, force = false) {
    const startTime = performance.now();

    try {
      // Performance optimization: Debounce rapid saves unless forced or logout
      if (!force && !isLogout) {
        return await this.debouncedSave(gameState);
      }

      // Validate game state
      if (!this.validateGameState(gameState)) {
        console.warn("Invalid game state, skipping save");
        return false;
      }

      const { userId, sessionId, runId, floorId, roomId, currentHp, gold } =
        gameState;

      const response = await saveGameState(userId, {
        sessionId,
        runId,
        floorId: floorId || this.calculateFloorFromRoom(roomId),
        roomId,
        currentHp,
        gold,
      });

      const endTime = performance.now();
      const saveTime = endTime - startTime;
      this.updatePerformanceMetrics(saveTime, response.success);

      if (response.success) {
        this.currentSaveState = {
          ...gameState,
          savedAt: new Date().toISOString(),
        };
        this.lastSaveTime = Date.now();

        // Log the save with timing info
        if (isLogout || force) {
          console.log(
            `💾 Game state saved successfully ${
              isLogout ? "(logout)" : "(forced)"
            } in ${saveTime.toFixed(2)}ms`
          );
        } else {
          // Reduced logging for auto-saves - only show timing for slow saves
          if (saveTime > 50) {
            // Only log if save took more than 50ms
            console.log(
              `⚠️ Slow auto-save completed in ${saveTime.toFixed(2)}ms`
            );
          }
        }
        return true;
      } else {
        this.updatePerformanceMetrics(saveTime, false);
        console.error("Failed to save game state:", response.message);
        return false;
      }
    } catch (error) {
      const saveTime = performance.now() - startTime;
      this.updatePerformanceMetrics(saveTime, false);
      console.error("Error saving game state:", error);
      return false;
    }
  }

  /**
   * Debounced save to prevent excessive API calls
   * @param {Object} gameState - Game state to save
   */
  async debouncedSave(gameState) {
    this.pendingSaveState = gameState;

    if (this.saveDebounceTimeout) {
      clearTimeout(this.saveDebounceTimeout);
    }

    return new Promise((resolve) => {
      this.saveDebounceTimeout = setTimeout(async () => {
        if (this.pendingSaveState) {
          const result = await this.saveCurrentState(
            this.pendingSaveState,
            false,
            true
          );
          this.pendingSaveState = null;
          resolve(result);
        }
      }, 2000); // 2 second debounce
    });
  }

  /**
   * Validate game state before saving
   * @param {Object} gameState - Game state to validate
   */
  validateGameState(gameState) {
    const required = [
      "userId",
      "sessionId",
      "runId",
      "roomId",
      "currentHp",
      "gold",
    ];
    const missing = required.filter(
      (field) => gameState[field] === undefined || gameState[field] === null
    );

    if (missing.length > 0) {
      console.error("Missing required fields for save state:", missing);
      return false;
    }

    // Validate data types and ranges
    if (typeof gameState.currentHp !== "number" || gameState.currentHp < 0) {
      console.error("Invalid currentHp value:", gameState.currentHp);
      return false;
    }

    if (typeof gameState.gold !== "number" || gameState.gold < 0) {
      console.error("Invalid gold value:", gameState.gold);
      return false;
    }

    if (typeof gameState.roomId !== "number" || gameState.roomId < 1) {
      console.error("Invalid roomId value:", gameState.roomId);
      return false;
    }

    return true;
  }

  /**
   * Update performance metrics for monitoring
   * @param {number} saveTime - Time taken for save operation
   * @param {boolean} success - Whether save was successful
   */
  updatePerformanceMetrics(saveTime, success) {
    this.savePerformanceMetrics.saveCount++;

    if (success) {
      const count = this.savePerformanceMetrics.saveCount;
      this.savePerformanceMetrics.averageSaveTime =
        (this.savePerformanceMetrics.averageSaveTime * (count - 1) + saveTime) /
        count;
    } else {
      this.savePerformanceMetrics.failedSaves++;
    }
  }

  // ===================================================
  // ENHANCED AUTO-SAVE FUNCTIONALITY
  // ===================================================

  /**
   * Start enhanced auto-save with adaptive frequency
   * @param {Function} getGameStateCallback - Function that returns current state
   */
  startAutoSave(getGameStateCallback) {
    if (this.autoSaveInterval) {
      this.stopAutoSave();
    }

    this.getGameStateCallback = getGameStateCallback;

    this.autoSaveInterval = setInterval(async () => {
      const gameState = getGameStateCallback();
      if (gameState && gameState.userId) {
        // Update adaptive frequency based on current game state
        this.setAdaptiveFrequency(gameState);

        // Perform save
        await this.saveCurrentState(gameState, false);
      }
    }, this.adaptiveFrequency);

    console.log(
      `Enhanced auto-save started (adaptive frequency: ${
        this.adaptiveFrequency / 1000
      }s)`
    );

    // Add to cleanup tasks
    this.cleanupTasks.add(() => this.stopAutoSave());
  }

  /**
   * Stop auto-save with proper cleanup
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      this.getGameStateCallback = null;
      console.log("Auto-save stopped");
    }
  }

  /**
   * Set base auto-save frequency (will be adapted based on context)
   * @param {number} seconds - Base seconds between saves
   */
  setAutoSaveFrequency(seconds) {
    this.baseAutoSaveFrequency = seconds * 1000;
    this.adaptiveFrequency = this.baseAutoSaveFrequency;
    console.log(`Base auto-save frequency set to ${seconds}s`);
  }

  // ===================================================
  // ENHANCED UTILITY METHODS
  // ===================================================

  /**
   * Check if save state exists
   */
  hasSaveState() {
    return this.currentSaveState !== null;
  }

  /**
   * Get current save state
   */
  getCurrentSaveState() {
    return this.currentSaveState;
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    return {
      ...this.savePerformanceMetrics,
      currentFrequency: this.adaptiveFrequency / 1000,
      baseFrequency: this.baseAutoSaveFrequency / 1000,
      lastSaveTime: this.lastSaveTime,
      timeSinceLastSave: this.lastSaveTime
        ? Date.now() - this.lastSaveTime
        : null,
    };
  }

  /**
   * Load save state with enhanced error handling
   * @param {number} userId - User ID
   */
  async loadSaveState(userId) {
    try {
      const response = await getSaveState(userId);

      if (response && response.success && response.data) {
        this.currentSaveState = {
          userId: userId,
          runId: response.data.run_id,
          floor: response.data.floor,
          roomId: response.data.location,
          currentHp: response.data.health,
          gold: response.data.coins,
          savedAt: response.data.timestamp,
        };

        console.log("Save state loaded successfully:", this.currentSaveState);
        return this.currentSaveState;
      } else {
        console.log("No save state found for user");
        return null;
      }
    } catch (error) {
      console.error("Error loading save state:", error);
      return null;
    }
  }

  /**
   * Clear save state with enhanced error handling
   * @param {number} userId - User ID
   */
  async clearSaveState(userId) {
    try {
      const response = await clearSaveState(userId);

      if (response.success) {
        this.currentSaveState = null;
        this.lastSaveTime = 0;
        console.log("Save state cleared (player died)");
        return true;
      } else {
        console.error("Failed to clear save state:", response.message);
        return false;
      }
    } catch (error) {
      console.error("Error clearing save state:", error);
      return false;
    }
  }

  // ===================================================
  // ENHANCED SESSION MANAGEMENT
  // ===================================================

  /**
   * Handle logout with optimized cleanup
   * @param {Object} gameState - Current game state
   */
  async handleLogout(gameState) {
    console.log("Handling user logout...");

    // Force immediate save for logout
    await this.saveCurrentState(gameState, true, true);

    // Cleanup resources
    this.cleanup();

    console.log("Logout handled successfully");
  }

  /**
   * Handle player death with cleanup
   * @param {number} userId - User ID
   */
  async handlePlayerDeath(userId) {
    console.log("Handling player death...");

    // Stop auto-save
    this.stopAutoSave();

    // Clear save state
    await this.clearSaveState(userId);

    // Reset performance metrics
    this.savePerformanceMetrics = {
      averageSaveTime: 0,
      saveCount: 0,
      failedSaves: 0,
    };

    console.log("Player death handled successfully");
  }

  /**
   * Handle room transition with adaptive saving
   * @param {Object} gameState - Current game state
   */
  async handleRoomTransition(gameState) {
    // Save immediately on room transitions for safety
    await this.saveCurrentState(gameState, false, true);
  }

  /**
   * Check if save state is recent (less than 1 hour)
   */
  isSaveStateRecent() {
    if (!this.currentSaveState || !this.currentSaveState.savedAt) {
      return false;
    }

    const savedTime = new Date(this.currentSaveState.savedAt);
    const currentTime = new Date();
    const hoursSinceLastSave = (currentTime - savedTime) / (1000 * 60 * 60);

    return hoursSinceLastSave < 1;
  }

  /**
   * Apply save state to game with enhanced error handling
   * @param {Object} game - Game instance
   */
  applySaveStateToGame(game) {
    if (!this.currentSaveState) {
      console.warn("No save state to apply");
      return false;
    }

    try {
      const state = this.currentSaveState;

      // Apply state to player
      if (game.player) {
        game.player.hp = state.currentHp;
        game.player.gold = state.gold;
      }

      // Apply location
      if (game.floorGenerator) {
        game.floorGenerator.currentRoom = state.roomId;
      }

      console.log("Save state applied to game successfully");
      return true;
    } catch (error) {
      console.error("Error applying save state to game:", error);
      return false;
    }
  }

  /**
   * Calculate floor ID from room ID with enhanced validation
   * @param {number} roomId - Room ID (1-18)
   * @returns {number} Floor ID (1-3)
   */
  calculateFloorFromRoom(roomId) {
    // ENHANCED: Validate input
    if (!roomId || typeof roomId !== "number" || roomId < 1) {
      console.warn(`Invalid room ID: ${roomId}, defaulting to Floor 1`);
      return 1;
    }

    // ENHANCED: Calculate with proper bounds checking
    const floor = Math.ceil(roomId / 6);

    // ENHANCED: Ensure floor is within valid range (1-3)
    if (floor < 1) {
      console.warn(
        `Calculated floor ${floor} is too low for room ${roomId}, using Floor 1`
      );
      return 1;
    } else if (floor > 3) {
      console.warn(
        `Calculated floor ${floor} is too high for room ${roomId}, using Floor 3`
      );
      return 3;
    }

    // ENHANCED: Logging for debugging
    console.log(`🗺️ Room ${roomId} mapped to Floor ${floor}`);
    return floor;
  }

  /**
   * ENHANCED: Validate and sync save state with current game state
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if state is valid and synchronized
   */
  validateGameStateSync(gameState) {
    try {
      // Check if we have FloorGenerator available for validation
      if (window.game && window.game.floorGenerator) {
        const fg = window.game.floorGenerator;

        // Compare save state with current floor generator state
        const currentFloor = fg.getCurrentFloor();
        const currentRoomIndex = fg.getCurrentRoomIndex();
        const currentRoomId = fg.validateRoomMapping(); // Use enhanced validation

        // Calculate expected values
        const expectedFloor = this.calculateFloorFromRoom(gameState.roomId);
        const expectedRoomIndex = (gameState.roomId - 1) % 6;

        // Check for inconsistencies
        const floorMismatch = currentFloor !== expectedFloor;
        const roomMismatch = currentRoomId !== gameState.roomId;

        if (floorMismatch || roomMismatch) {
          console.warn("🚨 SAVE STATE SYNC ISSUE DETECTED:");
          console.warn(
            `  Current FloorGenerator: Floor ${currentFloor}, Room ${
              currentRoomIndex + 1
            }, ID ${currentRoomId}`
          );
          console.warn(
            `  Save State: Floor ${expectedFloor}, Room ID ${gameState.roomId}`
          );
          console.warn(
            `  Mismatch: Floor=${floorMismatch}, Room=${roomMismatch}`
          );

          // Return false to indicate sync issues
          return false;
        }

        console.log("✅ Save state synchronized with FloorGenerator");
        return true;
      }

      // If no FloorGenerator available, just validate the save state format
      return this.validateGameState(gameState);
    } catch (error) {
      console.error("Error validating game state sync:", error);
      return false;
    }
  }
}

// ===================================================
// INSTANCIA SINGLETON
// ===================================================

export const saveStateManager = new SaveStateManager();
export default saveStateManager;
