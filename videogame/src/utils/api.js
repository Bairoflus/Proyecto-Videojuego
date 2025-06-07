/**
 * API utility for handling HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generic function to make API requests with new response format handling
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
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
            return { success: true };
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
    const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
    return response; // {success: true, userId: X, message: "..."}
}

/**
 * Login an existing user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Session data with sessionToken
 */
export async function loginUser(username, password) {
    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    return response; // {success: true, userId: X, sessionToken: "...", sessionId: Y, expiresAt: "..."}
}

/**
 * Logout the current user
 * @param {string} sessionToken - Session token to invalidate
 * @returns {Promise<Object>} Success confirmation
 */
export async function logoutUser(sessionToken) {
    const response = await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ sessionToken })
    });
    return response; // {success: true, message: "Logged out successfully"}
}

/**
 * Get user statistics
 * @param {string|number} userId - User ID to get stats for
 * @returns {Promise<Object>} User stats data
 */
export async function getUserStats(userId) {
    const response = await apiRequest(`/users/${userId}/stats`);
    return response.data; // Extract data from {success: true, data: {...}}
}

/**
 * Get complete player statistics (historical data)
 * @param {string|number} userId - User ID to get complete stats for
 * @returns {Promise<Object>} Complete player stats data
 */
export async function getCompletePlayerStats(userId) {
    const response = await apiRequest(`/users/${userId}/complete-stats`);
    return response.data; // Extract data from {success: true, data: {...}}
}

/**
 * Get current run statistics for a user
 * @param {string|number} userId - User ID to get current run stats for
 * @returns {Promise<Object>} Current run stats data
 */
export async function getCurrentRunStats(userId) {
    const response = await apiRequest(`/users/${userId}/current-run`);
    return response.data; // Extract data from {success: true, data: {...}}
}

/**
 * Get player settings (audio and game preferences)
 * @param {string|number} userId - User ID to get settings for
 * @returns {Promise<Object>} Player settings data
 */
export async function getPlayerSettings(userId) {
    const response = await apiRequest(`/users/${userId}/settings`);
    return response.data; // Extract data from {success: true, data: {...}}
}

/**
 * Update player settings (audio and game preferences)
 * @param {string|number} userId - User ID to update settings for
 * @param {Object} settingsData - Settings data to update
 * @param {number} [settingsData.musicVolume] - Music volume level (0-100)
 * @param {number} [settingsData.sfxVolume] - SFX volume level (0-100)
 * @param {boolean} [settingsData.showFps] - Show FPS counter
 * @param {boolean} [settingsData.autoSaveEnabled] - Auto-save enabled
 * @returns {Promise<Object>} Update confirmation
 */
