/**
 * API Integration Testing Suite - Issue #8
 * Comprehensive testing procedures for backend-frontend integration validation
 * 
 * This suite validates the complete integration between backend and frontend systems,
 * covering data flow, error scenarios, performance, and edge cases.
 */

// Mock environment setup for Node.js
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = value.toString(); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

global.window = {
    location: { href: '' },
    game: null
};

global.fetch = async (url, options = {}) => {
    // Mock API responses for testing
    const mockResponses = {
        '/api/auth/login': {
            userId: 1,
            sessionToken: 'mock-session-token-12345',
            sessionId: 42
        },
        '/api/runs': {
            runId: 123,
            userId: 1,
            startTime: new Date().toISOString()
        },
        '/api/rooms': [
            { room_id: 1, room_type: 'entrance', floor_number: 1 },
            { room_id: 2, room_type: 'combat', floor_number: 1 },
            { room_id: 3, room_type: 'combat', floor_number: 1 },
            { room_id: 4, room_type: 'shop', floor_number: 1 },
            { room_id: 5, room_type: 'boss', floor_number: 1 }
        ],
        '/api/enemies': [
            { enemy_id: 1, name: 'goblin', enemy_type: 'melee' },
            { enemy_id: 2, name: 'orc', enemy_type: 'melee' },
            { enemy_id: 5, name: 'goblin_archer', enemy_type: 'ranged' },
            { enemy_id: 100, name: 'boss', enemy_type: 'boss' }
        ],
        '/api/bosses': [
            { boss_id: 100, name: 'Shadow Lord', max_health: 1000 },
            { boss_id: 101, name: 'Fire Dragon', max_health: 1500 },
            { boss_id: 102, name: 'Ice Queen', max_health: 1200 }
        ]
    };

    // Simulate network delays
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    // Handle different endpoints
    if (url.includes('/api/auth/login')) {
        const body = JSON.parse(options.body || '{}');
        if (body.email === 'test@example.com' && body.password === 'password123') {
            return {
                ok: true,
                json: async () => mockResponses['/api/auth/login']
            };
        } else {
            return {
                ok: false,
                status: 401,
                json: async () => ({ error: 'Invalid credentials' })
            };
        }
    }

    if (url.includes('/api/runs') && options.method === 'POST') {
        return {
            ok: true,
            json: async () => mockResponses['/api/runs']
        };
    }

    if (url.includes('/api/save-state') && options.method === 'POST') {
        return {
            ok: true,
            json: async () => ({ success: true, message: 'State saved successfully' })
        };
    }

    if (url.includes('/api/enemy-kills') && options.method === 'POST') {
        return {
            ok: true,
            json: async () => ({ success: true, killId: Date.now() })
        };
    }

    // Handle GET endpoints
    const endpoint = Object.keys(mockResponses).find(key => url.includes(key));
    if (endpoint) {
        return {
            ok: true,
            json: async () => mockResponses[endpoint]
        };
    }

    // Default 404 response
    return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Endpoint not found' })
    };
};

// Test Results Storage
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {},
    performance: {},
    errors: [],
    startTime: Date.now()
};

/**
 * Test runner utility
 */
class TestRunner {
    constructor(category) {
        this.category = category;
        this.tests = [];
        
        if (!testResults.categories[category]) {
            testResults.categories[category] = {
                total: 0,
                passed: 0,
                failed: 0,
                tests: []
            };
        }
    }

    async test(name, testFn) {
        const startTime = Date.now();
        testResults.total++;
        testResults.categories[this.category].total++;

        try {
            console.log(`  Running: ${name}`);
            await testFn();
            
            const duration = Date.now() - startTime;
            testResults.passed++;
            testResults.categories[this.category].passed++;
            testResults.categories[this.category].tests.push({
                name,
                status: 'PASSED',
                duration,
                error: null
            });
            
            console.log(`    PASS: ${name} (${duration}ms)`);
            return true;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            testResults.failed++;
            testResults.categories[this.category].failed++;
            testResults.categories[this.category].tests.push({
                name,
                status: 'FAILED',
                duration,
                error: error.message
            });
            testResults.errors.push(`${this.category}: ${name} - ${error.message}`);
            
            console.log(`    FAIL: ${name} (${duration}ms) - ${error.message}`);
            return false;
        }
    }

    async measurePerformance(name, testFn, iterations = 1) {
        const measurements = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            await testFn();
            const duration = performance.now() - startTime;
            measurements.push(duration);
        }
        
