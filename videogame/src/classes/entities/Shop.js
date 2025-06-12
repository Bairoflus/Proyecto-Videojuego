/**
 * Shop class
 * Handles shop UI, purchase logic, and upgrade management
 * Displays when player enters a shop room
 */
import { log } from "../../utils/Logger.js";
import { SHOP_CONSTANTS } from "../../constants/gameConstants.js";
import { registerWeaponPurchase } from "../../utils/api.js";
import { weaponUpgradeManager } from "../../utils/weaponUpgradeManager.js";

export class Shop {
  constructor() {
    // Shop configuration
    this.isOpen = false;
    this.selectedIndex = 0;
    this.onCloseCallback = null; // Callback for when shop closes

    // Purchase options configuration using constants
    this.options = this.createShopOptions();

    // Track upgrade counters globally for the run
    this.runUpgrades = {
      melee: 0,
      ranged: 0,
    };

    // Backend registration data (set externally)
    this.gameData = {
      runId: null,
      userId: null,
      roomId: null,
    };
  }

  /**
   * Creates shop options using constants
   * @returns {Array} Array of shop option objects
   */
  createShopOptions() {
    const { MELEE, RANGED, HEALTH } = SHOP_CONSTANTS.UPGRADES;

    return [
      {
        id: "melee_upgrade",
        name: MELEE.NAME,
        description: MELEE.DESCRIPTION,
        cost: MELEE.COST,
        maxPurchases: MELEE.MAX_PURCHASES,
        purchased: 0,
        damageIncrease: MELEE.DAMAGE_INCREASE,
        type: "melee",
      },
      {
        id: "ranged_upgrade",
        name: RANGED.NAME,
        description: RANGED.DESCRIPTION,
        cost: RANGED.COST,
        maxPurchases: RANGED.MAX_PURCHASES,
        purchased: 0,
        damageIncrease: RANGED.DAMAGE_INCREASE,
        type: "ranged",
      },
      {
        id: "health_restore",
        name: HEALTH.NAME,
        description: HEALTH.DESCRIPTION,
        cost: HEALTH.COST,
        maxPurchases: HEALTH.MAX_PURCHASES,
        purchased: 0,
        type: "health",
      },
    ];
  }

  /**
   * Opens the shop UI
   */
  open(shopData, onCloseCallback) {
    this.isOpen = true;
    this.selectedIndex = 0;
    this.onCloseCallback = onCloseCallback || null;

    // Set game data for backend registration
    this.gameData = {
      userId: shopData.userId,
      runId: shopData.runId,
      roomId: shopData.roomId,
    };

    // NEW: Sync with weaponUpgradeManager when opening shop
    this.syncWithWeaponUpgradeManager();

    log.info("Shop opened");
  }

