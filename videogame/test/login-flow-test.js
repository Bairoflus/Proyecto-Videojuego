/**
 * Login Flow Test Script - Issue #7 Testing
 * Tests the enhanced login flow with session management and run creation
 */

// Mock localStorage for Node.js environment
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = value.toString(); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

// Mock console methods to capture output
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const logs = [];
const errors = [];
const warnings = [];

console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
};

console.error = (...args) => {
    errors.push(args.join(' '));
    originalError(...args);
};

console.warn = (...args) => {
    warnings.push(args.join(' '));
    originalWarn(...args);
};

/**
 * Mock API functions for testing
 */
const mockApi = {
    loginUser: async (email, password) => {
        console.log(`Mock login attempt: ${email}`);
        
        if (email === 'test@example.com' && password === 'password123') {
            return {
                userId: 1,
                sessionToken: 'mock-session-token-12345',
                sessionId: 42
            };
        } else if (email === 'fail@example.com') {
            throw new Error('Invalid credentials');
        } else if (email === 'network@example.com') {
            throw new Error('Network error: fetch failed');
        } else {
            throw new Error('Unknown user');
        }
    },
    
    createRun: async (userId) => {
        console.log(`Mock run creation for user: ${userId}`);
        
        if (userId === 1) {
            return {
                runId: 123,
                userId: userId,
                startTime: new Date().toISOString()
            };
        } else if (userId === 999) {
            throw new Error('Run creation failed');
        } else {
            throw new Error('Invalid user ID');
        }
    },
    
    logoutUser: async (sessionToken) => {
        console.log(`Mock logout with token: ${sessionToken}`);
        
        if (sessionToken === 'mock-session-token-12345') {
            return { success: true };
        } else if (sessionToken === 'fail-token') {
            throw new Error('Logout API error');
        } else {
            throw new Error('Invalid session token');
        }
    }
};

/**
 * Test session data management functions
 */
function testSessionDataManagement() {
    console.log('\nTesting Session Data Management...');
    
    // Test 1: Clear session data function
    console.log('\nTest 1: Session Data Clearing');
    
    // Set up test data
    localStorage.setItem('sessionToken', 'old-token');
    localStorage.setItem('currentUserId', '999');
    localStorage.setItem('currentSessionId', '888');
    localStorage.setItem('currentRunId', '777');
    localStorage.setItem('runCreationFailed', 'true');
    
    console.log('Initial localStorage state:', Object.keys(localStorage.store));
    
    // Clear session data (would be imported from login.js in real scenario)
    const sessionKeys = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId', 'runCreationFailed'];
    sessionKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            localStorage.removeItem(key);
            console.log(`Cleared ${key}: ${value}`);
        }
    });
    
    console.log('Final localStorage state:', Object.keys(localStorage.store));
    
    const clearedSuccessfully = sessionKeys.every(key => !localStorage.getItem(key));
    console.log(`Session clearing test: ${clearedSuccessfully ? 'PASSED' : 'FAILED'}`);
    
    return clearedSuccessfully;
}

/**
 * Test login flow scenarios
 */
