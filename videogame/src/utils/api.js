/**
 * API utility for handling HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generic function to make API requests
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        // Handle 204 No Content responses
        if (response.status === 204) {
            return {};
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Register a new user
 * @param {string} username - Username
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} User data with userId
 */
export async function registerUser(username, email, password) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
}

/**
 * Login an existing user
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} Session data with sessionToken
 */
export async function loginUser(email, password) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

/**
 * Logout the current user
 * @param {string} sessionToken - Session token to invalidate
 * @returns {Promise<Object>} Empty object on success
 */
export async function logoutUser(sessionToken) {
    return apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ sessionToken })
    });
}

/**
 * Get user statistics
 * @param {string|number} userId - User ID to get stats for
 * @returns {Promise<Object>} User stats data
 */
export async function getUserStats(userId) {
    return apiRequest(`/users/${userId}/stats`, {
        method: 'GET'
    });
}

/**
 * Create a new game run
 * @param {string|number} userId - User ID to create run for
 * @returns {Promise<Object>} Run data with runId and startedAt
 */
export async function createRun(userId) {
    return apiRequest('/runs', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
}

/**
 * Save run state
 * @param {string|number} runId - Run ID to save state for
 * @param {Object} stateData - State data to save
 * @param {number} stateData.userId - User ID
 * @param {number} stateData.sessionId - Session ID 
 * @param {number} stateData.roomId - Room ID
 * @param {number} stateData.currentHp - Current HP
 * @param {number} stateData.currentStamina - Current stamina
 * @param {number} stateData.gold - Gold amount
 * @returns {Promise<Object>} Save data with saveId
 */
export async function saveRunState(runId, stateData) {
    return apiRequest(`/runs/${runId}/save-state`, {
        method: 'POST',
        body: JSON.stringify(stateData)
    });
}

// Export the base request function for future use
export { apiRequest }; 