/**
 * Service Manager Test Script
 * Simple test to validate Service Manager functionality
 */

// Mock localStorage for Node.js environment
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = value.toString(); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

// Mock window object
global.window = {};

// Mock console methods to capture output
const originalLog = console.log;
const originalError = console.error;
const logs = [];
const errors = [];

console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
};

console.error = (...args) => {
    errors.push(args.join(' '));
    originalError(...args);
};

async function testServiceManager() {
    console.log('🧪 Starting Service Manager Test Suite...\n');
    
    try {
        // Import the service manager
        const { serviceManager, SERVICE_STATUS, SERVICE_CRITICALITY } = await import('../src/utils/serviceManager.js');
        
        console.log('✅ Service Manager imported successfully');
        
        // Test 1: Check initial state
        console.log('\n📋 Test 1: Initial State');
        const initialStatus = serviceManager.getOverallStatus();
        console.log('Initial status:', initialStatus);
        
        // Test 2: Initialize services
        console.log('\n📋 Test 2: Service Initialization');
        const initResult = await serviceManager.initializeServices({
            blockOnCritical: false, // Don't block for testing
            timeout: 10000
        });
        
        console.log('Initialization result:', {
            success: initResult.success,
            criticalServicesFailed: initResult.criticalServicesFailed,
            totalTime: initResult.totalTime,
            serviceCount: Object.keys(initResult.services).length
        });
        
        // Test 3: Check individual service status
        console.log('\n📋 Test 3: Individual Service Status');
        const services = ['roomMapping', 'enemyMapping', 'bossData'];
        for (const serviceId of services) {
            const status = serviceManager.getServiceStatus(serviceId);
            console.log(`${serviceId}:`, {
                name: status?.name,
                status: status?.status,
                criticality: status?.criticality
            });
        }
        
        // Test 4: Health check
        console.log('\n📋 Test 4: Health Check');
        const healthStatus = await serviceManager.performHealthCheck();
        console.log('Health check result:', {
            overall: healthStatus.overall,
            serviceCount: Object.keys(healthStatus.services).length,
            healthyServices: Object.values(healthStatus.services).filter(s => s.healthy).length
        });
        
        // Test 5: Final status
        console.log('\n📋 Test 5: Final Status');
        const finalStatus = serviceManager.getOverallStatus();
        console.log('Final status:', finalStatus);
        
        console.log('\n🎉 Service Manager Test Suite: COMPLETED');
        return true;
        
    } catch (error) {
        console.error('❌ Test Suite Failed:', error);
        return false;
    }
}

// Run the test
testServiceManager().then(success => {
    console.log(`Test result: ${success ? 'SUCCESS' : 'FAILED'}`);
}).catch(error => {
    console.error('Test execution failed:', error);
}); 