  /**
   * Closes the shop UI
   */
  close() {
    if (!this.isOpen) return; // Prevent redundant closes
    this.isOpen = false;
    log.info("Shop closed");

    // Execute callback if provided
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * Handles keyboard input for shop navigation
   * @param {string} key - The key pressed
   * @param {Player} player - The player object
   */
  handleInput(key, player) {
    if (!this.isOpen) return;

    switch (key) {
      case "w":
      case "ArrowUp":
        this.moveSelection(-1);
        break;
      case "s":
      case "ArrowDown":
        this.moveSelection(1);
        break;
      case "Enter":
        this.purchaseSelected(player);
        break;
      case "Escape":
        this.close();
        break;
    }
  }

  /**
   * Moves the selection up or down
   * @param {number} direction - Direction to move (-1 for up, 1 for down)
   */
  moveSelection(direction) {
    this.selectedIndex = Math.max(
      0,
      Math.min(this.options.length - 1, this.selectedIndex + direction)
    );
  }

  /**
   * Sets game data needed for backend registration
   * @param {Object} gameData - Game session data
   * @param {number} gameData.runId - Current run ID
   * @param {number} gameData.userId - Current user ID
   * @param {number} gameData.roomId - Current room ID
   */
  setGameData(gameData) {
    this.gameData = { ...gameData };
    log.debug("Shop game data updated:", this.gameData);
  }

  /**
   * NEW: Registers weapon upgrade purchase in backend using new API
   * @param {Object} option - Purchase option details
   * @param {number} upgradeLevelBefore - Level before purchase
   * @param {number} upgradeLevelAfter - Level after purchase
   * @param {number|null} damageIncrease - Damage increase (null for health)
   */
  async registerPurchaseInBackend(
    option,
    upgradeLevelBefore,
    upgradeLevelAfter,
    cost
  ) {
    try {
      // Skip backend registration in test/developer mode
      const testMode = localStorage.getItem("testMode") === "true";

      if (testMode) {
        log.debug(
          "🧪 Test mode: Skipping backend registration for weapon upgrade"
        );
        return;
      }

      // Validate we have the required game data
      if (
        !this.gameData.runId ||
        !this.gameData.userId ||
        !this.gameData.roomId
      ) {
        log.warn(
          "⚠️ Missing game data for backend registration:",
          this.gameData
        );
        return;
      }

      const purchaseData = {
        userId: this.gameData.userId,
        weaponType: option.type,
        upgradeLevel: upgradeLevelAfter,
        cost: cost,
      };

      log.debug("📡 Registering weapon purchase in backend:", purchaseData);

      const response = await registerWeaponPurchase(
        this.gameData.runId,
        purchaseData
      );

      log.info("Weapon purchase registered successfully:", response);
    } catch (error) {
      log.error("Failed to register weapon purchase in backend:", error);
      // Don't interrupt the game if backend fails
    }
  }

  /**
   * NEW: Attempts to purchase the selected option using weaponUpgradeManager
   * @param {Player} player - The player making the purchase
   */
  async purchaseSelected(player) {
    const option = this.options[this.selectedIndex];

    // Check if player has enough gold
    if (player.gold < option.cost) {
      log.warn(
        `Purchase failed: Not enough gold. Need ${option.cost}, have ${player.gold}`
      );
      return;
    }

    // Check if upgrade limit reached
    if (option.type === "melee" || option.type === "ranged") {
      const currentUpgrades = this.runUpgrades[option.type];
      if (currentUpgrades >= option.maxPurchases) {
        log.warn(
          `Purchase failed: ${option.name} limit reached (${option.maxPurchases}/${option.maxPurchases})`
        );
        return;
      }
    }

    // Check if health restoration is needed
    if (option.type === "health" && player.health >= player.maxHealth) {
      log.warn("Purchase failed: Already at full health");
      return;
    }

    // Store levels before purchase for backend registration
    const upgradeLevelBefore = this.runUpgrades[option.type] || 0;
    let upgradeLevelAfter = upgradeLevelBefore;

    // Process purchase
    player.gold -= option.cost;
    option.purchased++;

    // Track gold spent in global game statistics
    if (window.game && typeof window.game.trackGoldSpent === "function") {
      window.game.trackGoldSpent(option.cost);
    }

    // Apply upgrade effects
    switch (option.type) {
      case "melee":
        try {
          // NEW: Use weaponUpgradeManager to upgrade weapon
          const upgradeResult = await weaponUpgradeManager.upgradeWeapon(
            "melee"
          );

          if (upgradeResult.success) {
            this.runUpgrades.melee++;
            upgradeLevelAfter = upgradeResult.newLevel;

            // Sync player levels
            player.syncWeaponLevels();

            log.info(
              `Melee weapon upgraded to level ${
                upgradeResult.newLevel
              }! Current weapon: ${player.getCurrentMeleeWeapon()}`
            );
          } else {
            // Fallback to damage bonus if at max level
            player.meleeDamageBonus =
              (player.meleeDamageBonus || 0) + option.damageIncrease;
            log.info(
              `Melee weapon at max level. Damage bonus increased by +${option.damageIncrease}. Total bonus: +${player.meleeDamageBonus}`
            );
          }
        } catch (error) {
          log.error("Failed to upgrade melee weapon via manager:", error);
          // Fallback to old logic
          player.meleeDamageBonus =
            (player.meleeDamageBonus || 0) + option.damageIncrease;
        }
        break;

      case "ranged":
        try {
          // NEW: Use weaponUpgradeManager to upgrade weapon
          const upgradeResult = await weaponUpgradeManager.upgradeWeapon(
            "ranged"
          );

          if (upgradeResult.success) {
            this.runUpgrades.ranged++;
            upgradeLevelAfter = upgradeResult.newLevel;

            // Sync player levels
            player.syncWeaponLevels();

            log.info(
              `Ranged weapon upgraded to level ${
                upgradeResult.newLevel
              }! Current weapon: ${player.getCurrentRangedWeapon()}`
            );
          } else {
            // Fallback to damage bonus if at max level
            player.rangedDamageBonus =
              (player.rangedDamageBonus || 0) + option.damageIncrease;
            log.info(
              `Ranged weapon at max level. Damage bonus increased by +${option.damageIncrease}. Total bonus: +${player.rangedDamageBonus}`
            );
          }
        } catch (error) {
          log.error("Failed to upgrade ranged weapon via manager:", error);
          // Fallback to old logic
          player.rangedDamageBonus =
            (player.rangedDamageBonus || 0) + option.damageIncrease;
        }
        break;

      case "health":
        upgradeLevelAfter = upgradeLevelBefore; // Health doesn't have levels

        player.health = player.maxHealth;
        log.info(`Health restored to maximum (${player.maxHealth})`);
        break;
    }

    log.info(
      `Purchased: ${option.name} for ${option.cost} gold. Remaining gold: ${player.gold}`
    );

    // Register purchase in backend (async, don't wait)
    if (option.type !== "health") {
      this.registerPurchaseInBackend(
        option,
        upgradeLevelBefore,
        upgradeLevelAfter,
        option.cost
      );
    }
  }

  /**
   * Draws the shop UI
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @param {Player} player - The player object
   */
  draw(ctx, canvasWidth, canvasHeight, player) {
    if (!this.isOpen) return;

    const { UI, FONTS } = SHOP_CONSTANTS;
    const x = (canvasWidth - UI.WIDTH) / 2;
    const y = (canvasHeight - UI.HEIGHT) / 2;

    // Draw background
    ctx.fillStyle = UI.BACKGROUND_COLOR;
    ctx.fillRect(x, y, UI.WIDTH, UI.HEIGHT);

    // Draw border
    ctx.strokeStyle = UI.BORDER_COLOR;
    ctx.lineWidth = UI.BORDER_WIDTH;
    ctx.strokeRect(x, y, UI.WIDTH, UI.HEIGHT);

    // Draw title
    ctx.fillStyle = UI.TEXT_COLOR;
    ctx.font = FONTS.TITLE;
    ctx.textAlign = "center";
    ctx.fillText("SHOP", canvasWidth / 2, y + 40);

    // Draw player gold
    ctx.font = FONTS.GOLD;
    ctx.fillStyle = UI.GOLD_COLOR;
    ctx.fillText(`Gold: ${player.gold}`, canvasWidth / 2, y + 70);

    // Draw options
    this.drawShopOptions(ctx, x, y, player);

    // Draw instructions
    ctx.fillStyle = UI.TEXT_COLOR;
    ctx.font = FONTS.INSTRUCTIONS;
    ctx.textAlign = "center";
    ctx.fillText(
      "W/S or ↑/↓: Navigate | Enter: Purchase | ESC: Exit",
      canvasWidth / 2,
      y + UI.HEIGHT - 20
    );
  }

  /**
   * Draws individual shop options
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} x - Base x coordinate
   * @param {number} y - Base y coordinate
   * @param {Player} player - The player object
   */
  drawShopOptions(ctx, x, y, player) {
    const { UI, FONTS } = SHOP_CONSTANTS;
    const optionStartY = y + 100;

    this.options.forEach((option, index) => {
      const optionY = optionStartY + index * UI.OPTION_HEIGHT;
      const isSelected = index === this.selectedIndex;
      const { canAfford, isMaxed, isHealthFull, isDisabled } =
        this.getOptionAvailability(option, player);

      // Draw option background and border if selected
      if (isSelected) {
        ctx.fillStyle = "rgba(76, 175, 80, 0.3)";
        ctx.fillRect(
          x + UI.PADDING,
          optionY,
          UI.WIDTH - UI.PADDING * 2,
          UI.OPTION_HEIGHT - 10
        );

        ctx.strokeStyle = UI.SELECTED_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x + UI.PADDING,
          optionY,
          UI.WIDTH - UI.PADDING * 2,
          UI.OPTION_HEIGHT - 10
        );
      }

      // Set text color based on availability
      ctx.fillStyle = isDisabled
        ? UI.DISABLED_COLOR
        : isSelected
        ? UI.SELECTED_COLOR
        : UI.TEXT_COLOR;

      // Draw option name
      ctx.font = FONTS.OPTION_NAME;
      ctx.textAlign = "left";
      ctx.fillText(option.name, x + UI.PADDING + 10, optionY + 25);

      // Draw option description
      ctx.font = FONTS.DESCRIPTION;
      let description = this.getOptionDescription(
        option,
        isHealthFull,
        isMaxed
      );
      ctx.fillText(description, x + UI.PADDING + 10, optionY + 50);

      // Draw cost
      ctx.textAlign = "right";
      ctx.font = FONTS.OPTION_NAME;
      ctx.fillStyle = canAfford ? UI.GOLD_COLOR : UI.ERROR_COLOR;
      ctx.fillText(
        `${option.cost} gold`,
        x + UI.WIDTH - UI.PADDING - 10,
        optionY + 25
      );

      // Draw purchase count / limit for upgrades
      if (option.type === "melee" || option.type === "ranged") {
        const currentUpgrades = this.runUpgrades[option.type];
        ctx.font = FONTS.PURCHASE_COUNT;
        ctx.fillStyle = isMaxed ? UI.ERROR_COLOR : "#888";
        ctx.fillText(
          `${currentUpgrades}/${option.maxPurchases}`,
          x + UI.WIDTH - UI.PADDING - 10,
          optionY + 50
        );
      }
    });
  }

