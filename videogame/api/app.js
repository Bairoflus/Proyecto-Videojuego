const express = require('express');
const bcrypt = require('bcrypt');
const createConnection = require('./db.js');
const authMiddleware = require('./authMiddleware.js');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Middleware básico
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

// ================================================================
// ENDPOINTS SIN AUTENTICACIÓN
// ================================================================

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Project Shattered Timeline API',
        status: 'Server is running',
        version: '1.0.0'
    });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    let connection;
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Faltan datos: username, email, password' 
            });
        }
        
        connection = await createConnection();
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Insertar usuario
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        
        // Crear configuraciones por defecto
        try {
            await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [result.insertId, 70, 80]
            );
        } catch (settingsErr) {
            console.error('Error creating default settings:', settingsErr);
        }
        
        res.status(201).json({
            userId: result.insertId,
            message: 'User registered successfully'
        });
        
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                message: 'Username or email already exists' 
            });
        }
        res.status(500).json({ 
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
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Missing email or password' 
            });
        }
        
        connection = await createConnection();
        
        // Buscar usuario
        const [users] = await connection.execute(
            'SELECT user_id, password_hash FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                message: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(404).json({ 
                message: 'Invalid credentials' 
            });
        }
        
        // Crear nueva sesión
        const [sessionResult] = await connection.execute(
            'INSERT INTO sessions (user_id, session_token) VALUES (?, UUID())',
            [user.user_id]
        );
        
        // Obtener token generado
        const [sessions] = await connection.execute(
            'SELECT session_token FROM sessions WHERE session_id = ?',
            [sessionResult.insertId]
        );
        
        res.status(200).json({
            userId: user.user_id,
            sessionToken: sessions[0].session_token,
            sessionId: sessionResult.insertId
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
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
                message: 'Missing sessionToken' 
            });
        }
        
        connection = await createConnection();
        
        const [result] = await connection.execute(
            'UPDATE sessions SET closed_at = NOW() WHERE session_token = ?',
            [sessionToken]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Session not found' 
            });
        }

        res.status(204).send();
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: 'Database error' 
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ================================================================
// ENDPOINTS DE DATOS DEL JUEGO (SIN AUTH - ACCESO PÚBLICO)
// ================================================================

