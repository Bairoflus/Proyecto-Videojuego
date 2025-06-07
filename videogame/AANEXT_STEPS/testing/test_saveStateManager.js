/**
 * SaveStateManager Test Suite
 * Tests all functionality of the save state management system
 */

import { saveStateManager } from '../src/utils/saveStateManager.js';

class SaveStateManagerTest {
    constructor() {
        this.testResults = [];
        this.userId = 1; // Test user ID
        this.testGameState = {
            userId: 1,
            sessionId: 1,
            runId: 1,
            roomId: 3,
            currentHp: 85,
            currentStamina: 70,
            gold: 150
        };
    }

    log(message, isError = false) {
        const timestamp = new Date().toISOString();
        const prefix = isError ? '[ERROR]' : '[INFO]';
        console.log(`${timestamp} ${prefix} ${message}`);
    }

    async addTestResult(testName, success, details = '', error = null) {
        this.testResults.push({
            test: testName,
            success,
            details,
            error: error ? error.message : null,
            timestamp: new Date().toISOString()
        });

        const status = success ? 'PASS' : 'FAIL';
        this.log(`${testName}: ${status} - ${details}`, !success);
        
        if (error) {
            this.log(`Error details: ${error.message}`, true);
        }
    }

    async runAllTests() {
        this.log('Starting SaveStateManager Test Suite');
        this.log('='.repeat(50));

        try {
            await this.testInitializeAndLoad();
            await this.testSaveOperations();
            await this.testClearOperations();
            await this.testAutoSaveFunctionality();
            await this.testErrorHandling();
            
            this.displayResults();
        } catch (error) {
            this.log(`Test suite failed with error: ${error.message}`, true);
        }
    }

    async testInitializeAndLoad() {
        this.log('Testing Initialize and Load State functionality...');

        // Test 1: Load state with no existing data
        try {
            const result = await saveStateManager.loadSaveState(999); // Non-existent user
            await this.addTestResult(
                'Load state - no existing data',
                result === null,
                'Should return null for non-existent user'
            );
        } catch (error) {
            await this.addTestResult(
                'Load state - no existing data',
                false,
                'Failed to handle non-existent user',
                error
            );
        }

        // Test 2: getCurrentSaveState with no data
        try {
            const currentState = saveStateManager.getCurrentSaveState();
            await this.addTestResult(
                'Get current state - no data',
                currentState === null,
                'Should return null when no save state loaded'
            );
        } catch (error) {
            await this.addTestResult(
                'Get current state - no data',
                false,
                'Failed to handle empty state',
                error
            );
        }

        // Test 3: hasSaveState with no data
        try {
            const hasState = saveStateManager.hasSaveState();
            await this.addTestResult(
                'Has save state - no data',
                hasState === false,
                'Should return false when no save state exists'
            );
        } catch (error) {
            await this.addTestResult(
                'Has save state - no data',
                false,
                'Failed to check state existence',
                error
            );
        }
    }

    async testSaveOperations() {
        this.log('Testing Save Operations...');

        // Test 1: Save current state (auto-save)
        try {
            const result = await saveStateManager.saveCurrentState(this.testGameState, false);
            await this.addTestResult(
                'Save current state - auto-save',
                result === true,
                'Auto-save should complete successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Save current state - auto-save',
                false,
                'Auto-save failed',
                error
            );
        }

        // Test 2: Save current state (logout)
        try {
            const result = await saveStateManager.saveCurrentState(this.testGameState, true);
            await this.addTestResult(
                'Save current state - logout',
                result === true,
                'Logout save should complete successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Save current state - logout',
                false,
                'Logout save failed',
                error
            );
        }

        // Test 3: Verify state was saved by loading it
        try {
            const loadedState = await saveStateManager.loadSaveState(this.userId);
            const isValid = loadedState && 
                           loadedState.roomId === this.testGameState.roomId &&
                           loadedState.currentHp === this.testGameState.currentHp &&
                           loadedState.gold === this.testGameState.gold;
            
            await this.addTestResult(
                'Verify state persistence',
                isValid,
                'Saved state should match original data'
            );
        } catch (error) {
            await this.addTestResult(
                'Verify state persistence',
                false,
                'Failed to verify saved state',
                error
            );
        }
    }

