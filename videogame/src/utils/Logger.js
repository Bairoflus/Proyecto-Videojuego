/**
 * Configurable logging system for the game
 * Allows different log levels and can be disabled in production
 */
export class Logger {
    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        VERBOSE: 4
    };

    static currentLevel = Logger.LOG_LEVELS.INFO; // Default to INFO level
    static enabled = true; // Can be disabled in production

    /**
     * Set the current logging level
     * @param {number} level - One of Logger.LOG_LEVELS values
     */
    static setLevel(level) {
        Logger.currentLevel = level;
    }

    /**
     * Enable or disable logging
     * @param {boolean} enable - Whether to enable logging
     */
    static setEnabled(enable) {
        Logger.enabled = enable;
    }

    /**
     * Log an error message (highest priority)
     * @param {...any} args - Arguments to log
     */
    static error(...args) {
        if (Logger.enabled && Logger.currentLevel >= Logger.LOG_LEVELS.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }

    /**
     * Log a warning message
     * @param {...any} args - Arguments to log
     */
    static warn(...args) {
        if (Logger.enabled && Logger.currentLevel >= Logger.LOG_LEVELS.WARN) {
            console.warn('[WARN]', ...args);
        }
    }

    /**
     * Log an info message
     * @param {...any} args - Arguments to log
     */
    static info(...args) {
        if (Logger.enabled && Logger.currentLevel >= Logger.LOG_LEVELS.INFO) {
            console.log('[INFO]', ...args);
        }
    }

    /**
     * Log a debug message
     * @param {...any} args - Arguments to log
     */
    static debug(...args) {
        if (Logger.enabled && Logger.currentLevel >= Logger.LOG_LEVELS.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }

    /**
     * Log a verbose message (lowest priority)
     * @param {...any} args - Arguments to log
     */
    static verbose(...args) {
        if (Logger.enabled && Logger.currentLevel >= Logger.LOG_LEVELS.VERBOSE) {
            console.log('[VERBOSE]', ...args);
        }
    }
}

// Export convenience functions
export const log = {
    error: Logger.error.bind(Logger),
    warn: Logger.warn.bind(Logger),
    info: Logger.info.bind(Logger),
    debug: Logger.debug.bind(Logger),
    verbose: Logger.verbose.bind(Logger),
    setLevel: Logger.setLevel.bind(Logger),
    setEnabled: Logger.setEnabled.bind(Logger),
    LEVELS: Logger.LOG_LEVELS
}; 