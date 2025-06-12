/**
 * Simplified Admin Dashboard v2.1
 * Focused on useful metrics that actually exist in the database
 * Removed keyboard shortcuts and CSV export per user request
 */

import { 
    adminLogin,
    adminLogout,
    verifyAdminSession,
    getAdminPlaytimeLeaderboard,
    getAdminPlayerProgression,
    getAdminUpgradeAdoption,
    getAdminActivePlayers,
    getAdminCurrentGames,
    enhancedAdminLogout,
    clearAdminSession
} from '../../utils/api.js';

class SimplifiedAdminDashboard {
    constructor() {
        this.sessionToken = null;
        this.adminUser = null;
        this.currentSection = 'dashboard';
        this.currentAnalytics = 'upgrade-adoption';
        this.isAuthenticated = false;
        
        // Simplified caching
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        this.refreshInterval = null;
        
        this.init();
    }

    // ===================================================
    // INITIALIZATION
    // ===================================================

    async init() {
        console.log('Admin dashboard initialized...');
        
        // Check if admin is already authenticated
        const storedToken = localStorage.getItem('adminSessionToken');
        if (storedToken) {
            try {
                await this.verifyExistingSession(storedToken);
            } catch (error) {
                console.log('Stored admin session invalid, showing login');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
    }

    async verifyExistingSession(token) {
        try {
            const result = await verifyAdminSession(token);
            
            this.sessionToken = token;
            this.adminUser = result.user;
            this.isAuthenticated = true;
            
            console.log('Admin session verified:', this.adminUser);
            this.showDashboard();
            await this.loadInitialData();
            this.startRealTimeUpdates();
            
        } catch (error) {
            console.log('Admin session verification failed:', error);
            clearAdminSession();
            throw error;
        }
    }

    // ===================================================
    // AUTHENTICATION FLOW
    // ===================================================

    showLogin() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
        this.stopRealTimeUpdates();
    }

    showDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        
        if (this.adminUser) {
            document.getElementById('admin-user').textContent = `Welcome, ${this.adminUser.username}`;
        }
    }

    setupEventListeners() {
        // Admin Login Form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Analytics tabs
        document.querySelectorAll('[data-analytics]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAnalytics(e.target.dataset.analytics);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleAdminLogout();
        });