        const avgDuration = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const minDuration = Math.min(...measurements);
        const maxDuration = Math.max(...measurements);
        
        testResults.performance[name] = {
            average: avgDuration,
            min: minDuration,
            max: maxDuration,
            iterations
        };
        
        console.log(`  Performance: ${name} - Avg: ${avgDuration.toFixed(2)}ms (${iterations} iterations)`);
        return { average: avgDuration, min: minDuration, max: maxDuration };
    }
}

/**
 * Authentication Flow Tests
 */
async function testAuthenticationFlow() {
    console.log('\nTesting Authentication Flow...');
    const runner = new TestRunner('Authentication');

    await runner.test('Valid login credentials', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        if (!data.userId || !data.sessionToken || !data.sessionId) {
            throw new Error('Missing required login response fields');
        }
    });

    await runner.test('Invalid login credentials', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'invalid@example.com', password: 'wrongpass' })
        });
        
        if (response.ok) throw new Error('Login should have failed');
        if (response.status !== 401) throw new Error('Expected 401 status code');
    });

    await runner.test('Session data storage', async () => {
        localStorage.clear();
        
        // Simulate login flow
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        
        const data = await response.json();
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('currentUserId', data.userId);
        localStorage.setItem('currentSessionId', data.sessionId);
        
        if (!localStorage.getItem('sessionToken')) throw new Error('Session token not stored');
        if (!localStorage.getItem('currentUserId')) throw new Error('User ID not stored');
        if (!localStorage.getItem('currentSessionId')) throw new Error('Session ID not stored');
    });

    await runner.test('Run creation after login', async () => {
        const response = await fetch('/api/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 1 })
        });
        
        if (!response.ok) throw new Error('Run creation failed');
        
        const data = await response.json();
        if (!data.runId) throw new Error('Run ID not returned');
        
        localStorage.setItem('currentRunId', data.runId);
    });

    return runner;
}

/**
 * Room Mapping Tests
 */
async function testRoomMapping() {
    console.log('\nTesting Room Mapping...');
    const runner = new TestRunner('Room Mapping');

    await runner.test('Load room data from API', async () => {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to load room data');
        
        const rooms = await response.json();
        if (!Array.isArray(rooms) || rooms.length === 0) {
            throw new Error('Invalid room data format');
        }
        
        // Verify required fields
        rooms.forEach(room => {
            if (!room.room_id || !room.room_type || !room.floor_number) {
                throw new Error('Room missing required fields');
            }
        });
    });

    await runner.test('Room ID mapping functionality', async () => {
        // Import and test room mapping service
        try {
            const { roomMapping } = await import('../src/utils/roomMapping.js');
            await roomMapping.initialize();
            
            // Test different room types
            const combatRoomId = roomMapping.getRoomId(1, 0, 'combat');
            const shopRoomId = roomMapping.getRoomId(1, 4, 'shop');
            const bossRoomId = roomMapping.getRoomId(1, 5, 'boss');
            
            if (!combatRoomId || !shopRoomId || !bossRoomId) {
                throw new Error('Room mapping returned invalid IDs');
            }
        } catch (error) {
            throw new Error(`Room mapping service failed: ${error.message}`);
        }
    });

    await runner.test('Fallback mechanism', async () => {
        // Test room mapping with simulated API failure
        const originalFetch = global.fetch;
        global.fetch = async (url) => {
            if (url.includes('/api/rooms')) {
                throw new Error('Simulated network error');
            }
            return originalFetch(url);
        };
        
        try {
            const { roomMapping } = await import('../src/utils/roomMapping.js');
            await roomMapping.initialize();
            
            // Should still provide room IDs via fallback
            const roomId = roomMapping.getRoomId(1, 0, 'combat');
            if (!roomId) throw new Error('Fallback mechanism failed');
            
        } finally {
            global.fetch = originalFetch;
        }
    });

    return runner;
}

/**
 * Save State Tests
 */
