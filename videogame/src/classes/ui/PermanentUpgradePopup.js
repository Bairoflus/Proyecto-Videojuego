// ===================================================
// PERMANENT UPGRADE POPUP - SHATTERED TIMELINE
// ===================================================
// Objective: Permanent upgrade popup
// Trigger: After killing a boss
// Options: Health (+15), Stamina (+20)
// ===================================================

import { PERMANENT_UPGRADES } from "../../constants/gameEnums.js";
import { applyPermanentUpgrade } from "../../utils/api.js";

export class PermanentUpgradePopup {
  constructor() {
    this.isActive = false;
    this.selectedUpgrade = null;
    this.userId = null;
    this.onUpgradeSelected = null;

    // DOM elements
    this.overlay = null;
    this.popup = null;
    this.upgradeButtons = [];
  }

  // ===================================================
  // CREATION OF UI
  // =  ==================================================

  /**
   * Crea los elementos HTML del popup
   */
  createPopupElements() {
    // Background overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "permanent-upgrade-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    // Popup principal
    this.popup = document.createElement("div");
    this.popup.className = "permanent-upgrade-popup";
    this.popup.style.cssText = `
      background: linear-gradient(135deg, #2c1810, #4a2c1a);
      border: 3px solid #d4af37;
      border-radius: 15px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
      animation: popup-appear 0.3s ease-out;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'BOSS DEFEATED!';
    title.style.cssText = `
      color: #d4af37;
      font-size: 2.5em;
      margin: 0 0 10px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      font-family: 'Orbitron', monospace;
    `;

    // Subtitle
    const subtitle = document.createElement("h2");
    subtitle.textContent = "Choose a Permanent Upgrade";
    subtitle.style.cssText = `
      color: #fff;
      font-size: 1.3em;
      margin: 0 0 30px 0;
      font-weight: normal;
    `;

    // Options container
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "upgrade-options";
    optionsContainer.style.cssText = `
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 20px;
    `;

    // Create upgrade buttons
    this.createUpgradeButtons(optionsContainer);

    // Warning
    const warning = document.createElement('p');
    warning.textContent = 'Choose wisely! This upgrade is permanent and cannot be changed.';
    warning.style.cssText = `
      color: #ff9800;
      font-size: 0.9em;
      margin: 20px 0 0 0;
      font-style: italic;
    `;

    // Assemble popup
    this.popup.appendChild(title);
    this.popup.appendChild(subtitle);
    this.popup.appendChild(optionsContainer);
    this.popup.appendChild(warning);

    this.overlay.appendChild(this.popup);

    // Add CSS animation
    this.addAnimationStyles();
  }

  /**
   * Creates the upgrade selection buttons
   */
  createUpgradeButtons(container) {
    const upgradeTypes = ['health_max', 'stamina_max'];

    upgradeTypes.forEach(upgradeType => {
      const upgradeInfo = PERMANENT_UPGRADES[upgradeType];

      const button = document.createElement("button");
      button.className = "upgrade-button";
      button.dataset.upgradeType = upgradeType;

      button.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
        border: 2px solid #555;
        border-radius: 10px;
        padding: 20px;
        width: 160px;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        font-family: inherit;
      `;

      // Icon
      const icon = document.createElement("div");
      icon.textContent = upgradeInfo.icon;
      icon.style.cssText = `
        font-size: 3em;
        margin-bottom: 10px;
      `;

      // Name
      const name = document.createElement("div");
      name.textContent = upgradeInfo.name;
      name.style.cssText = `
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 8px;
        color: #d4af37;
      `;

      // Description
      const description = document.createElement("div");
      description.textContent = upgradeInfo.description;
      description.style.cssText = `
        font-size: 0.9em;
        color: #ccc;
        line-height: 1.3;
      `;

      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(description);

      // Event listeners
      button.addEventListener("mouseenter", () => {
        button.style.borderColor = "#d4af37";
        button.style.background = "linear-gradient(135deg, #2d2d2d, #3d3d3d)";
        button.style.transform = "translateY(-3px)";
        button.style.boxShadow = "0 5px 15px rgba(212, 175, 55, 0.3)";
      });

      button.addEventListener("mouseleave", () => {
        if (this.selectedUpgrade !== upgradeType) {
          button.style.borderColor = "#555";
          button.style.background = "linear-gradient(135deg, #1a1a1a, #2d2d2d)";
          button.style.transform = "translateY(0)";
          button.style.boxShadow = "none";
        }
      });

      button.addEventListener("click", () => {
        this.selectUpgrade(upgradeType);
      });

      this.upgradeButtons.push(button);
      container.appendChild(button);
    });
  }

  /**
   * Adds CSS animation styles
   */
  addAnimationStyles() {
    if (!document.getElementById("permanent-upgrade-styles")) {
      const styles = document.createElement("style");
      styles.id = "permanent-upgrade-styles";
      styles.textContent = `
        @keyframes popup-appear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .upgrade-button:active {
          transform: translateY(1px) !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // ===================================================
  // LOGIC OF SELECTION
  // ===================================================

  /**
   * Selects an upgrade and updates the UI
   */
  selectUpgrade(upgradeType) {
    // Clear previous selection
    this.upgradeButtons.forEach((button) => {
      if (button.dataset.upgradeType !== upgradeType) {
        button.style.borderColor = "#555";
        button.style.background = "linear-gradient(135deg, #1a1a1a, #2d2d2d)";
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
      }
    });

    // Mark new upgrade selected
    const selectedButton = this.upgradeButtons.find(
      (button) => button.dataset.upgradeType === upgradeType
    );

    if (selectedButton) {
      selectedButton.style.borderColor = "#4caf50";
      selectedButton.style.background =
        "linear-gradient(135deg, #1b5e20, #2e7d32)";
      selectedButton.style.transform = "translateY(-3px)";
      selectedButton.style.boxShadow = "0 5px 15px rgba(76, 175, 80, 0.4)";
    }

    this.selectedUpgrade = upgradeType;

    // Create confirm button if it doesn't exist
    this.createConfirmButton();
  }

  /**
   * Creates the confirm button
   */
  createConfirmButton() {
    // Remove previous button if it exists
    const existingButton = this.popup.querySelector(".confirm-button");
    if (existingButton) {
      existingButton.remove();
    }

    const confirmButton = document.createElement("button");
    confirmButton.className = "confirm-button";
    confirmButton.textContent = "Confirm Selection";
    confirmButton.style.cssText = `
      background: linear-gradient(135deg, #4caf50, #66bb6a);
      border: none;
      border-radius: 8px;
      padding: 12px 30px;
      color: white;
      font-size: 1.1em;
      font-weight: bold;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.3s ease;
    `;

    confirmButton.addEventListener("mouseenter", () => {
      confirmButton.style.background =
        "linear-gradient(135deg, #66bb6a, #81c784)";
      confirmButton.style.transform = "translateY(-2px)";
    });

    confirmButton.addEventListener("mouseleave", () => {
      confirmButton.style.background =
        "linear-gradient(135deg, #4caf50, #66bb6a)";
      confirmButton.style.transform = "translateY(0)";
    });

    confirmButton.addEventListener("click", () => {
      this.confirmSelection();
    });

    this.popup.appendChild(confirmButton);
  }

  // ===================================================
  // MAIN METHODS
  // ===================================================

  /**
   * NEW: Muestra el popup de mejoras permanentes
   * @param {Function} callback - Callback cuando se selecciona upgrade
   */
  show(callback = null) {
    if (this.isActive) return;

    this.userId = localStorage.getItem("currentUserId");
    this.onUpgradeSelected = callback;
    this.selectedUpgrade = null;

    if (!this.userId) {
      console.warn("No userId found for permanent upgrade popup");
      return;
    }

    // NEW: Set game state to upgrade selection
    if (window.game) {
      window.game.gameState = "upgradeSelection";
    }

    // Create elements if they don't exist
    if (!this.overlay) {
      this.createPopupElements();
    }

    // Show popup
    document.body.appendChild(this.overlay);
    this.isActive = true;

    console.log("Permanent upgrade popup shown");
  }

  /**
   * NEW: Confirma la selección y aplica el upgrade
   */
  async confirmSelection() {
    if (!this.selectedUpgrade || !this.userId) {
      console.error("Cannot confirm: no upgrade selected or missing userId");
      return;
    }

    try {
      console.log(`Applying permanent upgrade: ${this.selectedUpgrade}`);

      // NEW: Use specific API function
      const response = await applyPermanentUpgrade(
        parseInt(this.userId),
        this.selectedUpgrade
      );

      if (response.success) {
        console.log(`Permanent upgrade applied: ${this.selectedUpgrade}`);

        // NEW: Apply upgrade to player immediately for visual feedback
        if (window.game && window.game.player) {
          this.applyUpgradeToPlayer(this.selectedUpgrade, window.game.player);
        }

        // Llamar callback si existe
        if (this.onUpgradeSelected) {
          this.onUpgradeSelected(this.selectedUpgrade);
        }

        // Ocultar popup
        this.hide();

        // REMOVED: Automatic floor transition - let player move manually
        // Player must now move to the edge to trigger floor transition
        console.log(
          "Upgrade complete - player can now move to next floor manually"
        );
      } else {
        console.error("Failed to apply permanent upgrade:", response.message);
        alert("Error applying upgrade. Please try again.");
      }
    } catch (error) {
      console.error("Error confirming selection:", error);
      alert("Network error. Please try again.");
    }
  }

  /**
   * NEW: Oculta el popup
   */
  hide() {
    if (!this.isActive) return;

    // NEW: Resume game state
    if (window.game) {
      window.game.gameState = "playing";
    }

    // Remove from DOM
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this.isActive = false;
    this.selectedUpgrade = null;
    this.userId = null;
    this.onUpgradeSelected = null;

    console.log("Permanent upgrade popup hidden");
  }

  /**
   * NEW: Draw method for canvas integration (if needed)
   */
  draw(ctx) {
    // This popup uses DOM elements, so no canvas drawing needed
    // But we keep this method for consistency with other game objects
  }

  /**
   * NEW: Apply permanent upgrade immediately to player for visual feedback
   * @param {string} upgradeType - Type of upgrade
   * @param {Player} player - Player instance
   */
  applyUpgradeToPlayer(upgradeType, player) {
    const upgradeInfo = PERMANENT_UPGRADES[upgradeType];
    if (!upgradeInfo) {
      console.warn(`Unknown upgrade type: ${upgradeType}`);
      return;
    }

    switch (upgradeType) {
      case "health_max":
        const oldMaxHealth = player.maxHealth;
        player.maxHealth += upgradeInfo.value;
        // Also increase current health
        player.health += upgradeInfo.value;
        console.log(
          `Health upgraded: ${oldMaxHealth} → ${player.maxHealth} (${upgradeInfo.description})`
        );
        break;

      case "stamina_max":
        const oldMaxStamina = player.maxStamina;
        player.maxStamina += upgradeInfo.value;
        // Also increase current stamina
        player.stamina += upgradeInfo.value;
        console.log(
          `Stamina upgraded: ${oldMaxStamina} → ${player.maxStamina} (${upgradeInfo.description})`
        );
        break;

      default:
        console.warn(`Unhandled upgrade type: ${upgradeType}`);
    }
  }

  // ===================================================
  // GETTERS
  // ===================================================

  /**
   * Checks if the popup is active
   */
  get visible() {
    return this.isActive;
  }
}

export default PermanentUpgradePopup;
