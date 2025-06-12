/**
 * Enhanced Loading System - Phase 3.2 UX/UI Polish
 * Provides better loading states, error messages, and visual feedback
 */

export class EnhancedLoadingSystem {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.loadingElement = null;
    this.errorElement = null;
    this.activeLoadings = new Map();
    this.loadingQueue = [];

    // Configuration
    this.config = {
      showPercentage: true,
      animationDuration: 300,
      errorDisplayTime: 5000,
      maxConcurrentLoading: 3,
    };

    // Initialize UI elements
    this.initializeUI();

    // Setup cleanup
    this.setupCleanup();
  }

  // ===================================================
  // INITIALIZATION
  // ===================================================

  /**
   * Initialize loading UI elements
   */
  initializeUI() {
    this.createLoadingContainer();
    this.createErrorContainer();
    this.createProgressContainer();
  }

  /**
   * Create main loading container
   */
  createLoadingContainer() {
    this.loadingElement = document.createElement("div");
    this.loadingElement.id = "enhanced-loading-system";
    this.loadingElement.className = "loading-system hidden";

    this.loadingElement.innerHTML = `
            <div class="loading-backdrop"></div>
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner-circle"></div>
                    <div class="spinner-inner"></div>
                </div>
                <div class="loading-text">Loading...</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-percentage">0%</div>
                </div>
                <div class="loading-details"></div>
            </div>
        `;

    document.body.appendChild(this.loadingElement);
    this.addLoadingStyles();
  }

  /**
   * Create error message container
   */
  createErrorContainer() {
    this.errorElement = document.createElement("div");
    this.errorElement.id = "enhanced-error-system";
    this.errorElement.className = "error-system hidden";

    this.errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-message"></div>
                <div class="error-details"></div>
                <div class="error-actions">
                    <button class="error-retry">Retry</button>
                    <button class="error-dismiss">Dismiss</button>
                </div>
            </div>
        `;

    document.body.appendChild(this.errorElement);
    this.addErrorStyles();
  }

  /**
   * Create progress tracking container
   */
  createProgressContainer() {
    this.progressElement = document.createElement("div");
    this.progressElement.id = "loading-progress-tracker";
    this.progressElement.className = "progress-tracker hidden";

    document.body.appendChild(this.progressElement);
  }

  // ===================================================
  // LOADING MANAGEMENT
  // ===================================================

  /**
   * Show loading screen with enhanced features
   * @param {Object} options - Loading configuration
   */
  async showLoading(options = {}) {
    const loadingId = this.generateLoadingId();

    const config = {
      id: loadingId,
      text: options.text || "Loading...",
      details: options.details || "",
      showProgress: options.showProgress !== false,
      showPercentage: options.showPercentage !== false,
      contextual: options.contextual || false,
      priority: options.priority || "normal",
      estimatedTime: options.estimatedTime || null,
      ...options,
    };

    // Add to active loadings
    this.activeLoadings.set(loadingId, config);

    // Handle loading queue
    if (this.activeLoadings.size > this.config.maxConcurrentLoading) {
      this.loadingQueue.push(config);
      return loadingId;
    }

    await this.displayLoading(config);
    return loadingId;
  }

  /**
   * Display loading screen
   * @param {Object} config - Loading configuration
   */
  async displayLoading(config) {
    const loadingText = this.loadingElement.querySelector(".loading-text");
    const loadingDetails =
      this.loadingElement.querySelector(".loading-details");
    const progressContainer =
      this.loadingElement.querySelector(".loading-progress");

    // Update content
    loadingText.textContent = config.text;
    loadingDetails.textContent = config.details;

    // Show/hide progress based on config
    if (config.showProgress) {
      progressContainer.classList.remove("hidden");
    } else {
      progressContainer.classList.add("hidden");
    }

    // Show loading with animation
    this.loadingElement.classList.remove("hidden");
    await this.animateIn(this.loadingElement);

    // Start estimated time countdown if provided
    if (config.estimatedTime) {
      this.startTimeEstimation(config);
    }
  }

  /**
   * Update loading progress
   * @param {string} loadingId - Loading ID
   * @param {number} percentage - Progress percentage (0-100)
   * @param {string} text - Optional text update
   */
  updateProgress(loadingId, percentage, text = null) {
    const config = this.activeLoadings.get(loadingId);
    if (!config) return;

    const progressFill = this.loadingElement.querySelector(".progress-fill");
    const progressPercentage = this.loadingElement.querySelector(
      ".progress-percentage"
    );
    const loadingText = this.loadingElement.querySelector(".loading-text");

    // Update progress bar
    progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

    if (config.showPercentage) {
      progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    // Update text if provided
    if (text) {
      loadingText.textContent = text;
      config.text = text;
    }

    // Update config
    config.progress = percentage;
  }

  /**
   * Hide loading screen
   * @param {string} loadingId - Loading ID
   */
  async hideLoading(loadingId) {
    const config = this.activeLoadings.get(loadingId);
    if (!config) return;

    // Remove from active loadings
    this.activeLoadings.delete(loadingId);

    // If no more active loadings, hide the overlay
    if (this.activeLoadings.size === 0) {
      await this.animateOut(this.loadingElement);
      this.loadingElement.classList.add("hidden");
    }

    // Process queue
    this.processLoadingQueue();
  }

  /**
   * Process loading queue
   */
  processLoadingQueue() {
    if (
      this.loadingQueue.length > 0 &&
      this.activeLoadings.size < this.config.maxConcurrentLoading
    ) {
      const nextLoading = this.loadingQueue.shift();
      this.displayLoading(nextLoading);
    }
  }

  // ===================================================
  // ERROR HANDLING
  // ===================================================

  /**
   * Show enhanced error message
   * @param {Object} errorConfig - Error configuration
   */
  async showError(errorConfig) {
    const config = {
      message: errorConfig.message || "An error occurred",
      details: errorConfig.details || "",
      type: errorConfig.type || "error",
      action: errorConfig.action || null,
      retryCallback: errorConfig.retryCallback || null,
      dismissCallback: errorConfig.dismissCallback || null,
      autoHide: errorConfig.autoHide !== false,
      persistent: errorConfig.persistent || false,
      ...errorConfig,
    };

    await this.displayError(config);
  }

  /**
   * Display error message
   * @param {Object} config - Error configuration
   */
  async displayError(config) {
    const errorMessage = this.errorElement.querySelector(".error-message");
    const errorDetails = this.errorElement.querySelector(".error-details");
    const errorIcon = this.errorElement.querySelector(".error-icon");
    const retryButton = this.errorElement.querySelector(".error-retry");
    const dismissButton = this.errorElement.querySelector(".error-dismiss");

    // Update content
    errorMessage.textContent = config.message;
    errorDetails.textContent = config.details;

    // Update icon based on error type
    errorIcon.textContent = this.getErrorIcon(config.type);

    // Setup button handlers
    retryButton.onclick = () => this.handleErrorAction("retry", config);
    dismissButton.onclick = () => this.handleErrorAction("dismiss", config);

    // Show/hide buttons based on config
    retryButton.style.display = config.retryCallback ? "block" : "none";

    // Apply error type styling
    this.errorElement.className = `error-system error-${config.type}`;

    // Show error with animation
    this.errorElement.classList.remove("hidden");
    await this.animateIn(this.errorElement);

    // Auto-hide if configured
    if (config.autoHide && !config.persistent) {
      setTimeout(() => {
        this.hideError();
      }, this.config.errorDisplayTime);
    }
  }

  /**
   * Handle error actions
   * @param {string} action - Action type ('retry' or 'dismiss')
   * @param {Object} config - Error configuration
   */
  async handleErrorAction(action, config) {
    if (action === "retry" && config.retryCallback) {
      await this.hideError();
      config.retryCallback();
    } else if (action === "dismiss") {
      await this.hideError();
      if (config.dismissCallback) {
        config.dismissCallback();
      }
    }
  }

  /**
   * Hide error message
   */
  async hideError() {
    await this.animateOut(this.errorElement);
    this.errorElement.classList.add("hidden");
  }

  /**
   * Get error icon based on type
   * @param {string} type - Error type
   */
  getErrorIcon(type) {
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      network: "🌐",
      timeout: "⏱️",
      auth: "🔒",
    };

    return icons[type] || icons.error;
  }

  // ===================================================
  // VISUAL FEEDBACK
  // ===================================================

  /**
   * Show contextual loading indicator
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Options
   */
  showContextualLoading(element, options = {}) {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "contextual-loading";
    loadingOverlay.innerHTML = `
            <div class="contextual-spinner"></div>
            <div class="contextual-text">${options.text || "Loading..."}</div>
        `;

    element.style.position = "relative";
    element.appendChild(loadingOverlay);

    return {
      hide: () => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      },
    };
  }

  /**
   * Show success feedback
   * @param {string} message - Success message
   * @param {number} duration - Display duration
   */
  showSuccess(message, duration = 3000) {
    const successElement = document.createElement("div");
    successElement.className = "success-feedback";
    successElement.innerHTML = `
            <div class="success-icon">✅</div>
            <div class="success-message">${message}</div>
        `;

    document.body.appendChild(successElement);

    // Animate in
    setTimeout(() => successElement.classList.add("visible"), 100);

    // Auto remove
    setTimeout(() => {
      successElement.classList.remove("visible");
      setTimeout(() => {
        if (successElement.parentNode) {
          successElement.parentNode.removeChild(successElement);
        }
      }, 300);
    }, duration);
  }

  // ===================================================
  // ANIMATIONS
  // ===================================================

  /**
   * Animate element in
   * @param {HTMLElement} element - Element to animate
   */
  async animateIn(element) {
    return new Promise((resolve) => {
      element.style.opacity = "0";
      element.style.transform = "scale(0.9)";

      setTimeout(() => {
        element.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
        element.style.opacity = "1";
        element.style.transform = "scale(1)";

        setTimeout(resolve, this.config.animationDuration);
      }, 50);
    });
  }

  /**
   * Animate element out
   * @param {HTMLElement} element - Element to animate
   */
  async animateOut(element) {
    return new Promise((resolve) => {
      element.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
      element.style.opacity = "0";
      element.style.transform = "scale(0.9)";

      setTimeout(resolve, this.config.animationDuration);
    });
  }

  // ===================================================
  // UTILITY METHODS
  // ===================================================

  /**
   * Generate unique loading ID
   */
  generateLoadingId() {
    return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start time estimation countdown
   * @param {Object} config - Loading configuration
   */
  startTimeEstimation(config) {
    const startTime = Date.now();
    const estimatedTime = config.estimatedTime;

    const updateEstimation = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, estimatedTime - elapsed);
      const percentage = Math.min(100, (elapsed / estimatedTime) * 100);

      this.updateProgress(config.id, percentage);

      if (remaining > 0) {
        setTimeout(updateEstimation, 100);
      }
    };

    updateEstimation();
  }

  /**
   * Setup cleanup listeners
   */
  setupCleanup() {
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all active loadings
    this.activeLoadings.clear();
    this.loadingQueue.length = 0;

    // Remove UI elements
    if (this.loadingElement && this.loadingElement.parentNode) {
      this.loadingElement.parentNode.removeChild(this.loadingElement);
    }

    if (this.errorElement && this.errorElement.parentNode) {
      this.errorElement.parentNode.removeChild(this.errorElement);
    }

    if (this.progressElement && this.progressElement.parentNode) {
      this.progressElement.parentNode.removeChild(this.progressElement);
    }
  }

  // ===================================================
  // STYLES
  // ===================================================

  /**
   * Add loading system styles
   */
  addLoadingStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .loading-system {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .loading-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .loading-content {
                position: relative;
                background: white;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                min-width: 300px;
            }
            
            .loading-spinner {
                position: relative;
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
            }
            
            .spinner-circle {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 4px solid #f0f0f0;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .spinner-inner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                border: 2px solid #f0f0f0;
                border-bottom: 2px solid #3498db;
                border-radius: 50%;
                animation: spin 0.5s linear infinite reverse;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 15px;
            }
            
            .loading-progress {
                margin-bottom: 10px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3498db, #2980b9);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-percentage {
                font-size: 14px;
                color: #666;
            }
            
            .loading-details {
                font-size: 14px;
                color: #666;
                margin-top: 10px;
            }
            
            .hidden {
                display: none !important;
            }
        `;

    document.head.appendChild(style);
  }

  /**
   * Add error system styles
   */
  addErrorStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .error-system {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                max-width: 400px;
            }
            
            .error-content {
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                border-left: 4px solid #e74c3c;
            }
            
            .error-system.error-warning .error-content {
                border-left-color: #f39c12;
            }
            
            .error-system.error-info .error-content {
                border-left-color: #3498db;
            }
            
            .error-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .error-message {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }
            
            .error-details {
                font-size: 14px;
                color: #666;
                margin-bottom: 15px;
            }
            
            .error-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .error-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .error-retry {
                background: #3498db;
                color: white;
            }
            
            .error-retry:hover {
                background: #2980b9;
            }
            
            .error-dismiss {
                background: #ecf0f1;
                color: #333;
            }
            
            .error-dismiss:hover {
                background: #d5dbdb;
            }
            
            .success-feedback {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #2ecc71;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10001;
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .success-feedback.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .contextual-loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .contextual-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid #f0f0f0;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
        `;

    document.head.appendChild(style);
  }
}

// Export for use in game
export default EnhancedLoadingSystem;
