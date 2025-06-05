# 📊 ANALYTICS DASHBOARD IMPLEMENTATION GUIDE

## 🎯 **OVERVIEW**

This guide explains how to create a comprehensive **Admin Analytics Dashboard** for Shattered Timeline to visualize player behavior, game statistics, and performance metrics.

---

## 🏗️ **ARCHITECTURE PLAN**

### **Dashboard Components:**
1. **📈 Real-time Metrics** - Live player counts, active sessions
2. **🎮 Game Analytics** - Player progression, completion rates
3. **💰 Shop Analytics** - Purchase patterns, revenue tracking  
4. **⚔️ Combat Analytics** - Kill/death ratios, weapon usage
5. **🗺️ Room Analytics** - Room completion times, difficulty analysis
6. **👥 User Analytics** - Registration trends, retention rates

---

## 🔧 **STEP 1: BACKEND ANALYTICS APIs**

### **1.1. Add Analytics Endpoints to api/app.js:**

```javascript
// ================================================================
// ANALYTICS DASHBOARD ENDPOINTS
// ================================================================

/**
 * GET /api/analytics/overview
 * Dashboard overview with key metrics
 */
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [activeSessions] = await db.execute('SELECT COUNT(*) as count FROM player_sessions WHERE is_active = 1');
    const [totalRuns] = await db.execute('SELECT COUNT(*) as count FROM player_runs');
    const [totalRevenue] = await db.execute('SELECT SUM(price_paid) as total FROM user_purchases');

    res.json({
      success: true,
      overview: {
        totalUsers: totalUsers[0].count,
        activeSessions: activeSessions[0].count,
        totalRuns: totalRuns[0].count,
        totalRevenue: totalRevenue[0].total || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/players
 * Player behavior analytics
 */
app.get('/api/analytics/players', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const query = `
      SELECT 
        DATE(pr.start_time) as date,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN pr.run_status = 'completed' THEN 1 END) as completed_runs,
        AVG(pr.total_kills) as avg_kills,
        AVG(pr.gold_collected) as avg_gold
      FROM player_runs pr 
      WHERE pr.start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(pr.start_time)
      ORDER BY date DESC
    `;
    
    const [rows] = await db.execute(query, [days]);
    
    res.json({ success: true, playerAnalytics: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/weapons
 * Weapon usage statistics
 */
app.get('/api/analytics/weapons', async (req, res) => {
  try {
    const query = `
      SELECT 
        weapon_used,
        COUNT(*) as kill_count,
        AVG(damage_dealt) as avg_damage
      FROM player_kill_details 
      WHERE kill_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY weapon_used
      ORDER BY kill_count DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json({ success: true, weaponStats: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 🌐 **STEP 2: FRONTEND DASHBOARD**

### **2.1. Create Admin Dashboard Page:**

Create `videogame/src/pages/html/admin.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shattered Timeline - Admin Dashboard</title>
    <link rel="stylesheet" href="../css/admin.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1>🎮 Shattered Timeline Analytics</h1>
            <div class="refresh-controls">
                <button id="refreshBtn">🔄 Refresh</button>
                <span id="lastUpdate">Last updated: --</span>
            </div>
        </header>

        <!-- Overview Cards -->
        <section class="overview-cards">
            <div class="card">
                <h3>👥 Total Users</h3>
                <div class="metric" id="totalUsers">--</div>
            </div>
            <div class="card">
                <h3>🎯 Active Sessions</h3>
                <div class="metric" id="activeSessions">--</div>
            </div>
            <div class="card">
                <h3>🏃 Total Runs</h3>
                <div class="metric" id="totalRuns">--</div>
            </div>
            <div class="card">
                <h3>💰 Revenue</h3>
                <div class="metric" id="totalRevenue">--</div>
            </div>
        </section>

        <!-- Charts Section -->
        <section class="charts-section">
            <div class="chart-container">
                <h3>📈 Player Activity (Last 7 Days)</h3>
                <canvas id="playerActivityChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>⚔️ Weapon Usage</h3>
                <canvas id="weaponUsageChart"></canvas>
            </div>
        </section>

        <!-- Data Tables -->
        <section class="tables-section">
            <div class="table-container">
                <h3>🔥 Recent Activity</h3>
                <table id="recentActivity">
                    <thead>
                        <tr><th>Date</th><th>Runs</th><th>Completed</th><th>Avg Kills</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </section>
    </div>

    <script type="module" src="../js/admin.js"></script>
</body>
</html>
```

### **2.2. Create Admin Styling:**

Create `videogame/src/pages/css/admin.css`:

```css
/* Admin Dashboard Styles */
.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    min-height: 100vh;
    color: white;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
}

.overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.card {
    background: rgba(255,255,255,0.15);
    padding: 25px;
    border-radius: 10px;
    text-align: center;
    backdrop-filter: blur(10px);
}

.metric {
    font-size: 2.5em;
    font-weight: bold;
    margin-top: 10px;
    color: #64ffda;
}

.charts-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
}

.chart-container {
    background: rgba(255,255,255,0.15);
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

.table-container {
    background: rgba(255,255,255,0.15);
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.2);
}

button {
    background: #64ffda;
    color: #1e3c72;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
}

button:hover {
    background: #4fd3b8;
}
```

### **2.3. Create Dashboard Logic:**

Create `videogame/src/pages/js/admin.js`:

```javascript
/**
 * Admin Dashboard JavaScript
 * Handles real-time analytics display and chart updates
 */

class AdminDashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Admin Dashboard...');
        
        // Setup event listeners
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAllData();
        });

        // Load initial data
        await this.refreshAllData();
        
        // Setup auto-refresh every 30 seconds
        this.updateInterval = setInterval(() => {
            this.refreshAllData();
        }, 30000);
    }

    async refreshAllData() {
        try {
            await Promise.all([
                this.loadOverviewData(),
                this.loadPlayerAnalytics(),
                this.loadWeaponStats()
            ]);
            
            document.getElementById('lastUpdate').textContent = 
                `Last updated: ${new Date().toLocaleTimeString()}`;
                
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }

    async loadOverviewData() {
        const response = await fetch('/api/analytics/overview');
        const data = await response.json();
        
        if (data.success) {
            const overview = data.overview;
            document.getElementById('totalUsers').textContent = overview.totalUsers.toLocaleString();
            document.getElementById('activeSessions').textContent = overview.activeSessions.toLocaleString();
            document.getElementById('totalRuns').textContent = overview.totalRuns.toLocaleString();
            document.getElementById('totalRevenue').textContent = `$${(overview.totalRevenue || 0).toLocaleString()}`;
        }
    }

    async loadPlayerAnalytics() {
        const response = await fetch('/api/analytics/players?days=7');
        const data = await response.json();
        
        if (data.success) {
            this.updatePlayerActivityChart(data.playerAnalytics);
            this.updateRecentActivityTable(data.playerAnalytics);
        }
    }

    async loadWeaponStats() {
        const response = await fetch('/api/analytics/weapons');
        const data = await response.json();
        
        if (data.success) {
            this.updateWeaponUsageChart(data.weaponStats);
        }
    }

    updatePlayerActivityChart(data) {
        const ctx = document.getElementById('playerActivityChart').getContext('2d');
        
        if (this.charts.playerActivity) {
            this.charts.playerActivity.destroy();
        }

        this.charts.playerActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                    label: 'Total Runs',
                    data: data.map(d => d.total_runs),
                    borderColor: '#64ffda',
                    backgroundColor: 'rgba(100, 255, 218, 0.1)',
                    tension: 0.3
                }, {
                    label: 'Completed Runs',
                    data: data.map(d => d.completed_runs),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    x: { ticks: { color: 'white' } },
                    y: { ticks: { color: 'white' } }
                }
            }
        });
    }

    updateWeaponUsageChart(data) {
        const ctx = document.getElementById('weaponUsageChart').getContext('2d');
        
        if (this.charts.weaponUsage) {
            this.charts.weaponUsage.destroy();
        }

        this.charts.weaponUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.weapon_used),
                datasets: [{
                    data: data.map(d => d.kill_count),
                    backgroundColor: ['#64ffda', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            }
        });
    }

    updateRecentActivityTable(data) {
        const tbody = document.querySelector('#recentActivity tbody');
        tbody.innerHTML = '';
        
        data.slice(0, 5).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(row.date).toLocaleDateString()}</td>
                <td>${row.total_runs}</td>
                <td>${row.completed_runs}</td>
                <td>${row.avg_kills ? row.avg_kills.toFixed(1) : '0'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
```

---

## 🔒 **STEP 3: SECURITY & ACCESS CONTROL**

### **3.1. Add Admin Authentication:**

```javascript
// Add to api/app.js before analytics endpoints
const adminAuth = (req, res, next) => {
    const adminToken = req.headers['admin-token'];
    if (adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Protect analytics endpoints
app.use('/api/analytics', adminAuth);
```

### **3.2. Environment Variable:**

Add to `.env` file:
```
ADMIN_TOKEN=your-secure-admin-token-here
```

---

## 🚀 **STEP 4: DEPLOYMENT & TESTING**

### **4.1. Add Route to Server:**

Update `videogame/src/server.js`:
```javascript
// Add admin route
if (req.url === '/admin' || req.url === '/admin.html') {
    res.writeHead(302, { 'Location': '/pages/html/admin.html' });
    return res.end();
}
```

### **4.2. Testing Commands:**

```bash
# Test analytics endpoints
curl -H "admin-token: your-token" http://localhost:3000/api/analytics/overview
curl -H "admin-token: your-token" http://localhost:3000/api/analytics/players
curl -H "admin-token: your-token" http://localhost:3000/api/analytics/weapons
```

### **4.3. Access Dashboard:**

Visit: `http://localhost:8080/admin`

---

## 📋 **IMPLEMENTATION CHECKLIST**

- [ ] Add analytics endpoints to backend
- [ ] Create admin.html page
- [ ] Create admin.css styling  
- [ ] Create admin.js dashboard logic
- [ ] Add admin authentication
- [ ] Add server route for /admin
- [ ] Test all analytics endpoints
- [ ] Verify charts display correctly
- [ ] Test real-time updates

---

**This dashboard provides comprehensive game analytics with real-time updates, beautiful visualizations, and secure admin access!** 📊 