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
 * Get player settings (audio and game preferences)
 * @param {string|number} userId - User ID to get settings for
 * @returns {Promise<Object>} Player settings data with music_volume, sfx_volume, and last_updated
 */
export async function getPlayerSettings(userId) {
    return apiRequest(`/users/${userId}/settings`, {
        method: 'GET'
    });
}

/**
 * Update player settings (audio and game preferences)
 * @param {string|number} userId - User ID to update settings for
 * @param {Object} settingsData - Settings data to update
 * @param {number} [settingsData.musicVolume] - Music volume level (0-100)
 * @param {number} [settingsData.sfxVolume] - SFX volume level (0-100)
 * @returns {Promise<Object>} Update confirmation with updated settings
 */
export async function updatePlayerSettings(userId, settingsData) {
    return apiRequest(`/users/${userId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
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

/**
 * Complete a game run
 * @param {string|number} runId - Run ID to complete
 * @param {Object} completionData - Completion data
 * @param {number} completionData.goldCollected - Gold collected during run
 * @param {number} completionData.goldSpent - Gold spent during run
 * @param {number} completionData.totalKills - Total kills during run
 * @param {string|null} completionData.deathCause - Death cause (null for successful completion)
 * @returns {Promise<Object>} Completion confirmation
 */
export async function completeRun(runId, completionData) {
    return apiRequest(`/runs/${runId}/complete`, {
        method: 'PUT',
        body: JSON.stringify(completionData)
    });
}

/**
 * Register an enemy kill during gameplay
 * @param {string|number} runId - Run ID where the kill occurred
 * @param {Object} killData - Kill event data
 * @param {number} killData.userId - User ID who made the kill
 * @param {number} killData.enemyId - Enemy type ID that was killed
 * @param {number} killData.roomId - Room ID where the kill occurred
 * @returns {Promise<Object>} Kill registration confirmation with killId
 */
export async function registerEnemyKill(runId, killData) {
    return apiRequest(`/runs/${runId}/enemy-kill`, {
        method: 'POST',
        body: JSON.stringify(killData)
    });
}

/**
 * Register a chest event during gameplay
 * @param {string|number} runId - Run ID where the chest was opened
 * @param {Object} chestData - Chest event data
 * @param {number} chestData.userId - User ID who opened the chest
 * @param {number} chestData.roomId - Room ID where the chest was opened
 * @param {number} chestData.goldReceived - Gold amount received from chest
 * @returns {Promise<Object>} Chest event registration confirmation with eventId
 */
export async function registerChestEvent(runId, chestData) {
    return apiRequest(`/runs/${runId}/chest-event`, {
        method: 'POST',
        body: JSON.stringify(chestData)
    });
}

/**
 * Register a shop purchase during gameplay
 * @param {string|number} runId - Run ID where the purchase was made
 * @param {Object} purchaseData - Purchase event data
 * @param {number} purchaseData.userId - User ID who made the purchase
 * @param {number} purchaseData.roomId - Room ID where the purchase was made
 * @param {string} purchaseData.itemType - Type of item purchased (must exist in item_types)
 * @param {string} purchaseData.itemName - Name of the item purchased
 * @param {number} purchaseData.goldSpent - Gold amount spent on the purchase
 * @returns {Promise<Object>} Shop purchase registration confirmation with purchaseId
 */
export async function registerShopPurchase(runId, purchaseData) {
    return apiRequest(`/runs/${runId}/shop-purchase`, {
        method: 'POST',
        body: JSON.stringify(purchaseData)
    });
}

/**
 * Register a boss encounter during gameplay
 * @param {string|number} runId - Run ID where the boss encounter occurred
 * @param {Object} encounterData - Boss encounter event data
 * @param {number} encounterData.userId - User ID who encountered the boss
 * @param {number} encounterData.enemyId - Boss enemy ID (must exist in boss_details)
 * @param {number} encounterData.damageDealt - Damage dealt to the boss
 * @param {number} encounterData.damageTaken - Damage taken from the boss
 * @param {string} encounterData.resultCode - Result of the encounter (must exist in boss_results)
 * @returns {Promise<Object>} Boss encounter registration confirmation with encounterId
 */
export async function registerBossEncounter(runId, encounterData) {
    return apiRequest(`/runs/${runId}/boss-encounter`, {
        method: 'POST',
        body: JSON.stringify(encounterData)
    });
}

/**
 * Register a successful boss kill during gameplay
 * @param {string|number} runId - Run ID where the boss was killed
 * @param {Object} killData - Boss kill event data
 * @param {number} killData.userId - User ID who killed the boss
 * @param {number} killData.enemyId - Boss enemy ID (must exist in boss_details)
 * @param {number} killData.roomId - Room ID where the boss was killed
 * @returns {Promise<Object>} Boss kill registration confirmation with killId
 */
export async function registerBossKill(runId, killData) {
    return apiRequest(`/runs/${runId}/boss-kill`, {
        method: 'POST',
        body: JSON.stringify(killData)
    });
}

/**
 * Register a permanent upgrade purchase during gameplay
 * @param {string|number} runId - Run ID where the upgrade was purchased
 * @param {Object} upgradeData - Upgrade purchase event data
 * @param {number} upgradeData.userId - User ID who purchased the upgrade
 * @param {string} upgradeData.upgradeType - Type of upgrade purchased (must exist in upgrade_types)
 * @param {number} upgradeData.levelBefore - Upgrade level before purchase
 * @param {number} upgradeData.levelAfter - Upgrade level after purchase
 * @param {number} upgradeData.goldSpent - Gold amount spent on the upgrade
 * @returns {Promise<Object>} Upgrade purchase registration confirmation with purchaseId
 */
export async function registerUpgradePurchase(runId, upgradeData) {
    return apiRequest(`/runs/${runId}/upgrade-purchase`, {
        method: 'POST',
        body: JSON.stringify(upgradeData)
    });
}

/**
 * Equip a weapon in a specific slot during gameplay
 * @param {string|number} runId - Run ID where the weapon is being equipped
 * @param {Object} equipmentData - Weapon equipment event data
 * @param {number} equipmentData.userId - User ID who is equipping the weapon
 * @param {string} equipmentData.slotType - Type of weapon slot (must exist in weapon_slots)
 * @returns {Promise<Object>} Weapon equipment confirmation
 */
export async function equipWeapon(runId, equipmentData) {
    return apiRequest(`/runs/${runId}/equip-weapon`, {
        method: 'POST',
        body: JSON.stringify(equipmentData)
    });
}

/**
 * Save weapon upgrade progress during gameplay
 * @param {string|number} runId - Run ID where the weapon upgrade is being saved
 * @param {Object} upgradeData - Weapon upgrade data
 * @param {number} upgradeData.userId - User ID who is upgrading the weapon
 * @param {string} upgradeData.slotType - Type of weapon slot (must exist in weapon_slots)
 * @param {number} upgradeData.level - Current upgrade level
 * @param {number} upgradeData.damagePerUpgrade - Damage per upgrade level
 * @param {number} upgradeData.goldCostPerUpgrade - Gold cost per upgrade level
 * @returns {Promise<Object>} Weapon upgrade save confirmation
 */
export async function upgradeWeapon(runId, upgradeData) {
    return apiRequest(`/runs/${runId}/weapon-upgrade`, {
        method: 'POST',
        body: JSON.stringify(upgradeData)
    });
}

/**
 * Get all rooms ordered by floor and sequence
 * @returns {Promise<Array>} Array of room objects with room details
 */
export async function getRooms() {
    return apiRequest('/rooms', {
        method: 'GET'
    });
}

/**
 * Get all enemy types
 * @returns {Promise<Array>} Array of enemy objects with enemy details and stats
 */
export async function getEnemies() {
    return apiRequest('/enemies', {
        method: 'GET'
    });
}

/**
 * Get all boss types with their moves and information
 * @returns {Promise<Array>} Array of boss objects with moves, stats, and information
 */
export async function getBosses() {
    return apiRequest('/bosses', {
        method: 'GET'
    });
}

/**
 * Get all lookup data for dropdowns and form options
 * @returns {Promise<Object>} Object containing all lookup arrays (eventTypes, weaponSlots, upgradeTypes, bossResults, roomTypes, itemTypes)
 */
export async function getLookups() {
    return apiRequest('/lookups', {
        method: 'GET'
    });
}

/**
 * Get all item types for shop menus and item categorization
 * @returns {Promise<Array>} Array of item type objects with name property
 */
export async function getItemTypes() {
    return apiRequest('/item-types', {
        method: 'GET'
    });
}

// Export the base request function for future use
export { apiRequest }; 