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

// Export the base request function for future use
export { apiRequest }; 