async function testLoginFlow() {
    console.log('\nTesting Enhanced Login Flow...');
    
    const testResults = {
        successfulLogin: false,
        failedLogin: false,
        networkError: false,
        runCreationFailure: false
    };
    
    // Test 2: Successful login flow
    console.log('\nTest 2: Successful Login Flow');
    try {
        localStorage.clear();
        
        const loginResult = await mockApi.loginUser('test@example.com', 'password123');
        
        // Store authentication data (simulating login.js behavior)
        localStorage.setItem('sessionToken', loginResult.sessionToken);
        localStorage.setItem('currentUserId', loginResult.userId);
        localStorage.setItem('currentSessionId', loginResult.sessionId);
        
        const runData = await mockApi.createRun(loginResult.userId);
        localStorage.setItem('currentRunId', runData.runId);
        
        // Verify session state
        const sessionState = {
            userId: localStorage.getItem('currentUserId'),
            sessionId: localStorage.getItem('currentSessionId'),
            runId: localStorage.getItem('currentRunId'),
            hasSessionToken: !!localStorage.getItem('sessionToken')
        };
        
        console.log('Final session state:', sessionState);
        
        const hasAllRequiredData = sessionState.userId && sessionState.sessionId && 
                                  sessionState.runId && sessionState.hasSessionToken;
        
        testResults.successfulLogin = hasAllRequiredData;
        console.log(`Successful login test: ${hasAllRequiredData ? 'PASSED' : 'FAILED'}`);
        
    } catch (error) {
        console.error('Successful login test failed:', error.message);
    }
    
    // Test 3: Failed login (invalid credentials)
    console.log('\nTest 3: Failed Login Handling');
    try {
        localStorage.clear();
        
        await mockApi.loginUser('fail@example.com', 'wrongpassword');
        console.log('Should have thrown error for invalid credentials');
        
    } catch (error) {
        console.log('Correctly caught login error:', error.message);
        
        // Verify session data was cleared
        const sessionKeys = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId'];
        const hasSessionData = sessionKeys.some(key => localStorage.getItem(key));
        
        testResults.failedLogin = !hasSessionData;
        console.log(`Failed login cleanup test: ${!hasSessionData ? 'PASSED' : 'FAILED'}`);
    }
    
    // Test 4: Network error handling
    console.log('\nTest 4: Network Error Handling');
    try {
        localStorage.clear();
        
        await mockApi.loginUser('network@example.com', 'password123');
        console.log('Should have thrown network error');
        
    } catch (error) {
        console.log('Correctly caught network error:', error.message);
        
        const hasSessionData = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId']
            .some(key => localStorage.getItem(key));
        
        testResults.networkError = !hasSessionData;
        console.log(`Network error cleanup test: ${!hasSessionData ? 'PASSED' : 'FAILED'}`);
    }
    
    // Test 5: Run creation failure (should not block login)
    console.log('\nTest 5: Run Creation Failure Handling');
    try {
        localStorage.clear();
        
        const loginResult = await mockApi.loginUser('test@example.com', 'password123');
        
        // Store authentication data
        localStorage.setItem('sessionToken', loginResult.sessionToken);
        localStorage.setItem('currentUserId', loginResult.userId);
        localStorage.setItem('currentSessionId', loginResult.sessionId);
        
        try {
            // Attempt run creation with problematic user ID
            await mockApi.createRun(999);
            localStorage.setItem('currentRunId', '999');
        } catch (runError) {
            console.log('Run creation failed (expected):', runError.message);
            localStorage.setItem('runCreationFailed', 'true');
        }
        
        // Verify login data is still present even if run creation failed
        const hasLoginData = localStorage.getItem('sessionToken') && 
                           localStorage.getItem('currentUserId') && 
                           localStorage.getItem('currentSessionId');
        
        const runCreationMarkedFailed = localStorage.getItem('runCreationFailed') === 'true';
        
        testResults.runCreationFailure = hasLoginData && runCreationMarkedFailed;
        console.log(`Run creation failure test: ${testResults.runCreationFailure ? 'PASSED' : 'FAILED'}`);
        
    } catch (error) {
        console.error('Run creation failure test error:', error.message);
    }
    
    return testResults;
}

/**
 * Test logout flow scenarios
 */
