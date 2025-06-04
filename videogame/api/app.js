const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for frontend integration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    let connection;
    
    try {
        // Get data from request body
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required: username, email, password' 
            });
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Hash the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Insert query with placeholders - using password_hash according to schema
        const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        const values = [username, email, passwordHash];
        
        // Execute insertion
        const [result] = await connection.execute(query, values);
        
        // Create default player settings for new user
        const defaultMusicVolume = 70;
        const defaultSfxVolume = 80;
        
        try {
            await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [result.insertId, defaultMusicVolume, defaultSfxVolume]
            );
        } catch (settingsErr) {
            // Log error but don't fail registration if settings creation fails
            console.error('Failed to create default player settings:', settingsErr);
        }
        
        // Success response - using user_id according to schema
        res.status(201).json({
            userId: result.insertId,
            message: 'User registered successfully'
        });
        
    } catch (err) {
        console.error(err);
        
        // Handle specific errors
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                message: 'Username or email already exists' 
            });
        }
        
        // General database error
        res.status(500).json({ 
            message: 'Error registering user' 
        });
        
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    let connection;
    
    try {
        // Get data from request body
        const { email, password } = req.body;
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).send('Missing email or password');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query user by email
        const [users] = await connection.execute(
            'SELECT user_id, password_hash FROM users WHERE email = ?',
            [email]
        );
        
        // Check if user exists
        if (users.length === 0) {
            return res.status(404).send('Invalid credentials');
        }
        
        const user = users[0];
        
        // For MVP: Compare plain password with stored hash using bcrypt
        // Note: In production, we should use bcrypt.compare
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(404).send('Invalid credentials');
        }
        
        // Insert new session with UUID
        const [sessionResult] = await connection.execute(
            'INSERT INTO sessions (user_id, session_token) VALUES (?, UUID())',
            [user.user_id]
        );
        
        // Get the generated session token
        const [sessions] = await connection.execute(
            'SELECT session_token FROM sessions WHERE session_id = ?',
            [sessionResult.insertId]
        );
        
        // Return success response with userId, sessionToken and sessionId
        res.status(200).json({
            userId: user.user_id,
            sessionToken: sessions[0].session_token,
            sessionId: sessionResult.insertId
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
    let connection;
    
    try {
        // Get session token from request body
        const { sessionToken } = req.body;
        
        // Basic validation
        if (!sessionToken) {
            return res.status(400).send('Missing sessionToken');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Logout logic: Update the session_token to closed_at
        const [result] = await connection.execute(
            'UPDATE sessions SET closed_at = NOW() WHERE session_token = ?',
            [sessionToken]
        );
        
        // Check if session was found and updated
        if (result.affectedRows === 0) {
            return res.status(404).send('Session not found');
        }

        // Return 204 No Content on success
        res.status(204).send();
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');

    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/users/:userId/stats
app.get('/api/users/:userId/stats', async (req, res) => {
    let connection;
    
    try {
        // Get userId from URL parameters
        const { userId } = req.params;
        
        // Basic validation
        if (!userId) {
            return res.status(400).send('Missing userId parameter');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query player stats
        const [stats] = await connection.execute(
            'SELECT * FROM player_stats WHERE user_id = ?',
            [userId]
        );
        
        // Check if stats exist
        if (stats.length === 0) {
            return res.status(404).send('Stats not found');
        }
        
        // Return stats data
        res.status(200).json(stats[0]);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/users/:userId/settings
app.get('/api/users/:userId/settings', async (req, res) => {
    let connection;
    
    try {
        // Get userId from URL parameters
        const { userId } = req.params;
        
        // Basic validation
        if (!userId) {
            return res.status(400).send('Missing userId parameter');
        }
        
        // Type validation - userId must be integer
        if (!Number.isInteger(Number(userId))) {
            return res.status(400).send('Invalid userId: must be an integer');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate user exists
        const [users] = await connection.execute(
            'SELECT user_id FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).send('User not found');
        }
        
        // Query player settings
        const [settings] = await connection.execute(
            'SELECT user_id, music_volume, sfx_volume, last_updated FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        // If no settings exist, create default settings
        if (settings.length === 0) {
            const defaultMusicVolume = 70;
            const defaultSfxVolume = 80;
            
            // Insert default settings
            await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [userId, defaultMusicVolume, defaultSfxVolume]
            );
            
            // Return default settings
            return res.status(200).json({
                user_id: parseInt(userId),
                music_volume: defaultMusicVolume,
                sfx_volume: defaultSfxVolume,
                last_updated: new Date().toISOString()
            });
        }
        
        // Return existing settings data
        res.status(200).json(settings[0]);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// PUT /api/users/:userId/settings
app.put('/api/users/:userId/settings', async (req, res) => {
    let connection;
    
    try {
        // Get userId from URL parameters
        const { userId } = req.params;
        
        // Get data from request body
        const { musicVolume, sfxVolume } = req.body;
        
        // Basic validation - userId parameter
        if (!userId) {
            return res.status(400).send('Missing userId parameter');
        }
        
        // Type validation - userId must be integer
        if (!Number.isInteger(Number(userId))) {
            return res.status(400).send('Invalid userId: must be an integer');
        }
        
        // Input validation - at least one setting must be provided
        if (musicVolume === undefined && sfxVolume === undefined) {
            return res.status(400).send('At least one setting must be provided: musicVolume or sfxVolume');
        }
        
        // Type and range validation for musicVolume
        if (musicVolume !== undefined) {
            if (!Number.isInteger(Number(musicVolume))) {
                return res.status(400).send('Invalid musicVolume: must be an integer');
            }
            
            const musicVol = parseInt(musicVolume);
            if (musicVol < 0 || musicVol > 100) {
                return res.status(400).send('Invalid musicVolume: must be between 0 and 100');
            }
        }
        
        // Type and range validation for sfxVolume
        if (sfxVolume !== undefined) {
            if (!Number.isInteger(Number(sfxVolume))) {
                return res.status(400).send('Invalid sfxVolume: must be an integer');
            }
            
            const sfxVol = parseInt(sfxVolume);
            if (sfxVol < 0 || sfxVol > 100) {
                return res.status(400).send('Invalid sfxVolume: must be between 0 and 100');
            }
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate user exists
        const [users] = await connection.execute(
            'SELECT user_id FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).send('User not found');
        }
        
        // Check if settings exist for this user
        const [existingSettings] = await connection.execute(
            'SELECT user_id FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        let result;
        
        if (existingSettings.length === 0) {
            // Create new settings with provided values or defaults
            const finalMusicVolume = musicVolume !== undefined ? parseInt(musicVolume) : 70;
            const finalSfxVolume = sfxVolume !== undefined ? parseInt(sfxVolume) : 80;
            
            [result] = await connection.execute(
                'INSERT INTO player_settings (user_id, music_volume, sfx_volume) VALUES (?, ?, ?)',
                [userId, finalMusicVolume, finalSfxVolume]
            );
        } else {
            // Update existing settings - build dynamic query for partial updates
            const updateFields = [];
            const updateValues = [];
            
            if (musicVolume !== undefined) {
                updateFields.push('music_volume = ?');
                updateValues.push(parseInt(musicVolume));
            }
            
            if (sfxVolume !== undefined) {
                updateFields.push('sfx_volume = ?');
                updateValues.push(parseInt(sfxVolume));
            }
            
            // Always update last_updated timestamp
            updateFields.push('last_updated = NOW()');
            updateValues.push(userId);
            
            const updateQuery = `UPDATE player_settings SET ${updateFields.join(', ')} WHERE user_id = ?`;
            
            [result] = await connection.execute(updateQuery, updateValues);
        }
        
        // Fetch updated settings to return
        const [updatedSettings] = await connection.execute(
            'SELECT user_id, music_volume, sfx_volume, last_updated FROM player_settings WHERE user_id = ?',
            [userId]
        );
        
        // Success response with updated settings
        res.status(200).json({
            message: 'Settings updated successfully',
            settings: updatedSettings[0]
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs
app.post('/api/runs', async (req, res) => {
    let connection;
    
    try {
        // Get userId from request body
        const { userId } = req.body;
        
        // Basic validation
        if (!userId) {
            return res.status(400).send('Missing userId');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Insert new run into run_history
        const [result] = await connection.execute(
            'INSERT INTO run_history (user_id) VALUES (?)',
            [userId]
        );
        
        // Get the run data with started_at timestamp
        const [runs] = await connection.execute(
            'SELECT run_id, started_at FROM run_history WHERE run_id = ?',
            [result.insertId]
        );
        
        // Return success response
        res.status(201).json({
            runId: runs[0].run_id,
            startedAt: runs[0].started_at
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/save-state
app.post('/api/runs/:runId/save-state', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, sessionId, roomId, currentHp, currentStamina, gold } = req.body;
        
        // Basic validation
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        if (!userId || !sessionId || roomId === undefined || currentHp === undefined || currentStamina === undefined || gold === undefined) {
            return res.status(400).send('Missing required fields: userId, sessionId, roomId, currentHp, currentStamina, gold');
        }
        
        // Type validation - currentHp and currentStamina are SMALLINT, others are INT
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(sessionId)) || !Number.isInteger(Number(roomId)) || 
            !Number.isInteger(Number(currentHp)) || !Number.isInteger(Number(currentStamina)) || 
            !Number.isInteger(Number(gold))) {
            return res.status(400).send('Invalid field types: userId, sessionId, roomId, currentHp, currentStamina, gold must be integers');
        }
        
        // Validate SMALLINT ranges for HP and stamina (0-32767)
        if (currentHp < 0 || currentHp > 32767 || currentStamina < 0 || currentStamina > 32767) {
            return res.status(400).send('Invalid range: currentHp and currentStamina must be between 0 and 32767');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Verify that roomId exists in rooms table
        const [rooms] = await connection.execute(
            'SELECT room_id FROM rooms WHERE room_id = ?',
            [roomId]
        );
        
        if (rooms.length === 0) {
            return res.status(400).send('Invalid roomId: room does not exist');
        }
        
        // Verify that sessionId exists in sessions table
        const [sessions] = await connection.execute(
            'SELECT session_id FROM sessions WHERE session_id = ?',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(400).send('Invalid sessionId: session does not exist');
        }
        
        // Insert new save state - saved_at has DEFAULT CURRENT_TIMESTAMP
        const [result] = await connection.execute(
            'INSERT INTO save_states (user_id, session_id, run_id, room_id, current_hp, current_stamina, gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, sessionId, runId, roomId, currentHp, currentStamina, gold]
        );
        
        // Return success response
        res.status(201).json({
            saveId: result.insertId
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// PUT /api/runs/:runId/complete
app.put('/api/runs/:runId/complete', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { goldCollected, goldSpent, totalKills, deathCause } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (goldCollected === undefined || goldSpent === undefined || totalKills === undefined) {
            return res.status(400).send('Missing required fields: goldCollected, goldSpent, totalKills');
        }
        
        // Type validation - must be integers
        if (!Number.isInteger(Number(goldCollected)) || !Number.isInteger(Number(goldSpent)) || !Number.isInteger(Number(totalKills))) {
            return res.status(400).send('Invalid field types: goldCollected, goldSpent, totalKills must be integers');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Check run existence and state - must exist and not be completed
        const [runs] = await connection.execute(
            'SELECT run_id, completed FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        if (runs[0].completed === 1) {
            return res.status(400).send('Run already completed');
        }
        
        // Determine if run was completed successfully or player died
        // If deathCause is null or empty, assume successful completion
        const isSuccessfulCompletion = !deathCause || deathCause.trim() === '';
        const completedStatus = isSuccessfulCompletion ? 1 : 0; // TRUE if successful, FALSE if died
        
        // Update run with completion data
        const [result] = await connection.execute(
            'UPDATE run_history SET ended_at = NOW(), completed = ?, gold_collected = ?, gold_spent = ?, total_kills = ?, death_cause = ? WHERE run_id = ? AND completed = FALSE',
            [completedStatus, goldCollected, goldSpent, totalKills, deathCause || null, runId]
        );
        
        // Check if update was successful
        if (result.affectedRows === 0) {
            return res.status(400).send('Unable to complete run - run may already be completed');
        }
        
        // Success response
        res.status(200).json({
            message: 'Run marked complete'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/enemy-kill
app.post('/api/runs/:runId/enemy-kill', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, enemyId, roomId } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !enemyId || !roomId) {
            return res.status(400).send('Missing required fields: userId, enemyId, roomId');
        }
        
        // Type validation - must be integers
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(enemyId)) || !Number.isInteger(Number(roomId)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, enemyId, roomId, runId must be integers');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate enemyId exists in enemy_types
        const [enemies] = await connection.execute(
            'SELECT enemy_id FROM enemy_types WHERE enemy_id = ?',
            [enemyId]
        );
        
        if (enemies.length === 0) {
            return res.status(404).send('Enemy type not found');
        }
        
        // Validate roomId exists in rooms
        const [rooms] = await connection.execute(
            'SELECT room_id FROM rooms WHERE room_id = ?',
            [roomId]
        );
        
        if (rooms.length === 0) {
            return res.status(404).send('Room not found');
        }
        
        // Optional: Check if run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Insert enemy kill record
        const [result] = await connection.execute(
            'INSERT INTO enemy_kills (user_id, enemy_id, run_id, room_id) VALUES (?, ?, ?, ?)',
            [userId, enemyId, runId, roomId]
        );
        
        // Success response
        res.status(201).json({
            killId: result.insertId,
            message: 'Enemy kill registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/chest-event
app.post('/api/runs/:runId/chest-event', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, roomId, goldReceived } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !roomId || goldReceived === undefined) {
            return res.status(400).send('Missing required fields: userId, roomId, goldReceived');
        }
        
        // Type validation - must be integers
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(roomId)) || !Number.isInteger(Number(goldReceived)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, roomId, goldReceived, runId must be integers');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate roomId exists in rooms
        const [rooms] = await connection.execute(
            'SELECT room_id FROM rooms WHERE room_id = ?',
            [roomId]
        );
        
        if (rooms.length === 0) {
            return res.status(404).send('Room not found');
        }
        
        // Insert chest event record
        const [result] = await connection.execute(
            'INSERT INTO chest_events (user_id, run_id, room_id, gold_received) VALUES (?, ?, ?, ?)',
            [userId, runId, roomId, goldReceived]
        );
        
        // Success response
        res.status(201).json({
            eventId: result.insertId,
            message: 'Chest event registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/shop-purchase
app.post('/api/runs/:runId/shop-purchase', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, roomId, itemType, itemName, goldSpent } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !roomId || !itemType || !itemName || goldSpent === undefined) {
            return res.status(400).send('Missing required fields: userId, roomId, itemType, itemName, goldSpent');
        }
        
        // Type validation - userId, roomId, goldSpent must be integers; itemType and itemName must be strings
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(roomId)) || !Number.isInteger(Number(goldSpent)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, roomId, goldSpent, runId must be integers');
        }
        
        if (typeof itemType !== 'string' || typeof itemName !== 'string') {
            return res.status(400).send('Invalid field types: itemType and itemName must be strings');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate roomId exists in rooms
        const [rooms] = await connection.execute(
            'SELECT room_id FROM rooms WHERE room_id = ?',
            [roomId]
        );
        
        if (rooms.length === 0) {
            return res.status(404).send('Room not found');
        }
        
        // Validate itemType exists in item_types
        const [itemTypes] = await connection.execute(
            'SELECT item_type FROM item_types WHERE item_type = ?',
            [itemType]
        );
        
        if (itemTypes.length === 0) {
            return res.status(404).send('Item type not found');
        }
        
        // Insert shop purchase record
        const [result] = await connection.execute(
            'INSERT INTO shop_purchases (user_id, run_id, room_id, item_type, item_name, gold_spent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, roomId, itemType, itemName, goldSpent]
        );
        
        // Success response
        res.status(201).json({
            purchaseId: result.insertId,
            message: 'Shop purchase registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/boss-encounter
app.post('/api/runs/:runId/boss-encounter', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, enemyId, damageDealt, damageTaken, resultCode } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !enemyId || damageDealt === undefined || damageTaken === undefined || !resultCode) {
            return res.status(400).send('Missing required fields: userId, enemyId, damageDealt, damageTaken, resultCode');
        }
        
        // Type validation - userId, enemyId, damageDealt, damageTaken must be integers; resultCode must be string
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(enemyId)) || !Number.isInteger(Number(damageDealt)) || !Number.isInteger(Number(damageTaken)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, enemyId, damageDealt, damageTaken, runId must be integers');
        }
        
        if (typeof resultCode !== 'string') {
            return res.status(400).send('Invalid field types: resultCode must be string');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate enemyId exists in boss_details
        const [bosses] = await connection.execute(
            'SELECT enemy_id FROM boss_details WHERE enemy_id = ?',
            [enemyId]
        );
        
        if (bosses.length === 0) {
            return res.status(404).send('Boss not found');
        }
        
        // Validate resultCode exists in boss_results
        const [results] = await connection.execute(
            'SELECT result_code FROM boss_results WHERE result_code = ?',
            [resultCode]
        );
        
        if (results.length === 0) {
            return res.status(404).send('Result code not found');
        }
        
        // Insert boss encounter record
        const [result] = await connection.execute(
            'INSERT INTO boss_encounters (user_id, enemy_id, run_id, damage_dealt, damage_taken, result_code) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, enemyId, runId, damageDealt, damageTaken, resultCode]
        );
        
        // Success response
        res.status(201).json({
            encounterId: result.insertId,
            message: 'Boss encounter registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/boss-kill
app.post('/api/runs/:runId/boss-kill', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, enemyId, roomId } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !enemyId || !roomId) {
            return res.status(400).send('Missing required fields: userId, enemyId, roomId');
        }
        
        // Type validation - userId, enemyId, roomId, runId must be integers
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(enemyId)) || !Number.isInteger(Number(roomId)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, enemyId, roomId, runId must be integers');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate enemyId exists in boss_details (must be a boss)
        const [bosses] = await connection.execute(
            'SELECT enemy_id FROM boss_details WHERE enemy_id = ?',
            [enemyId]
        );
        
        if (bosses.length === 0) {
            return res.status(404).send('Boss not found');
        }
        
        // Validate roomId exists
        const [rooms] = await connection.execute(
            'SELECT room_id FROM rooms WHERE room_id = ?',
            [roomId]
        );
        
        if (rooms.length === 0) {
            return res.status(404).send('Room not found');
        }
        
        // Insert boss kill record
        const [result] = await connection.execute(
            'INSERT INTO boss_kills (user_id, enemy_id, run_id, room_id) VALUES (?, ?, ?, ?)',
            [userId, enemyId, runId, roomId]
        );
        
        // Success response
        res.status(201).json({
            killId: result.insertId,
            message: 'Boss kill registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/events
app.post('/api/runs/:runId/events', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body - support both single event and batch events
        const { userId, events } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !events) {
            return res.status(400).send('Missing required fields: userId, events');
        }
        
        // Type validation - userId and runId must be integers
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, runId must be integers');
        }
        
        // Events validation - must be array
        if (!Array.isArray(events)) {
            return res.status(400).send('Invalid events: must be an array');
        }
        
        // Batch size validation - prevent abuse
        if (events.length === 0) {
            return res.status(400).send('Events array cannot be empty');
        }
        
        if (events.length > 100) {
            return res.status(400).send('Too many events: maximum 100 events per request');
        }
        
        // Validate each event structure
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            if (!event.eventType || !event.roomId) {
                return res.status(400).send(`Event ${i}: Missing required fields: eventType, roomId`);
            }
            
            if (typeof event.eventType !== 'string') {
                return res.status(400).send(`Event ${i}: eventType must be string`);
            }
            
            if (!Number.isInteger(Number(event.roomId))) {
                return res.status(400).send(`Event ${i}: roomId must be integer`);
            }
            
            // Optional field validations
            if (event.value !== undefined && !Number.isInteger(Number(event.value))) {
                return res.status(400).send(`Event ${i}: value must be integer`);
            }
            
            if (event.weaponType !== undefined && typeof event.weaponType !== 'string') {
                return res.status(400).send(`Event ${i}: weaponType must be string`);
            }
            
            if (event.context !== undefined && typeof event.context !== 'string') {
                return res.status(400).send(`Event ${i}: context must be string`);
            }
            
            // String length validations
            if (event.eventType.length > 50) {
                return res.status(400).send(`Event ${i}: eventType too long (max 50 characters)`);
            }
            
            if (event.weaponType && event.weaponType.length > 20) {
                return res.status(400).send(`Event ${i}: weaponType too long (max 20 characters)`);
            }
            
            if (event.context && event.context.length > 50) {
                return res.status(400).send(`Event ${i}: context too long (max 50 characters)`);
            }
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate all event types exist and all rooms exist - batch validation
        const eventTypes = [...new Set(events.map(e => e.eventType))]; // unique event types
        const roomIds = [...new Set(events.map(e => e.roomId))]; // unique room ids
        
        // Check event types
        if (eventTypes.length > 0) {
            const placeholders = eventTypes.map(() => '?').join(',');
            const [validEventTypes] = await connection.execute(
                `SELECT event_type FROM event_types WHERE event_type IN (${placeholders})`,
                eventTypes
            );
            
            const validEventTypeSet = new Set(validEventTypes.map(et => et.event_type));
            const invalidEventTypes = eventTypes.filter(et => !validEventTypeSet.has(et));
            
            if (invalidEventTypes.length > 0) {
                return res.status(400).send(`Invalid event types: ${invalidEventTypes.join(', ')}`);
            }
        }
        
        // Check room IDs
        if (roomIds.length > 0) {
            const placeholders = roomIds.map(() => '?').join(',');
            const [validRooms] = await connection.execute(
                `SELECT room_id FROM rooms WHERE room_id IN (${placeholders})`,
                roomIds
            );
            
            const validRoomSet = new Set(validRooms.map(r => r.room_id));
            const invalidRoomIds = roomIds.filter(rid => !validRoomSet.has(parseInt(rid)));
            
            if (invalidRoomIds.length > 0) {
                return res.status(400).send(`Invalid room IDs: ${invalidRoomIds.join(', ')}`);
            }
        }
        
        // Insert all events in a batch operation
        const insertPromises = events.map(event => {
            return connection.execute(
                'INSERT INTO player_events (run_id, user_id, room_id, event_type, value, weapon_type, context) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    runId,
                    userId,
                    event.roomId,
                    event.eventType,
                    event.value || null,
                    event.weaponType || null,
                    event.context || null
                ]
            );
        });
        
        // Execute all inserts
        const results = await Promise.all(insertPromises);
        
        // Collect all event IDs
        const eventIds = results.map(([result]) => result.insertId);
        
        // Success response
        res.status(201).json({
            message: `${events.length} event(s) logged successfully`,
            eventsLogged: events.length,
            eventIds: eventIds
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/upgrade-purchase
app.post('/api/runs/:runId/upgrade-purchase', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, upgradeType, levelBefore, levelAfter, goldSpent } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !upgradeType || levelBefore === undefined || levelAfter === undefined || goldSpent === undefined) {
            return res.status(400).send('Missing required fields: userId, upgradeType, levelBefore, levelAfter, goldSpent');
        }
        
        // Type validation - userId, levelBefore, levelAfter, goldSpent must be integers; upgradeType must be string
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(levelBefore)) || !Number.isInteger(Number(levelAfter)) || !Number.isInteger(Number(goldSpent)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, levelBefore, levelAfter, goldSpent, runId must be integers');
        }
        
        if (typeof upgradeType !== 'string') {
            return res.status(400).send('Invalid field types: upgradeType must be string');
        }
        
        // Business validation - levelAfter must be greater than levelBefore
        if (parseInt(levelAfter) <= parseInt(levelBefore)) {
            return res.status(400).send('Invalid upgrade: levelAfter must be greater than levelBefore');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate upgradeType exists in upgrade_types
        const [upgradeTypes] = await connection.execute(
            'SELECT upgrade_type FROM upgrade_types WHERE upgrade_type = ?',
            [upgradeType]
        );
        
        if (upgradeTypes.length === 0) {
            return res.status(404).send('Upgrade type not found');
        }
        
        // Insert upgrade purchase record
        const [purchaseResult] = await connection.execute(
            'INSERT INTO permanent_upgrade_purchases (user_id, run_id, upgrade_type, level_before, level_after, gold_spent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, runId, upgradeType, levelBefore, levelAfter, goldSpent]
        );
        
        // Upsert player_upgrades record (update level if exists, insert if not)
        await connection.execute(
            'INSERT INTO player_upgrades (user_id, upgrade_type, level, updated_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE level = VALUES(level), updated_at = NOW()',
            [userId, upgradeType, levelAfter]
        );
        
        // Success response
        res.status(201).json({
            purchaseId: purchaseResult.insertId,
            message: 'Upgrade purchase registered'
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/equip-weapon
app.post('/api/runs/:runId/equip-weapon', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, slotType } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !slotType) {
            return res.status(400).send('Missing required fields: userId, slotType');
        }
        
        // Type validation - userId must be integer; slotType must be string
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, runId must be integers');
        }
        
        if (typeof slotType !== 'string') {
            return res.status(400).send('Invalid field types: slotType must be string');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate slotType exists in weapon_slots
        const [weaponSlots] = await connection.execute(
            'SELECT slot_type FROM weapon_slots WHERE slot_type = ?',
            [slotType]
        );
        
        if (weaponSlots.length === 0) {
            return res.status(404).send('Weapon slot type not found');
        }
        
        // Insert weapon equipment record
        const [result] = await connection.execute(
            'INSERT INTO equipped_weapons (run_id, user_id, slot_type) VALUES (?, ?, ?)',
            [runId, userId, slotType]
        );
        
        // Success response
        res.status(201).json({
            message: 'Weapon equipped for run'
        });
        
    } catch (err) {
        console.error(err);
        
        // Handle primary key constraint violation (duplicate equipment)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('Weapon already equipped for this slot in this run');
        }
        
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// POST /api/runs/:runId/weapon-upgrade
app.post('/api/runs/:runId/weapon-upgrade', async (req, res) => {
    let connection;
    
    try {
        // Get runId from URL parameters
        const { runId } = req.params;
        
        // Get data from request body
        const { userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade } = req.body;
        
        // Basic validation - runId parameter
        if (!runId) {
            return res.status(400).send('Missing runId parameter');
        }
        
        // Input validation - required fields
        if (!userId || !slotType || level === undefined || damagePerUpgrade === undefined || goldCostPerUpgrade === undefined) {
            return res.status(400).send('Missing required fields: userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade');
        }
        
        // Type validation - userId, level, damagePerUpgrade, goldCostPerUpgrade must be integers; slotType must be string
        if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(level)) || !Number.isInteger(Number(damagePerUpgrade)) || !Number.isInteger(Number(goldCostPerUpgrade)) || !Number.isInteger(Number(runId))) {
            return res.status(400).send('Invalid field types: userId, level, damagePerUpgrade, goldCostPerUpgrade, runId must be integers');
        }
        
        if (typeof slotType !== 'string') {
            return res.status(400).send('Invalid field types: slotType must be string');
        }
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Validate runId exists and is active in run_history
        const [runs] = await connection.execute(
            'SELECT run_id, user_id, ended_at FROM run_history WHERE run_id = ?',
            [runId]
        );
        
        if (runs.length === 0) {
            return res.status(404).send('Run not found');
        }
        
        // Validate userId matches the run owner
        if (runs[0].user_id !== parseInt(userId)) {
            return res.status(400).send('User ID does not match run owner');
        }
        
        // Validate run is still active
        if (runs[0].ended_at !== null) {
            return res.status(400).send('Run is already completed');
        }
        
        // Validate slotType exists in weapon_slots
        const [weaponSlots] = await connection.execute(
            'SELECT slot_type FROM weapon_slots WHERE slot_type = ?',
            [slotType]
        );
        
        if (weaponSlots.length === 0) {
            return res.status(404).send('Weapon slot type not found');
        }
        
        // Upsert weapon upgrade record (insert if new, update if exists)
        const [result] = await connection.execute(
            'INSERT INTO weapon_upgrades_temp (run_id, user_id, slot_type, level, damage_per_upgrade, gold_cost_per_upgrade) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level), damage_per_upgrade = VALUES(damage_per_upgrade), gold_cost_per_upgrade = VALUES(gold_cost_per_upgrade), timestamp = NOW()',
            [runId, userId, slotType, level, damagePerUpgrade, goldCostPerUpgrade]
        );
        
        // Success response
        res.status(201).json({
            message: 'Weapon upgrade saved',
            runId: parseInt(runId),
            userId: parseInt(userId),
            slotType: slotType
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/rooms
app.get('/api/rooms', async (req, res) => {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query all rooms ordered by floor and sequence_order
        const [rooms] = await connection.execute(
            'SELECT room_id, floor, name, room_type, sequence_order FROM rooms ORDER BY floor ASC, sequence_order ASC'
        );
        
        // Return rooms array
        res.status(200).json(rooms);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/enemies
app.get('/api/enemies', async (req, res) => {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query all enemies
        const [enemies] = await connection.execute(
            'SELECT enemy_id, name, floor, is_rare, base_hp, base_damage, movement_speed, attack_cooldown_seconds, attack_range, sprite_url FROM enemy_types'
        );
        
        // Return enemies array
        res.status(200).json(enemies);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/bosses
app.get('/api/bosses', async (req, res) => {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query bosses with their moves
        const [results] = await connection.execute(
            'SELECT bd.enemy_id, et.name, bd.max_hp, bd.description, bm.move_id, bm.name as move_name, bm.description as move_description, bm.phase FROM boss_details bd INNER JOIN enemy_types et ON bd.enemy_id = et.enemy_id LEFT JOIN boss_moves bm ON bd.enemy_id = bm.enemy_id ORDER BY bd.enemy_id, bm.phase, bm.move_id'
        );
        
        // Process results to group moves by boss
        const bossesMap = new Map();
        
        for (const row of results) {
            const bossId = row.enemy_id;
            
            // Create boss object if not exists
            if (!bossesMap.has(bossId)) {
                bossesMap.set(bossId, {
                    enemy_id: row.enemy_id,
                    name: row.name,
                    max_hp: row.max_hp,
                    description: row.description,
                    moves: []
                });
            }
            
            // Add move if exists
            if (row.move_id) {
                bossesMap.get(bossId).moves.push({
                    move_id: row.move_id,
                    name: row.move_name,
                    description: row.move_description,
                    phase: row.phase
                });
            }
        }
        
        // Convert map to array
        const bosses = Array.from(bossesMap.values());
        
        // Return bosses array
        res.status(200).json(bosses);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/lookups
app.get('/api/lookups', async (req, res) => {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query all lookup tables
        const [eventTypes] = await connection.execute('SELECT event_type as name FROM event_types');
        const [weaponSlots] = await connection.execute('SELECT slot_type as name FROM weapon_slots');
        const [upgradeTypes] = await connection.execute('SELECT upgrade_type as name FROM upgrade_types');
        const [bossResults] = await connection.execute('SELECT result_code as name FROM boss_results');
        const [roomTypes] = await connection.execute('SELECT room_type as name FROM room_types');
        const [itemTypes] = await connection.execute('SELECT item_type as name FROM item_types');
        
        // Build response object
        const lookups = {
            eventTypes: eventTypes,
            weaponSlots: weaponSlots,
            upgradeTypes: upgradeTypes,
            bossResults: bossResults,
            roomTypes: roomTypes,
            itemTypes: itemTypes
        };
        
        // Return lookups object
        res.status(200).json(lookups);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// GET /api/item-types
app.get('/api/item-types', async (req, res) => {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'tc2005b',
            password: 'qwer1234',
            database: 'ProjectShatteredTimeline',
            port: 3306
        });
        
        // Query item types
        const [itemTypes] = await connection.execute('SELECT item_type AS name FROM item_types');
        
        // Return item types array
        res.status(200).json(itemTypes);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    } finally {
        // Always close the connection
        if (connection) {
            await connection.end();
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
