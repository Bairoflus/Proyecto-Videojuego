/**
 * WeaponUpgradeManager Test Suite
 * Tests all functionality of the weapon upgrade management system
 */

import { weaponUpgradeManager } from '../../src/utils/weaponUpgradeManager.js';

class WeaponUpgradeManagerTest {
    constructor() {
        this.testResults = [];
        this.userId = 1; // Test user ID
        this.runId = 1; // Test run ID
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
        this.log('Starting WeaponUpgradeManager Test Suite');
        this.log('='.repeat(50));

        try {
            await this.testInitialization();
            await this.testUpgradeOperations();
            await this.testSaveAndSync();
            await this.testResetOperations();
            await this.testQueryMethods();
            await this.testErrorHandling();
            
            this.displayResults();
        } catch (error) {
            this.log(`Test suite failed with error: ${error.message}`, true);
        }
    }

    async testInitialization() {
        this.log('Testing Initialization functionality...');

        // Test 1: Initialize with valid parameters
        try {
            await weaponUpgradeManager.initialize(this.userId, this.runId);
            await this.addTestResult(
                'Initialize with valid parameters',
                true,
                'Initialization should complete successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Initialize with valid parameters',
                false,
                'Failed to initialize with valid parameters',
                error
            );
        }

        // Test 2: Verify default values
        try {
            const meleeLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const rangedLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            const isValid = meleeLevel >= 1 && rangedLevel >= 1;
            await this.addTestResult(
                'Verify default weapon levels',
                isValid,
                `Melee: ${meleeLevel}, Ranged: ${rangedLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Verify default weapon levels',
                false,
                'Failed to get default weapon levels',
                error
            );
        }

        // Test 3: Initialize with invalid parameters
        try {
            await weaponUpgradeManager.initialize(null, null);
            await this.addTestResult(
                'Initialize with invalid parameters',
                false,
                'Should handle invalid parameters gracefully'
            );
        } catch (error) {
            await this.addTestResult(
                'Initialize with invalid parameters',
                true,
                'Error handling working correctly',
                error
            );
        }
    }

    async testUpgradeOperations() {
        this.log('Testing Upgrade Operations...');

        // Reset to known state
        await weaponUpgradeManager.initialize(this.userId, this.runId);

        // Test 1: Upgrade melee weapon
        try {
            const initialLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const result = await weaponUpgradeManager.upgradeWeapon('melee');
            const newLevel = weaponUpgradeManager.getWeaponLevel('melee');
            
            const isValid = result === true && newLevel === initialLevel + 1;
            await this.addTestResult(
                'Upgrade melee weapon',
                isValid,
                `Level progression: ${initialLevel} → ${newLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Upgrade melee weapon',
                false,
                'Failed to upgrade melee weapon',
                error
            );
        }

        // Test 2: Upgrade ranged weapon
        try {
            const initialLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            const result = await weaponUpgradeManager.upgradeWeapon('ranged');
            const newLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            const isValid = result === true && newLevel === initialLevel + 1;
            await this.addTestResult(
                'Upgrade ranged weapon',
                isValid,
                `Level progression: ${initialLevel} → ${newLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Upgrade ranged weapon',
                false,
                'Failed to upgrade ranged weapon',
                error
            );
        }

        // Test 3: Set specific weapon level
        try {
            const result = await weaponUpgradeManager.setWeaponLevel('melee', 5);
            const newLevel = weaponUpgradeManager.getWeaponLevel('melee');
            
            const isValid = result === true && newLevel === 5;
            await this.addTestResult(
                'Set specific weapon level',
                isValid,
                `Melee level set to: ${newLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Set specific weapon level',
                false,
                'Failed to set specific weapon level',
                error
            );
        }

        // Test 4: Test maximum level restriction
        try {
            const result = await weaponUpgradeManager.setWeaponLevel('ranged', 16); // Above max
            await this.addTestResult(
                'Test maximum level restriction',
                result === false,
                'Should reject levels above 15'
            );
        } catch (error) {
            await this.addTestResult(
                'Test maximum level restriction',
                true,
                'Error handling for invalid level working',
                error
            );
        }

        // Test 5: Test invalid weapon type
        try {
            const result = await weaponUpgradeManager.upgradeWeapon('invalid');
            await this.addTestResult(
                'Test invalid weapon type',
                result === false,
                'Should reject invalid weapon types'
            );
        } catch (error) {
            await this.addTestResult(
                'Test invalid weapon type',
                true,
                'Error handling for invalid type working',
                error
            );
        }
    }

    async testSaveAndSync() {
        this.log('Testing Save and Sync operations...');

        // Test 1: Save upgrades
        try {
            const result = await weaponUpgradeManager.saveUpgrades();
            await this.addTestResult(
                'Save upgrades',
                result === true,
                'Save operation should complete successfully'
            );
        } catch (error) {
            await this.addTestResult(
                'Save upgrades',
                false,
                'Failed to save upgrades',
                error
            );
        }

        // Test 2: Load upgrades after save
        try {
            await weaponUpgradeManager.loadCurrentUpgrades();
            const meleeLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const rangedLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            await this.addTestResult(
                'Load upgrades after save',
                meleeLevel > 1 || rangedLevel > 1,
                `Loaded levels - Melee: ${meleeLevel}, Ranged: ${rangedLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Load upgrades after save',
                false,
                'Failed to load upgrades',
                error
            );
        }
    }

    async testResetOperations() {
        this.log('Testing Reset Operations...');

        // Ensure we have some upgrades to reset
        await weaponUpgradeManager.setWeaponLevel('melee', 3);
        await weaponUpgradeManager.setWeaponLevel('ranged', 4);

        // Test 1: Reset on death
        try {
            const result = await weaponUpgradeManager.resetOnDeath();
            const meleeLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const rangedLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            const isValid = result === true && meleeLevel === 1 && rangedLevel === 1;
            await this.addTestResult(
                'Reset on death',
                isValid,
                `Levels after reset - Melee: ${meleeLevel}, Ranged: ${rangedLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Reset on death',
                false,
                'Failed to reset on death',
                error
            );
        }

        // Test 2: Preserve on logout
        try {
            // Set some levels again
            await weaponUpgradeManager.setWeaponLevel('melee', 2);
            await weaponUpgradeManager.setWeaponLevel('ranged', 3);
            
            const result = await weaponUpgradeManager.preserveOnLogout();
            const meleeLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const rangedLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            const isValid = result === true && meleeLevel === 2 && rangedLevel === 3;
            await this.addTestResult(
                'Preserve on logout',
                isValid,
                `Levels preserved - Melee: ${meleeLevel}, Ranged: ${rangedLevel}`
            );
        } catch (error) {
            await this.addTestResult(
                'Preserve on logout',
                false,
                'Failed to preserve on logout',
                error
            );
        }
    }

    async testQueryMethods() {
        this.log('Testing Query Methods...');

        // Set known weapon levels
        await weaponUpgradeManager.setWeaponLevel('melee', 3);
        await weaponUpgradeManager.setWeaponLevel('ranged', 5);

        // Test 1: Get weapon damage
        try {
            const meleeDamage = weaponUpgradeManager.getWeaponDamage('melee');
            const rangedDamage = weaponUpgradeManager.getWeaponDamage('ranged');
            
            const isValid = meleeDamage > 0 && rangedDamage > 0;
            await this.addTestResult(
                'Get weapon damage',
                isValid,
                `Melee damage: ${meleeDamage}, Ranged damage: ${rangedDamage}`
            );
        } catch (error) {
            await this.addTestResult(
                'Get weapon damage',
                false,
                'Failed to get weapon damage',
                error
            );
        }

        // Test 2: Get upgrade cost
        try {
            const meleeCost = weaponUpgradeManager.getUpgradeCost('melee');
            const rangedCost = weaponUpgradeManager.getUpgradeCost('ranged');
            
            const isValid = meleeCost >= 0 && rangedCost >= 0;
            await this.addTestResult(
                'Get upgrade cost',
                isValid,
                `Melee cost: ${meleeCost}, Ranged cost: ${rangedCost}`
            );
        } catch (error) {
            await this.addTestResult(
                'Get upgrade cost',
                false,
                'Failed to get upgrade cost',
                error
            );
        }

        // Test 3: Can upgrade weapon
        try {
            const canUpgradeMelee = weaponUpgradeManager.canUpgradeWeapon('melee');
            const canUpgradeRanged = weaponUpgradeManager.canUpgradeWeapon('ranged');
            
            await this.addTestResult(
                'Can upgrade weapon',
                canUpgradeMelee === true && canUpgradeRanged === true,
                `Can upgrade - Melee: ${canUpgradeMelee}, Ranged: ${canUpgradeRanged}`
            );
        } catch (error) {
            await this.addTestResult(
                'Can upgrade weapon',
                false,
                'Failed to check upgrade availability',
                error
            );
        }

        // Test 4: Get all weapons info
        try {
            const allInfo = weaponUpgradeManager.getAllWeaponsInfo();
            const hasValidStructure = allInfo.melee && allInfo.ranged &&
                                   typeof allInfo.melee.level === 'number' &&
                                   typeof allInfo.ranged.level === 'number';
            
            await this.addTestResult(
                'Get all weapons info',
                hasValidStructure,
                'All weapons info structure is valid'
            );
        } catch (error) {
            await this.addTestResult(
                'Get all weapons info',
                false,
                'Failed to get all weapons info',
                error
            );
        }

        // Test 5: Get status summary
        try {
            const summary = weaponUpgradeManager.getStatusSummary();
            const hasValidSummary = summary.userId && summary.runId && summary.upgrades;
            
            await this.addTestResult(
                'Get status summary',
                hasValidSummary,
                'Status summary structure is valid'
            );
        } catch (error) {
            await this.addTestResult(
                'Get status summary',
                false,
                'Failed to get status summary',
                error
            );
        }
    }

    async testErrorHandling() {
        this.log('Testing Error Handling...');

        // Test 1: Invalid weapon type validation
        try {
            const isValid = weaponUpgradeManager.isValidWeaponType('invalid');
            await this.addTestResult(
                'Invalid weapon type validation',
                isValid === false,
                'Should return false for invalid weapon type'
            );
        } catch (error) {
            await this.addTestResult(
                'Invalid weapon type validation',
                false,
                'Failed to validate weapon type',
                error
            );
        }

        // Test 2: Valid weapon type validation
        try {
            const isValidMelee = weaponUpgradeManager.isValidWeaponType('melee');
            const isValidRanged = weaponUpgradeManager.isValidWeaponType('ranged');
            
            await this.addTestResult(
                'Valid weapon type validation',
                isValidMelee === true && isValidRanged === true,
                'Should return true for valid weapon types'
            );
        } catch (error) {
            await this.addTestResult(
                'Valid weapon type validation',
                false,
                'Failed to validate valid weapon types',
                error
            );
        }

        // Test 3: Cleanup functionality
        try {
            weaponUpgradeManager.cleanup();
            const meleeLevel = weaponUpgradeManager.getWeaponLevel('melee');
            const rangedLevel = weaponUpgradeManager.getWeaponLevel('ranged');
            
            await this.addTestResult(
                'Cleanup functionality',
                meleeLevel === 1 && rangedLevel === 1,
                'Cleanup should reset all values to defaults'
            );
        } catch (error) {
            await this.addTestResult(
                'Cleanup functionality',
                false,
                'Failed to cleanup manager state',
                error
            );
        }
    }

    displayResults() {
        this.log('='.repeat(50));
        this.log('WeaponUpgradeManager Test Results Summary');
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
export { WeaponUpgradeManagerTest };

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new WeaponUpgradeManagerTest();
    test.runAllTests().then(() => {
        const results = test.getResults();
        process.exit(results.failedTests > 0 ? 1 : 0);
    });
} 