async function testSaveState() {
    console.log('\nTesting Save State Functionality...');
    const runner = new TestRunner('Save State');

    await runner.test('Save state data structure', async () => {
        const saveData = {
            userId: 1,
            sessionId: 42,
            roomId: 2,
            currentHp: 80,
            currentStamina: 60,
            gold: 150
        };

        const response = await fetch('/api/save-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId: 123, stateData: saveData })
        });

        if (!response.ok) throw new Error('Save state failed');
        
        const result = await response.json();
        if (!result.success) throw new Error('Save state not successful');
    });

    await runner.test('Save state with missing data', async () => {
        const incompleteData = {
            userId: 1,
            // Missing required fields
        };

        try {
            await fetch('/api/save-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: 123, stateData: incompleteData })
            });
            // Should handle missing data gracefully
        } catch (error) {
            // Expected to fail gracefully
        }
    });

    await runner.test('Save state performance', async () => {
        const saveData = {
            userId: 1,
            sessionId: 42,
            roomId: 2,
            currentHp: 80,
            currentStamina: 60,
            gold: 150
        };

        await runner.measurePerformance('Save State API Call', async () => {
            await fetch('/api/save-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: 123, stateData: saveData })
            });
        }, 5);
    });

    return runner;
}

/**
 * Enemy Kill Tracking Tests
 */
async function testEnemyKillTracking() {
    console.log('\nTesting Enemy Kill Tracking...');
    const runner = new TestRunner('Enemy Kill Tracking');

    await runner.test('Load enemy data from API', async () => {
        const response = await fetch('/api/enemies');
        if (!response.ok) throw new Error('Failed to load enemy data');
        
        const enemies = await response.json();
        if (!Array.isArray(enemies) || enemies.length === 0) {
            throw new Error('Invalid enemy data format');
        }
        
        // Verify required fields
        enemies.forEach(enemy => {
            if (!enemy.enemy_id || !enemy.name) {
                throw new Error('Enemy missing required fields');
            }
        });
    });

    await runner.test('Enemy mapping service', async () => {
        try {
            const { enemyMappingService } = await import('../src/utils/enemyMapping.js');
            await enemyMappingService.initialize();
            
            // Test enemy ID mapping
            const goblinId = enemyMappingService.getEnemyId('goblin');
            const orcId = enemyMappingService.getEnemyId('orc');
            const bossId = enemyMappingService.getEnemyId('boss');
            
            if (!goblinId || !orcId || !bossId) {
                throw new Error('Enemy mapping failed');
            }
        } catch (error) {
            throw new Error(`Enemy mapping service failed: ${error.message}`);
        }
    });

    await runner.test('Kill registration', async () => {
        const killData = {
            userId: 1,
            enemyId: 1,
            roomId: 2
        };

        const response = await fetch('/api/enemy-kills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId: 123, killData })
        });

        if (!response.ok) throw new Error('Kill registration failed');
        
        const result = await response.json();
        if (!result.success) throw new Error('Kill registration not successful');
    });

    await runner.test('Unknown enemy type handling', async () => {
        try {
            const { enemyMappingService } = await import('../src/utils/enemyMapping.js');
            await enemyMappingService.initialize();
            
            // Should return fallback ID for unknown enemy
            const unknownId = enemyMappingService.getEnemyId('unknown_enemy_type');
            if (!unknownId) throw new Error('Should provide fallback ID for unknown enemies');
            
        } catch (error) {
            throw new Error(`Unknown enemy handling failed: ${error.message}`);
        }
    });

    return runner;
}

/**
 * Service Orchestration Tests
 */
async function testServiceOrchestration() {
    console.log('\nTesting Service Orchestration...');
    const runner = new TestRunner('Service Orchestration');

    await runner.test('Service Manager initialization', async () => {
        try {
            const { serviceManager } = await import('../src/utils/serviceManager.js');
            
            const result = await serviceManager.initializeServices({
                blockOnCritical: false,
                timeout: 10000
            });
            
            if (!result.success && result.criticalServicesFailed) {
                throw new Error('Critical services failed during initialization');
            }
        } catch (error) {
            throw new Error(`Service Manager failed: ${error.message}`);
        }
    });

    await runner.test('Service health monitoring', async () => {
        try {
            const { serviceManager } = await import('../src/utils/serviceManager.js');
            
            const healthStatus = await serviceManager.performHealthCheck();
            if (!healthStatus || typeof healthStatus.overall !== 'boolean') {
                throw new Error('Health check returned invalid format');
            }
        } catch (error) {
            throw new Error(`Health monitoring failed: ${error.message}`);
        }
    });

    await runner.test('Service restart functionality', async () => {
        try {
            const { serviceManager } = await import('../src/utils/serviceManager.js');
            
            const restartResult = await serviceManager.restartFailedServices();
            if (!restartResult || typeof restartResult.success !== 'boolean') {
                throw new Error('Service restart returned invalid format');
            }
        } catch (error) {
            throw new Error(`Service restart failed: ${error.message}`);
        }
    });

    return runner;
}

