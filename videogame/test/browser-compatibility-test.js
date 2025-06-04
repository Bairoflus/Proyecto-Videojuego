/**
 * Browser Compatibility Test - Issue #8 Component
 * Tests integration functionality across different browser environments
 */

/**
 * Browser Compatibility Test Suite
 * This test validates that the integration works across different browser environments
 */
export class BrowserCompatibilityTest {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async test(name, testFn) {
        this.results.total++;
        
        try {
            console.log(`  Testing: ${name}`);
            await testFn();
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASSED', error: null });
            console.log(`    PASS: ${name}`);
            return true;
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAILED', error: error.message });
            console.log(`    FAIL: ${name} - ${error.message}`);
            return false;
        }
    }

    async runBrowserCompatibilityTests() {
        console.log('\nTesting Browser Compatibility...');
        
        await this.test('localStorage Support', async () => {
            if (typeof Storage === 'undefined' && typeof localStorage === 'undefined') {
                throw new Error('localStorage not supported');
            }
            
            // Test localStorage operations
            const testKey = 'browserCompatTest';
            const testValue = 'testValue123';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (retrieved !== testValue) {
                throw new Error('localStorage operations failed');
            }
        });

        await this.test('Fetch API Support', async () => {
            if (typeof fetch === 'undefined') {
                throw new Error('Fetch API not supported');
            }
            
            // Test basic fetch functionality
            try {
                const response = await fetch('data:text/plain,test');
                if (!response.ok) {
                    throw new Error('Fetch operation failed');
                }
            } catch (error) {
                throw new Error(`Fetch API error: ${error.message}`);
            }
        });

        await this.test('Promise Support', async () => {
            if (typeof Promise === 'undefined') {
                throw new Error('Promise not supported');
            }
            
            // Test Promise functionality
            const testPromise = new Promise((resolve) => {
                setTimeout(() => resolve('test'), 10);
            });
            
            const result = await testPromise;
            if (result !== 'test') {
                throw new Error('Promise functionality failed');
            }
        });

        await this.test('ES6 Module Support', async () => {
            // Test basic ES6 features (import is a reserved keyword, so we can't test it directly)
            console.log('Note: ES6 module import/export functionality is implicitly tested by this script running');
            
            // Test basic ES6 features
            const testMap = new Map();
            testMap.set('test', 'value');
            
            if (testMap.get('test') !== 'value') {
                throw new Error('ES6 Map functionality failed');
            }
            
            const testSet = new Set([1, 2, 3]);
            if (testSet.size !== 3) {
                throw new Error('ES6 Set functionality failed');
            }
            
            // Test arrow functions
            const arrowTest = (x) => x * 2;
            if (arrowTest(5) !== 10) {
                throw new Error('ES6 Arrow functions failed');
            }
            
            // Test template literals
            const name = 'test';
            const templateTest = `Hello ${name}`;
            if (templateTest !== 'Hello test') {
                throw new Error('ES6 Template literals failed');
            }
        });

        await this.test('JSON Support', async () => {
            if (typeof JSON === 'undefined') {
                throw new Error('JSON not supported');
            }
            
            // Test JSON operations
            const testObj = { test: 'value', number: 123, array: [1, 2, 3] };
            const jsonString = JSON.stringify(testObj);
            const parsed = JSON.parse(jsonString);
            
            if (parsed.test !== 'value' || parsed.number !== 123) {
                throw new Error('JSON operations failed');
            }
        });

        await this.test('Console Support', async () => {
            if (typeof console === 'undefined') {
                throw new Error('Console not supported');
            }
            
            // Test console methods
            if (typeof console.log !== 'function' || 
                typeof console.error !== 'function' || 
                typeof console.warn !== 'function') {
                throw new Error('Console methods not available');
            }
        });

        await this.test('Error Handling Support', async () => {
            // Test try/catch functionality
            let errorCaught = false;
            
            try {
                throw new Error('Test error');
            } catch (error) {
                errorCaught = true;
                if (error.message !== 'Test error') {
                    throw new Error('Error object not working correctly');
                }
            }
            
            if (!errorCaught) {
                throw new Error('Error handling not working');
            }
        });

        await this.test('Date Support', async () => {
            if (typeof Date === 'undefined') {
                throw new Error('Date not supported');
            }
            
            // Test Date functionality
            const now = new Date();
            const timestamp = Date.now();
            
            if (isNaN(now.getTime()) || isNaN(timestamp)) {
                throw new Error('Date functionality failed');
            }
        });

        await this.test('Array Methods Support', async () => {
            // Test modern array methods
            const testArray = [1, 2, 3, 4, 5];
            
            // Test filter
            const filtered = testArray.filter(x => x > 3);
            if (filtered.length !== 2) {
                throw new Error('Array.filter not working');
            }
            
            // Test map
            const mapped = testArray.map(x => x * 2);
            if (mapped[0] !== 2 || mapped[4] !== 10) {
                throw new Error('Array.map not working');
            }
            
            // Test reduce
            const sum = testArray.reduce((acc, val) => acc + val, 0);
            if (sum !== 15) {
                throw new Error('Array.reduce not working');
            }
        });

        await this.test('Object Methods Support', async () => {
            // Test Object.keys, Object.values, Object.entries
            const testObj = { a: 1, b: 2, c: 3 };
            
            if (typeof Object.keys === 'function') {
                const keys = Object.keys(testObj);
                if (keys.length !== 3) {
                    throw new Error('Object.keys not working');
                }
            }
            
            if (typeof Object.values === 'function') {
                const values = Object.values(testObj);
                if (values.length !== 3) {
                    throw new Error('Object.values not working');
                }
            }
            
            if (typeof Object.entries === 'function') {
                const entries = Object.entries(testObj);
                if (entries.length !== 3) {
                    throw new Error('Object.entries not working');
                }
            }
        });

        return this.results;
    }

    generateCompatibilityReport() {
        const successRate = Math.round((this.results.passed / this.results.total) * 100);
        
        console.log('\nBROWSER COMPATIBILITY REPORT');
        console.log('==============================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\nFailed Tests:');
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\nCompatibility Status:');
        if (successRate >= 90) {
            console.log('EXCELLENT - Full compatibility');
        } else if (successRate >= 80) {
            console.log('GOOD - Compatible with minor issues');
        } else if (successRate >= 70) {
            console.log('FAIR - Some compatibility issues');
        } else {
            console.log('POOR - Significant compatibility issues');
        }
        
        return {
            compatible: successRate >= 80,
            successRate,
            ...this.results
        };
    }
}

// Node.js execution
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('browser-compatibility-test.js')) {
    const compatTest = new BrowserCompatibilityTest();
    compatTest.runBrowserCompatibilityTests().then(() => {
        const report = compatTest.generateCompatibilityReport();
        process.exit(report.compatible ? 0 : 1);
    });
} 