export async function updatePlayerSettings(userId, settingsData) {
    const response = await apiRequest(`/users/${userId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
    });
    return response; // {success: true, message: "Settings updated successfully"}
}

/**
 * Create a new game run
 * @param {string|number} userId - User ID to create run for
 * @returns {Promise<Object>} Run data with runId
 */
export async function createRun(userId) {
    const response = await apiRequest('/runs', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
    return response; // {success: true, runId: X, message: "Run created successfully"}
}

/**
 * Complete a game run
 * @param {string|number} runId - Run ID to complete
 * @param {Object} completionData - Completion data
 * @param {number} completionData.finalFloor - Final floor reached
 * @param {number} completionData.finalGold - Gold at end of run
 * @param {string} completionData.causeOfDeath - Cause of death ('active', 'enemy_kill', 'boss_kill', etc.)
 * @param {number} completionData.totalKills - Total kills during run
 * @param {number} completionData.bossesKilled - Bosses killed during run
 * @param {number} completionData.durationSeconds - Run duration in seconds
 * @returns {Promise<Object>} Completion confirmation
 */
export async function completeRun(runId, completionData) {
    const response = await apiRequest(`/runs/${runId}/complete`, {
        method: 'PUT',
        body: JSON.stringify(completionData)
    });
    return response; // {success: true, message: "Run completed successfully"}
}

/**
 * Register an enemy kill during gameplay
 * @param {string|number} runId - Run ID where the kill occurred
 * @param {Object} killData - Kill event data
 * @param {number} killData.userId - User ID who made the kill
 * @param {string} killData.enemyType - Enemy type ('common', 'rare')
 * @param {number} killData.roomId - Room ID where the kill occurred
 * @param {number} killData.floor - Floor where the kill occurred
 * @returns {Promise<Object>} Kill registration confirmation
 */
export async function registerEnemyKill(runId, killData) {
    const response = await apiRequest(`/runs/${runId}/enemy-kill`, {
        method: 'POST',
        body: JSON.stringify(killData)
    });
    return response; // {success: true, message: "Enemy kill registered"}
}

/**
 * Register a boss kill during gameplay
 * @param {string|number} runId - Run ID where the boss was killed
 * @param {Object} killData - Boss kill event data
 * @param {number} killData.userId - User ID who killed the boss
 * @param {string} killData.bossType - Boss type ('dragon')
 * @param {number} killData.floor - Floor where boss was killed
 * @param {number} killData.fightDuration - Fight duration in seconds
 * @param {number} killData.playerHpRemaining - Player HP remaining
 * @returns {Promise<Object>} Boss kill registration confirmation
 */
export async function registerBossKill(runId, killData) {
    const response = await apiRequest(`/runs/${runId}/boss-kill`, {
        method: 'POST',
        body: JSON.stringify(killData)
    });
    return response; // {success: true, message: "Boss kill registered"}
}

/**
 * Register a weapon purchase during gameplay
 * @param {string|number} runId - Run ID where the purchase was made
 * @param {Object} purchaseData - Purchase event data
 * @param {number} purchaseData.userId - User ID who made the purchase
 * @param {string} purchaseData.weaponType - Weapon type ('melee', 'ranged')
 * @param {number} purchaseData.upgradeLevel - Level after upgrade
 * @param {number} purchaseData.cost - Cost of the upgrade
 * @returns {Promise<Object>} Purchase registration confirmation
 */
export async function registerWeaponPurchase(runId, purchaseData) {
    const response = await apiRequest(`/runs/${runId}/weapon-purchase`, {
        method: 'POST',
        body: JSON.stringify(purchaseData)
    });
    return response; // {success: true, message: "Weapon purchase registered"}
}

/**
 * Get permanent upgrades for a user
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} Array of permanent upgrades
 */
export async function getPermanentUpgrades(userId) {
    const response = await apiRequest(`/users/${userId}/permanent-upgrades`);
    return response.data; // Extract data from {success: true, data: [...]}
}

/**
 * Apply a permanent upgrade (after boss kill)
 * @param {string|number} userId - User ID
 * @param {string} upgradeType - Type of upgrade ('health_max', 'stamina_max', 'movement_speed')
 * @returns {Promise<Object>} Application confirmation
 */
export async function applyPermanentUpgrade(userId, upgradeType) {
    const response = await apiRequest(`/users/${userId}/permanent-upgrade`, {
        method: 'POST',
        body: JSON.stringify({ upgradeType })
    });
    return response; // {success: true, message: "Permanent upgrade applied successfully"}
}

/**
 * Get weapon upgrades for a specific run
 * @param {string|number} userId - User ID
 * @param {string|number} runId - Run ID
 * @returns {Promise<Object>} Weapon upgrade levels
 */
export async function getWeaponUpgrades(userId, runId) {
    const response = await apiRequest(`/users/${userId}/weapon-upgrades/${runId}`);
    return response.data; // Extract data from {success: true, data: {close_combat: X, distance_combat: Y}}
}

/**
 * Update weapon upgrades for a run
 * @param {string|number} userId - User ID
 * @param {string|number} runId - Run ID
 * @param {number} meleeLevel - Melee weapon level
 * @param {number} rangedLevel - Ranged weapon level
 * @returns {Promise<Object>} Update confirmation
 */
export async function updateWeaponUpgrades(userId, runId, meleeLevel, rangedLevel) {
    const response = await apiRequest(`/users/${userId}/weapon-upgrades/${runId}`, {
        method: 'PUT',
        body: JSON.stringify({ meleeLevel, rangedLevel })
    });
    return response; // {success: true, message: "Weapon upgrades updated successfully"}
}

/**
 * Reset weapon upgrades (on player death)
 * @param {string|number} userId - User ID
 * @param {string|number} runId - Run ID
 * @returns {Promise<Object>} Reset confirmation
 */
export async function resetWeaponUpgrades(userId, runId) {
    const response = await apiRequest(`/users/${userId}/weapon-upgrades/${runId}`, {
        method: 'DELETE'
    });
    return response; // {success: true, message: "Weapon upgrades reset successfully"}
}

/**
 * Get save state for a user
 * @param {string|number} userId - User ID
 * @returns {Promise<Object|null>} Save state data or null
 */
export async function getSaveState(userId) {
    const response = await apiRequest(`/users/${userId}/save-state`);
    return response.data; // Extract data from {success: true, data: {...}} or null
}

/**
 * Save player game state
 * @param {number} userId - User ID
 * @param {Object} saveData - Save state data
 * @param {number} saveData.sessionId - Session ID
 * @param {number} saveData.runId - Run ID
 * @param {number} saveData.floorId - Floor ID
 * @param {number} saveData.roomId - Room ID
 * @param {number} saveData.currentHp - Current health
 * @param {number} saveData.gold - Current gold
 * @returns {Promise<Object>} Save operation result
 */
export async function saveGameState(userId, saveData) {
    return apiRequest(`/users/${userId}/save-state`, {
        method: 'POST',
        body: JSON.stringify(saveData)
    });
}

/**
 * Clear save state (on player death)
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} Clear confirmation
 */
export async function clearSaveState(userId) {
    const response = await apiRequest(`/users/${userId}/save-state`, {
        method: 'DELETE'
    });
    return response; // {success: true, message: "Save state cleared successfully"}
}

/**
 * Get leaderboard by type
 * @param {string} type - Leaderboard type ('floors', 'bosses', 'playtime')
 * @returns {Promise<Array>} Leaderboard data
 */
export async function getLeaderboard(type) {
    const response = await apiRequest(`/leaderboards/${type}`);
    return response.data; // Extract data from {success: true, data: [...]}
}

/**
 * Get economy analytics
 * @returns {Promise<Array>} Economy statistics
 */
export async function getEconomyAnalytics() {
    const response = await apiRequest('/analytics/economy');
    return response.data; // Extract data from {success: true, data: [...]}
}

/**
 * Get player progression analytics
 * @returns {Promise<Array>} Player progression data
 */
export async function getPlayerProgression() {
    const response = await apiRequest('/analytics/player-progression');
    return response.data; // Extract data from {success: true, data: [...]}
}

/**
 * Get active players status
 * @returns {Promise<Array>} Active players data
 */
export async function getActivePlayers() {
    const response = await apiRequest('/status/active-players');
    return response.data; // Extract data from {success: true, data: [...]}
}

/**
 * Get current games status
 * @returns {Promise<Array>} Current games data
 */
export async function getCurrentGames() {
    const response = await apiRequest('/status/current-games');
    return response.data; // Extract data from {success: true, data: [...]}
} 