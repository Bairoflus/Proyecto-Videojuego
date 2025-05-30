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
        
        // Return success response with userId
        res.status(200).json({
            userId: user.user_id,
            sessionToken: sessions[0].session_token
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
        
        // Delete session from database
        const [result] = await connection.execute(
            'DELETE FROM sessions WHERE session_token = ?',
            [sessionToken]
        );
        
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
