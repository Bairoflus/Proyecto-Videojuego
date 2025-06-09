/**
 * Optimized Admin Dashboard JavaScript
 * Implements secure admin-only access with useful analytics and beautiful charts
 * Removed unnecessary features, focused on actionable insights for developers
 */

import { 
    adminLogin,
    adminLogout,
    verifyAdminSession,
    getAdminPlaytimeLeaderboard,
    getAdminPlayerProgression,
    getAdminFirstRunMasters,
    getAdminUpgradeAdoption,
    getAdminActivePlayers,
    getAdminCurrentGames,
    enhancedAdminLogout,
    clearAdminSession
} from '../../utils/api.js';

class OptimizedAdminDashboard {
    constructor() {
        this.sessionToken = null;
        this.adminUser = null;
        this.currentSection = 'dashboard';
        this.currentAnalytics = 'first-run-masters';
        this.charts = {};
        this.isAuthenticated = false;
        
        this.init();
    }

    // ===================================================
    // INITIALIZATION
    // ===================================================

    async init() {
        console.log('Initializing Optimized Admin Dashboard...');
        
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

        // Player search and filters
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPlayers(e.target.value);
            });
        }

        const activityFilter = document.getElementById('activity-filter');
        if (activityFilter) {
            activityFilter.addEventListener('change', (e) => {
                this.filterPlayersByActivity(e.target.value);
            });
        }

        // Refresh players
        const refreshBtn = document.getElementById('refresh-players');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadPlayersData();
            });
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('admin-login-error');
        
        try {
            this.showLoading(true);
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
            
        } catch (error) {
            console.error('Admin login failed:', error);
            errorDiv.textContent = error.message || 'Invalid admin credentials';
            errorDiv.style.display = 'block';
        } finally {
            this.showLoading(false);
        }
    }

    async handleAdminLogout() {
        try {
            console.log('Admin logout initiated...');
            await enhancedAdminLogout();
            
            this.sessionToken = null;
            this.adminUser = null;
            this.isAuthenticated = false;
            
            // Destroy all charts
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
            
            console.log('Admin logout successful');
            this.showLogin();
            
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

        // Load section-specific data
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
    // DATA LOADING
    // ===================================================

    async loadInitialData() {
        if (!this.isAuthenticated) return;
        
        try {
            console.log('Loading initial admin data...');
            await this.loadDashboardData();
            await this.loadAnalyticsData(this.currentAnalytics);
            console.log('Initial admin data loaded');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadSectionData(section) {
        if (!this.isAuthenticated) return;
        
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
    }

    async loadDashboardData() {
        try {
            // Load key metrics in parallel
            const [
                currentGames,
                activePlayers,
                playtimeLeaderboard,
                firstRunMasters
            ] = await Promise.all([
                getAdminCurrentGames(this.sessionToken),
                getAdminActivePlayers(this.sessionToken),
                getAdminPlaytimeLeaderboard(this.sessionToken),
                getAdminFirstRunMasters(this.sessionToken)
            ]);

            // Update dashboard metrics
            this.updateDashboardMetrics({
                totalPlayers: activePlayers ? activePlayers.length : 0,
                activeToday: activePlayers ? activePlayers.filter(p => p.activity_status === 'Active').length : 0,
                currentGames: currentGames ? currentGames.length : 0,
                firstRunMasters: firstRunMasters ? firstRunMasters.length : 0
            });

            // Render current games
            this.renderCurrentGames(currentGames);
            
            // Render playtime leaderboard
            this.renderPlaytimeLeaderboard(playtimeLeaderboard);

        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadAnalyticsData(type) {
        try {
            const container = document.getElementById(`analytics-${type}`);
            if (!container) return;

            container.innerHTML = '<div class="loading">Loading analytics...</div>';

            let data;
            switch (type) {
                case 'first-run-masters':
                    data = await getAdminFirstRunMasters(this.sessionToken);
                    this.renderFirstRunMasters(container, data);
                    break;
                case 'upgrade-adoption':
                    data = await getAdminUpgradeAdoption(this.sessionToken);
                    this.renderUpgradeAdoption(container, data);
                    break;
                case 'player-progression':
                    data = await getAdminPlayerProgression(this.sessionToken);
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

            container.innerHTML = '<div class="loading">Loading players...</div>';

            const data = await getAdminActivePlayers(this.sessionToken);
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
    // RENDERING FUNCTIONS
    // ===================================================

    updateDashboardMetrics(metrics) {
        document.getElementById('total-players').textContent = metrics.totalPlayers || '-';
        document.getElementById('active-today').textContent = metrics.activeToday || '-';
        document.getElementById('current-games').textContent = metrics.currentGames || '-';
        document.getElementById('first-run-masters').textContent = metrics.firstRunMasters || '-';
    }

    renderCurrentGames(games) {
        const container = document.getElementById('current-games-table');
        if (!container) return;
        
        if (!games || games.length === 0) {
            container.innerHTML = '<div class="loading">No active games</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Run #</th>
                        <th>Duration</th>
                        <th>Floor</th>
                        <th>Kills</th>
                        <th>Session Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.map(game => `
                        <tr>
                            <td>${game.player}</td>
                            <td>#${game.run_number}</td>
                            <td>${game.minutes_playing}m</td>
                            <td>${game.current_level}</td>
                            <td>${game.current_kills}</td>
                            <td><span class="activity-status ${game.session_duration_type.toLowerCase()}">${game.session_duration_type}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlaytimeLeaderboard(leaderboard) {
        const container = document.getElementById('playtime-leaderboard');
        if (!container) return;
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="loading">No playtime data</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Hours</th>
                        <th>Sessions</th>
                        <th>Best Floor</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.slice(0, 10).map((player, index) => `
                        <tr>
                            <td class="rank-cell">#${index + 1}</td>
                            <td>${player.dedicated_player}</td>
                            <td>${player.hours_played}h</td>
                            <td>${player.sessions}</td>
                            <td>Floor ${player.best_achievement}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderFirstRunMasters(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No first run masters found</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Registration Date</th>
                        <th>Bosses Defeated</th>
                        <th>First Dragon Kill</th>
                        <th>Classification</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(player => `
                        <tr>
                            <td>${player.player_name}</td>
                            <td>${new Date(player.registration_date).toLocaleDateString()}</td>
                            <td>${player.bosses_defeated_first_run}/3</td>
                            <td>${new Date(player.first_dragon_kill_date).toLocaleDateString()}</td>
                            <td><span class="skill-classification ${player.skill_classification.toLowerCase().replace(' ', '-')}">${player.skill_classification}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderUpgradeAdoption(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No upgrade adoption data</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Upgrade Type</th>
                        <th>First Time Buyers</th>
                        <th>Adoption Rate</th>
                        <th>Avg First Purchase Run</th>
                        <th>Date Range</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(upgrade => `
                        <tr>
                            <td><strong>${upgrade.upgrade_name}</strong></td>
                            <td>${upgrade.first_time_buyers}</td>
                            <td><strong>${upgrade.adoption_percentage}%</strong></td>
                            <td>Run ${upgrade.avg_first_purchase_run}</td>
                            <td>${new Date(upgrade.earliest_purchase).toLocaleDateString()} - ${new Date(upgrade.latest_purchase).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlayerProgression(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No player progression data</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Current Run</th>
                        <th>Sessions</th>
                        <th>Best Progress</th>
                        <th>Experience Tier</th>
                        <th>Total Kills</th>
                        <th>Total Spent</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 50).map(player => `
                        <tr>
                            <td>${player.player_name}</td>
                            <td>#${player.current_run}</td>
                            <td>${player.sessions_played}</td>
                            <td>Floor ${player.best_progress}</td>
                            <td><span class="experience-tier ${player.experience_tier.toLowerCase()}">${player.experience_tier}</span></td>
                            <td>${player.combat_experience}</td>
                            <td>${player.total_spent} gold</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlayersTable(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No players data</div>';
            return;
        }

        this.playersData = data; // Store for filtering

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Last Active</th>
                        <th>Current Run</th>
                        <th>Total Sessions</th>
                        <th>Lifetime Kills</th>
                        <th>Best Floor</th>
                        <th>Activity Status</th>
                    </tr>
                </thead>
                <tbody id="players-table-body">
                    ${data.map(player => `
                        <tr data-player-name="${player.player_name.toLowerCase()}" data-activity="${player.activity_status}">
                            <td>${player.player_name}</td>
                            <td>${new Date(player.last_active).toLocaleDateString()}</td>
                            <td>#${player.current_run}</td>
                            <td>${player.total_sessions}</td>
                            <td>${player.lifetime_kills}</td>
                            <td>Floor ${player.best_floor}</td>
                            <td><span class="activity-status ${player.activity_status.toLowerCase()}">${player.activity_status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    // ===================================================
    // CHART FUNCTIONS - TEMPORARILY DISABLED
    // ===================================================
    
    // loadChartsData() - Disabled
    // createActivityTrendsChart() - Disabled
    // createPlaytimeDistributionChart() - Disabled
    // createRunExperienceChart() - Disabled
    // createSessionDurationChart() - Disabled
    // createUpgradeAdoptionChart() - Disabled
    //
    // To re-enable charts:
    // 1. Uncomment chart imports at the top
    // 2. Uncomment charts case in loadSectionData()
    // 3. Uncomment charts section in admin.html
    // 4. Restore all chart functions

    // ===================================================
    // FILTERING FUNCTIONS
    // ===================================================

    filterPlayers(searchTerm) {
        if (!this.playersData) return;

        const rows = document.querySelectorAll('#players-table-body tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const playerName = row.dataset.playerName;
            const isVisible = playerName.includes(term);
            row.style.display = isVisible ? '' : 'none';
        });
    }

    filterPlayersByActivity(activityStatus) {
        if (!this.playersData) return;

        const rows = document.querySelectorAll('#players-table-body tr');

        rows.forEach(row => {
            const activity = row.dataset.activity;
            const isVisible = activityStatus === 'all' || activity === activityStatus;
            row.style.display = isVisible ? '' : 'none';
        });
    }

    // ===================================================
    // UTILITY FUNCTIONS
    // ===================================================

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById(`${type}-message`);
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// ===================================================
// INITIALIZATION
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Optimized Admin Dashboard...');
    new OptimizedAdminDashboard();
}); 