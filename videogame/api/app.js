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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 