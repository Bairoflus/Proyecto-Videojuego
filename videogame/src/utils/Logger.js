/**
 * Configurable logging system
 * Provides different log levels to control console output
 * Reduces spam and improves performance by filtering unnecessary logs
 */
export class Logger {
  constructor() {
    this.LEVELS = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      VERBOSE: 4,
    };

    this.currentLevel = this.LEVELS.INFO; // Default to INFO level
    this.enabled = true; // Can be disabled in production
  }

  /**
   * Set the current logging level
   * @param {number} level - One of Logger.LEVELS values
   */
  setLevel(level) {
    this.currentLevel = level;
  }

  /**
   * Enable or disable logging
   * @param {boolean} enable - Whether to enable logging
   */
  setEnabled(enable) {
    this.enabled = enable;
  }

  /**
   * Log an error message (highest priority)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (this.enabled && this.currentLevel >= this.LEVELS.ERROR) {
      console.error("[ERROR]", ...args);
    }
  }

  /**
   * Log a warning message
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (this.enabled && this.currentLevel >= this.LEVELS.WARN) {
      console.warn("[WARN]", ...args);
    }
  }

  /**
   * Log an info message
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (this.enabled && this.currentLevel >= this.LEVELS.INFO) {
      console.log("[INFO]", ...args);
    }
  }

  /**
   * Log a debug message
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (this.enabled && this.currentLevel >= this.LEVELS.DEBUG) {
      console.log("[DEBUG]", ...args);
    }
  }

  /**
   * Log a verbose message (lowest priority)
   * @param {...any} args - Arguments to log
   */
  verbose(...args) {
    if (this.enabled && this.currentLevel >= this.LEVELS.VERBOSE) {
      console.log("[VERBOSE]", ...args);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export convenience object with bound methods
export const log = {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  setLevel: logger.setLevel.bind(logger),
  setEnabled: logger.setEnabled.bind(logger),
  LEVELS: logger.LEVELS,
};