  /**
   * Gets option availability status
   * @param {Object} option - The shop option
   * @param {Player} player - The player object
   * @returns {Object} Availability status flags
   */
  getOptionAvailability(option, player) {
    const canAfford = player.gold >= option.cost;
    const isMaxed =
      (option.type === "melee" &&
        this.runUpgrades.melee >= option.maxPurchases) ||
      (option.type === "ranged" &&
        this.runUpgrades.ranged >= option.maxPurchases);
    const isHealthFull =
      option.type === "health" && player.health >= player.maxHealth;
    const isDisabled = !canAfford || isMaxed || isHealthFull;

    return { canAfford, isMaxed, isHealthFull, isDisabled };
  }

  /**
   * Gets the appropriate description for an option
   * @param {Object} option - The shop option
   * @param {boolean} isHealthFull - Whether health is full
   * @param {boolean} isMaxed - Whether upgrade is maxed
   * @returns {string} The description text
   */
  getOptionDescription(option, isHealthFull, isMaxed) {
    if (isHealthFull) {
      return "Already at full health";
    }
    if (isMaxed) {
      return "Maximum upgrades reached";
    }
    return option.description;
  }

  /**
   * Resets shop state for a new run
   */
  resetForNewRun() {
    this.runUpgrades.melee = 0;
    this.runUpgrades.ranged = 0;
    this.options.forEach((option) => {
      option.purchased = 0;
    });
    log.debug("Shop state reset for new run");
  }

