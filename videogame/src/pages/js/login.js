/**
 * Enhanced Login page functionality with improved session management and user feedback
 * Issue #7: Frontend Login Flow Enhancement
 */
import { loginUser, createRun } from '../../utils/api.js';

// Login states for improved UI feedback
const LOGIN_STATES = {
    IDLE: 'idle',
    CLEARING_SESSION: 'clearing_session',
    AUTHENTICATING: 'authenticating',
    CREATING_RUN: 'creating_run',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Current login state
let currentLoginState = LOGIN_STATES.IDLE;

/**
 * Clear all previous session data to ensure clean state
 */
function clearSessionData() {
    console.log('Clearing previous session data...');
    const sessionKeys = ['sessionToken', 'currentUserId', 'currentSessionId', 'currentRunId'];
    
    sessionKeys.forEach(key => {
        const previousValue = localStorage.getItem(key);
        if (previousValue) {
            localStorage.removeItem(key);
            console.log(`  Cleared ${key}: ${previousValue}`);
        }
    });
}

/**
 * Update UI based on current login state
 * @param {string} state - Current login state
 * @param {string} message - Optional message to display
 * @param {Object} data - Optional data for state-specific updates
 */
function updateLoginUI(state, message = '', data = {}) {
    currentLoginState = state;
    
    const submitButton = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const statusIndicator = document.getElementById('login-status') || createStatusIndicator();
    
    // Clear previous messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    
    switch (state) {
        case LOGIN_STATES.CLEARING_SESSION:
            submitButton.disabled = true;
            submitButton.textContent = 'Preparing...';
            statusIndicator.textContent = 'Clearing session data...';
            statusIndicator.className = 'status-indicator clearing';
            break;
            
        case LOGIN_STATES.AUTHENTICATING:
            submitButton.disabled = true;
            submitButton.textContent = 'Authenticating...';
            statusIndicator.textContent = 'Authenticating with server...';
            statusIndicator.className = 'status-indicator authenticating';
            break;
            
        case LOGIN_STATES.CREATING_RUN:
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Game Session...';
            statusIndicator.textContent = 'Creating new game session...';
            statusIndicator.className = 'status-indicator creating-run';
            break;
            
        case LOGIN_STATES.SUCCESS:
            submitButton.disabled = true;
            submitButton.textContent = 'Success!';
            statusIndicator.textContent = 'Login successful! Starting game...';
            statusIndicator.className = 'status-indicator success';
            
            if (successMessage) {
                successMessage.textContent = message || 'Login successful! Starting new game...';
                successMessage.style.display = 'block';
            }
            break;
            
        case LOGIN_STATES.ERROR:
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
            statusIndicator.textContent = 'Login failed';
            statusIndicator.className = 'status-indicator error';
            
            if (errorMessage) {
                errorMessage.textContent = message || 'Login failed. Please try again.';
                errorMessage.style.display = 'block';
            }
            break;
            
        case LOGIN_STATES.IDLE:
        default:
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
            statusIndicator.textContent = '';
            statusIndicator.className = 'status-indicator idle';
            break;
    }
}

/**
 * Create status indicator element if it doesn't exist
 */
function createStatusIndicator() {
    const existingIndicator = document.getElementById('login-status');
    if (existingIndicator) return existingIndicator;
    
    const indicator = document.createElement('div');
    indicator.id = 'login-status';
    indicator.className = 'status-indicator';
    
    const form = document.querySelector('form');
    form.appendChild(indicator);
    
    return indicator;
}

/**
 * Validate form input data
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @returns {Object} Validation result
 */
function validateLoginForm(email, password) {
    const errors = [];
    
    if (!email.trim()) {
        errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Enhanced login process with comprehensive error handling and user feedback
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} Success status
 */
async function performLogin(email, password) {
    try {
        // Phase 1: Clear previous session data
        updateLoginUI(LOGIN_STATES.CLEARING_SESSION);
        clearSessionData();
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
        
        // Phase 2: Authenticate with backend
        updateLoginUI(LOGIN_STATES.AUTHENTICATING);
        console.log('Authenticating user:', email);
        
        const loginResult = await loginUser(email, password);
        console.log('Login successful:', {
            userId: loginResult.userId,
            sessionId: loginResult.sessionId,
            hasSessionToken: !!loginResult.sessionToken
        });
        
        // Store authentication data
        localStorage.setItem('sessionToken', loginResult.sessionToken);
        localStorage.setItem('currentUserId', loginResult.userId);
        localStorage.setItem('currentSessionId', loginResult.sessionId);
        
        // Phase 3: Create game run
        updateLoginUI(LOGIN_STATES.CREATING_RUN);
        console.log('Creating new game run for user:', loginResult.userId);
        
        try {
            const runData = await createRun(loginResult.userId);
            console.log('Game run created successfully:', runData);
            
            // Store run data for gameplay
            localStorage.setItem('currentRunId', runData.runId);
            
        } catch (runError) {
            console.error('Failed to create game run:', runError);
            
            // Log run creation failure but don't block login
            console.warn('Game run creation failed, user can still play in limited mode');
            
            // Set a flag to indicate run creation failed
            localStorage.setItem('runCreationFailed', 'true');
        }
        
        // Phase 4: Success
        updateLoginUI(LOGIN_STATES.SUCCESS, 'Login successful! Starting new game...');
        
        // Log final session state
        console.log('Final session state:', {
            userId: localStorage.getItem('currentUserId'),
            sessionId: localStorage.getItem('currentSessionId'),
            runId: localStorage.getItem('currentRunId') || 'NONE (limited mode)',
            hasSessionToken: !!localStorage.getItem('sessionToken')
        });
        
        return true;
        
    } catch (error) {
        console.error('Login process failed:', error);
        
        // Clear any partial session data on failure
        clearSessionData();
        
        // Determine appropriate error message
        let errorMessage = 'Login failed. Please try again.';
        if (error.message) {
            if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else {
                errorMessage = error.message;
            }
        }
        
        updateLoginUI(LOGIN_STATES.ERROR, errorMessage);
        return false;
    }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    
    if (!form) {
        console.error('Login form not found');
        return;
    }
    
    console.log('Login page initialized');
    
    // Clear any existing session data on page load
    clearSessionData();
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent multiple simultaneous submissions
        if (currentLoginState !== LOGIN_STATES.IDLE) {
            console.log('Login already in progress, ignoring submission');
            return;
        }
        
        // Get form data
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInput = form.querySelector('input[type="password"]');
        
        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found');
            updateLoginUI(LOGIN_STATES.ERROR, 'Form configuration error. Please refresh the page.');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate form input
        const validation = validateLoginForm(email, password);
        if (!validation.isValid) {
            updateLoginUI(LOGIN_STATES.ERROR, validation.errors.join('. '));
            return;
        }
        
        // Perform login process
        const loginSuccess = await performLogin(email, password);
        
        if (loginSuccess) {
            // Redirect to game after brief delay
            setTimeout(() => {
                console.log('Redirecting to game...');
                window.location.href = 'game.html';
            }, 1500);
        }
    });
}); 