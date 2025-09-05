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
                        
                        // Create ABY (Ayushman Bharat Yojana) table
                        db.run(`CREATE TABLE IF NOT EXISTS aby_benefits (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            health_id TEXT NOT NULL,
                            aby_beneficiary BOOLEAN DEFAULT FALSE,
                            aby_card_number TEXT,
                            family_head_name TEXT,
                            family_size INTEGER,
                            annual_income REAL,
                            coverage_amount REAL DEFAULT 500000,
                            used_amount REAL DEFAULT 0,
                            state TEXT,
                            district TEXT,
                            block TEXT,
                            village TEXT,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (health_id) REFERENCES users (health_id)
                        )`, (err) => {
                            if (err) {
                                console.error('Error creating ABY benefits table:', err.message);
                            } else {
                                console.log('ABY benefits table ready.');
                                
                                // Create family members table
                                db.run(`CREATE TABLE IF NOT EXISTS family_members (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    primary_health_id TEXT NOT NULL,
                                    member_name TEXT NOT NULL,
                                    relation TEXT NOT NULL,
                                    age INTEGER,
                                    gender TEXT,
                                    aadhar_number TEXT,
                                    member_health_id TEXT,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (primary_health_id) REFERENCES users (health_id)
                                )`, (err) => {
                                    if (err) {
                                        console.error('Error creating family members table:', err.message);
                                    } else {
                                        console.log('Family members table ready.');
                                        
                                        // Create empaneled hospitals table
                                        db.run(`CREATE TABLE IF NOT EXISTS empaneled_hospitals (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            hospital_name TEXT NOT NULL,
                                            hospital_code TEXT UNIQUE,
                                            address TEXT,
                                            city TEXT,
                                            state TEXT,
                                            pincode TEXT,
                                            phone TEXT,
                                            specialties TEXT,
                                            latitude REAL,
                                            longitude REAL,
                                            packages_available TEXT,
                                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                                        )`, (err) => {
                                            if (err) {
                                                console.error('Error creating hospitals table:', err.message);
                                            } else {
                                                console.log('Empaneled hospitals table ready.');
                                                
                                                // Create medical images table
                                                db.run(`CREATE TABLE IF NOT EXISTS medical_images (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    image_id TEXT UNIQUE NOT NULL,
                                                    health_id TEXT NOT NULL,
                                                    image_name TEXT NOT NULL,
                                                    image_size INTEGER NOT NULL,
                                                    image_type TEXT NOT NULL,
                                                    data_url TEXT NOT NULL,
                                                    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                    FOREIGN KEY (health_id) REFERENCES users (health_id)
                                                )`, (err) => {
                                                    if (err) {
                                                        console.error('Error creating medical images table:', err.message);
                                                    } else {
                                                        console.log('Medical images table ready.');
                                                        
                                                        // Create consultations table
                                                        db.run(`CREATE TABLE IF NOT EXISTS consultations (
                                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                            health_id TEXT NOT NULL,
                                                            patient_name TEXT NOT NULL,
                                                            subject TEXT NOT NULL,
                                                            description TEXT NOT NULL,
                                                            urgency TEXT NOT NULL,
                                                            preferred_language TEXT NOT NULL,
                                                            attached_images TEXT,
                                                            submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                            status TEXT DEFAULT 'pending',
                                                            doctor_response TEXT,
                                                            response_date DATETIME,
                                                            FOREIGN KEY (health_id) REFERENCES users (health_id)
                                                        )`, (err) => {
                                                            if (err) {
                                                                console.error('Error creating consultations table:', err.message);
                                                            } else {
                                                                console.log('Consultations table ready.');
                                                                insertSampleHospitals();
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
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

// Utility function to generate ABY Card Number
function generateABYCardNumber() {
    const randomNum = Math.floor(100000000000000 + Math.random() * 900000000000000); // 15-digit number
    return `ABY-${randomNum}`;
}

// Function to verify ABY eligibility (simulated)
function verifyABYEligibility(aadharNumber, annualIncome) {
    // Simulate ABY eligibility check
    // In real implementation, this would call NHA APIs
    const isEligible = annualIncome <= 500000; // Income threshold for ABY
    return {
        eligible: isEligible,
        reason: isEligible ? 'Eligible for ABY benefits' : 'Annual income exceeds ABY threshold'
    };
}

// Function to insert sample empaneled hospitals
function insertSampleHospitals() {
    const sampleHospitals = [
        {
            name: 'AIIMS Delhi',
            code: 'AIIMS-DEL-001',
            address: 'Ansari Nagar, New Delhi',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110029',
            phone: '011-26588500',
            specialties: 'Cardiology,Neurology,Oncology,Orthopedics,General Surgery',
            lat: 28.5672,
            lng: 77.2100
        },
        {
            name: 'Safdarjung Hospital',
            code: 'SFDJ-DEL-002',
            address: 'Safdarjung Enclave, New Delhi',
            city: 'New Delhi', 
            state: 'Delhi',
            pincode: '110029',
            phone: '011-26165060',
            specialties: 'General Medicine,Pediatrics,Gynecology,Emergency Care',
            lat: 28.5678,
            lng: 77.2089
        },
        {
            name: 'Government Medical College, Kerala',
            code: 'GMC-KER-003',
            address: 'Thiruvananthapuram, Kerala',
            city: 'Thiruvananthapuram',
            state: 'Kerala',
            pincode: '695011',
            phone: '0471-2528300',
            specialties: 'General Medicine,Surgery,Pediatrics,Cardiology',
            lat: 8.5241,
            lng: 76.9366
        }
    ];
    
    sampleHospitals.forEach(hospital => {
        db.run(`INSERT OR IGNORE INTO empaneled_hospitals 
                (hospital_name, hospital_code, address, city, state, pincode, phone, specialties, latitude, longitude, packages_available) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [hospital.name, hospital.code, hospital.address, hospital.city, hospital.state, 
                 hospital.pincode, hospital.phone, hospital.specialties, hospital.lat, hospital.lng, 
                 'General Surgery,Emergency Care,Maternity Care']);
    });
    
    console.log('Sample empaneled hospitals inserted.');
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

// ABY Verification endpoint
app.post('/verify-aby', (req, res) => {
    const { healthId, annualIncome, familySize, state, district } = req.body;
    
    if (!healthId || !annualIncome) {
        return res.status(400).json({
            success: false,
            message: 'Health ID and annual income are required for ABY verification.'
        });
    }
    
    // Verify ABY eligibility
    const eligibilityResult = verifyABYEligibility(null, annualIncome);
    
    if (eligibilityResult.eligible) {
        const abyCardNumber = generateABYCardNumber();
        
        // Insert ABY benefits record
        db.run(`INSERT OR REPLACE INTO aby_benefits 
                (health_id, aby_beneficiary, aby_card_number, family_size, annual_income, state, district) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [healthId, true, abyCardNumber, familySize || 4, annualIncome, state || '', district || ''],
                function(err) {
                    if (err) {
                        console.error('ABY insert error:', err.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to register for ABY benefits.'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'ABY verification successful! You are eligible for ₹5,00,000 coverage.',
                        abyData: {
                            eligible: true,
                            cardNumber: abyCardNumber,
                            coverageAmount: 500000,
                            familySize: familySize || 4,
                            remainingAmount: 500000
                        }
                    });
                });
    } else {
        res.json({
            success: false,
            message: eligibilityResult.reason,
            abyData: {
                eligible: false,
                reason: eligibilityResult.reason
            }
        });
    }
});

// Get ABY benefits and hospital finder
app.get('/aby-benefits/:healthId', (req, res) => {
    const { healthId } = req.params;
    
    // Get ABY benefits data
    db.get(`SELECT ab.*, u.name, u.city 
            FROM aby_benefits ab 
            JOIN users u ON ab.health_id = u.health_id 
            WHERE ab.health_id = ?`, [healthId], (err, abyData) => {
        if (err) {
            console.error('ABY benefits query error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve ABY benefits.'
            });
        }
        
        if (!abyData) {
            return res.status(404).json({
                success: false,
                message: 'No ABY benefits found. Please complete ABY verification first.'
            });
        }
        
        res.json({
            success: true,
            abyBenefits: {
                cardNumber: abyData.aby_card_number,
                beneficiaryName: abyData.name,
                familySize: abyData.family_size,
                coverageAmount: abyData.coverage_amount,
                usedAmount: abyData.used_amount,
                remainingAmount: abyData.coverage_amount - abyData.used_amount,
                city: abyData.city,
                state: abyData.state,
                district: abyData.district
            }
        });
    });
});

// Find empaneled hospitals
app.get('/empaneled-hospitals', (req, res) => {
    const { city, specialty, limit = 10 } = req.query;
    
    let query = 'SELECT * FROM empaneled_hospitals WHERE 1=1';
    const params = [];
    
    if (city) {
        query += ' AND city LIKE ?';
        params.push(`%${city}%`);
    }
    
    if (specialty) {
        query += ' AND specialties LIKE ?';
        params.push(`%${specialty}%`);
    }
    
    query += ' ORDER BY hospital_name LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(query, params, (err, hospitals) => {
        if (err) {
            console.error('Hospitals query error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve empaneled hospitals.'
            });
        }
        
        res.json({
            success: true,
            hospitals: hospitals.map(hospital => ({
                id: hospital.id,
                name: hospital.hospital_name,
                code: hospital.hospital_code,
                address: hospital.address,
                city: hospital.city,
                state: hospital.state,
                phone: hospital.phone,
                specialties: hospital.specialties.split(','),
                packagesAvailable: hospital.packages_available?.split(',') || []
            }))
        });
    });
});

// Add family member
app.post('/add-family-member', (req, res) => {
    const { primaryHealthId, memberName, relation, age, gender, aadharNumber } = req.body;
    
    if (!primaryHealthId || !memberName || !relation) {
        return res.status(400).json({
            success: false,
            message: 'Primary Health ID, member name, and relation are required.'
        });
    }
    
    // Generate Health ID for family member if Aadhar provided
    const memberHealthId = aadharNumber ? generateHealthID() : null;
    
    db.run(`INSERT INTO family_members 
            (primary_health_id, member_name, relation, age, gender, aadhar_number, member_health_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [primaryHealthId, memberName, relation, age || 0, gender || '', aadharNumber || '', memberHealthId],
            function(err) {
                if (err) {
                    console.error('Family member insert error:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to add family member.'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Family member added successfully!',
                    familyMember: {
                        id: this.lastID,
                        name: memberName,
                        relation: relation,
                        age: age,
                        healthId: memberHealthId
                    }
                });
            });
});

// Get family members
app.get('/family-members/:healthId', (req, res) => {
    const { healthId } = req.params;
    
    db.all('SELECT * FROM family_members WHERE primary_health_id = ? ORDER BY created_at', 
           [healthId], (err, members) => {
        if (err) {
            console.error('Family members query error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve family members.'
            });
        }
        
        res.json({
            success: true,
            familyMembers: members.map(member => ({
                id: member.id,
                name: member.member_name,
                relation: member.relation,
                age: member.age,
                gender: member.gender,
                healthId: member.member_health_id,
                aadharNumber: member.aadhar_number ? '****-****-' + member.aadhar_number.slice(-4) : null
            }))
        });
    });
});

// Enhanced login with ABY benefits
app.post('/login-with-aby', (req, res) => {
    const { healthId } = req.body;
    
    if (!healthId) {
        return res.status(400).json({
            success: false,
            message: 'Health ID is required.'
        });
    }
    
    // Get complete user data including ABY benefits
    db.get(`SELECT u.*, hp.chronic_diseases, hp.allergies, hp.emergency_contact, hp.current_medication,
                   ab.aby_beneficiary, ab.aby_card_number, ab.family_size, ab.coverage_amount, ab.used_amount,
                   ab.state, ab.district
            FROM users u 
            LEFT JOIN health_profiles hp ON u.health_id = hp.health_id 
            LEFT JOIN aby_benefits ab ON u.health_id = ab.health_id
            WHERE u.health_id = ?`, [healthId], (err, user) => {
        if (err) {
            console.error('Enhanced login error:', err.message);
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
        
        // Get family members
        db.all('SELECT * FROM family_members WHERE primary_health_id = ?', [healthId], (err, familyMembers) => {
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
                    aadharNumber: user.aadhar_number ? '****-****-' + user.aadhar_number.slice(-4) : null,
                    fingerprintScanned: user.fingerprint_scanned,
                    chronicDiseases: user.chronic_diseases,
                    allergies: user.allergies,
                    emergencyContact: user.emergency_contact,
                    currentMedication: user.current_medication,
                    createdAt: user.created_at,
                    abyBenefits: user.aby_beneficiary ? {
                        cardNumber: user.aby_card_number,
                        coverageAmount: user.coverage_amount,
                        usedAmount: user.used_amount,
                        remainingAmount: user.coverage_amount - user.used_amount,
                        familySize: user.family_size,
                        state: user.state,
                        district: user.district
                    } : null,
                    familyMembers: familyMembers || []
                }
            });
        });
    });
});

// Medical Image Upload endpoint
app.post('/upload-medical-image', (req, res) => {
    const { id, name, size, type, dataUrl, uploadDate, healthId } = req.body;
    
    if (!healthId || !id || !dataUrl) {
        return res.status(400).json({
            success: false,
            message: 'Missing required image data'
        });
    }
    
    // Insert image into database
    const stmt = db.prepare(`INSERT INTO medical_images 
        (image_id, health_id, image_name, image_size, image_type, data_url, upload_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run([id, healthId, name, size, type, dataUrl, uploadDate], function(err) {
        if (err) {
            console.error('Medical image upload error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to save medical image'
            });
        }
        
        res.json({
            success: true,
            message: 'Medical image uploaded successfully',
            imageId: id
        });
    });
});

// Get medical images for a user
app.get('/medical-images/:healthId', (req, res) => {
    const { healthId } = req.params;
    
    db.all('SELECT * FROM medical_images WHERE health_id = ? ORDER BY upload_date DESC', 
        [healthId], (err, images) => {
        if (err) {
            console.error('Get medical images error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve medical images'
            });
        }
        
        const formattedImages = images.map(img => ({
            id: img.image_id,
            name: img.image_name,
            size: img.image_size,
            type: img.image_type,
            dataUrl: img.data_url,
            uploadDate: img.upload_date,
            healthId: img.health_id
        }));
        
        res.json({
            success: true,
            images: formattedImages
        });
    });
});

// Delete medical image
app.post('/delete-medical-image', (req, res) => {
    const { imageId } = req.body;
    
    if (!imageId) {
        return res.status(400).json({
            success: false,
            message: 'Image ID is required'
        });
    }
    
    db.run('DELETE FROM medical_images WHERE image_id = ?', [imageId], function(err) {
        if (err) {
            console.error('Delete medical image error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete medical image'
            });
        }
        
        res.json({
            success: true,
            message: 'Medical image deleted successfully'
        });
    });
});

// Submit consultation request
app.post('/submit-consultation', (req, res) => {
    const { 
        healthId, 
        patientName, 
        consultationSubject: subject, 
        consultationDescription: description, 
        consultationUrgency: urgency, 
        preferredLanguage, 
        attachedImages, 
        submissionDate 
    } = req.body;
    
    if (!healthId || !subject || !description || !urgency) {
        return res.status(400).json({
            success: false,
            message: 'Missing required consultation data'
        });
    }
    
    const attachedImagesStr = attachedImages ? JSON.stringify(attachedImages) : null;
    
    const stmt = db.prepare(`INSERT INTO consultations 
        (health_id, patient_name, subject, description, urgency, preferred_language, attached_images, submission_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run([
        healthId, 
        patientName, 
        subject, 
        description, 
        urgency, 
        preferredLanguage, 
        attachedImagesStr, 
        submissionDate
    ], function(err) {
        if (err) {
            console.error('Submit consultation error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to submit consultation request'
            });
        }
        
        res.json({
            success: true,
            message: 'Consultation request submitted successfully',
            consultationId: this.lastID
        });
    });
});

// Get consultation history for a user
app.get('/consultation-history/:healthId', (req, res) => {
    const { healthId } = req.params;
    
    db.all('SELECT * FROM consultations WHERE health_id = ? ORDER BY submission_date DESC', 
        [healthId], (err, consultations) => {
        if (err) {
            console.error('Get consultation history error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve consultation history'
            });
        }
        
        const formattedConsultations = consultations.map(consultation => ({
            id: consultation.id,
            subject: consultation.subject,
            description: consultation.description,
            urgency: consultation.urgency,
            preferredLanguage: consultation.preferred_language,
            attachedImages: consultation.attached_images ? JSON.parse(consultation.attached_images) : [],
            submissionDate: consultation.submission_date,
            status: consultation.status,
            doctorResponse: consultation.doctor_response,
            responseDate: consultation.response_date
        }));
        
        res.json({
            success: true,
            consultations: formattedConsultations
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