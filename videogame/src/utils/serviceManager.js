/**
 * Service Manager - Backend Integration Services Orchestration
 * Coordinates initialization of all backend integration services with dependency management,
 * health monitoring, graceful degradation, and comprehensive error handling
 */

import { roomMapping } from './roomMapping.js';
import { enemyMappingService } from './enemyMapping.js';
import { loadBossData } from '../classes/config/gameConfig.js';

// Service status constants
export const SERVICE_STATUS = {
    PENDING: 'pending',
    INITIALIZING: 'initializing', 
    SUCCESS: 'success',
    FALLBACK: 'fallback',
    FAILED: 'failed',
    CRITICAL_FAILED: 'critical_failed'
};

// Service criticality levels
export const SERVICE_CRITICALITY = {
    CRITICAL: 'critical',     // Game cannot function without these
    IMPORTANT: 'important',   // Game degrades significantly without these
    OPTIONAL: 'optional'      // Game can function normally without these
};

class ServiceManager {
    constructor() {
        this.services = new Map();
        this.initializationPromise = null;
        this.isInitialized = false;
        this.lastInitializationTime = null;
        this.initializationAttempts = 0;
        this.maxRetryAttempts = 3;
        
        // Service registry with metadata
        this.registerServices();
    }

    /**
     * Register all backend integration services with their metadata
     */
    registerServices() {
        this.services.set('roomMapping', {
            name: 'Room Mapping Service',
            criticality: SERVICE_CRITICALITY.CRITICAL,
            status: SERVICE_STATUS.PENDING,
            initialize: () => roomMapping.initialize(),
            healthCheck: () => roomMapping.isInitialized(),
            dependencies: [],
            retryCount: 0,
            lastError: null,
            initializationTime: null
        });

        this.services.set('enemyMapping', {
            name: 'Enemy Mapping Service',
            criticality: SERVICE_CRITICALITY.CRITICAL,
            status: SERVICE_STATUS.PENDING,
            initialize: () => enemyMappingService.initialize(),
            healthCheck: () => enemyMappingService.isInitialized(),
            dependencies: [],
            retryCount: 0,
            lastError: null,
            initializationTime: null
        });

        this.services.set('bossData', {
            name: 'Boss Data Loading Service',
            criticality: SERVICE_CRITICALITY.IMPORTANT,
            status: SERVICE_STATUS.PENDING,
            initialize: async () => {
                const bossData = await loadBossData();
                return bossData.length > 0;
            },
            healthCheck: async () => {
                try {
                    // Use dynamic import to avoid circular dependency
                    const { gameConfig } = await import('../classes/config/gameConfig.js');
                    return gameConfig.bosses.loaded && !gameConfig.bosses.error;
                } catch (error) {
                    return false;
                }
            },
            dependencies: [],
            retryCount: 0,
            lastError: null,
            initializationTime: null
        });
    }

    /**
     * Initialize all backend integration services with orchestration
     * @param {Object} options - Initialization options
     * @param {boolean} options.blockOnCritical - Wait for critical services (default: true)
     * @param {number} options.timeout - Maximum time to wait for services (default: 30000ms)
     * @returns {Promise<Object>} Initialization results
     */
    async initializeServices(options = {}) {
        const {
            blockOnCritical = true,
            timeout = 30000
        } = options;

        // Prevent multiple simultaneous initializations
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationAttempts++;
        const startTime = Date.now();

        console.log('🚀 Starting Backend Integration Services Orchestration...');
        console.log(`📊 Initialization attempt: ${this.initializationAttempts}/${this.maxRetryAttempts}`);

        this.initializationPromise = this._performInitialization(blockOnCritical, timeout, startTime);
        
        try {
            const result = await this.initializationPromise;
            this.isInitialized = true;
            this.lastInitializationTime = Date.now();
            return result;
        } catch (error) {
            console.error('❌ Service orchestration failed:', error);
            throw error;
        } finally {
            this.initializationPromise = null;
        }
    }

