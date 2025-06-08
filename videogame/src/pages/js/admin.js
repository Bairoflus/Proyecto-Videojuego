/**
 * Admin Dashboard JavaScript
 * Handles all admin functionality including analytics, leaderboards, and player management
 */

import { 
    getLeaderboard, 
    getEconomyAnalytics, 
    getPlayerProgression,
    getUserStats,
    logoutUser,
    apiRequest
} from '../../utils/api.js';

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentLeaderboard = 'floors';
        this.currentAnalytics = 'economy';
        this.dashboardData = {};
        
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadInitialData();
    }

    // ===================================================
    // AUTHENTICATION AND SECURITY
    // ===================================================

    checkAdminAuth() {
        const sessionToken = localStorage.getItem('sessionToken');
        const userId = localStorage.getItem('currentUserId');
        const userRole = localStorage.getItem('userRole');

        if (!sessionToken || !userId || userRole !== 'admin') {
            this.showMessage('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = 'landing.html';
            }, 2000);
            return;
        }

        // Display admin user info
        const username = localStorage.getItem('username') || 'Admin';
        document.getElementById('admin-user').textContent = `Welcome, ${username}`;
    }

    // ===================================================
    // EVENT LISTENERS SETUP
    // ===================================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Leaderboard tabs
        document.querySelectorAll('[data-leaderboard]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLeaderboard(e.target.dataset.leaderboard);
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
            this.handleLogout();
        });

        // Player search
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPlayers(e.target.value);
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

    // ===================================================
    // NAVIGATION
    // ===================================================

    switchSection(section) {
        if (!section) return;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        this.loadSectionData(section);
    }

    switchLeaderboard(type) {
        if (!type) return;

        // Update tabs
        document.querySelectorAll('[data-leaderboard]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-leaderboard="${type}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.leaderboard-table').forEach(table => {
            table.classList.remove('active');
        });
        document.getElementById(`leaderboard-${type}`).classList.add('active');

        this.currentLeaderboard = type;
        this.loadLeaderboardData(type);
    }

    switchAnalytics(type) {
        if (!type) return;

        // Update tabs
        document.querySelectorAll('[data-analytics]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-analytics="${type}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.analytics-table').forEach(table => {
            table.classList.remove('active');
        });
        document.getElementById(`analytics-${type}`).classList.add('active');

        this.currentAnalytics = type;
        this.loadAnalyticsData(type);
    }

    // ===================================================
    // DATA LOADING
    // ===================================================

    async loadInitialData() {
        try {
            await this.loadDashboardData();
            await this.loadLeaderboardData(this.currentLeaderboard);
            await this.loadAnalyticsData(this.currentAnalytics);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'leaderboards':
                await this.loadLeaderboardData(this.currentLeaderboard);
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
            // Load current games
            const currentGames = await this.getAdminData('/status/current-games');
            this.renderCurrentGames(currentGames);

            // Load active players
            const activePlayers = await this.getAdminData('/status/active-players');
            this.renderActivePlayersCount(activePlayers);

            // Load dashboard metrics
            await this.loadDashboardMetrics();

            // Load recent activity
            this.renderRecentActivity();

        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboardMetrics() {
        try {
            // Get all player progression data for metrics
            const progression = await getPlayerProgression();
            
            if (progression && progression.length > 0) {
                const totalPlayers = progression.length;
                const totalRuns = progression.reduce((sum, player) => sum + (player.sessions_played || 0), 0);
                const totalKills = progression.reduce((sum, player) => sum + (player.combat_experience || 0), 0);
                
                // Count active players (played in last 24h - approximation)
                const activePlayers = progression.filter(player => 
                    new Date() - new Date(player.registration_date) < 24 * 60 * 60 * 1000
                ).length;

                this.updateDashboardMetrics({
                    totalPlayers,
                    activePlayers,
                    totalRuns,
                    totalKills
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard metrics:', error);
        }
    }

    updateDashboardMetrics(metrics) {
        document.getElementById('total-players').textContent = metrics.totalPlayers || '-';
        document.getElementById('active-players').textContent = metrics.activePlayers || '-';
        document.getElementById('total-runs').textContent = metrics.totalRuns || '-';
        document.getElementById('total-kills').textContent = metrics.totalKills || '-';
    }

    async loadLeaderboardData(type) {
        try {
            const container = document.getElementById(`leaderboard-${type}`);
            container.innerHTML = '<div class="loading">Loading leaderboard...</div>';

            const data = await getLeaderboard(type);
            this.renderLeaderboard(container, data, type);

        } catch (error) {
            console.error(`Failed to load ${type} leaderboard:`, error);
            const container = document.getElementById(`leaderboard-${type}`);
            container.innerHTML = `<div class="error">Failed to load ${type} leaderboard</div>`;
        }
    }

    async loadAnalyticsData(type) {
        try {
            const container = document.getElementById(`analytics-${type}`);
            container.innerHTML = '<div class="loading">Loading analytics...</div>';

            let data;
            switch (type) {
                case 'economy':
                    data = await getEconomyAnalytics();
                    break;
                case 'combat':
                    data = await this.getAdminData('/analytics/combat');
                    break;
                case 'progression':
                    data = await getPlayerProgression();
                    break;
            }

            this.renderAnalytics(container, data, type);

        } catch (error) {
            console.error(`Failed to load ${type} analytics:`, error);
            const container = document.getElementById(`analytics-${type}`);
            container.innerHTML = `<div class="error">Failed to load ${type} analytics</div>`;
        }
    }

    async loadPlayersData() {
        try {
            const container = document.getElementById('players-table');
            container.innerHTML = '<div class="loading">Loading players...</div>';

            const data = await getPlayerProgression();
            this.renderPlayersTable(container, data);

        } catch (error) {
            console.error('Failed to load players data:', error);
            const container = document.getElementById('players-table');
            container.innerHTML = '<div class="error">Failed to load players data</div>';
        }
    }

    // ===================================================
    // RENDERING FUNCTIONS
    // ===================================================

    renderCurrentGames(games) {
        const container = document.getElementById('current-games-table');
        
        if (!games || games.length === 0) {
            container.innerHTML = '<div class="loading">No active games</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Duration</th>
                        <th>Floor</th>
                        <th>Kills</th>
                        <th>Gold</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.map(game => `
                        <tr>
                            <td>${game.player}</td>
                            <td>${game.minutes_playing}m</td>
                            <td>${game.current_level}</td>
                            <td>${game.current_kills}</td>
                            <td>${game.current_gold}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderActivePlayersCount(players) {
        // This data is used in updateDashboardMetrics
        this.dashboardData.activePlayers = players ? players.length : 0;
    }

    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        
        // Simulated recent activity (in a real app, this would come from an API)
        const activities = [
            { icon: '🎮', text: 'New player registered', time: '2 min ago' },
            { icon: '🐉', text: 'Boss defeated on Floor 3', time: '5 min ago' },
            { icon: '🏆', text: 'Player reached new high score', time: '8 min ago' },
            { icon: '💰', text: 'Shop purchase made', time: '12 min ago' },
            { icon: '⚔️', text: 'Enemy kill recorded', time: '15 min ago' }
        ];

        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderLeaderboard(container, data, type) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No leaderboard data available</div>';
            return;
        }

        let headers, rowRenderer;

        switch (type) {
            case 'floors':
                headers = ['Rank', 'Player', 'Max Floor', 'Total Runs', 'Total Kills', 'Gold Invested'];
                rowRenderer = (item, index) => `
                    <tr>
                        <td class="rank-cell">#${index + 1}</td>
                        <td>${item.champion}</td>
                        <td>${item.max_level}</td>
                        <td>${item.total_attempts}</td>
                        <td>${item.total_eliminations}</td>
                        <td>${item.gold_invested || 0}</td>
                    </tr>
                `;
                break;
            case 'bosses':
                headers = ['Rank', 'Player', 'Bosses Defeated', 'Progression', 'Total Runs'];
                rowRenderer = (item, index) => `
                    <tr>
                        <td class="rank-cell">#${index + 1}</td>
                        <td>${item.boss_slayer}</td>
                        <td>${item.bosses_defeated}</td>
                        <td>Floor ${item.progression}</td>
                        <td>${item.attempts}</td>
                    </tr>
                `;
                break;
            case 'playtime':
                headers = ['Rank', 'Player', 'Hours Played', 'Sessions', 'Best Floor'];
                rowRenderer = (item, index) => `
                    <tr>
                        <td class="rank-cell">#${index + 1}</td>
                        <td>${item.dedicated_player}</td>
                        <td>${item.hours_played}h</td>
                        <td>${item.sessions}</td>
                        <td>Floor ${item.best_achievement}</td>
                    </tr>
                `;
                break;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(rowRenderer).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderAnalytics(container, data, type) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No analytics data available</div>';
            return;
        }

        let headers, rowRenderer;

        switch (type) {
            case 'economy':
                headers = ['Weapon Type', 'Tier', 'Purchases', 'Avg Price', 'Total Revenue', 'Unique Buyers'];
                rowRenderer = (item) => `
                    <tr>
                        <td>${item.item_category}</td>
                        <td>${item.tier}</td>
                        <td>${item.purchase_count}</td>
                        <td>${Math.round(item.avg_price)} gold</td>
                        <td>${item.total_revenue} gold</td>
                        <td>${item.unique_buyers || 0}</td>
                    </tr>
                `;
                break;
            case 'combat':
                headers = ['Enemy Type', 'Floor', 'Room', 'Total Kills', 'Players Involved'];
                rowRenderer = (item) => `
                    <tr>
                        <td>${item.creature_type}</td>
                        <td>${item.encounter_level}</td>
                        <td>${item.battle_zone}</td>
                        <td>${item.elimination_count}</td>
                        <td>${item.hunters_involved}</td>
                    </tr>
                `;
                break;
            case 'progression':
                headers = ['Player', 'Registration', 'Sessions', 'Best Floor', 'Skill Tier', 'Spending Tier'];
                rowRenderer = (item) => `
                    <tr>
                        <td>${item.player_name}</td>
                        <td>${new Date(item.registration_date).toLocaleDateString()}</td>
                        <td>${item.sessions_played}</td>
                        <td>Floor ${item.best_progress}</td>
                        <td>${item.skill_tier}</td>
                        <td>${item.spending_tier || 'Unknown'}</td>
                    </tr>
                `;
                break;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.slice(0, 50).map(rowRenderer).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    renderPlayersTable(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="loading">No players data available</div>';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Registration</th>
                        <th>Sessions</th>
                        <th>Best Progress</th>
                        <th>Combat Experience</th>
                        <th>Skill Tier</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(player => `
                        <tr>
                            <td>${player.player_name}</td>
                            <td>${new Date(player.registration_date).toLocaleDateString()}</td>
                            <td>${player.sessions_played}</td>
                            <td>Floor ${player.best_progress}</td>
                            <td>${player.combat_experience} kills</td>
                            <td><span class="skill-tier-${player.skill_tier.toLowerCase()}">${player.skill_tier}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    // ===================================================
    // UTILITY FUNCTIONS
    // ===================================================

    async getAdminData(endpoint) {
        try {
            const response = await apiRequest(endpoint);
            return response.data || response;
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            throw error;
        }
    }

    filterPlayers(searchTerm) {
        const table = document.querySelector('#players-table .data-table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const playerName = row.cells[0].textContent.toLowerCase();
            if (playerName.includes(term)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async handleLogout() {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            if (sessionToken) {
                await logoutUser(sessionToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear all session data
            localStorage.clear();
            window.location.href = 'landing.html';
        }
    }

    showMessage(text, type) {
        const messageContainer = document.getElementById(`${type}-message`);
        if (messageContainer) {
            messageContainer.textContent = text;
            messageContainer.style.display = 'block';
            
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
}); 