  /**
   * Gets current upgrade counts
   * @returns {Object} Current upgrade counts
   */
  getUpgradeCounts() {
    return {
      melee: this.runUpgrades.melee,
      ranged: this.runUpgrades.ranged,
    };
  }

  /**
   * Sets a callback to execute when shop closes
   * @param {Function} callback - Function to call on close
   */
  setOnCloseCallback(callback) {
    this.onCloseCallback = callback;
  }

  /**
   * NEW: Set upgrade level for save state restoration
   * @param {string} weaponType - Type of weapon ('melee' or 'ranged')
   * @param {number} level - Upgrade level to set
   */
  setUpgradeLevel(weaponType, level) {
    if (weaponType === "melee" || weaponType === "ranged") {
      this.runUpgrades[weaponType] = level;

      // Update the corresponding option's purchased count
      const option = this.options.find((opt) => opt.type === weaponType);
      if (option) {
        option.purchased = level;
      }

      log.debug(`Restored ${weaponType} upgrade level to ${level}`);
    } else {
      log.warn(`Invalid weapon type for upgrade level: ${weaponType}`);
    }
  }

  /**
   * NEW: Sync local upgrade counts with weaponUpgradeManager
   * This ensures the UI shows the correct weapon levels
   */
  syncWithWeaponUpgradeManager() {
    try {
      if (
        typeof window !== "undefined" &&
        window.weaponUpgradeManager &&
        typeof window.weaponUpgradeManager.getWeaponLevels === "function"
      ) {
        const currentLevels = window.weaponUpgradeManager.getWeaponLevels();

        // FIXED: Display actual weapon level, not purchases made
        // The UI should show the current weapon level (1-15), not number of purchases (0-14)
        this.runUpgrades.melee = currentLevels.melee;
        this.runUpgrades.ranged = currentLevels.ranged;

        // Update option purchased counts to match actual levels
        this.options.forEach((option) => {
          if (option.type === "melee") {
            option.purchased = currentLevels.melee;
          } else if (option.type === "ranged") {
            option.purchased = currentLevels.ranged;
          }
        });

        log.debug(
          `Shop synced with weapon manager: melee ${currentLevels.melee}, ranged ${currentLevels.ranged}`
        );
      } else {
        log.warn("WeaponUpgradeManager not available for shop sync");
      }
    } catch (error) {
      log.error("Failed to sync shop with weapon upgrade manager:", error);
    }
  }
}
