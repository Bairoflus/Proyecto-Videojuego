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
  database: 'dbshatteredtimeline' // BASE DE DATOS OPTIMIZADA
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
        
        // NEW: Increment total_runs on login to keep track synchronized
        // This ensures total_runs counts login + logout + completion events
        await connection.execute(
            `INSERT INTO player_stats (user_id, total_runs, last_updated) 
             VALUES (?, 1, NOW()) 
             ON DUPLICATE KEY UPDATE 
             total_runs = total_runs + 1,
             last_updated = NOW()`,
            [user.user_id]
        );
        
        console.log(`User ${user.user_id} login: total_runs incremented`);
        
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
        
        // Get user ID from session token for run tracking
        const [sessionRows] = await connection.execute(
            'SELECT user_id FROM sessions WHERE session_token = ? AND is_active = TRUE',
            [sessionToken]
        );
        
        let userId = null;
        if (sessionRows.length > 0) {
            userId = sessionRows[0].user_id;
        }
        
        // Invalidate session
        await connection.execute(
            'UPDATE sessions SET is_active = FALSE WHERE session_token = ?',
            [sessionToken]
        );
        
        // NEW: Increment total_runs in player_stats when user logs out
        // This differentiates between "runs started" (logout) vs "runs completed" (death/victory)
        if (userId) {
            // NEW: Get current run progress to sync run_number properly
            const [runProgressData] = await connection.execute(
                'SELECT current_run_number FROM user_run_progress WHERE user_id = ?',
                [userId]
            );
            
            const currentRunNumber = runProgressData.length > 0 ? runProgressData[0].current_run_number : 1;
            
            // NEW: Also accumulate current run's gold to total_gold_earned on logout
            const [currentRunData] = await connection.execute(
                'SELECT run_id, final_gold, max_damage_hit FROM run_history WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
                [userId]
            );
            
            const currentGold = currentRunData.length > 0 ? (currentRunData[0].final_gold || 0) : 0;
            const currentMaxDamage = currentRunData.length > 0 ? (currentRunData[0].max_damage_hit || 0) : 0;
            
            // NEW: CRITICAL FIX - Sync run_number in run_history for current active run
            if (currentRunData.length > 0) {
                const currentRunId = currentRunData[0].run_id;
                
                // Update run_number in run_history to match user_run_progress
                await connection.execute(
                    'UPDATE run_history SET run_number = ? WHERE run_id = ? AND ended_at IS NULL',
                    [currentRunNumber, currentRunId]
                );
                
                console.log(`Run number synchronized: runId ${currentRunId} set to run_number ${currentRunNumber}`);
                
                // Also update save_states if they exist to keep run_number in sync
                await connection.execute(
                    'UPDATE save_states SET run_number = ? WHERE user_id = ? AND is_active = TRUE',
                    [currentRunNumber, userId]
                );
                
                console.log(`Save states run_number synchronized to ${currentRunNumber}`);
            }
            
            await connection.execute(
                `INSERT INTO player_stats (user_id, total_runs, total_gold_earned, max_damage_hit, last_updated) 
                 VALUES (?, 1, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE 
                 total_runs = total_runs + 1,
                 total_gold_earned = total_gold_earned + ?,
                 max_damage_hit = GREATEST(max_damage_hit, ?),
                 last_updated = NOW()`,
                [userId, currentGold, currentMaxDamage, currentGold, currentMaxDamage]
            );
            
            console.log(`User ${userId} logout: total_runs incremented, +${currentGold} gold added to total, max damage: ${currentMaxDamage}, run_number synced: ${currentRunNumber}`);
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
// CONFIGURATION ENDPOINTS
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

// NEW: GET /api/users/:userId/complete-stats (ENHANCED v3.0)
app.get('/api/users/:userId/complete-stats', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        
        // Use enhanced v3.0 view with run tracking
        const [playerStats] = await connection.execute(
            'SELECT * FROM vw_complete_player_stats WHERE player_id = ?',
            [userId]
        );
        
        if (playerStats.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Complete stats not found' 
            });
        }

        res.json({
            success: true,
            data: playerStats[0]
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
        const { finalFloor, finalGold, causeOfDeath, totalKills, bossesKilled, durationSeconds, maxDamageHit } = req.body;
        
        connection = await createConnection();
        
        // Update run completion
        await connection.execute(
            `UPDATE run_history SET 
                ended_at = NOW(), 
                final_floor = ?, 
                final_gold = ?, 
                cause_of_death = ?, 
                total_kills = ?, 
                bosses_killed = ?, 
                duration_seconds = ?,
                max_damage_hit = ?
             WHERE run_id = ?`,
            [finalFloor || 1, finalGold || 0, causeOfDeath || 'active', totalKills || 0, bossesKilled || 0, durationSeconds || 0, maxDamageHit || 0, runId]
        );
        
        // REMOVED: Manual player_stats update - the trigger tr_update_player_stats_after_run handles this automatically
        // This prevents duplication when the run ends
        console.log(`Run ${runId} completed - trigger will handle all stats updates automatically`);
        
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

// NEW: PUT /api/runs/:runId/stats - Update run statistics during gameplay (ENHANCED)
app.put('/api/runs/:runId/stats', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { maxDamageHit, totalGoldEarned, totalKills } = req.body;
        
        connection = await createConnection();
        
        // Build dynamic update query for run_history
        const updateFields = [];
        const updateValues = [];
        
        if (maxDamageHit !== undefined) {
            updateFields.push('max_damage_hit = GREATEST(max_damage_hit, ?)');
            updateValues.push(maxDamageHit);
        }
        
        if (totalGoldEarned !== undefined) {
            updateFields.push('final_gold = ?');
            updateValues.push(totalGoldEarned);
        }
        
        if (totalKills !== undefined) {
            updateFields.push('total_kills = ?');
            updateValues.push(totalKills);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid stats provided'
            });
        }
        
        updateValues.push(runId);
        
        // Update current run stats
        await connection.execute(
            `UPDATE run_history SET ${updateFields.join(', ')} WHERE run_id = ? AND ended_at IS NULL`,
            updateValues
        );
        
        // NEW: Also update historical player_stats with current run data
        if (totalGoldEarned !== undefined || maxDamageHit !== undefined) {
            // Get user_id for this run
            const [runData] = await connection.execute(
                'SELECT user_id FROM run_history WHERE run_id = ?',
                [runId]
            );
            
            if (runData.length > 0) {
                const userId = runData[0].user_id;
                
                // SIMPLIFIED: Just update max values - total accumulation will happen on run completion
                if (maxDamageHit !== undefined) {
                    await connection.execute(
                        `INSERT INTO player_stats (user_id, max_damage_hit, last_updated) 
                         VALUES (?, ?, NOW()) 
                         ON DUPLICATE KEY UPDATE 
                         max_damage_hit = GREATEST(max_damage_hit, ?), 
                         last_updated = NOW()`,
                        [userId, maxDamageHit, maxDamageHit]
                    );
                    
                    console.log(`Player max damage updated for user ${userId}: ${maxDamageHit}`);
                }
                
                // NOTE: total_gold_earned will be updated when run completes to avoid double counting
                if (totalGoldEarned !== undefined) {
                    console.log(`Current run gold for user ${userId}: ${totalGoldEarned} (will be added to total on run completion)`);
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Run stats updated successfully'
        });
        
    } catch (err) {
        console.error('Update run stats error:', err);
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
            'SELECT * FROM vw_permanent_upgrades WHERE player = ?',
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
        
        // Increment permanent upgrade level (triggers will auto-calculate values)
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

// PUT /api/users/:userId/weapon-upgrades/:runId (ENHANCED v3.0)
app.put('/api/users/:userId/weapon-upgrades/:runId', async (req, res) => {
    let connection;
    try {
        const { userId, runId } = req.params;
        const { meleeLevel, rangedLevel } = req.body;
        
        connection = await createConnection();
        
        // Get current run number for this user
        const [runProgress] = await connection.execute(
            'SELECT current_run_number FROM user_run_progress WHERE user_id = ?',
            [userId]
        );
        
        const currentRunNumber = runProgress.length > 0 ? runProgress[0].current_run_number : 1;
        
        // ENHANCED v3.0: Include run_number and is_active
        await connection.execute(
            `INSERT INTO weapon_upgrades_temp (user_id, run_id, run_number, melee_level, ranged_level, is_active) 
             VALUES (?, ?, ?, ?, ?, TRUE) 
             ON DUPLICATE KEY UPDATE 
             melee_level = VALUES(melee_level), 
             ranged_level = VALUES(ranged_level),
             run_number = VALUES(run_number),
             is_active = TRUE`,
            [userId, runId, currentRunNumber, meleeLevel || 1, rangedLevel || 1]
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
        
        // Get current run number for this user
        const [runProgress] = await connection.execute(
            'SELECT current_run_number FROM user_run_progress WHERE user_id = ?',
            [userId]
        );
        
        const currentRunNumber = runProgress.length > 0 ? runProgress[0].current_run_number : 1;
        
        // Mark previous save states as inactive
        await connection.execute(
            'UPDATE save_states SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );
        
        // Create new active save state (ENHANCED: includes run_number)
        await connection.execute(
            `INSERT INTO save_states 
             (user_id, session_id, run_id, run_number, floor_id, room_id, current_hp, gold, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [userId, sessionId, runId, currentRunNumber, floorId || 1, roomId, currentHp, gold]
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

// POST /api/runs/:runId/enemy-kill (ENHANCED v3.0)
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
        
        // Get run_number for this run
        const [runData] = await connection.execute(
            'SELECT run_number FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        const runNumber = runData.length > 0 ? runData[0].run_number : 1;
        
        // ENHANCED v3.0: Include run_number
        await connection.execute(
            'INSERT INTO enemy_kills (user_id, run_id, run_number, enemy_type, room_id, floor) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, runNumber, enemyType, roomId, floor]
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

// POST /api/runs/:runId/boss-kill (ENHANCED v3.0)
app.post('/api/runs/:runId/boss-kill', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, bossType, floor, fightDuration, playerHpRemaining } = req.body;
        
        connection = await createConnection();
        
        // Get run_number for this run
        const [runData] = await connection.execute(
            'SELECT run_number FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        const runNumber = runData.length > 0 ? runData[0].run_number : 1;
        
        // ENHANCED v3.0: Include run_number
        await connection.execute(
            'INSERT INTO boss_kills (user_id, run_id, run_number, boss_type, floor, fight_duration_seconds, player_hp_remaining) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, runId, runNumber, bossType || 'dragon', floor, fightDuration || 0, playerHpRemaining || 0]
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

// POST /api/runs/:runId/weapon-purchase (ENHANCED v3.0)
app.post('/api/runs/:runId/weapon-purchase', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, weaponType, upgradeLevel, cost } = req.body;
        
        connection = await createConnection();
        
        // Get run_number for this run
        const [runData] = await connection.execute(
            'SELECT run_number FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        const runNumber = runData.length > 0 ? runData[0].run_number : 1;
        
        // ENHANCED v3.0: Include run_number
        await connection.execute(
            'INSERT INTO weapon_upgrade_purchases (user_id, run_id, run_number, weapon_type, upgrade_level, cost) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, runNumber, weaponType, upgradeLevel, cost]
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
// NEW v3.0: RUN PROGRESS AND PERSISTENCE
// ===================================================

// NEW: GET /api/users/:userId/run-progress
app.get('/api/users/:userId/run-progress', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [progress] = await connection.execute(
            'SELECT * FROM vw_user_run_progress WHERE player = ?',
            [userId]
        );
        
        if (progress.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User run progress not found'
            });
        }
        
        res.json({
            success: true,
            data: progress[0]
        });
    } catch (error) {
        console.error('Error getting run progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching run progress'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// NEW: GET /api/users/:userId/current-run-info
app.get('/api/users/:userId/current-run-info', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [runInfo] = await connection.execute(
            'SELECT * FROM vw_current_run_info WHERE player = ?',
            [userId]
        );
        
        if (runInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Current run info not found'
            });
        }
        
        res.json({
            success: true,
            data: runInfo[0]
        });
    } catch (error) {
        console.error('Error getting current run info:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current run info'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// NEW: GET /api/users/:userId/initialization-data
app.get('/api/users/:userId/initialization-data', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [initData] = await connection.execute(
            'SELECT * FROM vw_player_initialization WHERE player_id = ?',
            [userId]
        );
        
        if (initData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Player initialization data not found'
            });
        }
        
        // Parse permanent upgrades string into object
        const data = initData[0];
        if (data.permanent_upgrades) {
            const upgradesArray = data.permanent_upgrades.split(',');
            data.permanent_upgrades_parsed = {};
            upgradesArray.forEach(upgrade => {
                const [type, value] = upgrade.split(':');
                data.permanent_upgrades_parsed[type] = parseFloat(value);
            });
        } else {
            data.permanent_upgrades_parsed = {};
        }
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error getting initialization data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching initialization data'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// ENHANCED v3.0: TEMPORARY WEAPON UPGRADES
// ===================================================

// NEW: GET /api/users/:userId/active-weapon-upgrades
app.get('/api/users/:userId/active-weapon-upgrades', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [upgrades] = await connection.execute(
            'SELECT * FROM vw_active_weapon_upgrades WHERE player = ?',
            [userId]
        );
        
        // Return default levels if no active upgrades found
        const result = upgrades.length > 0 ? upgrades[0] : {
            close_combat: 1,
            distance_combat: 1,
            upgrade_status: false
        };
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting active weapon upgrades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active weapon upgrades'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ===================================================

/**
 * Middleware to verify admin authentication
 * Only users with role = 'admin' can access admin endpoints
 */
async function verifyAdminAuth(req, res, next) {
    let connection;
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Admin access denied: No session token provided'
            });
        }

        const sessionToken = authHeader.replace('Bearer ', '');
        
        connection = await createConnection();
        
        // Verify session token and admin role
        const [sessions] = await connection.execute(`
            SELECT s.*, u.role, u.username 
            FROM sessions s 
            INNER JOIN users u ON s.user_id = u.user_id 
            WHERE s.session_token = ? AND s.is_active = TRUE AND s.expires_at > NOW() AND u.role = 'admin'
        `, [sessionToken]);
        
        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Admin access denied: Invalid session or insufficient privileges'
            });
        }
        
        // Add admin user info to request
        req.adminUser = sessions[0];
        next();
        
    } catch (error) {
        console.error('Admin auth verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication verification failed'
        });
    } finally {
        if (connection) await connection.end();
    }
}

// ===================================================
// ADMIN AUTHENTICATION ENDPOINTS
// ===================================================

// POST /api/admin/auth/login
app.post('/api/admin/auth/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        
        console.log('Admin login attempt:', { username, hasPassword: !!password });
        
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ 
                success: false,
                message: 'Missing username or password' 
            });
        }
        
        console.log('Creating database connection...');
        connection = await createConnection();
        console.log('Database connection established');
        
        // Find admin user by username (only role = 'admin')
        console.log('Searching for admin user:', username);
        const [users] = await connection.execute(
            'SELECT user_id, password_hash, username FROM users WHERE username = ? AND role = "admin" AND is_active = TRUE',
            [username]
        );
        
        console.log('Query result:', { 
            usersFound: users.length, 
            userExists: users.length > 0,
            firstUserInfo: users.length > 0 ? { 
                id: users[0].user_id, 
                username: users[0].username,
                hashPreview: users[0].password_hash?.substring(0, 10) + '...'
            } : null
        });
        
        if (users.length === 0) {
            console.log('No admin user found with username:', username);
            return res.status(401).json({ 
                success: false,
                message: 'Admin access denied: Invalid credentials' 
            });
        }
        
        const user = users[0];
        console.log('Comparing password hash...');
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password match result:', passwordMatch);
        
        if (!passwordMatch) {
            console.log('Password does not match');
            return res.status(401).json({ 
                success: false,
                message: 'Admin access denied: Invalid credentials' 
            });
        }
        
        console.log('Password verified, creating session...');
        
        // Create new admin session
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
        
        console.log('Admin login successful for:', username);
        
        res.status(200).json({
            success: true,
            sessionToken: sessionToken,
            user: {
                id: user.user_id,
                username: user.username,
                role: 'admin'
            },
            expiresAt: expiresAt
        });
        
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Authentication server error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// TEMPORARY DEBUG ENDPOINT - REMOVE AFTER FIXING ISSUE
app.get('/api/admin/debug/users', async (req, res) => {
    let connection;
    try {
        console.log('Checking admin users in database...');
        connection = await createConnection();
        
        // Get all users
        const [allUsers] = await connection.execute('SELECT user_id, username, role, is_active FROM users ORDER BY created_at DESC LIMIT 10');
        
        // Get specifically admin users  
        const [adminUsers] = await connection.execute('SELECT user_id, username, email, role, is_active, password_hash FROM users WHERE role = "admin"');
        
        // Get users by username
        const [specificUsers] = await connection.execute('SELECT user_id, username, email, role, is_active, password_hash FROM users WHERE username IN ("admin", "devteam")');
        
        console.log('Results:', {
            totalUsers: allUsers.length,
            adminUsers: adminUsers.length,
            specificUsers: specificUsers.length
        });
        
        res.json({
            success: true,
            debug: {
                totalUsers: allUsers.length,
                allUsers: allUsers,
                adminUsers: adminUsers.map(u => ({
                    ...u,
                    password_hash: u.password_hash ? u.password_hash.substring(0, 20) + '...' : null
                })),
                specificUsers: specificUsers.map(u => ({
                    ...u,
                    password_hash: u.password_hash ? u.password_hash.substring(0, 20) + '...' : null
                }))
            }
        });
        
    } catch (error) {
        console.error('Endpoint error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/admin/auth/logout
app.post('/api/admin/auth/logout', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');
        
        connection = await createConnection();
        
        await connection.execute(
            'UPDATE sessions SET is_active = FALSE WHERE session_token = ?',
            [sessionToken]
        );

        res.status(200).json({
            success: true,
            message: 'Admin logged out successfully'
        });
        
    } catch (err) {
        console.error('Admin logout error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Logout error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/auth/verify
app.get('/api/admin/auth/verify', verifyAdminAuth, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.adminUser.user_id,
            username: req.adminUser.username,
            role: req.adminUser.role
        },
        message: 'Admin session verified'
    });
});

// ===================================================
// OPTIMIZED ADMIN ANALYTICS ENDPOINTS
// ===================================================

// GET /api/admin/leaderboards/playtime (KEPT - Useful)
app.get('/api/admin/leaderboards/playtime', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [leaderboard] = await connection.execute(
            'SELECT * FROM vw_leaderboard_playtime'
        );
        
        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error getting playtime leaderboard:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching playtime leaderboard'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/analytics/player-progression (MODIFIED - Simplified)
app.get('/api/admin/analytics/player-progression', verifyAdminAuth, async (req, res) => {
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

// GET /api/admin/status/active-players (KEPT)
app.get('/api/admin/status/active-players', verifyAdminAuth, async (req, res) => {
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

// GET /api/admin/status/current-games (KEPT)
app.get('/api/admin/status/current-games', verifyAdminAuth, async (req, res) => {
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
// NEW USEFUL ADMIN ANALYTICS ENDPOINTS
// ===================================================

// GET /api/admin/analytics/permanent-upgrades-adoption (NEW - Very Useful)
app.get('/api/admin/analytics/permanent-upgrades-adoption', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [upgrades] = await connection.execute(
            'SELECT * FROM vw_first_permanent_purchases'
        );
        
        res.json({
            success: true,
            data: upgrades
        });
    } catch (error) {
        console.error('Error getting permanent upgrades adoption:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching permanent upgrades adoption'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// CHART DATA ENDPOINTS (For Beautiful Graphs)
// ===================================================

// GET /api/admin/charts/activity-trends
app.get('/api/admin/charts/activity-trends', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [activity] = await connection.execute(
            'SELECT * FROM vw_daily_activity ORDER BY date DESC'
        );
        
        // Transform data for chart consumption
        const chartData = {
            labels: [],
            registrations: [],
            activeLogins: []
        };
        
        // Group by date and separate activity types
        const dataByDate = {};
        activity.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { registrations: 0, active_players: 0 };
            }
            dataByDate[dateStr][row.activity_type] = row.count;
        });
        
        // Convert to chart format
        Object.keys(dataByDate).sort().forEach(date => {
            chartData.labels.push(date);
            chartData.registrations.push(dataByDate[date].registrations || 0);
            chartData.activeLogins.push(dataByDate[date].active_players || 0);
        });
        
        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Error getting activity trends:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching activity trends'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/charts/playtime-distribution
app.get('/api/admin/charts/playtime-distribution', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [distribution] = await connection.execute(
            'SELECT * FROM vw_playtime_distribution'
        );
        
        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        console.error('Error getting playtime distribution:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching playtime distribution'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/charts/run-experience
app.get('/api/admin/charts/run-experience', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [experience] = await connection.execute(
            'SELECT * FROM vw_run_experience_distribution'
        );
        
        res.json({
            success: true,
            data: experience
        });
    } catch (error) {
        console.error('Error getting run experience distribution:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching run experience distribution'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/charts/session-duration
app.get('/api/admin/charts/session-duration', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [sessions] = await connection.execute(
            'SELECT * FROM vw_session_duration_distribution'
        );
        
        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error getting session duration distribution:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching session duration distribution'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/admin/charts/upgrade-adoption
app.get('/api/admin/charts/upgrade-adoption', verifyAdminAuth, async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [upgrades] = await connection.execute(
            'SELECT * FROM vw_first_permanent_purchases'
        );
        
        // Transform for chart consumption
        const chartData = {
            labels: upgrades.map(u => u.upgrade_name),
            adoptionRates: upgrades.map(u => u.adoption_percentage),
            firstTimeBuyers: upgrades.map(u => u.first_time_buyers),
            avgFirstPurchaseRun: upgrades.map(u => u.avg_first_purchase_run)
        };
        
        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Error getting upgrade adoption:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching upgrade adoption'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ===================================================
// SERVER START (ENHANCED v3.0 LOGGING)
// ===================================================

app.listen(PORT, () => {
    console.log(`Shattered Timeline API v3.0 running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`\nAvailable endpoints (v3.0 - Enhanced with run persistence):`);
    console.log(`\nAuthentication:`);
    console.log(`   POST /api/auth/register, /api/auth/login, /api/auth/logout`);
    console.log(`\nUser Management:`);
    console.log(`   GET/PUT /api/users/:id/settings`);
    console.log(`   GET /api/users/:id/stats`);
    console.log(`   GET /api/users/:id/complete-stats`);
    console.log(`\nNEW v3.0: Run Progress & Persistence:`);
    console.log(`   GET /api/users/:id/run-progress`);
    console.log(`   GET /api/users/:id/current-run-info`);
    console.log(`   GET /api/users/:id/initialization-data`);
    console.log(`\nRun Management:`);
    console.log(`   POST /api/runs, PUT /api/runs/:id/complete`);
    console.log(`   GET /api/users/:id/current-run`);
    console.log(`\nNEW v3.0: Enhanced Permanent Upgrades:`);
    console.log(`   GET /api/users/:id/permanent-upgrades (with calculated values)`);
    console.log(`   POST /api/users/:id/permanent-upgrade`);
    console.log(`\nNEW v3.0: Enhanced Weapon Upgrades:`);
    console.log(`   GET /api/users/:id/active-weapon-upgrades (active only)`);
    console.log(`   GET/PUT/DELETE /api/users/:id/weapon-upgrades/:runId`);
    console.log(`\nSave States:`);
    console.log(`   GET/POST/DELETE /api/users/:id/save-state`);
    console.log(`\nAnalytics & Tracking (Enhanced with run numbers):`);
    console.log(`   POST /api/runs/:runId/enemy-kill`);
    console.log(`   POST /api/runs/:runId/boss-kill`);
    console.log(`   POST /api/runs/:runId/weapon-purchase`);
    console.log(`\nADMIN ENDPOINTS (Role-based access):`);
    console.log(`\nAdmin Authentication:`);
    console.log(`   POST /api/admin/auth/login (admin credentials only)`);
    console.log(`   POST /api/admin/auth/logout`);
    console.log(`   GET /api/admin/auth/verify`);
    console.log(`\nOptimized Admin Analytics:`);
    console.log(`   GET /api/admin/leaderboards/playtime`);
    console.log(`   GET /api/admin/analytics/player-progression (simplified)`);
    console.log(`   GET /api/admin/analytics/permanent-upgrades-adoption (NEW - Feature adoption)`);
    console.log(`\nAdmin System Status:`);
    console.log(`   GET /api/admin/status/active-players`);
    console.log(`   GET /api/admin/status/current-games`);
    console.log(`\nChart Data Endpoints (for graphs):`);
    console.log(`   GET /api/admin/charts/activity-trends`);
    console.log(`   GET /api/admin/charts/playtime-distribution`);
    console.log(`   GET /api/admin/charts/run-experience`);
    console.log(`   GET /api/admin/charts/session-duration`);
    console.log(`   GET /api/admin/charts/upgrade-adoption`);
    console.log(`\nNEW v3.0 FEATURES:`);
    console.log(`   Admin authentication system with role verification`);
    console.log(`   Optimized analytics focused on useful metrics`);
    console.log(`   Chart-ready data endpoints for visualizations`);
    console.log(`   First-run masters tracking (exceptional players)`);
    console.log(`   Permanent upgrade adoption analysis`);
    console.log(`   Removed unnecessary views for better performance`);
    console.log(`\nDatabase: Fully optimized with triggers and calculated fields`);
});

// ===================================================
// MODULE EXPORTS (for testing)
// ===================================================

module.exports = app; 