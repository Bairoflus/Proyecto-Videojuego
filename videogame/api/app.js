// ===================================================
// SHATTERED TIMELINE API - OPTIMIZED VERSION
// ===================================================
// Database: dbshatteredtimeline
// Version: 2.0 - Optimized API
// ===================================================

const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// ===================================================
// DATABASE CONFIGURATION
// ===================================================

const dbConfig = {
  host: 'localhost',
  user: 'tc2005b',
  password: 'qwer1234',
  database: 'dbshatteredtimeline' // ← NUEVA BASE DE DATOS OPTIMIZADA
};

async function createConnection() {
  return await mysql.createConnection(dbConfig);
}

// ===================================================
// BASIC MIDDLEWARE
// ===================================================

app.use(express.json());

// CORS simple para desarrollo
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ===================================================
// ROOT ENDPOINT
// ===================================================

app.get('/', (req, res) => {
    res.json({
        message: 'Shattered Timeline API v2.0',
        status: 'Server is running',
        database: 'dbshatteredtimeline',
        features: [
            'Optimized database',
        ]
    });
});

// ===================================================
// AUTHENTICATION
// ===================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    let connection;
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Faltan datos: username, email, password' 
            });
        }
        
        connection = await createConnection();
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Insertar usuario (trigger automático crea player_settings y player_stats)
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        
        res.status(201).json({
            success: true,
            userId: result.insertId,
            message: 'User registered successfully'
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false,
                message: 'Username or email already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Error registering user' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing username or password' 
            });
        }
        
        connection = await createConnection();
        
        // Find user by username
        const [users] = await connection.execute(
            'SELECT user_id, password_hash FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        // Create new session
        const sessionToken = require('crypto').randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        const [sessionResult] = await connection.execute(
            'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            [user.user_id, sessionToken, expiresAt]
        );
        
        // Update last_login
        await connection.execute(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );
        
        res.status(200).json({
            success: true,
            userId: user.user_id,
            sessionToken: sessionToken,
            sessionId: sessionResult.insertId,
            expiresAt: expiresAt
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
    let connection;
    try {
        const { sessionToken } = req.body;
        
        if (!sessionToken) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing sessionToken' 
            });
        }
        
        connection = await createConnection();
        
        const [result] = await connection.execute(
            'UPDATE sessions SET is_active = FALSE, logout_at = NOW() WHERE session_token = ?',
            [sessionToken]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Session not found' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// USER CONFIGURATIONS
// ===================================================

// GET /api/users/:userId/settings
app.get('/api/users/:userId/settings', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [settings] = await connection.execute(
            'SELECT * FROM vw_player_config WHERE player = ?',
            [userId]
        );
        
        if (settings.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Settings not found' 
            });
        }
        
        res.json({
            success: true,
            data: settings[0]
        });
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/users/:userId/settings
app.put('/api/users/:userId/settings', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        const { musicVolume, sfxVolume, showFps, autoSaveEnabled } = req.body;
        
        connection = await createConnection();
        
        // Construir query dinámica solo con campos proporcionados
            const updateFields = [];
            const updateValues = [];
            
            if (musicVolume !== undefined) {
                updateFields.push('music_volume = ?');
                updateValues.push(musicVolume);
            }
            if (sfxVolume !== undefined) {
                updateFields.push('sfx_volume = ?');
                updateValues.push(sfxVolume);
            }
        if (showFps !== undefined) {
            updateFields.push('show_fps = ?');
            updateValues.push(showFps);
            }
        if (autoSaveEnabled !== undefined) {
            updateFields.push('auto_save_enabled = ?');
            updateValues.push(autoSaveEnabled);
            }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No valid settings provided' 
            });
        }
        
            updateValues.push(userId);
            
            await connection.execute(
            `UPDATE player_settings SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
                updateValues
        );
        
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
        
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// BASIC STATISTICS
// ===================================================

// GET /api/users/:userId/stats
app.get('/api/users/:userId/stats', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [stats] = await connection.execute(
            'SELECT * FROM vw_player_metrics WHERE player = ?',
            [userId]
        );
        
        if (stats.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Stats not found' 
            });
        }
        
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// NEW: GET /api/users/:userId/complete-stats
app.get('/api/users/:userId/complete-stats', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        
        // Use existing views instead of missing complete_player_stats_view
        const [playerStats] = await connection.execute(
            'SELECT * FROM vw_player_metrics WHERE player = ?',
            [userId]
        );
        
        const [runHistory] = await connection.execute(
            'SELECT * FROM vw_game_history WHERE player = ? ORDER BY begin_time DESC LIMIT 10',
            [userId]
        );
        
        if (playerStats.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Complete stats not found' 
            });
        }

        // Format the data for frontend consumption using available data
        const data = playerStats[0];
        const completedRuns = runHistory.filter(run => run.finish_time !== null).length;
        const totalRuns = data.attempts || 0;
        const completionRate = totalRuns > 0 ? 
            Math.round((completedRuns / totalRuns) * 100) : 0;
        
        // Format playtime
        const playtimeSeconds = data.time_played || 0;
        const hours = Math.floor(playtimeSeconds / 3600);
        const minutes = Math.floor((playtimeSeconds % 3600) / 60);
        const playtimeFormatted = `${hours}h ${minutes}m`;
        
        res.json({
            success: true,
            data: {
                totalRuns: totalRuns,
                completedRuns: completedRuns,
                completionRate: completionRate,
                totalKills: data.eliminations || 0,
                bestRunKills: Math.max(...runHistory.map(run => run.enemies_defeated || 0), 0),
                maxDamageHit: 0, // Not available in current schema
                goldEarned: data.earnings || 0,
                goldSpent: 0, // Not available directly
                playtimeFormatted: playtimeFormatted,
                totalSessions: totalRuns, // Approximate
                firstPlayed: data.updated,
                lastPlayed: data.updated
            }
        });
    } catch (err) {
        console.error('Get complete stats error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// NEW: GET /api/users/:userId/current-run
app.get('/api/users/:userId/current-run', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        
        // Get current active run from run_history
        const [runStats] = await connection.execute(
            'SELECT * FROM run_history WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
            [userId]
        );
        
        if (runStats.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No current run found' 
            });
        }
        
        const currentRun = runStats[0];
        
        res.json({
            success: true,
            data: {
                runId: currentRun.run_id,
                startedAt: currentRun.started_at,
                currentFloor: currentRun.final_floor,
                totalKills: currentRun.total_kills,
                bossesKilled: currentRun.bosses_killed,
                goldEarned: currentRun.final_gold,
                status: 'active'
            }
        });
    } catch (err) {
        console.error('Get current run error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// RUN MANAGEMENT
// ===================================================

// POST /api/runs
app.post('/api/runs', async (req, res) => {
    let connection;
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing userId' 
            });
        }
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO run_history (user_id) VALUES (?)',
            [userId]
        );
        
        res.status(201).json({
            success: true,
            runId: result.insertId,
            message: 'Run created successfully'
        });
        
    } catch (err) {
        console.error('Create run error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/runs/:runId/complete
app.put('/api/runs/:runId/complete', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { finalFloor, finalGold, causeOfDeath, totalKills, bossesKilled, durationSeconds } = req.body;
        
        connection = await createConnection();
        await connection.execute(
            `UPDATE run_history SET 
                ended_at = NOW(), 
                final_floor = ?, 
                final_gold = ?, 
                cause_of_death = ?, 
                total_kills = ?, 
                bosses_killed = ?, 
                duration_seconds = ?
             WHERE run_id = ?`,
            [finalFloor || 1, finalGold || 0, causeOfDeath || 'active', totalKills || 0, bossesKilled || 0, durationSeconds || 0, runId]
        );
        
        res.json({
            success: true,
            message: 'Run completed successfully'
        });
        
    } catch (err) {
        console.error('Complete run error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// PERMANENT UPGRADES
// ===================================================

// GET /api/users/:userId/permanent-upgrades
app.get('/api/users/:userId/permanent-upgrades', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [upgrades] = await connection.execute(
            'SELECT * FROM vw_player_boosts WHERE player = ?',
            [userId]
        );
        
        res.json({
            success: true,
            data: upgrades
        });
    } catch (error) {
        console.error('Error getting permanent upgrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permanent upgrades'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/users/:userId/permanent-upgrade
app.post('/api/users/:userId/permanent-upgrade', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        const { upgradeType } = req.body;
        
        // Validate upgrade type
        const validTypes = ['health_max', 'stamina_max', 'movement_speed'];
        if (!validTypes.includes(upgradeType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid upgrade type'
            });
        }
        
        connection = await createConnection();
        
        // Increment permanent upgrade level
        await connection.execute(
            `INSERT INTO permanent_player_upgrades (user_id, upgrade_type, level) 
             VALUES (?, ?, 1) 
             ON DUPLICATE KEY UPDATE level = level + 1`,
            [userId, upgradeType]
        );
        
        res.json({
            success: true,
            message: 'Permanent upgrade applied successfully'
        });
    } catch (error) {
        console.error('Error applying permanent upgrade:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying permanent upgrade'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// TEMPORARY WEAPON UPGRADES
// ===================================================

// GET /api/users/:userId/weapon-upgrades/:runId
app.get('/api/users/:userId/weapon-upgrades/:runId', async (req, res) => {
    let connection;
    try {
        const { userId, runId } = req.params;
        
        connection = await createConnection();
        const [upgrades] = await connection.execute(
            'SELECT * FROM vw_weapon_levels WHERE player = ? AND session = ?',
            [userId, runId]
        );
        
        res.json({
            success: true,
            data: upgrades[0] || { close_combat: 1, distance_combat: 1 }
        });
    } catch (error) {
        console.error('Error getting weapon upgrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching weapon upgrades'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/users/:userId/weapon-upgrades/:runId
app.put('/api/users/:userId/weapon-upgrades/:runId', async (req, res) => {
    let connection;
    try {
        const { userId, runId } = req.params;
        const { meleeLevel, rangedLevel } = req.body;
        
        connection = await createConnection();
            await connection.execute(
            `INSERT INTO weapon_upgrades_temp (user_id, run_id, melee_level, ranged_level) 
             VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
             melee_level = VALUES(melee_level), 
             ranged_level = VALUES(ranged_level)`,
            [userId, runId, meleeLevel || 1, rangedLevel || 1]
            );
        
        res.json({
            success: true,
            message: 'Weapon upgrades updated successfully'
        });
    } catch (error) {
        console.error('Error updating weapon upgrades:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating weapon upgrades'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE /api/users/:userId/weapon-upgrades/:runId - NEW: For weapon reset on death
app.delete('/api/users/:userId/weapon-upgrades/:runId', async (req, res) => {
    let connection;
    try {
        const { userId, runId } = req.params;
        
        connection = await createConnection();
    
        // Reset weapon upgrades to level 1 instead of deleting (better for data consistency)
        await connection.execute(
            `INSERT INTO weapon_upgrades_temp (user_id, run_id, melee_level, ranged_level) 
             VALUES (?, ?, 1, 1) 
             ON DUPLICATE KEY UPDATE 
             melee_level = 1, 
             ranged_level = 1`,
            [userId, runId]
        );
        
        console.log(`Weapon upgrades reset to level 1 for user ${userId}, run ${runId}`);
        
        res.json({
            success: true,
            message: 'Weapon upgrades reset successfully'
        });
    } catch (error) {
        console.error('Error resetting weapon upgrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting weapon upgrades'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// IMPROVED SAVE STATES
// ===================================================

// GET /api/users/:userId/save-state
app.get('/api/users/:userId/save-state', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [saveStates] = await connection.execute(
            'SELECT * FROM vw_player_save WHERE player = ?',
            [userId]
        );
        
        res.json({
            success: true,
            data: saveStates[0] || null
        });
    } catch (error) {
        console.error('Error getting save state:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching save state'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/users/:userId/save-state
app.post('/api/users/:userId/save-state', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        const { sessionId, runId, floorId, roomId, currentHp, gold } = req.body;
        
        connection = await createConnection();
        
        // Mark previous save states as inactive
        await connection.execute(
            'UPDATE save_states SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );
        
        // Create new active save state
        await connection.execute(
            `INSERT INTO save_states 
             (user_id, session_id, run_id, floor_id, room_id, current_hp, gold, is_active, logout_timestamp) 
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
            [userId, sessionId, runId, floorId || 1, roomId, currentHp, gold]
        );
        
        res.json({
            success: true,
            message: 'Game state saved successfully'
        });
    } catch (error) {
        console.error('Error saving save state:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving game state'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE /api/users/:userId/save-state
app.delete('/api/users/:userId/save-state', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        
        await connection.execute(
            'UPDATE save_states SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Save state cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing save state:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing save state'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// ANALYTICS AND TRACKING (OPTIMIZED)
// ===================================================

// POST /api/runs/:runId/enemy-kill
app.post('/api/runs/:runId/enemy-kill', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, enemyType, roomId, floor } = req.body;
        
        // Validar enemyType
        if (!['common', 'rare'].includes(enemyType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid enemy type' 
            });
        }
        
        connection = await createConnection();
        await connection.execute(
            'INSERT INTO enemy_kills (user_id, run_id, enemy_type, room_id, floor) VALUES (?, ?, ?, ?, ?)',
            [userId, runId, enemyType, roomId, floor]
        );
        
        res.status(201).json({
            success: true,
            message: 'Enemy kill registered'
        });
        
    } catch (err) {
        console.error('Enemy kill error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/boss-kill
app.post('/api/runs/:runId/boss-kill', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, bossType, floor, fightDuration, playerHpRemaining } = req.body;
        
        connection = await createConnection();
        await connection.execute(
            'INSERT INTO boss_kills (user_id, run_id, boss_type, floor, fight_duration_seconds, player_hp_remaining) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, bossType || 'dragon', floor, fightDuration || 0, playerHpRemaining || 0]
        );
        
        res.status(201).json({
            success: true,
            message: 'Boss kill registered'
        });
        
    } catch (err) {
        console.error('Boss kill error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/weapon-purchase
app.post('/api/runs/:runId/weapon-purchase', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, weaponType, upgradeLevel, cost } = req.body;
        
        connection = await createConnection();
        await connection.execute(
            'INSERT INTO weapon_upgrade_purchases (user_id, run_id, weapon_type, upgrade_level, cost) VALUES (?, ?, ?, ?, ?)',
            [userId, runId, weaponType, upgradeLevel, cost]
        );
        
        res.status(201).json({
            success: true,
            message: 'Weapon purchase registered'
        });
        
    } catch (err) {
        console.error('Weapon purchase error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// LEADERBOARDS AND ANALYTICS (NEW VIEWS)
// ===================================================

// GET /api/leaderboards/:type
app.get('/api/leaderboards/:type', async (req, res) => {
    let connection;
    try {
        const { type } = req.params;
        const validTypes = ['floors', 'bosses', 'playtime'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid leaderboard type'
            });
        }
        
        connection = await createConnection();
        const viewName = `vw_leaderboard_${type}`;
        
        const [leaderboard] = await connection.execute(
            `SELECT * FROM ${viewName}`
        );
        
        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching leaderboard'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/analytics/economy
app.get('/api/analytics/economy', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [economy] = await connection.execute(
            'SELECT * FROM vw_economy_stats'
        );
        
        res.json({
            success: true,
            data: economy
        });
    } catch (error) {
        console.error('Error getting economy analytics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching economy analytics'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/analytics/player-progression
app.get('/api/analytics/player-progression', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [progression] = await connection.execute(
            'SELECT * FROM vw_player_progression ORDER BY registration_date DESC LIMIT 50'
        );
        
        res.json({
            success: true,
            data: progression
        });
    } catch (error) {
        console.error('Error getting player progression:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching player progression'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/status/active-players
app.get('/api/status/active-players', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [players] = await connection.execute(
            'SELECT * FROM vw_active_players'
        );
        
        res.json({
            success: true,
            data: players
        });
    } catch (error) {
        console.error('Error getting active players:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching active players'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/status/current-games
app.get('/api/status/current-games', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [games] = await connection.execute(
            'SELECT * FROM vw_current_games'
        );
        
        res.json({
            success: true,
            data: games
        });
    } catch (error) {
        console.error('Error getting current games:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching current games'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// SERVER START
// ===================================================

app.listen(PORT, () => {
    console.log(`Shattered Timeline API v2.0 running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`   Auth: POST /api/auth/register, /api/auth/login, /api/auth/logout`);
    console.log(`   User: GET/PUT /api/users/:id/settings, GET /api/users/:id/stats`);
    console.log(`   Runs: POST /api/runs, PUT /api/runs/:id/complete`);
    console.log(`   Permanent: GET/POST /api/users/:id/permanent-upgrades`);
    console.log(`   Weapons: GET/PUT/DELETE /api/users/:id/weapon-upgrades/:runId`);
    console.log(`   Saves: GET/POST/DELETE /api/users/:id/save-state`);
    console.log(`   Analytics: GET /api/leaderboards/:type, /api/analytics/economy`);
    console.log(`   Status: GET /api/status/active-players, /api/status/current-games`);
    console.log(`\nOptimized`);
});

// ===================================================
// MODULE EXPORTS (for testing)
// ===================================================

module.exports = app; 