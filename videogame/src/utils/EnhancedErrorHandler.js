/**
 * Enhanced Error Handler - Phase 3.3 Robust Error Handling
 * Provides comprehensive error handling, recovery mechanisms, and offline support
 */

import { apiRequest } from './api.js';

export class EnhancedErrorHandler {
    constructor() {
        this.retryStrategies = new Map();
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            backoffMultiplier: 2,
            maxDelay: 10000
        };
        
        // Error categories and handling strategies
        this.errorTypes = {
            NETWORK: 'network',
            TIMEOUT: 'timeout',
            AUTH: 'authentication',
            VALIDATION: 'validation',
            SERVER: 'server',
            UNKNOWN: 'unknown'
        };
        
        // Recovery strategies
        this.recoveryStrategies = new Map();
        this.setupRecoveryStrategies();
        
        // Offline support
        this.setupOfflineSupport();
        
        // Error tracking
        this.errorMetrics = {
            totalErrors: 0,
            recoveredErrors: 0,
            networkErrors: 0,
            timeoutErrors: 0,
            authErrors: 0
        };
    }

    // ===================================================
    // INITIALIZATION AND SETUP
    // ===================================================

    /**
     * Setup recovery strategies for different error types
     */
    setupRecoveryStrategies() {
        this.recoveryStrategies.set(this.errorTypes.NETWORK, this.handleNetworkError.bind(this));
        this.recoveryStrategies.set(this.errorTypes.TIMEOUT, this.handleTimeoutError.bind(this));
        this.recoveryStrategies.set(this.errorTypes.AUTH, this.handleAuthError.bind(this));
        this.recoveryStrategies.set(this.errorTypes.VALIDATION, this.handleValidationError.bind(this));
        this.recoveryStrategies.set(this.errorTypes.SERVER, this.handleServerError.bind(this));
        this.recoveryStrategies.set(this.errorTypes.UNKNOWN, this.handleUnknownError.bind(this));
    }

    /**
     * Setup offline support and network monitoring
     */
    setupOfflineSupport() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Periodically check connection
        setInterval(() => this.checkConnection(), 30000);
    }

    // ===================================================
    // ENHANCED API REQUEST WITH ERROR HANDLING
    // ===================================================

    /**
     * Enhanced API request with automatic retry and error recovery
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {Object} retryConfig - Retry configuration
     */
    async apiRequestWithRetry(endpoint, options = {}, retryConfig = {}) {
        const config = { ...this.retryConfig, ...retryConfig };
        let lastError = null;
        
        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                // If offline, queue the request
                if (!this.isOnline) {
                    return await this.queueOfflineRequest(endpoint, options, config);
                }
                
                const response = await apiRequest(endpoint, options);
                
                // Success - reset error metrics for this endpoint
                this.recordSuccess(endpoint);
                return response;
                
            } catch (error) {
                lastError = error;
                this.recordError(error);
                
                const errorType = this.categorizeError(error);
                const shouldRetry = this.shouldRetry(error, attempt, config.maxRetries);
                
                if (!shouldRetry) {
                    break;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.calculateDelay(attempt, config);
                console.log(`Request failed (attempt ${attempt}/${config.maxRetries}), retrying in ${delay}ms...`);
                
                await this.wait(delay);
                
                // Try recovery strategy before retry
                await this.attemptRecovery(errorType, error, attempt);
            }
        }
        
        // All retries failed, apply recovery strategy
        return await this.handleFinalError(lastError, endpoint, options);
    }

    /**
     * Queue request for offline processing
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {Object} config - Retry configuration
     */
    async queueOfflineRequest(endpoint, options, config) {
        return new Promise((resolve, reject) => {
            const queuedRequest = {
                endpoint,
                options,
                config,
                resolve,
                reject,
                timestamp: Date.now(),
                id: this.generateRequestId()
            };
            
            this.offlineQueue.push(queuedRequest);
            console.log(`Request queued for offline processing: ${endpoint}`);
            
            // Return offline response if possible
            const offlineResponse = this.getOfflineResponse(endpoint, options);
            if (offlineResponse) {
                resolve(offlineResponse);
            }
        });
    }

    // ===================================================
    // ERROR CATEGORIZATION AND RECOVERY
    // ===================================================

    /**
     * Categorize error type for appropriate handling
     * @param {Error} error - Error to categorize
     */
    categorizeError(error) {
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            return this.errorTypes.NETWORK;
        }
        
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            return this.errorTypes.TIMEOUT;
        }
        
        if (error.status === 401 || error.status === 403) {
            return this.errorTypes.AUTH;
        }
        
        if (error.status >= 400 && error.status < 500) {
            return this.errorTypes.VALIDATION;
        }
        
        if (error.status >= 500) {
            return this.errorTypes.SERVER;
        }
        
        return this.errorTypes.UNKNOWN;
    }

    /**
     * Determine if error should trigger a retry
     * @param {Error} error - Error to check
     * @param {number} attempt - Current attempt number
     * @param {number} maxRetries - Maximum retry attempts
     */
    shouldRetry(error, attempt, maxRetries) {
        if (attempt >= maxRetries) return false;
        
        const errorType = this.categorizeError(error);
        
        // Network and timeout errors are always retryable
        if (errorType === this.errorTypes.NETWORK || errorType === this.errorTypes.TIMEOUT) {
            return true;
        }
        
        // Server errors (5xx) are retryable
        if (errorType === this.errorTypes.SERVER) {
            return true;
        }
        
        // Auth errors might be retryable if we can refresh token
        if (errorType === this.errorTypes.AUTH) {
            return this.canRefreshAuth();
        }
        
        // Validation errors are not retryable
        return false;
    }

    /**
     * Attempt error recovery before retry
     * @param {string} errorType - Type of error
     * @param {Error} error - Original error
     * @param {number} attempt - Current attempt number
     */
    async attemptRecovery(errorType, error, attempt) {
        const strategy = this.recoveryStrategies.get(errorType);
        if (strategy) {
            try {
                await strategy(error, attempt);
                this.errorMetrics.recoveredErrors++;
            } catch (recoveryError) {
                console.error('Recovery strategy failed:', recoveryError);
            }
        }
    }

    // ===================================================
    // SPECIFIC ERROR HANDLERS
    // ===================================================

    /**
     * Handle network errors
     * @param {Error} error - Network error
     * @param {number} attempt - Current attempt
     */
    async handleNetworkError(error, attempt) {
        this.errorMetrics.networkErrors++;
        
        // Check if we're actually offline
        if (!navigator.onLine) {
            this.handleOffline();
            return;
        }
        
        // Try to ping server to check connectivity
        try {
            await fetch('/ping', { method: 'HEAD', timeout: 5000 });
        } catch (pingError) {
            console.log('Server appears to be unreachable');
            // Maybe switch to cached responses or offline mode
        }
    }

    /**
     * Handle timeout errors
     * @param {Error} error - Timeout error
     * @param {number} attempt - Current attempt
     */
    async handleTimeoutError(error, attempt) {
        this.errorMetrics.timeoutErrors++;
        
        // Increase timeout for subsequent requests
        if (attempt > 1) {
            this.increaseTimeout();
        }
    }

    /**
     * Handle authentication errors
     * @param {Error} error - Authentication error
     * @param {number} attempt - Current attempt
     */
    async handleAuthError(error, attempt) {
        this.errorMetrics.authErrors++;
        
        // Try to refresh authentication token
        if (this.canRefreshAuth()) {
            try {
                await this.refreshAuthToken();
                console.log('Authentication token refreshed');
            } catch (refreshError) {
                console.error('Failed to refresh auth token:', refreshError);
                // Redirect to login or show auth error
                this.handleAuthFailure();
            }
        }
    }

    /**
     * Handle validation errors
     * @param {Error} error - Validation error
     * @param {number} attempt - Current attempt
     */
    async handleValidationError(error, attempt) {
        // Log validation error for debugging
        console.error('Validation error:', error);
        
        // These are usually not recoverable, but we can provide user feedback
        this.showUserFriendlyError(error);
    }

    /**
     * Handle server errors
     * @param {Error} error - Server error
     * @param {number} attempt - Current attempt
     */
    async handleServerError(error, attempt) {
        // Check if it's a known server issue
        if (error.status === 503) {
            console.log('Service temporarily unavailable');
            // Maybe show maintenance message
        }
        
        // For 500 errors, just retry with longer delay
        return;
    }

    /**
     * Handle unknown errors
     * @param {Error} error - Unknown error
     * @param {number} attempt - Current attempt
     */
    async handleUnknownError(error, attempt) {
        console.error('Unknown error occurred:', error);
        
        // Log for debugging
        this.logErrorForDebugging(error);
    }

    // ===================================================
    // OFFLINE SUPPORT
    // ===================================================

    /**
     * Handle going online
     */
    async handleOnline() {
        console.log('Connection restored, processing queued requests...');
        this.isOnline = true;
        
        // Process all queued requests
        await this.processOfflineQueue();
        
        // Notify user
        this.showConnectionRestored();
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        console.log('Connection lost, switching to offline mode...');
        this.isOnline = false;
        
        // Notify user about offline mode
        this.showOfflineMode();
        
        // Enable offline features
        this.enableOfflineMode();
    }

    /**
     * Process queued offline requests
     */
    async processOfflineQueue() {
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const request of queue) {
            try {
                const response = await apiRequest(request.endpoint, request.options);
                request.resolve(response);
            } catch (error) {
                // If still failing, re-queue or reject
                if (this.shouldRetry(error, 1, 3)) {
                    this.offlineQueue.push(request);
                } else {
                    request.reject(error);
                }
            }
        }
    }

    /**
     * Get offline response if available
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     */
    getOfflineResponse(endpoint, options) {
        // Check if we have cached response for GET requests
        if (options.method === 'GET' || !options.method) {
            return this.getCachedResponse(endpoint);
        }
        
        // For other methods, return offline indicator
        return {
            success: false,
            offline: true,
            message: 'Request queued for when connection is restored'
        };
    }

    /**
     * Check connection status
     */
    async checkConnection() {
        try {
            const response = await fetch('/ping', { 
                method: 'HEAD', 
                timeout: 5000,
                cache: 'no-cache'
            });
            
            if (!this.isOnline && response.ok) {
                this.handleOnline();
            }
        } catch (error) {
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    // ===================================================
    // UTILITY METHODS
    // ===================================================

    /**
     * Calculate delay with exponential backoff
     * @param {number} attempt - Current attempt number
     * @param {Object} config - Retry configuration
     */
    calculateDelay(attempt, config) {
        const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        return Math.min(delay, config.maxDelay);
    }

    /**
     * Wait for specified duration
     * @param {number} ms - Milliseconds to wait
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Record error metrics
     * @param {Error} error - Error to record
     */
    recordError(error) {
        this.errorMetrics.totalErrors++;
    }

    /**
     * Record successful request
     * @param {string} endpoint - Endpoint that succeeded
     */
    recordSuccess(endpoint) {
        // Could implement endpoint-specific success tracking
    }

    /**
     * Handle final error after all retries failed
     * @param {Error} error - Final error
     * @param {string} endpoint - Failed endpoint
     * @param {Object} options - Request options
     */
    async handleFinalError(error, endpoint, options) {
        console.error(`All retry attempts failed for ${endpoint}:`, error);
        
        // Try to provide fallback response
        const fallbackResponse = this.getFallbackResponse(endpoint, options);
        if (fallbackResponse) {
            return fallbackResponse;
        }
        
        // Show user-friendly error
        this.showUserFriendlyError(error);
        
        // Re-throw error for caller to handle
        throw error;
    }

    // ===================================================
    // USER INTERFACE HELPERS
    // ===================================================

    /**
     * Show user-friendly error message
     * @param {Error} error - Error to display
     */
    showUserFriendlyError(error) {
        const userMessage = this.getUserFriendlyMessage(error);
        
        // Use loading system to show error if available
        if (window.enhancedLoadingSystem) {
            window.enhancedLoadingSystem.showError({
                message: userMessage,
                type: this.categorizeError(error),
                retryCallback: () => {
                    // Could implement retry logic here
                }
            });
        } else {
            console.error('User-friendly error:', userMessage);
        }
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Error to translate
     */
    getUserFriendlyMessage(error) {
        const errorType = this.categorizeError(error);
        
        const messages = {
            [this.errorTypes.NETWORK]: 'Connection problem. Please check your internet connection.',
            [this.errorTypes.TIMEOUT]: 'Request timed out. Please try again.',
            [this.errorTypes.AUTH]: 'Authentication required. Please log in again.',
            [this.errorTypes.VALIDATION]: 'Invalid data provided. Please check your input.',
            [this.errorTypes.SERVER]: 'Server error occurred. Please try again later.',
            [this.errorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
        };
        
        return messages[errorType] || messages[this.errorTypes.UNKNOWN];
    }

    /**
     * Show offline mode notification
     */
    showOfflineMode() {
        if (window.enhancedLoadingSystem) {
            window.enhancedLoadingSystem.showError({
                message: 'You are currently offline',
                details: 'Some features may be limited. Changes will be saved when connection is restored.',
                type: 'warning',
                persistent: true,
                autoHide: false
            });
        }
    }

    /**
     * Show connection restored notification
     */
    showConnectionRestored() {
        if (window.enhancedLoadingSystem) {
            window.enhancedLoadingSystem.showSuccess('Connection restored! Syncing your changes...');
        }
    }

    // ===================================================
    // FALLBACK AND CACHE METHODS
    // ===================================================

    /**
     * Get fallback response for failed request
     * @param {string} endpoint - Failed endpoint
     * @param {Object} options - Request options
     */
    getFallbackResponse(endpoint, options) {
        // Could implement cached responses or default data
        return null;
    }

    /**
     * Get cached response for endpoint
     * @param {string} endpoint - API endpoint
     */
    getCachedResponse(endpoint) {
        // Could implement local storage cache
        return null;
    }

    /**
     * Enable offline mode features
     */
    enableOfflineMode() {
        // Could enable local storage, disable certain features, etc.
    }

    /**
     * Check if auth token can be refreshed
     */
    canRefreshAuth() {
        // Check if refresh token exists
        return localStorage.getItem('refreshToken') !== null;
    }

    /**
     * Refresh authentication token
     */
    async refreshAuthToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }
            
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            
            return data.token;
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            throw error;
        }
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure() {
        // Clear stored tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login or show login modal
        console.log('Authentication failed, please log in again');
    }

    /**
     * Increase timeout for subsequent requests
     */
    increaseTimeout() {
        // Could implement adaptive timeout increase
    }

    /**
     * Log error for debugging
     * @param {Error} error - Error to log
     */
    logErrorForDebugging(error) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Debug error info:', errorInfo);
        
        // Could send to error tracking service
    }

    /**
     * Get error metrics for monitoring
     */
    getErrorMetrics() {
        const total = this.errorMetrics.totalErrors;
        return {
            ...this.errorMetrics,
            recoveryRate: total > 0 ? (this.errorMetrics.recoveredErrors / total) * 100 : 0,
            offlineQueueSize: this.offlineQueue.length,
            isOnline: this.isOnline
        };
    }
}

// Create and export singleton instance
export const enhancedErrorHandler = new EnhancedErrorHandler();

// Enhanced API request function with error handling
export const apiRequestEnhanced = (endpoint, options = {}, retryConfig = {}) => {
    return enhancedErrorHandler.apiRequestWithRetry(endpoint, options, retryConfig);
};

export default enhancedErrorHandler; 