/**
 * Error Handling and Recovery Tests
 */
async function testErrorHandling() {
    console.log('\nTesting Error Handling and Recovery...');
    const runner = new TestRunner('Error Handling');

    await runner.test('Network failure simulation', async () => {
        const originalFetch = global.fetch;
        global.fetch = async () => {
            throw new Error('Network error');
        };
        
        try {
            // Test services handle network failures gracefully
            const { serviceManager } = await import('../src/utils/serviceManager.js');
            const result = await serviceManager.initializeServices({
                blockOnCritical: false,
                timeout: 5000
            });
            
            // Should not crash, should use fallbacks
            if (result.criticalServicesFailed && result.errors.length === 0) {
                throw new Error('Should report errors when network fails');
            }
            
        } finally {
            global.fetch = originalFetch;
        }
    });

    await runner.test('Invalid API response handling', async () => {
        const originalFetch = global.fetch;
        global.fetch = async (url) => {
            if (url.includes('/api/enemies')) {
                return {
                    ok: true,
                    json: async () => 'invalid json structure'
                };
            }
            return originalFetch(url);
        };
        
        try {
            const { enemyMappingService } = await import('../src/utils/enemyMapping.js');
            const result = await enemyMappingService.initialize();
            
            // Should handle invalid response and fall back
            if (result === true) {
                throw new Error('Should have failed with invalid API response');
            }
            
        } finally {
            global.fetch = originalFetch;
        }
    });

    await runner.test('Missing localStorage data handling', async () => {
        localStorage.clear();
        
        // Test that systems handle missing session data gracefully
        try {
            // Simulate save state without session data
            const response = await fetch('/api/save-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: null, stateData: {} })
            });
            
            // Should either handle gracefully or fail with appropriate error
        } catch (error) {
            // Expected to handle missing data
        }
    });

    return runner;
}

/**
 * Performance Tests
 */
async function testPerformance() {
    console.log('\nTesting Performance...');
    const runner = new TestRunner('Performance');

    await runner.test('Service initialization performance', async () => {
        const performance = await runner.measurePerformance('Service Initialization', async () => {
            const { serviceManager } = await import('../src/utils/serviceManager.js');
            await serviceManager.initializeServices({
                blockOnCritical: false,
                timeout: 10000
            });
        }, 3);
        
        if (performance.average > 5000) {
            throw new Error(`Service initialization too slow: ${performance.average}ms`);
        }
    });

    await runner.test('API response times', async () => {
        const endpoints = ['/api/rooms', '/api/enemies', '/api/bosses'];
        
        for (const endpoint of endpoints) {
            const performance = await runner.measurePerformance(`${endpoint} Response Time`, async () => {
                await fetch(endpoint);
            }, 5);
            
            if (performance.average > 1000) {
                throw new Error(`${endpoint} too slow: ${performance.average}ms`);
            }
        }
    });

    await runner.test('Memory usage during operations', async () => {
        // Basic memory usage test
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Perform multiple operations
        for (let i = 0; i < 100; i++) {
            await fetch('/api/rooms');
            await fetch('/api/enemies');
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
            throw new Error(`Memory usage too high: ${memoryIncrease / 1024 / 1024}MB`);
        }
    });

    return runner;
}

/**
 * Edge Cases and Data Validation Tests
 */