        // Simple player search
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterPlayers(e.target.value);
                }, 300); // 300ms debounce
            });
        }

        const activityFilter = document.getElementById('activity-filter');
        if (activityFilter) {
            activityFilter.addEventListener('change', (e) => {
                this.filterPlayersByActivity(e.target.value);
            });
        }

        // Simple refresh
        const refreshBtn = document.getElementById('refresh-players');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.showButtonLoading(refreshBtn, true);
                this.loadPlayersData().finally(() => {
                    this.showButtonLoading(refreshBtn, false);
                });
            });
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('admin-login-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.showButtonLoading(submitBtn, true);
            errorDiv.style.display = 'none';
            
            console.log('Attempting admin login...');
            const result = await adminLogin(username, password);
            
            this.sessionToken = result.sessionToken;
            this.adminUser = result.user;
            this.isAuthenticated = true;
            
            // Store admin session
            localStorage.setItem('adminSessionToken', this.sessionToken);
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('adminUser', JSON.stringify(this.adminUser));
            
            console.log('Admin login successful:', this.adminUser);
            this.showDashboard();
            await this.loadInitialData();
            this.startRealTimeUpdates();
            this.showSuccessMessage('Login successful!');
            
        } catch (error) {
            console.error('Admin login failed:', error);
            errorDiv.textContent = error.message || 'Invalid admin credentials';
            errorDiv.style.display = 'block';
            this.showErrorMessage('Login failed: ' + error.message);
        } finally {
            this.showButtonLoading(submitBtn, false);
        }
    }

    async handleAdminLogout() {
        try {
            console.log('Admin logout initiated...');
            this.stopRealTimeUpdates();
            await enhancedAdminLogout();
            
            this.sessionToken = null;
            this.adminUser = null;
            this.isAuthenticated = false;
            this.clearCache();
            
            console.log('Admin logout successful');
            this.showLogin();
            this.showSuccessMessage('Logged out successfully');
            
        } catch (error) {
            console.error('Admin logout error:', error);
            // Force logout even on error
            clearAdminSession();
            this.showLogin();
        }
    }

    // ===================================================
    // NAVIGATION
    // ===================================================

    switchSection(section) {
        if (!section || !this.isAuthenticated) return;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section)?.classList.add('active');

        this.currentSection = section;
        this.loadSectionData(section);
    }

    switchAnalytics(type) {
        if (!type || !this.isAuthenticated) return;

        // Update tabs
        document.querySelectorAll('[data-analytics]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-analytics="${type}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.analytics-table').forEach(table => {
            table.classList.remove('active');
        });
        document.getElementById(`analytics-${type}`)?.classList.add('active');

        this.currentAnalytics = type;
        this.loadAnalyticsData(type);
    }

    // ===================================================
    // DATA LOADING WITH SIMPLIFIED CACHING
    // ===================================================

    async loadInitialData() {
        if (!this.isAuthenticated) return;
        
        try {
            console.log('Loading initial admin data...');
            this.showGlobalLoading(true, 'Loading dashboard data...');
            
            await this.loadDashboardData();
            await this.loadAnalyticsData(this.currentAnalytics);
            
            console.log('Initial admin data loaded');
            this.showSuccessMessage('Dashboard loaded successfully');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showErrorMessage('Failed to load dashboard data');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    async loadSectionData(section) {
        if (!this.isAuthenticated) return;
        
        try {
            switch (section) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsData(this.currentAnalytics);
                    break;
                case 'players':
                    await this.loadPlayersData();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${section}:`, error);
        }
    }

    async loadDashboardData() {
        try {
            // Load key metrics in parallel with caching
            const [
                activePlayers,
                playtimeLeaderboard,
                currentGames
            ] = await Promise.all([
                this.getCachedData('activePlayers', () => getAdminActivePlayers(this.sessionToken)),
                this.getCachedData('playtimeLeaderboard', () => getAdminPlaytimeLeaderboard(this.sessionToken)),
                this.getCachedData('currentGames', () => getAdminCurrentGames(this.sessionToken))
            ]);

            // Update dashboard metrics with simplified calculations
            this.updateDashboardMetrics({
                totalPlayers: activePlayers ? activePlayers.length : 0,
                activeToday: activePlayers ? activePlayers.filter(p => p.activity_status === 'Active').length : 0,
                currentGames: currentGames ? currentGames.length : 0
            });
            
            // Render simplified leaderboard based on runs, not hours
            this.renderRunsLeaderboard(playtimeLeaderboard);

        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showErrorMessage('Failed to load dashboard data');
        }
    }

    async loadAnalyticsData(type) {
        try {
            const container = document.getElementById(`analytics-${type}`);
            if (!container) return;

            this.showContainerLoading(container, `Loading ${type} analytics...`);

            const cacheKey = `analytics-${type}`;
            let data = await this.getCachedData(cacheKey, async () => {
                switch (type) {
                    case 'upgrade-adoption':
                        return await getAdminUpgradeAdoption(this.sessionToken);
                    case 'player-progression':
                        return await getAdminPlayerProgression(this.sessionToken);
                    default:
                        return null;
                }
            });

            // Render with simplified features
            switch (type) {
                case 'upgrade-adoption':
                    this.renderUpgradeAdoption(container, data);
                    break;
                case 'player-progression':
                    this.renderPlayerProgression(container, data);
                    break;
            }

        } catch (error) {
            console.error(`Failed to load ${type} analytics:`, error);
            const container = document.getElementById(`analytics-${type}`);
            if (container) {
                container.innerHTML = `<div class="error">Failed to load ${type} analytics</div>`;
            }
        }
    }

    async loadPlayersData() {
        try {
            const container = document.getElementById('players-table');
            if (!container) return;

            this.showContainerLoading(container, 'Loading players data...');

            const data = await this.getCachedData('playersData', () => 
                getAdminActivePlayers(this.sessionToken), 15000); // 15s cache for players
            
            this.renderPlayersTable(container, data);

        } catch (error) {
            console.error('Failed to load players data:', error);
            const container = document.getElementById('players-table');
            if (container) {
                container.innerHTML = '<div class="error">Failed to load players data</div>';
            }
        }
    }

    // ===================================================
    // SIMPLIFIED CACHING SYSTEM
    // ===================================================

    async getCachedData(key, fetchFunction, customTimeout = null) {
        const timeout = customTimeout || this.cacheTimeout;
        const cached = this.cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < timeout) {
            console.log(`Cache hit for ${key}`);
            return cached.data;
        }
        
        console.log(`Cache miss for ${key}, fetching...`);
        try {
            const data = await fetchFunction();
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            // If we have stale cached data, return it as fallback
            if (cached) {
                console.warn(`Fetch failed for ${key}, using stale cache`);
                return cached.data;
            }
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    // ===================================================
    // REAL-TIME UPDATES
    // ===================================================

    startRealTimeUpdates() {
        if (this.refreshInterval) return; // Already running
        
        console.log('Starting real-time updates...');
        this.refreshInterval = setInterval(() => {
            this.refreshCurrentSection();
        }, 60000); // Refresh every minute
    }

    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Real-time updates stopped');
        }
    }

    async refreshCurrentSection() {
        if (!this.isAuthenticated) return;
        
        // Invalidate relevant cache
        this.clearCache();
        
        // Reload current section
        await this.loadSectionData(this.currentSection);
        
        console.log(`Refreshed ${this.currentSection} section`);
    }

    // ===================================================
    // SIMPLIFIED RENDERING FUNCTIONS
    // ===================================================

    updateDashboardMetrics(metrics) {
        // Simple metric updates without animations
        this.updateMetric('total-players', metrics.totalPlayers || '-');
        this.updateMetric('active-today', metrics.activeToday || '-');
        this.updateMetric('current-games', metrics.currentGames || '-');
    }

    updateMetric(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = newValue;
        }
    }

    renderRunsLeaderboard(leaderboard) {
        const container = document.getElementById('playtime-leaderboard');
        if (!container) return;
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="loading">No leaderboard data</div>';
            return;
        }

        // Sort by runs instead of hours
        const sortedByRuns = leaderboard.sort((a, b) => b.current_run - a.current_run);

        const html = `
            <div class="table-info">Top players by runs completed</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Current Run</th>
                        <th>Total Deaths</th>
                        <th>Total Kills</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedByRuns.slice(0, 10).map((player, index) => `
                        <tr>
                            <td class="rank-cell">#${index + 1}</td>
                            <td>${player.dedicated_player}</td>
                            <td>Run ${player.current_run}</td>
                            <td>${player.sessions} deaths</td>
                            <td>${player.total_kills || 0} kills</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderUpgradeAdoption(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="analytics-info">No upgrade adoption data available</div>';
            return;
        }

        const html = `
            <div class="analytics-info">
                <strong>Tracked Upgrades: ${data.length}</strong> | 
                Which permanent upgrades players buy first
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Upgrade Type</th>
                        <th>First Time Buyers</th>
                        <th>Average First Purchase Run</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(upgrade => `
                        <tr>
                            <td>${upgrade.upgrade_name}</td>
                            <td>${upgrade.first_time_buyers}</td>
                            <td>Run ${upgrade.avg_first_purchase_run}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlayerProgression(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="analytics-info">No player progression data available</div>';
            return;
        }

        const html = `
            <div class="analytics-info">
                <strong>Total Players: ${data.length}</strong> | 
                Experience tiers based on run count
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Current Run</th>
                        <th>Total Deaths</th>
                        <th>Total Kills</th>
                        <th>Experience Tier</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 50).map(player => `
                        <tr>
                            <td>${player.player_name}</td>
                            <td>${player.current_run}</td>
                            <td>${player.sessions_played}</td>
                            <td>${player.combat_experience}</td>
                            <td><span class="experience-tier ${player.experience_tier.toLowerCase()}">${player.experience_tier}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlayersTable(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No players data found</div>';
            return;
        }

        const html = `
            <div class="table-info">Showing ${data.length} players</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Last Active</th>
                        <th>Current Run</th>
                        <th>Total Deaths</th>
                        <th>Lifetime Kills</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(player => `
                        <tr>
                            <td>${player.player_name}</td>
                            <td>${player.last_active ? new Date(player.last_active).toLocaleDateString() : 'Never'}</td>
                            <td>${player.current_run}</td>
                            <td>${player.total_sessions}</td>
                            <td>${player.lifetime_kills}</td>
                            <td><span class="activity-status ${player.activity_status.toLowerCase()}">${player.activity_status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    // ===================================================
    // SIMPLE FILTERING
    // ===================================================

    filterPlayers(searchTerm) {
        const rows = document.querySelectorAll('#players-table tbody tr');
        
        rows.forEach(row => {
            const playerName = row.cells[0]?.textContent.toLowerCase() || '';
            const isVisible = playerName.includes(searchTerm.toLowerCase());
            row.style.display = isVisible ? '' : 'none';
        });

        // Update table info
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
        const tableInfo = document.querySelector('#players-table .table-info');
        if (tableInfo) {
            tableInfo.textContent = `Showing ${visibleRows} of ${rows.length} players`;
        }
    }

    filterPlayersByActivity(activityStatus) {
        const rows = document.querySelectorAll('#players-table tbody tr');
        
        rows.forEach(row => {
            if (activityStatus === 'all') {
                row.style.display = '';
            } else {
                const status = row.cells[5]?.textContent || '';
                const isVisible = status.includes(activityStatus);
                row.style.display = isVisible ? '' : 'none';
            }
        });
    }

    // ===================================================
    // UI FEEDBACK
    // ===================================================

    showGlobalLoading(show, message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay?.querySelector('.loading-text');
        
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
            if (text && message) {
                text.textContent = message;
            }
        }
    }

    showContainerLoading(container, message = 'Loading...') {
        if (container) {
            container.innerHTML = `<div class="loading">${message}</div>`;
        }
    }

    showButtonLoading(button, show) {
        if (!button) return;
        
        if (show) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="loading-spinner-small"></span> Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(text, type = 'info') {
        // Create message element if it doesn't exist
        let messageEl = document.getElementById(`${type}-message`);
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = `${type}-message`;
            messageEl.className = `message ${type}`;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = text;
        messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Initialize dashboard and make it globally available
window.adminDashboard = new SimplifiedAdminDashboard();