    /**
     * Perform the actual service initialization with dependency management
     * @private
     */
    async _performInitialization(blockOnCritical, timeout, startTime) {
        const results = {
            success: true,
            criticalServicesFailed: false,
            services: {},
            totalTime: 0,
            errors: []
        };

        try {
            // Group services by criticality and dependencies
            const criticalServices = [];
            const importantServices = [];
            const optionalServices = [];

            for (const [serviceId, service] of this.services) {
                if (service.criticality === SERVICE_CRITICALITY.CRITICAL) {
                    criticalServices.push(serviceId);
                } else if (service.criticality === SERVICE_CRITICALITY.IMPORTANT) {
                    importantServices.push(serviceId);
                } else {
                    optionalServices.push(serviceId);
                }
            }

            // Phase 1: Initialize critical services in parallel
            console.log('🔥 Phase 1: Initializing critical services...');
            await this._initializeServiceGroup(criticalServices, results, 'critical');

            // Check if critical services failed
            const criticalFailures = criticalServices.filter(
                serviceId => results.services[serviceId]?.status === SERVICE_STATUS.FAILED
            );

            if (criticalFailures.length > 0) {
                results.criticalServicesFailed = true;
                if (blockOnCritical) {
                    throw new Error(`Critical services failed: ${criticalFailures.join(', ')}`);
                }
            }

            // Phase 2: Initialize important services
            console.log('⚡ Phase 2: Initializing important services...');
            await this._initializeServiceGroup(importantServices, results, 'important');

            // Phase 3: Initialize optional services
            console.log('🌟 Phase 3: Initializing optional services...');
            await this._initializeServiceGroup(optionalServices, results, 'optional');

            // Calculate total time
            results.totalTime = Date.now() - startTime;

            // Generate summary
            this._generateInitializationSummary(results);

            return results;

        } catch (error) {
            results.success = false;
            results.totalTime = Date.now() - startTime;
            results.errors.push(error.message);
            throw error;
        }
    }

    /**
     * Initialize a group of services in parallel
     * @private
     */
    async _initializeServiceGroup(serviceIds, results, phase) {
        if (serviceIds.length === 0) return;

        const servicePromises = serviceIds.map(serviceId => 
            this._initializeService(serviceId)
        );

        const serviceResults = await Promise.allSettled(servicePromises);

        // Process results
        serviceIds.forEach((serviceId, index) => {
            const result = serviceResults[index];
            const service = this.services.get(serviceId);

            if (result.status === 'fulfilled') {
                const success = result.value;
                service.status = success ? SERVICE_STATUS.SUCCESS : SERVICE_STATUS.FALLBACK;
                service.initializationTime = Date.now();
                
                results.services[serviceId] = {
                    name: service.name,
                    status: service.status,
                    criticality: service.criticality,
                    success: success,
                    initializationTime: service.initializationTime
                };

                console.log(`  ${success ? '✅' : '⚠️'} ${service.name}: ${service.status.toUpperCase()}`);
            } else {
                service.status = SERVICE_STATUS.FAILED;
                service.lastError = result.reason;
                service.retryCount++;

                results.services[serviceId] = {
                    name: service.name,
                    status: service.status,
                    criticality: service.criticality,
                    success: false,
                    error: result.reason.message,
                    retryCount: service.retryCount
                };

                console.log(`  ❌ ${service.name}: FAILED - ${result.reason.message}`);
                results.errors.push(`${service.name}: ${result.reason.message}`);
            }
        });
    }