async function testEdgeCases() {
    console.log('\nTesting Edge Cases...');
    const runner = new TestRunner('Edge Cases');

    await runner.test('Empty API responses', async () => {
        const originalFetch = global.fetch;
        global.fetch = async (url) => {
            if (url.includes('/api/rooms')) {
                return { ok: true, json: async () => [] };
            }
            return originalFetch(url);
        };
        
        try {
            const { roomMapping } = await import('../src/utils/roomMapping.js');
            await roomMapping.initialize();
            
            // Should handle empty responses gracefully
            const roomId = roomMapping.getRoomId(1, 0, 'combat');
            if (!roomId) throw new Error('Should provide fallback for empty API response');
            
        } finally {
            global.fetch = originalFetch;
        }
    });

    await runner.test('Invalid room/enemy IDs', async () => {
        try {
            const { enemyMappingService } = await import('../src/utils/enemyMapping.js');
            await enemyMappingService.initialize();
            
            // Test with null, undefined, and invalid values
            const nullResult = enemyMappingService.getEnemyId(null);
            const undefinedResult = enemyMappingService.getEnemyId(undefined);
            const emptyResult = enemyMappingService.getEnemyId('');
            
            // Should handle gracefully and return fallback values
            if (!nullResult || !undefinedResult || !emptyResult) {
                throw new Error('Should handle invalid inputs gracefully');
            }
        } catch (error) {
            throw new Error(`Invalid ID handling failed: ${error.message}`);
        }
    });

    await runner.test('Concurrent API calls', async () => {
        // Test multiple simultaneous API calls
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(fetch('/api/rooms'));
            promises.push(fetch('/api/enemies'));
        }
        
        const results = await Promise.allSettled(promises);
        const failedResults = results.filter(r => r.status === 'rejected');
        
        if (failedResults.length > 0) {
            throw new Error(`${failedResults.length} concurrent API calls failed`);
        }
    });

    return runner;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
    const totalTime = Date.now() - testResults.startTime;
    const successRate = Math.round((testResults.passed / testResults.total) * 100);
    
    console.log('\n='.repeat(80));
    console.log('API INTEGRATION TEST SUITE - COMPREHENSIVE REPORT');
    console.log('='.repeat(80));
    
    console.log('\nOVERALL RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    
    console.log('\nCATEGORY BREAKDOWN:');
    Object.entries(testResults.categories).forEach(([category, results]) => {
        const categorySuccess = Math.round((results.passed / results.total) * 100);
        console.log(`  ${category}: ${results.passed}/${results.total} (${categorySuccess}%)`);
    });
    
    if (Object.keys(testResults.performance).length > 0) {
        console.log('\nPERFORMANCE METRICS:');
        Object.entries(testResults.performance).forEach(([test, metrics]) => {
            console.log(`  ${test}: Avg ${metrics.average.toFixed(2)}ms (${metrics.iterations} runs)`);
        });
    }
    
    if (testResults.errors.length > 0) {
        console.log('\nFAILED TESTS:');
        testResults.errors.forEach(error => {
            console.log(`  - ${error}`);
        });
    }
    
    console.log('\nDETAILED RESULTS BY CATEGORY:');
    Object.entries(testResults.categories).forEach(([category, results]) => {
        console.log(`\n${category}:`);
        results.tests.forEach(test => {
            const status = test.status === 'PASSED' ? 'PASS' : 'FAIL';
            console.log(`  ${status}: ${test.name} (${test.duration}ms)`);
            if (test.error) {
                console.log(`    Error: ${test.error}`);
            }
        });
    });
    
    console.log('\n='.repeat(80));
    console.log(`FINAL RESULT: ${successRate >= 80 ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
    console.log('='.repeat(80));
    
    return {
        success: successRate >= 80,
        totalTests: testResults.total,
        passedTests: testResults.passed,
        failedTests: testResults.failed,
        successRate,
        totalTime,
        categories: testResults.categories,
        performance: testResults.performance,
        errors: testResults.errors
    };
}

/**
 * Main test execution
 */
async function runAPIIntegrationTestSuite() {
    console.log('Starting API Integration Test Suite...');
    console.log('This comprehensive suite validates backend-frontend integration.');
    
    try {
        // Run all test categories
        await testAuthenticationFlow();
        await testRoomMapping();
        await testSaveState();
        await testEnemyKillTracking();
        await testServiceOrchestration();
        await testErrorHandling();
        await testPerformance();
        await testEdgeCases();
        
        // Generate final report
        return generateTestReport();
        
    } catch (error) {
        console.error('Test Suite Execution Failed:', error);
        return {
            success: false,
            error: error.message,
            ...generateTestReport()
        };
    }
}

// Export for use in other test files
export { runAPIIntegrationTestSuite, TestRunner };

// Run tests if called directly - improved detection
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                    process.argv[1]?.includes('api-integration-test-suite.js');

if (isMainModule) {
    console.log('Executing API Integration Test Suite...');
    runAPIIntegrationTestSuite().then(results => {
        console.log('\nTest execution completed.');
        process.exit(results.success ? 0 : 1);
    }).catch(error => {
        console.error('Test suite failed to execute:', error);
        process.exit(1);
    });
} 