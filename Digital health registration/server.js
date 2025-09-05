const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
const db = new sqlite3.Database('./health_registration.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            city TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            blood_group TEXT NOT NULL,
            aadhar_number TEXT NOT NULL,
            fingerprint_scanned BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Users table ready.');
            }
        });
    }
});

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Registration endpoint
app.post('/register', (req, res) => {
    const { name, date_of_birth, city, email, blood_group, aadhar_number } = req.body;
    
    // Validate required fields
    if (!name || !date_of_birth || !city || !email || !blood_group || !aadhar_number) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });
    }
    
    // Check for duplicate email
    db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred.'
            });
        }
        
        if (row) {
            // Duplicate email found
            return res.status(409).json({
                success: false,
                message: 'Email already exists. Please use a different email address.'
            });
        }
        
        // Insert new user
        db.run(`INSERT INTO users (name, date_of_birth, city, email, blood_group, aadhar_number) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [name, date_of_birth, city, email, blood_group, aadhar_number],
                function(err) {
                    if (err) {
                        console.error('Insert error:', err.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to register user.'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Registration successful!',
                        userId: this.lastID
                    });
                });
    });
});

// Fingerprint scan endpoint
app.post('/fingerprint-scan', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required.'
        });
    }
    
    // Update fingerprint scanned status
    db.run('UPDATE users SET fingerprint_scanned = TRUE WHERE id = ?', [userId], function(err) {
        if (err) {
            console.error('Fingerprint update error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to update fingerprint status.'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        res.json({
            success: true,
            message: 'Fingerprint scan completed successfully!',
            healthStatus: 'Health scan complete. All parameters normal.'
        });
    });
});

// Get all users (for testing purposes)
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve users.'
            });
        }
        
        res.json({
            success: true,
            users: rows
        });
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Health Registration server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});