    /**
     * Initialize a single service with retry logic
     * @private
     */
    async _initializeService(serviceId) {
        const service = this.services.get(serviceId);
        
        if (!service) {
            throw new Error(`Unknown service: ${serviceId}`);
        }

        service.status = SERVICE_STATUS.INITIALIZING;

        try {
            // Check dependencies first
            for (const depId of service.dependencies) {
                const dependency = this.services.get(depId);
                if (!dependency || dependency.status !== SERVICE_STATUS.SUCCESS) {
                    throw new Error(`Dependency ${depId} not available`);
                }
            }

            // Initialize the service
            const result = await service.initialize();
            return result;

        } catch (error) {
            // Retry logic for failed services
            if (service.retryCount < this.maxRetryAttempts && 
                service.criticality === SERVICE_CRITICALITY.CRITICAL) {
                
                console.log(`🔄 Retrying ${service.name} (attempt ${service.retryCount + 1}/${this.maxRetryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (service.retryCount + 1))); // Exponential backoff
                
                service.retryCount++;
                return this._initializeService(serviceId);
            }

            throw error;
        }
    }

    /**
     * Generate and log initialization summary
     * @private
     */
    _generateInitializationSummary(results) {
        console.log('\n📋 SERVICE INITIALIZATION SUMMARY');
        console.log('=====================================');
        
        const serviceStats = {
            critical: { total: 0, success: 0, fallback: 0, failed: 0 },
            important: { total: 0, success: 0, fallback: 0, failed: 0 },
            optional: { total: 0, success: 0, fallback: 0, failed: 0 }
        };

        // Calculate statistics
        for (const [serviceId, result] of Object.entries(results.services)) {
            const criticality = result.criticality;
            serviceStats[criticality].total++;
            
            if (result.status === SERVICE_STATUS.SUCCESS) {
                serviceStats[criticality].success++;
            } else if (result.status === SERVICE_STATUS.FALLBACK) {
                serviceStats[criticality].fallback++;
            } else {
                serviceStats[criticality].failed++;
            }
        }

        // Display statistics
        for (const [level, stats] of Object.entries(serviceStats)) {
            if (stats.total > 0) {
                const successRate = Math.round((stats.success / stats.total) * 100);
                console.log(`${level.toUpperCase()} Services: ${stats.success}/${stats.total} ✅ | ${stats.fallback} ⚠️ | ${stats.failed} ❌ (${successRate}% success)`);
            }
        }

        console.log(`Total Initialization Time: ${results.totalTime}ms`);
        console.log(`Overall Status: ${results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (results.errors.length > 0) {
            console.log('\nErrors:');
            results.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('=====================================\n');
    }

    /**
     * Perform health check on all services
     * @returns {Promise<Object>} Health status of all services
     */
    async performHealthCheck() {
        const healthStatus = {
            overall: true,
            services: {},
            timestamp: Date.now()
        };

        for (const [serviceId, service] of this.services) {
            try {
                const isHealthy = await service.healthCheck();
                healthStatus.services[serviceId] = {
                    name: service.name,
                    healthy: isHealthy,
                    status: service.status,
                    criticality: service.criticality
                };

                if (!isHealthy && service.criticality === SERVICE_CRITICALITY.CRITICAL) {
                    healthStatus.overall = false;
                }
            } catch (error) {
                healthStatus.services[serviceId] = {
                    name: service.name,
                    healthy: false,
                    status: SERVICE_STATUS.FAILED,
                    error: error.message
                };
                healthStatus.overall = false;
            }
        }

        return healthStatus;
    }

    /**
     * Get service status
     * @param {string} serviceId - Service identifier
     * @returns {Object} Service status information
     */
    getServiceStatus(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            return null;
        }

        return {
            name: service.name,
            status: service.status,
            criticality: service.criticality,
            retryCount: service.retryCount,
            lastError: service.lastError,
            initializationTime: service.initializationTime
        };
    }

    /**
     * Get overall initialization status
     * @returns {Object} Overall status information
     */
    getOverallStatus() {
        return {
            isInitialized: this.isInitialized,
            lastInitializationTime: this.lastInitializationTime,
            initializationAttempts: this.initializationAttempts,
            serviceCount: this.services.size
        };
    }

    /**
     * Restart failed services
     * @returns {Promise<Object>} Restart results
     */
    async restartFailedServices() {
        const failedServices = [];
        
        for (const [serviceId, service] of this.services) {
            if (service.status === SERVICE_STATUS.FAILED) {
                failedServices.push(serviceId);
            }
        }

        if (failedServices.length === 0) {
            return { success: true, restarted: 0 };
        }

        console.log(`🔄 Restarting ${failedServices.length} failed services...`);
        
        const results = {
            success: true,
            restarted: 0,
            failed: [],
            services: {}
        };

        await this._initializeServiceGroup(failedServices, results, 'restart');
        
        return results;
    }
}

// Export singleton instance
export const serviceManager = new ServiceManager(); 