// GET /api/rooms
app.get('/api/rooms', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT room_id, floor, name, room_type, sequence_order FROM rooms ORDER BY floor, sequence_order'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/enemies
app.get('/api/enemies', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url FROM enemy_types'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/bosses
app.get('/api/bosses', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        const [results] = await connection.execute(
            'SELECT bd.enemy_id, et.name, bd.max_hp, bd.description, bm.move_id, bm.name as move_name, bm.description as move_description, bm.phase FROM boss_details bd INNER JOIN enemy_types et ON bd.enemy_id = et.enemy_id LEFT JOIN boss_moves bm ON bd.enemy_id = bm.enemy_id ORDER BY bd.enemy_id, bm.phase, bm.move_id'
        );
        
        // Agrupar moves por boss
        const bossesMap = new Map();
        for (const row of results) {
            if (!bossesMap.has(row.enemy_id)) {
                bossesMap.set(row.enemy_id, {
                    enemy_id: row.enemy_id,
                    name: row.name,
                    max_hp: row.max_hp,
                    description: row.description,
                    moves: []
                });
            }
            if (row.move_id) {
                bossesMap.get(row.enemy_id).moves.push({
                    move_id: row.move_id,
                    name: row.move_name,
                    description: row.move_description,
                    phase: row.phase
                });
            }
        }
        
        res.json(Array.from(bossesMap.values()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/lookups
app.get('/api/lookups', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [eventTypes] = await connection.execute('SELECT event_type as name FROM event_types');
        const [weaponSlots] = await connection.execute('SELECT slot_type as name FROM weapon_slots');
        const [upgradeTypes] = await connection.execute('SELECT upgrade_type as name FROM upgrade_types');
        const [bossResults] = await connection.execute('SELECT result_code as name FROM boss_results');
        const [roomTypes] = await connection.execute('SELECT room_type as name FROM room_types');
        const [itemTypes] = await connection.execute('SELECT item_type as name FROM item_types');
        
        res.json({
            eventTypes,
            weaponSlots,
            upgradeTypes,
            bossResults,
            roomTypes,
            itemTypes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/item-types
app.get('/api/item-types', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        const [rows] = await connection.execute('SELECT item_type AS name FROM item_types');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// ================================================================
// ENDPOINTS CON AUTENTICACIÓN
// ================================================================

// GET /api/users/:userId/stats
app.get('/api/users/:userId/stats', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM player_stats WHERE user_id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/users/:userId/settings
app.get('/api/users/:userId/settings', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await createConnection();
        const [settings] = await connection.execute(
            'SELECT user_id, music_volume, sfx_volume, last_updated FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        if (settings.length === 0) {
            // Crear configuraciones por defecto
            await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [userId, 70, 80]
            );
            
            return res.json({
                user_id: parseInt(userId),
                music_volume: 70,
                sfx_volume: 80,
                last_updated: new Date().toISOString()
            });
        }
        
        res.json(settings[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/users/:userId/settings
app.put('/api/users/:userId/settings', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        const { musicVolume, sfxVolume } = req.body;
        
        if (musicVolume === undefined && sfxVolume === undefined) {
            return res.status(400).json({ message: 'At least one setting must be provided' });
        }
        
        connection = await createConnection();
        
        // Verificar si existen configuraciones
        const [existing] = await connection.execute(
            'SELECT user_id FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        if (existing.length === 0) {
            // Insertar nuevas configuraciones
            await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [userId, musicVolume || 70, sfxVolume || 80]
            );
        } else {
            // Actualizar configuraciones existentes
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
            
            updateFields.push('last_updated = NOW()');
            updateValues.push(userId);
            
            await connection.execute(
                `UPDATE player_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
                updateValues
            );
        }
        
        // Obtener configuraciones actualizadas
        const [updated] = await connection.execute(
            'SELECT user_id, music_volume, sfx_volume, last_updated FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            message: 'Settings updated successfully',
            settings: updated[0]
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs
app.post('/api/runs', async (req, res) => {
    let connection;
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
        }
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO run_history (user_id) VALUES (?)',
            [userId]
        );
        
        const [runs] = await connection.execute(
            'SELECT run_id, started_at FROM run_history WHERE run_id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            runId: runs[0].run_id,
            startedAt: runs[0].started_at
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/save-state
app.post('/api/runs/:runId/save-state', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, sessionId, roomId, currentHp, currentStamina, gold } = req.body;
        
        if (!userId || !sessionId || roomId === undefined || currentHp === undefined || currentStamina === undefined || gold === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO save_states (user_id, session_id, run_id, room_id, current_hp, current_stamina, gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, sessionId, runId, roomId, currentHp, currentStamina, gold]
        );
        
        res.status(201).json({
            saveId: result.insertId
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/runs/:runId/complete
app.put('/api/runs/:runId/complete', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { goldCollected, goldSpent, totalKills, deathCause } = req.body;
        
        connection = await createConnection();
        const isSuccessful = !deathCause || deathCause.trim() === '';
        
        await connection.execute(
            'UPDATE run_history SET ended_at = NOW(), completed = ?, gold_collected = ?, gold_spent = ?, total_kills = ?, death_cause = ? WHERE run_id = ?',
            [isSuccessful ? 1 : 0, goldCollected || 0, goldSpent || 0, totalKills || 0, deathCause || null, runId]
        );
        
        res.json({
            message: 'Run marked complete'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/enemy-kill
app.post('/api/runs/:runId/enemy-kill', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, enemyId, roomId } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO enemy_kills (user_id, enemy_id, run_id, room_id) VALUES (?, ?, ?, ?)',
            [userId, enemyId, runId, roomId]
        );
        
        res.status(201).json({
            killId: result.insertId,
            message: 'Enemy kill registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/chest-event
app.post('/api/runs/:runId/chest-event', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, roomId, goldReceived } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO chest_events (user_id, run_id, room_id, gold_received) VALUES (?, ?, ?, ?)',
            [userId, runId, roomId, goldReceived]
        );
        
        res.status(201).json({
            eventId: result.insertId,
            message: 'Chest event registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/shop-purchase
app.post('/api/runs/:runId/shop-purchase', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, roomId, itemType, itemName, goldSpent } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO shop_purchases (user_id, run_id, room_id, item_type, item_name, gold_spent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, roomId, itemType, itemName, goldSpent]
        );
        
        res.status(201).json({
            purchaseId: result.insertId,
            message: 'Shop purchase registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/boss-encounter
app.post('/api/runs/:runId/boss-encounter', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, enemyId, damageDealt, damageTaken, resultCode } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO boss_encounters (user_id, enemy_id, run_id, damage_dealt, damage_taken, result_code) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, enemyId, runId, damageDealt, damageTaken, resultCode]
        );
        
        res.status(201).json({
            encounterId: result.insertId,
            message: 'Boss encounter registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/boss-kill
app.post('/api/runs/:runId/boss-kill', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, enemyId, roomId } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO boss_kills (user_id, enemy_id, run_id, room_id) VALUES (?, ?, ?, ?)',
            [userId, enemyId, runId, roomId]
        );
        
        res.status(201).json({
            killId: result.insertId,
            message: 'Boss kill registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/events
app.post('/api/runs/:runId/events', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, events } = req.body;
        
        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ message: 'Events must be an array' });
        }
        
        connection = await createConnection();
        
        const insertPromises = events.map(event => {
            return connection.execute(
                'INSERT INTO player_events (run_id, user_id, room_id, event_type, value, weapon_type, context) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [runId, userId, event.roomId, event.eventType, event.value || null, event.weaponType || null, event.context || null]
            );
        });
        
        const results = await Promise.all(insertPromises);
        const eventIds = results.map(([result]) => result.insertId);
        
        res.status(201).json({
            message: `${events.length} event(s) logged successfully`,
            eventsLogged: events.length,
            eventIds: eventIds
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/upgrade-purchase
app.post('/api/runs/:runId/upgrade-purchase', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, upgradeType, levelBefore, levelAfter, goldSpent } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO permanent_upgrade_purchases (user_id, run_id, upgrade_type, level_before, level_after, gold_spent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, upgradeType, levelBefore, levelAfter, goldSpent]
        );
        
        res.status(201).json({
            purchaseId: result.insertId,
            message: 'Upgrade purchase registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/equip-weapon
app.post('/api/runs/:runId/equip-weapon', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, slotType } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO equipped_weapons (run_id, user_id, slot_type) VALUES (?, ?, ?)',
            [runId, userId, slotType]
        );
        
        res.status(201).json({
            message: 'Weapon equipped for run'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/runs/:runId/weapon-upgrade
app.post('/api/runs/:runId/weapon-upgrade', async (req, res) => {
    let connection;
    try {
        const { runId } = req.params;
        const { userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade } = req.body;
        
        connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO weapon_upgrades_temp (run_id, user_id, slot_type, level, damage_per_upgrade, gold_cost_per_upgrade) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level), damage_per_upgrade = VALUES(damage_per_upgrade), gold_cost_per_upgrade = VALUES(gold_cost_per_upgrade), timestamp = NOW()',
            [runId, userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade]
        );
        
        res.status(201).json({
            message: 'Weapon upgrade saved',
            runId: parseInt(runId),
            userId: parseInt(userId),
            slotType: slotType
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    } finally {
        if (connection) await connection.end();
    }
});

// Start server
app.listen(PORT, () => {
    console.log(` Shattered Timeline API running on port ${PORT}`);
    console.log(` Base URL: http://localhost:${PORT}`);
    console.log(` Available endpoints:`);
    console.log(`   Auth: POST /api/auth/register, /api/auth/login, /api/auth/logout`);
    console.log(`   Game: GET /api/rooms, /api/enemies, /api/bosses, /api/lookups, /api/item-types`);
    console.log(`   User: GET/PUT /api/users/:id/settings, GET /api/users/:id/stats`);
    console.log(`   Runs: POST /api/runs, POST /api/runs/:id/save-state, PUT /api/runs/:id/complete`);
    console.log(`   Events: POST /api/runs/:id/enemy-kill, /api/runs/:id/chest-event, /api/runs/:id/shop-purchase`);
    console.log(`   Combat: POST /api/runs/:id/boss-encounter, /api/runs/:id/boss-kill`);
    console.log(`   Equipment: POST /api/runs/:id/equip-weapon, /api/runs/:id/weapon-upgrade`);
}); 