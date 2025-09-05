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
            health_id TEXT UNIQUE NOT NULL,
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
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready.');
                
                // Create health_profiles table for detailed health information
                db.run(`CREATE TABLE IF NOT EXISTS health_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    health_id TEXT NOT NULL,
                    chronic_diseases TEXT,
                    allergies TEXT,
                    emergency_contact TEXT,
                    current_medication TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (health_id) REFERENCES users (health_id)
                )`, (err) => {
                    if (err) {
                        console.error('Error creating health_profiles table:', err.message);
                    } else {
                        console.log('Health profiles table ready.');
                    }
                });
            }
        });
    }
});

// Utility function to generate Health ID
function generateHealthID() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    
    return `HLTH-${year}${month}${day}-${randomNum}`;
}

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate Health ID endpoint
app.post('/generate-health-id', (req, res) => {
    const { name, date_of_birth, city, email, blood_group, aadhar_number } = req.body;
    
    // Validate required fields
    if (!name || !date_of_birth || !city || !email || !blood_group || !aadhar_number) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required to generate Health ID.'
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
            return res.status(409).json({
                success: false,
                message: 'Email already exists. Please use a different email address.'
            });
        }
        
        // Generate unique Health ID
        let healthId = generateHealthID();
        
        // Check if Health ID already exists (very unlikely but safety check)
        db.get('SELECT health_id FROM users WHERE health_id = ?', [healthId], (err, existingId) => {
            if (err) {
                console.error('Health ID check error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate Health ID.'
                });
            }
            
            // Regenerate if exists (extremely rare)
            if (existingId) {
                healthId = generateHealthID();
            }
            
            res.json({
                success: true,
                message: 'Health ID generated successfully!',
                healthId: healthId,
                userData: { name, date_of_birth, city, email, blood_group, aadhar_number }
            });
        });
    });
});

// Complete registration with health profile
app.post('/complete-registration', (req, res) => {
    const { 
        health_id, name, date_of_birth, city, email, blood_group, aadhar_number,
        chronic_diseases, allergies, emergency_contact, current_medication 
    } = req.body;
    
    // Validate required fields
    if (!health_id || !name || !date_of_birth || !city || !email || !blood_group || !aadhar_number) {
        return res.status(400).json({
            success: false,
            message: 'All basic fields are required.'
        });
    }
    
    // Insert new user
    db.run(`INSERT INTO users (health_id, name, date_of_birth, city, email, blood_group, aadhar_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [health_id, name, date_of_birth, city, email, blood_group, aadhar_number],
            function(err) {
                if (err) {
                    console.error('User insert error:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to register user.'
                    });
                }
                
                // Insert health profile
                db.run(`INSERT INTO health_profiles (health_id, chronic_diseases, allergies, emergency_contact, current_medication) 
                        VALUES (?, ?, ?, ?, ?)`,
                        [health_id, chronic_diseases || '', allergies || '', emergency_contact || '', current_medication || ''],
                        function(profileErr) {
                            if (profileErr) {
                                console.error('Health profile insert error:', profileErr.message);
                                // Continue even if health profile fails - user is still registered
                            }
                            
                            res.json({
                                success: true,
                                message: 'Registration completed successfully!',
                                healthId: health_id,
                                userId: this.lastID
                            });
                        });
            });
});

// Fingerprint scan endpoint
app.post('/fingerprint-scan', (req, res) => {
    const { healthId } = req.body;
    
    if (!healthId) {
        return res.status(400).json({
            success: false,
            message: 'Health ID is required.'
        });
    }
    
    // Update fingerprint scanned status
    db.run('UPDATE users SET fingerprint_scanned = TRUE WHERE health_id = ?', [healthId], function(err) {
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
            healthStatus: 'Health scan complete. All parameters normal. Registration process finished.'
        });
    });
});

// Login with Health ID endpoint
app.post('/login', (req, res) => {
    const { healthId } = req.body;
    
    if (!healthId) {
        return res.status(400).json({
            success: false,
            message: 'Health ID is required.'
        });
    }
    
    // Get user data with health profile
    db.get(`SELECT u.*, hp.chronic_diseases, hp.allergies, hp.emergency_contact, hp.current_medication 
            FROM users u 
            LEFT JOIN health_profiles hp ON u.health_id = hp.health_id 
            WHERE u.health_id = ?`, [healthId], (err, user) => {
        if (err) {
            console.error('Login error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred.'
            });
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Health ID not found. Please check your ID and try again.'
            });
        }
        
        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                healthId: user.health_id,
                name: user.name,
                dateOfBirth: user.date_of_birth,
                city: user.city,
                email: user.email,
                bloodGroup: user.blood_group,
                aadharNumber: user.aadhar_number,
                fingerprintScanned: user.fingerprint_scanned,
                chronicDiseases: user.chronic_diseases,
                allergies: user.allergies,
                emergencyContact: user.emergency_contact,
                currentMedication: user.current_medication,
                createdAt: user.created_at
            }
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