    async testClearOperations() {
        this.log('Testing Clear Operations...');

        // Test 1: Clear save state
        try {
            const result = await saveStateManager.clearSaveState(this.userId);
            await this.addTestResult(
                'Clear save state',
                result === true,
                'Clear operation should complete successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Clear save state',
                false,
                'Clear operation failed',
                error
            );
        }

        // Test 2: Verify state was cleared
        try {
            const clearedState = saveStateManager.getCurrentSaveState();
            await this.addTestResult(
                'Verify state cleared',
                clearedState === null,
                'Current state should be null after clearing'
            );
        } catch (error) {
            await this.addTestResult(
                'Verify state cleared',
                false,
                'Failed to verify state clearing',
                error
            );
        }

        // Test 3: Verify database state cleared
        try {
            const loadedState = await saveStateManager.loadSaveState(this.userId);
            await this.addTestResult(
                'Verify database cleared',
                loadedState === null,
                'Database should have no active save state'
            );
        } catch (error) {
            await this.addTestResult(
                'Verify database cleared',
                false,
                'Failed to verify database clearing',
                error
            );
        }
    }

    async testAutoSaveFunctionality() {
        this.log('Testing Auto-save Functionality...');

        let autoSaveCallCount = 0;
        const mockGetGameState = () => {
            autoSaveCallCount++;
            return this.testGameState;
        };

        // Test 1: Start auto-save
        try {
            saveStateManager.setAutoSaveFrequency(1); // 1 second for testing
            saveStateManager.startAutoSave(mockGetGameState);
            
            await this.addTestResult(
                'Start auto-save',
                true,
                'Auto-save started successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Start auto-save',
                false,
                'Failed to start auto-save',
                error
            );
        }

        // Test 2: Wait for auto-save execution
        try {
            await new Promise(resolve => setTimeout(resolve, 2500)); // Wait 2.5 seconds
            
            await this.addTestResult(
                'Auto-save execution',
                autoSaveCallCount >= 2,
                `Auto-save executed ${autoSaveCallCount} times`
            );
        } catch (error) {
            await this.addTestResult(
                'Auto-save execution',
                false,
                'Auto-save execution test failed',
                error
            );
        }

        // Test 3: Stop auto-save
        try {
            saveStateManager.stopAutoSave();
            const initialCount = autoSaveCallCount;
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
            
            await this.addTestResult(
                'Stop auto-save',
                autoSaveCallCount === initialCount,
                'Auto-save should stop executing'
            );
        } catch (error) {
            await this.addTestResult(
                'Stop auto-save',
                false,
                'Failed to stop auto-save',
                error
            );
        }

        // Reset auto-save frequency
        saveStateManager.setAutoSaveFrequency(30);
    }

    async testErrorHandling() {
        this.log('Testing Error Handling...');

        // Test 1: Save with invalid data
        try {
            const result = await saveStateManager.saveCurrentState(null, false);
            await this.addTestResult(
                'Save with invalid data',
                result === false,
                'Should handle invalid data gracefully'
            );
        } catch (error) {
            await this.addTestResult(
                'Save with invalid data',
                true,
                'Error thrown as expected',
                error
            );
        }

        // Test 2: Clear with invalid user ID
        try {
            const result = await saveStateManager.clearSaveState(null);
            await this.addTestResult(
                'Clear with invalid user ID',
                result === false,
                'Should handle invalid user ID gracefully'
            );
        } catch (error) {
            await this.addTestResult(
                'Clear with invalid user ID',
                true,
                'Error thrown as expected',
                error
            );
        }

        // Test 3: Load with invalid user ID
        try {
            const result = await saveStateManager.loadSaveState(null);
            await this.addTestResult(
                'Load with invalid user ID',
                result === null,
                'Should return null for invalid user ID'
            );
        } catch (error) {
            await this.addTestResult(
                'Load with invalid user ID',
                true,
                'Error handling working correctly',
                error
            );
        }
    }

    displayResults() {
        this.log('='.repeat(50));
        this.log('SaveStateManager Test Results Summary');
        this.log('='.repeat(50));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;

        this.log(`Total Tests: ${totalTests}`);
        this.log(`Passed: ${passedTests}`);
        this.log(`Failed: ${failedTests}`);
        this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (failedTests > 0) {
            this.log('');
            this.log('Failed Tests:');
            this.testResults
                .filter(r => !r.success)
                .forEach(test => {
                    this.log(`- ${test.test}: ${test.details}`, true);
                    if (test.error) {
                        this.log(`  Error: ${test.error}`, true);
                    }
                });
        }

        this.log('='.repeat(50));
    }

    getResults() {
        return {
            totalTests: this.testResults.length,
            passedTests: this.testResults.filter(r => r.success).length,
            failedTests: this.testResults.filter(r => !r.success).length,
            successRate: (this.testResults.filter(r => r.success).length / this.testResults.length) * 100,
            details: this.testResults
        };
    }
}

// Export for use in testing framework
export { SaveStateManagerTest };

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new SaveStateManagerTest();
    test.runAllTests().then(() => {
        const results = test.getResults();
        process.exit(results.failedTests > 0 ? 1 : 0);
    });
} 