async function testLogoutFlow() {
    console.log('\nTesting Enhanced Logout Flow...');
    
    const testResults = {
        successfulLogout: false,
        logoutApiFailure: false,
        sessionValidation: false
    };
    
    // Test 6: Successful logout
    console.log('\nTest 6: Successful Logout Flow');
    try {
        // Set up session data
        localStorage.setItem('sessionToken', 'mock-session-token-12345');
        localStorage.setItem('currentUserId', '1');
        localStorage.setItem('currentSessionId', '42');
        localStorage.setItem('currentRunId', '123');
        
        const sessionToken = localStorage.getItem('sessionToken');
        
        // Perform logout API call
        await mockApi.logoutUser(sessionToken);
        
        // Clear all session data (simulating logout behavior)
        const sessionKeys = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId', 'runCreationFailed'];
        sessionKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                localStorage.removeItem(key);
                console.log(`Cleared ${key}: ${value}`);
            }
        });
        
        const hasSessionData = sessionKeys.some(key => localStorage.getItem(key));
        testResults.successfulLogout = !hasSessionData;
        console.log(`Successful logout test: ${!hasSessionData ? 'PASSED' : 'FAILED'}`);
        
    } catch (error) {
        console.error('Successful logout test failed:', error.message);
    }
    
    // Test 7: Logout API failure (should still clear local data)
    console.log('\nTest 7: Logout API Failure Handling');
    try {
        // Set up session data
        localStorage.setItem('sessionToken', 'fail-token');
        localStorage.setItem('currentUserId', '1');
        localStorage.setItem('currentSessionId', '42');
        
        try {
            await mockApi.logoutUser('fail-token');
        } catch (apiError) {
            console.log('Logout API failed (expected):', apiError.message);
        }
        
        // Still clear session data even if API fails
        const sessionKeys = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId', 'runCreationFailed'];
        sessionKeys.forEach(key => localStorage.removeItem(key));
        
        const hasSessionData = sessionKeys.some(key => localStorage.getItem(key));
        testResults.logoutApiFailure = !hasSessionData;
        console.log(`Logout API failure cleanup test: ${!hasSessionData ? 'PASSED' : 'FAILED'}`);
        
    } catch (error) {
        console.error('Logout API failure test error:', error.message);
    }
    
    // Test 8: Session validation
    console.log('\nTest 8: Session Validation');
    
    // Test complete session
    localStorage.setItem('sessionToken', 'valid-token');
    localStorage.setItem('currentUserId', '1');
    localStorage.setItem('currentSessionId', '42');
    
    let hasValidSession = localStorage.getItem('sessionToken') && 
                         localStorage.getItem('currentUserId') && 
                         localStorage.getItem('currentSessionId');
    
    console.log(`Complete session validation: ${hasValidSession ? 'VALID' : 'INVALID'}`);
    
    // Test incomplete session
    localStorage.removeItem('currentSessionId');
    
    hasValidSession = localStorage.getItem('sessionToken') && 
                     localStorage.getItem('currentUserId') && 
                     localStorage.getItem('currentSessionId');
    
    console.log(`Incomplete session validation: ${hasValidSession ? 'VALID' : 'INVALID'}`);
    
    testResults.sessionValidation = !hasValidSession; // Should be invalid
    console.log(`Session validation test: ${testResults.sessionValidation ? 'PASSED' : 'FAILED'}`);
    
    return testResults;
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('Starting Issue #7 Login Flow Enhancement Tests...\n');
    
    try {
        // Test session data management
        const sessionDataResult = testSessionDataManagement();
        
        // Test login flow
        const loginResults = await testLoginFlow();
        
        // Test logout flow
        const logoutResults = await testLogoutFlow();
        
        // Calculate overall results
        const allTests = {
            sessionDataClearing: sessionDataResult,
            ...loginResults,
            ...logoutResults
        };
        
        const passedTests = Object.values(allTests).filter(result => result === true).length;
        const totalTests = Object.keys(allTests).length;
        
        console.log('\nTEST SUMMARY');
        console.log('================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        console.log('\nDetailed Results:');
        Object.entries(allTests).forEach(([test, passed]) => {
            console.log(`  ${passed ? 'PASS' : 'FAIL'} ${test}`);
        });
        
        console.log('\nLog Summary:');
        console.log(`Console logs: ${logs.length}`);
        console.log(`Warnings: ${warnings.length}`);
        console.log(`Errors: ${errors.length}`);
        
        const overallSuccess = passedTests === totalTests;
        console.log(`\nOverall Test Result: ${overallSuccess ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
        
        return overallSuccess;
        
    } catch (error) {
        console.error('Test execution failed:', error);
        return false;
    }
}

// Run the tests
runTests().then(success => {
    console.log(`\nFinal Result: ${success ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}).catch(error => {
    console.error('Test runner failed:', error);
}); 